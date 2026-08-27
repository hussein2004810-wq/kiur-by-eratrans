export const tables = {
  users: ['id','email','name','role','created_at','updated_at'],
  tests: ['id','title','subject','lecture','duration_minutes','pass_percentage','shuffle_questions','shuffle_options','status','created_by','created_at','updated_at'],
  questions: ['id','test_id','text','options_json','correct_option','explanation','position'],
  attempts: ['id','user_id','test_id','status','score','max_score','percentage','question_order_json','option_orders_json','started_at','last_saved_at','finished_at'],
  attemptAnswers: ['attempt_id','question_id','selected_option','is_correct','answered_at'],
  auditLogs: ['id','entity','entity_id','action','by_user_id','at','details_json'],
} as const;
