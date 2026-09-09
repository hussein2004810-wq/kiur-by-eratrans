CREATE TABLE IF NOT EXISTS student_profile_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_object_key TEXT,
  avatar_content_type TEXT CHECK(avatar_content_type IN ('image/jpeg','image/png','image/webp')),
  avatar_updated_at TEXT,
  avatar_style TEXT NOT NULL DEFAULT 'indigo' CHECK(avatar_style IN ('indigo','blue','violet','amber')),
  show_avatar INTEGER NOT NULL DEFAULT 1 CHECK(show_avatar IN (0,1)),
  show_badges INTEGER NOT NULL DEFAULT 1 CHECK(show_badges IN (0,1)),
  show_activity INTEGER NOT NULL DEFAULT 1 CHECK(show_activity IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profile_preferences_avatar
ON student_profile_preferences(avatar_updated_at)
WHERE avatar_object_key IS NOT NULL;

PRAGMA optimize;
