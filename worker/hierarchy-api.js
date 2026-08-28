import {readJsonBody,secureHeaders} from './security.js';
import {hasPermission,loadGrants,permittedWith} from './access-control.js';
import {recordAccountEvent} from './account-events.js';

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})});
}
function fail(code,message,status=400){return json({error:{code,message}},status)}
async function readBody(request){return readJsonBody(request)}
function denyUser(user){return user?null:fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401)}
function denyAdmin(user){return ['owner','admin'].includes(user?.role)?null:fail('FORBIDDEN','هذه العملية للمشرف فقط',403)}
function denyTestStaff(user){return ['owner','admin','teacher'].includes(user?.role)?null:fail('FORBIDDEN','هذه العملية للكوادر المخولة فقط',403)}
function pathContext(path){return {universityId:path.universityId,collegeId:path.collegeId,departmentId:path.departmentId,phaseId:path.phaseId,sectionId:path.sectionId,subjectId:path.subjectId,lectureId:path.lectureId}}
async function canManageTests(env,user,path){return hasPermission(env,user,'manage_tests',pathContext(path))}
async function visibleTests(env,user,rows){if(user.role==='owner')return rows;const grants=await loadGrants(env,user.id);return rows.filter(row=>permittedWith(grants,'manage_tests',pathContext(row)))}
async function clinicalMediaIssue(env,user,questions,path){const ids=[...new Set(questions.filter(question=>question.questionType==='clinical_case').map(question=>question.imageId))];if(!ids.length)return null;if(!(await hasPermission(env,user,'use_media',pathContext(path)))&&!(await hasPermission(env,user,'manage_library',pathContext(path))))return 'لا تملك صلاحية استخدام مكتبة الصور';for(const id of ids){const asset=await env.DB.prepare(`SELECT id FROM media_assets WHERE id=? AND deleted_at IS NULL`).bind(id).first();if(!asset)return 'إحدى صور الحالات السريرية غير موجودة أو محذوفة'}return null}

async function catalog(env){
  const [universities,colleges,departments,phases,sections,subjects,lectures]=await Promise.all([
    env.DB.prepare(`SELECT id,name,sort_order AS sortOrder FROM universities ORDER BY sort_order,name`).all(),
    env.DB.prepare(`SELECT id,university_id AS universityId,name,sort_order AS sortOrder FROM colleges ORDER BY sort_order,name`).all(),
    env.DB.prepare(`SELECT id,college_id AS collegeId,COALESCE(display_name,name) AS name,sort_order AS sortOrder FROM departments ORDER BY sort_order,name`).all(),
    env.DB.prepare(`SELECT id,department_id AS departmentId,name,sort_order AS sortOrder FROM phases ORDER BY sort_order,name`).all(),
    env.DB.prepare(`SELECT id,phase_id AS phaseId,name,sort_order AS sortOrder FROM sections ORDER BY sort_order,name`).all(),
    env.DB.prepare(`SELECT id,phase_id AS phaseId,name,sort_order AS sortOrder FROM subjects ORDER BY sort_order,name`).all(),
    env.DB.prepare(`SELECT id,subject_id AS subjectId,name,sort_order AS sortOrder FROM lectures ORDER BY sort_order,name`).all()
  ]);
  return {universities:universities.results,colleges:colleges.results,departments:departments.results,phases:phases.results,sections:sections.results,subjects:subjects.results,lectures:lectures.results};
}

