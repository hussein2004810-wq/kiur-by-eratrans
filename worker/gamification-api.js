import {hasPermission,loadGrants,permittedWith} from './access-control.js';
import {readJsonBody,secureHeaders} from './security.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})});
const fail=(code,message,status=400)=>json({error:{code,message}},status);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const round=value=>Math.round(Number(value)||0);
const capError=error=>String(error instanceof Error?error.message:error).includes('gamification_')&&String(error instanceof Error?error.message:error).includes('_cap');
const academicContext=row=>({universityId:row.universityId,collegeId:row.collegeId,departmentId:row.departmentId,phaseId:row.phaseId,sectionId:row.sectionId});
async function holdsPermission(env,user,permission){if(user?.role==='owner')return true;if(!['admin','teacher'].includes(user?.role))return false;return (await loadGrants(env,user.id)).some(grant=>grant.permissions.includes(permission))}

function seasonWindow(now=new Date()){
  const epoch=Date.UTC(2026,0,5);const length=28*86400000;const index=Math.max(0,Math.floor((now.getTime()-epoch)/length));
  const start=new Date(epoch+index*length),end=new Date(start.getTime()+length);
  const iso=value=>value.toISOString().slice(0,10);
  return {id:`season-${iso(start)}`,title:`موسم ${new Intl.DateTimeFormat('ar-IQ',{month:'long',year:'numeric',timeZone:'Asia/Baghdad'}).format(start)}`,startsAt:start.toISOString(),endsAt:end.toISOString()};
}
function weekStart(now=new Date()){
  const baghdad=new Date(now.getTime()+3*3600000);let day=(baghdad.getUTCDay()+6)%7;if(day===0)day=7;baghdad.setUTCDate(baghdad.getUTCDate()-day);baghdad.setUTCHours(0,0,0,0);return baghdad.toISOString().slice(0,10);
}
async function currentSeason(env){
  const season=seasonWindow();
  await env.DB.prepare(`INSERT OR IGNORE INTO gamification_seasons(id,title,starts_at,ends_at,status) VALUES(?,?,?,?,'active')`).bind(season.id,season.title,season.startsAt,season.endsAt).run();
  await env.DB.prepare(`INSERT OR IGNORE INTO gamification_settings(id) VALUES('platform')`).run();
  return season;
}
async function settings(env){return await env.DB.prepare(`SELECT enabled,practice_daily_cap AS practiceDailyCap,total_daily_cap AS totalDailyCap,weekly_days_target AS weeklyDaysTarget,updated_at AS updatedAt FROM gamification_settings WHERE id='platform'`).first()||{enabled:1,practiceDailyCap:180,totalDailyCap:350,weeklyDaysTarget:3}}

function scoreBreakdown({percentage,examMode,difficultyLevel,attemptNumber,previousBest,calibration}){
  if(attemptNumber>2)return {eligible:false,total:0,base:0,mastery:0,improvement:0,review:0};
  const mode=examMode==='formal'?1.2:.6;const difficulty=({1:.9,2:1,3:1.15})[Number(difficultyLevel)]||1;
  const base=clamp(round(percentage*mode*(difficulty+calibration)),0,examMode==='formal'?140:70);
  const mastery=percentage>=90?20:percentage>=80?10:0;
  const delta=Math.max(0,percentage-Number(previousBest||0));const improvement=attemptNumber===2?clamp(round(delta*1.5),0,35):0;
  const review=attemptNumber===2&&delta>=10?10:0;
  return {eligible:true,total:base+mastery+improvement+review,base,mastery,improvement,review};
}

