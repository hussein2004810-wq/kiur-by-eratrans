CREATE TABLE IF NOT EXISTS universities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS colleges (
  id TEXT PRIMARY KEY,
  university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(university_id, name)
);

ALTER TABLE departments ADD COLUMN college_id TEXT REFERENCES colleges(id);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  phase_id TEXT NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(phase_id, name)
);

ALTER TABLE users ADD COLUMN account_role TEXT NOT NULL DEFAULT 'student'
  CHECK(account_role IN ('owner','admin','teacher','student'));
ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active'
  CHECK(account_status IN ('pending','active','suspended'));
ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'chatgpt'
  CHECK(auth_provider IN ('chatgpt','password','hybrid'));
ALTER TABLE users ADD COLUMN university_id TEXT REFERENCES universities(id);
ALTER TABLE users ADD COLUMN college_id TEXT REFERENCES colleges(id);
ALTER TABLE users ADD COLUMN section_id TEXT REFERENCES sections(id);
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN password_iterations INTEGER;
ALTER TABLE users ADD COLUMN last_login_at TEXT;

ALTER TABLE tests ADD COLUMN section_id TEXT REFERENCES sections(id);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  user_agent_hash TEXT
);

CREATE TABLE IF NOT EXISTS user_identities (
  provider TEXT NOT NULL CHECK(provider IN ('chatgpt','password')),
  provider_user_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(provider, provider_user_id),
  UNIQUE(provider, user_id)
);

CREATE TABLE IF NOT EXISTS user_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grant_role TEXT NOT NULL CHECK(grant_role IN ('admin','teacher')),
  scope_type TEXT NOT NULL CHECK(scope_type IN ('platform','university','college','department','phase','section','subject','lecture')),
  scope_id TEXT NOT NULL,
  permissions_json TEXT NOT NULL,
  granted_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, grant_role, scope_type, scope_id)
);

INSERT OR IGNORE INTO universities(id,name,sort_order)
VALUES('uni-eratrans','جامعات وكليات ERATRANS',1);

INSERT OR IGNORE INTO colleges(id,university_id,name,sort_order)
VALUES('college-eratrans-medical','uni-eratrans','الكلية الطبية',1);

UPDATE departments
SET college_id='college-eratrans-medical'
WHERE college_id IS NULL;

UPDATE users
SET account_role=CASE WHEN role='admin' THEN 'admin' ELSE 'student' END;

INSERT OR IGNORE INTO user_identities(provider,provider_user_id,user_id,email)
SELECT 'chatgpt',id,id,email FROM users;

UPDATE users
SET college_id=(SELECT d.college_id FROM departments d WHERE d.id=users.department_id),
    university_id=(SELECT c.university_id FROM colleges c JOIN departments d ON d.college_id=c.id WHERE d.id=users.department_id)
WHERE department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_colleges_university
ON colleges(university_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_departments_college
ON departments(college_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_sections_phase
ON sections(phase_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_users_account_role_status
ON users(account_role, account_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_organization
ON users(university_id, college_id, department_id, phase_id, section_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active
ON auth_sessions(user_id, expires_at, revoked_at);

CREATE INDEX IF NOT EXISTS idx_user_identities_user
ON user_identities(user_id);

CREATE INDEX IF NOT EXISTS idx_user_grants_user
ON user_grants(user_id, grant_role);

CREATE INDEX IF NOT EXISTS idx_user_grants_scope
ON user_grants(scope_type, scope_id);

CREATE INDEX IF NOT EXISTS idx_tests_section_status
ON tests(section_id, status, created_at DESC);

PRAGMA optimize;
