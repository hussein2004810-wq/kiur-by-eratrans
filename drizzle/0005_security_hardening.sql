CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1 CHECK(count >= 1),
  PRIMARY KEY(bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window
ON api_rate_limits(window_start);

PRAGMA optimize;
