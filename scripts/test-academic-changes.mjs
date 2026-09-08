import {readFile} from 'node:fs/promises';

const api=await readFile('worker/academic-change-api.js','utf8');
const migration=await readFile('drizzle/0017_academic_change_requests.sql','utf8');
const app=await readFile('src/AcademicChangeManager.tsx','utf8');
const access=await readFile('worker/access-control.js','utf8');

for(const token of ['required_approvals','risk_level','idempotency_key','UNIQUE(request_id, reviewer_id)','idx_academic_change_one_open'])if(!migration.includes(token))throw new Error(`Missing workflow schema control: ${token}`);
for(const token of ['INDIVIDUAL_REVIEW_REQUIRED','SELF_APPROVAL_FORBIDDEN','scopeSide===\'source\'','scopeSide===\'target\'','ids.length>100','review_academic_changes'])if(!api.includes(token))throw new Error(`Missing workflow API control: ${token}`);
if(!access.includes("'review_academic_changes'"))throw new Error('Missing academic change permission');
for(const token of ['تحديد الطلبات الخضراء الظاهرة','اعتماد دفعي','طلبات تغيير المسار','idempotencyKey:crypto.randomUUID()'])if(!app.includes(token))throw new Error(`Missing workflow UI behavior: ${token}`);
console.log(JSON.stringify({ok:true,workflow:'academic-change-approval'}));
