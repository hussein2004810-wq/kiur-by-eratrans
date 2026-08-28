ALTER TABLE users ADD COLUMN firebase_uid TEXT;
ALTER TABLE users ADD COLUMN email_verified_at TEXT;

UPDATE users
SET email_verified_at=(
  SELECT verified_at FROM email_verifications
  WHERE email_verifications.user_id=users.id
)
WHERE email_verified_at IS NULL
  AND EXISTS(
    SELECT 1 FROM email_verifications
    WHERE email_verifications.user_id=users.id
      AND email_verifications.verified_at IS NOT NULL
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid
ON users(firebase_uid)
WHERE firebase_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_verified
ON users(email_verified_at)
WHERE email_verified_at IS NOT NULL;

DROP INDEX IF EXISTS idx_account_events_recent;
DROP INDEX IF EXISTS idx_account_events_user;
ALTER TABLE account_events RENAME TO account_events_legacy;

CREATE TABLE account_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  account_code TEXT,
  email_hash TEXT,
  event_type TEXT NOT NULL CHECK(event_type IN ('register','account_created','account_status','grant_changed','login_success','login_failure','logout','verification_resent','password_reset_requested','firebase_migration')),
  outcome TEXT NOT NULL CHECK(outcome IN ('success','failure')),
  device_hash TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details_json TEXT
);

INSERT INTO account_events(id,user_id,account_code,email_hash,event_type,outcome,device_hash,at,details_json)
SELECT id,user_id,account_code,email_hash,event_type,outcome,device_hash,at,details_json
FROM account_events_legacy;

DROP TABLE account_events_legacy;

CREATE INDEX idx_account_events_recent ON account_events(at DESC);
CREATE INDEX idx_account_events_user ON account_events(user_id, at DESC);

PRAGMA optimize;
