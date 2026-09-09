CREATE TABLE IF NOT EXISTS user_ui_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme_preference TEXT CHECK(theme_preference IN ('light','dark')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

PRAGMA optimize;
