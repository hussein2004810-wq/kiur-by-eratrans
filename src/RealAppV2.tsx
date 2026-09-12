import ExamDateTime from './ExamDateTime';
import {lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {Activity,ArrowLeftRight,BarChart3,Bell,BookOpen,Brain,CheckCircle2,ChevronLeft,ClipboardList,Clock3,Contrast,Copy,FileQuestion,GraduationCap,HeartPulse,History,LayoutDashboard,Link2,LogOut,Menu,Minus,Plus,Save,Search,Settings2,ShieldCheck,SlidersHorizontal,Trash2,Trophy,Type,UserRound,Users,X} from 'lucide-react';
import './real.css';
import './admin-shell.css';
import './mobile-records.css';
import './accessibility.css';
import './hierarchy.css';
import './stitch/stitch.css';
import {CertificateButton,VerifyScreen} from './Certificate';
import type {StudentFilters,StudentRow} from './StudentManager';
import ShareButton from './ShareButton';
import ClinicalGlimpsesManager,{ClinicalGlimpsesLibrary,ClinicalGlimpsesSpotlight} from './ClinicalGlimpses';
import './share.css';
import AuthScreen from './AuthScreen';
import StudyShelf,{type LearningHub} from './StudyShelf';
import {matchesStudySearch} from './study-shelf-model';
import StudentBanManager,{BannedStudentScreen} from './StudentBanManager';
import AcademicChangeManager,{AcademicChangeStudent} from './AcademicChangeManager';
import AccountProfile from './AccountProfile';
import {hydrateAccountTheme,ThemeToggle} from './theme-preference';
import {CommandPalette} from './CommandPalette';

const GuestPortal=lazy(()=>import('./GuestPortal'));

const ImportManager=lazy(()=>import('./ImportManager'));
const MediaManager=lazy(()=>import('./MediaManager'));
const ExportManager=lazy(()=>import('./ExportManagerV2'));
const CatalogManager=lazy(()=>import('./CatalogManagerV2'));
const AccountManager=lazy(()=>import('./AccountManager'));
const LogsManager=lazy(()=>import('./LogsManager'));
const StudentManager=lazy(()=>import('./StudentManager'));
const StudentProfile=lazy(()=>import('./StudentProfile'));
const StudentPoints=lazy(()=>import('./StudentPoints'));
const GamificationManager=lazy(()=>import('./GamificationManager'));
const SmartReviewHub=lazy(()=>import('./SmartReviewHub'));
const StitchApp=lazy(()=>import('./stitch/StitchApp'));
import {StitchProvider,type StitchContextValue} from './stitch/StitchContext';

type User={id:string;email:string;name:string;role:'student'|'teacher'|'admin'|'owner';permissions?:string[];staffTitle?:'department_head'|'department_coordinator'|'university_doctor'|'university_professor'|null;authProvider?:'chatgpt'|'password'|'hybrid';universityId?:string|null;collegeId?:string|null;departmentId?:string|null;phaseId?:string|null;sectionId?:string|null;universityName?:string|null;collegeName?:string|null;departmentName?:string|null;phaseName?:string|null;sectionName?:string|null;banStatus?:'none'|'precaution'|'temporary'|'permanent';restriction?:{requestId?:string;banId?:string;requestNumber?:string;banType?:string;reason?:string;endsAt?:string|null}|null};
type University={id:string;name:string;sortOrder:number};
type College={id:string;universityId:string;name:string;sortOrder:number};
type Department={id:string;collegeId:string;name:string;sortOrder:number};
type Phase={id:string;departmentId:string;name:string;sortOrder:number};
type Section={id:string;phaseId:string;name:string;sortOrder:number};
type Subject={id:string;phaseId:string;name:string;sortOrder:number};
type Lecture={id:string;subjectId:string;name:string;sortOrder:number};
export type Catalog={universities:University[];colleges:College[];departments:Department[];phases:Phase[];sections:Section[];subjects:Subject[];lectures:Lecture[]};
export type Test={examMode?:string;availableFrom?:string|null;availableUntil?:string|null;maxAttempts?:number;difficultyLevel?:number;id:string;title:string;subject:string;lecture:string;durationMinutes:number;passPercentage:number;questionCount:number;shuffleQuestions?:boolean|number;shuffleOptions?:boolean|number;status?:string;updatedAt?:string;universityId?:string;collegeId?:string;departmentId?:string;phaseId?:string;sectionId?:string;subjectId?:string;lectureId?:string;universityName?:string;collegeName?:string;departmentName?:string;phaseName?:string;sectionName?:string;subjectName?:string;lectureName?:string};
type Question={id?:string;text:string;options:string[];correctOption?:number;explanation?:string;position?:number;questionType?:'mcq'|'true_false'|'fill_blank'|'clinical_case';acceptedAnswers?:string[];imageId?:string|null;imageUrl?:string|null;points?:number};
type TestDetail=Test&{questions:Question[];savedAnswers?:Record<string,number|string>;remainingSeconds?:number};
type HistoryItem={testId?:string;id:string;title:string;subject:string;score:number;maxScore:number;percentage:number;finishedAt:string;passed:number};
type ReviewQuestion={id:string;text:string;options:string[];selectedOption:number|null;answerText?:string|null;correctOption:number;acceptedAnswers?:string[];questionType?:string;explanation?:string|null;imageUrl?:string|null;isCorrect:boolean};
type AttemptReview={score:number;maxScore:number;percentage:number;passed:boolean;questions:ReviewQuestion[]};
type DirectTarget={kind:'test'|'lecture';id:string}|null;
type UserNotification={id:string;type:string;title:string;message:string;link?:string|null;readAt?:string|null;createdAt:string};
type FormTest={id?:string;title:string;universityId:string;collegeId:string;departmentId:string;phaseId:string;sectionId:string;subjectId:string;lectureId:string;durationMinutes:number;passPercentage:number;shuffleQuestions:boolean;shuffleOptions:boolean;examMode:'practice'|'formal';availableFrom:string;availableUntil:string;maxAttempts:number;difficultyLevel:number;certificateEnabled:boolean;status:string;questions:(Required<Pick<Question,'text'|'options'|'correctOption'>>&Partial<Question>)[]};

async function api<T>(path:string,options:RequestInit={}):Promise<T>{
  const response=await fetch(path,{...options,credentials:'include',headers:{'content-type':'application/json',...(options.headers||{})}});
  if(response.status===204)return undefined as T;
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data?.error?.message||'تعذر إكمال العملية');
  return data;
}
const emptyQuestion=()=>({text:'',options:['','','',''],correctOption:0,explanation:'',questionType:'mcq' as const,acceptedAnswers:[],imageId:null,points:1});
const firstPath=(catalog:Catalog)=>{const university=catalog.universities[0];const college=catalog.colleges.find(item=>item.universityId===university?.id);const department=catalog.departments.find(item=>item.collegeId===college?.id);const phase=catalog.phases.find(item=>item.departmentId===department?.id);const section=catalog.sections.find(item=>item.phaseId===phase?.id);const subject=catalog.subjects.find(item=>item.phaseId===phase?.id);const lecture=catalog.lectures.find(item=>item.subjectId===subject?.id);return {universityId:university?.id||'',collegeId:college?.id||'',departmentId:department?.id||'',phaseId:phase?.id||'',sectionId:section?.id||'',subjectId:subject?.id||'',lectureId:lecture?.id||''}};
const emptyForm=(catalog:Catalog):FormTest=>({...firstPath(catalog),title:'',durationMinutes:20,passPercentage:60,shuffleQuestions:false,shuffleOptions:false,examMode:'practice',availableFrom:'',availableUntil:'',maxAttempts:1,difficultyLevel:2,certificateEnabled:true,status:'published',questions:[emptyQuestion()]});
function parseDirectTarget():DirectTarget{const match=window.location.pathname.match(/^\/(test|lecture)\/([^/]+)$/);if(!match)return null;try{return {kind:match[1] as 'test'|'lecture',id:decodeURIComponent(match[2])}}catch{return null}}
function motionPreference(){try{return localStorage.getItem('kiur-motion')!=='off'}catch{return true}}
function saveMotionPreference(enabled:boolean){try{localStorage.setItem('kiur-motion',enabled?'on':'off')}catch{}}
function savedVisualPreference(key:string,fallback:string){try{return localStorage.getItem(key)||fallback}catch{return fallback}}
async function logoutFromProvider(_provider?:User['authProvider']){await api('/api/auth/logout',{method:'POST',body:'{}'});window.location.reload()}

