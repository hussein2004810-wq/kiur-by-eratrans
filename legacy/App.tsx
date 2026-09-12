import { useEffect, useMemo, useState } from 'react';
import {
  Activity, BarChart3, Bell, BookOpen, CheckCircle2, ChevronLeft, ClipboardList,
  Clock3, FileQuestion, HeartPulse, History, LayoutDashboard, Menu, Plus,
  Search, Settings2, ShieldCheck, Sparkles, Star, Trash2, Users, X
} from 'lucide-react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';

type Question={text:string;options:string[];correct:number};
const questions:Question[]=[
  {text:'أي تصنيف من تصنيفات ASA يصف مريضًا لديه مرض جهازي شديد يحدّ من نشاطه ولكنه لا يشكل تهديدًا دائمًا للحياة؟',options:['ASA I','ASA II','ASA III','ASA IV'],correct:2},
  {text:'ما الإجراء الأكثر أهمية ضمن التقييم الأولي لمجرى الهواء قبل التخدير العام؟',options:['قياس ضغط الدم فقط','تقييم فتحة الفم وحركة الرقبة','قياس سكر الدم','تحديد فصيلة الدم'],correct:1},
  {text:'أي مما يأتي يجب توثيقه بوضوح قبل بدء التخدير؟',options:['الموافقة المستنيرة وخطة التخدير','اسم الممرض فقط','موعد الخروج المتوقع فقط','نوع الغرفة'],correct:0}
];
const testCards=[
  ['التخدير العام','تقييم المريض قبل العملية','أساسيات التاريخ المرضي، الفحص السريري وتصنيف ASA.','25 دقيقة','20 سؤالًا'],
  ['المجرى الهوائي','إدارة مجرى الهواء الصعب','التقييم المسبق وخوارزميات التنبيب الآمن.','30 دقيقة','25 سؤالًا'],
  ['المراقبة','المراقبة أثناء التخدير','قراءة المؤشرات الحيوية والتعامل مع التغيرات الحرجة.','20 دقيقة','15 سؤالًا'],
  ['علم الأدوية','أدوية الاستحثاث الوريدي','الخصائص الدوائية والاستطبابات والآثار الجانبية.','20 دقيقة','18 سؤالًا'],
  ['الفسلجة','فسيولوجيا الجهاز التنفسي','التهوية والتروية وتبادل الغازات أثناء التخدير.','30 دقيقة','25 سؤالًا'],
  ['الطوارئ','فرط الحرارة الخبيث','التشخيص المبكر وخطوات التدبير الإسعافي.','15 دقيقة','12 سؤالًا']
];

