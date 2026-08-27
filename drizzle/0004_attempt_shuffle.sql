ALTER TABLE tests ADD COLUMN shuffle_questions INTEGER NOT NULL DEFAULT 0 CHECK(shuffle_questions IN (0,1));
ALTER TABLE tests ADD COLUMN shuffle_options INTEGER NOT NULL DEFAULT 0 CHECK(shuffle_options IN (0,1));
ALTER TABLE attempts ADD COLUMN question_order_json TEXT;
ALTER TABLE attempts ADD COLUMN option_orders_json TEXT;

PRAGMA optimize;
