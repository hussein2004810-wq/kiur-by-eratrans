import {firebaseAuthConfigured,firebaseGoogleStart,firebaseGoogleComplete} from './firebase-auth.js';
import {authRateKey,hashToken,normalizeEmail,createSession} from './password-auth.js';
import {secureHeaders,enforceRateLimit,readJsonBody} from './security.js';
import {recordAccountEvent} from './account-events.js';

const cookieName='__Host-kiur_google';
const cookie=value=>`${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${value?600:0}`;
const callbackPath='/api/auth/google/callback';
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json','cache-control':'no-store'})})}
function redirect(code,sessionCookie){const headers=secureHeaders({'location':code?`/?authMessage=${code}`:'/','cache-control':'no-store'});headers.set('referrer-policy','no-referrer');headers.append('set-cookie',cookie(''));if(sessionCookie)headers.append('set-cookie',sessionCookie);return new Response(null,{status:303,headers})}

export async function handleGoogleAuth(request,env,url){
  if(!['/api/auth/google/start',callbackPath].includes(url.pathname))return null;
  const start=url.pathname.endsWith('/start');
  if(request.method!==(start?'POST':'GET'))return json({error:{code:'METHOD_NOT_ALLOWED',message:'طريقة غير مسموحة'}},405);
  const ip=await authRateKey(request.headers.get('cf-connecting-ip')||'unknown');
  const limit=await enforceRateLimit(env,`auth:google:${start?'start':'callback'}:${ip}`,20,900);
  if(!limit.allowed)return start?json({error:{code:'RATE_LIMITED',message:'محاولات كثيرة؛ حاول بعد قليل'}},429):redirect('google_retry');
  if(!firebaseAuthConfigured(env))return start?json({error:{code:'GOOGLE_NOT_CONFIGURED',message:'دخول Google يحتاج إكمال إعداد مزود Google في Firebase'}},503):redirect('google_unavailable');
  if(start){
    const parsed=await readJsonBody(request);if(parsed.error)return json({error:{code:parsed.error.code,message:parsed.error.message}},parsed.error.status);
    // No role or account identifier supplied by the browser is ever accepted.
    let academic=null;const p=parsed.value||{};
    for(const key of ['universityId','collegeId','departmentId','phaseId'])if(p[key]!==undefined&&(typeof p[key]!=='string'||p[key].length>120))return json({error:{code:'VALIDATION',message:'المسار الأكاديمي غير صالح'}},400);
    if(p.universityId&&p.collegeId&&p.departmentId&&p.phaseId){academic=await env.DB.prepare(`SELECT u.id AS universityId,c.id AS collegeId,d.id AS departmentId,p.id AS phaseId FROM phases p JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id JOIN universities u ON u.id=c.university_id WHERE u.id=? AND c.id=? AND d.id=? AND p.id=?`).bind(p.universityId,p.collegeId,p.departmentId,p.phaseId).first();if(!academic)return json({error:{code:'VALIDATION',message:'المسار الأكاديمي غير صالح'}},400)}
    try{
      const result=await firebaseGoogleStart(env,url.origin+callbackPath);const authUrl=new URL(result.authUri);
      if(authUrl.origin!=='https://accounts.google.com'||!result.sessionId||!authUrl.searchParams.get('state'))throw new Error('INVALID_AUTH_URI');
      const token=crypto.randomUUID()+crypto.randomUUID();
      await env.DB.prepare(`DELETE FROM google_auth_flows WHERE expires_at<=unixepoch('now')`).run();
      await env.DB.prepare(`INSERT INTO google_auth_flows(token_hash,session_id,state_hash,origin,academic_json,expires_at) VALUES(?,?,?,?,?,unixepoch('now')+600)`).bind(await hashToken(token),result.sessionId,await hashToken(authUrl.searchParams.get('state')),url.origin,JSON.stringify(academic)).run();
      const response=json({url:authUrl.href});response.headers.append('set-cookie',cookie(token));return response;
    }catch{return json({error:{code:'GOOGLE_UNAVAILABLE',message:'تعذر بدء دخول Google. تحقق من تفعيل Google والنطاق وعنوان إعادة التوجيه في Firebase'}},503)}
  }
  const token=request.headers.get('cookie')?.split(';').map(item=>item.trim()).find(item=>item.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
  if(token.length!==72)return redirect('google_expired');
  // Atomic consumption prevents replay and simultaneous callbacks using the same flow.
  const flow=await env.DB.prepare(`DELETE FROM google_auth_flows WHERE token_hash=? RETURNING *`).bind(await hashToken(token)).first();
  if(!flow||flow.expires_at<=Math.floor(Date.now()/1000)||flow.origin!==url.origin||flow.state_hash!==await hashToken(url.searchParams.get('state')||''))return redirect('google_expired');
  if(url.searchParams.has('error'))return redirect('google_cancelled');
  try{
    const profile=await firebaseGoogleComplete(env,url.href,flow.session_id);const email=normalizeEmail(profile.email);
    let account=await env.DB.prepare(`SELECT id,email,name,account_role,account_status FROM users WHERE firebase_uid=?`).bind(profile.uid).first();
    if(!account){
      // Email alone must never attach Google to an existing privileged account.
      if(await env.DB.prepare(`SELECT id FROM users WHERE email=?`).bind(email).first())return redirect('google_link_required');
      const path=JSON.parse(flow.academic_json)||{};const id=crypto.randomUUID();
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO users(id,email,name,role,account_role,account_status,auth_provider,firebase_uid,email_verified_at,university_id,college_id,department_id,phase_id) VALUES(?,?,?,'student','student','pending','password',?,CURRENT_TIMESTAMP,?,?,?,?)`).bind(id,email,profile.name,profile.uid,path.universityId||null,path.collegeId||null,path.departmentId||null,path.phaseId||null),
        // Legacy schema names Firebase identities "password"; the immutable Firebase UID is the key.
        env.DB.prepare(`INSERT INTO user_identities(provider,provider_user_id,user_id,email) VALUES('password',?,?,?)`).bind(profile.uid,id,email)
      ]);
      await recordAccountEvent(env,request,{userId:id,accountCode:id,email,eventType:'register',details:{provider:'google'}});
      return redirect('google_pending');
    }
    if(account.account_status!=='active'){await recordAccountEvent(env,request,{userId:account.id,email,eventType:'login_failure',outcome:'failure',details:{provider:'google',reason:account.account_status}});return redirect(account.account_status==='pending'?'google_pending':'google_suspended')}
    const session=await createSession(env,account.id,request);
    await env.DB.prepare(`UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?`).bind(account.id).run();
    await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email:account.email,eventType:'login_success',details:{provider:'google'}});
    return redirect(null,session.cookie);
  }catch{return redirect('google_retry')}
}
