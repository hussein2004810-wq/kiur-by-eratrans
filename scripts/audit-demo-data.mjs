import { DatabaseSync } from 'node:sqlite';

/**
 * Read-only diagnostic script to audit and report demo data in the KIUR database.
 * Does NOT delete or modify any live data.
 */
export async function auditDemoData(db) {
  const isDirectSqlite = typeof db.prepare === 'function' && typeof db.exec === 'function';
  
  // 1. Audit Demo Tests
  let demoTests = [];
  try {
    if (isDirectSqlite) {
      demoTests = db.prepare(`SELECT id, title, subject, lecture, status, created_by FROM tests WHERE id LIKE 'demo-%'`).all();
    } else {
      const res = await db.prepare(`SELECT id, title, subject, lecture, status, created_by FROM tests WHERE id LIKE 'demo-%'`).all();
      demoTests = res.results || [];
    }
  } catch (err) {
    demoTests = [];
  }

  // 2. Audit Demo Questions
  let demoQuestions = [];
  try {
    if (isDirectSqlite) {
      demoQuestions = db.prepare(`SELECT id, test_id, text, position FROM questions WHERE id LIKE 'demo-%' OR test_id LIKE 'demo-%'`).all();
    } else {
      const res = await db.prepare(`SELECT id, test_id, text, position FROM questions WHERE id LIKE 'demo-%' OR test_id LIKE 'demo-%'`).all();
      demoQuestions = res.results || [];
    }
  } catch (err) {
    demoQuestions = [];
  }

  // 3. Audit Student Attempts Attached to Demo Entities
  let attachedAttempts = [];
  try {
    if (isDirectSqlite) {
      attachedAttempts = db.prepare(`SELECT a.id, a.user_id, a.test_id, a.status, a.started_at FROM attempts a WHERE a.test_id LIKE 'demo-%'`).all();
    } else {
      const res = await db.prepare(`SELECT a.id, a.user_id, a.test_id, a.status, a.started_at FROM attempts a WHERE a.test_id LIKE 'demo-%'`).all();
      attachedAttempts = res.results || [];
    }
  } catch (err) {
    attachedAttempts = [];
  }

  // 4. Audit Certificates Attached
  let attachedCertificates = [];
  try {
    if (isDirectSqlite) {
      attachedCertificates = db.prepare(`SELECT id, attempt_id, user_id, test_id FROM certificates WHERE test_id LIKE 'demo-%'`).all();
    } else {
      const res = await db.prepare(`SELECT id, attempt_id, user_id, test_id FROM certificates WHERE test_id LIKE 'demo-%'`).all();
      attachedCertificates = res.results || [];
    }
  } catch (err) {
    attachedCertificates = [];
  }

  return {
    timestamp: new Date().toISOString(),
    demoTestsCount: demoTests.length,
    demoTests,
    demoQuestionsCount: demoQuestions.length,
    demoQuestions,
    attachedAttemptsCount: attachedAttempts.length,
    attachedAttempts,
    attachedCertificatesCount: attachedCertificates.length,
    attachedCertificates,
    safeToPurge: attachedAttempts.length === 0 && attachedCertificates.length === 0
  };
}

if (process.argv[1] && process.argv[1].endsWith('audit-demo-data.mjs')) {
  const dbFile = process.argv[2] || ':memory:';
  console.log(`Auditing demo data on ${dbFile}...`);
  const sqlite = new DatabaseSync(dbFile);
  const report = await auditDemoData(sqlite);
  console.log(JSON.stringify(report, null, 2));
}
