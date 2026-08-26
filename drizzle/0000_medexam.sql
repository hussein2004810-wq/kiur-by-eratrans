CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  lecture TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 360),
  pass_percentage INTEGER NOT NULL DEFAULT 60 CHECK (pass_percentage BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_option INTEGER NOT NULL CHECK (correct_option >= 0),
  explanation TEXT,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  test_id TEXT NOT NULL REFERENCES tests(id),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted')),
  score INTEGER,
  max_score INTEGER,
  percentage REAL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS attempt_answers (
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option INTEGER NOT NULL,
  is_correct INTEGER,
  answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  by_user_id TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_tests_status_created ON tests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_test_position ON questions(test_id, position);
CREATE INDEX IF NOT EXISTS idx_attempts_user_finished ON attempts(user_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_test_status ON attempts(test_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_logs(at DESC);

INSERT OR IGNORE INTO tests (id,title,subject,lecture,duration_minutes,pass_percentage,status,created_by)
VALUES ('demo-preop','تقييم المريض قبل العملية','التخدير العام','المحاضرة الثالثة',25,60,'published','system');

INSERT OR IGNORE INTO questions (id,test_id,text,options_json,correct_option,explanation,position)
VALUES ('demo-q1','demo-preop','أي تصنيف من تصنيفات ASA يصف مريضًا لديه مرض جهازي شديد يحد من نشاطه؟','["ASA I","ASA II","ASA III","ASA IV"]',2,'يصنف هذا المريض ASA III بسبب وجود مرض جهازي شديد يحد من النشاط.',1);

INSERT OR IGNORE INTO questions (id,test_id,text,options_json,correct_option,explanation,position)
VALUES ('demo-q2','demo-preop','ما الإجراء الأكثر أهمية ضمن التقييم الأولي لمجرى الهواء؟','["قياس ضغط الدم فقط","تقييم فتحة الفم وحركة الرقبة","قياس سكر الدم","تحديد فصيلة الدم"]',1,'تقييم فتحة الفم وحركة الرقبة يساعد على توقع صعوبة التنبيب.',2);

INSERT OR IGNORE INTO questions (id,test_id,text,options_json,correct_option,explanation,position)
VALUES ('demo-q3','demo-preop','أي مما يأتي يجب توثيقه قبل بدء التخدير؟','["الموافقة المستنيرة وخطة التخدير","اسم الممرض فقط","موعد الخروج المتوقع فقط","نوع الغرفة"]',0,'يجب توثيق الموافقة المستنيرة وخطة التخدير قبل الإجراء.',3);

PRAGMA optimize;
