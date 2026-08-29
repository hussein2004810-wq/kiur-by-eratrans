import {hasPermission,loadGrants,permittedWith,resolveScope} from './access-control.js';
import {readJsonBody,secureHeaders} from './security.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})})}
function fail(code,message,status=400){return json({error:{code,message}},status)}
function validName(value){return typeof value==='string'&&value.trim().length>=2&&value.trim().length<=120}
async function readBody(request){const parsed=await readJsonBody(request);return parsed.error?{response:fail(parsed.error.code,parsed.error.message,parsed.error.status)}:{value:parsed.value}}
async function audit(env,user,entity,entityId,action,details){await env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES(?,?,?,?,?)`).bind(entity,entityId,action,user.id,JSON.stringify(details||{})).run()}
function auditStatement(env,user,entity,entityId,action,details){return env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES(?,?,?,?,?)`).bind(entity,entityId,action,user.id,JSON.stringify(details||{}))}

const resources={
  universities:{table:'universities',entity:'university',label:'الجامعة',parent:null,scopeType:'university',dependencies:[['colleges','university_id'],['users','university_id']]},
  colleges:{table:'colleges',entity:'college',label:'الكلية',parent:{field:'universityId',column:'university_id',scopeType:'university',label:'الجامعة'},scopeType:'college',dependencies:[['departments','college_id'],['users','college_id']]},
  departments:{table:'departments',entity:'department',label:'القسم',displayColumn:'display_name',parent:{field:'collegeId',column:'college_id',scopeType:'college',label:'الكلية'},scopeType:'department',dependencies:[['phases','department_id'],['tests','department_id'],['users','department_id']]},
  phases:{table:'phases',entity:'phase',label:'المرحلة',parent:{field:'departmentId',column:'department_id',scopeType:'department',label:'القسم'},scopeType:'phase',dependencies:[['sections','phase_id'],['subjects','phase_id'],['tests','phase_id'],['users','phase_id']]},
  sections:{table:'sections',entity:'section',label:'الشعبة',parent:{field:'phaseId',column:'phase_id',scopeType:'phase',label:'المرحلة'},scopeType:'section',dependencies:[['tests','section_id'],['users','section_id']]},
  subjects:{table:'subjects',entity:'subject',label:'المادة',parent:{field:'phaseId',column:'phase_id',scopeType:'phase',label:'المرحلة'},scopeType:'subject',dependencies:[['lectures','subject_id'],['tests','subject_id']]},
  lectures:{table:'lectures',entity:'lecture',label:'المحاضرة',parent:{field:'subjectId',column:'subject_id',scopeType:'subject',label:'المادة'},scopeType:'lecture',dependencies:[['tests','lecture_id']]}
};