async function progressMissions(env,userId,season,test,sourceEventId){
  const week=weekStart();const config=await settings(env);const missionId=`weekly:${userId}:${week}`;
  await env.DB.prepare(`INSERT OR IGNORE INTO gamification_missions(id,user_id,season_id,week_start,mission_type,target_value,reward_points) VALUES(?,?,?,?,'weekly_activity',?,25)`).bind(missionId,userId,season.id,week,Number(config.weeklyDaysTarget||3)).run();
  const activeDays=await env.DB.prepare(`SELECT count(DISTINCT date(created_at,'+3 hours')) AS value FROM gamification_point_ledger WHERE user_id=? AND season_id=? AND event_type='attempt' AND status='awarded' AND date(created_at,'+3 hours')>=?`).bind(userId,season.id,week).first();
  await env.DB.prepare(`UPDATE gamification_missions SET progress_value=MIN(target_value,?) WHERE id=?`).bind(Number(activeDays?.value||0),missionId).run();
  if(Number(activeDays?.value||0)>=Number(config.weeklyDaysTarget||3)){
    const eventId=crypto.randomUUID();let inserted={meta:{changes:0}};try{inserted=await env.DB.prepare(`INSERT OR IGNORE INTO gamification_point_ledger(id,user_id,season_id,event_type,points,status,idempotency_key,metadata_json) VALUES(?,?,?,'weekly_activity',25,'awarded',?,?)`).bind(eventId,userId,season.id,`mission:${missionId}`,JSON.stringify({missionId,sourceEventId})).run()}catch(error){if(!capError(error))throw error}
    if(Number(inserted.meta?.changes))await env.DB.prepare(`UPDATE gamification_missions SET status='completed',completed_at=CURRENT_TIMESTAMP WHERE id=?`).bind(missionId).run();
  }
  const weak=await env.DB.prepare(`SELECT t.subject_id AS subjectId,round(avg(a.percentage),2) AS average FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.user_id=? AND a.id<>? AND a.status='submitted' AND t.subject_id IS NOT NULL GROUP BY t.subject_id HAVING count(*)>=1 ORDER BY average ASC LIMIT 1`).bind(userId,test.id).first();
  if(!weak?.subjectId)return;
  const weakId=`weak:${userId}:${week}`;await env.DB.prepare(`INSERT OR IGNORE INTO gamification_missions(id,user_id,season_id,week_start,mission_type,subject_id,target_value,reward_points) VALUES(?,?,?,?,'weak_topic',?,1,20)`).bind(weakId,userId,season.id,week,weak.subjectId).run();
  if(String(test.subjectId||'')===String(weak.subjectId)){
    await env.DB.prepare(`UPDATE gamification_missions SET progress_value=1 WHERE id=?`).bind(weakId).run();
    const eventId=crypto.randomUUID();let inserted={meta:{changes:0}};try{inserted=await env.DB.prepare(`INSERT OR IGNORE INTO gamification_point_ledger(id,user_id,season_id,event_type,points,status,idempotency_key,metadata_json) VALUES(?,?,?,'weak_topic',20,'awarded',?,?)`).bind(eventId,userId,season.id,`mission:${weakId}`,JSON.stringify({missionId:weakId,sourceEventId})).run()}catch(error){if(!capError(error))throw error}
    if(Number(inserted.meta?.changes))await env.DB.prepare(`UPDATE gamification_missions SET status='completed',completed_at=CURRENT_TIMESTAMP WHERE id=?`).bind(weakId).run();
  }
}

