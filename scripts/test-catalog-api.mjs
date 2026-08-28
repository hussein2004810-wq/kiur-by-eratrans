import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {handleCatalogAdminApi} from '../worker/catalog-admin-api-v2.js';

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
for(const file of ['drizzle/0000_medexam.sql','drizzle/0001_academic_hierarchy.sql','drizzle/0002_backfill_existing_tests.sql','drizzle/0003_scale_indexes.sql','drizzle/0004_attempt_shuffle.sql','drizzle/0005_security_hardening.sql','drizzle/0006_accounts_organizations_permissions.sql','drizzle/0007_exam_modes_question_types_files.sql','drizzle/0008_staff_titles_and_college_copy.sql','drizzle/0009_clinical_glimpses_library_logs.sql'])sqlite.exec(await readFile(file,'utf8'));
const env={DB:new D1(sqlite)};const user={id:'admin-test',role:'owner'};
sqlite.prepare(`INSERT INTO users(id,email,name,role) VALUES(?,?,?,?)`).run(user.id,'admin@example.com','Admin','admin');
async function call(path,method,body){const request=new Request('https://example.test'+path,{method,headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined});const response=await handleCatalogAdminApi(request,env,new URL(request.url),user);return {status:response.status,data:response.status===204?null:await response.json()}}
const department=await call('/api/admin/departments','POST',{name:'قسم الأسنان',collegeId:'college-eratrans-medical'});if(department.status!==201)throw new Error('Department create failed');
const phase=await call('/api/admin/phases','POST',{name:'المرحلة الأولى',departmentId:department.data.id});if(phase.status!==201)throw new Error('Phase create failed');
const protectedDelete=await call(`/api/admin/departments/${department.data.id}`,'DELETE');if(protectedDelete.status!==409)throw new Error('Dependency protection failed');
const subject=await call('/api/admin/subjects','POST',{name:'تشريح الأسنان',phaseId:phase.data.id});if(subject.status!==201)throw new Error('Subject create failed');
const lecture=await call('/api/admin/lectures','POST',{name:'المحاضرة الأولى',subjectId:subject.data.id});if(lecture.status!==201)throw new Error('Lecture create failed');
const renamed=await call(`/api/admin/lectures/${lecture.data.id}`,'PATCH',{name:'المحاضرة الأولى: مقدمة'});if(renamed.status!==200)throw new Error('Lecture rename failed');
const count=sqlite.prepare(`SELECT count(*) AS count FROM lectures WHERE subject_id=?`).get(subject.data.id).count;if(Number(count)!==1)throw new Error('Lecture count failed');
const targetUniversity=await call('/api/admin/universities','POST',{name:'جامعة النسخ'});if(targetUniversity.status!==201)throw new Error('Target university create failed');
const copied=await call('/api/admin/colleges/college-eratrans-medical/copy','POST',{targetUniversityId:targetUniversity.data.id,name:'الكلية الطبية المنسوخة'});if(copied.status!==201)throw new Error(`College copy failed: ${copied.status} ${JSON.stringify(copied.data)}`);
const copiedCounts={departments:Number(sqlite.prepare(`SELECT count(*) AS count FROM departments WHERE college_id=?`).get(copied.data.id).count),phases:Number(sqlite.prepare(`SELECT count(*) AS count FROM phases p JOIN departments d ON d.id=p.department_id WHERE d.college_id=?`).get(copied.data.id).count),sections:Number(sqlite.prepare(`SELECT count(*) AS count FROM sections x JOIN phases p ON p.id=x.phase_id JOIN departments d ON d.id=p.department_id WHERE d.college_id=?`).get(copied.data.id).count),subjects:Number(sqlite.prepare(`SELECT count(*) AS count FROM subjects s JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id WHERE d.college_id=?`).get(copied.data.id).count),lectures:Number(sqlite.prepare(`SELECT count(*) AS count FROM lectures l JOIN subjects s ON s.id=l.subject_id JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id WHERE d.college_id=?`).get(copied.data.id).count)};
if(Object.entries(copiedCounts).some(([key,value])=>value!==Number(copied.data.counts[key])))throw new Error('Copied hierarchy counts differ');
const copiedTests=Number(sqlite.prepare(`SELECT count(*) AS count FROM tests t JOIN departments d ON d.id=t.department_id WHERE d.college_id=?`).get(copied.data.id).count);if(copiedTests!==0)throw new Error('Tests must not be copied with the college');
const duplicate=await call('/api/admin/colleges/college-eratrans-medical/copy','POST',{targetUniversityId:targetUniversity.data.id,name:'الكلية الطبية المنسوخة'});if(duplicate.status!==409)throw new Error('Duplicate copied college was not blocked');
console.log(JSON.stringify({ok:true,department:department.data.id,phase:phase.data.id,subject:subject.data.id,lectureCount:Number(count),protectedDelete:protectedDelete.status,copiedCollege:copied.data.id,copiedCounts,copiedTests,duplicateBlocked:duplicate.status}));
