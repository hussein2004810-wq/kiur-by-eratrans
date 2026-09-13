import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {performance} from 'node:perf_hooks';
import {handleStudentInsightsApi} from '../worker/student-insights-api.js';

class Statement{constructor(database,sql){this.statement=database.prepare(sql)}bind(...values){this.values=values;return this}async first(){return this.statement.get(...(this.values||[]))||null}async all(){return {results:this.statement.all(...(this.values||[]))}}async run(){const result=this.statement.run(...(this.values||[]));return {meta:{changes:Number(result.changes)}}}}
class D1{constructor(database){this.database=database}prepare(sql){return new Statement(this.database,sql)}async batch(statements){const results=[];for(const statement of statements)results.push(await statement.run());return results}}
const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
for(const file of ['drizzle/0000_medexam.sql','drizzle/0001_academic_hierarchy.sql','drizzle/0002_backfill_existing_tests.sql','drizzle/0003_scale_indexes.sql','drizzle/0004_attempt_shuffle.sql','drizzle/0005_security_hardening.sql','drizzle/0006_accounts_organizations_permissions.sql','drizzle/0007_exam_modes_question_types_files.sql','drizzle/0008_staff_titles_and_college_copy.sql','drizzle/0009_clinical_glimpses_library_logs.sql','drizzle/0010_student_bans.sql','drizzle/0011_security_hardening.sql','drizzle/0013_academic_trash_and_notifications.sql','drizzle/0016_auth_session_epoch.sql'])sqlite.exec(await readFile(file,'utf8'));
sqlite.prepare(`INSERT INTO users(id,email,name,role,department_id,phase_id) VALUES(?,?,?,?,?,?)`).run('student-1','student@example.com','طالب تجريبي','student','dep-anesthesia','pha-a4');
sqlite.prepare(`INSERT INTO users(id,email,name,role,account_role) VALUES(?,?,?,?,?)`).run('admin-1','admin@example.com','مشرف','admin','admin');
sqlite.prepare(`INSERT INTO attempts(id,user_id,test_id,status,score,max_score,percentage,finished_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run('attempt-1','student-1','demo-preop','submitted',1,3,33.33);
sqlite.prepare(`INSERT INTO attempt_answers(attempt_id,question_id,selected_option,is_correct) VALUES(?,?,?,?)`).run('attempt-1','demo-q1',0,0);
sqlite.prepare(`INSERT INTO attempt_answers(attempt_id,question_id,selected_option,is_correct) VALUES(?,?,?,?)`).run('attempt-1','demo-q2',1,1);
const env={DB:new D1(sqlite)};
async function call(path,user){const request=new Request('https://example.test'+path);const response=await handleStudentInsightsApi(request,env,new URL(request.url),user);return {status:response.status,data:await response.json()}}
const review=await call('/api/attempts/attempt-1/review',{id:'student-1',role:'student'});if(review.status!==200||review.data.questions.filter(item=>!item.isCorrect).length!==2)throw new Error('Attempt review verification failed');
const students=await call('/api/admin/students?limit=50',{id:'admin-1',role:'owner'});if(students.status!==200||students.data.total!==1||Number(students.data.data[0].averagePercentage)!==33.33)throw new Error('Student report verification failed');
sqlite.prepare(`INSERT INTO users(id,email,name,role,department_id,phase_id) VALUES(?,?,?,?,?,?)`).run('student-2','student2@example.com','طالب تخدير 2','student','dep-anesthesia','pha-a4');
sqlite.prepare(`INSERT INTO users(id,email,name,role,department_id,phase_id) VALUES(?,?,?,?,?,?)`).run('student-3','student3@example.com','طالب تخدير 3','student','dep-anesthesia','pha-a4');
sqlite.prepare(`INSERT INTO users(id,email,name,role,department_id,phase_id) VALUES(?,?,?,?,?,?)`).run('student-4','student4@example.com','طالب طب 1','student','dep-medicine','pha-m1');
sqlite.prepare(`INSERT INTO users(id,email,name,role,department_id,phase_id) VALUES(?,?,?,?,?,?)`).run('student-5','student5@example.com','طالب تمريض 1','student','dep-nursing','pha-n1');
sqlite.prepare(`INSERT INTO users(id,email,name,role,account_role) VALUES(?,?,?,?,?)`).run('admin-scoped','admin.scoped@example.com','مشرف تخدير','admin','admin');
sqlite.prepare(`INSERT INTO user_grants(id,user_id,grant_role,scope_type,scope_id,permissions_json,granted_by) VALUES(?,?,?,?,?,?,?)`).run('grant-anesthesia','admin-scoped','admin','department','dep-anesthesia',JSON.stringify(['view_student_log','view_reports']),'admin-1');
const ownerP1=await call('/api/admin/students?limit=2&offset=0',{id:'admin-1',role:'owner'});
const ownerP2=await call('/api/admin/students?limit=2&offset=2',{id:'admin-1',role:'owner'});
const ownerP3=await call('/api/admin/students?limit=2&offset=4',{id:'admin-1',role:'owner'});
if(ownerP1.status!==200||ownerP1.data.total!==5||ownerP1.data.data.length!==2)throw new Error('Owner pagination page 1 failed');
if(ownerP2.status!==200||ownerP2.data.total!==5||ownerP2.data.data.length!==2)throw new Error('Owner pagination page 2 failed');
if(ownerP3.status!==200||ownerP3.data.total!==5||ownerP3.data.data.length!==1)throw new Error('Owner pagination page 3 failed');
const allOwnerIds=[...ownerP1.data.data,...ownerP2.data.data,...ownerP3.data.data].map(s=>s.id);
if(new Set(allOwnerIds).size!==5)throw new Error('Owner pagination returned duplicates or missed rows');
const scopedP1=await call('/api/admin/students?limit=2&offset=0',{id:'admin-scoped',role:'admin'});
const scopedP2=await call('/api/admin/students?limit=2&offset=2',{id:'admin-scoped',role:'admin'});
const scopedP3=await call('/api/admin/students?limit=2&offset=4',{id:'admin-scoped',role:'admin'});
if(scopedP1.status!==200||scopedP1.data.total!==3||scopedP1.data.data.length!==2)throw new Error('Scoped admin page 1 failed');
if(scopedP2.status!==200||scopedP2.data.total!==3||scopedP2.data.data.length!==1)throw new Error('Scoped admin page 2 failed');
if(scopedP3.status!==200||scopedP3.data.total!==3||scopedP3.data.data.length!==0)throw new Error('Scoped admin page 3 failed');
const allScopedIds=[...scopedP1.data.data,...scopedP2.data.data].map(s=>s.id);
if(allScopedIds.length!==3||new Set(allScopedIds).size!==3||allScopedIds.some(id=>['student-4','student-5'].includes(id)))throw new Error('Scoped admin pagination leaked out-of-scope records');

sqlite.prepare(`INSERT INTO tests(id,title,subject,lecture,duration_minutes,created_by,department_id,phase_id,subject_id,lecture_id) VALUES(?,?,?,?,?,?,?,?,?,?)`).run('test-sub-2','اختبار المحاضرة الثانية','التخدير العام','المحاضرة الثانية',20,'system','dep-anesthesia','pha-a4','sub-a4-general','lec-a4-general-2');
sqlite.prepare(`INSERT INTO tests(id,title,subject,lecture,duration_minutes,created_by,department_id,phase_id,subject_id,lecture_id) VALUES(?,?,?,?,?,?,?,?,?,?)`).run('test-nursing','اختبار التمريض','أساسيات التمريض','المحاضرة الأولى',20,'system','dep-nursing','pha-n1','sub-n1-fundamentals','lec-n1-fundamentals-1');
sqlite.prepare(`INSERT INTO attempts(id,user_id,test_id,status,score,max_score,percentage,finished_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run('attempt-2','student-2','demo-preop','submitted',2,3,66.67);
sqlite.prepare(`INSERT INTO attempts(id,user_id,test_id,status,score,max_score,percentage,finished_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run('attempt-4','student-4','test-sub-2','submitted',3,3,100);
sqlite.prepare(`INSERT INTO attempts(id,user_id,test_id,status,score,max_score,percentage,finished_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run('attempt-5','student-5','test-nursing','submitted',2,3,66.67);
sqlite.prepare(`INSERT INTO attempts(id,user_id,test_id,status,score,max_score,percentage,started_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run('attempt-3-in-progress','student-3','demo-preop','in_progress',0,3,0);

sqlite.prepare(`INSERT INTO users(id,email,name,role,account_role) VALUES(?,?,?,?,?)`).run('teacher-subject','teacher.subject@example.com','أستاذ مادة التخدير','admin','teacher');
sqlite.prepare(`INSERT INTO user_grants(id,user_id,grant_role,scope_type,scope_id,permissions_json,granted_by) VALUES(?,?,?,?,?,?,?)`).run('grant-subject','teacher-subject','teacher','subject','sub-a4-general',JSON.stringify(['view_student_log']),'admin-1');

const subP1=await call('/api/admin/students?limit=2&offset=0',{id:'teacher-subject',role:'teacher'});
const subP2=await call('/api/admin/students?limit=2&offset=2',{id:'teacher-subject',role:'teacher'});
const subP3=await call('/api/admin/students?limit=2&offset=4',{id:'teacher-subject',role:'teacher'});
if(subP1.status!==200||subP1.data.total!==3||subP1.data.data.length!==2)throw new Error('Subject scope pagination page 1 failed');
if(subP2.status!==200||subP2.data.total!==3||subP2.data.data.length!==1)throw new Error('Subject scope pagination page 2 failed');
if(subP3.status!==200||subP3.data.total!==3||subP3.data.data.length!==0)throw new Error('Subject scope pagination page 3 failed');
const allSubIds=[...subP1.data.data,...subP2.data.data].map(s=>s.id);
if(allSubIds.length!==3||new Set(allSubIds).size!==3||allSubIds.some(id=>['student-3','student-5'].includes(id)))throw new Error('Subject scope leaked unauthorized students or returned duplicates');

sqlite.prepare(`INSERT INTO users(id,email,name,role,account_role) VALUES(?,?,?,?,?)`).run('teacher-lecture','teacher.lecture@example.com','مقرر محاضرة 3','admin','teacher');
sqlite.prepare(`INSERT INTO user_grants(id,user_id,grant_role,scope_type,scope_id,permissions_json,granted_by) VALUES(?,?,?,?,?,?,?)`).run('grant-lecture','teacher-lecture','teacher','lecture','lec-a4-general-3',JSON.stringify(['view_reports']),'admin-1');

const lecP1=await call('/api/admin/students?limit=1&offset=0',{id:'teacher-lecture',role:'teacher'});
const lecP2=await call('/api/admin/students?limit=1&offset=1',{id:'teacher-lecture',role:'teacher'});
const lecP3=await call('/api/admin/students?limit=1&offset=2',{id:'teacher-lecture',role:'teacher'});
if(lecP1.status!==200||lecP1.data.total!==2||lecP1.data.data.length!==1)throw new Error('Lecture scope pagination page 1 failed');
if(lecP2.status!==200||lecP2.data.total!==2||lecP2.data.data.length!==1)throw new Error('Lecture scope pagination page 2 failed');
if(lecP3.status!==200||lecP3.data.total!==2||lecP3.data.data.length!==0)throw new Error('Lecture scope pagination page 3 failed');
const allLecIds=[...lecP1.data.data,...lecP2.data.data].map(s=>s.id);
if(allLecIds.length!==2||new Set(allLecIds).size!==2||allLecIds.some(id=>['student-3','student-4','student-5'].includes(id)))throw new Error('Lecture scope leaked unauthorized students or returned duplicates');

sqlite.prepare(`INSERT INTO users(id,email,name,role,account_role) VALUES(?,?,?,?,?)`).run('teacher-combo','teacher.combo@example.com','كادر مشترك','admin','teacher');
sqlite.prepare(`INSERT INTO user_grants(id,user_id,grant_role,scope_type,scope_id,permissions_json,granted_by) VALUES(?,?,?,?,?,?,?)`).run('grant-combo-1','teacher-combo','teacher','subject','sub-n1-fundamentals',JSON.stringify(['view_reports']),'admin-1');
sqlite.prepare(`INSERT INTO user_grants(id,user_id,grant_role,scope_type,scope_id,permissions_json,granted_by) VALUES(?,?,?,?,?,?,?)`).run('grant-combo-2','teacher-combo','teacher','lecture','lec-a4-general-2',JSON.stringify(['view_student_log']),'admin-1');

const comboP1=await call('/api/admin/students?limit=1&offset=0',{id:'teacher-combo',role:'teacher'});
const comboP2=await call('/api/admin/students?limit=1&offset=1',{id:'teacher-combo',role:'teacher'});
const comboP3=await call('/api/admin/students?limit=1&offset=2',{id:'teacher-combo',role:'teacher'});
if(comboP1.status!==200||comboP1.data.total!==2||comboP1.data.data.length!==1)throw new Error('Combo scope pagination page 1 failed');
if(comboP2.status!==200||comboP2.data.total!==2||comboP2.data.data.length!==1)throw new Error('Combo scope pagination page 2 failed');
if(comboP3.status!==200||comboP3.data.total!==2||comboP3.data.data.length!==0)throw new Error('Combo scope pagination page 3 failed');
const allComboIds=[...comboP1.data.data,...comboP2.data.data].map(s=>s.id);
if(allComboIds.length!==2||new Set(allComboIds).size!==2||!allComboIds.includes('student-4')||!allComboIds.includes('student-5'))throw new Error('Combo scope failed or leaked');

const earlierDate='2026-01-10 10:00:00';
const laterDate='2026-03-01 15:30:00';
sqlite.prepare(`UPDATE attempts SET finished_at=? WHERE id='attempt-1'`).run(earlierDate);
sqlite.prepare(`INSERT INTO attempts(id,user_id,test_id,status,score,max_score,percentage,finished_at) VALUES(?,?,?,?,?,?,?,?)`).run('attempt-1-outside','student-1','test-nursing','submitted',3,3,100,laterDate);

const teacherSubResp=await call('/api/admin/students?limit=10',{id:'teacher-subject',role:'teacher'});
const student1SubView=teacherSubResp.data.data.find(s=>s.id==='student-1');
if(!student1SubView)throw new Error('student-1 missing from subject view');
if(student1SubView.attempts!==1)throw new Error(`Expected attempts 1, got ${student1SubView.attempts}`);
if(Number(student1SubView.averagePercentage)!==33.33)throw new Error(`Expected averagePercentage 33.33, got ${student1SubView.averagePercentage}`);
if(Number(student1SubView.highestPercentage)!==33.33)throw new Error(`Expected highestPercentage 33.33, got ${student1SubView.highestPercentage}`);
if(Number(student1SubView.latestPercentage)!==33.33)throw new Error(`Expected latestPercentage 33.33, got ${student1SubView.latestPercentage}`);
if(student1SubView.passedAttempts!==0)throw new Error(`Expected passedAttempts 0, got ${student1SubView.passedAttempts}`);
if(student1SubView.failedAttempts!==1)throw new Error(`Expected failedAttempts 1, got ${student1SubView.failedAttempts}`);
if(student1SubView.lastActivity!==earlierDate)throw new Error(`Expected lastActivity ${earlierDate}, got ${student1SubView.lastActivity}`);

const adminScopedResp=await call('/api/admin/students?limit=10',{id:'admin-scoped',role:'admin'});
const student1IdentityView=adminScopedResp.data.data.find(s=>s.id==='student-1');
if(!student1IdentityView)throw new Error('student-1 missing from wider identity view');
if(student1IdentityView.attempts!==2)throw new Error(`Expected identity attempts 2, got ${student1IdentityView.attempts}`);
if(Number(student1IdentityView.highestPercentage)!==100)throw new Error(`Expected identity highestPercentage 100, got ${student1IdentityView.highestPercentage}`);
if(Number(student1IdentityView.latestPercentage)!==100)throw new Error(`Expected identity latestPercentage 100, got ${student1IdentityView.latestPercentage}`);
if(student1IdentityView.passedAttempts!==1)throw new Error(`Expected identity passedAttempts 1, got ${student1IdentityView.passedAttempts}`);
if(student1IdentityView.failedAttempts!==1)throw new Error(`Expected identity failedAttempts 1, got ${student1IdentityView.failedAttempts}`);
if(student1IdentityView.lastActivity!==laterDate)throw new Error(`Expected identity lastActivity ${laterDate}, got ${student1IdentityView.lastActivity}`);

const start=performance.now();const responses=await Promise.all(Array.from({length:500},(_,index)=>call(index%2?'/api/attempts/attempt-1/review':'/api/admin/students?limit=50',index%2?{id:'student-1',role:'student'}:{id:'admin-1',role:'admin'})));const elapsed=Math.round(performance.now()-start);if(responses.some(item=>item.status!==200))throw new Error('Concurrent read verification failed');
console.log(JSON.stringify({ok:true,wrongAnswers:2,studentAverage:33.33,ownerPages:3,scopedPages:2,subjectPages:2,lecturePages:2,comboPages:2,concurrentRequests:responses.length,elapsedMs:elapsed}));
