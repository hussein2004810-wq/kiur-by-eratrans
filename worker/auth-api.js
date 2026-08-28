import {enforceRateLimit,readJsonBody,secureHeaders} from './security.js';
import {authRateKey,clearSessionCookie,createSession,hashToken,normalizeEmail,revokeSession,revokeUserSessions,validatePassword,verifyPassword} from './password-auth.js';
import {recordAccountEvent} from './account-events.js';
import {firebaseAuthConfigured,firebaseDeleteAccount,firebaseLookup,firebaseSendPasswordReset,firebaseSendVerification,firebaseSignIn,firebaseSignUp,firebaseTemporaryPassword,isFirebaseError} from './firebase-auth.js';

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

async function loadPasswordAccount(env,email){
  if(!validEmail(email))return null;
  return env.DB.prepare(`SELECT u.id,u.email,u.name,u.account_role,u.account_status,u.auth_provider,u.password_hash,u.password_salt,u.password_iterations,u.password_peppered,u.firebase_uid AS firebaseUid,u.email_verified_at AS emailVerifiedAt,e.verified_at AS legacyEmailVerifiedAt,i.accepted_at AS inviteAcceptedAt,CASE WHEN i.user_id IS NULL THEN 0 ELSE 1 END AS hasStaffInvite FROM users u LEFT JOIN email_verifications e ON e.user_id=u.id LEFT JOIN staff_invites i ON i.user_id=u.id WHERE u.email=? AND u.auth_provider IN ('password','hybrid')`).bind(email).first();
}

function invalidFirebaseCredentials(error){return ['INVALID_PASSWORD','EMAIL_NOT_FOUND','INVALID_LOGIN_CREDENTIALS','USER_NOT_FOUND'].some(code=>isFirebaseError(error,code))}

