import {useEffect,useMemo,useState} from 'react';
import {KeyRound,Plus,ShieldCheck,UserCog,Users} from 'lucide-react';
import './accounts.css';
import './account-filters.css';

type Role='owner'|'admin'|'teacher'|'student';
type Status='pending'|'active'|'suspended';
type StaffTitle='department_head'|'department_coordinator'|'university_doctor'|'university_professor';
type Item={id:string;name:string;universityId?:string;collegeId?:string;departmentId?:string;phaseId?:string;subjectId?:string};
type Catalog={universities:Item[];colleges:Item[];departments:Item[];phases:Item[];sections:Item[];subjects:Item[];lectures:Item[]};
type Grant={scopeType:string;scopeId:string;permissions:string[]};
type Account={id:string;name:string;email:string;role:Role;staffTitle?:StaffTitle|null;status:Status;authProvider:string;universityName?:string;collegeName?:string;departmentName?:string;phaseName?:string;sectionName?:string;grants?:Grant[]};
type FormState={name:string;email:string;role:'teacher'|'admin';staffTitle:StaffTitle;scopeType:string;scopeId:string;permissions:string[]};
type ExistingCandidate={id:string;name:string;email:string;role:Role;status:Status;authProvider:string;canLink:boolean};
class ApiError extends Error{code:string;details?:any;constructor(message:string,code='REQUEST_FAILED',details?:any){super(message);this.code=code;this.details=details}}

const staffTitles:Record<StaffTitle,string>={department_head:'رئيس قسم',department_coordinator:'مقرر قسم',university_doctor:'دكتور جامعي',university_professor:'أستاذ جامعي'};
const permissions=[['manage_catalog','إدارة الهيكل الأكاديمي'],['manage_tests','إدارة الاختبارات'],['manage_students','إدارة الطلاب'],['manage_teachers','إنشاء وإدارة الكادر'],['view_reports','عرض التقارير'],['import_questions','استيراد الأسئلة'],['use_media','اختيار صور المكتبة'],['manage_glimpses','إدارة اللمحات السريرية'],['manage_library','رفع وإدارة المكتبة'],['view_library_log','عرض سجل المكتبة'],['view_student_log','عرض سجل الطلاب'],['view_audit_log','عرض سجل التدقيق'],['view_account_log','عرض سجل الحسابات'],['request_student_ban','طلب حظر الطلاب'],['review_student_ban','مراجعة طلبات الحظر'],['view_student_ban_log','عرض سجل الحظر'],['export_results','تصدير النتائج']] as const;
const scopeLabels:Record<string,string>={platform:'المنصة كاملة',university:'جامعة',college:'كلية',department:'قسم',phase:'مرحلة',section:'شعبة',subject:'مادة',lecture:'محاضرة'};
const scopeCollections:Record<string,keyof Catalog>={university:'universities',college:'colleges',department:'departments',phase:'phases',section:'sections',subject:'subjects',lecture:'lectures'};

