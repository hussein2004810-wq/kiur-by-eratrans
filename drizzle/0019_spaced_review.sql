CREATE TABLE IF NOT EXISTS student_review_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  interval_days INTEGER NOT NULL DEFAULT 1 CHECK(interval_days BETWEEN 1 AND 30),
  last_score REAL NOT NULL DEFAULT 0,
  last_reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  next_review_at TEXT NOT NULL DEFAULT (datetime('now','+1 day')),
  PRIMARY KEY(user_id,subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_review_due
ON student_review_progress(user_id,next_review_at);

PRAGMA optimize;
