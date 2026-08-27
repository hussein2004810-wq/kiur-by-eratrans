import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';

const database=new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys=ON');
for(const file of ['drizzle/0000_medexam.sql','drizzle/0001_academic_hierarchy.sql','drizzle/0002_backfill_existing_tests.sql','drizzle/0003_scale_indexes.sql','drizzle/0004_attempt_shuffle.sql','drizzle/0005_security_hardening.sql','drizzle/0006_accounts_organizations_permissions.sql','drizzle/0007_exam_modes_question_types_files.sql']){
  database.exec(await readFile(resolve(file),'utf8'));
}
const counts={
  departments:database.prepare('SELECT count(*) AS count FROM departments').get().count,
  phases:database.prepare('SELECT count(*) AS count FROM phases').get().count,
  subjects:database.prepare('SELECT count(*) AS count FROM subjects').get().count,
  lectures:database.prepare('SELECT count(*) AS count FROM lectures').get().count
};
const demo=database.prepare('SELECT department_id AS departmentId,phase_id AS phaseId,subject_id AS subjectId,lecture_id AS lectureId FROM tests WHERE id=?').get('demo-preop');
if(Object.values(counts).some(value=>Number(value)<1)||!demo?.lectureId)throw new Error('Academic hierarchy migration verification failed');
const scaleIndexes=Number(database.prepare("SELECT count(*) AS count FROM sqlite_schema WHERE type='index' AND name IN ('idx_users_role_created','idx_attempts_user_status_finished','idx_attempt_answers_attempt','idx_tests_subject_status')").get().count);
const plan=database.prepare("EXPLAIN QUERY PLAN SELECT * FROM attempts WHERE user_id=? AND status='submitted' ORDER BY finished_at DESC").all('test-user').map(item=>item.detail).join(' ');
if(scaleIndexes!==4||!plan.includes('idx_attempts_user_status_finished'))throw new Error('Scale index verification failed');
console.log(JSON.stringify({ok:true,counts,demo,scaleIndexes,queryPlan:plan}));
