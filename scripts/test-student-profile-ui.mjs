import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [profile,css,app]=await Promise.all([readFile('src/StudentProfile.tsx','utf8'),readFile('src/student-profile.css','utf8'),readFile('src/RealAppV2.tsx','utf8')]);
for(const text of ['ملف الطالب','رمز الطالب','المسار الأكاديمي','تطور الأداء','ملخص المواد','موضوعات تحتاج تركيزًا','خطة المراجعة','المحفوظات والمفضلة','الشارات العلمية','الشهادات الموثقة','طلباتك السابقة','الحساب والخصوصية','الأجهزة والجلسات'])assert(profile.includes(text),`Missing profile section: ${text}`);
assert.match(profile,/accept="image\/png,image\/jpeg,image\/webp"/);assert.match(profile,/2\*1024\*1024/);assert.match(profile,/\/api\/me\/profile-dashboard/);assert.match(profile,/\/api\/me\/sessions/);assert.match(profile,/CertificateButton/);assert.match(app,/view==='profile'/);assert.match(app,/aria-label="فتح حسابي"/);assert.match(app,/AccountProfile/);assert.match(css,/@media\(max-width:640px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.doesNotMatch(profile,/dangerouslySetInnerHTML/);
console.log(JSON.stringify({ok:true,sections:13,mobile:true,accessibleEntry:true,safeRendering:true}));
