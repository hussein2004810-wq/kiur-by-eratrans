import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import worker from '../worker/site-worker.js';

class Statement{
  constructor(database,sql){this.statement=database.prepare(sql)}
  bind(...values){this.values=values;return this}
  async first(){return this.statement.get(...(this.values||[]))||null}
  async all(){return {results:this.statement.all(...(this.values||[]))}}
  async run(){const result=this.statement.run(...(this.values||[]));return {meta:{changes:Number(result.changes)}}}
}
class D1{
  constructor(database){this.database=database}
  prepare(sql){return new Statement(this.database,sql)}
  async batch(statements){const results=[];for(const statement of statements)results.push(await statement.run());return results}
}

const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
for(const file of ['drizzle/0000_medexam.sql','drizzle/0001_academic_hierarchy.sql','drizzle/0002_backfill_existing_tests.sql','drizzle/0003_scale_indexes.sql','drizzle/0004_attempt_shuffle.sql','drizzle/0005_security_hardening.sql','drizzle/0006_accounts_organizations_permissions.sql','drizzle/0007_exam_modes_question_types_files.sql','drizzle/0008_staff_titles_and_college_copy.sql','drizzle/0009_clinical_glimpses_library_logs.sql','drizzle/0010_student_bans.sql'])sqlite.exec(await readFile(file,'utf8'));
const env={DB:new D1(sqlite),OWNER_USER_IDS:'admin-security'};

function headers(user){return user?{'content-type':'application/json','origin':'https://example.test','sec-fetch-site':'same-origin','oai-authenticated-user-id':user.id,'oai-authenticated-user-email':user.email}:{'content-type':'application/json'}}
async function call(path,{method='GET',user,body}={}){const request=new Request('https://example.test'+path,{method,headers:headers(user),body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)});return worker.fetch(request,env)}

const anonymous=await call('/api/me');if(anonymous.status!==401)throw new Error('Anonymous API access was not rejected');
const admin={id:'admin-security',email:'admin@example.com'};const adminMetrics=await call('/api/admin/metrics',{user:admin});if(adminMetrics.status!==200)throw new Error('Stable admin ID was not accepted');

const owner={id:'student-owner',email:'owner@example.com'};const other={id:'student-other',email:'other@example.com'};
const started=await call('/api/attempts',{method:'POST',user:owner,body:{testId:'demo-preop'}});if(started.status!==201)throw new Error('Attempt creation failed');const startedData=await started.json();
const idor=await call(`/api/tests/demo-preop?attemptId=${startedData.attempt.id}`,{user:other});if(idor.status!==404)throw new Error('Cross-user attempt access was not blocked');

const oversized={id:'student-large',email:'large@example.com'};const tooLarge=await call('/api/attempts',{method:'POST',user:oversized,body:JSON.stringify({testId:'demo-preop',padding:'x'.repeat(1024*1024)})});if(tooLarge.status!==413)throw new Error('Oversized JSON was not rejected');

const rateUser={id:'student-rate',email:'rate@example.com'};let limited;for(let index=0;index<11;index++)limited=await call('/api/attempts',{method:'POST',user:rateUser,body:{testId:'demo-preop'}});if(limited.status!==429||limited.headers.get('retry-after')===null)throw new Error('Rate limit was not enforced');

const expired={id:'student-expired',email:'expired@example.com'};await call('/api/me',{user:expired});sqlite.prepare(`INSERT INTO attempts(id,user_id,test_id,status,started_at) VALUES(?,?,?,'in_progress',datetime('now','-30 minutes'))`).run('expired-attempt',expired.id,'demo-preop');
const expiredSubmit=await call('/api/attempts/expired-attempt/submit',{method:'POST',user:expired});const expiredData=await expiredSubmit.json();if(expiredSubmit.status!==200||expiredData.expired!==true||sqlite.prepare(`SELECT status FROM attempts WHERE id=?`).get('expired-attempt').status!=='submitted')throw new Error('Expired attempt was not finalized');

if(anonymous.headers.get('content-security-policy')===null||anonymous.headers.get('x-frame-options')!=='DENY'||anonymous.headers.get('strict-transport-security')===null)throw new Error('Security headers are missing');

console.log(JSON.stringify({ok:true,anonymous:anonymous.status,idor:idor.status,payload:tooLarge.status,rateLimit:limited.status,expired:expiredData.expired,securityHeaders:true}));
