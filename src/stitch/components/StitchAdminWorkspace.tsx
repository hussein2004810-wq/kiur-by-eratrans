import React, {useMemo, useState} from 'react';
import type {LucideIcon} from 'lucide-react';
import {Activity, ArrowLeft, ClipboardList, Plus, RefreshCw, ShieldCheck, Users} from 'lucide-react';
import '../stitch-admin.css';

export type AdminSectionId = 'overview'|'tests'|'imports'|'catalog'|'students'|'academicChanges'|'gamification'|'glimpses'|'library'|'accounts'|'bans'|'logs';

export type AdminSection = {
  id: AdminSectionId;
  label: string;
  description: string;
  group: 'overview'|'content'|'people'|'governance';
  icon: LucideIcon;
  count?: number;
};

type AuditItem = {id:string; action:string; actorName?:string|null; at:string};
type AdminMetrics = {tests?:number; students?:number; attempts?:number; averagePercentage?:number};

type Props = {
  active: AdminSectionId;
  sections: AdminSection[];
  roleLabel: string;
  scopeLabel: string;
  metrics?: AdminMetrics|null;
  testsCount: number;
  audits?: AuditItem[];
  onSelect: (id:AdminSectionId)=>void;
  onCreateTest: ()=>void;
  onRefresh: ()=>void;
  children?: React.ReactNode;
};

const groupLabels:Record<AdminSection['group'],string> = {
  overview:'نظرة عامة',
  content:'المحتوى والاختبارات',
  people:'الطلاب والكوادر',
  governance:'الحوكمة والسجلات'
};

function Metric({icon:Icon,label,value,detail}:{icon:LucideIcon;label:string;value:string|number;detail:string}){
  return <article className="stitchAdminMetric"><span><Icon aria-hidden="true"/></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}

export default function StitchAdminWorkspace({active,sections,roleLabel,scopeLabel,metrics,testsCount,audits=[],onSelect,onCreateTest,onRefresh,children}:Props){
  const [menuOpen,setMenuOpen]=useState(false);
  const current=sections.find(item=>item.id===active) || sections[0];
  const grouped=useMemo(()=>Object.entries(groupLabels).map(([group,label])=>({group:group as AdminSection['group'],label,items:sections.filter(item=>item.group===group)})).filter(item=>item.items.length),[sections]);
  const choose=(id:AdminSectionId)=>{onSelect(id);setMenuOpen(false)};
  const metricValues={
    tests:metrics?.tests ?? testsCount,
    students:metrics?.students ?? '—',
    attempts:metrics?.attempts ?? '—',
    average:typeof metrics?.averagePercentage==='number'?`${metrics.averagePercentage}%`:'—'
  };

  return <section className="stitchAdmin" aria-label="مساحة إدارة KIUR">
    <header className="stitchAdminHero">
      <div className="stitchAdminHeroCopy">
        <div className="stitchAdminEyebrow"><span>KIUR OPERATIONS</span><i aria-hidden="true"/><small>متصل بالبيانات الحقيقية</small></div>
        <h1>{roleLabel === 'مالك المنصة' ? 'مركز قيادة المنصة' : 'مساحة عمل الكادر'}</h1>
        <p>إدارة الاختبارات والمحتوى والطلاب ضمن نطاق صلاحيتك، في واجهة موحدة مبنية على نظام Google Stitch.</p>
        <div className="stitchAdminScope"><ShieldCheck aria-hidden="true"/><span><small>نطاق العمل الحالي</small><b>{scopeLabel}</b></span></div>
      </div>
      <div className="stitchAdminHeroActions">
        <button type="button" className="stitchAdminSecondary" onClick={onRefresh}><RefreshCw aria-hidden="true"/>تحديث البيانات</button>
        <button type="button" className="stitchAdminPrimary" onClick={onCreateTest}><Plus aria-hidden="true"/>إنشاء اختبار</button>
      </div>
    </header>

    <button className="stitchAdminMenuToggle" type="button" aria-expanded={menuOpen} aria-controls="stitch-admin-nav" onClick={()=>setMenuOpen(value=>!value)}>
      <span><current.icon aria-hidden="true"/><span><small>القسم الحالي</small><b>{current.label}</b></span></span><ArrowLeft aria-hidden="true"/>
    </button>

    <div className="stitchAdminLayout">
      <aside id="stitch-admin-nav" className={menuOpen?'is-open':''}>
        <div className="stitchAdminIdentity"><span><Activity aria-hidden="true"/></span><div><b>مركز التحكم</b><small>{roleLabel}</small></div></div>
        <nav aria-label="أقسام لوحة الإدارة">
          {grouped.map(group=><section key={group.group}><h2>{group.label}</h2>{group.items.map(item=><button type="button" key={item.id} className={active===item.id?'is-active':''} aria-current={active===item.id?'page':undefined} onClick={()=>choose(item.id)}><item.icon aria-hidden="true"/><span><b>{item.label}</b><small>{item.description}</small></span>{typeof item.count==='number'&&<em>{item.count}</em>}</button>)}</section>)}
        </nav>
      </aside>

      <div className="stitchAdminMain" role="region" aria-label={current.label}>
        {active==='overview'?<>
          <div className="stitchAdminMetrics" aria-label="مؤشرات التشغيل">
            <Metric icon={ClipboardList} label="الاختبارات ضمن نطاقك" value={metricValues.tests} detail="منشورة ومسودات متاحة للإدارة"/>
            <Metric icon={Users} label="الطلاب المسجلون" value={metricValues.students} detail="يعرض الرقم الحقيقي للمالك فقط"/>
            <Metric icon={Activity} label="إجمالي المحاولات" value={metricValues.attempts} detail="محاولات محفوظة في النظام"/>
            <Metric icon={ShieldCheck} label="متوسط النتائج" value={metricValues.average} detail="محسوب من النتائج المسجلة"/>
          </div>
          <div className="stitchAdminOverviewGrid">
            <section className="stitchAdminPanel stitchAdminDirectory"><header><div><small>اختصارات العمل</small><h2>ماذا تريد أن تدير الآن؟</h2></div></header><div>{sections.filter(item=>item.id!=='overview').map(item=><button type="button" key={item.id} onClick={()=>choose(item.id)}><span><item.icon aria-hidden="true"/></span><div><b>{item.label}</b><small>{item.description}</small></div><ArrowLeft aria-hidden="true"/></button>)}</div></section>
            <section className="stitchAdminPanel stitchAdminActivity"><header><div><small>سجل مباشر</small><h2>آخر الأنشطة</h2></div>{audits.length>0&&<button type="button" onClick={()=>choose('logs')}>عرض السجل</button>}</header>{audits.length?<div>{audits.slice(0,7).map(item=><article key={item.id}><i aria-hidden="true"/><div><b>{item.action}</b><small>{item.actorName||'النظام'} · {new Intl.DateTimeFormat('ar-IQ',{dateStyle:'short',timeStyle:'short'}).format(new Date(item.at))}</small></div></article>)}</div>:<div className="stitchAdminEmpty"><Activity aria-hidden="true"/><b>لا توجد أنشطة متاحة</b><p>تظهر هنا الأحداث الحقيقية المسموح لك بعرضها، ولا نستخدم بيانات تجريبية.</p></div>}</section>
          </div>
        </>:<>
          <header className="stitchAdminSectionHead"><span><current.icon aria-hidden="true"/></span><div><small>مساحة عمل وظيفية</small><h2>{current.label}</h2><p>{current.description}</p></div></header>
          <div className="stitchAdminModule">{children}</div>
        </>}
      </div>
    </div>
  </section>;
}
