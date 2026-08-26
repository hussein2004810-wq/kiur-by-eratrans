function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
function fail(code,message,status=400){return json({error:{code,message}},status)}
async function readBody(request){try{return await request.json()}catch{return null}}
function denyUser(user){return user?null:fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401)}
function denyAdmin(user){return user?.role==='admin'?null:fail('FORBIDDEN','هذه العملية للمشرف فقط',403)}

async function catalog(env){
  const [departments,phases,subjects,lectures]=await Promise.all([
    env.DB.prepare(`SELECT id,name,sort_order AS sortOrder FROM departments ORDER BY sort_order,name`).all(),
    env.DB.prepare(`SELECT id,department_id AS departmentId,name,sort_order AS sortOrder FROM phases ORDER BY sort_order,name`).all(),
    env.DB.prepare(`SELECT id,phase_id AS phaseId,name,sort_order AS sortOrder FROM subjects ORDER BY sort_order,name`).all(),
    env.DB.prepare(`SELECT id,subject_id AS subjectId,name,sort_order AS sortOrder FROM lectures ORDER BY sort_order,name`).all()
  ]);
  return {departments:departments.results,phases:phases.results,subjects:subjects.results,lectures:lectures.results};
}

async function resolvePath(env,value){
  if(!value?.departmentId||!value?.phaseId||!value?.subjectId||!value?.lectureId)return null;
  return env.DB.prepare(`SELECT d.id AS departmentId,d.name AS departmentName,p.id AS phaseId,p.name AS phaseName,s.id AS subjectId,s.name AS subjectName,l.id AS lectureId,l.name AS lectureName FROM lectures l JOIN subjects s ON s.id=l.subject_id JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id WHERE d.id=? AND p.id=? AND s.id=? AND l.id=?`).bind(value.departmentId,value.phaseId,value.subjectId,value.lectureId).first();
}

function validateQuestions(value){
  if(!value||typeof value.title!=='string'||value.title.trim().length<3)return 'عنوان الاختبار قصير';
  if(!Number.isInteger(Number(value.durationMinutes))||Number(value.durationMinutes)<1||Number(value.durationMinutes)>360)return 'مدة الاختبار غير صالحة';
  if(!Array.isArray(value.questions)||value.questions.length<1)return 'أضف سؤالًا واحدًا على الأقل';
  for(const question of value.questions){
    if(!question.text||!Array.isArray(question.options)||question.options.length<2)return 'بيانات أحد الأسئلة غير مكتملة';
    if(question.options.some(option=>!String(option).trim()))return 'لا يمكن ترك خيار فارغ';
    if(!Number.isInteger(Number(question.correctOption))||question.correctOption<0||question.correctOption>=question.options.length)return 'الإجابة الصحيحة غير صالحة';
  }
  return null;
}

const testSelect=`SELECT t.id,t.title,t.subject,t.lecture,t.duration_minutes AS durationMinutes,t.pass_percentage AS passPercentage,t.status,t.updated_at AS updatedAt,t.department_id AS departmentId,t.phase_id AS phaseId,t.subject_id AS subjectId,t.lecture_id AS lectureId,COALESCE(d.name,'') AS departmentName,COALESCE(p.name,'') AS phaseName,COALESCE(s.name,t.subject) AS subjectName,COALESCE(l.name,t.lecture) AS lectureName,count(q.id) AS questionCount FROM tests t LEFT JOIN departments d ON d.id=t.department_id LEFT JOIN phases p ON p.id=t.phase_id LEFT JOIN subjects s ON s.id=t.subject_id LEFT JOIN lectures l ON l.id=t.lecture_id LEFT JOIN questions q ON q.test_id=t.id`;

