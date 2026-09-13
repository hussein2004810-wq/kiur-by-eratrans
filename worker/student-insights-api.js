import {escapeLike,secureHeaders} from './security.js';
import {loadGrants,permittedWith} from './access-control.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})})}
function fail(code,message,status=400){return json({error:{code,message}},status)}
function denyUser(user){return user?null:fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401)}
function denyReporter(user){return ['owner','admin','teacher'].includes(user?.role)?null:fail('FORBIDDEN','هذه العملية للكوادر المخولة فقط',403)}
function context(row){return {universityId:row.universityId,collegeId:row.collegeId,departmentId:row.departmentId,phaseId:row.phaseId,sectionId:row.sectionId}}

export async function handleStudentInsightsApi(request,env,url,user){
  const review=url.pathname.match(/^\/api\/attempts\/([^/]+)\/review$/);
  if(review&&request.method==='GET'){
    const denied=denyUser(user);if(denied)return denied;
    const attempt=await env.DB.prepare(`SELECT a.id,a.score,a.max_score AS maxScore,a.percentage,a.finished_at AS finishedAt,t.title,t.pass_percentage AS passPercentage,t.exam_mode AS examMode,t.available_until AS availableUntil FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.id=? AND a.user_id=? AND a.status='submitted'`).bind(review[1],user.id).first();
    if(!attempt)return fail('NOT_FOUND','مراجعة المحاولة غير متاحة',404);
    if(attempt.examMode==='formal'&&attempt.availableUntil&&Date.parse(attempt.availableUntil)>Date.now())return fail('REVIEW_LOCKED','تظهر الإجابات الصحيحة بعد انتهاء نافذة الاختبار الرسمي',403);
    const questions=await env.DB.prepare(`SELECT q.id,q.text,q.options_json,q.correct_option AS correctOption,q.explanation,q.position,q.question_type AS questionType,q.accepted_answers_json AS acceptedAnswers,q.image_id AS imageId,aa.selected_option AS selectedOption,aa.answer_text AS answerText,aa.is_correct AS isCorrect FROM attempts a JOIN questions q ON q.test_id=a.test_id LEFT JOIN attempt_answers aa ON aa.attempt_id=a.id AND aa.question_id=q.id WHERE a.id=? AND a.user_id=? ORDER BY q.position`).bind(review[1],user.id).all();
    return json({...attempt,passed:Number(attempt.percentage)>=Number(attempt.passPercentage),questions:questions.results.map(item=>({...item,options:JSON.parse(item.options_json),acceptedAnswers:item.acceptedAnswers?JSON.parse(item.acceptedAnswers):[],selectedOption:item.selectedOption===null?null:Number(item.selectedOption),correctOption:Number(item.correctOption),isCorrect:Number(item.isCorrect)===1,imageUrl:item.imageId?`/api/media/${encodeURIComponent(item.imageId)}`:null}))});
  }

  if(url.pathname==='/api/admin/students'&&request.method==='GET'){
    const denied=denyReporter(user);if(denied)return denied;
    const limit=Math.min(200,Math.max(1,Number(url.searchParams.get('limit'))||100));const offset=Math.max(0,Number(url.searchParams.get('offset'))||0);const search=(url.searchParams.get('q')||'').trim().slice(0,80);const filters=[`u.account_role='student'`],binds=[];if(search){const eq=escapeLike(search);filters.push("(u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')");binds.push(`%${eq}%`,`%${eq}%`)}for(const [param,column] of [['universityId','u.university_id'],['collegeId','u.college_id'],['departmentId','u.department_id'],['phaseId','u.phase_id'],['sectionId','u.section_id']]){const value=String(url.searchParams.get(param)||'').slice(0,100);if(value){filters.push(`${column}=?`);binds.push(value)}}
    let attemptScopeSql = '1=1';
    let latestScopeSql = '1=1';
    const attemptScopeBinds = [];
    const latestScopeBinds = [];

    if(user.role!=='owner'){
      const grants=await loadGrants(env,user.id);
      const studentGrants=(grants||[]).filter(g=>g.permissions.includes('view_student_log')||g.permissions.includes('view_reports')||g.permissions.includes('manage_students'));
      if(studentGrants.length===0){
        return json({data:[],total:0,limit,offset,filters:{search,universityId:url.searchParams.get('universityId')||'',collegeId:url.searchParams.get('collegeId')||'',departmentId:url.searchParams.get('departmentId')||'',phaseId:url.searchParams.get('phaseId')||'',sectionId:url.searchParams.get('sectionId')||''}});
      }
      const hasPlatform=studentGrants.some(g=>g.scopeType==='platform');
      if(!hasPlatform){
        const scopeClauses=[];
        const identityClauses=[];
        const identityBinds=[];
        const contentClauses=[];
        const contentClauses2=[];
        const contentBinds=[];

        const colMap={university:'u.university_id',college:'u.college_id',department:'u.department_id',phase:'u.phase_id',section:'u.section_id'};
        const seenScopes=new Set();
        for(const g of studentGrants){
          if(!g.scopeId)continue;
          const key=`${g.scopeType}:${g.scopeId}`;
          if(seenScopes.has(key))continue;
          seenScopes.add(key);
          const col=colMap[g.scopeType];
          if(col){
            scopeClauses.push(`${col}=?`);
            binds.push(g.scopeId);

            identityClauses.push(`${col}=?`);
            identityBinds.push(g.scopeId);
          }else if(g.scopeType==='subject'){
            scopeClauses.push(`EXISTS (SELECT 1 FROM attempts sa JOIN tests st ON st.id=sa.test_id WHERE sa.user_id=u.id AND sa.status='submitted' AND st.subject_id=?)`);
            binds.push(g.scopeId);

            contentClauses.push(`t.subject_id=?`);
            contentClauses2.push(`t2.subject_id=?`);
            contentBinds.push(g.scopeId);
          }else if(g.scopeType==='lecture'){
            scopeClauses.push(`EXISTS (SELECT 1 FROM attempts sa JOIN tests st ON st.id=sa.test_id WHERE sa.user_id=u.id AND sa.status='submitted' AND st.lecture_id=?)`);
            binds.push(g.scopeId);

            contentClauses.push(`t.lecture_id=?`);
            contentClauses2.push(`t2.lecture_id=?`);
            contentBinds.push(g.scopeId);
          }
        }
        if(scopeClauses.length>0){
          filters.push(`(${scopeClauses.join(' OR ')})`);
        }else{
          filters.push('1=0');
        }

        const parts=[];
        const parts2=[];
        if(identityClauses.length>0){
          parts.push(`(${identityClauses.join(' OR ')})`);
          parts2.push(`(${identityClauses.join(' OR ')})`);
        }
        if(contentClauses.length>0){
          parts.push(`(${contentClauses.join(' OR ')})`);
          parts2.push(`(${contentClauses2.join(' OR ')})`);
        }
        if(parts.length>0){
          attemptScopeSql=`(${parts.join(' OR ')})`;
          latestScopeSql=`(${parts2.join(' OR ')})`;
          attemptScopeBinds.push(...identityBinds,...contentBinds);
          latestScopeBinds.push(...identityBinds,...contentBinds);
        }else{
          attemptScopeSql='1=0';
          latestScopeSql='1=0';
        }
      }
    }
    const where=filters.join(' AND ');
    const count=await env.DB.prepare(`SELECT count(*) AS total FROM users u WHERE ${where}`).bind(...binds).first();
    const sql=`SELECT u.id,u.name,u.email,u.created_at AS registeredAt,u.university_id AS universityId,u.college_id AS collegeId,u.department_id AS departmentId,u.phase_id AS phaseId,u.section_id AS sectionId,v.name AS universityName,c.name AS collegeName,COALESCE(d.display_name,d.name) AS departmentName,p.name AS phaseName,x.name AS sectionName,count(a.id) AS attempts,COALESCE(round(avg(a.percentage),2),0) AS averagePercentage,COALESCE(max(a.percentage),0) AS highestPercentage,COALESCE(sum(CASE WHEN a.percentage>=t.pass_percentage THEN 1 ELSE 0 END),0) AS passedAttempts,COALESCE(sum(CASE WHEN a.percentage<t.pass_percentage THEN 1 ELSE 0 END),0) AS failedAttempts,max(a.finished_at) AS lastActivity,(SELECT a2.percentage FROM attempts a2 JOIN tests t2 ON t2.id=a2.test_id WHERE a2.user_id=u.id AND a2.status='submitted' AND ${latestScopeSql} ORDER BY a2.finished_at DESC, a2.id DESC LIMIT 1) AS latestPercentage FROM users u LEFT JOIN universities v ON v.id=u.university_id LEFT JOIN colleges c ON c.id=u.college_id LEFT JOIN departments d ON d.id=u.department_id LEFT JOIN phases p ON p.id=u.phase_id LEFT JOIN sections x ON x.id=u.section_id LEFT JOIN (attempts a JOIN tests t ON t.id=a.test_id) ON a.user_id=u.id AND a.status='submitted' AND ${attemptScopeSql} WHERE ${where} GROUP BY u.id ORDER BY COALESCE(max(a.finished_at),u.created_at) DESC, u.id DESC LIMIT ? OFFSET ?`;
    const result=await env.DB.prepare(sql).bind(...latestScopeBinds,...attemptScopeBinds,...binds,limit,offset).all();
    return json({data:result.results,total:Number(count?.total||0),limit,offset,filters:{search,universityId:url.searchParams.get('universityId')||'',collegeId:url.searchParams.get('collegeId')||'',departmentId:url.searchParams.get('departmentId')||'',phaseId:url.searchParams.get('phaseId')||'',sectionId:url.searchParams.get('sectionId')||''}});
  }
  if(url.pathname==='/api/admin/results'&&request.method==='GET'){
    const denied=denyReporter(user);if(denied)return denied;const rows=await env.DB.prepare(`SELECT a.id AS attemptId,a.started_at AS startedAt,a.finished_at AS finishedAt,a.score,a.max_score AS maxScore,a.percentage,u.id AS studentId,u.name AS studentName,u.email,t.id AS testId,t.title AS testTitle,t.subject,t.lecture,t.department_id AS departmentId,t.phase_id AS phaseId,t.section_id AS sectionId,t.subject_id AS subjectId,t.lecture_id AS lectureId,c.university_id AS universityId,d.college_id AS collegeId,v.name AS universityName,c.name AS collegeName,COALESCE(d.display_name,d.name) AS departmentName,p.name AS phaseName,x.name AS sectionName FROM attempts a JOIN users u ON u.id=a.user_id JOIN tests t ON t.id=a.test_id LEFT JOIN departments d ON d.id=t.department_id LEFT JOIN colleges c ON c.id=d.college_id LEFT JOIN universities v ON v.id=c.university_id LEFT JOIN phases p ON p.id=t.phase_id LEFT JOIN sections x ON x.id=t.section_id WHERE a.status='submitted' ORDER BY a.finished_at DESC LIMIT 5000`).all();const grants=user.role==='owner'?null:await loadGrants(env,user.id);const data=user.role==='owner'?rows.results:rows.results.filter(row=>permittedWith(grants,'view_reports',row));return json({data,generatedAt:new Date().toISOString()});
  }
  return null;
}
