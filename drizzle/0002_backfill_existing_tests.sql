UPDATE tests SET
  department_id='dep-anesthesia',
  phase_id='pha-a4',
  subject_id='sub-a4-general',
  lecture_id=CASE
    WHEN lecture LIKE '%الثالث%' OR lecture LIKE '%الثالثة%' THEN 'lec-a4-general-3'
    WHEN lecture LIKE '%الثاني%' OR lecture LIKE '%الثانية%' THEN 'lec-a4-general-2'
    ELSE 'lec-a4-general-1'
  END
WHERE department_id IS NULL OR phase_id IS NULL OR subject_id IS NULL OR lecture_id IS NULL;

PRAGMA optimize;
