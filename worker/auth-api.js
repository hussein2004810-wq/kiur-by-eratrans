import {enforceRateLimit,readJsonBody,secureHeaders} from './security.js';
import {authRateKey,clearSessionCookie,createPasswordRecord,createSession,hashToken,newOneTimeToken,normalizeEmail,revokeSession,revokeUserSessions,validatePassword,verifyPassword} from './password-auth.js';
import {recordAccountEvent} from './account-events.js';
import {absoluteActionUrl,deliverSecurityEmail,emailDeliveryConfigured} from './email-delivery.js';

function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers})})}
function fail(code,message,status=400,headers={}){return json({error:{code,message}},status,headers)}
async function value(request){const parsed=await readJsonBody(request);return parsed.error?{response:fail(parsed.error.code,parsed.error.message,parsed.error.status)}:{data:parsed.value}}
function validEmail(email){return email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}

async function validStudentPath(env,data){
  if(!data?.universityId||!data?.collegeId||!data?.departmentId||!data?.phaseId)return null;
  const sectionClause=data.sectionId?`JOIN sections x ON x.id=? AND x.phase_id=p.id`:``;
  const sql=`SELECT u.id AS universityId,c.id AS collegeId,d.id AS departmentId,p.id AS phaseId${data.sectionId?',x.id AS sectionId':`,NULL AS sectionId`} FROM phases p JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id JOIN universities u ON u.id=c.university_id ${sectionClause} WHERE u.id=? AND c.id=? AND d.id=? AND p.id=?`;
  const statement=env.DB.prepare(sql);const binds=data.sectionId?[data.sectionId,data.universityId,data.collegeId,data.departmentId,data.phaseId]:[data.universityId,data.collegeId,data.departmentId,data.phaseId];return statement.bind(...binds).first();
}

