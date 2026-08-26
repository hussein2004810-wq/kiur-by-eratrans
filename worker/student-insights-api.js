function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}})}
function fail(code,message,status=400){return json({error:{code,message}},status)}
function denyUser(user){return user?null:fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401)}
function denyAdmin(user){return user?.role==='admin'?null:fail('FORBIDDEN','هذه العملية للمشرف فقط',403)}

export async function handleStudentInsightsApi(request,env,url,user){
  const review=url.pathname.match(/^\/api\/attempts\/([^/]+)\/review$/);
  if(review&&request.method==='GET'){
    const denied=denyUser(user);if(denied)return denied;
    const attempt=await env.DB.prepare(`SELECT a.id,a.score,a.max_score AS maxScore,a.percentage,a.finished_at AS finishedAt,t.title,t.pass_percentage AS passPercentage FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.id=? AND a.user_id=? AND a.status='submitted'`).bind(review[1],user.id).first();
    if(!attempt)return fail('NOT_FOUND','مراجعة المحاولة غير متاحة',404);
    const questions=await env.DB.prepare(`SELECT q.id,q.text,q.options_json,q.correct_option AS correctOption,q.explanation,q.position,aa.selected_option AS selectedOption FROM attempts a JOIN questions q ON q.test_id=a.test_id LEFT JOIN attempt_answers aa ON aa.attempt_id=a.id AND aa.question_id=q.id WHERE a.id=? AND a.user_id=? ORDER BY q.position`).bind(review[1],user.id).all();
    return json({...attempt,passed:Number(attempt.percentage)>=Number(attempt.passPercentage),questions:questions.results.map(item=>({...item,options:JSON.parse(item.options_json),selectedOption:item.selectedOption===null?null:Number(item.selectedOption),correctOption:Number(item.correctOption),isCorrect:item.selectedOption!==null&&Number(item.selectedOption)===Number(item.correctOption)}))});
  }

  if(url.pathname==='/api/admin/students'&&request.method==='GET'){
    const denied=denyAdmin(user);if(denied)return denied;
    const limit=Math.min(100,Math.max(10,Number(url.searchParams.get('limit'))||50));const offset=Math.max(0,Number(url.searchParams.get('offset'))||0);const search=(url.searchParams.get('q')||'').trim().slice(0,80);const like=`%${search}%`;
    const where=search?`u.role='student' AND (u.name LIKE ? OR u.email LIKE ?)`:`u.role='student'`;
    const countStatement=env.DB.prepare(`SELECT count(*) AS total FROM users u WHERE ${where}`);const count=await (search?countStatement.bind(like,like):countStatement).first();
    const sql=`SELECT u.id,u.name,u.email,u.created_at AS registeredAt,d.name AS departmentName,p.name AS phaseName,count(a.id) AS attempts,COALESCE(round(avg(a.percentage),2),0) AS averagePercentage,COALESCE(sum(CASE WHEN a.percentage>=t.pass_percentage THEN 1 ELSE 0 END),0) AS passedAttempts,max(a.finished_at) AS lastActivity FROM users u LEFT JOIN departments d ON d.id=u.department_id LEFT JOIN phases p ON p.id=u.phase_id LEFT JOIN attempts a ON a.user_id=u.id AND a.status='submitted' LEFT JOIN tests t ON t.id=a.test_id WHERE ${where} GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    const statement=env.DB.prepare(sql);const values=search?[like,like,limit,offset]:[limit,offset];const result=await statement.bind(...values).all();
    return json({data:result.results,total:Number(count?.total||0),limit,offset});
  }
  return null;
}