async function saveFirebaseLink(env,account,auth,emailVerified){
  await env.DB.batch([
    env.DB.prepare(`UPDATE users SET firebase_uid=?,email_verified_at=CASE WHEN ?=1 THEN COALESCE(email_verified_at,CURRENT_TIMESTAMP) ELSE email_verified_at END,password_hash=NULL,password_salt=NULL,password_iterations=NULL,password_peppered=0,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(auth.uid,emailVerified?1:0,account.id),
    env.DB.prepare(`INSERT OR REPLACE INTO user_identities(provider,provider_user_id,user_id,email) VALUES('password',?,?,?)`).bind(auth.uid,account.id,account.email)
  ]);
}

async function authenticateWithFirebase(env,account,password){
  const locallyVerified=Boolean(account.emailVerifiedAt||account.legacyEmailVerifiedAt||account.inviteAcceptedAt);
  if(account.firebaseUid){
    if(!firebaseAuthConfigured(env))return {error:fail('FIREBASE_AUTH_UNAVAILABLE','تسجيل البريد متوقف مؤقتًا حتى اكتمال إعداد Firebase',503)};
    let auth,profile;try{auth=await firebaseSignIn(env,account.email,password);if(auth.uid!==account.firebaseUid)throw new Error('FIREBASE_ID_MISMATCH');profile=await firebaseLookup(env,auth.idToken)}catch(error){if(isFirebaseError(error,'USER_DISABLED'))return {error:fail('ACCOUNT_SUSPENDED','الحساب موقوف؛ تواصل مع المشرف',403)};if(invalidFirebaseCredentials(error))return {invalid:true};return {error:fail('FIREBASE_AUTH_UNAVAILABLE','تعذر الاتصال بخدمة تسجيل الدخول؛ حاول لاحقًا',503)}}
    if(profile.disabled)return {error:fail('ACCOUNT_SUSPENDED','الحساب موقوف؛ تواصل مع المشرف',403)};
    const inviteProvesOwnership=account.account_role!=='student'&&Boolean(account.hasStaffInvite)&&!account.inviteAcceptedAt;
    const verified=profile.emailVerified||locallyVerified||inviteProvesOwnership;
    if(profile.emailVerified||inviteProvesOwnership)await env.DB.batch([
      env.DB.prepare(`UPDATE users SET email_verified_at=COALESCE(email_verified_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(account.id),
      env.DB.prepare(`UPDATE staff_invites SET accepted_at=COALESCE(accepted_at,CURRENT_TIMESTAMP) WHERE user_id=?`).bind(account.id)
    ]);
    return {auth,profile,emailVerified:verified,provider:'firebase'};
  }

  let legacyValid=false;if(account.password_hash)legacyValid=await verifyPassword(password,account,env);
  if(!firebaseAuthConfigured(env))return legacyValid?{emailVerified:locallyVerified,provider:'password_legacy'}:{invalid:true};
  let auth,created=false,authenticatedByReset=false;
  if(legacyValid){
    try{auth=await firebaseSignUp(env,account.email,password);created=true}catch(error){
      if(!isFirebaseError(error,'EMAIL_EXISTS'))return {error:fail('FIREBASE_AUTH_UNAVAILABLE','تعذر نقل الحساب إلى Firebase؛ حاول لاحقًا',503)};
      try{auth=await firebaseSignIn(env,account.email,password)}catch(signInError){if(isFirebaseError(signInError,'USER_DISABLED'))return {error:fail('ACCOUNT_SUSPENDED','الحساب موقوف؛ تواصل مع المشرف',403)};if(invalidFirebaseCredentials(signInError))return {error:fail('FIREBASE_ACCOUNT_LINK_REQUIRED','يوجد حساب Google لهذا البريد بكلمة مرور مختلفة. استخدم استعادة كلمة المرور',409)};return {error:fail('FIREBASE_AUTH_UNAVAILABLE','تعذر الاتصال بخدمة تسجيل الدخول؛ حاول لاحقًا',503)}}
    }
  }else{
    try{auth=await firebaseSignIn(env,account.email,password);authenticatedByReset=true}catch(error){if(isFirebaseError(error,'USER_DISABLED'))return {error:fail('ACCOUNT_SUSPENDED','الحساب موقوف؛ تواصل مع المشرف',403)};if(invalidFirebaseCredentials(error))return {invalid:true};return {error:fail('FIREBASE_AUTH_UNAVAILABLE','تعذر الاتصال بخدمة تسجيل الدخول؛ حاول لاحقًا',503)}}
  }
  let profile;try{profile=await firebaseLookup(env,auth.idToken)}catch{return {error:fail('FIREBASE_AUTH_UNAVAILABLE','تعذر التحقق من الحساب؛ حاول لاحقًا',503)}}
  const inviteProvesOwnership=account.account_role!=='student'&&Boolean(account.hasStaffInvite);const verified=profile.emailVerified||locallyVerified||authenticatedByReset||inviteProvesOwnership;
  try{await saveFirebaseLink(env,account,auth,verified);if(inviteProvesOwnership)await env.DB.prepare(`UPDATE staff_invites SET accepted_at=COALESCE(accepted_at,CURRENT_TIMESTAMP) WHERE user_id=?`).bind(account.id).run()}catch(error){if(created)await firebaseDeleteAccount(env,auth.idToken);throw error}
  if(!verified)try{await firebaseSendVerification(env,auth.idToken)}catch{return {error:fail('EMAIL_DELIVERY_FAILED','تعذر إرسال رسالة التحقق من Google؛ حاول لاحقًا',503)}}
  return {auth,profile,emailVerified:verified,provider:'firebase',migrated:true};
}

export async function handleAuthApi(request,env,url,user){
  if(url.pathname==='/api/auth/register'&&request.method==='POST'){
    const parsed=await value(request);if(parsed.response)return parsed.response;const data=parsed.data;const email=normalizeEmail(data?.email);const name=String(data?.name||'').trim();
    const emailKey=await authRateKey(email);const ipKey=await authRateKey(request.headers.get('cf-connecting-ip')||'unknown');const [emailLimit,ipLimit]=await Promise.all([enforceRateLimit(env,`auth:register:email:${emailKey}`,3,3600),enforceRateLimit(env,`auth:register:ip:${ipKey}`,10,3600)]);
    if(!emailLimit.allowed||!ipLimit.allowed)return fail('RATE_LIMITED','طلبات تسجيل كثيرة؛ حاول لاحقًا',429,{'retry-after':String(Math.max(emailLimit.retryAfter,ipLimit.retryAfter))});
    if(name.length<2||name.length>120)return fail('VALIDATION','الاسم يجب أن يكون بين حرفين و120 حرفًا');if(!validEmail(email))return fail('VALIDATION','البريد الإلكتروني غير صالح');const passwordIssue=validatePassword(data?.password);if(passwordIssue)return fail('VALIDATION',passwordIssue);
    const path=await validStudentPath(env,data);if(!path)return fail('VALIDATION','الجامعة أو الكلية أو القسم أو المرحلة أو الشعبة غير صالحة');if(!firebaseAuthConfigured(env))return fail('FIREBASE_AUTH_UNAVAILABLE','التسجيل بالبريد متوقف مؤقتًا حتى تهيئة Firebase؛ استخدم تسجيل ChatGPT',503);
    let auth;try{auth=await firebaseSignUp(env,email,data.password)}catch(error){if(isFirebaseError(error,'EMAIL_EXISTS'))return fail('EMAIL_EXISTS','البريد مستخدم بالفعل؛ سجّل الدخول أو استخدم استعادة كلمة المرور',409);return fail('FIREBASE_AUTH_UNAVAILABLE','تعذر إنشاء الحساب لدى Google؛ حاول لاحقًا',503)}
    const id=crypto.randomUUID();
    try{await env.DB.batch([
      env.DB.prepare(`INSERT INTO users(id,email,name,role,account_role,account_status,auth_provider,university_id,college_id,department_id,phase_id,section_id,firebase_uid) VALUES(?,?,?,'student','student','pending','password',?,?,?,?,?,?)`).bind(id,email,name,path.universityId,path.collegeId,path.departmentId,path.phaseId,path.sectionId,auth.uid),
      env.DB.prepare(`INSERT INTO user_identities(provider,provider_user_id,user_id,email) VALUES('password',?,?,?)`).bind(auth.uid,id,email),
      env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('user',?,'register_firebase',?,?)`).bind(id,id,JSON.stringify({provider:'firebase'}))
    ])}catch{await firebaseDeleteAccount(env,auth.idToken);return fail('EMAIL_EXISTS','البريد مستخدم بالفعل؛ سجّل الدخول أو استخدم بريدًا آخر',409)}
    try{await firebaseSendVerification(env,auth.idToken)}catch{await env.DB.batch([env.DB.prepare(`DELETE FROM user_identities WHERE user_id=?`).bind(id),env.DB.prepare(`DELETE FROM users WHERE id=?`).bind(id)]);await firebaseDeleteAccount(env,auth.idToken);return fail('EMAIL_DELIVERY_FAILED','تعذر إرسال رسالة التحقق من Google؛ لم يتم حفظ الحساب',503)}
    await recordAccountEvent(env,request,{userId:id,accountCode:id,email,eventType:'register',details:{provider:'firebase'}});return json({pending:true,message:'أرسل Google رابط تحقق إلى بريدك. بعد التحقق سيصبح الحساب بانتظار موافقة المشرف'},202);
  }

  // Keep links issued before the Firebase migration valid.
  if(url.pathname==='/api/auth/verify-email'&&request.method==='GET'){
    const token=String(url.searchParams.get('token')||'');if(token.length<32||token.length>200)return fail('INVALID_TOKEN','رابط التحقق غير صالح',400);const tokenHash=await hashToken(token);const verification=await env.DB.prepare(`SELECT e.user_id AS userId,u.email FROM email_verifications e JOIN users u ON u.id=e.user_id WHERE e.token_hash=? AND e.verified_at IS NULL AND unixepoch(e.expires_at)>unixepoch('now')`).bind(tokenHash).first();if(!verification)return fail('TOKEN_EXPIRED','رابط التحقق غير صالح أو منتهي',410);
    await env.DB.batch([env.DB.prepare(`UPDATE email_verifications SET verified_at=CURRENT_TIMESTAMP,token_hash=? WHERE user_id=? AND verified_at IS NULL`).bind(`used:${crypto.randomUUID()}`,verification.userId),env.DB.prepare(`UPDATE users SET email_verified_at=COALESCE(email_verified_at,CURRENT_TIMESTAMP) WHERE id=?`).bind(verification.userId),env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('user',?,'verify_email',?,?)`).bind(verification.userId,verification.userId,JSON.stringify({provider:'legacy_link'}))]);return json({verified:true,message:'تم توثيق البريد بنجاح. الحساب الآن بانتظار موافقة المشرف'});
  }

  // Keep staff invitation links issued before the Firebase migration usable.
  if(url.pathname==='/api/auth/activate-staff'&&request.method==='POST'){
    const parsed=await value(request);if(parsed.response)return parsed.response;const token=String(parsed.data?.token||'');const passwordIssue=validatePassword(parsed.data?.password);if(passwordIssue)return fail('VALIDATION',passwordIssue);if(!firebaseAuthConfigured(env))return fail('FIREBASE_AUTH_UNAVAILABLE','تفعيل البريد متوقف مؤقتًا حتى تهيئة Firebase',503);
    const tokenHash=await hashToken(token);const invite=await env.DB.prepare(`SELECT i.user_id AS userId,u.email,u.name FROM staff_invites i JOIN users u ON u.id=i.user_id WHERE i.token_hash=? AND i.accepted_at IS NULL AND unixepoch(i.expires_at)>unixepoch('now')`).bind(tokenHash).first();if(!invite)return fail('TOKEN_EXPIRED','دعوة التفعيل غير صالحة أو منتهية',410);
    let auth,created=false;try{auth=await firebaseSignUp(env,invite.email,parsed.data.password);created=true}catch(error){if(!isFirebaseError(error,'EMAIL_EXISTS'))return fail('FIREBASE_AUTH_UNAVAILABLE','تعذر تفعيل الحساب لدى Google',503);try{auth=await firebaseSignIn(env,invite.email,parsed.data.password)}catch{return fail('FIREBASE_ACCOUNT_LINK_REQUIRED','يوجد حساب Google لهذا البريد. استخدم استعادة كلمة المرور ثم سجّل الدخول',409)}}
    try{await env.DB.batch([env.DB.prepare(`UPDATE users SET firebase_uid=?,email_verified_at=COALESCE(email_verified_at,CURRENT_TIMESTAMP),password_hash=NULL,password_salt=NULL,password_iterations=NULL,password_peppered=0,auth_provider=CASE WHEN auth_provider='chatgpt' THEN 'hybrid' ELSE 'password' END,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(auth.uid,invite.userId),env.DB.prepare(`INSERT OR REPLACE INTO user_identities(provider,provider_user_id,user_id,email) VALUES('password',?,?,?)`).bind(auth.uid,invite.userId,invite.email),env.DB.prepare(`UPDATE staff_invites SET accepted_at=CURRENT_TIMESTAMP,token_hash=? WHERE user_id=?`).bind(`used:${crypto.randomUUID()}`,invite.userId)])}catch(error){if(created)await firebaseDeleteAccount(env,auth.idToken);throw error}
    await revokeUserSessions(env,invite.userId);return json({activated:true,message:'تم نقل الحساب إلى Firebase ويمكنك تسجيل الدخول الآن'});
  }

  if(url.pathname==='/api/auth/login'&&request.method==='POST'){
    const parsed=await value(request);if(parsed.response)return parsed.response;const data=parsed.data;const email=normalizeEmail(data?.email);const emailKey=await authRateKey(email);const ipKey=await authRateKey(request.headers.get('cf-connecting-ip')||'unknown');const [emailLimit,ipLimit]=await Promise.all([enforceRateLimit(env,`auth:login:email:${emailKey}`,8,900),enforceRateLimit(env,`auth:login:ip:${ipKey}`,30,900)]);if(!emailLimit.allowed||!ipLimit.allowed)return fail('RATE_LIMITED','محاولات دخول كثيرة؛ حاول لاحقًا',429,{'retry-after':String(Math.max(emailLimit.retryAfter,ipLimit.retryAfter))});
    const account=await loadPasswordAccount(env,email);let authenticated;try{authenticated=account?await authenticateWithFirebase(env,account,String(data?.password||'')):null}catch{authenticated=null}
    if(!account||!authenticated||authenticated.invalid){await recordAccountEvent(env,request,{userId:account?.id||null,accountCode:account?.id||null,email,eventType:'login_failure',outcome:'failure',details:{reason:'invalid_credentials'}});return fail('INVALID_CREDENTIALS','البريد أو كلمة المرور غير صحيحة',401)}if(authenticated.error)return authenticated.error;
    if(!authenticated.emailVerified&&account.account_role==='student'){await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'login_failure',outcome:'failure',details:{reason:'email_unverified'}});return fail('EMAIL_UNVERIFIED','يجب توثيق البريد من رسالة Google أولًا',403)}if(account.account_status==='pending'){await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'login_failure',outcome:'failure',details:{reason:'pending'}});return fail('ACCOUNT_PENDING','الحساب بانتظار موافقة المشرف',403)}if(account.account_status==='suspended'){await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'login_failure',outcome:'failure',details:{reason:'suspended'}});return fail('ACCOUNT_SUSPENDED','الحساب موقوف؛ تواصل مع المشرف',403)}
    const session=await createSession(env,account.id,request);await env.DB.prepare(`UPDATE users SET last_login_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(account.id).run();if(authenticated.migrated)await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'firebase_migration',details:{provider:'firebase'}});await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'login_success',details:{provider:authenticated.provider,migrated:Boolean(authenticated.migrated)}});return json({user:{id:account.id,email:account.email,name:account.name,role:account.account_role}},200,{'set-cookie':session.cookie});
  }

  if(url.pathname==='/api/auth/resend-verification'&&request.method==='POST'){
    const parsed=await value(request);if(parsed.response)return parsed.response;const email=normalizeEmail(parsed.data?.email);const emailKey=await authRateKey(email);const limit=await enforceRateLimit(env,`auth:resend:${emailKey}`,3,3600);if(!limit.allowed)return fail('RATE_LIMITED','طلبات كثيرة؛ حاول لاحقًا',429,{'retry-after':String(limit.retryAfter)});const account=await loadPasswordAccount(env,email);const authenticated=account?await authenticateWithFirebase(env,account,String(parsed.data?.password||'')):null;if(!authenticated||authenticated.invalid)return fail('INVALID_CREDENTIALS','البريد أو كلمة المرور غير صحيحة',401);if(authenticated.error)return authenticated.error;if(authenticated.emailVerified)return json({sent:false,message:'البريد موثق بالفعل'});try{await firebaseSendVerification(env,authenticated.auth.idToken)}catch{return fail('EMAIL_DELIVERY_FAILED','تعذر إرسال رسالة التحقق من Google',503)}await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'verification_resent'});return json({sent:true,message:'أعاد Google إرسال رسالة التحقق'});
  }

  if(url.pathname==='/api/auth/forgot-password'&&request.method==='POST'){
    const parsed=await value(request);if(parsed.response)return parsed.response;const email=normalizeEmail(parsed.data?.email);if(!validEmail(email))return json({accepted:true,message:'إذا كان البريد مسجلًا فستصله رسالة استعادة'},202);const emailKey=await authRateKey(email);const ipKey=await authRateKey(request.headers.get('cf-connecting-ip')||'unknown');const [emailLimit,ipLimit]=await Promise.all([enforceRateLimit(env,`auth:reset:email:${emailKey}`,3,3600),enforceRateLimit(env,`auth:reset:ip:${ipKey}`,15,3600)]);if(!emailLimit.allowed||!ipLimit.allowed)return fail('RATE_LIMITED','طلبات استعادة كثيرة؛ حاول لاحقًا',429,{'retry-after':String(Math.max(emailLimit.retryAfter,ipLimit.retryAfter))});if(!firebaseAuthConfigured(env))return fail('FIREBASE_AUTH_UNAVAILABLE','استعادة كلمة المرور متوقفة مؤقتًا حتى تهيئة Firebase',503);const account=await loadPasswordAccount(env,email);
    try{if(account&&!account.firebaseUid)try{await firebaseSignUp(env,email,firebaseTemporaryPassword())}catch(error){if(!isFirebaseError(error,'EMAIL_EXISTS'))throw error}await firebaseSendPasswordReset(env,email);if(account)await recordAccountEvent(env,request,{userId:account.id,accountCode:account.id,email,eventType:'password_reset_requested'})}catch(error){if(!isFirebaseError(error,'EMAIL_NOT_FOUND'))return fail('FIREBASE_AUTH_UNAVAILABLE','تعذر طلب الاستعادة من Google؛ حاول لاحقًا',503)}return json({accepted:true,message:'إذا كان البريد مسجلًا فستصله رسالة استعادة من Google'},202);
  }

  if(url.pathname==='/api/auth/logout'&&request.method==='POST'){if(user)await recordAccountEvent(env,request,{userId:user.id,accountCode:user.id,email:user.email,eventType:'logout'});await revokeSession(env,request);return json({signedOut:true},200,{'set-cookie':clearSessionCookie()})}
  if(url.pathname==='/api/auth/session'&&request.method==='GET')return user?json({user}):fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401);
  return null;
}
