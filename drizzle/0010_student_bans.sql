ALTER TABLE users ADD COLUMN ban_status TEXT NOT NULL DEFAULT 'none'
  CHECK(ban_status IN ('none','precaution','temporary','permanent'));
ALTER TABLE users ADD COLUMN ban_until TEXT;
ALTER TABLE users ADD COLUMN active_ban_request_id TEXT;
ALTER TABLE users ADD COLUMN active_ban_id TEXT;

CREATE TABLE IF NOT EXISTS student_ban_requests (
  id TEXT PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL REFERENCES users(id),
  request_type TEXT NOT NULL
    CHECK(request_type IN ('temporary','permanent','lift_temporary','lift_permanent')),
  ban_id TEXT,
  duration_value INTEGER,
  duration_unit TEXT CHECK(duration_unit IN ('minutes','hours','days')),
  duration_seconds INTEGER,
  reason TEXT NOT NULL,
  evidence_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected','cancelled','expired')),
  precaution_started_at TEXT,
  precaution_expires_at TEXT,
  requested_by TEXT NOT NULL REFERENCES users(id),
  requester_scope_type TEXT,
  requester_scope_id TEXT,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_bans (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES student_ban_requests(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  ban_type TEXT NOT NULL CHECK(ban_type IN ('temporary','permanent')),
  reason TEXT NOT NULL,
  starts_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active','lift_pending','lifted','expired')),
  approved_by TEXT NOT NULL REFERENCES users(id),
  lifted_by TEXT REFERENCES users(id),
  lifted_at TEXT,
  lift_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_ban_appeals (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES student_ban_requests(id),
  ban_id TEXT REFERENCES student_bans(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(request_id,student_id)
);

CREATE TABLE IF NOT EXISTS student_ban_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT,
  ban_id TEXT,
  student_id TEXT NOT NULL,
  action TEXT NOT NULL,
  by_user_id TEXT,
  actor_name_snapshot TEXT NOT NULL,
  actor_email_snapshot TEXT,
  student_name_snapshot TEXT NOT NULL,
  student_email_snapshot TEXT NOT NULL,
  scope_type TEXT,
  scope_id TEXT,
  reason_snapshot TEXT,
  evidence_snapshot TEXT,
  duration_seconds INTEGER,
  status_snapshot TEXT,
  device_hash TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_ban_requests_student_status
ON student_ban_requests(student_id,status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ban_requests_review_queue
ON student_ban_requests(status,request_type,created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ban_requests_one_precaution
ON student_ban_requests(student_id)
WHERE status='pending' AND precaution_expires_at IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_bans_one_active
ON student_bans(student_id)
WHERE status IN ('active','lift_pending');

CREATE INDEX IF NOT EXISTS idx_student_bans_student_status
ON student_bans(student_id,status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ban_appeals_status
ON student_ban_appeals(status,created_at);

CREATE INDEX IF NOT EXISTS idx_ban_logs_student_recent
ON student_ban_logs(student_id,at DESC);

CREATE INDEX IF NOT EXISTS idx_ban_logs_request_recent
ON student_ban_logs(request_id,at DESC);

PRAGMA optimize;
