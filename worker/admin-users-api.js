import {PERMISSIONS,hasPermission,loadGrants,mayDelegate,resolveScope} from './access-control.js';
import {createPasswordRecord,normalizeEmail,validatePassword} from './password-auth.js';
import {readJsonBody,secureHeaders} from './security.js';
import {recordAccountEvent} from './account-events.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})})}
function fail(code,message,status=400,details){return json({error:{code,message,...(details?{details}: {})}},status)}
function isManager(user){return ['owner','admin'].includes(user?.role)}
function validEmail(email){return email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
function validRole(role){return ['admin','teacher','student'].includes(role)}
const STAFF_TITLES=['department_head','department_coordinator','university_doctor','university_professor'];
function validStaffTitle(value){return STAFF_TITLES.includes(value)}
function validStatus(status){return ['pending','active','suspended'].includes(status)}
function legacyRole(role){return ['owner','admin'].includes(role)?'admin':'student'}
async function body(request){const parsed=await readJsonBody(request);return parsed.error?{response:fail(parsed.error.code,parsed.error.message,parsed.error.status)}:{value:parsed.value}}
async function audit(env,actor,entityId,action,details){await env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('user',?,?,?,?)`).bind(entityId,action,actor.id,JSON.stringify(details||{})).run()}

function userContext(row){return {universityId:row.universityId,collegeId:row.collegeId,departmentId:row.departmentId,phaseId:row.phaseId,sectionId:row.sectionId}}
async function canManageTarget(env,actor,target,permission){
  if(actor?.role==='owner')return true;
  if(actor?.role!=='admin'||target?.role==='owner'||target?.role==='admin')return false;
  return hasPermission(env,actor,permission,userContext(target));
}

async function validateGrants(env,actor,role,grants){
  if(!Array.isArray(grants)||grants.length<1||grants.length>50)return {error:'يجب إضافة نطاق صلاحية واحد على الأقل'};
  const normalized=[];
  for(const item of grants){
    const scopeType=String(item?.scopeType||'');const scopeId=scopeType==='platform'?'platform':String(item?.scopeId||'');
    const permissions=[...new Set(Array.isArray(item?.permissions)?item.permissions:[])];
    if(!permissions.length||permissions.some(permission=>!PERMISSIONS.includes(permission)))return {error:'توجد صلاحية غير صالحة'};
    const context=await resolveScope(env,scopeType,scopeId);if(!context)return {error:'أحد نطاقات الصلاحية غير صالح'};
    if(!(await mayDelegate(env,actor,permissions,context)))return {error:'لا يمكنك منح صلاحية أو نطاق أوسع من صلاحياتك',status:403};
    normalized.push({id:crypto.randomUUID(),role,scopeType,scopeId,permissions,context});
  }
  return {grants:normalized};
}

async function visibleUsers(env,actor,rows){
  if(actor.role==='owner')return rows;
  const grants=await loadGrants(env,actor.id);
  return rows.filter(row=>{
    if(row.role==='owner'||row.role==='admin')return false;
    const permission=row.role==='student'?'manage_students':'manage_teachers';
    return grants.some(grant=>grant.permissions.includes(permission)&&(grant.scopeType==='platform'||String(userContext(row)[`${grant.scopeType}Id`]||'')===String(grant.scopeId)));
  });
}

export async function handleAdminUsersApi(request,env,url,actor){
  if(!url.pathname.startsWith('/api/admin/users'))return null;
  if(!isManager(actor))return fail('FORBIDDEN','هذه العملية للمشرف فقط',403);

  if(url.pathname==='/api/admin/users'&&request.method==='GET'){
    const role=url.searchParams.get('role');if(role&& !validRole(role)&&role!=='owner')return fail('VALIDATION','نوع الحساب غير صالح');
    const status=url.searchParams.get('status');if(status&&!validStatus(status))return fail('VALIDATION','حالة الحساب غير صالحة');
    const q=String(url.searchParams.get('q')||'').trim().slice(0,80);const limit=Math.min(200,Math.max(10,Number(url.searchParams.get('limit'))||100));
    const filters=[];const binds=[];if(role){filters.push('u.account_role=?');binds.push(role)}if(status){filters.push('u.account_status=?');binds.push(status)}if(q){filters.push('(u.name LIKE ? OR u.email LIKE ?)');binds.push(`%${q}%`,`%${q}%`)}
    const where=filters.length?`WHERE ${filters.join(' AND ')}`:'';
    const statement=env.DB.prepare(`SELECT u.id,u.name,u.email,u.account_role AS role,u.staff_title AS staffTitle,u.account_status AS status,u.auth_provider AS authProvider,u.created_at AS createdAt,u.last_login_at AS lastLoginAt,u.university_id AS universityId,u.college_id AS collegeId,u.department_id AS departmentId,u.phase_id AS phaseId,u.section_id AS sectionId,v.name AS universityName,c.name AS collegeName,COALESCE(d.display_name,d.name) AS departmentName,p.name AS phaseName,x.name AS sectionName FROM users u LEFT JOIN universities v ON v.id=u.university_id LEFT JOIN colleges c ON c.id=u.college_id LEFT JOIN departments d ON d.id=u.department_id LEFT JOIN phases p ON p.id=u.phase_id LEFT JOIN sections x ON x.id=u.section_id ${where} ORDER BY CASE u.account_status WHEN 'pending' THEN 0 ELSE 1 END,u.created_at DESC LIMIT ?`).bind(...binds,limit);
    const result=await statement.all();const data=await visibleUsers(env,actor,result.results);
    for(const row of data){if(['admin','teacher'].includes(row.role))row.grants=await loadGrants(env,row.id)}
    return json({data,permissions:PERMISSIONS});
  }

  if(url.pathname==='/api/admin/users'&&request.method==='POST'){
    const parsed=await body(request);if(parsed.response)return parsed.response;const value=parsed.value||{};const role=String(value.role||'teacher');
    if(!validRole(role)||role==='student')return fail('VALIDATION','إنشاء الحساب المباشر متاح للكادر والمشرفين فقط');
    if(role==='admin'&&actor.role!=='owner')return fail('FORBIDDEN','المالك وحده يستطيع إنشاء مشرف',403);
    const staffTitle=role==='teacher'?String(value.staffTitle||''):null;if(role==='teacher'&&!validStaffTitle(staffTitle))return fail('VALIDATION','اختر صفة كادر صالحة');
    const name=String(value.name||'').trim();const email=normalizeEmail(value.email);if(name.length<2||name.length>120||!validEmail(email))return fail('VALIDATION','الاسم أو البريد الإلكتروني غير صالح');
    const grantResult=await validateGrants(env,actor,role,value.grants);if(grantResult.error)return fail(grantResult.status===403?'FORBIDDEN':'VALIDATION',grantResult.error,grantResult.status||400);
    const existing=await env.DB.prepare(`SELECT id,name,email,account_role AS role,staff_title AS staffTitle,account_status AS status,auth_provider AS authProvider FROM users WHERE email=?`).bind(email).first();
    if(existing){
      if(!value.linkExisting||String(value.existingUserId||'')!==String(existing.id))return fail('ACCOUNT_EXISTS','يوجد حساب بهذا البريد. يمكن لمالك المنصة ربطه وترقيته بدل إنشاء نسخة مكررة.',409,{account:{id:existing.id,name:existing.name,email:existing.email,role:existing.role,status:existing.status,authProvider:existing.authProvider},canLink:actor.role==='owner'});
      if(actor.role!=='owner')return fail('OWNER_CONFIRMATION_REQUIRED','ربط الحساب الموجود وترقيته يحتاج تأكيد مالك المنصة',403);
      if(existing.role==='owner')return fail('FORBIDDEN','لا يمكن تغيير حساب مالك المنصة',403);
      const statements=[
        env.DB.prepare(`UPDATE users SET name=?,account_role=?,role=?,staff_title=?,account_status='active',updated_at=CURRENT_TIMESTAMP WHERE id=? AND email=?`).bind(name,role,legacyRole(role),staffTitle,existing.id,email),
        env.DB.prepare(`DELETE FROM user_grants WHERE user_id=?`).bind(existing.id)
      ];
      for(const grant of grantResult.grants)statements.push(env.DB.prepare(`INSERT INTO user_grants(id,user_id,grant_role,scope_type,scope_id,permissions_json,granted_by) VALUES(?,?,?,?,?,?,?)`).bind(grant.id,existing.id,role,grant.scopeType,grant.scopeId,JSON.stringify(grant.permissions),actor.id));
      statements.push(env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('user',?,'link_and_upgrade_account',?,?)`).bind(existing.id,actor.id,JSON.stringify({fromRole:existing.role,toRole:role,staffTitle,grants:grantResult.grants.map(({scopeType,scopeId,permissions})=>({scopeType,scopeId,permissions}))})));
      await env.DB.batch(statements);
      try{await recordAccountEvent(env,request,{userId:existing.id,accountCode:existing.id,email,eventType:'grant_changed',details:{changedBy:actor.id,linkedExisting:true,role,staffTitle}})}catch(cause){console.error('Account event write failed',{operation:'link_existing',name:cause instanceof Error?cause.name:'UnknownError'})}
      return json({id:existing.id,linked:true});
    }
    const passwordIssue=validatePassword(value.password);if(passwordIssue)return fail('VALIDATION',passwordIssue);
    const password=await createPasswordRecord(value.password);const id=crypto.randomUUID();const statements=[
      env.DB.prepare(`INSERT INTO users(id,email,name,role,account_role,staff_title,account_status,auth_provider,password_hash,password_salt,password_iterations) VALUES(?,?,?,?,?,?,'active','password',?,?,?)`).bind(id,email,name,legacyRole(role),role,staffTitle,password.hash,password.salt,password.iterations),
      env.DB.prepare(`INSERT INTO user_identities(provider,provider_user_id,user_id,email) VALUES('password',?,?,?)`).bind(email,id,email)
    ];
    for(const grant of grantResult.grants)statements.push(env.DB.prepare(`INSERT INTO user_grants(id,user_id,grant_role,scope_type,scope_id,permissions_json,granted_by) VALUES(?,?,?,?,?,?,?)`).bind(grant.id,id,role,grant.scopeType,grant.scopeId,JSON.stringify(grant.permissions),actor.id));
    statements.push(env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('user',?,'create_account',?,?)`).bind(id,actor.id,JSON.stringify({role,staffTitle,grants:grantResult.grants.map(({scopeType,scopeId,permissions})=>({scopeType,scopeId,permissions}))})));
    try{await env.DB.batch(statements)}catch(cause){console.error('Account create batch failed',{name:cause instanceof Error?cause.name:'UnknownError'});const raced=await env.DB.prepare(`SELECT id,name,email,account_role AS role,account_status AS status,auth_provider AS authProvider FROM users WHERE email=?`).bind(email).first();if(raced)return fail('ACCOUNT_EXISTS','يوجد حساب بهذا البريد. أعد المحاولة لاختيار ربطه وترقيته.',409,{account:raced,canLink:actor.role==='owner'});return fail('CREATE_ACCOUNT_FAILED','تعذر إنشاء الحساب. لم يتم حفظ حساب جزئي.',500)}
    try{await recordAccountEvent(env,request,{userId:id,accountCode:id,email,eventType:'account_created',details:{createdBy:actor.id,role,staffTitle}})}catch(cause){console.error('Account event write failed',{operation:'create',name:cause instanceof Error?cause.name:'UnknownError'})}
    return json({id},201);
  }

  const match=url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
  if(match&&request.method==='PATCH'){
    const target=await env.DB.prepare(`SELECT id,account_role AS role,account_status AS status,university_id AS universityId,college_id AS collegeId,department_id AS departmentId,phase_id AS phaseId,section_id AS sectionId FROM users WHERE id=?`).bind(match[1]).first();if(!target)return fail('NOT_FOUND','الحساب غير موجود',404);
    if(target.role==='owner')return fail('FORBIDDEN','لا يمكن تعديل حساب مالك المنصة',403);
    const permission=target.role==='student'?'manage_students':'manage_teachers';if(!(await canManageTarget(env,actor,target,permission)))return fail('FORBIDDEN','هذا الحساب خارج نطاق صلاحيتك',403);
    const parsed=await body(request);if(parsed.response)return parsed.response;const status=String(parsed.value?.status||'');if(!validStatus(status))return fail('VALIDATION','حالة الحساب غير صالحة');
    await env.DB.batch([env.DB.prepare(`UPDATE users SET account_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status,target.id),env.DB.prepare(`UPDATE auth_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND ?!='active' AND revoked_at IS NULL`).bind(target.id,status)]);await audit(env,actor,target.id,'set_status',{status});await recordAccountEvent(env,request,{userId:target.id,accountCode:target.id,eventType:'account_status',details:{changedBy:actor.id,status}});return json({updated:true});
  }

  const grantMatch=url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/grants$/);
  if(grantMatch&&request.method==='PUT'){
    const target=await env.DB.prepare(`SELECT id,account_role AS role,staff_title AS staffTitle,university_id AS universityId,college_id AS collegeId,department_id AS departmentId,phase_id AS phaseId,section_id AS sectionId FROM users WHERE id=?`).bind(grantMatch[1]).first();if(!target)return fail('NOT_FOUND','الحساب غير موجود',404);if(target.role==='owner')return fail('FORBIDDEN','لا يمكن تعديل مالك المنصة',403);
    const parsed=await body(request);if(parsed.response)return parsed.response;const role=String(parsed.value?.role||target.role);if(!['admin','teacher'].includes(role))return fail('VALIDATION','الدور المطلوب غير صالح');if(role==='admin'&&actor.role!=='owner')return fail('FORBIDDEN','المالك وحده يستطيع ترقية المشرفين',403);if(actor.role!=='owner'&&target.role==='admin')return fail('FORBIDDEN','لا يمكنك تعديل مشرف آخر',403);const staffTitle=role==='teacher'?String(parsed.value?.staffTitle||target.staffTitle||''):null;if(role==='teacher'&&!validStaffTitle(staffTitle))return fail('VALIDATION','اختر صفة كادر صالحة');
    const grantResult=await validateGrants(env,actor,role,parsed.value?.grants);if(grantResult.error)return fail(grantResult.status===403?'FORBIDDEN':'VALIDATION',grantResult.error,grantResult.status||400);
    const statements=[env.DB.prepare(`DELETE FROM user_grants WHERE user_id=?`).bind(target.id),env.DB.prepare(`UPDATE users SET account_role=?,role=?,staff_title=?,account_status='active',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(role,legacyRole(role),staffTitle,target.id)];
    for(const grant of grantResult.grants)statements.push(env.DB.prepare(`INSERT INTO user_grants(id,user_id,grant_role,scope_type,scope_id,permissions_json,granted_by) VALUES(?,?,?,?,?,?,?)`).bind(grant.id,target.id,role,grant.scopeType,grant.scopeId,JSON.stringify(grant.permissions),actor.id));
    await env.DB.batch(statements);await audit(env,actor,target.id,'replace_grants',{role,staffTitle,grants:grantResult.grants.map(({scopeType,scopeId,permissions})=>({scopeType,scopeId,permissions}))});await recordAccountEvent(env,request,{userId:target.id,accountCode:target.id,eventType:'grant_changed',details:{changedBy:actor.id,role,staffTitle}});return json({updated:true});
  }
  return null;
}
