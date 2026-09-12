import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';

const files = await Promise.all([
  'src/RealAppV2.tsx',
  'src/AuthScreen.tsx',
  'src/AcademicChangeManager.tsx',
  'src/GuestPortal.tsx',
].map((file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8')));

for (const [index, source] of files.entries()) {
  assert.match(
    source,
    /catalog(?:\?|\.)?\.phases(?:\?|\.)?\.find\([^)]*departmentId===(?:departmentId|value)\)\?\.id\|\|''/,
    `academic cascade ${index + 1} must select the first phase for the selected department`,
  );
  assert.doesNotMatch(
    source,
    /departmentId'\)Object\.assign\(next,\{phaseId:''/,
    `academic cascade ${index + 1} must not clear phase without selecting a replacement`,
  );
}

assert.match(files[0], /لم يضف المشرف مراحل لهذا القسم/);
assert.match(files[0], /disabled=\{!phases\.length\}/);
assert.match(files[0], /disabled=\{!path\.phaseId\}/);

// Check persistence contract in AuthScreen and GuestPortal
assert.match(files[1], /localStorage\.getItem\('kiur-guest-path'\)/, 'AuthScreen must initialize from stored guest path');
assert.match(files[1], /localStorage\.setItem\('kiur-guest-path'/, 'AuthScreen must persist selected academic path');
assert.match(files[3], /localStorage\.setItem\('kiur-guest-path'/, 'GuestPortal must persist selected academic path');

// --- Negative Academic Cascade Database Validation ---
const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
for (const file of [
  'drizzle/0000_medexam.sql',
  'drizzle/0001_academic_hierarchy.sql',
  'drizzle/0002_backfill_existing_tests.sql',
  'drizzle/0003_scale_indexes.sql',
  'drizzle/0004_attempt_shuffle.sql',
  'drizzle/0005_security_hardening.sql',
  'drizzle/0006_accounts_organizations_permissions.sql',
  'drizzle/0007_exam_modes_question_types_files.sql',
  'drizzle/0008_staff_titles_and_college_copy.sql',
  'drizzle/0009_clinical_glimpses_library_logs.sql',
  'drizzle/0010_student_bans.sql',
  'drizzle/0011_security_hardening.sql',
  'drizzle/0012_firebase_auth.sql',
  'drizzle/0013_academic_trash_and_notifications.sql',
  'drizzle/0014_media_access_indexes.sql',
  'drizzle/0015_google_auth_flows.sql',
  'drizzle/0016_auth_session_epoch.sql',
  'drizzle/0017_academic_change_requests.sql'
]) {
  sqlite.exec(await readFile(file, 'utf8'));
}

// Seed clean two-tree hierarchy
sqlite.exec(`
  INSERT INTO universities(id, name) VALUES('uni-a', 'جامعة بغداد'), ('uni-b', 'جامعة بابل');
  INSERT INTO colleges(id, university_id, name) VALUES('col-a', 'uni-a', 'طب بغداد'), ('col-b', 'uni-b', 'طب بابل');
  INSERT INTO departments(id, college_id, name) VALUES('dep-a', 'col-a', 'جراحة'), ('dep-b', 'col-b', 'باطنية');
  INSERT INTO phases(id, department_id, name) VALUES('pha-a', 'dep-a', 'المرحلة 4'), ('pha-b', 'dep-b', 'المرحلة 5');
  INSERT INTO sections(id, phase_id, name) VALUES('sec-a', 'pha-a', 'شعبة 1'), ('sec-b', 'pha-b', 'شعبة 2');
`);

function checkValidPath(data) {
  if (!data?.universityId || !data?.collegeId || !data?.departmentId || !data?.phaseId) return null;
  const sectionClause = data.sectionId ? `JOIN sections x ON x.id=? AND x.phase_id=p.id` : ``;
  const sql = `SELECT u.id AS universityId,c.id AS collegeId,d.id AS departmentId,p.id AS phaseId${data.sectionId ? ',x.id AS sectionId' : ',NULL AS sectionId'} FROM phases p JOIN departments d ON d.id=p.department_id JOIN colleges c ON c.id=d.college_id JOIN universities u ON u.id=c.university_id ${sectionClause} WHERE u.id=? AND c.id=? AND d.id=? AND p.id=?`;
  const statement = sqlite.prepare(sql);
  const binds = data.sectionId
    ? [data.sectionId, data.universityId, data.collegeId, data.departmentId, data.phaseId]
    : [data.universityId, data.collegeId, data.departmentId, data.phaseId];
  return statement.get(...binds) || null;
}

// Valid path passes
assert.ok(checkValidPath({ universityId: 'uni-a', collegeId: 'col-a', departmentId: 'dep-a', phaseId: 'pha-a', sectionId: 'sec-a' }));
assert.ok(checkValidPath({ universityId: 'uni-a', collegeId: 'col-a', departmentId: 'dep-a', phaseId: 'pha-a', sectionId: '' }));

// Negative tests: Missing entities
assert.equal(checkValidPath({ universityId: '', collegeId: 'col-a', departmentId: 'dep-a', phaseId: 'pha-a' }), null);
assert.equal(checkValidPath({ universityId: 'uni-a', collegeId: '', departmentId: 'dep-a', phaseId: 'pha-a' }), null);
assert.equal(checkValidPath({ universityId: 'uni-a', collegeId: 'col-a', departmentId: '', phaseId: 'pha-a' }), null);
assert.equal(checkValidPath({ universityId: 'uni-a', collegeId: 'col-a', departmentId: 'dep-a', phaseId: '' }), null);

// Negative tests: Cross-IDs across trees
assert.equal(checkValidPath({ universityId: 'uni-b', collegeId: 'col-a', departmentId: 'dep-a', phaseId: 'pha-a' }), null, 'Cross university/college must fail');
assert.equal(checkValidPath({ universityId: 'uni-a', collegeId: 'col-a', departmentId: 'dep-b', phaseId: 'pha-b' }), null, 'Cross college/department must fail');
assert.equal(checkValidPath({ universityId: 'uni-a', collegeId: 'col-a', departmentId: 'dep-a', phaseId: 'pha-b' }), null, 'Cross department/phase must fail');
assert.equal(checkValidPath({ universityId: 'uni-a', collegeId: 'col-a', departmentId: 'dep-a', phaseId: 'pha-a', sectionId: 'sec-b' }), null, 'Cross phase/section must fail');

console.log('academic cascade contract and negative tests passed');
