CREATE TABLE IF NOT EXISTS clinical_glimpses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  clinical_point TEXT NOT NULL,
  warning TEXT,
  image_id TEXT REFERENCES media_assets(id),
  reference_text TEXT,
  publish_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','in_review','approved','published','archived')),
  audience_all INTEGER NOT NULL DEFAULT 1 CHECK(audience_all IN (0,1)),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT NOT NULL REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  published_by TEXT REFERENCES users(id),
  published_at TEXT,
  deleted_at TEXT,
  deleted_by TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS clinical_glimpse_targets (
  id TEXT PRIMARY KEY,
  glimpse_id TEXT NOT NULL REFERENCES clinical_glimpses(id) ON DELETE CASCADE,
  university_id TEXT REFERENCES universities(id),
  college_id TEXT REFERENCES colleges(id),
  department_id TEXT REFERENCES departments(id),
  phase_id TEXT REFERENCES phases(id),
  UNIQUE(glimpse_id, university_id, college_id, department_id, phase_id)
);

CREATE TABLE IF NOT EXISTS clinical_glimpse_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  glimpse_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('create','update','submit_review','return_draft','approve','publish','archive','restore','delete_forever')),
  by_user_id TEXT NOT NULL REFERENCES users(id),
  at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details_json TEXT
);

ALTER TABLE media_assets ADD COLUMN title TEXT;
ALTER TABLE media_assets ADD COLUMN clinical_question TEXT;
ALTER TABLE media_assets ADD COLUMN explanation TEXT;
ALTER TABLE media_assets ADD COLUMN correct_answer TEXT;
ALTER TABLE media_assets ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE media_assets ADD COLUMN updated_by TEXT REFERENCES users(id);
ALTER TABLE media_assets ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE media_assets ADD COLUMN deleted_by TEXT REFERENCES users(id);

UPDATE media_assets SET title=original_name WHERE title IS NULL;

CREATE TABLE IF NOT EXISTS library_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('upload','update','attach_to_test','detach_from_test','soft_delete','restore','delete_forever')),
  by_user_id TEXT NOT NULL REFERENCES users(id),
  test_id TEXT,
  question_id TEXT,
  at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details_json TEXT
);

CREATE TABLE IF NOT EXISTS account_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  account_code TEXT,
  email_hash TEXT,
  event_type TEXT NOT NULL CHECK(event_type IN ('register','account_created','account_status','grant_changed','login_success','login_failure','logout')),
  outcome TEXT NOT NULL CHECK(outcome IN ('success','failure')),
  device_hash TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_glimpses_public
ON clinical_glimpses(status, publish_at, published_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_glimpse_targets_scope
ON clinical_glimpse_targets(university_id, college_id, department_id, phase_id, glimpse_id);

CREATE INDEX IF NOT EXISTS idx_glimpse_logs_recent
ON clinical_glimpse_logs(glimpse_id, at DESC);

CREATE INDEX IF NOT EXISTS idx_library_logs_recent
ON library_logs(media_id, at DESC);

CREATE INDEX IF NOT EXISTS idx_account_events_recent
ON account_events(at DESC);

CREATE INDEX IF NOT EXISTS idx_account_events_user
ON account_events(user_id, at DESC);

PRAGMA optimize;