export async function handleHierarchyApi(request,env,url,user){
  if(url.pathname==='/api/catalog'&&request.method==='GET'){
    const denied=denyUser(user);if(denied)return denied;
    return json(await catalog(env));
  }

  if(url.pathname==='/api/me'&&request.method==='GET'){
    const denied=denyUser(user);if(denied)return denied;
    const profile=await env.DB.prepare(`SELECT u.department_id AS departmentId,u.phase_id AS phaseId,d.name AS departmentName,p.name AS phaseName FROM users u LEFT JOIN departments d ON d.id=u.department_id LEFT JOIN phases p ON p.id=u.phase_id WHERE u.id=?`).bind(user.id).first();
    return json({user:{...user,...profile}});
  }

  if(url.pathname==='/api/me/profile'&&request.method==='PATCH'){
    const denied=denyUser(user);if(denied)return denied;
    const value=await readBody(request);
    const phase=await env.DB.prepare(`SELECT id FROM phases WHERE id=? AND department_id=?`).bind(value?.phaseId||'',value?.departmentId||'').first();
    if(!phase)return fail('VALIDATION','اختر قسمًا ومرحلة صحيحة');
    await env.DB.batch([
      env.DB.prepare(`UPDATE users SET department_id=?,phase_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(value.departmentId,value.phaseId,user.id),
      env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('user',?,'update_profile',?,?)`).bind(user.id,user.id,JSON.stringify({departmentId:value.departmentId,phaseId:value.phaseId}))
    ]);
    return json({updated:true});
  }

  if(url.pathname==='/api/tests'&&request.method==='GET'){
    const denied=denyUser(user);if(denied)return denied;
    const filters=[];const binds=[];
    for(const [param,column] of [['departmentId','t.department_id'],['phaseId','t.phase_id'],['subjectId','t.subject_id'],['lectureId','t.lecture_id']]){
      const value=url.searchParams.get(param);if(value){filters.push(`${column}=?`);binds.push(value)}
    }
    const q=url.searchParams.get('q')?.trim();
    if(q){filters.push(`(t.title LIKE ? OR t.subject LIKE ? OR t.lecture LIKE ? OR s.name LIKE ? OR l.name LIKE ?)`);for(let i=0;i<5;i++)binds.push(`%${q}%`)}
    const where=[`t.status='published'`,...filters].join(' AND ');
    const statement=env.DB.prepare(`${testSelect} WHERE ${where} GROUP BY t.id ORDER BY t.created_at DESC`);
    const result=await (binds.length?statement.bind(...binds):statement).all();
    return json({data:result.results});
  }

  if(url.pathname==='/api/admin/tests'&&request.method==='GET'){
    const denied=denyAdmin(user);if(denied)return denied;
    const result=await env.DB.prepare(`${testSelect} WHERE t.status!='archived' GROUP BY t.id ORDER BY t.created_at DESC`).all();
    return json({data:result.results});
  }

  if(url.pathname==='/api/admin/tests'&&request.method==='POST'){
    const denied=denyAdmin(user);if(denied)return denied;
    const value=await readBody(request);const issue=validateQuestions(value);if(issue)return fail('VALIDATION',issue);
    const path=await resolvePath(env,value);if(!path)return fail('VALIDATION','المسار الأكاديمي المختار غير صالح');
    const id=crypto.randomUUID();
    const statements=[env.DB.prepare(`INSERT INTO tests(id,title,subject,lecture,duration_minutes,pass_percentage,status,created_by,department_id,phase_id,subject_id,lecture_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,value.title.trim(),path.subjectName,path.lectureName,Number(value.durationMinutes),Number(value.passPercentage??60),value.status||'published',user.id,path.departmentId,path.phaseId,path.subjectId,path.lectureId)];
    value.questions.forEach((question,index)=>statements.push(env.DB.prepare(`INSERT INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES(?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),id,question.text.trim(),JSON.stringify(question.options.map(String)),Number(question.correctOption),question.explanation?.trim()||null,index+1)));
    statements.push(env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('test',?,'create',?,?)`).bind(id,user.id,JSON.stringify({title:value.title,path})));
    await env.DB.batch(statements);return json({id},201);
  }

  const adminTest=url.pathname.match(/^\/api\/admin\/tests\/([^/]+)$/);
  if(adminTest&&request.method==='GET'){
    const denied=denyAdmin(user);if(denied)return denied;
    const test=await env.DB.prepare(`SELECT id,title,subject,lecture,duration_minutes AS durationMinutes,pass_percentage AS passPercentage,status,department_id AS departmentId,phase_id AS phaseId,subject_id AS subjectId,lecture_id AS lectureId FROM tests WHERE id=? AND status!='archived'`).bind(adminTest[1]).first();
    if(!test)return fail('NOT_FOUND','الاختبار غير موجود',404);
    const questions=await env.DB.prepare(`SELECT id,text,options_json,correct_option AS correctOption,explanation,position FROM questions WHERE test_id=? ORDER BY position`).bind(test.id).all();
    return json({...test,questions:questions.results.map(question=>({...question,options:JSON.parse(question.options_json)}))});
  }

  if(adminTest&&request.method==='PUT'){
    const denied=denyAdmin(user);if(denied)return denied;
    const value=await readBody(request);const issue=validateQuestions(value);if(issue)return fail('VALIDATION',issue);
    const path=await resolvePath(env,value);if(!path)return fail('VALIDATION','المسار الأكاديمي المختار غير صالح');
    const exists=await env.DB.prepare(`SELECT id FROM tests WHERE id=? AND status!='archived'`).bind(adminTest[1]).first();
    if(!exists)return fail('NOT_FOUND','الاختبار غير موجود',404);
    const statements=[
      env.DB.prepare(`UPDATE tests SET title=?,subject=?,lecture=?,duration_minutes=?,pass_percentage=?,status=?,department_id=?,phase_id=?,subject_id=?,lecture_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(value.title.trim(),path.subjectName,path.lectureName,Number(value.durationMinutes),Number(value.passPercentage??60),value.status||'published',path.departmentId,path.phaseId,path.subjectId,path.lectureId,adminTest[1]),
      env.DB.prepare(`DELETE FROM questions WHERE test_id=?`).bind(adminTest[1])
    ];
    value.questions.forEach((question,index)=>statements.push(env.DB.prepare(`INSERT INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES(?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),adminTest[1],question.text.trim(),JSON.stringify(question.options.map(String)),Number(question.correctOption),question.explanation?.trim()||null,index+1)));
    statements.push(env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('test',?,'update',?,?)`).bind(adminTest[1],user.id,JSON.stringify({title:value.title,path})));
    await env.DB.batch(statements);return json({updated:true});
  }

  return null;
}
