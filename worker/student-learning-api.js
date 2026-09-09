import {secureHeaders} from './security.js';
import {studentCanAccessTest} from './test-access.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})})}
function fail(code,message,status=400){return json({error:{code,message}},status)}
const validId=value=>typeof value==='string'&&value.length>=1&&value.length<=160&&/^[\w-]+$/u.test(value);
const testPathFields=`t.id,t.title,t.subject,t.lecture,t.duration_minutes AS durationMinutes,t.pass_percentage AS passPercentage,t.exam_mode AS examMode,t.available_from AS availableFrom,t.available_until AS availableUntil,t.max_attempts AS maxAttempts,t.status,t.department_id AS departmentId,t.phase_id AS phaseId,t.section_id AS sectionId,t.subject_id AS subjectId,t.lecture_id AS lectureId,d.college_id AS collegeId,c.university_id AS universityId,COALESCE(s.name,t.subject) AS subjectName,COALESCE(l.name,t.lecture) AS lectureName`;
const testPathSelect=`SELECT ${testPathFields} FROM tests t LEFT JOIN departments d ON d.id=t.department_id LEFT JOIN colleges c ON c.id=d.college_id LEFT JOIN subjects s ON s.id=t.subject_id LEFT JOIN lectures l ON l.id=t.lecture_id`;

export async function handleStudentLearningApi(request,env,url,user){
  if(!url.pathname.startsWith('/api/me/learning-hub')&&!url.pathname.startsWith('/api/me/favorites'))return null;
  if(!user)return fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401);
  if(user.role!=='student')return fail('FORBIDDEN','مركز التعلم مخصص لحسابات الطلاب',403);

  if(url.pathname==='/api/me/learning-hub'&&request.method==='GET'){
    const active=await env.DB.prepare(`SELECT ${testPathFields},a.id AS attemptId,a.started_at AS startedAt,a.last_saved_at AS lastSavedAt,a.deadline_at AS deadlineAt,(SELECT count(*) FROM questions q WHERE q.test_id=t.id) AS questionCount,(SELECT count(*) FROM attempt_answers aa WHERE aa.attempt_id=a.id) AS answeredCount FROM attempts a JOIN tests t ON t.id=a.test_id LEFT JOIN departments d ON d.id=t.department_id LEFT JOIN colleges c ON c.id=d.college_id LEFT JOIN subjects s ON s.id=t.subject_id LEFT JOIN lectures l ON l.id=t.lecture_id WHERE a.user_id=? AND a.status='in_progress' ORDER BY a.last_saved_at DESC LIMIT 1`).bind(user.id).first();
    const favoriteRows=await env.DB.prepare(`${testPathSelect} JOIN student_favorites f ON f.test_id=t.id WHERE f.user_id=? AND t.status='published' ORDER BY f.created_at DESC LIMIT 100`).bind(user.id).all();
    const weakRows=await env.DB.prepare(`SELECT t.subject_id AS subjectId,COALESCE(s.name,t.subject) AS subjectName,SUM(CASE WHEN aa.is_correct=0 THEN 1 ELSE 0 END) AS wrongAnswers,COUNT(*) AS answered,ROUND(100.0*SUM(CASE WHEN aa.is_correct=1 THEN 1 ELSE 0 END)/COUNT(*),1) AS accuracy FROM attempts a JOIN attempt_answers aa ON aa.attempt_id=a.id JOIN questions q ON q.id=aa.question_id JOIN tests t ON t.id=a.test_id LEFT JOIN subjects s ON s.id=t.subject_id WHERE a.user_id=? AND a.status='submitted' AND aa.is_correct IS NOT NULL GROUP BY t.subject_id,COALESCE(s.name,t.subject) HAVING SUM(CASE WHEN aa.is_correct=0 THEN 1 ELSE 0 END)>0 ORDER BY accuracy ASC,wrongAnswers DESC LIMIT 5`).bind(user.id).all();
    const reviewRows=await env.DB.prepare(`SELECT r.subject_id AS subjectId,s.name AS subjectName,r.interval_days AS intervalDays,r.last_score AS lastScore,r.last_reviewed_at AS lastReviewedAt,r.next_review_at AS nextReviewAt,CASE WHEN unixepoch(r.next_review_at)<=unixepoch('now') THEN 1 ELSE 0 END AS due FROM student_review_progress r JOIN subjects s ON s.id=r.subject_id WHERE r.user_id=? ORDER BY r.next_review_at ASC LIMIT 8`).bind(user.id).all();
    const favorites=favoriteRows.results.filter(test=>studentCanAccessTest(user,test));
    return json({activeAttempt:active&&studentCanAccessTest(user,active)?active:null,favorites,weakTopics:weakRows.results,reviewPlan:reviewRows.results});
  }

  const favorite=url.pathname.match(/^\/api\/me\/favorites\/([^/]+)$/);
  if(favorite&&['PUT','DELETE'].includes(request.method)){
    let testId='';try{testId=decodeURIComponent(favorite[1])}catch{return fail('VALIDATION','معرف الاختبار غير صالح')}if(!validId(testId))return fail('VALIDATION','معرف الاختبار غير صالح');
    const test=await env.DB.prepare(`${testPathSelect} WHERE t.id=? AND t.status='published'`).bind(testId).first();
    if(!test||!studentCanAccessTest(user,test))return fail('NOT_FOUND','الاختبار غير موجود ضمن مسارك',404);
    if(request.method==='PUT')await env.DB.prepare(`INSERT OR IGNORE INTO student_favorites(user_id,test_id) VALUES(?,?)`).bind(user.id,testId).run();
    else await env.DB.prepare(`DELETE FROM student_favorites WHERE user_id=? AND test_id=?`).bind(user.id,testId).run();
    return json({favorite:request.method==='PUT'});
  }
  return null;
}
