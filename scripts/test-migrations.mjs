import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';

const database=new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys=ON');
for(const file of ['drizzle/0000_medexam.sql','drizzle/0001_academic_hierarchy.sql','drizzle/0002_backfill_existing_tests.sql']){
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
console.log(JSON.stringify({ok:true,counts,demo}));