export async function awardAttemptPoints(env,attempt,result){
  const season=await currentSeason(env);const config=await settings(env);if(!Number(config.enabled))return {awarded:0,disabled:true};
  const detail=await env.DB.prepare(`SELECT a.id,a.user_id AS userId,a.test_id AS testId,a.started_at AS startedAt,a.finished_at AS finishedAt,t.exam_mode AS examMode,t.difficulty_level AS difficultyLevel,t.subject_id AS subjectId,(SELECT count(*) FROM questions q WHERE q.test_id=a.test_id) AS questionCount FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.id=?`).bind(attempt.id).first();
  if(!detail)return {awarded:0};
  const count=await env.DB.prepare(`SELECT count(*) AS value FROM attempts WHERE user_id=? AND test_id=? AND status='submitted'`).bind(detail.userId,detail.testId).first();const attemptNumber=Number(count?.value||0);
  const previous=await env.DB.prepare(`SELECT max(percentage) AS value FROM attempts WHERE user_id=? AND test_id=? AND status='submitted' AND id<>?`).bind(detail.userId,detail.testId,attempt.id).first();
  const cohort=await env.DB.prepare(`SELECT count(DISTINCT a.user_id) AS students,avg(a.percentage) AS average FROM attempts a WHERE a.test_id=? AND a.status='submitted' AND a.id<>?`).bind(detail.testId,attempt.id).first();
  const calibration=Number(cohort?.students||0)>=30?(Number(cohort.average)<55?.1:Number(cohort.average)>88?-.05:0):0;
  const breakdown=scoreBreakdown({percentage:Number(result.percentage),examMode:detail.examMode,difficultyLevel:detail.difficultyLevel,attemptNumber,previousBest:Number(previous?.value||0),calibration});if(!breakdown.eligible)return {awarded:0,eligible:false};
  const daily=await env.DB.prepare(`SELECT coalesce(sum(points),0) AS total,coalesce(sum(CASE WHEN json_extract(metadata_json,'$.examMode')='practice' THEN points ELSE 0 END),0) AS practice FROM gamification_point_ledger WHERE user_id=? AND status='awarded' AND date(created_at,'+3 hours')=date('now','+3 hours')`).bind(detail.userId).first();
  const remainingTotal=Math.max(0,Number(config.totalDailyCap)-Number(daily?.total||0));const remainingPractice=detail.examMode==='practice'?Math.max(0,Number(config.practiceDailyCap)-Number(daily?.practice||0)):remainingTotal;const points=clamp(breakdown.total,0,Math.min(remainingTotal,remainingPractice));
  const duration=Math.max(0,(Date.parse(detail.finishedAt)-Date.parse(detail.startedAt))/1000);const suspicious=Number(result.percentage)===100&&duration<Math.max(15,Number(detail.questionCount||0)*2);const status=suspicious?'pending_review':'awarded';const id=crypto.randomUUID();
  const inserted=await env.DB.prepare(`INSERT OR IGNORE INTO gamification_point_ledger(id,user_id,season_id,attempt_id,test_id,event_type,points,status,idempotency_key,metadata_json) VALUES(?,?,?,?,?,'attempt',?,?,?,?)`).bind(id,detail.userId,season.id,attempt.id,detail.testId,points,status,`attempt:${attempt.id}`,JSON.stringify({...breakdown,examMode:detail.examMode,difficultyLevel:detail.difficultyLevel,attemptNumber,calibration,durationSeconds:duration})).run();
  if(Number(inserted.meta?.changes)&&status==='awarded')await progressMissions(env,detail.userId,season,detail,id);
  return {awarded:Number(inserted.meta?.changes)?(status==='awarded'?points:0):0,status,breakdown};
}

