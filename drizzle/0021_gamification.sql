ALTER TABLE tests ADD COLUMN difficulty_level INTEGER NOT NULL DEFAULT 2
  CHECK(difficulty_level BETWEEN 1 AND 3);

CREATE TABLE IF NOT EXISTS gamification_seasons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('scheduled','active','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gamification_settings (
  id TEXT PRIMARY KEY CHECK(id='platform'),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  practice_daily_cap INTEGER NOT NULL DEFAULT 180 CHECK(practice_daily_cap BETWEEN 20 AND 1000),
  total_daily_cap INTEGER NOT NULL DEFAULT 350 CHECK(total_daily_cap BETWEEN 50 AND 2000),
  weekly_days_target INTEGER NOT NULL DEFAULT 3 CHECK(weekly_days_target BETWEEN 1 AND 7),
  updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_gamification_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT,
  leaderboard_visible INTEGER NOT NULL DEFAULT 1 CHECK(leaderboard_visible IN (0,1)),
  selected_frame TEXT NOT NULL DEFAULT 'pulse',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gamification_point_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES gamification_seasons(id),
  attempt_id TEXT REFERENCES attempts(id) ON DELETE SET NULL,
  test_id TEXT REFERENCES tests(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('attempt','improvement','mastery','weekly_activity','weak_topic','manual_adjustment')),
  points INTEGER NOT NULL CHECK(points BETWEEN -1000 AND 1000),
  status TEXT NOT NULL DEFAULT 'awarded' CHECK(status IN ('awarded','pending_review','void')),
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  review_note TEXT
);

CREATE TABLE IF NOT EXISTS gamification_missions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES gamification_seasons(id),
  week_start TEXT NOT NULL,
  mission_type TEXT NOT NULL CHECK(mission_type IN ('weekly_activity','weak_topic')),
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  target_value INTEGER NOT NULL CHECK(target_value BETWEEN 1 AND 100),
  progress_value INTEGER NOT NULL DEFAULT 0 CHECK(progress_value>=0),
  reward_points INTEGER NOT NULL CHECK(reward_points BETWEEN 1 AND 200),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','expired')),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,week_start,mission_type)
);

CREATE TABLE IF NOT EXISTS student_gamification_badges (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_event_id TEXT REFERENCES gamification_point_ledger(id) ON DELETE SET NULL,
  PRIMARY KEY(user_id,badge_id)
);

CREATE TABLE IF NOT EXISTS gamification_section_goals (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES gamification_seasons(id),
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_points INTEGER NOT NULL CHECK(target_points BETWEEN 100 AND 1000000),
  reward_label TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','cancelled')),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_gamification_ledger_user_season
ON gamification_point_ledger(user_id,season_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_ledger_season_rank
ON gamification_point_ledger(season_id,status,user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_ledger_attempt
ON gamification_point_ledger(attempt_id,event_type);
CREATE INDEX IF NOT EXISTS idx_gamification_ledger_review
ON gamification_point_ledger(status,created_at DESC) WHERE status='pending_review';
CREATE INDEX IF NOT EXISTS idx_gamification_missions_user_week
ON gamification_missions(user_id,week_start,status);
CREATE INDEX IF NOT EXISTS idx_gamification_goals_section
ON gamification_section_goals(section_id,season_id,status);

PRAGMA optimize;