async function request<T>(path:string,options:RequestInit={}):Promise<T>{const response=await fetch(path,{...options,credentials:'include',headers:{'content-type':'application/json',...(options.headers||{})}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new ApiError(data?.error?.message||'تعذر إكمال العملية',data?.error?.code,data?.error?.details);return data}

export default function AccountManager({catalog,currentRole,notify}:{catalog:Catalog;currentRole:Role;notify:(message:string)=>void}){
  const initialForm=():FormState=>({name:'',email:'',role:'teacher',staffTitle:'university_doctor',scopeType:'university',scopeId:catalog.universities[0]?.id||'',permissions:['manage_tests','view_reports']});
  const [accounts,setAccounts]=useState<Account[]>([]);
  const [query,setQuery]=useState('');
  const [roleFilter,setRoleFilter]=useState<'all'|'student'|'teacher'|'admin'>('all');
  const [busy,setBusy]=useState(false);
  const [editing,setEditing]=useState<Account|null>(null);
  const [existing,setExisting]=useState<ExistingCandidate|null>(null);
  const [form,setForm]=useState<FormState>(initialForm);
  const scopeItems=useMemo(()=>form.scopeType==='platform'?[{id:'platform',name:'المنصة كاملة'}]:catalog[scopeCollections[form.scopeType]]||[],[catalog,form.scopeType]);
  const load=async()=>{const data=await request<{data:Account[]}>('/api/admin/users?limit=200&q='+encodeURIComponent(query));setAccounts(data.data)};
  useEffect(()=>{const timer=setTimeout(()=>void load().catch(error=>notify(error.message)),200);return()=>clearTimeout(timer)},[query]);
  useEffect(()=>{if(!scopeItems.some(item=>item.id===form.scopeId))setForm(value=>({...value,scopeId:scopeItems[0]?.id||''}))},[form.scopeType,scopeItems]);
  const toggle=(permission:string)=>setForm(value=>({...value,permissions:value.permissions.includes(permission)?value.permissions.filter(item=>item!==permission):[...value.permissions,permission]}));
  const chooseAccountType=(value:string)=>setForm(current=>value==='admin'?{...current,role:'admin'}:{...current,role:'teacher',staffTitle:value as StaffTitle});
  const reset=()=>{setEditing(null);setExisting(null);setForm(initialForm())};
  const saveAccount=async(linkExisting=false)=>{const grants=[{scopeType:form.scopeType,scopeId:form.scopeType==='platform'?'platform':form.scopeId,permissions:form.permissions}];const payload={...form,staffTitle:form.role==='teacher'?form.staffTitle:null,grants,...(linkExisting&&existing?{linkExisting:true,existingUserId:existing.id}: {})};if(editing)await request(`/api/admin/users/${editing.id}/grants`,{method:'PUT',body:JSON.stringify(payload)});else await request('/api/admin/users',{method:'POST',body:JSON.stringify(payload)})};
  const submit=async(event:React.FormEvent)=>{event.preventDefault();setExisting(null);setBusy(true);try{await saveAccount();notify(editing?'تم تحديث صفة الكادر والصلاحيات':'تم إنشاء الحساب وإرسال دعوة التفعيل الآمنة');reset();await load()}catch(error){const issue=error as ApiError;if(issue.code==='ACCOUNT_EXISTS'&&issue.details?.account)setExisting({...issue.details.account,canLink:Boolean(issue.details.canLink)});notify(issue.message)}finally{setBusy(false)}};
  const linkExisting=async()=>{if(!existing?.canLink)return;setBusy(true);try{await saveAccount(true);notify('تم ربط الحساب الموجود وترقيته دون إنشاء نسخة مكررة');reset();await load()}catch(error){notify((error as Error).message)}finally{setBusy(false)}};
  const edit=(account:Account)=>{const grant=account.grants?.[0];setEditing(account);setForm({name:account.name,email:account.email,role:account.role==='admin'?'admin':'teacher',staffTitle:account.staffTitle||'university_doctor',scopeType:grant?.scopeType||'university',scopeId:grant?.scopeId||catalog.universities[0]?.id||'',permissions:grant?.permissions||['manage_tests','view_reports']})};
  const status=async(account:Account,next:Status)=>{try{await request(`/api/admin/users/${account.id}`,{method:'PATCH',body:JSON.stringify({status:next})});notify(next==='active'?'تم تفعيل الحساب':'تم إيقاف الحساب');await load()}catch(error){notify((error as Error).message)}};
  const accountLabel=(account:Account)=>account.role==='owner'?'مالك':account.role==='admin'?'مشرف':account.role==='teacher'?staffTitles[account.staffTitle||'university_doctor']:'طالب';
  const visibleAccounts=roleFilter==='all'?accounts:accounts.filter(account=>account.role===roleFilter);const roleFilterLabel={all:'كل الحسابات',student:'الطلاب',teacher:'أعضاء الكادر',admin:'المشرفون'}[roleFilter];
  const chooseRoleFilter=(role:'student'|'teacher'|'admin')=>setRoleFilter(current=>current===role?'all':role);

  return <section className="accountsManager">
    <div className="accountStats"><button type="button" aria-pressed={roleFilter==='student'} className={roleFilter==='student'?'active':''} onClick={()=>chooseRoleFilter('student')}><Users/><b>{accounts.filter(item=>item.role==='student').length}</b><small>طلاب</small></button><button type="button" aria-pressed={roleFilter==='teacher'} className={roleFilter==='teacher'?'active':''} onClick={()=>chooseRoleFilter('teacher')}><UserCog/><b>{accounts.filter(item=>item.role==='teacher').length}</b><small>أعضاء الكادر</small></button><button type="button" aria-pressed={roleFilter==='admin'} className={roleFilter==='admin'?'active':''} onClick={()=>chooseRoleFilter('admin')}><ShieldCheck/><b>{accounts.filter(item=>item.role==='admin').length}</b><small>مشرفون ضمن نطاقك</small></button></div>
    <div className="accountGrid">
      <form className="panel accountForm" onSubmit={event=>void submit(event)}>
        <div className="accountTitle"><span><KeyRound/></span><div><h3>{editing?'تعديل الصفة والصلاحيات':'إنشاء حساب كادر'}</h3><p>المسمى الوظيفي لا يمنح صلاحيات تلقائيًا؛ تحدد الصلاحيات أدناه.</p></div></div>
        {!editing&&<><input required minLength={2} placeholder="اسم عضو الكادر أو المشرف" value={form.name} onChange={event=>setForm({...form,name:event.target.value})}/><input required type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={event=>{setExisting(null);setForm({...form,email:event.target.value})}}/><p className="accountInviteNote">سيصل إلى هذا البريد رابط تفعيل صالح لمدة 24 ساعة ليعيّن صاحب الحساب كلمة مروره بنفسه.</p></>}
        <select aria-label="صفة حساب الكادر" value={form.role==='admin'?'admin':form.staffTitle} onChange={event=>chooseAccountType(event.target.value)}>
          {Object.entries(staffTitles).map(([value,label])=><option key={value} value={value}>{label}</option>)}
          {currentRole==='owner'&&<option value="admin">مشرف</option>}
        </select>
        <div className="scopeRow"><select value={form.scopeType} onChange={event=>setForm({...form,scopeType:event.target.value})}>{Object.entries(scopeLabels).filter(([key])=>currentRole==='owner'||key!=='platform').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><select value={form.scopeId} onChange={event=>setForm({...form,scopeId:event.target.value})}>{scopeItems.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <div className="permissionGrid">{permissions.map(([id,label])=><label key={id}><input type="checkbox" checked={form.permissions.includes(id)} onChange={()=>toggle(id)}/><span>{label}</span></label>)}</div>
        {existing&&<div className="existingAccount"><b>الحساب موجود بالفعل</b><p>{existing.name} • {existing.email}</p><small>سيبقى تسجيل دخوله الحالي كما هو، وتُضاف إليه الصفة والصلاحيات المحددة أعلاه.</small>{existing.canLink?<button type="button" disabled={busy} onClick={()=>void linkExisting()}>تأكيد المالك: ربط وترقية الحساب</button>:<em>أرسل الطلب إلى مالك المنصة لإتمام الربط والترقية.</em>}</div>}
        <div className="accountActions">{(editing||existing)&&<button type="button" onClick={reset}>إلغاء</button>}<button className="solid" disabled={busy||!form.permissions.length||!form.scopeId}><Plus/>{busy?'جارٍ الحفظ...':editing?'حفظ الصفة والصلاحيات':'إنشاء الحساب'}</button></div>
      </form>
      <section className="panel accountList"><header><div><h3>{roleFilterLabel}</h3><p>{roleFilter==='all'?'فعّل الطلاب الجدد وأدر الكادر والمشرفين.':`عرض معلومات ${roleFilterLabel} ضمن نطاقك فقط.`}</p></div>{roleFilter!=='all'&&<button className="clearRoleFilter" onClick={()=>setRoleFilter('all')}>عرض الكل</button>}<input placeholder="بحث بالاسم أو البريد" value={query} onChange={event=>setQuery(event.target.value)}/></header>{visibleAccounts.map(account=><article key={account.id}><span className={'roleIcon '+account.role}>{account.name.slice(0,2)}</span><div><b>{account.name}</b><small>{account.email}</small><em>{accountLabel(account)} • {account.universityName||account.departmentName||'دون نطاق'} • {account.status==='pending'?'بانتظار الموافقة':account.status==='active'?'فعال':'موقوف'}</em></div><div className="rowActions">{['teacher','admin'].includes(account.role)&&<button onClick={()=>edit(account)}>الصفة والصلاحيات</button>}{account.status!=='active'?<button className="activate" onClick={()=>void status(account,'active')}>تفعيل</button>:account.role!=='owner'&&<button className="suspend" onClick={()=>void status(account,'suspended')}>إيقاف</button>}</div></article>)}{!visibleAccounts.length&&<div className="catalogEmpty">لا توجد حسابات مطابقة ضمن هذه الفئة.</div>}</section>
    </div>
  </section>;
}
