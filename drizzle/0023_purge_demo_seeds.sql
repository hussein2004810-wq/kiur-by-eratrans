-- Migration 0023: Conditionally purge unreferenced demo seeds
-- Safe & Rigorous Engineering Guideline:
-- 1. Never delete data directly without explicit approval gate in audit_logs.
-- 2. Never delete questions if any student attempt_answers reference them.
-- 3. Never delete tests if any student attempts reference them.

DELETE FROM questions
WHERE id IN ('demo-q1', 'demo-q2', 'demo-q3')
  AND NOT EXISTS (SELECT 1 FROM attempt_answers WHERE question_id = questions.id)
  AND EXISTS (SELECT 1 FROM audit_logs WHERE action = 'approve_purge_demo_seeds');

DELETE FROM tests
WHERE id = 'demo-preop'
  AND NOT EXISTS (SELECT 1 FROM attempts WHERE test_id = 'demo-preop')
  AND EXISTS (SELECT 1 FROM audit_logs WHERE action = 'approve_purge_demo_seeds');
