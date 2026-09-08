ALTER TABLE users ADD COLUMN auth_epoch INTEGER NOT NULL DEFAULT 0;

ALTER TABLE auth_sessions ADD COLUMN auth_epoch INTEGER NOT NULL DEFAULT 0;

CREATE TABLE owner_recovery_operations (
  operation_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consumed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_sessions_user_revoked
ON auth_sessions(user_id, revoked_at);

CREATE INDEX idx_owner_recovery_user
ON owner_recovery_operations(user_id, consumed_at DESC);

PRAGMA optimize;