async function authorize(env,user,context){return ['owner','admin'].includes(user?.role)&&await hasPermission(env,user,'manage_catalog',context)}
async function authorizeDelete(env,user,context){return user?.role==='owner'||(['admin','teacher'].includes(user?.role)&&await hasPermission(env,user,'delete_catalog',context))}
async function nextOrder(env,config,parentId){const statement=env.DB.prepare(`SELECT COALESCE(MAX(sort_order),0)+1 AS nextOrder FROM ${config.table}${config.parent?` WHERE ${config.parent.column}=?`:''}`);const row=await (config.parent?statement.bind(parentId):statement).first();return Number(row?.nextOrder||1)}
async function resourceName(env,config,id){return env.DB.prepare(`SELECT ${config.displayColumn||'name'} AS name FROM ${config.table} WHERE id=?`).bind(id).first()}
function deletionItemStatements(env,batchId,type,id){
  const queries={
    university:[
      ['university',`SELECT id FROM universities WHERE id=?`],
      ['college',`SELECT id FROM colleges WHERE university_id=?`],
      ['department',`SELECT d.id FROM departments d JOIN colleges c ON c.id=d.college_id WHERE c.university_id=?`],
      ['phase',`SELECT p.id FROM phases p JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id WHERE c.university_id=?`],
      ['section',`SELECT x.id FROM sections x JOIN phases p ON p.id=x.phase_id JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id WHERE c.university_id=?`],
      ['subject',`SELECT s.id FROM subjects s JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id WHERE c.university_id=?`],
      ['lecture',`SELECT l.id FROM lectures l JOIN subjects s ON s.id=l.subject_id JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id WHERE c.university_id=?`]
    ],
    college:[
      ['college',`SELECT id FROM colleges WHERE id=?`],
      ['department',`SELECT id FROM departments WHERE college_id=?`],
      ['phase',`SELECT p.id FROM phases p JOIN departments d ON d.id=p.department_id WHERE d.college_id=?`],
      ['section',`SELECT x.id FROM sections x JOIN phases p ON p.id=x.phase_id JOIN departments d ON d.id=p.department_id WHERE d.college_id=?`],
      ['subject',`SELECT s.id FROM subjects s JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id WHERE d.college_id=?`],
      ['lecture',`SELECT l.id FROM lectures l JOIN subjects s ON s.id=l.subject_id JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id WHERE d.college_id=?`]
    ],
    department:[
      ['department',`SELECT id FROM departments WHERE id=?`],
      ['phase',`SELECT id FROM phases WHERE department_id=?`],
      ['section',`SELECT x.id FROM sections x JOIN phases p ON p.id=x.phase_id WHERE p.department_id=?`],
      ['subject',`SELECT s.id FROM subjects s JOIN phases p ON p.id=s.phase_id WHERE p.department_id=?`],
      ['lecture',`SELECT l.id FROM lectures l JOIN subjects s ON s.id=l.subject_id JOIN phases p ON p.id=s.phase_id WHERE p.department_id=?`]
    ],
    phase:[
      ['phase',`SELECT id FROM phases WHERE id=?`],
      ['section',`SELECT id FROM sections WHERE phase_id=?`],
      ['subject',`SELECT id FROM subjects WHERE phase_id=?`],
      ['lecture',`SELECT l.id FROM lectures l JOIN subjects s ON s.id=l.subject_id WHERE s.phase_id=?`]
    ],
    section:[['section',`SELECT id FROM sections WHERE id=?`]],
    subject:[['subject',`SELECT id FROM subjects WHERE id=?`],['lecture',`SELECT id FROM lectures WHERE subject_id=?`]],
    lecture:[['lecture',`SELECT id FROM lectures WHERE id=?`]]
  };
  return queries[type].map(([resourceType,select])=>env.DB.prepare(`INSERT OR IGNORE INTO academic_deleted_items(batch_id,resource_type,resource_id) ${select.replace('SELECT',`SELECT ?,'${resourceType}',`)}`).bind(batchId,id));
}
async function visibleTrash(env,user){
  const rows=(await env.DB.prepare(`SELECT d.id,d.resource_type AS resourceType,d.resource_id AS resourceId,d.resource_name AS resourceName,d.deleted_at AS deletedAt,d.details_json AS detailsJson,u.name AS deletedByName,u.email AS deletedByEmail FROM academic_deletions d JOIN users u ON u.id=d.deleted_by WHERE d.status='active' ORDER BY d.deleted_at DESC LIMIT 100`).all()).results;
  if(user.role==='owner')return rows;
  const grants=await loadGrants(env,user.id);const checks=await Promise.all(rows.map(async row=>({row,context:await resolveScope(env,row.resourceType,row.resourceId)})));
  return checks.filter(item=>item.context&&permittedWith(grants,'delete_catalog',item.context)).map(item=>item.row);
}

