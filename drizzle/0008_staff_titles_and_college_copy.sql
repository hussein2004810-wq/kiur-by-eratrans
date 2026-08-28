ALTER TABLE departments ADD COLUMN display_name TEXT;

UPDATE departments
SET display_name=name
WHERE display_name IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_college_display_name
ON departments(college_id, display_name);

ALTER TABLE users ADD COLUMN staff_title TEXT
  CHECK(staff_title IS NULL OR staff_title IN ('department_head','department_coordinator','university_doctor','university_professor'));

UPDATE users
SET staff_title='university_doctor'
WHERE account_role='teacher' AND staff_title IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_staff_title
ON users(staff_title, account_status)
WHERE staff_title IS NOT NULL;

PRAGMA optimize;
