CREATE INDEX IF NOT EXISTS idx_questions_image_test
ON questions(image_id,test_id)
WHERE image_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_glimpses_image_public
ON clinical_glimpses(image_id,status,publish_at)
WHERE image_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_attempts_user_test_status_deadline
ON attempts(user_id,test_id,status,deadline_at);

PRAGMA optimize;
