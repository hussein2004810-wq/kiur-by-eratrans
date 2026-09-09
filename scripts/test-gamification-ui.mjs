import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('src/RealAppV2.tsx','utf8'),student=await readFile('src/StudentPoints.tsx','utf8'),admin=await readFile('src/GamificationManager.tsx','utf8'),css=await readFile('src/gamification.css','utf8'),access=await readFile('worker/access-control.js','utf8');
assert(app.includes("['points',Trophy,'نقاطي']")&&app.includes("adminTab==='gamification'"),'gamification destinations must be reachable');
for(const text of ['نقاطك وإنجازاتك وتقدمك الدراسي','لوحة المنافسة الهادئة','إخفائي من المنافسة','هدف تعاوني اختياري للشعبة'])assert(student.includes(text),`missing student gamification UX: ${text}`);
assert(admin.includes('لا يعاقب الطالب آليًا')&&admin.includes('canReview'),'review queue must be explicitly permission gated');
assert(access.includes("'manage_gamification'")&&access.includes("'review_gamification'"),'independent gamification permissions missing');
assert(css.includes('@media(max-width:720px)')&&css.includes('@media(prefers-reduced-motion:reduce)'),'phone and reduced-motion support missing');
console.log(JSON.stringify({ok:true,studentDashboard:true,privacy:true,adminReview:true,mobile:true,reducedMotion:true}));