function Stat({icon,value,label,tone='mint'}:{icon:React.ReactNode;value:string;label:string;tone?:string}){
  return <article className="stat"><span className={'statIcon '+tone}>{icon}</span><div><b>{value}</b><small>{label}</small></div></article>
}
function PageTitle({title,subtitle}:{title:string;subtitle:string}){
  return <div className="pageTitle"><div><h1>{title}</h1><p>{subtitle}</p></div><span className="dateChip">الأربعاء، 26 أغسطس 2026</span></div>
}
function Dashboard({startExam}:{startExam:()=>void}){
  const go=useNavigate();
  return <><PageTitle title="أهلًا محمد، مستعد للمراجعة؟" subtitle="تابع تقدمك وابدأ اختبارك القادم بثقة."/>
    <section className="hero"><div className="heroCopy"><span className="eyebrow"><Sparkles size={13}/> اختبار مقترح لك</span><h2>اختبار التخدير العام — المحاضرة الثالثة</h2><p>اختبر معرفتك بمبادئ تقييم المريض قبل العملية والعوامل المؤثرة في اختيار خطة التخدير.</p><button className="heroButton" onClick={startExam}>ابدأ الاختبار الآن <ChevronLeft size={17}/></button></div><div className="heroArt"><HeartPulse/></div></section>
    <div className="stats"><Stat icon={<CheckCircle2/>} value="24" label="اختبارًا مكتملًا"/><Stat icon={<Star/>} value="82%" label="متوسط الدرجات" tone="amber"/><Stat icon={<FileQuestion/>} value="148" label="إجابة صحيحة" tone="blue"/><Stat icon={<Clock3/>} value="6.5" label="ساعات مراجعة" tone="coral"/></div>
    <div className="contentGrid"><section className="panel"><div className="panelHead"><h3>اختبارات موصى بها</h3><button onClick={()=>go('/tests')}>عرض الكل</button></div><div className="examList">
      {[['مبادئ التخدير والاستعداد قبل العملية','التخدير العام • 20 سؤالًا • 25 دقيقة'],['أدوية الجهاز العصبي الذاتي','علم الأدوية • 15 سؤالًا • 20 دقيقة'],['فسيولوجيا الجهاز التنفسي','الفسلجة • 25 سؤالًا • 30 دقيقة']].map((x,i)=><article className="exam" key={x[0]}><span className={'examMark m'+i}>{i===0?<HeartPulse/>:i===1?<Activity/>:<BarChart3/>}</span><div><h4>{x[0]}</h4><p>{x[1]}</p></div><button className="outline" onClick={startExam}>ابدأ الآن</button></article>)}
    </div></section><aside className="panel progressPanel"><div className="panelHead"><h3>مستوى التقدم</h3><button onClick={()=>go('/history')}>التفاصيل</button></div><div className="donut"><b>82<small>%</small></b></div>{[['التخدير العام',88,'green'],['علم الأدوية',76,'gold'],['الفسلجة',81,'blue']].map(x=><div className="progressRow" key={String(x[0])}><div><span>{x[0]}</span><span>{x[1]}%</span></div><div className="bar"><i className={String(x[2])} style={{width:x[1]+'%'}}/></div></div>)}</aside></div>
  </>
}
function Tests({startExam}:{startExam:()=>void}){
  return <><PageTitle title="الاختبارات المتاحة" subtitle="اختر القسم والمرحلة والمادة للوصول إلى محاضرتك."/><div className="filters"><select><option>قسم التخدير</option><option>الطب العام</option></select><select><option>المرحلة الرابعة</option><option>المرحلة الثالثة</option></select><select><option>التخدير العام</option><option>علم الأدوية</option></select><select><option>كل المحاضرات</option><option>المحاضرة الثالثة</option></select></div><div className="cards">{testCards.map(x=><article className="testCard" key={x[1]}><span className="tag">{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p><div className="meta"><span><Clock3/> {x[3]}</span><span><ClipboardList/> {x[4]}</span></div><button className="solid full" onClick={startExam}>بدء الاختبار</button></article>)}</div></>
}
function HistoryPage(){
  return <><PageTitle title="سجل النتائج" subtitle="ملخص محاولاتك وتطور متوسطك الأكاديمي."/><div className="stats"><Stat icon={<BarChart3/>} value="+6%" label="تحسن هذا الشهر"/><Stat icon={<CheckCircle2/>} value="21/24" label="اختبارات ناجحة" tone="amber"/><Stat icon={<Star/>} value="96%" label="أفضل نتيجة" tone="blue"/><Stat icon={<Clock3/>} value="18 د" label="متوسط زمن الحل" tone="coral"/></div><section className="panel tableWrap"><table><thead><tr><th>الاختبار</th><th>المادة</th><th>التاريخ</th><th>النتيجة</th><th>الحالة</th></tr></thead><tbody><tr><td>أدوية الاستحثاث الوريدي</td><td>علم الأدوية</td><td>24 أغسطس</td><td className="good">92%</td><td><span className="success">ناجح</span></td></tr><tr><td>تقييم المريض قبل العملية</td><td>التخدير العام</td><td>19 أغسطس</td><td className="good">85%</td><td><span className="success">ناجح</span></td></tr><tr><td>فسيولوجيا التنفس</td><td>الفسلجة</td><td>12 أغسطس</td><td className="low">58%</td><td><span className="retry">إعادة مطلوبة</span></td></tr></tbody></table></section></>
}
function Admin({notify}:{notify:(x:string)=>void}){
 const [rows,setRows]=useState([['تقييم المريض قبل العملية','التخدير / رابعة','منشور','سارة • اليوم'],['إدارة مجرى الهواء','التخدير / رابعة','منشور','أحمد • أمس'],['التخدير الناحي','التخدير / خامسة','مسودة','سارة • 21 أغسطس']]);
 const remove=(i:number)=>{if(confirm('حذف هذا الاختبار؟ سيُسجل الإجراء في سجل التدقيق.')){setRows(r=>r.filter((_,n)=>n!==i));notify('تم حذف الاختبار وتسجيل العملية')}};
 return <><PageTitle title="لوحة المشرف" subtitle="إدارة المحتوى ومراجعة النشاط وسجل التغييرات."/><div className="stats"><Stat icon={<ClipboardList/>} value="48" label="اختبارًا منشورًا"/><Stat icon={<Users/>} value="1,284" label="طالبًا نشطًا" tone="amber"/><Stat icon={<CheckCircle2/>} value="3,619" label="محاولة هذا الشهر" tone="blue"/><Stat icon={<BarChart3/>} value="78%" label="متوسط النجاح" tone="coral"/></div><div className="contentGrid"><section className="panel tableWrap"><div className="adminHead"><div><h3>إدارة الاختبارات</h3><small>آخر تحديث قبل 12 دقيقة</small></div><button className="solid" onClick={()=>notify('تم فتح نموذج اختبار جديد — نموذج تجريبي')}><Plus/> اختبار جديد</button></div><table><thead><tr><th>العنوان</th><th>المسار</th><th>الحالة</th><th>آخر تعديل</th><th/></tr></thead><tbody>{rows.map((r,i)=><tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td><span className={r[2]==='منشور'?'success':'draft'}>{r[2]}</span></td><td>{r[3]}</td><td className="actions"><button onClick={()=>notify('وضع التحرير جاهز')}>تعديل</button><button className="trash" onClick={()=>remove(i)}><Trash2/></button></td></tr>)}</tbody></table></section><aside className="panel"><div className="panelHead"><h3>سجل التدقيق</h3><button>عرض الكل</button></div>{[['تعديل اختبار «تقييم المريض»','سارة محمود • اليوم 10:42'],['نشر اختبار «إدارة مجرى الهواء»','أحمد كريم • أمس 16:08'],['إضافة 12 سؤالًا جديدًا','سارة محمود • 24 أغسطس 09:15']].map(x=><div className="audit" key={x[0]}><b>{x[0]}</b><small>{x[1]}</small></div>)}</aside></div></>
}
function ExamModal({open,onClose,onFinish}:{open:boolean;onClose:()=>void;onFinish:(n:number)=>void}){
 const [current,setCurrent]=useState(0);const [answers,setAnswers]=useState<number[]>([]);const [seconds,setSeconds]=useState(1499);const [done,setDone]=useState(false);
 useEffect(()=>{if(open){setCurrent(0);setAnswers([]);setSeconds(1499);setDone(false)}},[open]);
 useEffect(()=>{if(!open||done)return;const id=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearInterval(id)},[open,done]);
 const score=useMemo(()=>Math.round(questions.filter((q,i)=>answers[i]===q.correct).length/questions.length*100),[answers]);
 if(!open)return null;const q=questions[current];const finish=()=>{setDone(true);onFinish(score)};
 return <div className="modal" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modalCard"><header><h3>تقييم المريض قبل العملية</h3><span><Clock3/>{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</span><button onClick={onClose}><X/></button></header>{done?<div className="result"><span><CheckCircle2/></span><h2>أتممت الاختبار بنجاح</h2><strong>{score}%</strong><p>تم حفظ نتيجتك وإضافتها إلى سجل المحاولات.</p><button className="solid" onClick={onClose}>العودة إلى المنصة</button></div>:<div className="modalBody"><div className="questionProgress"><span>السؤال {current+1} من {questions.length}</span><div className="bar"><i style={{width:(current+1)/questions.length*100+'%'}}/></div></div><h2>{q.text}</h2><div className="options">{q.options.map((o,i)=><button key={o} className={answers[current]===i?'selected':''} onClick={()=>setAnswers(a=>{const n=[...a];n[current]=i;return n})}><i/>{o}</button>)}</div><footer><button className="secondary" onClick={onClose}>حفظ وخروج</button><button className="secondary" disabled={!current} onClick={()=>setCurrent(c=>c-1)}>السابق</button><button className="solid" disabled={answers[current]===undefined} onClick={()=>current===questions.length-1?finish():setCurrent(c=>c+1)}>{current===questions.length-1?'إنهاء وتسليم':'التالي'}</button></footer></div>}</div></div>
}
const links=[['/',LayoutDashboard,'نظرة عامة'],['/tests',ClipboardList,'الاختبارات المتاحة'],['/history',History,'سجل النتائج'],['/admin',Settings2,'لوحة المشرف']] as const;
export default function App(){
 const [menu,setMenu]=useState(false);const [exam,setExam]=useState(false);const [toast,setToast]=useState('');const notify=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),2600)};
 return <div className="app"><aside className={menu?'sidebar open':'sidebar'}><div className="brand"><span><HeartPulse/></span><div>MedExam<small>MEDICAL LEARNING</small></div></div><p className="navLabel">القائمة الرئيسية</p><nav>{links.slice(0,3).map(([to,Ico,label])=><NavLink key={to} to={to} onClick={()=>setMenu(false)}><Ico/>{label}{to==='/tests'&&<b>8</b>}</NavLink>)}</nav><p className="navLabel adminLabel">الإدارة</p><nav>{links.slice(3).map(([to,Ico,label])=><NavLink key={to} to={to} onClick={()=>setMenu(false)}><Ico/>{label}</NavLink>)}</nav><div className="miniProfile"><span>م ع</span><div><b>محمد علي</b><small>طالب • المرحلة الرابعة</small></div></div></aside><main><header className="topbar"><button className="menuBtn" onClick={()=>setMenu(true)}><Menu/></button><div className="search"><Search/><input placeholder="ابحث عن اختبار أو محاضرة..." aria-label="بحث"/></div><button className="bell"><Bell/><i/></button><span className="avatar">م ع</span></header><Routes><Route path="/" element={<Dashboard startExam={()=>setExam(true)}/>}/><Route path="/tests" element={<Tests startExam={()=>setExam(true)}/>}/><Route path="/history" element={<HistoryPage/>}/><Route path="/admin" element={<Admin notify={notify}/>}/></Routes></main><div className="mobileNav">{links.map(([to,Ico,label])=><NavLink key={to} to={to}><Ico/><span>{label.split(' ')[0]}</span></NavLink>)}</div>{menu&&<button className="scrim" aria-label="إغلاق القائمة" onClick={()=>setMenu(false)}/>}<ExamModal open={exam} onClose={()=>setExam(false)} onFinish={()=>notify('تم حفظ النتيجة في سجل المحاولات')}/><div className={toast?'toast show':'toast'}>{toast}</div></div>
}
