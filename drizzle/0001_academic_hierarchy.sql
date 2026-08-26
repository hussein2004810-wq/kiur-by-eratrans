CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS phases (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(department_id, name)
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  phase_id TEXT NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(phase_id, name)
);

CREATE TABLE IF NOT EXISTS lectures (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(subject_id, name)
);

ALTER TABLE users ADD COLUMN department_id TEXT;
ALTER TABLE users ADD COLUMN phase_id TEXT;
ALTER TABLE tests ADD COLUMN department_id TEXT;
ALTER TABLE tests ADD COLUMN phase_id TEXT;
ALTER TABLE tests ADD COLUMN subject_id TEXT;
ALTER TABLE tests ADD COLUMN lecture_id TEXT;

CREATE INDEX IF NOT EXISTS idx_phases_department ON phases(department_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_subjects_phase ON subjects(phase_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lectures_subject ON lectures(subject_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tests_hierarchy ON tests(department_id, phase_id, subject_id, lecture_id, status);

INSERT OR IGNORE INTO departments(id,name,sort_order) VALUES
  ('dep-anesthesia','قسم التخدير',1),
  ('dep-medicine','قسم الطب العام',2),
  ('dep-nursing','قسم التمريض',3);

INSERT OR IGNORE INTO phases(id,department_id,name,sort_order) VALUES
  ('pha-a1','dep-anesthesia','المرحلة الأولى',1),('pha-a2','dep-anesthesia','المرحلة الثانية',2),
  ('pha-a3','dep-anesthesia','المرحلة الثالثة',3),('pha-a4','dep-anesthesia','المرحلة الرابعة',4),
  ('pha-a5','dep-anesthesia','المرحلة الخامسة',5),
  ('pha-m1','dep-medicine','المرحلة الأولى',1),('pha-m2','dep-medicine','المرحلة الثانية',2),
  ('pha-m3','dep-medicine','المرحلة الثالثة',3),('pha-m4','dep-medicine','المرحلة الرابعة',4),
  ('pha-m5','dep-medicine','المرحلة الخامسة',5),('pha-m6','dep-medicine','المرحلة السادسة',6),
  ('pha-n1','dep-nursing','المرحلة الأولى',1),('pha-n2','dep-nursing','المرحلة الثانية',2),
  ('pha-n3','dep-nursing','المرحلة الثالثة',3),('pha-n4','dep-nursing','المرحلة الرابعة',4);

INSERT OR IGNORE INTO subjects(id,phase_id,name,sort_order) VALUES
  ('sub-a1-anatomy','pha-a1','التشريح',1),('sub-a1-physiology','pha-a1','الفسلجة',2),
  ('sub-a2-pharma','pha-a2','علم الأدوية',1),('sub-a2-equipment','pha-a2','أجهزة التخدير',2),
  ('sub-a3-general','pha-a3','التخدير العام',1),('sub-a3-icu','pha-a3','العناية المركزة',2),
  ('sub-a4-general','pha-a4','التخدير العام',1),('sub-a4-regional','pha-a4','التخدير الناحي',2),('sub-a4-emergency','pha-a4','طب الطوارئ',3),
  ('sub-a5-advanced','pha-a5','التخدير المتقدم',1),('sub-a5-pain','pha-a5','إدارة الألم',2),
  ('sub-m1-biology','pha-m1','الأحياء الطبية',1),('sub-m2-anatomy','pha-m2','التشريح',1),
  ('sub-m3-pathology','pha-m3','علم الأمراض',1),('sub-m4-medicine','pha-m4','الباطنية',1),
  ('sub-m5-surgery','pha-m5','الجراحة',1),('sub-m6-clinical','pha-m6','التطبيق السريري',1),
  ('sub-n1-fundamentals','pha-n1','أساسيات التمريض',1),('sub-n2-medical','pha-n2','التمريض الباطني',1),
  ('sub-n3-critical','pha-n3','تمريض الحالات الحرجة',1),('sub-n4-community','pha-n4','تمريض صحة المجتمع',1);

INSERT OR IGNORE INTO lectures(id,subject_id,name,sort_order) VALUES
  ('lec-a1-anatomy-1','sub-a1-anatomy','المحاضرة الأولى: مدخل إلى التشريح',1),
  ('lec-a1-physiology-1','sub-a1-physiology','المحاضرة الأولى: وظائف الخلية',1),
  ('lec-a2-pharma-1','sub-a2-pharma','المحاضرة الأولى: مبادئ علم الأدوية',1),
  ('lec-a2-equipment-1','sub-a2-equipment','المحاضرة الأولى: جهاز التخدير',1),
  ('lec-a3-general-1','sub-a3-general','المحاضرة الأولى: أساسيات التخدير العام',1),
  ('lec-a3-icu-1','sub-a3-icu','المحاضرة الأولى: مراقبة المريض الحرج',1),
  ('lec-a4-general-1','sub-a4-general','المحاضرة الأولى: تحضير المريض',1),
  ('lec-a4-general-2','sub-a4-general','المحاضرة الثانية: مجرى الهواء',2),
  ('lec-a4-general-3','sub-a4-general','المحاضرة الثالثة: تقييم ما قبل العملية',3),
  ('lec-a4-regional-1','sub-a4-regional','المحاضرة الأولى: التخدير النصفي',1),
  ('lec-a4-emergency-1','sub-a4-emergency','المحاضرة الأولى: الإنعاش القلبي الرئوي',1),
  ('lec-a5-advanced-1','sub-a5-advanced','المحاضرة الأولى: التخدير للحالات المعقدة',1),
  ('lec-a5-pain-1','sub-a5-pain','المحاضرة الأولى: تقييم الألم',1),
  ('lec-m1-biology-1','sub-m1-biology','المحاضرة الأولى: الخلية',1),
  ('lec-m2-anatomy-1','sub-m2-anatomy','المحاضرة الأولى: الجهاز العضلي',1),
  ('lec-m3-pathology-1','sub-m3-pathology','المحاضرة الأولى: الالتهاب',1),
  ('lec-m4-medicine-1','sub-m4-medicine','المحاضرة الأولى: أمراض القلب',1),
  ('lec-m5-surgery-1','sub-m5-surgery','المحاضرة الأولى: مبادئ الجراحة',1),
  ('lec-m6-clinical-1','sub-m6-clinical','المحاضرة الأولى: التقييم السريري',1),
  ('lec-n1-fundamentals-1','sub-n1-fundamentals','المحاضرة الأولى: أساسيات رعاية المريض',1),
  ('lec-n2-medical-1','sub-n2-medical','المحاضرة الأولى: رعاية مريض الباطنية',1),
  ('lec-n3-critical-1','sub-n3-critical','المحاضرة الأولى: مراقبة العلامات الحيوية',1),
  ('lec-n4-community-1','sub-n4-community','المحاضرة الأولى: الرعاية الصحية الأولية',1);

UPDATE tests SET
  department_id='dep-anesthesia', phase_id='pha-a4',
  subject_id='sub-a4-general', lecture_id='lec-a4-general-3'
WHERE id='demo-preop' AND lecture_id IS NULL;

PRAGMA optimize;