async function studentDashboard(env,user){
  const season=await currentSeason(env);const config=await settings(env);await env.DB.prepare(`INSERT OR IGNORE INTO student_gamification_profiles(user_id) VALUES(?)`).bind(user.id).run();
  const [profile,lifetime,seasonPoints,missions,goal]=await Promise.all([
    env.DB.prepare(`SELECT nickname,leaderboard_visible AS leaderboardVisible,selected_frame AS selectedFrame FROM student_gamification_profiles WHERE user_id=?`).bind(user.id).first(),
    env.DB.prepare(`SELECT coalesce(sum(points),0) AS value FROM gamification_point_ledger WHERE user_id=? AND status='awarded'`).bind(user.id).first(),
    env.DB.prepare(`SELECT coalesce(sum(points),0) AS value FROM gamification_point_ledger WHERE user_id=? AND season_id=? AND status='awarded'`).bind(user.id,season.id).first(),
    env.DB.prepare(`SELECT m.id,m.mission_type AS missionType,m.target_value AS targetValue,m.progress_value AS progressValue,m.reward_points AS rewardPoints,m.status,s.name AS subjectName FROM gamification_missions m LEFT JOIN subjects s ON s.id=m.subject_id WHERE m.user_id=? AND m.week_start=? ORDER BY m.mission_type`).bind(user.id,weekStart()).all(),
    user.sectionId?env.DB.prepare(`SELECT g.id,g.title,g.target_points AS targetPoints,g.reward_label AS rewardLabel,(SELECT coalesce(sum(l.points),0) FROM gamification_point_ledger l JOIN users u ON u.id=l.user_id WHERE l.season_id=g.season_id AND l.status='awarded' AND u.section_id=g.section_id) AS currentPoints FROM gamification_section_goals g WHERE g.section_id=? AND g.season_id=? AND g.status='active' ORDER BY g.created_at DESC LIMIT 1`).bind(user.sectionId,season.id).first():Promise.resolve(null)
  ]);
  const cohort=await env.DB.prepare(`SELECT u.id,COALESCE(NULLIF(p.nickname,''),substr(u.name,1,1)||'•••') AS displayName,coalesce(sum(l.points),0) AS points FROM users u LEFT JOIN student_gamification_profiles p ON p.user_id=u.id LEFT JOIN gamification_point_ledger l ON l.user_id=u.id AND l.season_id=? AND l.status='awarded' WHERE u.account_role='student' AND u.account_status='active' AND u.university_id IS ? AND u.college_id IS ? AND u.department_id IS ? AND u.phase_id IS ? AND u.section_id IS ? AND coalesce(p.leaderboard_visible,1)=1 GROUP BY u.id ORDER BY points DESC,u.created_at LIMIT 20`).bind(season.id,user.universityId||null,user.collegeId||null,user.departmentId||null,user.phaseId||null,user.sectionId||null).all();
  const all=await env.DB.prepare(`SELECT u.id,coalesce(sum(l.points),0) AS points FROM users u LEFT JOIN gamification_point_ledger l ON l.user_id=u.id AND l.season_id=? AND l.status='awarded' WHERE u.account_role='student' AND u.account_status='active' AND u.university_id IS ? AND u.college_id IS ? AND u.department_id IS ? AND u.phase_id IS ? AND u.section_id IS ? GROUP BY u.id ORDER BY points DESC`).bind(season.id,user.universityId||null,user.collegeId||null,user.departmentId||null,user.phaseId||null,user.sectionId||null).all();
  const index=all.results.findIndex(item=>item.id===user.id),size=all.results.length,percentile=index<0?100:Math.ceil((index+1)/Math.max(1,size)*100);const band=percentile<=10?'أفضل 10%':percentile<=20?'أفضل 20%':percentile<=40?'أفضل 40%':'في طور التقدم';const xp=Number(lifetime?.value||0),level=Math.floor(Math.sqrt(xp/120))+1,nextLevel=level*level*120;
  const badgeDefs=[['first','البداية الذكية',xp>=1],['steady','إيقاع ثابت',xp>=300],['master','إتقان سريري',xp>=900],['mentor','نبض المعرفة',xp>=1800]];for(const [id,,earned] of badgeDefs){if(earned)await env.DB.prepare(`INSERT OR IGNORE INTO student_gamification_badges(user_id,badge_id) VALUES(?,?)`).bind(user.id,id).run()}
  const earned=await env.DB.prepare(`SELECT badge_id AS badgeId,earned_at AS earnedAt FROM student_gamification_badges WHERE user_id=? ORDER BY earned_at`).bind(user.id).all();
  return {enabled:Boolean(config.enabled),season,profile:{nickname:profile?.nickname||'',leaderboardVisible:Boolean(profile?.leaderboardVisible),selectedFrame:profile?.selectedFrame||'pulse'},summary:{seasonPoints:Number(seasonPoints?.value||0),lifetimePoints:xp,level,nextLevel,progress:Math.round((xp-(level-1)*(level-1)*120)/Math.max(1,nextLevel-(level-1)*(level-1)*120)*100),band,cohortSize:size},missions:missions.results,leaderboard:cohort.results.map((item,i)=>({...item,position:i+1,isMe:item.id===user.id})),badges:earned.results,sectionGoal:goal};
}

