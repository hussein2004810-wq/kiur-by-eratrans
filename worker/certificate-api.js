import {secureHeaders} from './security.js';
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})})}
function fail(code,message,status=400){return json({error:{code,message}},status)}
const select=`SELECT c.id,c.verification_code AS verificationCode,c.issued_at AS issuedAt,u.name AS studentName,t.title AS testTitle,t.subject,t.lecture,a.score,a.max_score AS maxScore,a.percentage FROM certificates c JOIN users u ON u.id=c.user_id JOIN tests t ON t.id=c.test_id JOIN attempts a ON a.id=c.attempt_id`;
export async function handleCertificateApi(request,env,url,user){
  const verify=url.pathname.match(/^\/api\/certificates\/verify\/([a-f0-9]{32})$/i);if(verify&&request.method==='GET'){const certificate=await env.DB.prepare(`${select} WHERE c.verification_code=? AND c.revoked_at IS NULL`).bind(verify[1].toLowerCase()).first();return certificate?json({valid:true,certificate}):fail('NOT_FOUND','الشهادة غير موجودة أو ملغاة',404)}
  const attempt=url.pathname.match(/^\/api\/attempts\/([^/]+)\/certificate$/);if(attempt&&request.method==='GET'){if(!user)return fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401);const certificate=await env.DB.prepare(`${select} WHERE c.attempt_id=? AND c.user_id=? AND c.revoked_at IS NULL`).bind(attempt[1],user.id).first();return certificate?json({certificate,verificationUrl:`${url.origin}/verify/${certificate.verificationCode}`}):fail('NOT_FOUND','لا توجد شهادة لهذه المحاولة',404)}return null;
}
