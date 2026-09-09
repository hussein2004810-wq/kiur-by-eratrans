import {readFile,readdir} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {handleStudentLearningApi} from '../worker/student-learning-api.js';

class Statement{constructor(database,sql){this.statement=database.prepare(sql)}bind(...values){this.values=values;return this}async first(){return this.statement.get(...(this.values||[]))||null}async all(){return {results:this.statement.all(...(this.values||[]))}}async run(){const result=this.statement.run(...(this.values||[]));return {meta:{changes:Number(result.changes)}}}}
class D1{constructor(database){this.database=database}prepare(sql){return new Statement(this.database,sql)}async batch(statements){const results=[];for(const statement of statements)results.push(await statement.run());return results}}

const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
for(const file of (await readdir('drizzle')).filter(file=>file.endsWith('.sql')).sort())sqlite.exec(await readFile(`drizzle/${file}`,'utf8'));
sqlite.prepare(`INSERT INTO users(id,email,name,role,account_role,account_status,university_id,college_id,department_id,phase_id) VALUES(?,?,?,?,?,?,?,?,?,?)`).run('learning-student','learn@example.com','طالب التعلم','student','student','active','uni-eratrans','college-eratrans-medical','dep-anesthesia','pha-a4');
sqlite.prepare(`INSERT INTO attempts(id,user_id,test_id,status,started_at,last_saved_at,deadline_at) VALUES(?,?,?,'in_progress',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,datetime('now','+20 minutes'))`).run('learning-active','learning-student','demo-preop');
sqlite.prepare(`INSERT INTO attempts(id,user_id,test_id,status,score,max_score,percentage,finished_at) VALUES(?,?,?,'submitted',1,3,33.33,CURRENT_TIMESTAMP)`).run('learning-finished','learning-student','demo-preop');
sqlite.prepare(`INSERT INTO attempt_answers(attempt_id,question_id,selected_option,is_correct) VALUES(?,?,?,?)`).run('learning-finished','demo-q1',0,0);
sqlite.prepare(`INSERT INTO attempt_answers(attempt_id,question_id,selected_option,is_correct) VALUES(?,?,?,?)`).run('learning-finished','demo-q2',1,1);
sqlite.prepare(`INSERT INTO student_review_progress(user_id,subject_id,interval_days,last_score,next_review_at) VALUES(?,?,?,?,datetime('now','-1 minute'))`).run('learning-student','sub-a4-general',1,33.33);
const env={DB:new D1(sqlite)};const user={id:'learning-student',role:'student',universityId:'uni-eratrans',collegeId:'college-eratrans-medical',departmentId:'dep-anesthesia',phaseId:'pha-a4',sectionId:null};
async function call(path,method='GET',actor=user){const request=new Request('https://example.test'+path,{method});const response=await handleStudentLearningApi(request,env,new URL(request.url),actor);return {status:response.status,data:await response.json()}}

const added=await call('/api/me/favorites/demo-preop','PUT');if(added.status!==200||!added.data.favorite)throw new Error('Adding a favorite failed');
const hub=await call('/api/me/learning-hub');if(hub.status!==200||hub.data.activeAttempt?.attemptId!=='learning-active'||hub.data.favorites?.[0]?.id!=='demo-preop'||Number(hub.data.weakTopics?.[0]?.wrongAnswers)!==1||Number(hub.data.reviewPlan?.[0]?.due)!==1)throw new Error(`Learning hub response failed: ${JSON.stringify(hub)}`);
const removed=await call('/api/me/favorites/demo-preop','DELETE');if(removed.status!==200||removed.data.favorite)throw new Error('Removing a favorite failed');
const denied=await call('/api/me/learning-hub','GET',{id:'owner',role:'owner'});if(denied.status!==403)throw new Error('Non-student learning hub must be denied');
console.log(JSON.stringify({ok:true,resume:hub.data.activeAttempt.title,favorites:hub.data.favorites.length,weakTopics:hub.data.weakTopics.length,reviewDue:hub.data.reviewPlan.filter(item=>item.due).length,ownerDenied:denied.status}));