async function resolvePath(env,value){
  if(!value?.departmentId||!value?.phaseId||!value?.subjectId||!value?.lectureId)return null;
  const sectionId=value.sectionId||null;
  return env.DB.prepare(`SELECT u.id AS universityId,u.name AS universityName,c.id AS collegeId,c.name AS collegeName,d.id AS departmentId,COALESCE(d.display_name,d.name) AS departmentName,p.id AS phaseId,p.name AS phaseName,x.id AS sectionId,x.name AS sectionName,s.id AS subjectId,s.name AS subjectName,l.id AS lectureId,l.name AS lectureName FROM lectures l JOIN subjects s ON s.id=l.subject_id JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id JOIN universities u ON u.id=c.university_id LEFT JOIN sections x ON x.id=? AND x.phase_id=p.id WHERE d.id=? AND p.id=? AND s.id=? AND l.id=? AND (? IS NULL OR x.id IS NOT NULL) AND (? IS NULL OR u.id=?) AND (? IS NULL OR c.id=?)`).bind(sectionId,value.departmentId,value.phaseId,value.subjectId,value.lectureId,sectionId,value.universityId||null,value.universityId||null,value.collegeId||null,value.collegeId||null).first();
}

function validateQuestions(value){
  if(!value||typeof value.title!=='string'||value.title.trim().length<3||value.title.trim().length>160)return 'عنوان الاختبار يجب أن يكون بين 3 و160 حرفًا';
  if(!Number.isInteger(value.durationMinutes)||value.durationMinutes<1||value.durationMinutes>360)return 'مدة الاختبار غير صالحة';
  if(value.passPercentage!==undefined&&(!Number.isInteger(value.passPercentage)||value.passPercentage<0||value.passPercentage>100))return 'نسبة النجاح غير صالحة';
  if(value.status!==undefined&&!['draft','published'].includes(value.status))return 'حالة الاختبار غير صالحة';
  if(value.shuffleQuestions!==undefined&&typeof value.shuffleQuestions!=='boolean')return 'إعداد خلط الأسئلة غير صالح';
  if(value.shuffleOptions!==undefined&&typeof value.shuffleOptions!=='boolean')return 'إعداد خلط الخيارات غير صالح';
  if(value.examMode!==undefined&&!['practice','formal'].includes(value.examMode))return 'نمط الاختبار غير صالح';
  if(value.maxAttempts!==undefined&&(!Number.isInteger(value.maxAttempts)||value.maxAttempts<0||value.maxAttempts>100))return 'عدد المحاولات غير صالح';
  if(value.examMode==='formal'&&(!value.availableFrom||!value.availableUntil||!Number.isFinite(Date.parse(value.availableFrom))||!Number.isFinite(Date.parse(value.availableUntil))||Date.parse(value.availableFrom)>=Date.parse(value.availableUntil)))return 'حدد نافذة زمنية صحيحة للاختبار الرسمي';
  if(!Array.isArray(value.questions)||value.questions.length<1||value.questions.length>200)return 'عدد الأسئلة يجب أن يكون بين 1 و200';
  for(const question of value.questions){
    const questionType=question.questionType||'mcq';if(!['mcq','true_false','fill_blank','clinical_case'].includes(questionType))return 'نوع أحد الأسئلة غير صالح';
    if(typeof question?.text!=='string'||!question.text.trim()||question.text.trim().length>5000)return 'بيانات أحد الأسئلة غير مكتملة أو تتجاوز الحدود';
    if(questionType==='fill_blank'){if(!Array.isArray(question.acceptedAnswers)||!question.acceptedAnswers.length||question.acceptedAnswers.length>20||question.acceptedAnswers.some(answer=>typeof answer!=='string'||!answer.trim()||answer.length>500))return 'إجابات سؤال أكمل الفراغ غير صالحة'}else if(!Array.isArray(question.options)||question.options.length<2||question.options.length>8||question.options.some(option=>typeof option!=='string'||!option.trim()||option.length>1000))return 'خيارات أحد الأسئلة غير صالحة';
    if(questionType==='clinical_case'&&(!question.imageId||typeof question.imageId!=='string'))return 'سؤال الحالة السريرية يحتاج صورة من المكتبة';
    if(question.explanation!==undefined&&typeof question.explanation!=='string')return 'شرح الإجابة غير صالح';
    if((question.explanation||'').length>10000)return 'شرح الإجابة طويل جدًا';
    if(questionType!=='fill_blank'&&(!Number.isInteger(question.correctOption)||question.correctOption<0||question.correctOption>=question.options.length))return 'الإجابة الصحيحة غير صالحة';
  }
  return null;
}

