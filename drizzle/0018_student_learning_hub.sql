CREATE TABLE IF NOT EXISTS student_favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,test_id)
);

CREATE INDEX IF NOT EXISTS idx_student_favorites_recent
ON student_favorites(user_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_correctness
ON attempt_answers(attempt_id,is_correct,question_id);

PRAGMA optimize;
