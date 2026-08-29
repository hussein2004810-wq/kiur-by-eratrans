CREATE TABLE IF NOT EXISTS academic_deletions (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL
    CHECK(resource_type IN ('university','college','department','phase','section','subject','lecture')),
  resource_id TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  deleted_by TEXT NOT NULL REFERENCES users(id),
  deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  restored_by TEXT REFERENCES users(id),
  restored_at TEXT,
  purged_by TEXT REFERENCES users(id),
  purged_at TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active','restored','purged')),
  details_json TEXT
);

CREATE TABLE IF NOT EXISTS academic_deleted_items (
  batch_id TEXT NOT NULL REFERENCES academic_deletions(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL
    CHECK(resource_type IN ('university','college','department','phase','section','subject','lecture')),
  resource_id TEXT NOT NULL,
  PRIMARY KEY(batch_id,resource_type,resource_id)
);

CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_academic_deletions_status_recent
ON academic_deletions(status,deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_academic_deleted_items_lookup
ON academic_deleted_items(resource_type,resource_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
ON user_notifications(user_id,read_at,created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_ban_one_pending_lift
ON student_ban_requests(ban_id)
WHERE ban_id IS NOT NULL
  AND status='pending'
  AND request_type IN ('lift_temporary','lift_permanent');

PRAGMA optimize;
