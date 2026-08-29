export const PERMISSIONS=['manage_catalog','delete_catalog','manage_tests','manage_students','manage_teachers','view_reports','import_questions','use_media','export_results','manage_glimpses','manage_library','view_library_log','view_student_log','view_audit_log','view_account_log','request_student_ban','review_student_ban','view_student_ban_log'];

export function parsePermissions(value){try{const parsed=typeof value==='string'?JSON.parse(value):value;return Array.isArray(parsed)?parsed.filter(permission=>PERMISSIONS.includes(permission)):[]}catch{return []}}
export async function loadGrants(env,userId){const rows=await env.DB.prepare(`SELECT id,grant_role AS grantRole,scope_type AS scopeType,scope_id AS scopeId,permissions_json AS permissions FROM user_grants WHERE user_id=?`).bind(userId).all();return rows.results.map(row=>({...row,permissions:parsePermissions(row.permissions)}))}
export function grantMatches(grant,context){if(grant.scopeType==='platform')return true;return String(context?.[`${grant.scopeType}Id`]||'')===String(grant.scopeId)}
export function permittedWith(grants,permission,context){return grants.some(grant=>grant.permissions.includes(permission)&&grantMatches(grant,context))}
export async function hasPermission(env,user,permission,context={}){if(user?.role==='owner')return true;if(!['admin','teacher'].includes(user?.role))return false;return permittedWith(await loadGrants(env,user.id),permission,context)}

export async function resolveScope(env,scopeType,scopeId){
  if(scopeType==='platform')return scopeId==='platform'?{platformId:'platform'}:null;
  const queries={
    university:[`SELECT id AS universityId FROM universities WHERE id=?`,[scopeId]],
    college:[`SELECT u.id AS universityId,c.id AS collegeId FROM colleges c JOIN universities u ON u.id=c.university_id WHERE c.id=?`,[scopeId]],
    department:[`SELECT u.id AS universityId,c.id AS collegeId,d.id AS departmentId FROM departments d JOIN colleges c ON c.id=d.college_id JOIN universities u ON u.id=c.university_id WHERE d.id=?`,[scopeId]],
    phase:[`SELECT u.id AS universityId,c.id AS collegeId,d.id AS departmentId,p.id AS phaseId FROM phases p JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id JOIN universities u ON u.id=c.university_id WHERE p.id=?`,[scopeId]],
    section:[`SELECT u.id AS universityId,c.id AS collegeId,d.id AS departmentId,p.id AS phaseId,x.id AS sectionId FROM sections x JOIN phases p ON p.id=x.phase_id JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id JOIN universities u ON u.id=c.university_id WHERE x.id=?`,[scopeId]],
    subject:[`SELECT u.id AS universityId,c.id AS collegeId,d.id AS departmentId,p.id AS phaseId,s.id AS subjectId FROM subjects s JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id JOIN universities u ON u.id=c.university_id WHERE s.id=?`,[scopeId]],
    lecture:[`SELECT u.id AS universityId,c.id AS collegeId,d.id AS departmentId,p.id AS phaseId,s.id AS subjectId,l.id AS lectureId FROM lectures l JOIN subjects s ON s.id=l.subject_id JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id JOIN universities u ON u.id=c.university_id WHERE l.id=?`,[scopeId]]
  };
  const query=queries[scopeType];return query?env.DB.prepare(query[0]).bind(...query[1]).first():null;
}

export async function mayDelegate(env,actor,permissions,context){
  if(actor?.role==='owner')return true;if(actor?.role!=='admin')return false;const grants=await loadGrants(env,actor.id);if(!permittedWith(grants,'manage_teachers',context))return false;return permissions.every(permission=>permittedWith(grants,permission,context));
}
