import {Building2,GraduationCap,LogOut,Mail,ShieldCheck,UserRound} from 'lucide-react';

type User={email:string;name:string;role:'student'|'teacher'|'admin'|'owner';staffTitle?:string|null;universityName?:string|null;collegeName?:string|null;departmentName?:string|null;phaseName?:string|null};
const roleNames:Record<string,string>={owner:'مالك المنصة',admin:'مشرف المنصة',teacher:'كادر أكاديمي',department_head:'رئيس قسم',department_coordinator:'مقرر قسم',university_doctor:'دكتور جامعي',university_professor:'أستاذ جامعي'};

export default function AccountProfile({user,onLogout}:{user:User;onLogout:()=>void}){
  const role=user.role==='teacher'?(roleNames[user.staffTitle||'teacher']||roleNames.teacher):roleNames[user.role];
  const scope=[user.universityName,user.collegeName,user.departmentName,user.phaseName].filter(Boolean).join(' / ');
  return <section className="accountProfile" dir="rtl">
    <header className="accountProfileHero"><span>{user.name.trim().split(/\s+/).slice(0,2).map(value=>value[0]).join('')}</span><div><small>حسابي</small><h2>{user.name}</h2><p><Mail/>{user.email}</p></div></header>
    <div className="accountProfileGrid"><article className="panel"><ShieldCheck/><div><small>نوع الحساب</small><h3>{role}</h3><p>تظهر لك الأدوات وفق الصلاحيات والنطاق الممنوحَين لحسابك.</p></div></article><article className="panel"><Building2/><div><small>نطاق العمل الأكاديمي</small><h3>{scope||'نطاق المنصة'}</h3><p>لا يعرض هذا القسم بيانات أي مستخدم آخر.</p></div></article></div>
    <section className="panel accountProfileSecurity"><UserRound/><div><h3>الأمان والخصوصية</h3><p>يمكنك إنهاء الجلسة الحالية بأمان من هنا.</p></div><button className="solid" onClick={onLogout}><LogOut/>تسجيل الخروج</button></section>
    {user.role==='teacher'&&<section className="panel accountProfileNotice"><GraduationCap/><p>لإضافة صورة شخصية أو تعديل بيانات الكادر، تواصل مع مالك المنصة أو المشرف المخوّل.</p></section>}
  </section>;
}
