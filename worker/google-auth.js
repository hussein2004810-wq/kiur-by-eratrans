import {firebaseAuthConfigured,firebaseGoogleProfile} from './firebase-auth.js';
import {authRateKey,hashToken,normalizeEmail,createSession} from './password-auth.js';
import {secureHeaders,enforceRateLimit,readJsonBody} from './security.js';
import {recordAccountEvent} from './account-events.js';

const cookieName='__Host-kiur_google';
const cookie=value=>`${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${value?600:0}`;
const callbackPath='/api/auth/google/callback';
const startPath='/api/auth/google/start';
const completePath='/api/auth/google/complete';
function json(data,status=200,extraHeaders={}){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json','cache-control':'no-store',...extraHeaders})})}
function redirect(code,sessionCookie){const headers=secureHeaders({'location':code?`/?authMessage=${code}`:'/','cache-control':'no-store'});headers.set('referrer-policy','no-referrer');headers.append('set-cookie',cookie(''));if(sessionCookie)headers.append('set-cookie',sessionCookie);return new Response(null,{status:303,headers})}
function firebaseWebConfig(env){
  const apiKey=String(env.FIREBASE_WEB_API_KEY||'');const projectId=String(env.FIREBASE_AUTH_PROJECT_ID||'').toLowerCase();
  if(apiKey.length<20||apiKey.length>200||!RegExp('^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]$').test(projectId))return null;
  return {apiKey,projectId,authDomain:`${projectId}.firebaseapp.com`};
}
function clearFlow(response){response.headers.append('set-cookie',cookie(''));return response}

export async function handleGoogleAuth(request,env,url){
  if(!['/api/auth/google/config',startPath,completePath,callbackPath].includes(url.pathname))return null;
  if(url.pathname===callbackPath)return request.method==='GET'?redirect('google_retry'):json({error:{code:'METHOD_NOT_ALLOWED',message:'طريقة غير مسموحة'}},405);
  const config=firebaseWebConfig(env);
  if(url.pathname==='/api/auth/google/config'){
    if(request.method!=='GET')return json({error:{code:'METHOD_NOT_ALLOWED',message:'طريقة غير مسموحة'}},405);
    return firebaseAuthConfigured(env)&&config?json({config}):json({error:{code:'GOOGLE_NOT_CONFIGURED',message:'دخول Google غير مهيأ حاليًا'}},503);
  }
  if(request.method!=='POST')return json({error:{code:'METHOD_NOT_ALLOWED',message:'طريقة غير مسموحة'}},405);
  const start=url.pathname===startPath;
  const ip=await authRateKey(request.headers.get('cf-connecting-ip')||'unknown');
  const limit=await enforceRateLimit(env,`auth:google:${start?'start':'callback'}:${ip}`,20,900);
  if(!limit.allowed)return json({error:{code:'RATE_LIMITED',message:'محاولات كثيرة؛ حاول بعد قليل'}},429);
  if(!firebaseAuthConfigured(env)||!config)return json({error:{code:'GOOGLE_NOT_CONFIGURED',message:'دخول Google يحتاج إعداد مشروع Firebase المصرح'}},503);
  if(start){
    const parsed=await readJsonBody(request);if(parsed.error)return json({error:{code:parsed.error.code,message:parsed.error.message}},parsed.error.status);
    // No role or account identifier supplied by the browser is ever accepted.
    let academic=null;const p=parsed.value||{};
    for(const key of ['universityId','collegeId','departmentId','phaseId','sectionId'])if(p[key]!==undefined&&(typeof p[key]!=='string'||p[key].length>120))return json({error:{code:'VALIDATION',message:'المسار الأكاديمي غير صالح'}},400);
    if(p.universityId&&p.collegeId&&p.departmentId&&p.phaseId){academic=await env.DB.prepare(`SELECT u.id AS universityId,c.id AS collegeId,d.id AS departmentId,p.id AS phaseId FROM phases p JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id JOIN universities u ON u.id=c.university_id WHERE u.id=? AND c.id=? AND d.id=? AND p.id=?`).bind(p.universityId,p.collegeId,p.departmentId,p.phaseId).first();if(!academic)return json({error:{code:'VALIDATION',message:'المسار الأكاديمي غير صالح'}},400);if(p.sectionId){const section=await env.DB.prepare(`SELECT id FROM sections WHERE id=? AND phase_id=?`).bind(p.sectionId,p.phaseId).first();if(!section)return json({error:{code:'VALIDATION',message:'الشعبة غير صالحة'}},400);academic.sectionId=section.id}}
    try{
      const token=crypto.randomUUID()+crypto.randomUUID();
      await env.DB.prepare(`DELETE FROM google_auth_flows WHERE expires_at<=unixepoch('now')`).run();
      const nonce=crypto.randomUUID();
      await env.DB.prepare(`INSERT INTO google_auth_flows(token_hash,session_id,state_hash,origin,academic_json,expires_at) VALUES(?,?,?,?,?,unixepoch('now')+600)`).bind(await hashToken(token),'firebase-popup',await hashToken(nonce),url.origin,JSON.stringify(academic)).run();
      const response=json({ready:true});response.headers.append('set-cookie',cookie(token));return response;
    }catch{return json({error:{code:'GOOGLE_UNAVAILABLE',message:'تعذر تجهيز دخول Google؛ حاول مجددًا'}},503)}
  }
  const parsed=await readJsonBody(request);if(parsed.error)return clearFlow(json({error:{code:parsed.error.code,message:parsed.error.message}},parsed.error.status));
  const idToken=String(parsed.value?.idToken||'');
  const token=request.headers.get('cookie')?.split(';').map(item=>item.trim()).find(item=>item.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
  if(token.length!==72)return clearFlow(json({error:{code:'GOOGLE_EXPIRED',message:'انتهت محاولة دخول Google؛ أعد المحاولة'}},401));
  // Atomic consumption prevents replay and simultaneous callbacks using the same flow.
  const flow=await env.DB.prepare(`DELETE FROM google_auth_flows WHERE token_hash=? RETURNING *`).bind(await hashToken(token)).first();
  if(!flow||flow.expires_at<=Math.floor(Date.now()/1000)||flow.origin!==url.origin||flow.session_id!=='firebase-popup')return clearFlow(json({error:{code:'GOOGLE_EXPIRED',message:'انتهت محاولة دخول Google؛ أعد المحاولة'}},401));
  try{
    const profile=await firebaseGoogleProfile(env,idToken);const email=normalizeEmail(profile.email);
    const ownerEmails=new Set(String(env.OWNER_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean));
    const ownerUid=String(env.OWNER_FIREBASE_UID||'').trim();
    const isOwner=ownerEmails.has(email) && (!ownerUid || profile.uid === ownerUid);
    let account=await env.DB.prepare(`SELECT id,email,name,account_role,account_status FROM users WHERE firebase_uid=?`).bind(profile.uid).first();
    if(!account){
      // Email alone must never attach Google to an existing privileged account unless it's the declared owner.
      const existingUser=await env.DB.prepare(`SELECT id,account_role FROM users WHERE email=?`).bind(email).first();
      if(existingUser&&!isOwner)return clearFlow(json({error:{code:'GOOGLE_LINK_REQUIRED',message:'هذا البريد مرتبط بحساب موجود؛ ادخل بالطريقة السابقة أولًا'}},409));
      if(existingUser&&isOwner){
        await env.DB.batch([
          env.DB.prepare(`UPDATE users SET firebase_uid=?,email_verified_at=COALESCE(email_verified_at,CURRENT_TIMESTAMP),role='admin',account_role='owner',account_status='active',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(profile.uid,existingUser.id),
          env.DB.prepare(`INSERT OR REPLACE INTO user_identities(provider,provider_user_id,user_id,email) VALUES('password',?,?,?)`).bind(profile.uid,existingUser.id,email)
        ]);
        account={id:existingUser.id,email,name:profile.name,account_role:'owner',account_status:'active'};
      }else{
        const path=JSON.parse(flow.academic_json)||{};const id=crypto.randomUUID();
        const role=isOwner?'owner':'student';
        const legacyRole=isOwner?'admin':'student';
        await env.DB.batch([
          env.DB.prepare(`INSERT INTO users(id,email,name,role,account_role,account_status,auth_provider,firebase_uid,email_verified_at,university_id,college_id,department_id,phase_id,section_id) VALUES(?,?,?,?,?,'active','password',?,CURRENT_TIMESTAMP,?,?,?,?,?)`).bind(id,email,profile.name,legacyRole,role,profile.uid,path.universityId||null,path.collegeId||null,path.departmentId||null,path.phaseId||null,path.sectionId||null),
          // Legacy schema names Firebase identities "password"; the immutable Firebase UID is the key.
          env.DB.prepare(`INSERT INTO user_identities(provider,provider_user_id,user_id,email) VALUES('password',?,?,?)`).bind(profile.uid,id,email)
        ]);
        await recordAccountEvent(env,request,{userId:id,accountCode:id,email,eventType:'register',details:{provider:'google',autoActivated:true,role}});
        const session=await createSession(env,id,request);await env.DB.prepare(`UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?`).bind(id).run();
        const response=json({authenticated:true,user:{id,email,name:profile.name,role},profileRequired:!isOwner&&!path.universityId});response.headers.append('set-cookie',cookie(''));response.headers.append('set-cookie',session.cookie);return response;
      }
    }
    if(isOwner&&account.account_role!=='owner'){
      await env.DB.prepare(`UPDATE users SET account_role='owner',role='admin',account_status='active',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(account.id).run();
      account.account_role='owner';
    }
    if(account.account_status==='pending'&&account.account_role==='student'){await env.DB.prepare(`UPDATE users SET account_status='active',updated_at=CURRENT_TIMESTAMP WHERE id=? AND account_status='pending'`).bind(account.id).run();account.account_status='active';await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'account_status',details:{status:'active',reason:'student_auto_activation'}})}
    if(account.account_status!=='active'){await recordAccountEvent(env,request,{userId:account.id,email,eventType:'login_failure',outcome:'failure',details:{provider:'google',reason:account.account_status}});return clearFlow(json({error:{code:account.account_status==='pending'?'ACCOUNT_PENDING':'ACCOUNT_SUSPENDED',message:account.account_status==='pending'?'الحساب بانتظار تفعيل الإدارة':'الحساب موقوف؛ تواصل مع المشرف'}},403))}
    const session=await createSession(env,account.id,request);
    await env.DB.prepare(`UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?`).bind(account.id).run();
    await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email:account.email,eventType:'login_success',details:{provider:'google',role:account.account_role}});
    const response=json({authenticated:true,user:{id:account.id,email:account.email,name:account.name,role:account.account_role}});response.headers.append('set-cookie',cookie(''));response.headers.append('set-cookie',session.cookie);return response;
  }catch{return clearFlow(json({error:{code:'GOOGLE_IDENTITY_INVALID',message:'تعذر التحقق من هوية Google؛ أعد المحاولة'}},401))}
}
