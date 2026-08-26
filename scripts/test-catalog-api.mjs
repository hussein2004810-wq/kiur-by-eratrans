import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {handleCatalogAdminApi} from '../worker/catalog-admin-api.js';

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
for(const file of ['drizzle/0000_medexam.sql','drizzle/0001_academic_hierarchy.sql','drizzle/0002_backfill_existing_tests.sql'])sqlite.exec(await readFile(file,'utf8'));
const env={DB:new D1(sqlite)};const user={id:'admin-test',role:'admin'};
sqlite.prepare(`INSERT INTO users(id,email,name,role) VALUES(?,?,?,?)`).run(user.id,'admin@example.com','Admin','admin');
async function call(path,method,body){const request=new Request('https://example.test'+path,{method,headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined});const response=await handleCatalogAdminApi(request,env,new URL(request.url),user);return {status:response.status,data:response.status===204?null:await response.json()}}
const department=await call('/api/admin/departments','POST',{name:'قسم الأسنان'});if(department.status!==201)throw new Error('Department create failed');
const phase=await call('/api/admin/phases','POST',{name:'المرحلة الأولى',departmentId:department.data.id});if(phase.status!==201)throw new Error('Phase create failed');
const protectedDelete=await call(`/api/admin/departments/${department.data.id}`,'DELETE');if(protectedDelete.status!==409)throw new Error('Dependency protection failed');
const subject=await call('/api/admin/subjects','POST',{name:'تشريح الأسنان',phaseId:phase.data.id});if(subject.status!==201)throw new Error('Subject create failed');
const lecture=await call('/api/admin/lectures','POST',{name:'المحاضرة الأولى',subjectId:subject.data.id});if(lecture.status!==201)throw new Error('Lecture create failed');
const renamed=await call(`/api/admin/lectures/${lecture.data.id}`,'PATCH',{name:'المحاضرة الأولى: مقدمة'});if(renamed.status!==200)throw new Error('Lecture rename failed');
const count=sqlite.prepare(`SELECT count(*) AS count FROM lectures WHERE subject_id=?`).get(subject.data.id).count;if(Number(count)!==1)throw new Error('Lecture count failed');
console.log(JSON.stringify({ok:true,department:department.data.id,phase:phase.data.id,subject:subject.data.id,lectureCount:Number(count),protectedDelete:protectedDelete.status}));
