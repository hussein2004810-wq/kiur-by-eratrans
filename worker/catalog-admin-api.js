import {readJsonBody,secureHeaders} from './security.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})})}
function fail(code,message,status=400){return json({error:{code,message}},status)}
async function readBody(request){return readJsonBody(request)}
function bodyFailure(parsed){return parsed.error?fail(parsed.error.code,parsed.error.message,parsed.error.status):null}
function validName(value){return typeof value==='string'&&value.trim().length>=2&&value.trim().length<=120}
function denied(user){return ['owner','admin'].includes(user?.role)?null:fail('FORBIDDEN','هذه العملية للمشرف فقط',403)}
async function audit(env,user,entity,entityId,action,details){await env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES(?,?,?,?,?)`).bind(entity,entityId,action,user.id,JSON.stringify(details||{})).run()}
async function nextOrder(env,table,parentColumn,parentId){const allowed={departments:null,phases:'department_id',subjects:'phase_id',lectures:'subject_id'};if(!(table in allowed))throw new Error('Invalid catalog table');const column=allowed[table];const sql=column?`SELECT COALESCE(MAX(sort_order),0)+1 AS nextOrder FROM ${table} WHERE ${column}=?`:`SELECT COALESCE(MAX(sort_order),0)+1 AS nextOrder FROM ${table}`;const statement=env.DB.prepare(sql);const row=await (column?statement.bind(parentId):statement).first();return Number(row?.nextOrder||1)}

export async function handleCatalogAdminApi(request,env,url,user){
  if(!url.pathname.startsWith('/api/admin/'))return null;

  if(url.pathname==='/api/admin/departments'&&request.method==='POST'){
    const deny=denied(user);if(deny)return deny;const parsed=await readBody(request);const invalid=bodyFailure(parsed);if(invalid)return invalid;const value=parsed.value;if(!validName(value?.name))return fail('VALIDATION','اسم القسم يجب أن يكون بين حرفين و120 حرفًا');
    const id=crypto.randomUUID();try{await env.DB.prepare(`INSERT INTO departments(id,name,sort_order) VALUES(?,?,?)`).bind(id,value.name.trim(),await nextOrder(env,'departments')).run()}catch{return fail('DUPLICATE','يوجد قسم بهذا الاسم بالفعل',409)}
    await audit(env,user,'department',id,'create',{name:value.name.trim()});return json({id},201);
  }
  const department=url.pathname.match(/^\/api\/admin\/departments\/([^/]+)$/);
  if(department&&request.method==='PATCH'){
    const deny=denied(user);if(deny)return deny;const parsed=await readBody(request);const invalid=bodyFailure(parsed);if(invalid)return invalid;const value=parsed.value;if(!validName(value?.name))return fail('VALIDATION','اسم القسم غير صالح');
    try{const result=await env.DB.prepare(`UPDATE departments SET name=? WHERE id=?`).bind(value.name.trim(),department[1]).run();if(!result.meta.changes)return fail('NOT_FOUND','القسم غير موجود',404)}catch{return fail('DUPLICATE','يوجد قسم بهذا الاسم بالفعل',409)}
    await audit(env,user,'department',department[1],'update',{name:value.name.trim()});return json({updated:true});
  }
  if(department&&request.method==='DELETE'){
    const deny=denied(user);if(deny)return deny;const dependency=await env.DB.prepare(`SELECT (SELECT count(*) FROM phases WHERE department_id=?) AS phases,(SELECT count(*) FROM tests WHERE department_id=? AND status!='archived') AS tests,(SELECT count(*) FROM users WHERE department_id=?) AS users`).bind(department[1],department[1],department[1]).first();
    if(Number(dependency?.phases)||Number(dependency?.tests)||Number(dependency?.users))return fail('IN_USE','لا يمكن حذف القسم قبل إزالة مراحله، كما يجب ألا يكون مرتبطًا بطلاب أو اختبارات',409);
    const result=await env.DB.prepare(`DELETE FROM departments WHERE id=?`).bind(department[1]).run();if(!result.meta.changes)return fail('NOT_FOUND','القسم غير موجود',404);await audit(env,user,'department',department[1],'delete',{});return new Response(null,{status:204,headers:secureHeaders()});
  }

  if(url.pathname==='/api/admin/phases'&&request.method==='POST'){
    const deny=denied(user);if(deny)return deny;const parsed=await readBody(request);const invalid=bodyFailure(parsed);if(invalid)return invalid;const value=parsed.value;if(!validName(value?.name)||typeof value?.departmentId!=='string'||value.departmentId.length>200)return fail('VALIDATION','اسم المرحلة والقسم مطلوبان');
    const parent=await env.DB.prepare(`SELECT id FROM departments WHERE id=?`).bind(value.departmentId).first();if(!parent)return fail('VALIDATION','القسم المحدد غير موجود');const id=crypto.randomUUID();
    try{await env.DB.prepare(`INSERT INTO phases(id,department_id,name,sort_order) VALUES(?,?,?,?)`).bind(id,value.departmentId,value.name.trim(),await nextOrder(env,'phases','department_id',value.departmentId)).run()}catch{return fail('DUPLICATE','توجد مرحلة بهذا الاسم داخل القسم',409)}
    await audit(env,user,'phase',id,'create',{name:value.name.trim(),departmentId:value.departmentId});return json({id},201);
  }
  const phase=url.pathname.match(/^\/api\/admin\/phases\/([^/]+)$/);
  if(phase&&request.method==='PATCH'){
    const deny=denied(user);if(deny)return deny;const parsed=await readBody(request);const invalid=bodyFailure(parsed);if(invalid)return invalid;const value=parsed.value;if(!validName(value?.name))return fail('VALIDATION','اسم المرحلة غير صالح');
    try{const result=await env.DB.prepare(`UPDATE phases SET name=? WHERE id=?`).bind(value.name.trim(),phase[1]).run();if(!result.meta.changes)return fail('NOT_FOUND','المرحلة غير موجودة',404)}catch{return fail('DUPLICATE','توجد مرحلة بهذا الاسم داخل القسم',409)}
    await audit(env,user,'phase',phase[1],'update',{name:value.name.trim()});return json({updated:true});
  }
  if(phase&&request.method==='DELETE'){
    const deny=denied(user);if(deny)return deny;const dependency=await env.DB.prepare(`SELECT (SELECT count(*) FROM subjects WHERE phase_id=?) AS subjects,(SELECT count(*) FROM tests WHERE phase_id=? AND status!='archived') AS tests,(SELECT count(*) FROM users WHERE phase_id=?) AS users`).bind(phase[1],phase[1],phase[1]).first();
    if(Number(dependency?.subjects)||Number(dependency?.tests)||Number(dependency?.users))return fail('IN_USE','لا يمكن حذف المرحلة قبل إزالة موادها، كما يجب ألا تكون مرتبطة بطلاب أو اختبارات',409);
    const result=await env.DB.prepare(`DELETE FROM phases WHERE id=?`).bind(phase[1]).run();if(!result.meta.changes)return fail('NOT_FOUND','المرحلة غير موجودة',404);await audit(env,user,'phase',phase[1],'delete',{});return new Response(null,{status:204,headers:secureHeaders()});
  }

  if(url.pathname==='/api/admin/subjects'&&request.method==='POST'){
    const deny=denied(user);if(deny)return deny;const parsed=await readBody(request);const invalid=bodyFailure(parsed);if(invalid)return invalid;const value=parsed.value;if(!validName(value?.name)||typeof value?.phaseId!=='string'||value.phaseId.length>200)return fail('VALIDATION','اسم المادة والمرحلة مطلوبان');
    const parent=await env.DB.prepare(`SELECT id FROM phases WHERE id=?`).bind(value.phaseId).first();if(!parent)return fail('VALIDATION','المرحلة المحددة غير موجودة');const id=crypto.randomUUID();
    try{await env.DB.prepare(`INSERT INTO subjects(id,phase_id,name,sort_order) VALUES(?,?,?,?)`).bind(id,value.phaseId,value.name.trim(),await nextOrder(env,'subjects','phase_id',value.phaseId)).run()}catch{return fail('DUPLICATE','توجد مادة بهذا الاسم داخل المرحلة',409)}
    await audit(env,user,'subject',id,'create',{name:value.name.trim(),phaseId:value.phaseId});return json({id},201);
  }
  const subject=url.pathname.match(/^\/api\/admin\/subjects\/([^/]+)$/);
  if(subject&&request.method==='PATCH'){
    const deny=denied(user);if(deny)return deny;const parsed=await readBody(request);const invalid=bodyFailure(parsed);if(invalid)return invalid;const value=parsed.value;if(!validName(value?.name))return fail('VALIDATION','اسم المادة غير صالح');
    try{const result=await env.DB.prepare(`UPDATE subjects SET name=? WHERE id=?`).bind(value.name.trim(),subject[1]).run();if(!result.meta.changes)return fail('NOT_FOUND','المادة غير موجودة',404);await env.DB.prepare(`UPDATE tests SET subject=?,updated_at=CURRENT_TIMESTAMP WHERE subject_id=?`).bind(value.name.trim(),subject[1]).run()}catch{return fail('DUPLICATE','توجد مادة بهذا الاسم داخل المرحلة',409)}
    await audit(env,user,'subject',subject[1],'update',{name:value.name.trim()});return json({updated:true});
  }
  if(subject&&request.method==='DELETE'){
    const deny=denied(user);if(deny)return deny;const dependency=await env.DB.prepare(`SELECT (SELECT count(*) FROM lectures WHERE subject_id=?) AS lectures,(SELECT count(*) FROM tests WHERE subject_id=? AND status!='archived') AS tests`).bind(subject[1],subject[1]).first();
    if(Number(dependency?.lectures)||Number(dependency?.tests))return fail('IN_USE','لا يمكن حذف المادة قبل إزالة محاضراتها واختباراتها',409);
    const result=await env.DB.prepare(`DELETE FROM subjects WHERE id=?`).bind(subject[1]).run();if(!result.meta.changes)return fail('NOT_FOUND','المادة غير موجودة',404);await audit(env,user,'subject',subject[1],'delete',{});return new Response(null,{status:204,headers:secureHeaders()});
  }

  if(url.pathname==='/api/admin/lectures'&&request.method==='POST'){
    const deny=denied(user);if(deny)return deny;const parsed=await readBody(request);const invalid=bodyFailure(parsed);if(invalid)return invalid;const value=parsed.value;if(!validName(value?.name)||typeof value?.subjectId!=='string'||value.subjectId.length>200)return fail('VALIDATION','اسم المحاضرة والمادة مطلوبان');
    const parent=await env.DB.prepare(`SELECT id FROM subjects WHERE id=?`).bind(value.subjectId).first();if(!parent)return fail('VALIDATION','المادة المحددة غير موجودة');const id=crypto.randomUUID();
    try{await env.DB.prepare(`INSERT INTO lectures(id,subject_id,name,sort_order) VALUES(?,?,?,?)`).bind(id,value.subjectId,value.name.trim(),await nextOrder(env,'lectures','subject_id',value.subjectId)).run()}catch{return fail('DUPLICATE','توجد محاضرة بهذا الاسم داخل المادة',409)}
    await audit(env,user,'lecture',id,'create',{name:value.name.trim(),subjectId:value.subjectId});return json({id},201);
  }
  const lecture=url.pathname.match(/^\/api\/admin\/lectures\/([^/]+)$/);
  if(lecture&&request.method==='PATCH'){
    const deny=denied(user);if(deny)return deny;const parsed=await readBody(request);const invalid=bodyFailure(parsed);if(invalid)return invalid;const value=parsed.value;if(!validName(value?.name))return fail('VALIDATION','اسم المحاضرة غير صالح');
    try{const result=await env.DB.prepare(`UPDATE lectures SET name=? WHERE id=?`).bind(value.name.trim(),lecture[1]).run();if(!result.meta.changes)return fail('NOT_FOUND','المحاضرة غير موجودة',404);await env.DB.prepare(`UPDATE tests SET lecture=?,updated_at=CURRENT_TIMESTAMP WHERE lecture_id=?`).bind(value.name.trim(),lecture[1]).run()}catch{return fail('DUPLICATE','توجد محاضرة بهذا الاسم داخل المادة',409)}
    await audit(env,user,'lecture',lecture[1],'update',{name:value.name.trim()});return json({updated:true});
  }
  if(lecture&&request.method==='DELETE'){
    const deny=denied(user);if(deny)return deny;const dependency=await env.DB.prepare(`SELECT count(*) AS tests FROM tests WHERE lecture_id=? AND status!='archived'`).bind(lecture[1]).first();if(Number(dependency?.tests))return fail('IN_USE','لا يمكن حذف المحاضرة لأنها مرتبطة باختبار؛ عدّل الاختبار أو أرشفه أولًا',409);
    const result=await env.DB.prepare(`DELETE FROM lectures WHERE id=?`).bind(lecture[1]).run();if(!result.meta.changes)return fail('NOT_FOUND','المحاضرة غير موجودة',404);await audit(env,user,'lecture',lecture[1],'delete',{});return new Response(null,{status:204,headers:secureHeaders()});
  }
  return null;
}
