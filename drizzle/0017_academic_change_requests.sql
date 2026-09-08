CREATE TABLE IF NOT EXISTS academic_change_requests (
  id TEXT PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_path_json TEXT NOT NULL,
  target_path_json TEXT NOT NULL,
  target_university_id TEXT NOT NULL REFERENCES universities(id),
  target_college_id TEXT NOT NULL REFERENCES colleges(id),
  target_department_id TEXT NOT NULL REFERENCES departments(id),
  target_phase_id TEXT NOT NULL REFERENCES phases(id),
  target_section_id TEXT REFERENCES sections(id),
  reason TEXT NOT NULL,
  evidence_text TEXT,
  risk_level TEXT NOT NULL CHECK(risk_level IN ('green','yellow','red')),
  risk_reasons_json TEXT NOT NULL DEFAULT '[]',
  required_approvals INTEGER NOT NULL DEFAULT 1 CHECK(required_approvals IN (1,2)),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','needs_info','approved','rejected','cancelled')),
  resolved_by TEXT REFERENCES users(id),
  resolved_at TEXT,
  resolution_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_change_reviews (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES academic_change_requests(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL CHECK(decision IN ('approve','reject','needs_info')),
  scope_side TEXT NOT NULL CHECK(scope_side IN ('source','target','owner')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(request_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS academic_change_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  request_number TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name_snapshot TEXT NOT NULL,
  student_email_snapshot TEXT NOT NULL,
  action TEXT NOT NULL,
  by_user_id TEXT,
  actor_name_snapshot TEXT NOT NULL,
  actor_email_snapshot TEXT,
  status_snapshot TEXT NOT NULL,
  device_hash TEXT,
  details_json TEXT,
  at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_change_batches (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  actor_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK(action IN ('approve','reject','needs_info')),
  request_count INTEGER NOT NULL,
  result_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(actor_id,idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_change_one_open
ON academic_change_requests(student_id)
WHERE status IN ('pending','needs_info');

CREATE INDEX IF NOT EXISTS idx_academic_change_queue
ON academic_change_requests(status,risk_level,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_academic_change_scope
ON academic_change_requests(target_university_id,target_college_id,target_department_id,target_phase_id,status);

CREATE INDEX IF NOT EXISTS idx_academic_change_reviews_request
ON academic_change_reviews(request_id,decision,scope_side);

CREATE INDEX IF NOT EXISTS idx_academic_change_logs_request
ON academic_change_logs(request_id,at DESC);

PRAGMA optimize;
