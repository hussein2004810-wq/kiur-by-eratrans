import {handleHierarchyApi} from './hierarchy-api.js';
import {handleCatalogAdminApi} from './catalog-admin-api-v2.js';
import {handleStudentInsightsApi} from './student-insights-api.js';
import {serveSharePage} from './share-page.js';
import {buildAttemptOrders,parseOptionOrders,parseOrder,presentQuestions,toDisplayOption,toOriginalOption} from './attempt-shuffle.js';
import {enforceRateLimit,readJsonBody,secureHeaders} from './security.js';
import {handleAuthApi} from './auth-api.js';
import {resolvePasswordSession} from './password-auth.js';
import {handleAdminUsersApi} from './admin-users-api.js';
import {hasPermission} from './access-control.js';
import {handleMediaApi} from './media-api.js';
import {handleImportApi} from './import-api.js';
import {handleCertificateApi} from './certificate-api.js';

const files = new Map(/*__STATIC_FILES__*/);
let schemaReady = false;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS tests (id TEXT PRIMARY KEY,title TEXT NOT NULL,subject TEXT NOT NULL,lecture TEXT NOT NULL,duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 1 AND 360),pass_percentage INTEGER NOT NULL DEFAULT 60 CHECK(pass_percentage BETWEEN 0 AND 100),shuffle_questions INTEGER NOT NULL DEFAULT 0 CHECK(shuffle_questions IN (0,1)),shuffle_options INTEGER NOT NULL DEFAULT 0 CHECK(shuffle_options IN (0,1)),status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','archived')),created_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY,test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,text TEXT NOT NULL,options_json TEXT NOT NULL,correct_option INTEGER NOT NULL CHECK(correct_option>=0),explanation TEXT,position INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS attempts (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),test_id TEXT NOT NULL REFERENCES tests(id),status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','submitted')),score INTEGER,max_score INTEGER,percentage REAL,question_order_json TEXT,option_orders_json TEXT,started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,finished_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS attempt_answers (attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,selected_option INTEGER NOT NULL,is_correct INTEGER,answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(attempt_id,question_id))`,
  `CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT,entity TEXT NOT NULL,entity_id TEXT NOT NULL,action TEXT NOT NULL,by_user_id TEXT NOT NULL,at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,details_json TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_tests_status_created ON tests(status,created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_questions_test_position ON questions(test_id,position)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_user_finished ON attempts(user_id,finished_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_test_status ON attempts(test_id,status)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_logs(at DESC)`,
  `CREATE TABLE IF NOT EXISTS api_rate_limits (bucket_key TEXT NOT NULL,window_start INTEGER NOT NULL,count INTEGER NOT NULL DEFAULT 1 CHECK(count>=1),PRIMARY KEY(bucket_key,window_start))`,
  `CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON api_rate_limits(window_start)`,
  `INSERT OR IGNORE INTO tests(id,title,subject,lecture,duration_minutes,pass_percentage,status,created_by) VALUES('demo-preop','تقييم المريض قبل العملية','التخدير العام','المحاضرة الثالثة',25,60,'published','system')`,
  `INSERT OR IGNORE INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES('demo-q1','demo-preop','أي تصنيف من تصنيفات ASA يصف مريضًا لديه مرض جهازي شديد يحد من نشاطه؟','["ASA I","ASA II","ASA III","ASA IV"]',2,'يصنف هذا المريض ASA III بسبب وجود مرض جهازي شديد يحد من النشاط.',1)`,
  `INSERT OR IGNORE INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES('demo-q2','demo-preop','ما الإجراء الأكثر أهمية ضمن التقييم الأولي لمجرى الهواء؟','["قياس ضغط الدم فقط","تقييم فتحة الفم وحركة الرقبة","قياس سكر الدم","تحديد فصيلة الدم"]',1,'تقييم فتحة الفم وحركة الرقبة يساعد على توقع صعوبة التنبيب.',2)`,
  `INSERT OR IGNORE INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES('demo-q3','demo-preop','أي مما يأتي يجب توثيقه قبل بدء التخدير؟','["الموافقة المستنيرة وخطة التخدير","اسم الممرض فقط","موعد الخروج المتوقع فقط","نوع الغرفة"]',0,'يجب توثيق الموافقة المستنيرة وخطة التخدير قبل الإجراء.',3)`,
];

function response(data,status=200,extraHeaders={}){
  return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store',...extraHeaders})});
}
function error(code,message,status=400){return response({error:{code,message}},status)}
function decodeName(request,email){
  const raw=request.headers.get('oai-authenticated-user-full-name');
  const encoding=request.headers.get('oai-authenticated-user-full-name-encoding');
  if(raw&&encoding==='percent-encoded-utf-8'){try{return decodeURIComponent(raw)}catch{}}
  return email.split('@')[0];
}
async function chatGptIdentity(request,env){
  const providerId=request.headers.get('oai-authenticated-user-id');const email=request.headers.get('oai-authenticated-user-email')?.toLowerCase();if(!providerId||!email)return null;
  const name=decodeName(request,email);const ownerIds=new Set(String(env.OWNER_USER_IDS||env.ADMIN_USER_IDS||'').split(',').map(value=>value.trim()).filter(Boolean));const owner=ownerIds.has(providerId);
  let account=await env.DB.prepare(`SELECT u.id,u.email,u.name,u.account_role AS role,u.account_status AS accountStatus,u.auth_provider AS authProvider,u.department_id AS departmentId,u.phase_id AS phaseId,u.university_id AS universityId,u.college_id AS collegeId,u.section_id AS sectionId FROM user_identities i JOIN users u ON u.id=i.user_id WHERE i.provider='chatgpt' AND i.provider_user_id=?`).bind(providerId).first();
  if(!account){
    account=await env.DB.prepare(`SELECT id,email,name,account_role AS role,account_status AS accountStatus,auth_provider AS authProvider,department_id AS departmentId,phase_id AS phaseId,university_id AS universityId,college_id AS collegeId,section_id AS sectionId FROM users WHERE email=?`).bind(email).first();
    if(account){
      await env.DB.batch([
        env.DB.prepare(`INSERT OR IGNORE INTO user_identities(provider,provider_user_id,user_id,email) VALUES('chatgpt',?,?,?)`).bind(providerId,account.id,email),
        env.DB.prepare(`UPDATE users SET auth_provider=CASE WHEN auth_provider='password' THEN 'hybrid' ELSE auth_provider END,account_role=CASE WHEN ?=1 THEN 'owner' ELSE account_role END,account_status=CASE WHEN ?=1 THEN 'active' ELSE account_status END,email=?,name=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(owner?1:0,owner?1:0,email,name,account.id)
      ]);
    }else{
      const legacyRole=owner?'admin':'student';const accountRole=owner?'owner':'student';
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO users(id,email,name,role,account_role,account_status,auth_provider) VALUES(?,?,?,?,?,'active','chatgpt')`).bind(providerId,email,name,legacyRole,accountRole),
        env.DB.prepare(`INSERT INTO user_identities(provider,provider_user_id,user_id,email) VALUES('chatgpt',?,?,?)`).bind(providerId,providerId,email)
      ]);
      account={id:providerId,email,name,role:accountRole,accountStatus:'active',authProvider:'chatgpt'};
    }
  }else{
    const role=owner?'owner':account.role;await env.DB.prepare(`UPDATE users SET email=?,name=?,account_role=?,role=?,account_status=CASE WHEN ?=1 THEN 'active' ELSE account_status END,updated_at=CURRENT_TIMESTAMP WHERE id=? AND (email<>? OR name<>? OR account_role<>? OR ?=1)`).bind(email,name,role,['owner','admin'].includes(role)?'admin':'student',owner?1:0,account.id,email,name,role,owner?1:0).run();account={...account,email,name,role,accountStatus:owner?'active':account.accountStatus};
  }
  return account.accountStatus==='active'?account:null;
}
async function identity(request,env){return await chatGptIdentity(request,env)||await resolvePasswordSession(env,request)}
async function ensureSchema(env){
  if(schemaReady)return;
  if(!env.DB)throw new Error('D1 binding DB is missing');
  await env.DB.batch(schemaStatements.map(sql=>env.DB.prepare(sql)));
  schemaReady=true;
}
async function body(request){return readJsonBody(request)}
function validTest(value){
  if(!value||typeof value.title!=='string'||value.title.trim().length<3||value.title.trim().length>160)return 'عنوان الاختبار يجب أن يكون بين 3 و160 حرفًا';
  if(typeof value.subject!=='string'||typeof value.lecture!=='string'||!value.subject.trim()||!value.lecture.trim())return 'المادة والمحاضرة مطلوبتان';
  if(!Number.isInteger(value.durationMinutes)||value.durationMinutes<1||value.durationMinutes>360)return 'مدة الاختبار غير صالحة';
  if(value.passPercentage!==undefined&&(!Number.isInteger(value.passPercentage)||value.passPercentage<0||value.passPercentage>100))return 'نسبة النجاح غير صالحة';
  if(value.status!==undefined&&!['draft','published'].includes(value.status))return 'حالة الاختبار غير صالحة';
  if(value.shuffleQuestions!==undefined&&typeof value.shuffleQuestions!=='boolean')return 'إعداد خلط الأسئلة غير صالح';
  if(value.shuffleOptions!==undefined&&typeof value.shuffleOptions!=='boolean')return 'إعداد خلط الخيارات غير صالح';
  if(!Array.isArray(value.questions)||value.questions.length<1||value.questions.length>200)return 'عدد الأسئلة يجب أن يكون بين 1 و200';
  for(const question of value.questions){
    if(typeof question?.text!=='string'||!question.text.trim()||question.text.trim().length>5000||!Array.isArray(question.options)||question.options.length<2||question.options.length>8)return 'بيانات أحد الأسئلة غير مكتملة أو تتجاوز الحدود';
    if(question.options.some(option=>typeof option!=='string'||!option.trim()||option.length>1000))return 'أحد الخيارات فارغ أو طويل جدًا';
    if(question.explanation!==undefined&&typeof question.explanation!=='string')return 'شرح الإجابة غير صالح';
    if((question.explanation||'').length>10000)return 'شرح الإجابة طويل جدًا';
    if(!Number.isInteger(question.correctOption)||question.correctOption<0||question.correctOption>=question.options.length)return 'الإجابة الصحيحة غير صالحة';
  }
  return null;
}
function requireUser(user){return user?null:error('UNAUTHENTICATED','سجّل الدخول للمتابعة',401)}
function requireAdmin(user){return ['owner','admin'].includes(user?.role)?null:error('FORBIDDEN','هذه العملية للمشرف فقط',403)}

function decodeQuestions(rows){return rows.map(question=>({...question,options:JSON.parse(question.options_json)}))}
function normalizeFillAnswer(value){return String(value||'').normalize('NFKC').toLocaleLowerCase('ar').replace(/[\u0640\u064b-\u065f\u0670]/g,'').replace(/\s+/g,'')}
function answerCorrect(question){if(question.question_type==='fill_blank'){let accepted=[];try{accepted=JSON.parse(question.accepted_answers_json||'[]')}catch{}const answer=normalizeFillAnswer(question.answer_text);return Boolean(answer)&&accepted.some(value=>normalizeFillAnswer(value)===answer)}return question.selected_option!==null&&Number(question.selected_option)===Number(question.correct_option)}
async function latestOrders(env,userId,testId,excludeId=''){
  const previous=await env.DB.prepare(`SELECT question_order_json AS questionOrder,option_orders_json AS optionOrders FROM attempts WHERE user_id=? AND test_id=? AND id<>? AND question_order_json IS NOT NULL ORDER BY started_at DESC LIMIT 1`).bind(userId,testId,excludeId).first();
  return previous||{};
}
async function createOrders(env,userId,test,questions,excludeId=''){
  const previous=await latestOrders(env,userId,test.id,excludeId);
  return buildAttemptOrders(questions,{shuffleQuestions:Boolean(test.shuffleQuestions),shuffleOptions:Boolean(test.shuffleOptions)},previous);
}

function limitRule(request,url){
  const path=url.pathname;
  if(path==='/api/attempts'&&request.method==='POST')return ['attempt:start',10];
  if(/^\/api\/attempts\/[^/]+\/answers$/.test(path)&&request.method==='PATCH')return ['attempt:answer',120];
  if(/^\/api\/attempts\/[^/]+\/submit$/.test(path)&&request.method==='POST')return ['attempt:submit',10];
  if(path==='/api/tests'&&request.method==='GET')return ['tests:list',90];
  if(path==='/api/me/profile'&&request.method==='PATCH')return ['profile:update',10];
  if(path.startsWith('/api/admin/')&&!['GET','HEAD'].includes(request.method))return ['admin:write',30];
  if(path==='/api/admin/students'&&request.method==='GET')return ['admin:students',60];
  return null;
}

function isExpired(attempt){return Number(attempt?.expired)===1}
async function finalizeAttempt(env,attempt){
  const questions=await env.DB.prepare(`SELECT q.id,q.correct_option,q.question_type,q.accepted_answers_json,q.points,a.selected_option,a.answer_text FROM questions q LEFT JOIN attempt_answers a ON a.question_id=q.id AND a.attempt_id=? WHERE q.test_id=?`).bind(attempt.id,attempt.test_id).all();
  const maxScore=questions.results.reduce((sum,question)=>sum+Number(question.points||1),0);const score=questions.results.reduce((sum,question)=>sum+(answerCorrect(question)?Number(question.points||1):0),0);const percentage=maxScore?Math.round(score/maxScore*10000)/100:0;
  const updates=questions.results.filter(question=>question.selected_option!==null||question.answer_text!==null).map(question=>env.DB.prepare(`UPDATE attempt_answers SET is_correct=? WHERE attempt_id=? AND question_id=?`).bind(answerCorrect(question)?1:0,attempt.id,question.id));
  updates.push(env.DB.prepare(`UPDATE attempts SET status='submitted',score=?,max_score=?,percentage=?,finished_at=CURRENT_TIMESTAMP,last_saved_at=CURRENT_TIMESTAMP WHERE id=? AND status='in_progress'`).bind(score,maxScore,percentage,attempt.id));
  await env.DB.batch(updates);const certificateTest=await env.DB.prepare(`SELECT a.user_id AS userId,a.test_id AS testId,t.pass_percentage AS passPercentage,t.certificate_enabled AS certificateEnabled FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.id=?`).bind(attempt.id).first();let certificate=null;if(Number(certificateTest?.certificateEnabled)===1&&percentage>=Number(certificateTest?.passPercentage)){const id=crypto.randomUUID();const verificationCode=crypto.randomUUID().replace(/-/g,'');await env.DB.prepare(`INSERT OR IGNORE INTO certificates(id,attempt_id,user_id,test_id,verification_code) VALUES(?,?,?,?,?)`).bind(id,attempt.id,certificateTest.userId,certificateTest.testId,verificationCode).run();certificate=await env.DB.prepare(`SELECT id,verification_code AS verificationCode FROM certificates WHERE attempt_id=?`).bind(attempt.id).first()}return {score,maxScore,percentage,certificate};
}

async function handleApi(request,env,url){
  await ensureSchema(env);
  const user=await identity(request,env);
  if(!['GET','HEAD'].includes(request.method)){
    const origin=request.headers.get('origin');
    if(origin&&origin!==url.origin)return error('INVALID_ORIGIN','طلب غير مسموح',403);
    const fetchSite=request.headers.get('sec-fetch-site');
    if(fetchSite&&!['same-origin','none'].includes(fetchSite))return error('INVALID_ORIGIN','طلب غير مسموح',403);
  }
  const rule=user&&limitRule(request,url);
  if(rule){const result=await enforceRateLimit(env,`${user.id}:${rule[0]}`,rule[1]);if(!result.allowed)return response({error:{code:'RATE_LIMITED',message:'طلبات كثيرة جدًا؛ حاول بعد قليل'}},429,{'retry-after':String(result.retryAfter)})}
  const authResponse=await handleAuthApi(request,env,url,user);
  if(authResponse)return authResponse;

  const adminUsersResponse=await handleAdminUsersApi(request,env,url,user);
  if(adminUsersResponse)return adminUsersResponse;

  const mediaResponse=await handleMediaApi(request,env,url,user);
  if(mediaResponse)return mediaResponse;

  const importResponse=await handleImportApi(request,env,url,user);
  if(importResponse)return importResponse;

  const certificateResponse=await handleCertificateApi(request,env,url,user);
  if(certificateResponse)return certificateResponse;

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
    const test=await env.DB.prepare(`SELECT id,title,subject,lecture,duration_minutes AS durationMinutes,pass_percentage AS passPercentage,exam_mode AS examMode,available_from AS availableFrom,available_until AS availableUntil,max_attempts AS maxAttempts FROM tests WHERE id=? AND status='published'`).bind(publicTest[1]).first();
    if(!test)return error('NOT_FOUND','الاختبار غير موجود',404);
    const list=await env.DB.prepare(`SELECT id,text,options_json,position,question_type AS questionType,image_id AS imageId FROM questions WHERE test_id=? ORDER BY position`).bind(test.id).all();
    const questions=decodeQuestions(list.results);const attemptId=url.searchParams.get('attemptId');
    if(!attemptId)return response({...test,questions});
    const attempt=await env.DB.prepare(`SELECT a.id,a.test_id,a.question_order_json AS questionOrder,a.option_orders_json AS optionOrders,CASE WHEN unixepoch('now')>unixepoch(a.started_at)+(t.duration_minutes*60)+5 THEN 1 ELSE 0 END AS expired,MAX(0,unixepoch(a.started_at)+(t.duration_minutes*60)-unixepoch('now')) AS remainingSeconds FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.id=? AND a.user_id=? AND a.test_id=? AND a.status='in_progress'`).bind(attemptId,user.id,test.id).first();
    if(!attempt)return error('ATTEMPT_NOT_FOUND','المحاولة غير موجودة أو منتهية',404);
    if(isExpired(attempt)){await finalizeAttempt(env,attempt);return error('ATTEMPT_EXPIRED','انتهت مدة الاختبار وتم تسليم الإجابات المحفوظة',409)}
    const questionOrder=parseOrder(attempt.questionOrder,questions.map(question=>question.id));const optionOrders=parseOptionOrders(attempt.optionOrders);
    const answerRows=await env.DB.prepare(`SELECT question_id AS questionId,selected_option AS selectedOption,answer_text AS answerText FROM attempt_answers WHERE attempt_id=?`).bind(attempt.id).all();
    const questionById=new Map(questions.map(question=>[question.id,question]));const savedAnswers={};
    for(const answer of answerRows.results){const question=questionById.get(answer.questionId);if(question?.questionType==='fill_blank')savedAnswers[answer.questionId]=answer.answerText||'';else if(question){const displayIndex=toDisplayOption(Number(answer.selectedOption),question,optionOrders);if(displayIndex>=0)savedAnswers[answer.questionId]=displayIndex}}
    return response({...test,remainingSeconds:Number(attempt.remainingSeconds),questions:presentQuestions(questions,questionOrder,optionOrders).map(question=>({...question,imageUrl:question.imageId?`/api/media/${encodeURIComponent(question.imageId)}`:null})),savedAnswers});
  }
  if(url.pathname==='/api/attempts'&&request.method==='POST'){
    const denied=requireUser(user);if(denied)return denied;
    const parsed=await body(request);if(parsed.error)return error(parsed.error.code,parsed.error.message,parsed.error.status);const value=parsed.value;if(typeof value?.testId!=='string'||!value.testId||value.testId.length>200)return error('VALIDATION','الاختبار مطلوب');
    const test=await env.DB.prepare(`SELECT id,duration_minutes AS durationMinutes,shuffle_questions AS shuffleQuestions,shuffle_options AS shuffleOptions,exam_mode AS examMode,available_from AS availableFrom,available_until AS availableUntil,max_attempts AS maxAttempts FROM tests WHERE id=? AND status='published'`).bind(value.testId).first();
    if(!test)return error('NOT_FOUND','الاختبار غير متاح',404);
    const questionRows=await env.DB.prepare(`SELECT id,options_json FROM questions WHERE test_id=? ORDER BY position`).bind(test.id).all();const questions=decodeQuestions(questionRows.results);
    const existing=await env.DB.prepare(`SELECT a.id,a.test_id AS testId,a.test_id,a.started_at AS startedAt,a.question_order_json AS questionOrder,a.option_orders_json AS optionOrders,CASE WHEN unixepoch('now')>unixepoch(a.started_at)+(t.duration_minutes*60)+5 THEN 1 ELSE 0 END AS expired FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.user_id=? AND a.test_id=? AND a.status='in_progress' ORDER BY a.started_at DESC LIMIT 1`).bind(user.id,value.testId).first();
    if(existing&&!isExpired(existing)){if(!existing.questionOrder||!existing.optionOrders){const orders=await createOrders(env,user.id,test,questions,existing.id);await env.DB.prepare(`UPDATE attempts SET question_order_json=?,option_orders_json=? WHERE id=?`).bind(JSON.stringify(orders.questionOrder),JSON.stringify(orders.optionOrders),existing.id).run()}return response({attempt:existing,resumed:true})}
    if(existing&&isExpired(existing))await finalizeAttempt(env,existing);
    if(test.examMode==='formal'){
      const now=Math.floor(Date.now()/1000);if(test.availableFrom&&now<Math.floor(Date.parse(test.availableFrom)/1000))return error('EXAM_NOT_OPEN','لم تبدأ نافذة الاختبار الرسمي بعد',403);if(test.availableUntil&&now>Math.floor(Date.parse(test.availableUntil)/1000))return error('EXAM_CLOSED','انتهت نافذة الاختبار الرسمي',403);if(Number(test.maxAttempts)>0){const count=await env.DB.prepare(`SELECT count(*) AS count FROM attempts WHERE user_id=? AND test_id=?`).bind(user.id,test.id).first();if(Number(count?.count)>=Number(test.maxAttempts))return error('ATTEMPT_LIMIT','استنفدت عدد المحاولات المسموح بها',403)}
    }
    const id=crypto.randomUUID();
    const orders=await createOrders(env,user.id,test,questions);
    const inserted=await env.DB.prepare(`INSERT INTO attempts(id,user_id,test_id,question_order_json,option_orders_json) SELECT ?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM attempts WHERE user_id=? AND test_id=? AND status='in_progress')`).bind(id,user.id,value.testId,JSON.stringify(orders.questionOrder),JSON.stringify(orders.optionOrders),user.id,value.testId).run();
    if(!Number(inserted.meta?.changes)){const resumed=await env.DB.prepare(`SELECT id,test_id AS testId,started_at AS startedAt FROM attempts WHERE user_id=? AND test_id=? AND status='in_progress' ORDER BY started_at DESC LIMIT 1`).bind(user.id,value.testId).first();return response({attempt:resumed,resumed:true})}
    return response({attempt:{id,testId:value.testId},resumed:false},201);
  }
  const saveAnswer=url.pathname.match(/^\/api\/attempts\/([^/]+)\/answers$/);
  if(saveAnswer&&request.method==='PATCH'){
    const denied=requireUser(user);if(denied)return denied;
    const parsed=await body(request);if(parsed.error)return error(parsed.error.code,parsed.error.message,parsed.error.status);const value=parsed.value;
    if(!value?.questionId)return error('VALIDATION','الإجابة غير صالحة');
    const attempt=await env.DB.prepare(`SELECT a.id,a.test_id,a.option_orders_json AS optionOrders,CASE WHEN unixepoch('now')>unixepoch(a.started_at)+(t.duration_minutes*60)+5 THEN 1 ELSE 0 END AS expired FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.id=? AND a.user_id=? AND a.status='in_progress'`).bind(saveAnswer[1],user.id).first();
    if(!attempt)return error('NOT_EDITABLE','المحاولة غير قابلة للتعديل',409);
    if(isExpired(attempt)){await finalizeAttempt(env,attempt);return error('ATTEMPT_EXPIRED','انتهت مدة الاختبار وتم تسليم الإجابات المحفوظة',409)}
    const question=await env.DB.prepare(`SELECT id,options_json,question_type AS questionType FROM questions WHERE id=? AND test_id=?`).bind(value.questionId,attempt.test_id).first();
    if(!question)return error('BAD_QUESTION','السؤال لا يتبع الاختبار',400);
    question.options=JSON.parse(question.options_json);let selectedOption=0;let answerText=null;if(question.questionType==='fill_blank'){answerText=String(value.answerText||'').trim();if(!answerText||answerText.length>500)return error('VALIDATION','إجابة الفراغ يجب أن تكون بين حرف و500 حرف')}else{if(!Number.isInteger(Number(value.selectedOption)))return error('VALIDATION','الإجابة غير صالحة');selectedOption=toOriginalOption(Number(value.selectedOption),question,parseOptionOrders(attempt.optionOrders));if(selectedOption<0)return error('VALIDATION','الإجابة غير صالحة')}
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO attempt_answers(attempt_id,question_id,selected_option,answer_text) VALUES(?,?,?,?) ON CONFLICT(attempt_id,question_id) DO UPDATE SET selected_option=excluded.selected_option,answer_text=excluded.answer_text,answered_at=CURRENT_TIMESTAMP`).bind(attempt.id,value.questionId,selectedOption,answerText),
      env.DB.prepare(`UPDATE attempts SET last_saved_at=CURRENT_TIMESTAMP WHERE id=?`).bind(attempt.id)
    ]);
    return response({saved:true});
  }
  const submit=url.pathname.match(/^\/api\/attempts\/([^/]+)\/submit$/);
  if(submit&&request.method==='POST'){
    const denied=requireUser(user);if(denied)return denied;
    const attempt=await env.DB.prepare(`SELECT a.id,a.test_id,CASE WHEN unixepoch('now')>unixepoch(a.started_at)+(t.duration_minutes*60)+5 THEN 1 ELSE 0 END AS expired FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.id=? AND a.user_id=? AND a.status='in_progress'`).bind(submit[1],user.id).first();
    if(!attempt)return error('ALREADY_SUBMITTED','المحاولة منتهية أو غير موجودة',409);
    const result=await finalizeAttempt(env,attempt);
    return response({...result,expired:isExpired(attempt)});
  }
  if(url.pathname==='/api/me/history'&&request.method==='GET'){
    const denied=requireUser(user);if(denied)return denied;
    const history=await env.DB.prepare(`SELECT a.id,t.title,t.subject,a.score,a.max_score AS maxScore,a.percentage,a.started_at AS startedAt,a.finished_at AS finishedAt,CASE WHEN a.percentage>=t.pass_percentage THEN 1 ELSE 0 END AS passed FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.user_id=? AND a.status='submitted' ORDER BY a.finished_at DESC LIMIT 100`).bind(user.id).all();
    const average=history.results.length?Math.round(history.results.reduce((sum,item)=>sum+Number(item.percentage),0)/history.results.length*100)/100:0;
    return response({data:history.results,summary:{attempts:history.results.length,averagePercentage:average}});
  }

  if(url.pathname==='/api/admin/metrics'&&request.method==='GET'){
    if(user?.role!=='owner')return error('FORBIDDEN','لوحة المؤشرات الشاملة متاحة لمالك المنصة فقط في هذه المرحلة',403);
    const metrics=await env.DB.prepare(`SELECT (SELECT count(*) FROM tests WHERE status!='archived') AS tests,(SELECT count(*) FROM users WHERE role='student') AS students,(SELECT count(*) FROM attempts) AS attempts,(SELECT round(avg(percentage),2) FROM attempts WHERE status='submitted') AS averagePercentage`).first();
    return response(metrics);
  }
  if(url.pathname==='/api/admin/audit'&&request.method==='GET'){
    if(user?.role!=='owner')return error('FORBIDDEN','سجل التدقيق الشامل متاح لمالك المنصة فقط',403);
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
    const parsed=await body(request);if(parsed.error)return error(parsed.error.code,parsed.error.message,parsed.error.status);const value=parsed.value;const issue=validTest(value);if(issue)return error('VALIDATION',issue);
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
    const parsed=await body(request);if(parsed.error)return error(parsed.error.code,parsed.error.message,parsed.error.status);const value=parsed.value;const issue=validTest(value);if(issue)return error('VALIDATION',issue);
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
    if(!['owner','admin','teacher'].includes(user?.role))return error('FORBIDDEN','هذه العملية للكوادر المخولة فقط',403);
    const scopedTest=await env.DB.prepare(`SELECT t.id,t.department_id AS departmentId,t.phase_id AS phaseId,t.section_id AS sectionId,t.subject_id AS subjectId,t.lecture_id AS lectureId,c.university_id AS universityId,d.college_id AS collegeId FROM tests t LEFT JOIN departments d ON d.id=t.department_id LEFT JOIN colleges c ON c.id=d.college_id WHERE t.id=? AND t.status!='archived'`).bind(adminTest[1]).first();
    if(!scopedTest)return error('NOT_FOUND','الاختبار غير موجود',404);
    if(!(await hasPermission(env,user,'manage_tests',scopedTest)))return error('FORBIDDEN','هذا الاختبار خارج نطاق صلاحيتك',403);
    await env.DB.batch([
      env.DB.prepare(`UPDATE tests SET status='archived',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(adminTest[1]),
      env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id) VALUES('test',?,'archive',?)`).bind(adminTest[1],user.id)
    ]);
    return new Response(null,{status:204,headers:secureHeaders()});
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
  return new Response(decode(file.body),{headers:secureHeaders({'content-type':file.type,'cache-control':pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'})});
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
      return new Response('Not found',{status:404,headers:secureHeaders({'content-type':'text/plain; charset=utf-8'})});
    }catch(cause){
      const requestId=request.headers.get('cf-ray')||crypto.randomUUID();
      console.error('KIUR request failed',{requestId,name:cause instanceof Error?cause.name:'UnknownError',code:cause?.code||'UNEXPECTED'});
      return url.pathname.startsWith('/api/')?error('INTERNAL_ERROR','حدث خطأ غير متوقع',500):new Response('Internal error',{status:500,headers:secureHeaders({'content-type':'text/plain; charset=utf-8'})});
    }
  }
};