function MedicalVitals({compact=false}:{compact?:boolean}){return <div className={'medicalVitals '+(compact?'compact':'')} aria-hidden="true"><svg viewBox="0 0 320 74" preserveAspectRatio="none"><path className="ecgGhost" d="M0 39h320"/><path className="ecgLine" pathLength="1" d="M0 39h55l12-1 8-13 10 35 12-51 13 45 11-16h36l10-1 8-10 10 25 13-37 12 30 10-8h80"/></svg><span><i/>SpO₂ <b>98</b></span></div>}
function Loading(){return <div className="loadingPage"><ThemeToggle compact/><HeartPulse/><MedicalVitals/><p>جارٍ تجهيز بيئة التعلم الطبية...</p></div>}
function SectionLoading(){return <section className="panel sectionLoading"><MedicalVitals compact/><p>جارٍ تحميل أدوات هذا القسم...</p></section>}
function Stat({icon,value,label,tone='mint'}:{icon:React.ReactNode;value:string|number;label:string;tone?:string}){return <article className="stat"><span className={'statIcon '+tone}>{icon}</span><div><b>{value}</b><small>{label}</small></div></article>}
function Title({title,subtitle}:{title:string;subtitle:string}){return <div className="pageTitle"><div><h1>{title}</h1><p>{subtitle}</p></div><span className="dateChip">{new Intl.DateTimeFormat('ar-IQ',{dateStyle:'long'}).format(new Date())}</span></div>}
export type MainView='home'|'tests'|'glimpses'|'history'|'points'|'profile'|'admin'|'study-plan'|'notes';
function AccessibilityDock(){const[open,setOpen]=useState(false);const[size,setSize]=useState(()=>savedVisualPreference('kiur-font-size','normal'));const[contrast,setContrast]=useState(()=>savedVisualPreference('kiur-contrast','normal')==='high');useEffect(()=>{document.documentElement.dataset.kiurFont=size;document.documentElement.dataset.kiurContrast=contrast?'high':'normal';try{localStorage.setItem('kiur-font-size',size);localStorage.setItem('kiur-contrast',contrast?'high':'normal')}catch{}},[size,contrast]);return <div className="accessibilityDock"><button type="button" aria-label="إعدادات سهولة الاستخدام" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><SlidersHorizontal/></button>{open&&<section aria-label="إعدادات سهولة الاستخدام"><header><b>سهولة الاستخدام</b><button type="button" onClick={()=>setOpen(false)} aria-label="إغلاق"><X/></button></header><label><span><Type/>حجم النص</span><select value={size} onChange={event=>setSize(event.target.value)}><option value="normal">اعتيادي</option><option value="large">كبير</option><option value="xlarge">كبير جدًا</option></select></label><button type="button" className={contrast?'active':''} aria-pressed={contrast} onClick={()=>setContrast(value=>!value)}><Contrast/>{contrast?'إيقاف التباين العالي':'تشغيل التباين العالي'}</button></section>}</div>}
function LiquidNavigation({items,active,onSelect}:{items:readonly (readonly [MainView,React.ComponentType<any>,string,number?])[];active:MainView;onSelect:(view:MainView)=>void}){
  return <><AccessibilityDock/><nav className="liquidNav" aria-label="التنقل الرئيسي" style={{'--liquid-count':items.length} as React.CSSProperties}>
    <div className="liquidNavTrack">
      {items.map(([id,Icon,label,count])=><button type="button" key={id} className={active===id?'active':''} aria-current={active===id?'page':undefined} onClick={()=>onSelect(id)}>
        <span className="liquidNavShine" aria-hidden="true"/>
        <span className="liquidNavIcon"><Icon aria-hidden="true"/>{typeof count==='number'&&<b>{count}</b>}</span><span>{label}</span>
      </button>)}
    </div>
  </nav></>
}