export async function handleAuthApi(request,env,url,user){
  if(url.pathname==='/api/auth/register'&&request.method==='POST'){
    const parsed=await value(request);if(parsed.response)return parsed.response;const data=parsed.data;const email=normalizeEmail(data?.email);const name=String(data?.name||'').trim();
    const emailKey=await authRateKey(email);const ipKey=await authRateKey(request.headers.get('cf-connecting-ip')||'unknown');const [emailLimit,ipLimit]=await Promise.all([enforceRateLimit(env,`auth:register:email:${emailKey}`,3,3600),enforceRateLimit(env,`auth:register:ip:${ipKey}`,10,3600)]);
    if(!emailLimit.allowed||!ipLimit.allowed)return fail('RATE_LIMITED','طلبات تسجيل كثيرة؛ حاول لاحقًا',429,{'retry-after':String(Math.max(emailLimit.retryAfter,ipLimit.retryAfter))});
    if(name.length<2||name.length>120)return fail('VALIDATION','الاسم يجب أن يكون بين حرفين و120 حرفًا');if(!validEmail(email))return fail('VALIDATION','البريد الإلكتروني غير صالح');const passwordIssue=validatePassword(data?.password);if(passwordIssue)return fail('VALIDATION',passwordIssue);
    const path=await validStudentPath(env,data);if(!path)return fail('VALIDATION','الجامعة أو الكلية أو القسم أو المرحلة أو الشعبة غير صالحة');
    if(!emailDeliveryConfigured(env))return fail('EMAIL_VERIFICATION_UNAVAILABLE','التسجيل بالبريد متوقف مؤقتًا حتى تهيئة خدمة التحقق؛ استخدم تسجيل ChatGPT',503);
    let password;try{password=await createPasswordRecord(data.password,env)}catch{return fail('PASSWORD_SECURITY_UNAVAILABLE','إعداد حماية كلمات المرور غير مكتمل',503)}
    const id=crypto.randomUUID(),token=newOneTimeToken(),tokenHash=await hashToken(token),expiresAt=new Date(Date.now()+30*60*1000).toISOString();
    try{
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO users(id,email,name,role,account_role,account_status,auth_provider,university_id,college_id,department_id,phase_id,section_id,password_hash,password_salt,password_iterations,password_peppered) VALUES(?,?,?,'student','student','pending','password',?,?,?,?,?,?,?,?,?)`).bind(id,email,name,path.universityId,path.collegeId,path.departmentId,path.phaseId,path.sectionId,password.hash,password.salt,password.iterations,password.peppered),
        env.DB.prepare(`INSERT INTO user_identities(provider,provider_user_id,user_id,email) VALUES('password',?,?,?)`).bind(email,id,email),
        env.DB.prepare(`INSERT INTO email_verifications(user_id,token_hash,expires_at) VALUES(?,?,?)`).bind(id,tokenHash,expiresAt),
        env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('user',?,'register_password',?,?)`).bind(id,id,JSON.stringify({provider:'password'}))
      ]);
    }catch{return fail('EMAIL_EXISTS','البريد مستخدم بالفعل؛ سجّل الدخول أو استخدم بريدًا آخر',409)}
    try{await deliverSecurityEmail(env,{kind:'verify_email',to:email,name,actionUrl:absoluteActionUrl(request,'/api/auth/verify-email',token),expiresInMinutes:30})}catch{
      await env.DB.batch([env.DB.prepare(`DELETE FROM email_verifications WHERE user_id=?`).bind(id),env.DB.prepare(`DELETE FROM user_identities WHERE user_id=?`).bind(id),env.DB.prepare(`DELETE FROM users WHERE id=?`).bind(id)]);
      return fail('EMAIL_DELIVERY_FAILED','تعذر إرسال رسالة التحقق؛ لم يتم حفظ الحساب، حاول لاحقًا',503);
    }
    await recordAccountEvent(env,request,{userId:id,accountCode:id,email,eventType:'register',details:{provider:'password'}});
    return json({pending:true,message:'أرسلنا رابط تحقق إلى بريدك. بعد التحقق سيصبح الحساب بانتظار موافقة المشرف'},202);
  }

  if(url.pathname==='/api/auth/verify-email'&&request.method==='GET'){
    const token=String(url.searchParams.get('token')||'');if(token.length<32||token.length>200)return fail('INVALID_TOKEN','رابط التحقق غير صالح',400);
    const tokenHash=await hashToken(token);const verification=await env.DB.prepare(`SELECT e.user_id AS userId,u.email FROM email_verifications e JOIN users u ON u.id=e.user_id WHERE e.token_hash=? AND e.verified_at IS NULL AND unixepoch(e.expires_at)>unixepoch('now')`).bind(tokenHash).first();
    if(!verification)return fail('TOKEN_EXPIRED','رابط التحقق غير صالح أو منتهي',410);
    await env.DB.batch([env.DB.prepare(`UPDATE email_verifications SET verified_at=CURRENT_TIMESTAMP,token_hash=? WHERE user_id=? AND verified_at IS NULL`).bind(`used:${crypto.randomUUID()}`,verification.userId),env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('user',?,'verify_email',?,?)`).bind(verification.userId,verification.userId,JSON.stringify({provider:'password'}))]);
    return json({verified:true,message:'تم توثيق البريد بنجاح. الحساب الآن بانتظار موافقة المشرف'});
  }

  if(url.pathname==='/api/auth/activate-staff'&&request.method==='POST'){
    const parsed=await value(request);if(parsed.response)return parsed.response;const token=String(parsed.data?.token||'');const passwordIssue=validatePassword(parsed.data?.password);if(passwordIssue)return fail('VALIDATION',passwordIssue);
    const tokenHash=await hashToken(token);const invite=await env.DB.prepare(`SELECT i.user_id AS userId,u.email,u.name FROM staff_invites i JOIN users u ON u.id=i.user_id WHERE i.token_hash=? AND i.accepted_at IS NULL AND unixepoch(i.expires_at)>unixepoch('now')`).bind(tokenHash).first();if(!invite)return fail('TOKEN_EXPIRED','دعوة التفعيل غير صالحة أو منتهية',410);
    let password;try{password=await createPasswordRecord(parsed.data.password,env)}catch{return fail('PASSWORD_SECURITY_UNAVAILABLE','إعداد حماية كلمات المرور غير مكتمل',503)}
    await env.DB.batch([env.DB.prepare(`UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,password_peppered=1,auth_provider=CASE WHEN auth_provider='chatgpt' THEN 'hybrid' ELSE 'password' END,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(password.hash,password.salt,password.iterations,invite.userId),env.DB.prepare(`INSERT OR IGNORE INTO user_identities(provider,provider_user_id,user_id,email) VALUES('password',?,?,?)`).bind(invite.email,invite.userId,invite.email),env.DB.prepare(`UPDATE staff_invites SET accepted_at=CURRENT_TIMESTAMP,token_hash=? WHERE user_id=?`).bind(`used:${crypto.randomUUID()}`,invite.userId)]);
    await revokeUserSessions(env,invite.userId);return json({activated:true,message:'تم تعيين كلمة المرور ويمكنك تسجيل الدخول الآن'});
  }

  if(url.pathname==='/api/auth/login'&&request.method==='POST'){
    const parsed=await value(request);if(parsed.response)return parsed.response;const data=parsed.data;const email=normalizeEmail(data?.email);const emailKey=await authRateKey(email);const ipKey=await authRateKey(request.headers.get('cf-connecting-ip')||'unknown');const [emailLimit,ipLimit]=await Promise.all([enforceRateLimit(env,`auth:login:email:${emailKey}`,8,900),enforceRateLimit(env,`auth:login:ip:${ipKey}`,30,900)]);
    if(!emailLimit.allowed||!ipLimit.allowed)return fail('RATE_LIMITED','محاولات دخول كثيرة؛ حاول لاحقًا',429,{'retry-after':String(Math.max(emailLimit.retryAfter,ipLimit.retryAfter))});
    const account=validEmail(email)?await env.DB.prepare(`SELECT u.id,u.email,u.name,u.account_role,u.password_hash,u.password_salt,u.password_iterations,u.password_peppered,u.account_status,e.verified_at AS emailVerifiedAt FROM users u LEFT JOIN email_verifications e ON e.user_id=u.id WHERE u.email=? AND u.auth_provider IN ('password','hybrid')`).bind(email).first():null;
    let valid=false;if(account?.password_hash)valid=await verifyPassword(String(data?.password||''),account,env);else await createPasswordRecord(String(data?.password||'invalid-password-0'),env).catch(()=>null);
    if(!valid){await recordAccountEvent(env,request,{userId:account?.id||null,accountCode:account?.id||null,email,eventType:'login_failure',outcome:'failure',details:{reason:'invalid_credentials'}});return fail('INVALID_CREDENTIALS','البريد أو كلمة المرور غير صحيحة',401)}if(account.account_status==='pending'){await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'login_failure',outcome:'failure',details:{reason:'pending'}});return fail('ACCOUNT_PENDING','الحساب بانتظار موافقة المشرف',403)}if(account.account_status==='suspended'){await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'login_failure',outcome:'failure',details:{reason:'suspended'}});return fail('ACCOUNT_SUSPENDED','الحساب موقوف؛ تواصل مع المشرف',403)}
    if(!account.emailVerifiedAt&&account.account_role==='student')return fail('EMAIL_UNVERIFIED','يجب توثيق البريد الإلكتروني أولًا',403);
    if(Number(account.password_peppered)!==1&&env.PASSWORD_PEPPER){const upgraded=await createPasswordRecord(String(data.password),env);await env.DB.prepare(`UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,password_peppered=1,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(upgraded.hash,upgraded.salt,upgraded.iterations,account.id).run()}
    const session=await createSession(env,account.id,request);await env.DB.prepare(`UPDATE users SET last_login_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(account.id).run();
    await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'login_success'});
    return json({user:{id:account.id,email:account.email,name:account.name,role:account.account_role}},200,{'set-cookie':session.cookie});
  }

  if(url.pathname==='/api/auth/logout'&&request.method==='POST'){
    if(user)await recordAccountEvent(env,request,{userId:user.id,accountCode:user.id,email:user.email,eventType:'logout'});await revokeSession(env,request);return json({signedOut:true},200,{'set-cookie':clearSessionCookie()});
  }

  if(url.pathname==='/api/auth/session'&&request.method==='GET')return user?json({user}):fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401);
  return null;
}