export async function handleGamificationApi(request,env,url,user){
  if(!url.pathname.startsWith('/api/gamification')&&!url.pathname.startsWith('/api/admin/gamification'))return null;
  if(!user)return fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401);
  if(url.pathname==='/api/gamification'&&request.method==='GET'){if(user.role!=='student')return fail('FORBIDDEN','هذه الصفحة للطلاب فقط',403);return json(await studentDashboard(env,user))}
  if(url.pathname==='/api/gamification/preferences'&&request.method==='PATCH'){
    if(user.role!=='student')return fail('FORBIDDEN','هذه الصفحة للطلاب فقط',403);const parsed=await readJsonBody(request);if(parsed.error)return fail(parsed.error.code,parsed.error.message,parsed.error.status);const v=parsed.value||{},nickname=String(v.nickname||'').trim();if(nickname.length>24||(/[<>]/.test(nickname)))return fail('VALIDATION','اللقب يجب ألا يتجاوز 24 حرفًا ولا يحتوي رموزًا غير مسموحة');const frame=['pulse','clinical','cuneiform'].includes(v.selectedFrame)?v.selectedFrame:'pulse';await env.DB.prepare(`INSERT INTO student_gamification_profiles(user_id,nickname,leaderboard_visible,selected_frame) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET nickname=excluded.nickname,leaderboard_visible=excluded.leaderboard_visible,selected_frame=excluded.selected_frame,updated_at=CURRENT_TIMESTAMP`).bind(user.id,nickname||null,v.leaderboardVisible===false?0:1,frame).run();return json({saved:true})
  }
  if(url.pathname==='/api/admin/gamification/settings'&&request.method==='PUT'){
    if(user.role!=='owner')return fail('FORBIDDEN','سياسة النقاط يحددها مالك المنصة فقط',403);const parsed=await readJsonBody(request);if(parsed.error)return fail(parsed.error.code,parsed.error.message,parsed.error.status);const v=parsed.value||{},practice=Number(v.practiceDailyCap),total=Number(v.totalDailyCap),days=Number(v.weeklyDaysTarget);if(!Number.isInteger(practice)||practice<20||practice>1000||!Number.isInteger(total)||total<practice||total>2000||!Number.isInteger(days)||days<1||days>7)return fail('VALIDATION','قيم سياسة النقاط غير صالحة');await currentSeason(env);await env.DB.prepare(`UPDATE gamification_settings SET enabled=?,practice_daily_cap=?,total_daily_cap=?,weekly_days_target=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id='platform'`).bind(v.enabled===false?0:1,practice,total,days,user.id).run();await env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('gamification','platform','policy_update',?,?)`).bind(user.id,JSON.stringify({practice,total,days,enabled:v.enabled!==false})).run();return json({saved:true})
  }
  if(url.pathname==='/api/admin/gamification/settings'&&request.method==='GET'){
    if(!(await holdsPermission(env,user,'manage_gamification'))&&!(await holdsPermission(env,user,'review_gamification')))return fail('FORBIDDEN','لا تملك صلاحية عرض نظام النقاط',403);await currentSeason(env);return json(await settings(env));
  }
  if(url.pathname==='/api/admin/gamification/reviews'&&request.method==='GET'){
    if(!(await holdsPermission(env,user,'review_gamification')))return fail('FORBIDDEN','لا تملك صلاحية مراجعة النقاط',403);const rows=await env.DB.prepare(`SELECT l.id,l.points,l.created_at AS createdAt,l.metadata_json AS metadata,u.name,u.email,u.university_id AS universityId,u.college_id AS collegeId,u.department_id AS departmentId,u.phase_id AS phaseId,u.section_id AS sectionId,t.title AS testTitle FROM gamification_point_ledger l JOIN users u ON u.id=l.user_id LEFT JOIN tests t ON t.id=l.test_id WHERE l.status='pending_review' ORDER BY l.created_at LIMIT 100`).all();const grants=user.role==='owner'?[]:await loadGrants(env,user.id);const visible=rows.results.filter(row=>user.role==='owner'||permittedWith(grants,'review_gamification',academicContext(row))).map(row=>({...row,metadata:JSON.parse(row.metadata||'{}')}));return json({data:visible})
  }
  const review=url.pathname.match(/^\/api\/admin\/gamification\/reviews\/([^/]+)$/);if(review&&request.method==='PATCH'){
    const row=await env.DB.prepare(`SELECT l.id,u.university_id AS universityId,u.college_id AS collegeId,u.department_id AS departmentId,u.phase_id AS phaseId,u.section_id AS sectionId FROM gamification_point_ledger l JOIN users u ON u.id=l.user_id WHERE l.id=? AND l.status='pending_review'`).bind(review[1]).first();if(!row)return fail('NOT_FOUND','طلب المراجعة غير موجود',404);if(user.role!=='owner'&&!(await hasPermission(env,user,'review_gamification',academicContext(row))))return fail('FORBIDDEN','الطلب خارج نطاق صلاحيتك',403);const parsed=await readJsonBody(request);if(parsed.error)return fail(parsed.error.code,parsed.error.message,parsed.error.status);const decision=parsed.value?.decision,note=String(parsed.value?.note||'').trim();if(!['approve','void'].includes(decision)||note.length>500)return fail('VALIDATION','قرار المراجعة غير صالح');await env.DB.batch([env.DB.prepare(`UPDATE gamification_point_ledger SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_note=? WHERE id=? AND status='pending_review'`).bind(decision==='approve'?'awarded':'void',user.id,note||null,row.id),env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('gamification',?,?,?,?)`).bind(row.id,decision==='approve'?'points_approved':'points_voided',user.id,JSON.stringify({note}))]);return json({updated:true})
  }
  return fail('NOT_FOUND','المسار غير موجود',404);
}

export {scoreBreakdown,seasonWindow,weekStart};
