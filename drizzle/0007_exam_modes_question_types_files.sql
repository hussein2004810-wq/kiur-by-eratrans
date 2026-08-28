ALTER TABLE tests ADD COLUMN exam_mode TEXT NOT NULL DEFAULT 'practice'
  CHECK(exam_mode IN ('practice','formal'));
ALTER TABLE tests ADD COLUMN available_from TEXT;
ALTER TABLE tests ADD COLUMN available_until TEXT;
ALTER TABLE tests ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 0 CHECK(max_attempts>=0);
ALTER TABLE tests ADD COLUMN certificate_enabled INTEGER NOT NULL DEFAULT 1 CHECK(certificate_enabled IN (0,1));

ALTER TABLE questions ADD COLUMN question_type TEXT NOT NULL DEFAULT 'mcq'
  CHECK(question_type IN ('mcq','true_false','fill_blank','clinical_case'));
ALTER TABLE questions ADD COLUMN accepted_answers_json TEXT;
ALTER TABLE questions ADD COLUMN image_id TEXT;
ALTER TABLE questions ADD COLUMN points REAL NOT NULL DEFAULT 1 CHECK(points>0 AND points<=100);

ALTER TABLE attempt_answers ADD COLUMN answer_text TEXT;

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('image/jpeg','image/png','image/webp')),
  byte_size INTEGER NOT NULL CHECK(byte_size>0 AND byte_size<=5242880),
  sha256 TEXT NOT NULL,
  alt_text TEXT,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK(source_type IN ('xlsx','docx')),
  original_name TEXT NOT NULL,
  object_key TEXT,
  target_lecture_id TEXT NOT NULL REFERENCES lectures(id),
  target_test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'previewed' CHECK(status IN ('previewed','committed','failed')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  conflicts_json TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  committed_at TEXT
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL REFERENCES tests(id),
  verification_code TEXT NOT NULL UNIQUE,
  issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tests_formal_window ON tests(exam_mode, available_from, available_until, status);
CREATE INDEX IF NOT EXISTS idx_questions_type_test ON questions(test_id, question_type, position);
CREATE INDEX IF NOT EXISTS idx_media_assets_active ON media_assets(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_import_batches_creator ON import_batches(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_verification ON certificates(verification_code) WHERE revoked_at IS NULL;
PRAGMA optimize;
