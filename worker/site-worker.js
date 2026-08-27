import {handleHierarchyApi} from './hierarchy-api.js';
import {handleCatalogAdminApi} from './catalog-admin-api.js';
import {handleStudentInsightsApi} from './student-insights-api.js';
import {serveSharePage} from './share-page.js';
import {buildAttemptOrders,parseOptionOrders,parseOrder,presentQuestions,toDisplayOption,toOriginalOption} from './attempt-shuffle.js';

const files = new Map(/*__STATIC_FILES__*/);
const ADMIN_EMAIL = 'hussein2004810@gmail.com';
let schemaReady = false;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS tests (id TEXT PRIMARY KEY,title TEXT NOT NULL,subject TEXT NOT NULL,lecture TEXT NOT NULL,duration_minutes INTEGER NOT NULL,pass_percentage INTEGER NOT NULL DEFAULT 60,shuffle_questions INTEGER NOT NULL DEFAULT 0,shuffle_options INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'published',created_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY,test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,text TEXT NOT NULL,options_json TEXT NOT NULL,correct_option INTEGER NOT NULL,explanation TEXT,position INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS attempts (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),test_id TEXT NOT NULL REFERENCES tests(id),status TEXT NOT NULL DEFAULT 'in_progress',score INTEGER,max_score INTEGER,percentage REAL,question_order_json TEXT,option_orders_json TEXT,started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,finished_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS attempt_answers (attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,selected_option INTEGER NOT NULL,is_correct INTEGER,answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(attempt_id,question_id))`,
  `CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT,entity TEXT NOT NULL,entity_id TEXT NOT NULL,action TEXT NOT NULL,by_user_id TEXT NOT NULL,at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,details_json TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_tests_status_created ON tests(status,created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_questions_test_position ON questions(test_id,position)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_user_finished ON attempts(user_id,finished_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_test_status ON attempts(test_id,status)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_logs(at DESC)`,
  `INSERT OR IGNORE INTO tests(id,title,subject,lecture,duration_minutes,pass_percentage,status,created_by) VALUES('demo-preop','تقييم المريض قبل العملية','التخدير العام','المحاضرة الثالثة',25,60,'published','system')`,
  `INSERT OR IGNORE INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES('demo-q1','demo-preop','أي تصنيف من تصنيفات ASA يصف مريضًا لديه مرض جهازي شديد يحد من نشاطه؟','["ASA I","ASA II","ASA III","ASA IV"]',2,'يصنف هذا المريض ASA III بسبب وجود مرض جهازي شديد يحد من النشاط.',1)`,
  `INSERT OR IGNORE INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES('demo-q2','demo-preop','ما الإجراء الأكثر أهمية ضمن التقييم الأولي لمجرى الهواء؟','["قياس ضغط الدم فقط","تقييم فتحة الفم وحركة الرقبة","قياس سكر الدم","تحديد فصيلة الدم"]',1,'تقييم فتحة الفم وحركة الرقبة يساعد على توقع صعوبة التنبيب.',2)`,
  `INSERT OR IGNORE INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES('demo-q3','demo-preop','أي مما يأتي يجب توثيقه قبل بدء التخدير؟','["الموافقة المستنيرة وخطة التخدير","اسم الممرض فقط","موعد الخروج المتوقع فقط","نوع الغرفة"]',0,'يجب توثيق الموافقة المستنيرة وخطة التخدير قبل الإجراء.',3)`,
];

function response(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
function error(code,message,status=400){return response({error:{code,message}},status)}
function decodeName(request,email){
  const raw=request.headers.get('oai-authenticated-user-full-name');
  const encoding=request.headers.get('oai-authenticated-user-full-name-encoding');
  if(raw&&encoding==='percent-encoded-utf-8'){try{return decodeURIComponent(raw)}catch{}}
  return email.split('@')[0];
}
function identity(request){
  const id=request.headers.get('oai-authenticated-user-id');
  const email=request.headers.get('oai-authenticated-user-email')?.toLowerCase();
  if(!id||!email)return null;
  return {id,email,name:decodeName(request,email),role:email===ADMIN_EMAIL?'admin':'student'};
}
async function ensureSchema(env){
  if(schemaReady)return;
  if(!env.DB)throw new Error('D1 binding DB is missing');
  await env.DB.batch(schemaStatements.map(sql=>env.DB.prepare(sql)));
  schemaReady=true;
}
async function upsertUser(env,user){
  await env.DB.prepare(`INSERT INTO users(id,email,name,role) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,role=excluded.role,updated_at=CURRENT_TIMESTAMP WHERE users.email<>excluded.email OR users.name<>excluded.name OR users.role<>excluded.role`).bind(user.id,user.email,user.name,user.role).run();
}
async function body(request){try{return await request.json()}catch{return null}}
function validTest(value){
  if(!value||typeof value.title!=='string'||value.title.trim().length<3)return 'عنوان الاختبار قصير';
  if(!value.subject||!value.lecture)return 'المادة والمحاضرة مطلوبتان';
  if(!Number.isInteger(Number(value.durationMinutes))||Number(value.durationMinutes)<1)return 'مدة الاختبار غير صالحة';
  if(!Array.isArray(value.questions)||value.questions.length<1)return 'أضف سؤالًا واحدًا على الأقل';
  for(const question of value.questions){
    if(!question.text||!Array.isArray(question.options)||question.options.length<2)return 'بيانات أحد الأسئلة غير مكتملة';
    if(question.options.some(option=>!String(option).trim()))return 'لا يمكن ترك خيار فارغ';
    if(!Number.isInteger(Number(question.correctOption))||question.correctOption<0||question.correctOption>=question.options.length)return 'الإجابة الصحيحة غير صالحة';
  }
  return null;
}
function requireUser(user){return user?null:error('UNAUTHENTICATED','سجّل الدخول للمتابعة',401)}
function requireAdmin(user){return user?.role==='admin'?null:error('FORBIDDEN','هذه العملية للمشرف فقط',403)}

function decodeQuestions(rows){return rows.map(question=>({...question,options:JSON.parse(question.options_json)}))}
async function latestOrders(env,userId,testId,excludeId=''){
  const previous=await env.DB.prepare(`SELECT question_order_json AS questionOrder,option_orders_json AS optionOrders FROM attempts WHERE user_id=? AND test_id=? AND id<>? AND question_order_json IS NOT NULL ORDER BY started_at DESC LIMIT 1`).bind(userId,testId,excludeId).first();
  return previous||{};
}
async function createOrders(env,userId,test,questions,excludeId=''){
  const previous=await latestOrders(env,userId,test.id,excludeId);
  return buildAttemptOrders(questions,{shuffleQuestions:Boolean(test.shuffleQuestions),shuffleOptions:Boolean(test.shuffleOptions)},previous);
}

async function handleApi(request,env,url){
  await ensureSchema(env);
  const user=identity(request);
  if(user)await upsertUser(env,user);
  if(!['GET','HEAD'].includes(request.method)){
    const origin=request.headers.get('origin');
    if(origin&&origin!==url.origin)return error('INVALID_ORIGIN','طلب غير مسموح',403);
  }

  const studentInsightsResponse=await handleStudentInsightsApi(request,env,url,user);
  if(studentInsightsResponse)return studentInsightsResponse;

  const catalogAdminResponse=await handleCatalogAdminApi(request,env,url,user);
  if(catalogAdminResponse)return catalogAdminResponse;

  const hierarchyResponse=await handleHierarchyApi(request,env,url,user);
  if(hierarchyResponse)return hierarchyResponse;

  if(url.pathname==='/api/me'&&request.method==='GET'){
    if(!user)return error('UNAUTHENTICATED','سجّل الدخول للمتابعة',401);
    return response({user});
  }
  if(url.pathname==='/api/tests'&&request.method==='GET'){
    const denied=requireUser(user);if(denied)return denied;
    const data=await env.DB.prepare(`SELECT t.id,t.title,t.subject,t.lecture,t.duration_minutes AS durationMinutes,t.pass_percentage AS passPercentage,count(q.id) AS questionCount FROM tests t LEFT JOIN questions q ON q.test_id=t.id WHERE t.status='published' GROUP BY t.id ORDER BY t.created_at DESC`).all();
    return response({data:data.results});
  }
  const publicTest=url.pathname.match(/^\/api\/tests\/([^/]+)$/);
  if(publicTest&&request.method==='GET'){
    const denied=requireUser(user);if(denied)return denied;
    const test=await env.DB.prepare(`SELECT id,title,subject,lecture,duration_minutes AS durationMinutes,pass_percentage AS passPercentage FROM tests WHERE id=? AND status='published'`).bind(publicTest[1]).first();
    if(!test)return error('NOT_FOUND','الاختبار غير موجود',404);
    const list=await env.DB.prepare(`SELECT id,text,options_json,position FROM questions WHERE test_id=? ORDER BY position`).bind(test.id).all();
    const questions=decodeQuestions(list.results);const attemptId=url.searchParams.get('attemptId');
    if(!attemptId)return response({...test,questions});
    const attempt=await env.DB.prepare(`SELECT id,question_order_json AS questionOrder,option_orders_json AS optionOrders FROM attempts WHERE id=? AND user_id=? AND test_id=? AND status='in_progress'`).bind(attemptId,user.id,test.id).first();
    if(!attempt)return error('ATTEMPT_NOT_FOUND','المحاولة غير موجودة أو منتهية',404);
    const questionOrder=parseOrder(attempt.questionOrder,questions.map(question=>question.id));const optionOrders=parseOptionOrders(attempt.optionOrders);
    const answerRows=await env.DB.prepare(`SELECT question_id AS questionId,selected_option AS selectedOption FROM attempt_answers WHERE attempt_id=?`).bind(attempt.id).all();
    const questionById=new Map(questions.map(question=>[question.id,question]));const savedAnswers={};
    for(const answer of answerRows.results){const question=questionById.get(answer.questionId);if(question){const displayIndex=toDisplayOption(Number(answer.selectedOption),question,optionOrders);if(displayIndex>=0)savedAnswers[answer.questionId]=displayIndex}}
    return response({...test,questions:presentQuestions(questions,questionOrder,optionOrders),savedAnswers});
  }
  if(url.pathname==='/api/attempts'&&request.method==='POST'){
    const denied=requireUser(user);if(denied)return denied;
    const value=await body(request);if(!value?.testId)return error('VALIDATION','الاختبار مطلوب');
    const test=await env.DB.prepare(`SELECT id,shuffle_questions AS shuffleQuestions,shuffle_options AS shuffleOptions FROM tests WHERE id=? AND status='published'`).bind(value.testId).first();
    if(!test)return error('NOT_FOUND','الاختبار غير متاح',404);
    const questionRows=await env.DB.prepare(`SELECT id,options_json FROM questions WHERE test_id=? ORDER BY position`).bind(test.id).all();const questions=decodeQuestions(questionRows.results);
    const existing=await env.DB.prepare(`SELECT id,test_id AS testId,started_at AS startedAt,question_order_json AS questionOrder,option_orders_json AS optionOrders FROM attempts WHERE user_id=? AND test_id=? AND status='in_progress' ORDER BY started_at DESC LIMIT 1`).bind(user.id,value.testId).first();
    if(existing){if(!existing.questionOrder||!existing.optionOrders){const orders=await createOrders(env,user.id,test,questions,existing.id);await env.DB.prepare(`UPDATE attempts SET question_order_json=?,option_orders_json=? WHERE id=?`).bind(JSON.stringify(orders.questionOrder),JSON.stringify(orders.optionOrders),existing.id).run()}return response({attempt:existing,resumed:true})}
    const id=crypto.randomUUID();
    const orders=await createOrders(env,user.id,test,questions);
    await env.DB.prepare(`INSERT INTO attempts(id,user_id,test_id,question_order_json,option_orders_json) VALUES(?,?,?,?,?)`).bind(id,user.id,value.testId,JSON.stringify(orders.questionOrder),JSON.stringify(orders.optionOrders)).run();
    return response({attempt:{id,testId:value.testId},resumed:false},201);
  }
  const saveAnswer=url.pathname.match(/^\/api\/attempts\/([^/]+)\/answers$/);
  if(saveAnswer&&request.method==='PATCH'){
    const denied=requireUser(user);if(denied)return denied;
    const value=await body(request);
    if(!value?.questionId||!Number.isInteger(Number(value.selectedOption)))return error('VALIDATION','الإجابة غير صالحة');
    const attempt=await env.DB.prepare(`SELECT id,test_id,option_orders_json AS optionOrders FROM attempts WHERE id=? AND user_id=? AND status='in_progress'`).bind(saveAnswer[1],user.id).first();
    if(!attempt)return error('NOT_EDITABLE','المحاولة غير قابلة للتعديل',409);
    const question=await env.DB.prepare(`SELECT id,options_json FROM questions WHERE id=? AND test_id=?`).bind(value.questionId,attempt.test_id).first();
    if(!question)return error('BAD_QUESTION','السؤال لا يتبع الاختبار',400);
    question.options=JSON.parse(question.options_json);const selectedOption=toOriginalOption(Number(value.selectedOption),question,parseOptionOrders(attempt.optionOrders));
    if(selectedOption<0)return error('VALIDATION','الإجابة غير صالحة');
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO attempt_answers(attempt_id,question_id,selected_option) VALUES(?,?,?) ON CONFLICT(attempt_id,question_id) DO UPDATE SET selected_option=excluded.selected_option,answered_at=CURRENT_TIMESTAMP`).bind(attempt.id,value.questionId,selectedOption),
      env.DB.prepare(`UPDATE attempts SET last_saved_at=CURRENT_TIMESTAMP WHERE id=?`).bind(attempt.id)
    ]);
    return response({saved:true});
  }
  const submit=url.pathname.match(/^\/api\/attempts\/([^/]+)\/submit$/);
  if(submit&&request.method==='POST'){
    const denied=requireUser(user);if(denied)return denied;
    const attempt=await env.DB.prepare(`SELECT id,test_id FROM attempts WHERE id=? AND user_id=? AND status='in_progress'`).bind(submit[1],user.id).first();
    if(!attempt)return error('ALREADY_SUBMITTED','المحاولة منتهية أو غير موجودة',409);
    const questions=await env.DB.prepare(`SELECT q.id,q.correct_option,a.selected_option FROM questions q LEFT JOIN attempt_answers a ON a.question_id=q.id AND a.attempt_id=? WHERE q.test_id=?`).bind(attempt.id,attempt.test_id).all();
    const maxScore=questions.results.length;
    const score=questions.results.filter(q=>q.selected_option===q.correct_option).length;
    const percentage=maxScore?Math.round(score/maxScore*10000)/100:0;
    const updates=questions.results.filter(q=>q.selected_option!==null).map(q=>env.DB.prepare(`UPDATE attempt_answers SET is_correct=? WHERE attempt_id=? AND question_id=?`).bind(q.selected_option===q.correct_option?1:0,attempt.id,q.id));
    updates.push(env.DB.prepare(`UPDATE attempts SET status='submitted',score=?,max_score=?,percentage=?,finished_at=CURRENT_TIMESTAMP,last_saved_at=CURRENT_TIMESTAMP WHERE id=?`).bind(score,maxScore,percentage,attempt.id));
    await env.DB.batch(updates);
    return response({score,maxScore,percentage});
  }
  if(url.pathname==='/api/me/history'&&request.method==='GET'){
    const denied=requireUser(user);if(denied)return denied;
    const history=await env.DB.prepare(`SELECT a.id,t.title,t.subject,a.score,a.max_score AS maxScore,a.percentage,a.started_at AS startedAt,a.finished_at AS finishedAt,CASE WHEN a.percentage>=t.pass_percentage THEN 1 ELSE 0 END AS passed FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.user_id=? AND a.status='submitted' ORDER BY a.finished_at DESC LIMIT 100`).bind(user.id).all();
    const average=history.results.length?Math.round(history.results.reduce((sum,item)=>sum+Number(item.percentage),0)/history.results.length*100)/100:0;
    return response({data:history.results,summary:{attempts:history.results.length,averagePercentage:average}});
  }

  if(url.pathname==='/api/admin/metrics'&&request.method==='GET'){
    const denied=requireAdmin(user);if(denied)return denied;
    const metrics=await env.DB.prepare(`SELECT (SELECT count(*) FROM tests WHERE status!='archived') AS tests,(SELECT count(*) FROM users WHERE role='student') AS students,(SELECT count(*) FROM attempts) AS attempts,(SELECT round(avg(percentage),2) FROM attempts WHERE status='submitted') AS averagePercentage`).first();
    return response(metrics);
  }
  if(url.pathname==='/api/admin/audit'&&request.method==='GET'){
    const denied=requireAdmin(user);if(denied)return denied;
    const logs=await env.DB.prepare(`SELECT a.*,u.name AS actorName FROM audit_logs a LEFT JOIN users u ON u.id=a.by_user_id ORDER BY a.at DESC LIMIT 50`).all();
    return response({data:logs.results});
  }
  if(url.pathname==='/api/admin/tests'&&request.method==='GET'){
    const denied=requireAdmin(user);if(denied)return denied;
    const tests=await env.DB.prepare(`SELECT t.id,t.title,t.subject,t.lecture,t.duration_minutes AS durationMinutes,t.pass_percentage AS passPercentage,t.shuffle_questions AS shuffleQuestions,t.shuffle_options AS shuffleOptions,t.status,t.updated_at AS updatedAt,count(q.id) AS questionCount FROM tests t LEFT JOIN questions q ON q.test_id=t.id WHERE t.status!='archived' GROUP BY t.id ORDER BY t.created_at DESC`).all();
    return response({data:tests.results});
  }
  if(url.pathname==='/api/admin/tests'&&request.method==='POST'){
    const denied=requireAdmin(user);if(denied)return denied;
    const value=await body(request);const issue=validTest(value);if(issue)return error('VALIDATION',issue);
    const id=crypto.randomUUID();
    const statements=[env.DB.prepare(`INSERT INTO tests(id,title,subject,lecture,duration_minutes,pass_percentage,shuffle_questions,shuffle_options,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(id,value.title.trim(),value.subject.trim(),value.lecture.trim(),Number(value.durationMinutes),Number(value.passPercentage??60),value.shuffleQuestions?1:0,value.shuffleOptions?1:0,value.status||'published',user.id)];
    value.questions.forEach((q,index)=>statements.push(env.DB.prepare(`INSERT INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES(?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),id,q.text.trim(),JSON.stringify(q.options.map(String)),Number(q.correctOption),q.explanation?.trim()||null,index+1)));
    statements.push(env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('test',?,'create',?,?)`).bind(id,user.id,JSON.stringify({title:value.title})));
    await env.DB.batch(statements);return response({id},201);
  }
  const adminTest=url.pathname.match(/^\/api\/admin\/tests\/([^/]+)$/);
  if(adminTest&&request.method==='GET'){
    const denied=requireAdmin(user);if(denied)return denied;
    const test=await env.DB.prepare(`SELECT id,title,subject,lecture,duration_minutes AS durationMinutes,pass_percentage AS passPercentage,shuffle_questions AS shuffleQuestions,shuffle_options AS shuffleOptions,status FROM tests WHERE id=? AND status!='archived'`).bind(adminTest[1]).first();
    if(!test)return error('NOT_FOUND','الاختبار غير موجود',404);
    const questions=await env.DB.prepare(`SELECT id,text,options_json,correct_option AS correctOption,explanation,position FROM questions WHERE test_id=? ORDER BY position`).bind(test.id).all();
    return response({...test,questions:questions.results.map(q=>({...q,options:JSON.parse(q.options_json)}))});
  }
  if(adminTest&&request.method==='PUT'){
    const denied=requireAdmin(user);if(denied)return denied;
    const value=await body(request);const issue=validTest(value);if(issue)return error('VALIDATION',issue);
    const exists=await env.DB.prepare(`SELECT id FROM tests WHERE id=? AND status!='archived'`).bind(adminTest[1]).first();
    if(!exists)return error('NOT_FOUND','الاختبار غير موجود',404);
    const statements=[
      env.DB.prepare(`UPDATE tests SET title=?,subject=?,lecture=?,duration_minutes=?,pass_percentage=?,shuffle_questions=?,shuffle_options=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(value.title.trim(),value.subject.trim(),value.lecture.trim(),Number(value.durationMinutes),Number(value.passPercentage??60),value.shuffleQuestions?1:0,value.shuffleOptions?1:0,value.status||'published',adminTest[1]),
      env.DB.prepare(`DELETE FROM questions WHERE test_id=?`).bind(adminTest[1])
    ];
    value.questions.forEach((q,index)=>statements.push(env.DB.prepare(`INSERT INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES(?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),adminTest[1],q.text.trim(),JSON.stringify(q.options.map(String)),Number(q.correctOption),q.explanation?.trim()||null,index+1)));
    statements.push(env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('test',?,'update',?,?)`).bind(adminTest[1],user.id,JSON.stringify({title:value.title})));
    await env.DB.batch(statements);return response({updated:true});
  }
  if(adminTest&&request.method==='DELETE'){
    const denied=requireAdmin(user);if(denied)return denied;
    await env.DB.batch([
      env.DB.prepare(`UPDATE tests SET status='archived',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(adminTest[1]),
      env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id) VALUES('test',?,'archive',?)`).bind(adminTest[1],user.id)
    ]);
    return new Response(null,{status:204});
  }
  return error('NOT_FOUND','المسار غير موجود',404);
}

function decode(value){
  const binary=atob(value);const bytes=new Uint8Array(binary.length);
  for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);
  return bytes;
}
function serve(pathname){
  const file=files.get(pathname);if(!file)return null;
  return new Response(decode(file.body),{headers:{'content-type':file.type,'cache-control':pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache','x-content-type-options':'nosniff'}});
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    try{
      if(url.pathname.startsWith('/api/'))return await handleApi(request,env,url);
      const shared=await serveSharePage(request,env,url,serve('/index.html'));
      if(shared)return shared;
      const exact=serve(url.pathname==='/'?'/index.html':url.pathname);
      if(exact)return exact;
      if(request.method==='GET'&&!url.pathname.includes('.'))return serve('/index.html');
      return new Response('Not found',{status:404});
    }catch(cause){
      console.error('KIUR request failed',cause);
      return url.pathname.startsWith('/api/')?error('INTERNAL_ERROR','حدث خطأ غير متوقع',500):new Response('Internal error',{status:500});
    }
  }
};
