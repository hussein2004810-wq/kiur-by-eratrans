import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {performance} from 'node:perf_hooks';
import {handleStudentInsightsApi} from '../worker/student-insights-api.js';

class Statement{constructor(database,sql){this.statement=database.prepare(sql)}bind(...values){this.values=values;return this}async first(){return this.statement.get(...(this.values||[]))||null}async all(){return {results:this.statement.all(...(this.values||[]))}}async run(){const result=this.statement.run(...(this.values||[]));return {meta:{changes:Number(result.changes)}}}}
class D1{constructor(database){this.database=database}prepare(sql){return new Statement(this.database,sql)}async batch(statements){const results=[];for(const statement of statements)results.push(await statement.run());return results}}
const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
for(const file of ['drizzle/0000_medexam.sql','drizzle/0001_academic_hierarchy.sql','drizzle/0002_backfill_existing_tests.sql','drizzle/0003_scale_indexes.sql','drizzle/0004_attempt_shuffle.sql','drizzle/0005_security_hardening.sql','drizzle/0006_accounts_organizations_permissions.sql','drizzle/0007_exam_modes_question_types_files.sql','drizzle/0008_staff_titles_and_college_copy.sql'])sqlite.exec(await readFile(file,'utf8'));
sqlite.prepare(`INSERT INTO users(id,email,name,role,department_id,phase_id) VALUES(?,?,?,?,?,?)`).run('student-1','student@example.com','طالب تجريبي','student','dep-anesthesia','pha-a4');
sqlite.prepare(`INSERT INTO users(id,email,name,role) VALUES(?,?,?,?)`).run('admin-1','admin@example.com','مشرف','admin');
sqlite.prepare(`INSERT INTO attempts(id,user_id,test_id,status,score,max_score,percentage,finished_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run('attempt-1','student-1','demo-preop','submitted',1,3,33.33);
sqlite.prepare(`INSERT INTO attempt_answers(attempt_id,question_id,selected_option,is_correct) VALUES(?,?,?,?)`).run('attempt-1','demo-q1',0,0);
sqlite.prepare(`INSERT INTO attempt_answers(attempt_id,question_id,selected_option,is_correct) VALUES(?,?,?,?)`).run('attempt-1','demo-q2',1,1);
const env={DB:new D1(sqlite)};
async function call(path,user){const request=new Request('https://example.test'+path);const response=await handleStudentInsightsApi(request,env,new URL(request.url),user);return {status:response.status,data:await response.json()}}
const review=await call('/api/attempts/attempt-1/review',{id:'student-1',role:'student'});if(review.status!==200||review.data.questions.filter(item=>!item.isCorrect).length!==2)throw new Error('Attempt review verification failed');
const students=await call('/api/admin/students?limit=50',{id:'admin-1',role:'owner'});if(students.status!==200||students.data.total!==1||Number(students.data.data[0].averagePercentage)!==33.33)throw new Error('Student report verification failed');
const start=performance.now();const responses=await Promise.all(Array.from({length:500},(_,index)=>call(index%2?'/api/attempts/attempt-1/review':'/api/admin/students?limit=50',index%2?{id:'student-1',role:'student'}:{id:'admin-1',role:'admin'})));const elapsed=Math.round(performance.now()-start);if(responses.some(item=>item.status!==200))throw new Error('Concurrent read verification failed');
console.log(JSON.stringify({ok:true,wrongAnswers:2,studentAverage:33.33,concurrentRequests:responses.length,elapsedMs:elapsed}));