const testSelect=`SELECT t.id,t.title,t.subject,t.lecture,t.duration_minutes AS durationMinutes,t.pass_percentage AS passPercentage,t.shuffle_questions AS shuffleQuestions,t.shuffle_options AS shuffleOptions,t.exam_mode AS examMode,t.available_from AS availableFrom,t.available_until AS availableUntil,t.max_attempts AS maxAttempts,t.certificate_enabled AS certificateEnabled,t.status,t.updated_at AS updatedAt,t.department_id AS departmentId,t.phase_id AS phaseId,t.section_id AS sectionId,t.subject_id AS subjectId,t.lecture_id AS lectureId,COALESCE(u.id,'') AS universityId,COALESCE(c.id,'') AS collegeId,COALESCE(u.name,'') AS universityName,COALESCE(c.name,'') AS collegeName,COALESCE(d.display_name,d.name,'') AS departmentName,COALESCE(p.name,'') AS phaseName,COALESCE(x.name,'') AS sectionName,COALESCE(s.name,t.subject) AS subjectName,COALESCE(l.name,t.lecture) AS lectureName,count(q.id) AS questionCount FROM tests t LEFT JOIN departments d ON d.id=t.department_id LEFT JOIN colleges c ON c.id=d.college_id LEFT JOIN universities u ON u.id=c.university_id LEFT JOIN phases p ON p.id=t.phase_id LEFT JOIN sections x ON x.id=t.section_id LEFT JOIN subjects s ON s.id=t.subject_id LEFT JOIN lectures l ON l.id=t.lecture_id LEFT JOIN questions q ON q.test_id=t.id`;

