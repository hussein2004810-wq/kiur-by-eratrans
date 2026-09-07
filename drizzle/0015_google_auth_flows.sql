CREATE TABLE IF NOT EXISTS google_auth_flows (
  token_hash TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  origin TEXT NOT NULL,
  academic_json TEXT NOT NULL DEFAULT 'null',
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_google_auth_expiry ON google_auth_flows(expires_at);
