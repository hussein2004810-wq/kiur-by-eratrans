/**
 * Isolated development & testing seed script for KIUR by ERATRANS.
 * This is executed ONLY in local development and automated test fixtures.
 * It is NEVER bundled or executed in production Cloudflare D1 runtime.
 */
export const developmentSeeds = [
  "INSERT OR REPLACE INTO tests(id,title,subject,lecture,duration_minutes,pass_percentage,status,created_by,department_id,phase_id,subject_id,lecture_id) VALUES('demo-preop','تقييم المريض قبل العملية','التخدير العام','المحاضرة الثالثة',25,60,'published','system','dep-anesthesia','pha-a4','sub-a4-general','lec-a4-general-3')",
  "INSERT OR IGNORE INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES('demo-q1','demo-preop','أي تصنيف من تصنيفات ASA يصف مريضًا لديه مرض جهازي شديد يحد من نشاطه؟','[\"ASA I\",\"ASA II\",\"ASA III\",\"ASA IV\"]',2,'يصنف هذا المريض ASA III بسبب وجود مرض جهازي شديد يحد من النشاط.',1)",
  "INSERT OR IGNORE INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES('demo-q2','demo-preop','ما الإجراء الأكثر أهمية ضمن التقييم الأولي لمجرى الهواء؟','[\"قياس ضغط الدم فقط\",\"تقييم فتحة الفم وحركة الرقبة\",\"قياس سكر الدم\",\"تحديد فصيلة الدم\"]',1,'تقييم فتحة الفم وحركة الرقبة يساعد على توقع صعوبة التنبيب.',2)",
  "INSERT OR IGNORE INTO questions(id,test_id,text,options_json,correct_option,explanation,position) VALUES('demo-q3','demo-preop','أي مما يأتي يجب توثيقه قبل بدء التخدير؟','[\"الموافقة المستنيرة وخطة التخدير\",\"اسم الممرض فقط\",\"موعد الخروج المتوقع فقط\",\"نوع الغرفة\"]',0,'يجب توثيق الموافقة المستنيرة وخطة التخدير قبل الإجراء.',3)"
];

export async function seedDevelopmentData(db) {
  for (const sql of developmentSeeds) {
    if (typeof db.prepare === 'function') {
      const stmt = db.prepare(sql);
      if (typeof stmt.run === 'function') {
        await stmt.run();
      }
    } else if (typeof db.exec === 'function') {
      db.exec(sql);
    }
  }
}