export async function handleHierarchyApi(request,env,url,user,restriction=null){
  if(url.pathname==='/api/public/catalog'&&request.method==='GET')return json(await catalog(env));
  if(url.pathname==='/api/catalog'&&request.method==='GET'){
    const denied=denyUser(user);if(denied)return denied;
    return json(await catalog(env));
  }

  if(url.pathname==='/api/me'&&request.method==='GET'){
    const denied=denyUser(user);if(denied)return denied;
    const profile=await env.DB.prepare(`SELECT u.university_id AS universityId,u.college_id AS collegeId,u.department_id AS departmentId,u.phase_id AS phaseId,u.section_id AS sectionId,v.name AS universityName,c.name AS collegeName,COALESCE(d.display_name,d.name) AS departmentName,p.name AS phaseName,x.name AS sectionName FROM users u LEFT JOIN universities v ON v.id=u.university_id LEFT JOIN colleges c ON c.id=u.college_id LEFT JOIN departments d ON d.id=u.department_id LEFT JOIN phases p ON p.id=u.phase_id LEFT JOIN sections x ON x.id=u.section_id WHERE u.id=?`).bind(user.id).first();
    const permissions=user.role==='owner'?['*']:[...new Set((await loadGrants(env,user.id)).flatMap(grant=>grant.permissions))];if(user.authProvider==='chatgpt')await recordAccountEvent(env,request,{userId:user.id,accountCode:user.id,email:user.email,eventType:'login_success',details:{provider:'chatgpt'}});return json({user:{...user,...profile,permissions,restriction}});
  }

  if(url.pathname==='/api/me/profile'&&request.method==='PATCH'){
    const denied=denyUser(user);if(denied)return denied;
    const parsed=await readBody(request);if(parsed.error)return fail(parsed.error.code,parsed.error.message,parsed.error.status);const value=parsed.value;
    const sectionId=value?.sectionId||null;const phase=await env.DB.prepare(`SELECT v.id AS universityId,c.id AS collegeId,d.id AS departmentId,p.id AS phaseId,x.id AS sectionId FROM phases p JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id JOIN universities v ON v.id=c.university_id LEFT JOIN sections x ON x.id=? AND x.phase_id=p.id WHERE p.id=? AND d.id=? AND c.id=? AND v.id=? AND (? IS NULL OR x.id IS NOT NULL)`).bind(sectionId,value?.phaseId||'',value?.departmentId||'',value?.collegeId||'',value?.universityId||'',sectionId).first();
    if(!phase)return fail('VALIDATION','اختر جامعة وكلية وقسمًا ومرحلة وشعبة صحيحة');
    await env.DB.batch([
      env.DB.prepare(`UPDATE users SET university_id=?,college_id=?,department_id=?,phase_id=?,section_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(phase.universityId,phase.collegeId,phase.departmentId,phase.phaseId,phase.sectionId,user.id),
      env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('user',?,'update_profile',?,?)`).bind(user.id,user.id,JSON.stringify({universityId:phase.universityId,collegeId:phase.collegeId,departmentId:phase.departmentId,phaseId:phase.phaseId,sectionId:phase.sectionId}))
    ]);
    return json({updated:true});
  }

  if(url.pathname==='/api/tests'&&request.method==='GET'){
    const denied=denyUser(user);if(denied)return denied;
    const filters=[];const binds=[];
    for(const [param,column] of [['departmentId','t.department_id'],['phaseId','t.phase_id'],['sectionId','t.section_id'],['subjectId','t.subject_id'],['lectureId','t.lecture_id']]){
      const value=url.searchParams.get(param);if(value){filters.push(`${column}=?`);binds.push(value)}
    }
    const q=url.searchParams.get('q')?.trim().slice(0,100);
    if(q){filters.push(`(t.title LIKE ? OR t.subject LIKE ? OR t.lecture LIKE ? OR s.name LIKE ? OR l.name LIKE ?)`);for(let i=0;i<5;i++)binds.push(`%${q}%`)}
    const where=[`t.status='published'`,...filters].join(' AND ');
    const statement=env.DB.prepare(`${testSelect} WHERE ${where} GROUP BY t.id ORDER BY t.created_at DESC`);
    const result=await (binds.length?statement.bind(...binds):statement).all();
    return json({data:result.results});
  }

  if(url.pathname==='/api/admin/tests'&&request.method==='GET'){
    const denied=denyTestStaff(user);if(denied)return denied;
    const result=await env.DB.prepare(`${testSelect} WHERE t.status!='archived' GROUP BY t.id ORDER BY t.created_at DESC`).all();
    return json({data:await visibleTests(env,user,result.results)});
  }

  if(url.pathname==='/api/admin/tests'&&request.method==='POST'){
    const denied=denyTestStaff(user);if(denied)return denied;
    const parsed=await readBody(request);if(parsed.error)return fail(parsed.error.code,parsed.error.message,parsed.error.status);const value=parsed.value;const issue=validateQuestions(value);if(issue)return fail('VALIDATION',issue);
    const path=await resolvePath(env,value);if(!path)return fail('VALIDATION','المسار الأكاديمي المختار غير صالح');
    if(!(await canManageTests(env,user,path)))return fail('FORBIDDEN','لا تملك صلاحية إنشاء اختبار في هذا النطاق',403);
    const mediaIssue=await clinicalMediaIssue(env,user,value.questions,path);if(mediaIssue)return fail('FORBIDDEN',mediaIssue,403);
    const id=crypto.randomUUID();
    const statements=[env.DB.prepare(`INSERT INTO tests(id,title,subject,lecture,duration_minutes,pass_percentage,shuffle_questions,shuffle_options,exam_mode,available_from,available_until,max_attempts,certificate_enabled,status,created_by,department_id,phase_id,section_id,subject_id,lecture_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,value.title.trim(),path.subjectName,path.lectureName,Number(value.durationMinutes),Number(value.passPercentage??60),value.shuffleQuestions?1:0,value.shuffleOptions?1:0,value.examMode||'practice',value.examMode==='formal'?value.availableFrom:null,value.examMode==='formal'?value.availableUntil:null,Number(value.maxAttempts||0),value.certificateEnabled===false?0:1,value.status||'published',user.id,path.departmentId,path.phaseId,path.sectionId,path.subjectId,path.lectureId)];
    value.questions.forEach((question,index)=>{const questionId=crypto.randomUUID();statements.push(env.DB.prepare(`INSERT INTO questions(id,test_id,text,options_json,correct_option,explanation,position,question_type,accepted_answers_json,image_id) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(questionId,id,question.text.trim(),JSON.stringify((question.options||[]).map(String)),Number(question.correctOption||0),question.explanation?.trim()||null,index+1,question.questionType||'mcq',question.questionType==='fill_blank'?JSON.stringify(question.acceptedAnswers.map(String)):null,question.imageId||null));if(question.imageId)statements.push(env.DB.prepare(`INSERT INTO library_logs(media_id,action,by_user_id,test_id,question_id,details_json) VALUES(?,'attach_to_test',?,?,?,?)`).bind(question.imageId,user.id,id,questionId,JSON.stringify({testTitle:value.title}))) });
    statements.push(env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('test',?,'create',?,?)`).bind(id,user.id,JSON.stringify({title:value.title,path,shuffleQuestions:Boolean(value.shuffleQuestions),shuffleOptions:Boolean(value.shuffleOptions)})));
    await env.DB.batch(statements);return json({id},201);
  }

  const adminTest=url.pathname.match(/^\/api\/admin\/tests\/([^/]+)$/);
  if(adminTest&&request.method==='GET'){
    const denied=denyTestStaff(user);if(denied)return denied;
    const test=await env.DB.prepare(`SELECT t.id,t.title,t.subject,t.lecture,t.duration_minutes AS durationMinutes,t.pass_percentage AS passPercentage,t.shuffle_questions AS shuffleQuestions,t.shuffle_options AS shuffleOptions,t.exam_mode AS examMode,t.available_from AS availableFrom,t.available_until AS availableUntil,t.max_attempts AS maxAttempts,t.certificate_enabled AS certificateEnabled,t.status,t.department_id AS departmentId,t.phase_id AS phaseId,t.section_id AS sectionId,t.subject_id AS subjectId,t.lecture_id AS lectureId,c.university_id AS universityId,d.college_id AS collegeId FROM tests t LEFT JOIN departments d ON d.id=t.department_id LEFT JOIN colleges c ON c.id=d.college_id WHERE t.id=? AND t.status!='archived'`).bind(adminTest[1]).first();
    if(!test)return fail('NOT_FOUND','الاختبار غير موجود',404);
    if(!(await canManageTests(env,user,test)))return fail('FORBIDDEN','هذا الاختبار خارج نطاق صلاحيتك',403);
    const questions=await env.DB.prepare(`SELECT id,text,options_json,correct_option AS correctOption,explanation,position,question_type AS questionType,accepted_answers_json AS acceptedAnswers,image_id AS imageId FROM questions WHERE test_id=? ORDER BY position`).bind(test.id).all();
    return json({...test,certificateEnabled:Boolean(test.certificateEnabled),questions:questions.results.map(question=>({...question,options:JSON.parse(question.options_json),acceptedAnswers:question.acceptedAnswers?JSON.parse(question.acceptedAnswers):[]}))});
  }

  if(adminTest&&request.method==='PUT'){
    const denied=denyTestStaff(user);if(denied)return denied;
    const parsed=await readBody(request);if(parsed.error)return fail(parsed.error.code,parsed.error.message,parsed.error.status);const value=parsed.value;const issue=validateQuestions(value);if(issue)return fail('VALIDATION',issue);
    const path=await resolvePath(env,value);if(!path)return fail('VALIDATION','المسار الأكاديمي المختار غير صالح');
    const exists=await env.DB.prepare(`SELECT t.id,t.department_id AS departmentId,t.phase_id AS phaseId,t.section_id AS sectionId,t.subject_id AS subjectId,t.lecture_id AS lectureId,c.university_id AS universityId,d.college_id AS collegeId FROM tests t LEFT JOIN departments d ON d.id=t.department_id LEFT JOIN colleges c ON c.id=d.college_id WHERE t.id=? AND t.status!='archived'`).bind(adminTest[1]).first();
    if(!exists)return fail('NOT_FOUND','الاختبار غير موجود',404);
    if(!(await canManageTests(env,user,exists))||!(await canManageTests(env,user,path)))return fail('FORBIDDEN','لا تملك صلاحية تعديل الاختبار أو نقله إلى هذا النطاق',403);
    const mediaIssue=await clinicalMediaIssue(env,user,value.questions,path);if(mediaIssue)return fail('FORBIDDEN',mediaIssue,403);
    const previousMedia=await env.DB.prepare(`SELECT id,image_id AS imageId FROM questions WHERE test_id=? AND image_id IS NOT NULL`).bind(adminTest[1]).all();const statements=[
      env.DB.prepare(`UPDATE tests SET title=?,subject=?,lecture=?,duration_minutes=?,pass_percentage=?,shuffle_questions=?,shuffle_options=?,exam_mode=?,available_from=?,available_until=?,max_attempts=?,certificate_enabled=?,status=?,department_id=?,phase_id=?,section_id=?,subject_id=?,lecture_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(value.title.trim(),path.subjectName,path.lectureName,Number(value.durationMinutes),Number(value.passPercentage??60),value.shuffleQuestions?1:0,value.shuffleOptions?1:0,value.examMode||'practice',value.examMode==='formal'?value.availableFrom:null,value.examMode==='formal'?value.availableUntil:null,Number(value.maxAttempts||0),value.certificateEnabled===false?0:1,value.status||'published',path.departmentId,path.phaseId,path.sectionId,path.subjectId,path.lectureId,adminTest[1]),
      env.DB.prepare(`DELETE FROM questions WHERE test_id=?`).bind(adminTest[1])
    ];
    for(const item of previousMedia.results)statements.push(env.DB.prepare(`INSERT INTO library_logs(media_id,action,by_user_id,test_id,question_id,details_json) VALUES(?,'detach_from_test',?,?,?,?)`).bind(item.imageId,user.id,adminTest[1],item.id,JSON.stringify({reason:'test_update'})));
    value.questions.forEach((question,index)=>{const questionId=crypto.randomUUID();statements.push(env.DB.prepare(`INSERT INTO questions(id,test_id,text,options_json,correct_option,explanation,position,question_type,accepted_answers_json,image_id) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(questionId,adminTest[1],question.text.trim(),JSON.stringify((question.options||[]).map(String)),Number(question.correctOption||0),question.explanation?.trim()||null,index+1,question.questionType||'mcq',question.questionType==='fill_blank'?JSON.stringify(question.acceptedAnswers.map(String)):null,question.imageId||null));if(question.imageId)statements.push(env.DB.prepare(`INSERT INTO library_logs(media_id,action,by_user_id,test_id,question_id,details_json) VALUES(?,'attach_to_test',?,?,?,?)`).bind(question.imageId,user.id,adminTest[1],questionId,JSON.stringify({testTitle:value.title}))) });
    statements.push(env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('test',?,'update',?,?)`).bind(adminTest[1],user.id,JSON.stringify({title:value.title,path,shuffleQuestions:Boolean(value.shuffleQuestions),shuffleOptions:Boolean(value.shuffleOptions)})));
    await env.DB.batch(statements);return json({updated:true});
  }

  return null;
}
