CREATE INDEX IF NOT EXISTS idx_users_role_created
ON users(role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attempts_user_status_finished
ON attempts(user_id, status, finished_at DESC);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt
ON attempt_answers(attempt_id);

CREATE INDEX IF NOT EXISTS idx_tests_subject_status
ON tests(subject_id, status, created_at DESC);

PRAGMA optimize;
