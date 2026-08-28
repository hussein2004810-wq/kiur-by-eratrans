import {loadGrants} from './access-control.js';
import {secureHeaders} from './security.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})})}
function fail(code,message,status=400){return json({error:{code,message}},status)}
async function allowed(env,user,permission,platformOnly=false){if(user?.role==='owner')return true;if(!['admin','teacher'].includes(user?.role))return false;const grants=await loadGrants(env,user.id);return grants.some(grant=>grant.permissions.includes(permission)&&(!platformOnly||grant.scopeType==='platform'))}

export async function handleLogsApi(request,env,url,user){
  if(!url.pathname.startsWith('/api/admin/logs/')||request.method!=='GET')return null;
  const limit=Math.min(500,Math.max(25,Number(url.searchParams.get('limit'))||200));const q=String(url.searchParams.get('q')||'').trim().slice(0,80);const like=`%${q}%`;
  if(url.pathname==='/api/admin/logs/audit'){
    if(!(await allowed(env,user,'view_audit_log',true)))return fail('FORBIDDEN','سجل التدقيق الشامل يتطلب صلاحية على مستوى المنصة',403);
    const statement=env.DB.prepare(`SELECT a.id,a.entity,a.entity_id AS entityId,a.action,a.at,a.details_json AS detailsJson,u.name AS actorName,u.email AS actorEmail FROM audit_logs a LEFT JOIN users u ON u.id=a.by_user_id WHERE a.entity!='media' AND (?='' OR u.name LIKE ? OR u.email LIKE ? OR a.entity LIKE ? OR a.action LIKE ?) ORDER BY a.at DESC LIMIT ?`).bind(q,like,like,like,like,limit);const rows=await statement.all();return json({data:rows.results});
  }
  if(url.pathname==='/api/admin/logs/accounts'){
    if(!(await allowed(env,user,'view_account_log',true)))return fail('FORBIDDEN','سجل الحسابات يتطلب صلاحية على مستوى المنصة',403);
    await env.DB.prepare(`DELETE FROM account_events WHERE at<datetime('now','-12 months')`).run();const rows=await env.DB.prepare(`SELECT e.id,e.account_code AS accountCode,e.event_type AS eventType,e.outcome,e.device_hash AS deviceHash,e.at,e.details_json AS detailsJson,u.name,u.email,u.account_role AS role,v.name AS universityName,c.name AS collegeName,COALESCE(d.display_name,d.name) AS departmentName FROM account_events e LEFT JOIN users u ON u.id=e.user_id LEFT JOIN universities v ON v.id=u.university_id LEFT JOIN colleges c ON c.id=u.college_id LEFT JOIN departments d ON d.id=u.department_id WHERE (?='' OR u.name LIKE ? OR u.email LIKE ? OR e.account_code LIKE ?) ORDER BY e.at DESC LIMIT ?`).bind(q,like,like,like,limit).all();return json({data:rows.results,retentionMonths:12});
  }
  return null;
}
