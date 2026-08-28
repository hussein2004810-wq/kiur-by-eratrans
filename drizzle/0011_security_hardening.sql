ALTER TABLE attempts ADD COLUMN deadline_at TEXT;

UPDATE attempts
SET deadline_at=(
  SELECT CASE
    WHEN tests.exam_mode='formal' AND tests.available_until IS NOT NULL
      THEN min(datetime(attempts.started_at,'+' || (tests.duration_minutes * 60) || ' seconds'),datetime(tests.available_until))
    ELSE datetime(attempts.started_at,'+' || (tests.duration_minutes * 60) || ' seconds')
  END
  FROM tests WHERE tests.id=attempts.test_id
)
WHERE deadline_at IS NULL;

ALTER TABLE media_assets ADD COLUMN scope_type TEXT NOT NULL DEFAULT 'platform'
  CHECK(scope_type IN ('platform','university','college','department','phase','section','subject','lecture'));
ALTER TABLE media_assets ADD COLUMN scope_id TEXT NOT NULL DEFAULT 'platform';

ALTER TABLE users ADD COLUMN password_peppered INTEGER NOT NULL DEFAULT 0
  CHECK(password_peppered IN (0,1));

CREATE TABLE IF NOT EXISTS email_verifications (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_invites (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attempts_deadline
ON attempts(status, deadline_at);

CREATE INDEX IF NOT EXISTS idx_media_scope
ON media_assets(scope_type, scope_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token
ON email_verifications(token_hash, expires_at);

CREATE INDEX IF NOT EXISTS idx_staff_invites_token
ON staff_invites(token_hash, expires_at);

PRAGMA optimize;