async function copyCollege(request,env,user,sourceId){
  const parsed=await readBody(request);if(parsed.response)return parsed.response;const value=parsed.value||{};
  const source=await env.DB.prepare(`SELECT id,name,university_id AS universityId FROM colleges WHERE id=?`).bind(sourceId).first();if(!source)return fail('NOT_FOUND','الكلية المصدر غير موجودة',404);
  const targetUniversityId=String(value.targetUniversityId||'');const sourceContext=await resolveScope(env,'college',sourceId);const targetContext=await resolveScope(env,'university',targetUniversityId);if(!targetContext)return fail('VALIDATION','الجامعة الهدف غير موجودة');
  if(!(await authorize(env,user,sourceContext))||!(await authorize(env,user,targetContext)))return fail('FORBIDDEN','يجب أن تملك صلاحية إدارة الكلية المصدر والجامعة الهدف',403);
  if(source.universityId===targetUniversityId)return fail('VALIDATION','اختر جامعة أخرى لنسخ الكلية إليها');
  const name=String(value.name||source.name).trim();if(!validName(name))return fail('VALIDATION','اسم الكلية الجديدة يجب أن يكون بين حرفين و120 حرفًا');
  const duplicate=await env.DB.prepare(`SELECT id FROM colleges WHERE university_id=? AND name=?`).bind(targetUniversityId,name).first();if(duplicate)return fail('DUPLICATE','توجد كلية بهذا الاسم في الجامعة الهدف',409);

  const [departmentRows,phaseRows,sectionRows,subjectRows,lectureRows]=await Promise.all([
    env.DB.prepare(`SELECT id,COALESCE(display_name,name) AS name,sort_order AS sortOrder FROM departments WHERE college_id=? ORDER BY sort_order,name`).bind(sourceId).all(),
    env.DB.prepare(`SELECT p.id,p.department_id AS departmentId,p.name,p.sort_order AS sortOrder FROM phases p JOIN departments d ON d.id=p.department_id WHERE d.college_id=? ORDER BY p.sort_order,p.name`).bind(sourceId).all(),
    env.DB.prepare(`SELECT x.id,x.phase_id AS phaseId,x.name,x.sort_order AS sortOrder FROM sections x JOIN phases p ON p.id=x.phase_id JOIN departments d ON d.id=p.department_id WHERE d.college_id=? ORDER BY x.sort_order,x.name`).bind(sourceId).all(),
    env.DB.prepare(`SELECT s.id,s.phase_id AS phaseId,s.name,s.sort_order AS sortOrder FROM subjects s JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id WHERE d.college_id=? ORDER BY s.sort_order,s.name`).bind(sourceId).all(),
    env.DB.prepare(`SELECT l.id,l.subject_id AS subjectId,l.name,l.sort_order AS sortOrder FROM lectures l JOIN subjects s ON s.id=l.subject_id JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id WHERE d.college_id=? ORDER BY l.sort_order,l.name`).bind(sourceId).all()
  ]);
  const departments=departmentRows.results;const phases=phaseRows.results;const sections=sectionRows.results;const subjects=subjectRows.results;const lectures=lectureRows.results;
  const total=1+departments.length+phases.length+sections.length+subjects.length+lectures.length;if(total>2500)return fail('COPY_TOO_LARGE','الكلية كبيرة جدًا لنسخها في عملية واحدة',413);
  const collegeId=crypto.randomUUID();const departmentIds=new Map(departments.map(item=>[item.id,crypto.randomUUID()]));const phaseIds=new Map(phases.map(item=>[item.id,crypto.randomUUID()]));const subjectIds=new Map(subjects.map(item=>[item.id,crypto.randomUUID()]));
  const targetOrder=await nextOrder(env,resources.colleges,targetUniversityId);const statements=[env.DB.prepare(`INSERT INTO colleges(id,university_id,name,sort_order) VALUES(?,?,?,?)`).bind(collegeId,targetUniversityId,name,targetOrder)];
  for(const item of departments){const newId=departmentIds.get(item.id);statements.push(env.DB.prepare(`INSERT INTO departments(id,college_id,name,display_name,sort_order) VALUES(?,?,?,?,?)`).bind(newId,collegeId,`department:${newId}`,item.name,Number(item.sortOrder||0)))}
  for(const item of phases)statements.push(env.DB.prepare(`INSERT INTO phases(id,department_id,name,sort_order) VALUES(?,?,?,?)`).bind(phaseIds.get(item.id),departmentIds.get(item.departmentId),item.name,Number(item.sortOrder||0)));
  for(const item of sections)statements.push(env.DB.prepare(`INSERT INTO sections(id,phase_id,name,sort_order) VALUES(?,?,?,?)`).bind(crypto.randomUUID(),phaseIds.get(item.phaseId),item.name,Number(item.sortOrder||0)));
  for(const item of subjects)statements.push(env.DB.prepare(`INSERT INTO subjects(id,phase_id,name,sort_order) VALUES(?,?,?,?)`).bind(subjectIds.get(item.id),phaseIds.get(item.phaseId),item.name,Number(item.sortOrder||0)));
  for(const item of lectures)statements.push(env.DB.prepare(`INSERT INTO lectures(id,subject_id,name,sort_order) VALUES(?,?,?,?)`).bind(crypto.randomUUID(),subjectIds.get(item.subjectId),item.name,Number(item.sortOrder||0)));
  const counts={departments:departments.length,phases:phases.length,sections:sections.length,subjects:subjects.length,lectures:lectures.length};
  statements.push(env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('college',?,'copy',?,?)`).bind(collegeId,user.id,JSON.stringify({sourceCollegeId:sourceId,targetUniversityId,name,counts})));
  try{await env.DB.batch(statements)}catch{return fail('COPY_FAILED','تعذر نسخ الكلية؛ تحقق من عدم وجود أسماء متعارضة',409)}
  return json({id:collegeId,name,counts},201);
}

export async function handleCatalogAdminApi(request,env,url,user){
  if(url.pathname==='/api/admin/academic-trash'&&request.method==='GET')return json({data:await visibleTrash(env,user)});
  const trashMatch=url.pathname.match(/^\/api\/admin\/academic-trash\/([^/]+)$/);
  if(trashMatch&&request.method==='POST'){
    const row=await env.DB.prepare(`SELECT id,resource_type AS resourceType,resource_id AS resourceId,resource_name AS resourceName,status FROM academic_deletions WHERE id=?`).bind(trashMatch[1]).first();if(!row)return fail('NOT_FOUND','سجل الحذف غير موجود',404);if(row.status!=='active')return fail('ALREADY_HANDLED','تمت معالجة هذا العنصر مسبقًا',409);const context=await resolveScope(env,row.resourceType,row.resourceId);if(!context||!(await authorizeDelete(env,user,context)))return fail('FORBIDDEN','لا تملك صلاحية استعادة هذا العنصر',403);
    await env.DB.batch([env.DB.prepare(`DELETE FROM academic_deleted_items WHERE batch_id=?`).bind(row.id),env.DB.prepare(`UPDATE academic_deletions SET status='restored',restored_by=?,restored_at=CURRENT_TIMESTAMP WHERE id=? AND status='active'`).bind(user.id,row.id),auditStatement(env,user,row.resourceType,row.resourceId,'restore',{batchId:row.id,name:row.resourceName})]);return json({restored:true});
  }
  if(trashMatch&&request.method==='DELETE'){
    if(user?.role!=='owner')return fail('OWNER_ONLY','الحذف النهائي من سلة المحذوفات متاح للمالك وحده',403);const row=await env.DB.prepare(`SELECT id,resource_type AS resourceType,resource_id AS resourceId,resource_name AS resourceName,status FROM academic_deletions WHERE id=?`).bind(trashMatch[1]).first();if(!row)return fail('NOT_FOUND','سجل الحذف غير موجود',404);if(row.status!=='active')return fail('ALREADY_HANDLED','تمت معالجة هذا العنصر مسبقًا',409);await env.DB.batch([env.DB.prepare(`UPDATE academic_deletions SET status='purged',purged_by=?,purged_at=CURRENT_TIMESTAMP WHERE id=? AND status='active'`).bind(user.id,row.id),auditStatement(env,user,row.resourceType,row.resourceId,'purge',{batchId:row.id,name:row.resourceName,preservedReferences:true})]);return new Response(null,{status:204,headers:secureHeaders()});
  }
  const copyMatch=url.pathname.match(/^\/api\/admin\/colleges\/([^/]+)\/copy$/);if(copyMatch&&request.method==='POST')return copyCollege(request,env,user,copyMatch[1]);
  const match=url.pathname.match(/^\/api\/admin\/(universities|colleges|departments|phases|sections|subjects|lectures)(?:\/([^/]+))?$/);if(!match)return null;const config=resources[match[1]];const id=match[2];
  if(!id&&request.method==='POST'){
    const parsed=await readBody(request);if(parsed.response)return parsed.response;const value=parsed.value||{};if(!validName(value.name))return fail('VALIDATION',`اسم ${config.label} يجب أن يكون بين حرفين و120 حرفًا`);
    let parentId=null;let context={platformId:'platform'};if(config.parent){parentId=String(value[config.parent.field]||'');context=await resolveScope(env,config.parent.scopeType,parentId);if(!context)return fail('VALIDATION',`${config.parent.label} المحددة غير موجودة`)}if(!(await authorize(env,user,context)))return fail('FORBIDDEN','لا تملك صلاحية تعديل هذا النطاق',403);
    const newId=crypto.randomUUID();const displayName=value.name.trim();let insert;
    if(config.displayColumn)insert=env.DB.prepare(`INSERT INTO ${config.table}(id,name,${config.displayColumn},sort_order,${config.parent.column}) SELECT ?,?,?,COALESCE(MAX(sort_order),0)+1,? FROM ${config.table} WHERE ${config.parent.column}=?`).bind(newId,`${config.entity}:${newId}`,displayName,parentId,parentId);
    else if(config.parent)insert=env.DB.prepare(`INSERT INTO ${config.table}(id,name,sort_order,${config.parent.column}) SELECT ?,?,COALESCE(MAX(sort_order),0)+1,? FROM ${config.table} WHERE ${config.parent.column}=?`).bind(newId,displayName,parentId,parentId);
    else insert=env.DB.prepare(`INSERT INTO ${config.table}(id,name,sort_order) SELECT ?,?,COALESCE(MAX(sort_order),0)+1 FROM ${config.table}`).bind(newId,displayName);
    try{await env.DB.batch([insert,auditStatement(env,user,config.entity,newId,'create',{name:displayName,...(config.parent?{[config.parent.field]:parentId}:{})})])}catch{return fail('DUPLICATE',`يوجد ${config.label} بهذا الاسم بالفعل`,409)}return json({id:newId,name:displayName},201);
  }
  if(id&&request.method==='PATCH'){
    const context=await resolveScope(env,config.scopeType,id);if(!context)return fail('NOT_FOUND',`${config.label} غير موجودة`,404);if(!(await authorize(env,user,context)))return fail('FORBIDDEN','هذا العنصر خارج نطاق صلاحيتك',403);const parsed=await readBody(request);if(parsed.response)return parsed.response;const value=parsed.value||{};if(!validName(value.name))return fail('VALIDATION',`اسم ${config.label} غير صالح`);
    const statements=[env.DB.prepare(`UPDATE ${config.table} SET ${config.displayColumn||'name'}=? WHERE id=?`).bind(value.name.trim(),id)];if(config.entity==='subject')statements.push(env.DB.prepare(`UPDATE tests SET subject=?,updated_at=CURRENT_TIMESTAMP WHERE subject_id=?`).bind(value.name.trim(),id));if(config.entity==='lecture')statements.push(env.DB.prepare(`UPDATE tests SET lecture=?,updated_at=CURRENT_TIMESTAMP WHERE lecture_id=?`).bind(value.name.trim(),id));statements.push(auditStatement(env,user,config.entity,id,'update',{name:value.name.trim()}));try{await env.DB.batch(statements)}catch{return fail('DUPLICATE',`يوجد ${config.label} بهذا الاسم بالفعل`,409)}return json({updated:true});
  }
  if(id&&request.method==='DELETE'){
    const context=await resolveScope(env,config.scopeType,id);if(!context)return fail('NOT_FOUND',`${config.label} غير موجودة`,404);if(!(await authorizeDelete(env,user,context)))return fail('FORBIDDEN','تحتاج صلاحية حذف مستقلة ضمن هذا النطاق',403);const row=await resourceName(env,config,id);if(!row)return fail('NOT_FOUND',`${config.label} غير موجودة`,404);const batchId=crypto.randomUUID();const statements=[env.DB.prepare(`INSERT INTO academic_deletions(id,resource_type,resource_id,resource_name,deleted_by,details_json) VALUES(?,?,?,?,?,?)`).bind(batchId,config.entity,id,row.name,user.id,JSON.stringify({scope:context})),...deletionItemStatements(env,batchId,config.entity,id),auditStatement(env,user,config.entity,id,'soft_delete',{batchId,name:row.name})];try{await env.DB.batch(statements)}catch{return fail('DELETE_CONFLICT','تعذر نقل العنصر إلى سلة المحذوفات',409)}return json({deleted:true,batchId});
  }
  return null;
}