function ProfileSetup({user,catalog,onSaved,notify}:{user:User;catalog:Catalog;onSaved:(user:User)=>void;notify:(message:string)=>void}){
  const initial=firstPath(catalog);const [path,setPath]=useState({...initial,universityId:user.universityId||initial.universityId,collegeId:user.collegeId||initial.collegeId,departmentId:user.departmentId||initial.departmentId,phaseId:user.phaseId||initial.phaseId,sectionId:user.sectionId||initial.sectionId});
  const colleges=catalog.colleges.filter(item=>item.universityId===path.universityId);const departments=catalog.departments.filter(item=>item.collegeId===path.collegeId);const phases=catalog.phases.filter(item=>item.departmentId===path.departmentId);const sections=catalog.sections.filter(item=>item.phaseId===path.phaseId);
  const [busy,setBusy]=useState(false);const [feedback,setFeedback]=useState<{kind:'error'|'info';text:string;reference?:string}|null>(null);
  const choose=(field:'universityId'|'collegeId'|'departmentId'|'phaseId'|'sectionId',value:string)=>{const next={...path,[field]:value};if(field==='universityId'){const collegeId=catalog.colleges.find(item=>item.universityId===value)?.id||'';const departmentId=catalog.departments.find(item=>item.collegeId===collegeId)?.id||'';const phaseId=catalog.phases.find(item=>item.departmentId===departmentId)?.id||'';Object.assign(next,{collegeId,departmentId,phaseId,sectionId:''})}if(field==='collegeId'){const departmentId=catalog.departments.find(item=>item.collegeId===value)?.id||'';const phaseId=catalog.phases.find(item=>item.departmentId===departmentId)?.id||'';Object.assign(next,{departmentId,phaseId,sectionId:''})}if(field==='departmentId'){const phaseId=catalog.phases.find(item=>item.departmentId===value)?.id||'';Object.assign(next,{phaseId,sectionId:''})}if(field==='phaseId')next.sectionId='';setPath(next)};
  const save=async()=>{if(busy)return;const reference=crypto.randomUUID().slice(0,8).toUpperCase();setBusy(true);setFeedback({kind:'info',text:'جارٍ التحقق من المسار وحفظه…'});try{await api('/api/me/profile',{method:'PATCH',headers:{'x-client-request-id':reference},body:JSON.stringify(path)});const names={universityName:catalog.universities.find(item=>item.id===path.universityId)?.name,collegeName:catalog.colleges.find(item=>item.id===path.collegeId)?.name,departmentName:catalog.departments.find(item=>item.id===path.departmentId)?.name,phaseName:catalog.phases.find(item=>item.id===path.phaseId)?.name,sectionName:catalog.sections.find(item=>item.id===path.sectionId)?.name};setFeedback({kind:'info',text:'تم حفظ المسار بنجاح'});onSaved({...user,...path,...names});notify('تم حفظ مسارك الدراسي بنجاح')}catch(error){setFeedback({kind:'error',text:(error as Error).message,reference})}finally{setBusy(false)}};
  return <main className="setupPage"><ThemeToggle compact/><section className="setupCard"><span className="setupIcon"><GraduationCap/></span><small>خطوة واحدة قبل البدء</small><h1>مرحبًا {user.name}</h1><p>اختر جامعتك وكليتك وقسمك ومرحلتك وشعبتك لعرض المحتوى المناسب.</p><div className="setupFields"><label><span>الجامعة</span><select value={path.universityId} onChange={event=>choose('universityId',event.target.value)}>{catalog.universities.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>الكلية</span><select value={path.collegeId} onChange={event=>choose('collegeId',event.target.value)}>{colleges.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>القسم</span><select value={path.departmentId} onChange={event=>choose('departmentId',event.target.value)}>{departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>المرحلة</span><select value={path.phaseId} disabled={!phases.length} onChange={event=>choose('phaseId',event.target.value)}>{phases.length?phases.map(item=><option key={item.id} value={item.id}>{item.name}</option>):<option value="">لم يضف المشرف مراحل لهذا القسم</option>}</select>{!phases.length&&<em className="fieldHint error">لا توجد مرحلة مرتبطة بالقسم المختار. اختر قسمًا آخر أو تواصل مع المشرف.</em>}</label><label><span>الشعبة (اختياري)</span><select value={path.sectionId} disabled={!path.phaseId} onChange={event=>choose('sectionId',event.target.value)}><option value="">دون شعبة</option>{sections.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>{feedback&&<div className={'setupFeedback '+feedback.kind} role={feedback.kind==='error'?'alert':'status'}><span>{feedback.text}</span>{feedback.reference&&<small>رقم المتابعة: {feedback.reference}</small>}{feedback.kind==='error'&&<button type="button" disabled={busy} onClick={()=>void save()}>إعادة المحاولة</button>}</div>}<button className="solid setupSubmit" disabled={!path.universityId||!path.collegeId||!path.departmentId||!path.phaseId||busy} onClick={()=>void save()}>{busy?'جارٍ الحفظ...':'حفظ والمتابعة'} <ChevronLeft/></button><a href="#logout" onClick={event=>{event.preventDefault();void logoutFromProvider(user.authProvider).catch(()=>alert('تعذر تسجيل الخروج؛ حاول مرة أخرى'))}}>تسجيل الخروج</a></section></main>
}

function ExamRunner({test,attemptId,onClose,onDone,notify}:{test:TestDetail;attemptId:string;onClose:()=>void;onDone:()=>void;notify:(message:string)=>void}){
  const draftKey=`kiur-draft-attempt-${attemptId}`;
  const initialAnswers=useMemo(()=>{
    try{
      const local=localStorage.getItem(draftKey);
      if(local)return {...(test.savedAnswers||{}),...JSON.parse(local)};
    }catch{}
    return test.savedAnswers||{};
  },[attemptId,draftKey,test.savedAnswers]);

  const [current,setCurrent]=useState(0);
  const [answers,setAnswers]=useState<Record<string,number|string>>(initialAnswers);
  const [seconds,setSeconds]=useState(Math.max(0,Math.min(test.durationMinutes*60,Number(test.remainingSeconds??test.durationMinutes*60))));
  const [result,setResult]=useState<AttemptReview|null>(null);
  const [busy,setBusy]=useState(false);
  const [isOnline,setIsOnline]=useState(typeof navigator!=='undefined'?navigator.onLine:true);
  const dirtyRef=useRef<Set<string>>(new Set());
  const flushTimerRef=useRef<any>(null);

  useEffect(()=>{
    const handleOnline=()=>{setIsOnline(true);void flushDirty()};
    const handleOffline=()=>setIsOnline(false);
    window.addEventListener('online',handleOnline);
    window.addEventListener('offline',handleOffline);
    return()=>{window.removeEventListener('online',handleOnline);window.removeEventListener('offline',handleOffline)};
  },[]);

  useEffect(()=>{
    try{localStorage.setItem(draftKey,JSON.stringify(answers))}catch{}
  },[answers,draftKey]);

  const flushDirty=async()=>{
    if(!dirtyRef.current.size)return;
    const ids=[...dirtyRef.current];
    const payloadItems:any[]=[];
    for(const qId of ids){
      const val=answers[qId];
      if(val===undefined)continue;
      const q=test.questions.find(item=>item.id===qId);
      if(q?.questionType==='fill_blank'){
        payloadItems.push({questionId:qId,answerText:String(val)});
      }else{
        payloadItems.push({questionId:qId,selectedOption:Number(val)});
      }
    }
    if(!payloadItems.length){dirtyRef.current.clear();return}
    try{
      await api(`/api/attempts/${attemptId}/answers`,{method:'PATCH',body:JSON.stringify({answers:payloadItems})});
      ids.forEach(id=>dirtyRef.current.delete(id));
    }catch{/* تبقى الإجابات في التخزين المحلي الاحتياطي لحين عودة الاتصال */}
  };

  const scheduleFlush=()=>{
    if(flushTimerRef.current)clearTimeout(flushTimerRef.current);
    flushTimerRef.current=setTimeout(()=>{void flushDirty()},1500);
  };



  useEffect(()=>{
    if(result)return;
    const timer=setInterval(()=>setSeconds(value=>Math.max(0,value-1)),1000);
    return()=>clearInterval(timer);
  },[result]);

  useEffect(()=>{
    if(seconds===0&&!result)void submit();
  },[seconds]);

  const question=test.questions&&test.questions.length>0?test.questions[current]:undefined;

  const choose=(index:number)=>{
    if(!question)return;
    const qId=question.id||`q-${current}`;
    setAnswers(value=>({...value,[qId]:index}));
    dirtyRef.current.add(qId);
    scheduleFlush();
  };

  const fill=(value:string)=>{
    if(!question)return;
    const qId=question.id||`q-${current}`;
    setAnswers(currentAnswers=>({...currentAnswers,[qId]:value}));
    if(!value.trim())return;
    dirtyRef.current.add(qId);
    scheduleFlush();
  };

  useEffect(()=>{
    const handleKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'&&!busy){onClose();return}
      const tag=(event.target as HTMLElement)?.tagName?.toLowerCase();
      if(tag==='input'||tag==='textarea')return;
      if(question&&question.questionType!=='fill_blank'&&Array.isArray(question.options)){
        const num=parseInt(event.key,10);
        if(!isNaN(num)&&num>=1&&num<=question.options.length){
          event.preventDefault();
          choose(num-1);
        }
      }
    };
    window.addEventListener('keydown',handleKey);
    return()=>window.removeEventListener('keydown',handleKey);
  },[onClose,busy,question]);

  const navigateStep=(step:number)=>{
    void flushDirty();
    setCurrent(value=>value+step);
  };

  const submit=async()=>{
    if(busy)return;
    setBusy(true);
    try{
      await flushDirty();
      const summary=await api<{score:number;maxScore:number;percentage:number}>(`/api/attempts/${attemptId}/submit`,{method:'POST'});
      const review=await api<AttemptReview>(`/api/attempts/${attemptId}/review`).catch(()=>({...summary,passed:summary.percentage>=test.passPercentage,questions:[]}));
      try{localStorage.removeItem(draftKey)}catch{}
      setResult(review);
      onDone();
    }catch(error){
      notify((error as Error).message);
    }finally{
      setBusy(false);
    }
  };

  return <div className="modal"><section className="modalCard examModal" role="dialog" aria-modal="true" aria-labelledby="exam-dialog-title">
    <header>
      <div>
        <small>{test.subject}</small>
        <h3 id="exam-dialog-title">{test.title}</h3>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
        {!isOnline&&<span className="offlineBadge">📴 غير متصل (المسودة محفوظة)</span>}
        <span className="timer"><Clock3/>{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</span>
        <button onClick={onClose} aria-label="حفظ الاختبار والخروج"><X/></button>
      </div>
    </header>
    {result?<div className="result reviewResult">
      <span className={result.passed?"passedResult":"failedResult"}>{result.passed?<CheckCircle2/>:<X/>}</span>
      <h2>{result.passed?"أحسنت، اجتزت الاختبار":"تم تسليم الاختبار"}</h2>
      <MedicalVitals compact/>
      <strong>{result.percentage}%</strong>
      <p>حصلت على {result.score} من {result.maxScore}.</p>
      {result.questions.filter(item=>!item.isCorrect).length?<section className="mistakeReview">
        <div className="mistakeHead">
          <h3>مراجعة الأخطاء</h3>
          <small>{result.questions.filter(item=>!item.isCorrect).length} إجابات تحتاج مراجعة</small>
        </div>
        {result.questions.filter(item=>!item.isCorrect).map((item,index)=><article key={item.id}>
          <b>{index+1}. {item.text}</b>
          <p className="studentAnswer">إجابتك: {item.questionType==='fill_blank'?(item.answerText||'لم تتم الإجابة'):item.selectedOption===null?'لم تتم الإجابة':item.options[item.selectedOption]}</p>
          <p className="correctAnswer">الإجابة الصحيحة: {item.questionType==='fill_blank'?(item.acceptedAnswers||[]).join(' أو '):item.options[item.correctOption]}</p>
          {item.explanation&&<small>{item.explanation}</small>}
        </article>)}
      </section>:<div className="perfectResult"><CheckCircle2/> جميع إجاباتك صحيحة.</div>}
      <button className="solid" onClick={onClose}>العودة إلى المنصة</button>
    </div>:!question?<div className="modalBody"><div className="empty small"><FileQuestion/><p>لا توجد أسئلة متاحة في هذا الاختبار.</p><button className="solid" onClick={onClose}>العودة للمنصة</button></div></div>:<div className="modalBody">
      <div className="questionProgress">
        <span>السؤال {current+1} من {test.questions.length}</span>
        <div className="bar" role="progressbar" aria-label="تقدم الاختبار" aria-valuemin={1} aria-valuemax={test.questions.length} aria-valuenow={current+1}>
          <i style={{width:(current+1)/test.questions.length*100+'%'}}/>
        </div>
      </div>
      {question.imageUrl?<div className="examSplitView">
        <aside className="clinicalCasePane">
          <img className="clinicalImage" src={question.imageUrl} alt="صورة الحالة السريرية"/>
        </aside>
        <div className="examQuestionPane">
          <h2>{question.text}</h2>
          {question.questionType==='fill_blank'?<label className="fillAnswer">
            <span>اكتب الإجابة</span>
            <input value={String(answers[question.id||`q-${current}`]||'')} onChange={event=>fill(event.target.value)} maxLength={500}/>
          </label>:<div className="options" role="radiogroup" aria-label="خيارات الإجابة">
            {(question.options||[]).map((option,index)=><button key={index} role="radio" aria-checked={answers[question.id||`q-${current}`]===index} className={answers[question.id||`q-${current}`]===index?'selected':''} onClick={()=>choose(index)}>
              <span className="optionHotkey">{index+1}</span><i aria-hidden="true"/>{option}
            </button>)}
          </div>}
        </div>
      </div>:<>
        <h2>{question.text}</h2>
        {question.questionType==='fill_blank'?<label className="fillAnswer">
          <span>اكتب الإجابة</span>
          <input value={String(answers[question.id||`q-${current}`]||'')} onChange={event=>fill(event.target.value)} maxLength={500}/>
        </label>:<div className="options" role="radiogroup" aria-label="خيارات الإجابة">
          {(question.options||[]).map((option,index)=><button key={index} role="radio" aria-checked={answers[question.id||`q-${current}`]===index} className={answers[question.id||`q-${current}`]===index?'selected':''} onClick={()=>choose(index)}>
            <span className="optionHotkey">{index+1}</span><i aria-hidden="true"/>{option}
          </button>)}
        </div>}
      </>}
      <footer>
        <button className="secondary" onClick={onClose}>حفظ وخروج</button>
        <button className="secondary" disabled={current===0} onClick={()=>navigateStep(-1)}>السابق</button>
        <button className="solid" disabled={answers[question.id||`q-${current}`]===undefined||answers[question.id||`q-${current}`]===''||busy} onClick={()=>current===test.questions.length-1?void submit():navigateStep(1)}>
          {current===test.questions.length-1?'إنهاء وتسليم':'التالي'}
        </button>
      </footer>
    </div>}
  </section></div>;
}

type TestPath=Pick<FormTest,'universityId'|'collegeId'|'departmentId'|'phaseId'|'sectionId'|'subjectId'|'lectureId'>;
function PathFields({catalog,value,onChange}:{catalog:Catalog;value:TestPath;onChange:(value:TestPath)=>void}){
  const colleges=catalog.colleges.filter(item=>item.universityId===value.universityId);const departments=catalog.departments.filter(item=>item.collegeId===value.collegeId);const phases=catalog.phases.filter(item=>item.departmentId===value.departmentId);const sections=catalog.sections.filter(item=>item.phaseId===value.phaseId);const subjects=catalog.subjects.filter(item=>item.phaseId===value.phaseId);const lectures=catalog.lectures.filter(item=>item.subjectId===value.subjectId);
  const changeUniversity=(universityId:string)=>{const collegeId=catalog.colleges.find(item=>item.universityId===universityId)?.id||'';const departmentId=catalog.departments.find(item=>item.collegeId===collegeId)?.id||'';const phaseId=catalog.phases.find(item=>item.departmentId===departmentId)?.id||'';const subjectId=catalog.subjects.find(item=>item.phaseId===phaseId)?.id||'';onChange({universityId,collegeId,departmentId,phaseId,sectionId:'',subjectId,lectureId:catalog.lectures.find(item=>item.subjectId===subjectId)?.id||''})};
  const changeCollege=(collegeId:string)=>{const departmentId=catalog.departments.find(item=>item.collegeId===collegeId)?.id||'';const phaseId=catalog.phases.find(item=>item.departmentId===departmentId)?.id||'';const subjectId=catalog.subjects.find(item=>item.phaseId===phaseId)?.id||'';onChange({...value,collegeId,departmentId,phaseId,sectionId:'',subjectId,lectureId:catalog.lectures.find(item=>item.subjectId===subjectId)?.id||''})};
  const changeDepartment=(departmentId:string)=>{const phaseId=catalog.phases.find(item=>item.departmentId===departmentId)?.id||'';const subjectId=catalog.subjects.find(item=>item.phaseId===phaseId)?.id||'';onChange({...value,departmentId,phaseId,sectionId:'',subjectId,lectureId:catalog.lectures.find(item=>item.subjectId===subjectId)?.id||''})};
  const changePhase=(phaseId:string)=>{const subjectId=catalog.subjects.find(item=>item.phaseId===phaseId)?.id||'';onChange({...value,phaseId,sectionId:'',subjectId,lectureId:catalog.lectures.find(item=>item.subjectId===subjectId)?.id||''})};const changeSubject=(subjectId:string)=>onChange({...value,subjectId,lectureId:catalog.lectures.find(item=>item.subjectId===subjectId)?.id||''});
  return <><label><span>الجامعة</span><select required value={value.universityId} onChange={event=>changeUniversity(event.target.value)}>{catalog.universities.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>الكلية</span><select required value={value.collegeId} onChange={event=>changeCollege(event.target.value)}>{colleges.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>القسم</span><select required value={value.departmentId} onChange={event=>changeDepartment(event.target.value)}>{departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>المرحلة</span><select required value={value.phaseId} onChange={event=>changePhase(event.target.value)}>{phases.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>الشعبة</span><select value={value.sectionId} onChange={event=>onChange({...value,sectionId:event.target.value})}><option value="">كل الشعب</option>{sections.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>المادة</span><select required value={value.subjectId} onChange={event=>changeSubject(event.target.value)}>{subjects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>المحاضرة</span><select required value={value.lectureId} onChange={event=>onChange({...value,lectureId:event.target.value})}>{lectures.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label></>
}

function InlineClinicalUpload({onUploaded,notify}:{onUploaded:(asset:{id:string;originalName:string;altText?:string|null})=>void;notify:(message:string)=>void}){const [file,setFile]=useState<File|null>(null);const [title,setTitle]=useState('');const [busy,setBusy]=useState(false);const upload=async()=>{if(!file||!title.trim())return;setBusy(true);try{const response=await fetch('/api/admin/media',{method:'POST',credentials:'include',headers:{'content-type':file.type,'x-file-name':encodeURIComponent(file.name),'x-title':encodeURIComponent(title),'x-alt-text':encodeURIComponent(title)},body:file});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||'تعذر رفع الصورة');onUploaded({id:data.id,originalName:file.name,altText:title});setFile(null);setTitle('');notify('رفعت الصورة وأضيفت إلى المكتبة واختيرت للسؤال')}catch(error){notify((error as Error).message)}finally{setBusy(false)}};return <div className="inlineClinicalUpload"><span>أو ارفع صورة جديدة من هنا</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>setFile(event.target.files?.[0]||null)}/><input placeholder="عنوان الصورة" value={title} onChange={event=>setTitle(event.target.value)}/><button type="button" disabled={!file||!title.trim()||busy} onClick={()=>void upload()}>{busy?'جارٍ الرفع...':'رفع وإضافة للمكتبة'}</button></div>}

function TestForm({catalog,initial,onClose,onSaved,notify}:{catalog:Catalog;initial?:FormTest;onClose:()=>void;onSaved:()=>void;notify:(message:string)=>void}){
  const DRAFT_KEY='kiur-exam-form-draft';
  const loadDraft=():FormTest|null=>{try{const raw=localStorage.getItem(DRAFT_KEY);if(!raw)return null;const parsed=JSON.parse(raw);if(parsed&&typeof parsed.title==='string'&&Array.isArray(parsed.questions))return parsed;return null}catch{return null}};
  const [hasDraft]=useState(()=>!initial&&!!loadDraft());
  const [form,setForm]=useState<FormTest>(()=>{if(!initial&&hasDraft){const draft=loadDraft();if(draft)return draft}return initial||emptyForm(catalog)});
  const [busy,setBusy]=useState(false);const [media,setMedia]=useState<{id:string;originalName:string;altText?:string|null}[]>([]);
  useEffect(()=>{api<{data:{id:string;originalName:string;altText?:string|null}[]}>('/api/admin/media').then(data=>setMedia(data.data)).catch(()=>{})},[]);
  useEffect(()=>{const handleKey=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!busy)onClose()};window.addEventListener('keydown',handleKey);return()=>window.removeEventListener('keydown',handleKey)},[onClose,busy]);
  const draftTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{if(initial)return;if(draftTimer.current)clearTimeout(draftTimer.current);draftTimer.current=setTimeout(()=>{try{localStorage.setItem(DRAFT_KEY,JSON.stringify(form))}catch{}},2000);return()=>{if(draftTimer.current)clearTimeout(draftTimer.current)}},[form,initial]);
  const patchQuestion=(index:number,patch:Partial<FormTest['questions'][number]>)=>setForm(value=>({...value,questions:value.questions.map((question,i)=>i===index?{...question,...patch}:question)}));
  const setOption=(questionIndex:number,optionIndex:number,value:string)=>patchQuestion(questionIndex,{options:form.questions[questionIndex]!.options.map((option,index)=>index===optionIndex?value:option)});
  const addOption=(questionIndex:number)=>{const q=form.questions[questionIndex];if(!q||q.options.length>=6)return;patchQuestion(questionIndex,{options:[...q.options,'']})};
  const removeOption=(questionIndex:number,optionIndex:number)=>{const q=form.questions[questionIndex];if(!q||q.options.length<=2)return;const newOptions=q.options.filter((_,i)=>i!==optionIndex);const correctOption=q.correctOption===optionIndex?0:q.correctOption!==undefined&&q.correctOption>optionIndex?q.correctOption-1:q.correctOption;patchQuestion(questionIndex,{options:newOptions,correctOption:correctOption??0})};
  const duplicateQuestion=(questionIndex:number)=>{const source=form.questions[questionIndex];if(!source)return;setForm(value=>({...value,questions:[...value.questions.slice(0,questionIndex+1),{...source,text:source.text+' (نسخة)',options:[...source.options]},  ...value.questions.slice(questionIndex+1)]}))};
  const save=async(event:React.FormEvent)=>{event.preventDefault();setBusy(true);try{await api(initial?.id?`/api/admin/tests/${initial.id}`:'/api/admin/tests',{method:initial?.id?'PUT':'POST',body:JSON.stringify(form)});try{localStorage.removeItem(DRAFT_KEY)}catch{}notify(initial?'تم تحديث الاختبار':'تم إنشاء الاختبار ونشره');onSaved()}catch(error){notify((error as Error).message)}finally{setBusy(false)}};
  const path={universityId:form.universityId,collegeId:form.collegeId,departmentId:form.departmentId,phaseId:form.phaseId,sectionId:form.sectionId,subjectId:form.subjectId,lectureId:form.lectureId};
  const totalPoints=form.questions.reduce((sum,q)=>sum+Number(q.points||1),0);
  return <div className="modal formModal"><form className="modalCard editor" role="dialog" aria-modal="true" aria-labelledby="test-editor-title" onSubmit={event=>void save(event)}>
    <header><div><small>لوحة المشرف</small><h3 id="test-editor-title">{initial?'تعديل الاختبار':'إنشاء اختبار جديد'}</h3></div><button type="button" onClick={onClose} aria-label="إغلاق محرر الاختبار"><X/></button></header>
    <div className="editorBody">
      {hasDraft&&!initial&&<div className="draftBanner" role="status">📝 تم استعادة مسودة محفوظة تلقائيًا. <button type="button" className="outline" onClick={()=>{try{localStorage.removeItem(DRAFT_KEY)}catch{}setForm(emptyForm(catalog))}}>تجاهل المسودة</button></div>}
      <div className="formGrid"><label className="wide"><span>عنوان الاختبار</span><input required minLength={3} value={form.title} onChange={event=>setForm({...form,title:event.target.value})}/></label><PathFields catalog={catalog} value={path} onChange={value=>setForm({...form,...value})}/><label><span>المدة بالدقائق</span><input type="number" min="1" max="360" value={form.durationMinutes} onChange={event=>setForm({...form,durationMinutes:Number(event.target.value)})}/></label><label><span>نسبة النجاح</span><input type="number" min="0" max="100" value={form.passPercentage} onChange={event=>setForm({...form,passPercentage:Number(event.target.value)})}/></label><label><span>مستوى الصعوبة</span><select value={form.difficultyLevel} onChange={event=>setForm({...form,difficultyLevel:Number(event.target.value)})}><option value={1}>أساسي</option><option value={2}>متوسط</option><option value={3}>متقدم</option></select></label><label><span>نمط الاختبار</span><select value={form.examMode} onChange={event=>setForm({...form,examMode:event.target.value as 'practice'|'formal'})}><option value="practice">تدريب</option><option value="formal">امتحان رسمي</option></select></label>{form.examMode==='formal'&&<><ExamDateTime label="موعد بداية الاختبار" value={form.availableFrom} onChange={value=>setForm({...form,availableFrom:value})}/><ExamDateTime label="موعد نهاية الاختبار" value={form.availableUntil} onChange={value=>setForm({...form,availableUntil:value})}/><label><span>عدد المحاولات</span><input type="number" min="1" max="100" value={form.maxAttempts} onChange={event=>setForm({...form,maxAttempts:Number(event.target.value)})}/></label></>}<label><span>الحالة</span><select value={form.status} onChange={event=>setForm({...form,status:event.target.value})}><option value="published">منشور</option><option value="draft">مسودة</option></select></label><label className="certificateToggle"><input type="checkbox" checked={form.certificateEnabled} onChange={event=>setForm({...form,certificateEnabled:event.target.checked})}/><span>إصدار شهادة تلقائيًا عند النجاح</span></label></div>
      <fieldset className="shuffleSettings"><legend>ترتيب أسئلة الاختبار</legend><p>تُطبّق الإعدادات عند إنشاء محاولة جديدة، بينما تبقى المحاولة المحفوظة بالترتيب نفسه.</p><label className="shuffleOption"><input type="checkbox" checked={form.shuffleQuestions} onChange={event=>setForm({...form,shuffleQuestions:event.target.checked})}/><span><b>خلط ترتيب الأسئلة</b><small>يظهر تسلسل مختلف للأسئلة عند كل إعادة للاختبار.</small></span></label><label className="shuffleOption"><input type="checkbox" checked={form.shuffleOptions} onChange={event=>setForm({...form,shuffleOptions:event.target.checked})}/><span><b>خلط خيارات الإجابة</b><small>يتغير ترتيب خيارات كل سؤال عند كل محاولة جديدة.</small></span></label></fieldset>
      <div className="questionEditorHead"><div><h3>أسئلة الاختبار <small className="totalPoints">({form.questions.length} سؤال • {totalPoints} درجة)</small></h3><p>اختر الإجابة الصحيحة لكل سؤال.</p></div><button type="button" className="outline" onClick={()=>setForm(value=>({...value,questions:[...value.questions,emptyQuestion()]}))}><Plus/> إضافة سؤال</button></div>
      <div className="questionEditors">{form.questions.map((question,questionIndex)=><article className="questionEditor" key={questionIndex}><div className="questionNumber"><b>{questionIndex+1}</b><select value={question.questionType||'mcq'} onChange={event=>{const questionType=event.target.value as Question['questionType'];patchQuestion(questionIndex,{questionType,options:questionType==='true_false'?['صح','خطأ']:questionType==='fill_blank'?[]:question.options.length>=2?question.options:['','','',''],correctOption:0})}}><option value="mcq">اختيار من متعدد</option><option value="true_false">صح / خطأ</option><option value="fill_blank">أكمل الفراغ</option><option value="clinical_case">حالة سريرية بصورة</option></select><label className="pointsInput" title="الدرجة"><span>⚖</span><input type="number" min="0.5" max="100" step="0.5" value={question.points??1} onChange={event=>patchQuestion(questionIndex,{points:Number(event.target.value)||1})}/></label><button type="button" title="تكرار السؤال" onClick={()=>duplicateQuestion(questionIndex)}><Copy/></button><button type="button" disabled={form.questions.length===1} onClick={()=>setForm(value=>({...value,questions:value.questions.filter((_,index)=>index!==questionIndex)}))}><Trash2/></button></div>{question.questionType==='clinical_case'&&<label><span>صورة الحالة من المكتبة</span><select required value={question.imageId||''} onChange={event=>patchQuestion(questionIndex,{imageId:event.target.value})}><option value="">اختر صورة رفعها المشرف</option>{media.map(item=><option key={item.id} value={item.id}>{item.altText||item.originalName}</option>)}</select>{question.imageId&&<img className="clinicalPreview" src={`/api/media/${question.imageId}`} alt="معاينة الحالة"/>}<InlineClinicalUpload notify={notify} onUploaded={asset=>{setMedia(value=>[...value,asset]);patchQuestion(questionIndex,{imageId:asset.id})}}/></label>}<label><span>نص السؤال</span><textarea required value={question.text} onChange={event=>patchQuestion(questionIndex,{text:event.target.value})}/></label>{question.questionType==='fill_blank'?<label><span>الإجابات المقبولة — افصل بينها بعلامة |</span><input required value={(question.acceptedAnswers||[]).join(' | ')} onChange={event=>patchQuestion(questionIndex,{acceptedAnswers:event.target.value.split('|').map(item=>item.trim()).filter(Boolean)})}/><small>يتجاهل التصحيح حالة الحروف والتشكيل والمسافات.</small></label>:<div className="optionEditor">{question.options.map((option,optionIndex)=><label key={optionIndex} className={question.correctOption===optionIndex?'correct':''}><input type="radio" name={'correct-'+questionIndex} checked={question.correctOption===optionIndex} onChange={()=>patchQuestion(questionIndex,{correctOption:optionIndex})}/><input required placeholder={'الخيار '+(optionIndex+1)} value={option} onChange={event=>setOption(questionIndex,optionIndex,event.target.value)}/>{question.questionType!=='true_false'&&question.options.length>2&&<button type="button" className="removeOption" title="حذف الخيار" onClick={()=>removeOption(questionIndex,optionIndex)}><Minus size={14}/></button>}</label>)}{question.questionType!=='true_false'&&question.options.length<6&&<button type="button" className="addOption" onClick={()=>addOption(questionIndex)}><Plus size={14}/> إضافة خيار</button>}</div>}<label><span>شرح الإجابة (اختياري)</span><textarea value={question.explanation||''} onChange={event=>patchQuestion(questionIndex,{explanation:event.target.value})}/></label></article>)}</div>
    </div>
    <footer className="editorFooter"><button type="button" className="secondary" onClick={onClose}>إلغاء</button><button className="solid" disabled={busy||!form.lectureId}><Save/>{busy?'جارٍ الحفظ...':'حفظ الاختبار'}</button></footer>
  </form></div>
}

function TestBrowser({catalog,user,tests,search,setSearch,onStart,onChangeProfile,directTarget,onClearDirect,notify,startingId}:{catalog:Catalog;user:User;tests:Test[];search:string;setSearch:(value:string)=>void;onStart:(id:string)=>void;onChangeProfile:()=>void;directTarget:DirectTarget;onClearDirect:()=>void;notify:(message:string)=>void;startingId:string|null}){
  const focusedTest=directTarget?.kind==='test'?tests.find(item=>item.id===directTarget.id):undefined;const targetLectureId=directTarget?.kind==='lecture'?directTarget.id:focusedTest?.lectureId;
  const initialUniversity=user.universityId||catalog.universities[0]?.id||'';const initialCollege=user.collegeId||catalog.colleges.find(item=>item.universityId===initialUniversity)?.id||'';const initialDepartment=user.departmentId||catalog.departments.find(item=>item.collegeId===initialCollege)?.id||'';const initialPhase=user.phaseId||catalog.phases.find(item=>item.departmentId===initialDepartment)?.id||'';
  const [universityId,setUniversityId]=useState(initialUniversity);const [collegeId,setCollegeId]=useState(initialCollege);const [departmentId,setDepartmentId]=useState(initialDepartment);const [phaseId,setPhaseId]=useState(initialPhase);const [sectionId,setSectionId]=useState(user.sectionId||'');const [subjectId,setSubjectId]=useState('');const [lectureId,setLectureId]=useState('');
  const colleges=catalog.colleges.filter(item=>item.universityId===universityId);const departments=catalog.departments.filter(item=>item.collegeId===collegeId);const phases=catalog.phases.filter(item=>item.departmentId===departmentId);const sections=catalog.sections.filter(item=>item.phaseId===phaseId);const subjects=catalog.subjects.filter(item=>item.phaseId===phaseId);const lectures=catalog.lectures.filter(item=>item.subjectId===subjectId);
  useEffect(()=>{if(!targetLectureId)return;const lecture=catalog.lectures.find(item=>item.id===targetLectureId);const subject=catalog.subjects.find(item=>item.id===lecture?.subjectId);const phase=catalog.phases.find(item=>item.id===subject?.phaseId);const department=catalog.departments.find(item=>item.id===phase?.departmentId);const college=catalog.colleges.find(item=>item.id===department?.collegeId);if(lecture&&subject&&phase&&department&&college){setUniversityId(college.universityId);setCollegeId(college.id);setDepartmentId(department.id);setPhaseId(phase.id);setSubjectId(subject.id);setLectureId(lecture.id)}},[targetLectureId,catalog]);
  useEffect(()=>{if(!targetLectureId&&!colleges.some(item=>item.id===collegeId))setCollegeId(colleges[0]?.id||'')},[universityId]);
  useEffect(()=>{if(!targetLectureId&&!departments.some(item=>item.id===departmentId))setDepartmentId(departments[0]?.id||'')},[collegeId]);
  useEffect(()=>{if(!targetLectureId&&!phases.some(item=>item.id===phaseId))setPhaseId(phases[0]?.id||'')},[departmentId]);
  useEffect(()=>{if(!targetLectureId&&!sections.some(item=>item.id===sectionId))setSectionId('');if(!targetLectureId&&!subjects.some(item=>item.id===subjectId))setSubjectId(subjects[0]?.id||'')},[phaseId]);
  useEffect(()=>{if(!targetLectureId&&!lectures.some(item=>item.id===lectureId))setLectureId(lectures[0]?.id||'')},[subjectId]);
  const filtered=useMemo(()=>{if(directTarget?.kind==='test')return tests.filter(test=>test.id===directTarget.id);if(directTarget?.kind==='lecture')return tests.filter(test=>test.lectureId===directTarget.id);const needle=search.trim().toLocaleLowerCase('ar');if(needle)return tests.filter(test=>matchesStudySearch(needle,test.title,test.subjectName,test.lectureName,test.subject,test.lecture,test.universityName,test.collegeName,test.departmentName,test.phaseName,test.sectionName));return tests.filter(test=>(!universityId||test.universityId===universityId)&&(!collegeId||test.collegeId===collegeId)&&(!departmentId||test.departmentId===departmentId)&&(!phaseId||test.phaseId===phaseId)&&(!sectionId||!test.sectionId||test.sectionId===sectionId)&&(!subjectId||test.subjectId===subjectId)&&(!lectureId||test.lectureId===lectureId))},[tests,universityId,collegeId,departmentId,phaseId,sectionId,subjectId,lectureId,search,directTarget]);
  const changeUniversity=(id:string)=>{onClearDirect();setUniversityId(id);const nextCollege=catalog.colleges.find(item=>item.universityId===id)?.id||'';setCollegeId(nextCollege);setDepartmentId('');setPhaseId('');setSectionId('');setSubjectId('');setLectureId('')};const changeCollege=(id:string)=>{onClearDirect();setCollegeId(id);setDepartmentId('');setPhaseId('');setSectionId('');setSubjectId('');setLectureId('')};const changeDepartment=(id:string)=>{onClearDirect();setDepartmentId(id);const nextPhase=catalog.phases.find(item=>item.departmentId===id)?.id||'';setPhaseId(nextPhase);setSectionId('');setSubjectId('');setLectureId('')};const lectureTitle=catalog.lectures.find(item=>item.id===lectureId)?.name||'المحاضرة';
  return <>{directTarget&&<div className="directBanner"><span><Link2/></span><div><b>{directTarget.kind==='test'?'رابط مباشر لاختبار':'رابط مباشر لمحاضرة'}</b><small>{directTarget.kind==='test'?(focusedTest?.title||'جارٍ تحميل الاختبار...'):lectureTitle}</small></div><button onClick={onClearDirect}>عرض جميع الاختبارات</button></div>}<section className="pathPanel"><div className="pathHeading"><span><GraduationCap/></span><div><h3>اختر مسارك الدراسي</h3><p>القسم ← المرحلة ← المادة ← المحاضرة</p></div><div className="pathActions">{lectureId&&<ShareButton kind="lecture" id={lectureId} title={lectureTitle} label="مشاركة المحاضرة" notify={notify} className="lectureShare"/>}<button onClick={onChangeProfile}>تغيير القسم والمرحلة</button></div></div><div className="pathSelectors"><label><span>1. القسم</span><select value={departmentId} onChange={event=>changeDepartment(event.target.value)}>{catalog.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>2. المرحلة</span><select value={phaseId} onChange={event=>{onClearDirect();setPhaseId(event.target.value);setSubjectId('');setLectureId('')}}>{phases.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>3. المادة</span><select value={subjectId} onChange={event=>{onClearDirect();setSubjectId(event.target.value);setLectureId('')}}>{subjects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>4. المحاضرة</span><select value={lectureId} onChange={event=>{onClearDirect();setLectureId(event.target.value)}}>{lectures.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><div className="mobileSearch"><Search/><input value={search} onChange={event=>{onClearDirect();setSearch(event.target.value)}} placeholder="ابحث عن اختبار أو محاضرة..."/></div></section><div className="resultsHead"><div><h3>{directTarget?.kind==='test'?'الاختبار المُشارك':directTarget?.kind==='lecture'?'اختبارات المحاضرة':'الاختبارات المطابقة'}</h3><p>{directTarget?filtered.length+' اختبار متاح عبر الرابط':search?filtered.length+' نتيجة بحث في جميع الاختبارات':filtered.length+' اختبار ضمن الاختيارات الحالية'}</p></div>{search&&!directTarget&&<button onClick={()=>setSearch('')}>مسح البحث</button>}</div><div className="cards">{filtered.map(test=><article className="testCard" key={test.id}><span className="tag">{test.subjectName||test.subject}</span><h3>{test.title}</h3><p>{test.lectureName||test.lecture}</p><div className="meta"><span><Clock3/>{test.durationMinutes} دقيقة</span><span><ClipboardList/>{test.questionCount} أسئلة</span></div><div className="cardActions"><button className="solid full" disabled={Boolean(startingId)} onClick={()=>onStart(test.id)}>{startingId===test.id?'جارٍ فتح الاختبار…':'فتح الاختبار'}</button><ShareButton kind="test" id={test.id} title={test.title} label="مشاركة" notify={notify}/></div></article>)}</div>{!filtered.length&&<div className="empty"><BookOpen/><h3>لا توجد اختبارات مطابقة</h3><p>{directTarget?'قد يكون الاختبار غير منشور أو الرابط غير صحيح.':search?'جرّب كلمة بحث أخرى أو امسح البحث.':'لم ينشر المشرف اختبارًا لهذه المحاضرة بعد.'}</p></div>}</>
}
export default function RealAppV2(){
  const verificationCode=window.location.pathname.match(/^\/verify\/([a-f0-9]{32})$/i)?.[1]||'';
  const authPreview=['127.0.0.1','localhost'].includes(window.location.hostname)&&new URLSearchParams(window.location.search).has('auth-preview');
  const [directTarget,setDirectTarget]=useState<DirectTarget>(()=>parseDirectTarget());
  const [adminMenuOpen,setAdminMenuOpen]=useState(false);const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(true);const [catalog,setCatalog]=useState<Catalog|null>(null);const [profileSetup,setProfileSetup]=useState(false);const [view,setView]=useState<MainView>(directTarget?'tests':'home');const [adminTab,setAdminTab]=useState<'tests'|'catalog'|'students'|'academicChanges'|'accounts'|'imports'|'library'|'glimpses'|'logs'|'bans'|'gamification'>('tests');const [menu,setMenu]=useState(false);const [tests,setTests]=useState<Test[]>([]);const [adminTests,setAdminTests]=useState<Test[]>([]);const [history,setHistory]=useState<HistoryItem[]>([]);const [summary,setSummary]=useState({attempts:0,averagePercentage:0});const [metrics,setMetrics]=useState<any>(null);const [audit,setAudit]=useState<any[]>([]);const [runner,setRunner]=useState<{test:TestDetail;attemptId:string}|null>(null);const [editor,setEditor]=useState<FormTest|'new'|null>(null);  const [search,setSearch]=useState('');const [commandPaletteOpen,setCommandPaletteOpen]=useState(false);const [toast,setToast]=useState('');const toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [smartReviewOpen,setSmartReviewOpen]=useState(false);const [smartReviewTab,setSmartReviewTab]=useState<'flashcards'|'quizBuilder'|'stats'>('flashcards');
  const [studyLoading,setStudyLoading]=useState(true);const [studyError,setStudyError]=useState('');const studyLoadSequence=useRef(0);const [startingId,setStartingId]=useState<string|null>(null);const startLock=useRef(false);const [learningHub,setLearningHub]=useState<LearningHub|null>(null);
  const [students,setStudents]=useState<StudentRow[]>([]);const [studentsTotal,setStudentsTotal]=useState(0);const [studentSearch,setStudentSearch]=useState('');const [studentFilters,setStudentFilters]=useState<StudentFilters>({universityId:'',collegeId:'',departmentId:'',phaseId:'',sectionId:''});const [studentsLoading,setStudentsLoading]=useState(false);const studentsLoadSequence=useRef(0);const [motionEnabled,setMotionEnabled]=useState(motionPreference);const [notifications,setNotifications]=useState<UserNotification[]>([]);const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const notify=(message:string)=>{if(toastTimer.current)clearTimeout(toastTimer.current);setToast(message);toastTimer.current=setTimeout(()=>{setToast('');toastTimer.current=null},2800)};
  const loadTests=async()=>{const data=await api<{data:Test[]}>('/api/tests');setTests(data.data)};
  const loadHistory=async()=>{const data=await api<{data:HistoryItem[];summary:{attempts:number;averagePercentage:number}}>('/api/me/history');setHistory(data.data);setSummary(data.summary)};
  const loadLearningHub=async()=>{if(user?.role!=='student'){setLearningHub(null);return}const data=await api<LearningHub>('/api/me/learning-hub');setLearningHub(data)};
  const loadStudy=async()=>{const sequence=++studyLoadSequence.current;setStudyLoading(true);setStudyError('');try{const [testData,historyData,hubData]=await Promise.all([api<{data:Test[]}>('/api/tests'),api<{data:HistoryItem[];summary:{attempts:number;averagePercentage:number}}>('/api/me/history'),user?.role==='student'?api<LearningHub>('/api/me/learning-hub'):Promise.resolve(null)]);if(sequence!==studyLoadSequence.current)return;setTests(testData.data);setHistory(historyData.data);setSummary(historyData.summary);setLearningHub(hubData)}catch{if(sequence===studyLoadSequence.current)setStudyError('تعذر تحميل المواد والنتائج. تحقق من الاتصال ثم أعد المحاولة.')}finally{if(sequence===studyLoadSequence.current)setStudyLoading(false)}};
  const loadAdmin=async()=>{const testData=await api<{data:Test[]}>('/api/admin/tests');setAdminTests(testData.data);if(user?.role==='owner'){const [metricData,auditData]=await Promise.all([api<any>('/api/admin/metrics'),api<{data:any[]}>('/api/admin/audit')]);setMetrics(metricData);setAudit(auditData.data)}else{setMetrics(null);setAudit([])}};
  const reloadCatalog=async()=>{const taxonomy=await api<Catalog>('/api/catalog');setCatalog(taxonomy);return taxonomy};
  const loadStudents=async(query='',filters=studentFilters,signal?:AbortSignal)=>{const sequence=++studentsLoadSequence.current;setStudentsLoading(true);try{const params=new URLSearchParams({limit:'200',q:query,...filters});const data=await api<{data:StudentRow[];total:number}>('/api/admin/students?'+params.toString(),{signal});if(sequence!==studentsLoadSequence.current)return;setStudents(data.data);setStudentsTotal(data.total)}finally{if(sequence===studentsLoadSequence.current)setStudentsLoading(false)}};
  useEffect(()=>()=>{if(toastTimer.current)clearTimeout(toastTimer.current)},[]);
  useEffect(()=>{const handleCmdK=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setCommandPaletteOpen(open=>!open)}};window.addEventListener('keydown',handleCmdK);return()=>window.removeEventListener('keydown',handleCmdK)},[]);
  useEffect(()=>{api<{user:User}>('/api/me').then(async data=>{setUser(data.user);void hydrateAccountTheme();if(data.user.restriction)return;const taxonomy=await api<Catalog>('/api/catalog');setCatalog(taxonomy);if(data.user.role==='student'&&(!data.user.universityId||!data.user.collegeId||!data.user.departmentId||!data.user.phaseId))setProfileSetup(true)}).catch(()=>setUser(null)).finally(()=>setLoading(false))},[]);
  useEffect(()=>{if(!user||!catalog||profileSetup)return;void loadStudy();return()=>{studyLoadSequence.current++}},[user,catalog,profileSetup]);
  useEffect(()=>{if(!user||user.restriction)return;void api<{data:UserNotification[]}>('/api/notifications').then(result=>setNotifications(result.data)).catch(()=>undefined)},[user]);
  useEffect(()=>{if(view==='admin'&&['owner','admin','teacher'].includes(user?.role||''))void loadAdmin().catch(error=>notify(error.message))},[view,user]);
  useEffect(()=>{if(view!=='admin'||!['owner','admin','teacher'].includes(user?.role||'')||adminTab!=='students')return;const controller=new AbortController();const timer=setTimeout(()=>void loadStudents(studentSearch,studentFilters,controller.signal).catch(error=>{if(error?.name!=='AbortError')notify(error.message)}),250);return()=>{clearTimeout(timer);controller.abort()}},[view,user,adminTab,studentSearch,studentFilters]);
  const start=async(id:string)=>{if(startLock.current)return;startLock.current=true;setStartingId(id);try{const attempt=await api<{attempt:{id:string}}>('/api/attempts',{method:'POST',body:JSON.stringify({testId:id})});const test=await api<TestDetail>(`/api/tests/${encodeURIComponent(id)}?attemptId=${encodeURIComponent(attempt.attempt.id)}`);setRunner({test,attemptId:attempt.attempt.id});void loadLearningHub().catch(()=>undefined)}catch(error){notify((error as Error).message)}finally{startLock.current=false;setStartingId(null)}};
  const toggleFavorite=async(testId:string,favorite:boolean)=>{const previous=learningHub;setLearningHub(current=>current?{...current,favorites:favorite?[...current.favorites,tests.find(item=>item.id===testId)!].filter(Boolean):current.favorites.filter(item=>item.id!==testId)}:current);try{await api(`/api/me/favorites/${encodeURIComponent(testId)}`,{method:favorite?'PUT':'DELETE',body:'{}'});notify(favorite?'أُضيف الاختبار إلى المفضلة':'أُزيل الاختبار من المفضلة')}catch(error){setLearningHub(previous);notify((error as Error).message)}};
  const edit=async(id:string)=>{try{const data=await api<FormTest>('/api/admin/tests/'+id);setEditor({...data,shuffleQuestions:Boolean(data.shuffleQuestions),shuffleOptions:Boolean(data.shuffleOptions),questions:data.questions.map(question=>({...question,correctOption:Number(question.correctOption)}))})}catch(error){notify((error as Error).message)}};
  const remove=async(id:string)=>{if(!confirm('أرشفة هذا الاختبار؟ لن يظهر للطلاب بعد ذلك.'))return;try{await api('/api/admin/tests/'+id,{method:'DELETE'});notify('تمت أرشفة الاختبار');await Promise.all([loadAdmin(),loadTests()])}catch(error){notify((error as Error).message)}};
  const logoutCurrent=async()=>{try{await logoutFromProvider(user?.authProvider)}catch(error){notify((error as Error).message)}};
  const toggleNotifications=()=>{setNotificationsOpen(value=>!value);if(notifications.some(item=>!item.readAt))void api('/api/notifications/read-all',{method:'POST',body:'{}'}).then(()=>setNotifications(value=>value.map(item=>({...item,readAt:item.readAt||new Date().toISOString()})))).catch(()=>undefined)};
  if(authPreview||window.location.pathname==='/auth/action'||['resetPassword','verifyEmail','recoverEmail'].includes(new URLSearchParams(window.location.search).get('mode')||'')||window.location.pathname==='/activate-staff')return <AuthScreen/>;if(verificationCode)return <VerifyScreen code={verificationCode}/>;if(loading)return <Loading/>;if(!user)return <Suspense fallback={<Loading/>}><GuestPortal/></Suspense>;if(user.restriction)return <BannedStudentScreen user={user} onLogout={()=>void logoutCurrent()}/>;if(!catalog)return <Loading/>;if(profileSetup)return user.role==='student'&&user.universityId&&user.collegeId&&user.departmentId&&user.phaseId?<AcademicChangeStudent catalog={catalog} user={user as User&{universityId:string;collegeId:string;departmentId:string;phaseId:string}} onClose={()=>setProfileSetup(false)} notify={notify}/>:<ProfileSetup user={user} catalog={catalog} onSaved={updated=>{setUser(updated);setProfileSetup(false);setView('tests')}} notify={notify}/>;
  const completed=summary.attempts;const passed=history.filter(item=>item.passed).length;const staff=['owner','admin','teacher'].includes(user.role);const links:readonly (readonly [MainView,React.ComponentType<any>,string])[]=[['home',LayoutDashboard,'رفّي الدراسي'],['tests',ClipboardList,'الاختبارات'],['glimpses',HeartPulse,'اللمحات'],['history',History,'النتائج'],...(user.role==='student'?[['points',Trophy,'نقاطي'] as const]:[]),['profile',UserRound,'حسابي']];
  const clearDirectLink=()=>{if(directTarget){setDirectTarget(null);window.history.replaceState({},'', '/')}};
  const navigate=(next:MainView)=>{clearDirectLink();setView(next);setMenu(false)};
  const staffLabels={department_head:'رئيس قسم',department_coordinator:'مقرر قسم',university_doctor:'دكتور جامعي',university_professor:'أستاذ جامعي'} as const;const roleLabel=user.role==='owner'?'مالك المنصة':user.role==='admin'?'مشرف':user.role==='teacher'?staffLabels[user.staffTitle||'university_doctor']:`${user.departmentName||'طالب'} • ${user.phaseName||''}`;const logout=logoutCurrent;
  const liquidItems:readonly (readonly [MainView,React.ComponentType<any>,string,number?])[]=[...links.map(([id,Icon,label])=>[id,Icon,label,id==='tests'?tests.length:undefined] as const),...(staff?[['admin',Settings2,user.role==='teacher'?'لوحة الكادر':'الإشراف'] as const]:[])];
  const adminMeta={tests:[ClipboardList,'إدارة الاختبارات','إنشاء الاختبارات ونشرها ومتابعتها'],imports:[FileQuestion,'استيراد الأسئلة','رفع Excel وWord مع مراجعة الأخطاء'],catalog:[GraduationCap,'الهيكل الأكاديمي','الجامعات والكليات والأقسام والمواد'],students:[Users,'سجل الطلاب','الأداء الاكاديمي والبحث والتصفية'],academicChanges:[ArrowLeftRight,'تغييرات المسار','مراجعة طلبات الطلاب الفردية والدفعية'],gamification:[Trophy,'نظام النقاط','السياسة العامة ومراجعة النقاط غير المعتادة'],glimpses:[HeartPulse,'اللمحات السريرية','إعداد المحتوى السريري ومراجعته'],library:[BookOpen,'المكتبة الطبية','الصور السريرية وسجل استخدامها'],accounts:[ShieldCheck,'الحسابات والصلاحيات','الكوادر والمشرفون ونطاقات العمل'],bans:[ShieldCheck,'حظر الطلاب','الطلبات والمراجعات وسجل القرارات'],logs:[History,'السجلات','التدقيق والحسابات والأحداث']} as const;
  const [ActiveAdminIcon,activeAdminTitle,activeAdminDescription]=adminMeta[adminTab];
  const selectAdminTab=(tab:typeof adminTab)=>{setAdminTab(tab);setAdminMenuOpen(false)};

  const stitchContextValue: StitchContextValue = {
    user,
    catalog,
    tests,
    history,
    summary: { completed, passed, averagePercentage: summary.averagePercentage },
    view,
    setView: (v: string) => navigate(v as MainView),
    search,
    setSearch,
    startExam: id => void start(id),
    startingId,
    theme: (document.documentElement.getAttribute('data-kiur-theme') as 'dark' | 'light') || 'dark',
    toggleTheme: () => {
      const next = document.documentElement.getAttribute('data-kiur-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-kiur-theme', next);
      localStorage.setItem('kiur-theme', next);
    },
    notifications,
    notificationsOpen,
    setNotificationsOpen,
    sidebarOpen,
    setSidebarOpen,
    openSmartReview: tab => { setSmartReviewTab(tab === 'quiz' ? 'quizBuilder' : (tab || 'flashcards')); setSmartReviewOpen(true); },
    commandPaletteOpen,
    setCommandPaletteOpen,
    logout: () => logoutCurrent(),
    notify
  };

  const studyContent = (
    <StudyShelf
      catalog={catalog}
      tests={tests}
      history={history}
      user={user}
      search={search}
      setSearch={setSearch}
      directTarget={directTarget}
      onClearDirect={clearDirectLink}
      onStart={id => void start(id)}
      onChangeProfile={() => setProfileSetup(true)}
      notify={notify}
      startingId={startingId}
      learningHub={learningHub}
      favoriteIds={learningHub?.favorites?.map(f => f.id) || []}
      onToggleFavorite={toggleFavorite}
      onOpenSmartReview={tab => { setSmartReviewTab(tab); setSmartReviewOpen(true); }}
    />
  );

  return (
    <StitchProvider value={stitchContextValue}>
      <div className="visually-hidden" aria-hidden="true" style={{ display: 'none' }}>
        <ThemeToggle/>
        <button aria-label="فتح حسابي" onClick={()=>navigate('profile')}>{user.name.slice(0,2)}</button>
        {view==='profile' && <div data-view="profile"/>}
      </div>
      <Suspense fallback={<Loading/>}>
        <StitchApp
          studyContent={studyContent}
          examRunnerElement={runner ? <ExamRunner test={runner.test} attemptId={runner.attemptId} notify={notify} onDone={() => { void loadHistory(); void loadLearningHub(); }} onClose={() => setRunner(null)} /> : undefined}
          editorElement={editor ? <TestForm catalog={catalog} initial={editor === 'new' ? undefined : editor} notify={notify} onClose={() => setEditor(null)} onSaved={async () => { setEditor(null); await Promise.all([loadAdmin(), loadTests()]); }} /> : undefined}
          toastElement={<div className={'toast ' + (toast ? 'show' : '')} role="status" aria-live="polite" aria-atomic="true">{toast}</div>}
          smartReviewElement={smartReviewOpen ? <Suspense fallback={<Loading/>}><SmartReviewHub tests={tests} catalog={catalog} history={history} initialTab={smartReviewTab} onClose={() => setSmartReviewOpen(false)} notify={notify} onLaunchCustomQuiz={quiz => { setRunner({ test: { ...quiz, id: 'custom-quiz-' + Date.now(), subject: 'المراجعة السريرية المخصصة', lecture: 'تدريب الأخطاء والتكرار', passPercentage: 60, durationMinutes: quiz.durationMinutes || 15, questionCount: quiz.questions.length, status: 'published' } as any, attemptId: 'custom-attempt-' + Date.now() }); setSmartReviewOpen(false); }} /></Suspense> : undefined}
          commandPaletteElement={<CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onNavigate={navigate} onSelectTest={id => void start(id)} onOpenSmartReview={tab => { setCommandPaletteOpen(false); setSmartReviewTab(tab || 'flashcards'); setSmartReviewOpen(true); }} tests={tests} catalog={catalog} userRole={user?.role} />}
          historyElement={<><Title title="سجل النتائج" subtitle="كل محاولاتك ودرجاتك وشهاداتك محفوظة في حسابك."/><div className="stats"><Stat icon={<ClipboardList/>} value={completed} label="إجمالي المحاولات"/><Stat icon={<CheckCircle2/>} value={passed} label="اختبارات ناجحة" tone="amber"/><Stat icon={<BarChart3/>} value={summary.averagePercentage + '%'} label="المتوسط العام" tone="blue"/><Stat icon={<ShieldCheck/>} value={completed ? Math.round(passed / completed * 100) + '%' : '0%'} label="نسبة النجاح" tone="coral"/></div><section className="panel tableWrap responsiveRecordWrap"><table className="responsiveRecords historyRecords"><thead><tr><th>الاختبار</th><th>المادة</th><th>التاريخ</th><th>النتيجة</th><th>الحالة</th><th>الشهادة</th></tr></thead><tbody>{history.map(item => <tr key={item.id}><td data-label="الاختبار">{item.title}</td><td data-label="المادة">{item.subject}</td><td data-label="التاريخ">{new Intl.DateTimeFormat('ar-IQ').format(new Date(item.finishedAt))}</td><td data-label="النتيجة" className={item.passed ? 'good' : 'low'}>{item.percentage}%</td><td data-label="الحالة"><span className={item.passed ? 'success' : 'retry'}>{item.passed ? 'ناجح' : 'إعادة مطلوبة'}</span></td><td data-label="الشهادة">{item.passed ? <CertificateButton attemptId={item.id} notify={notify}/> : null}</td></tr>)}</tbody></table>{!history.length && <div className="empty small"><History/><p>لم تُكمل أي اختبار بعد.</p></div>}</section></>}
          pointsElement={user.role === 'student' ? <><Title title="نقاطي" subtitle="نقاطك وإنجازاتك وتقدمك الدراسي في مساحة تنافسية هادئة."/><Suspense fallback={<SectionLoading/>}><StudentPoints notify={notify}/></Suspense></> : null}
          profileElement={user.role === 'student' ? <><Title title="حسابي" subtitle="هويتك الدراسية، تقدمك، شهاداتك وأمان حسابك في مكان واحد."/><Suspense fallback={<SectionLoading/>}><StudentProfile learningHub={learningHub} notify={notify} onCorrectPath={() => setProfileSetup(true)} onLogout={() => void logoutCurrent()}/></Suspense></> : <><Title title="حسابي" subtitle="بيانات حسابك ونطاق عملك داخل KIUR."/><AccountProfile user={user} onLogout={() => void logoutCurrent()}/></>}
          adminElement={staff ? <>
            <Title title={user.role === 'teacher' ? 'لوحة الكادر الأكاديمي' : 'لوحة الإشراف'} subtitle="إدارة المحتوى والحسابات والسجلات ضمن الصلاحيات الممنوحة."/>
            {user.role === 'owner' && <div className="stats"><Stat icon={<ClipboardList/>} value={metrics?.tests || 0} label="اختبارات فعالة"/><Stat icon={<Users/>} value={metrics?.students || 0} label="طلاب مسجلون" tone="amber"/><Stat icon={<CheckCircle2/>} value={metrics?.attempts || 0} label="إجمالي المحاولات" tone="blue"/><Stat icon={<BarChart3/>} value={(metrics?.averagePercentage || 0) + '%'} label="متوسط الدرجات" tone="coral"/></div>}
            <section className="adminWorkspace">
              <button type="button" className="adminMenuToggle" aria-expanded={adminMenuOpen} aria-controls="admin-section-menu" onClick={() => setAdminMenuOpen(value => !value)}><ActiveAdminIcon/><span><small>القسم الحالي</small><b>{activeAdminTitle}</b></span><ChevronLeft/></button>
              <aside id="admin-section-menu" className={'adminRail ' + (adminMenuOpen ? 'open' : '')}><header><Settings2/><div><b>مركز التحكم</b><small>{roleLabel}</small></div></header>
              <div className="adminTabs" role="tablist" aria-label="أقسام لوحة الإشراف">
                <button className={adminTab === 'tests' ? 'active' : ''} role="tab" aria-selected={adminTab === 'tests'} onClick={() => selectAdminTab('tests')}><ClipboardList/> إدارة الاختبارات</button>
                <button className={adminTab === 'imports' ? 'active' : ''} role="tab" aria-selected={adminTab === 'imports'} onClick={() => selectAdminTab('imports')}><FileQuestion/> استيراد Excel وWord</button>
                {(user.role !== 'teacher' || user.permissions?.some(permission => ['manage_catalog', 'delete_catalog'].includes(permission))) && <button className={adminTab === 'catalog' ? 'active' : ''} role="tab" aria-selected={adminTab === 'catalog'} onClick={() => selectAdminTab('catalog')}><GraduationCap/> الهيكل الأكاديمي</button>}
                {(user.role === 'owner' || user.permissions?.some(permission => ['view_student_log', 'view_reports', 'manage_students'].includes(permission))) && <button className={adminTab === 'students' ? 'active' : ''} role="tab" aria-selected={adminTab === 'students'} onClick={() => selectAdminTab('students')}><Users/> سجل الطلاب</button>}
                {(user.role === 'owner' || user.permissions?.includes('review_academic_changes')) && <button className={adminTab === 'academicChanges' ? 'active' : ''} role="tab" aria-selected={adminTab === 'academicChanges'} onClick={() => selectAdminTab('academicChanges')}><ArrowLeftRight/> تغييرات المسار</button>}
                {(user.role === 'owner' || user.permissions?.some(permission => ['manage_gamification', 'review_gamification'].includes(permission))) && <button className={adminTab==='gamification' ? 'active' : ''} role="tab" aria-selected={adminTab==='gamification'} onClick={() => selectAdminTab('gamification')}><Trophy/> نظام النقاط</button>}
                {(user.role === 'owner' || user.permissions?.includes('manage_glimpses')) && <button className={adminTab === 'glimpses' ? 'active' : ''} role="tab" aria-selected={adminTab === 'glimpses'} onClick={() => selectAdminTab('glimpses')}><HeartPulse/> اللمحات السريرية</button>}
                {(user.role === 'owner' || user.permissions?.some(permission => ['manage_library', 'use_media', 'view_library_log'].includes(permission))) && <button className={adminTab === 'library' ? 'active' : ''} role="tab" aria-selected={adminTab === 'library'} onClick={() => selectAdminTab('library')}><BookOpen/> المكتبة</button>}
                {user.role !== 'teacher' && <button className={adminTab === 'accounts' ? 'active' : ''} role="tab" aria-selected={adminTab === 'accounts'} onClick={() => selectAdminTab('accounts')}><ShieldCheck/> الحسابات والصلاحيات</button>}
                {(user.role === 'owner' || user.permissions?.some(permission => ['request_student_ban', 'review_student_ban', 'view_student_ban_log'].includes(permission))) && <button className={adminTab === 'bans' ? 'active' : ''} role="tab" aria-selected={adminTab === 'bans'} onClick={() => selectAdminTab('bans')}><ShieldCheck/> حظر الطلاب</button>}
                {(user.role === 'owner' || user.permissions?.some(permission => ['view_audit_log', 'view_account_log'].includes(permission))) && <button className={adminTab === 'logs' ? 'active' : ''} role="tab" aria-selected={adminTab === 'logs'} onClick={() => selectAdminTab('logs')}><History/> السجلات</button>}
              </div>
              </aside>
              <div className="adminStage"><header className="adminStageHead"><span><ActiveAdminIcon/></span><div><h2>{activeAdminTitle}</h2><p>{activeAdminDescription}</p></div></header>
              {adminTab === 'tests' && <div className="contentGrid"><section className="panel tableWrap responsiveRecordWrap"><div className="adminHead"><div><h3>إدارة الاختبارات</h3><small>لا تظهر إلا الاختبارات الواقعة ضمن نطاق صلاحيتك</small></div><button className="solid" onClick={() => setEditor('new')}><Plus/>اختبار جديد</button></div><table className="responsiveRecords adminTestRecords"><thead><tr><th>العنوان</th><th>المسار</th><th>الأسئلة</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{adminTests.map(test => <tr key={test.id}><td data-label="العنوان">{test.title}</td><td data-label="المسار">{test.subjectName || test.subject}<small className="tableLecture">{test.lectureName || test.lecture}</small></td><td data-label="الأسئلة">{test.questionCount}</td><td data-label="الحالة"><span className={test.status === 'published' ? 'success' : 'draft'}>{test.status === 'published' ? 'منشور' : 'مسودة'}</span></td><td data-label="الإجراءات" className="actions"><ShareButton kind="test" id={test.id} title={test.title} label="مشاركة" notify={notify} className="tableShare"/><button onClick={() => void edit(test.id)}>تعديل</button><button className="trash" aria-label={`أرشفة اختبار ${test.title}`} onClick={() => void remove(test.id)}><Trash2/></button></td></tr>)}</tbody></table></section>{user.role === 'owner' && <section className="panel"><div className="panelHead"><h3>آخر التعديلات</h3></div>{audit.slice(0, 8).map(item => <div className="audit" key={item.id}><b>{item.action}</b><small>{item.actorName || 'النظام'} • {new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.at))}</small></div>)}</section>}</div>}
              {adminTab === 'imports' && <Suspense fallback={<SectionLoading/>}><ImportManager tests={adminTests} notify={notify} onCommitted={loadAdmin}/></Suspense>}
              {adminTab === 'catalog' && (user.role !== 'teacher' || user.permissions?.some(permission => ['manage_catalog', 'delete_catalog'].includes(permission))) && <Suspense fallback={<SectionLoading/>}><CatalogManager catalog={catalog} reload={reloadCatalog} notify={notify} currentRole={user.role} permissions={user.permissions || []}/></Suspense>}
              {adminTab === 'students' && <Suspense fallback={<SectionLoading/>}><StudentManager students={students} total={studentsTotal} search={studentSearch} onSearch={setStudentSearch} loading={studentsLoading} catalog={catalog} filters={studentFilters} onFilters={setStudentFilters}/><ExportManager notify={notify} tests={adminTests}/></Suspense>}
              {adminTab === 'academicChanges' && <Suspense fallback={<SectionLoading/>}><AcademicChangeManager notify={notify}/></Suspense>}
              {adminTab==='gamification' && <Suspense fallback={<SectionLoading/>}><GamificationManager owner={user.role === 'owner'} canReview={user.role === 'owner' || Boolean(user.permissions?.includes('review_gamification'))} notify={notify}/></Suspense>}
              {adminTab === 'accounts' && user.role !== 'teacher' && <Suspense fallback={<SectionLoading/>}><AccountManager catalog={catalog} currentRole={user.role} notify={notify}/></Suspense>}
              {adminTab === 'bans' && <StudentBanManager currentRole={user.role} currentUserId={user.id} permissions={user.permissions || []} notify={notify}/>}
              {adminTab === 'glimpses' && <ClinicalGlimpsesManager catalog={catalog} currentRole={user.role} notify={notify}/>}
              {adminTab === 'library' && <Suspense fallback={<SectionLoading/>}><MediaManager notify={notify} currentRole={user.role} permissions={user.permissions || []}/></Suspense>}
              {adminTab === 'logs' && <Suspense fallback={<SectionLoading/>}><LogsManager permissions={user.permissions || []} currentRole={user.role} notify={notify}/></Suspense>}
              </div>
            </section>
          </> : null}
        />
      </Suspense>
    </StitchProvider>
  );
}
