import {enforceRateLimit,readJsonBody,secureHeaders} from './security.js';
import {authRateKey,clearSessionCookie,createPasswordRecord,createSession,normalizeEmail,revokeSession,validatePassword,verifyPassword} from './password-auth.js';
import {recordAccountEvent} from './account-events.js';

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
    const password=await createPasswordRecord(data.password);const id=crypto.randomUUID();
    try{
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO users(id,email,name,role,account_role,account_status,auth_provider,university_id,college_id,department_id,phase_id,section_id,password_hash,password_salt,password_iterations) VALUES(?,?,?,'student','student','pending','password',?,?,?,?,?,?,?,?)`).bind(id,email,name,path.universityId,path.collegeId,path.departmentId,path.phaseId,path.sectionId,password.hash,password.salt,password.iterations),
        env.DB.prepare(`INSERT INTO user_identities(provider,provider_user_id,user_id,email) VALUES('password',?,?,?)`).bind(email,id,email),
        env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('user',?,'register_password',?,?)`).bind(id,id,JSON.stringify({provider:'password'}))
      ]);
    }catch{return fail('EMAIL_EXISTS','البريد مستخدم بالفعل؛ سجّل الدخول أو استخدم بريدًا آخر',409)}
    await recordAccountEvent(env,request,{userId:id,accountCode:id,email,eventType:'register',details:{provider:'password'}});
    return json({pending:true,message:'تم إنشاء الحساب وهو بانتظار موافقة المشرف'},202);
  }

  if(url.pathname==='/api/auth/login'&&request.method==='POST'){
    const parsed=await value(request);if(parsed.response)return parsed.response;const data=parsed.data;const email=normalizeEmail(data?.email);const emailKey=await authRateKey(email);const ipKey=await authRateKey(request.headers.get('cf-connecting-ip')||'unknown');const [emailLimit,ipLimit]=await Promise.all([enforceRateLimit(env,`auth:login:email:${emailKey}`,8,900),enforceRateLimit(env,`auth:login:ip:${ipKey}`,30,900)]);
    if(!emailLimit.allowed||!ipLimit.allowed)return fail('RATE_LIMITED','محاولات دخول كثيرة؛ حاول لاحقًا',429,{'retry-after':String(Math.max(emailLimit.retryAfter,ipLimit.retryAfter))});
    const account=validEmail(email)?await env.DB.prepare(`SELECT id,email,name,account_role,password_hash,password_salt,password_iterations,account_status FROM users WHERE email=? AND auth_provider IN ('password','hybrid')`).bind(email).first():null;
    let valid=false;if(account?.password_hash)valid=await verifyPassword(String(data?.password||''),account);else await createPasswordRecord(String(data?.password||'invalid-password-0'));
    if(!valid){await recordAccountEvent(env,request,{userId:account?.id||null,accountCode:account?.id||null,email,eventType:'login_failure',outcome:'failure',details:{reason:'invalid_credentials'}});return fail('INVALID_CREDENTIALS','البريد أو كلمة المرور غير صحيحة',401)}if(account.account_status==='pending'){await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'login_failure',outcome:'failure',details:{reason:'pending'}});return fail('ACCOUNT_PENDING','الحساب بانتظار موافقة المشرف',403)}if(account.account_status==='suspended'){await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'login_failure',outcome:'failure',details:{reason:'suspended'}});return fail('ACCOUNT_SUSPENDED','الحساب موقوف؛ تواصل مع المشرف',403)}
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
