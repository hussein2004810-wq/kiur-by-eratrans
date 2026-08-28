import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import worker from '../worker/site-worker.js';

class Statement{constructor(database,sql){this.database=database;this.sql=sql}bind(...values){this.values=values;return this}statement(){return this.database.prepare(this.sql)}async first(){return this.statement().get(...(this.values||[]))||null}async all(){return {results:this.statement().all(...(this.values||[]))}}async run(){const result=this.statement().run(...(this.values||[]));return {meta:{changes:Number(result.changes)}}}}
class D1{constructor(database){this.database=database}prepare(sql){return new Statement(this.database,sql)}async batch(statements){const results=[];for(const statement of statements)results.push(await statement.run());return results}}

const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
for(const file of ['drizzle/0000_medexam.sql','drizzle/0001_academic_hierarchy.sql','drizzle/0002_backfill_existing_tests.sql','drizzle/0003_scale_indexes.sql','drizzle/0004_attempt_shuffle.sql','drizzle/0005_security_hardening.sql','drizzle/0006_accounts_organizations_permissions.sql','drizzle/0007_exam_modes_question_types_files.sql','drizzle/0008_staff_titles_and_college_copy.sql','drizzle/0009_clinical_glimpses_library_logs.sql','drizzle/0010_student_bans.sql'])sqlite.exec(await readFile(file,'utf8'));
sqlite.prepare(`UPDATE tests SET shuffle_questions=1,shuffle_options=1 WHERE id='demo-preop'`).run();
const env={DB:new D1(sqlite)};const userId='shuffle-student';
function headers(json=false){const value={'oai-authenticated-user-id':userId,'oai-authenticated-user-email':'shuffle@example.com'};if(json)value['content-type']='application/json';return value}
async function call(path,method='GET',payload){const request=new Request('https://example.test'+path,{method,headers:headers(payload!==undefined),body:payload===undefined?undefined:JSON.stringify(payload)});const response=await worker.fetch(request,env);const data=await response.json();if(!response.ok)throw new Error(`${path}: ${response.status} ${JSON.stringify(data)}`);return data}
async function begin(){const created=await call('/api/attempts','POST',{testId:'demo-preop'});const detail=await call(`/api/tests/demo-preop?attemptId=${created.attempt.id}`);return {id:created.attempt.id,detail}}
async function answerCorrectly(attempt){for(const question of attempt.detail.questions){const source=sqlite.prepare(`SELECT options_json,correct_option FROM questions WHERE id=?`).get(question.id);const correctText=JSON.parse(source.options_json)[Number(source.correct_option)];const selectedOption=question.options.indexOf(correctText);if(selectedOption<0)throw new Error('Correct option was not presented');await call(`/api/attempts/${attempt.id}/answers`,'PATCH',{questionId:question.id,selectedOption})}const result=await call(`/api/attempts/${attempt.id}/submit`,'POST');if(result.score!==result.maxScore)throw new Error('Shuffled answer mapping changed the score')}

const first=await begin();await answerCorrectly(first);const second=await begin();
const firstQuestionIds=first.detail.questions.map(question=>question.id);const secondQuestionIds=second.detail.questions.map(question=>question.id);
const questionsChanged=firstQuestionIds.some((id,index)=>id!==secondQuestionIds[index]);
const optionsChanged=second.detail.questions.some(question=>{const previous=first.detail.questions.find(item=>item.id===question.id);return previous&&question.options.some((option,index)=>option!==previous.options[index])});
if(!questionsChanged||!optionsChanged)throw new Error('A new attempt did not receive new question and option orders');
const resumed=await call('/api/attempts','POST',{testId:'demo-preop'});const resumedDetail=await call(`/api/tests/demo-preop?attemptId=${resumed.attempt.id}`);
if(resumed.attempt.id!==second.id||JSON.stringify(resumedDetail.questions)!==JSON.stringify(second.detail.questions))throw new Error('Saved attempt order was not stable');
sqlite.prepare(`UPDATE tests SET shuffle_questions=0,shuffle_options=0 WHERE id='demo-preop'`).run();await answerCorrectly(second);const fixed=await begin();
const natural=sqlite.prepare(`SELECT id,options_json FROM questions WHERE test_id='demo-preop' ORDER BY position`).all();
if(JSON.stringify(fixed.detail.questions.map(question=>question.id))!==JSON.stringify(natural.map(question=>question.id)))throw new Error('Disabled question shuffle changed the order');
if(fixed.detail.questions.some((question,index)=>JSON.stringify(question.options)!==natural[index].options_json))throw new Error('Disabled option shuffle changed the options');
console.log(JSON.stringify({ok:true,questionsChanged,optionsChanged,resumeStable:true,disabledStable:true}));
