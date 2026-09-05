import {useEffect,useMemo,useRef,useState} from 'react';
import {BrainCircuit,Building2,CheckCircle2,ChevronLeft,Eye,EyeOff,GraduationCap,HeartPulse,LoaderCircle,LockKeyhole,Mail,Microscope,ShieldCheck,Sparkles,UserRound} from 'lucide-react';
import './auth.css';

type Item={id:string;name:string;universityId?:string;collegeId?:string;departmentId?:string;phaseId?:string};
type Catalog={universities:Item[];colleges:Item[];departments:Item[];phases:Item[];sections:Item[]};
type AuthMode='login'|'register'|'activate'|'forgot';
type AuthScreenProps={backgroundVideoUrl?:string|null;onAuthenticated?:()=>void|Promise<void>};
class ApiError extends Error{code:string;constructor(code:string,message:string){super(message);this.code=code}}
async function send(path:string,body:unknown){const response=await fetch(path,{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new ApiError(data?.error?.code||'REQUEST_FAILED',data?.error?.message||'تعذر إكمال العملية');return data}
const DEFAULT_BACKGROUND_VIDEO='/media/kiur-auth-background.mp4';
const rememberedEmail=()=>{try{return localStorage.getItem('kiur-remembered-email')||''}catch{return ''}};

export default function AuthScreen({backgroundVideoUrl=DEFAULT_BACKGROUND_VIDEO,onAuthenticated}:AuthScreenProps){
  const activationToken=new URLSearchParams(window.location.search).get('token')||'';
  const [mode,setMode]=useState<AuthMode>(window.location.pathname==='/activate-staff'&&activationToken?'activate':'login');
  const [catalog,setCatalog]=useState<Catalog|null>(null);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [success,setSuccess]=useState(false);const [canResend,setCanResend]=useState(false);
  const [showPassword,setShowPassword]=useState(false);const [remember,setRemember]=useState(Boolean(rememberedEmail()));const [videoReady,setVideoReady]=useState(false);const [reduceMotion,setReduceMotion]=useState(false);
  const videoRef=useRef<HTMLVideoElement>(null);
  const [form,setForm]=useState({name:'',email:rememberedEmail(),password:'',universityId:'',collegeId:'',departmentId:'',phaseId:'',sectionId:''});
  useEffect(()=>{fetch('/api/public/catalog').then(response=>response.json()).then(data=>setCatalog(data)).catch(()=>setMessage('تعذر تحميل الهيكل الأكاديمي'))},[]);
  useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduceMotion(query.matches);update();query.addEventListener?.('change',update);return()=>query.removeEventListener?.('change',update)},[]);
  useEffect(()=>{const video=videoRef.current;if(!video)return;if(reduceMotion)video.pause();else void video.play().catch(()=>setVideoReady(false))},[reduceMotion]);
  const colleges=useMemo(()=>catalog?.colleges.filter(item=>item.universityId===form.universityId)||[],[catalog,form.universityId]);const departments=useMemo(()=>catalog?.departments.filter(item=>item.collegeId===form.collegeId)||[],[catalog,form.collegeId]);const phases=useMemo(()=>catalog?.phases.filter(item=>item.departmentId===form.departmentId)||[],[catalog,form.departmentId]);const sections=useMemo(()=>catalog?.sections.filter(item=>item.phaseId===form.phaseId)||[],[catalog,form.phaseId]);
  const setPath=(key:keyof typeof form,value:string)=>{const next={...form,[key]:value};if(key==='universityId')Object.assign(next,{collegeId:'',departmentId:'',phaseId:'',sectionId:''});if(key==='collegeId')Object.assign(next,{departmentId:'',phaseId:'',sectionId:''});if(key==='departmentId')Object.assign(next,{phaseId:'',sectionId:''});if(key==='phaseId')next.sectionId='';setForm(next)};
  const changeMode=(next:AuthMode)=>{if(busy)return;setMode(next);setMessage('');setCanResend(false);setSuccess(false)};
  const finishLogin=async()=>{setSuccess(true);if(remember){try{localStorage.setItem('kiur-remembered-email',form.email.trim())}catch{}}else{try{localStorage.removeItem('kiur-remembered-email')}catch{}}await new Promise(resolve=>setTimeout(resolve,380));if(onAuthenticated)await onAuthenticated();else window.location.reload()};
  const submit=async(event:React.FormEvent)=>{event.preventDefault();if(busy)return;setBusy(true);setMessage('');setCanResend(false);setSuccess(false);try{if(mode==='activate'){const data=await send('/api/auth/activate-staff',{token:activationToken,password:form.password});setMessage(data.message||'تم تفعيل الحساب');history.replaceState({},'', '/');setMode('login')}else if(mode==='forgot'){const data=await send('/api/auth/forgot-password',{email:form.email});setMessage(data.message);setMode('login')}else if(mode==='login'){await send('/api/auth/login',{email:form.email,password:form.password});await finishLogin()}else{const data=await send('/api/auth/register',form);setMessage(data.message||'تحقق من بريدك ثم انتظر موافقة المشرف');setMode('login')}}catch(error){const issue=error as ApiError;setMessage(issue.message);setCanResend(issue.code==='EMAIL_UNVERIFIED')}finally{setBusy(false)}};
  const resend=async()=>{if(busy)return;setBusy(true);setMessage('');try{const data=await send('/api/auth/resend-verification',{email:form.email,password:form.password});setMessage(data.message);setCanResend(false)}catch(error){setMessage((error as Error).message)}finally{setBusy(false)}};
  const returnTo=encodeURIComponent(window.location.pathname+window.location.search);
  const title=mode==='activate'?'تفعيل حساب الكادر':mode==='forgot'?'استعادة كلمة المرور':mode==='register'?'ابدأ مسارك في KIUR':'مرحبًا بعودتك';
  const subtitle=mode==='activate'?'عيّن كلمة مرور قوية لإكمال تفعيل حسابك.':mode==='forgot'?'سنرسل إلى بريدك رابطًا آمنًا لاستعادة الحساب.':mode==='register'?'أنشئ حسابك، ثم حدّد مسارك الأكاديمي بدقة.':'سجّل الدخول وتابع مسارك الطبي من حيث توقفت.';
  const submitText=mode==='activate'?'تفعيل الحساب':mode==='forgot'?'إرسال رابط الاستعادة':mode==='register'?'إنشاء حساب الطالب':'الدخول إلى KIUR';
  return <main className={'authPage authMode-'+mode} dir="rtl">
    <div className="authBackdrop" aria-hidden="true">
      {backgroundVideoUrl&&<video ref={videoRef} className={videoReady&&!reduceMotion?'ready':''} autoPlay={!reduceMotion} loop muted playsInline preload="metadata" onCanPlay={()=>setVideoReady(true)} onError={()=>setVideoReady(false)}><source src={backgroundVideoUrl} type="video/mp4"/></video>}
      <div className="authFallback"/><div className="authGrid"/><i className="authOrb orbOne"/><i className="authOrb orbTwo"/><i className="authOrb orbThree"/>
      <HeartPulse className="authFloat floatOne"/><BrainCircuit className="authFloat floatTwo"/><Microscope className="authFloat floatThree"/>
    </div>
    <section className="authCard hybridAuth" aria-labelledby="auth-title">
      <div className="authBrand"><span><HeartPulse/></span><div><b>KIUR</b><small>BY ERATRANS</small></div></div>
      <header className="authIntro"><span className="authEyebrow"><Sparkles/> بوابتك الطبية الذكية</span><h1 id="auth-title">{title}</h1><p>{subtitle}</p></header>
      {mode!=='activate'&&mode!=='forgot'&&<>
        <a className="signinButton" href={`/signin-with-chatgpt?return_to=${returnTo}`}><Sparkles/><span>المتابعة بحساب ChatGPT</span><ChevronLeft/></a>
        <div className="authDivider"><span>أو عبر البريد الإلكتروني</span></div>
        <div className="authTabs" role="tablist" aria-label="نوع الحساب"><button type="button" role="tab" aria-selected={mode==='login'} className={mode==='login'?'active':''} onClick={()=>changeMode('login')}>تسجيل الدخول</button><button type="button" role="tab" aria-selected={mode==='register'} className={mode==='register'?'active':''} onClick={()=>changeMode('register')}>حساب طالب جديد</button></div>
      </>}
      <form className="emailAuth" onSubmit={event=>void submit(event)} aria-busy={busy}>
        {mode==='register'&&<label className="authField"><span>الاسم الكامل</span><div><UserRound/><input required minLength={2} maxLength={120} autoComplete="name" placeholder="مثال: حسين ماجد" value={form.name} onChange={event=>setForm({...form,name:event.target.value})}/></div></label>}
        {mode!=='activate'&&<label className="authField"><span>البريد الإلكتروني</span><div><Mail/><input required type="email" inputMode="email" dir="ltr" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={event=>setForm({...form,email:event.target.value})}/></div></label>}
        {mode!=='forgot'&&<label className="authField"><span>كلمة المرور</span><div><LockKeyhole/><input required type={showPassword?'text':'password'} minLength={12} maxLength={128} dir="ltr" autoComplete={mode==='login'?'current-password':'new-password'} placeholder="12 حرفًا على الأقل" value={form.password} onChange={event=>setForm({...form,password:event.target.value})}/><button type="button" className="passwordToggle" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{showPassword?<EyeOff/>:<Eye/>}</button></div></label>}
        {mode==='register'&&<fieldset className="registrationPath"><legend><GraduationCap/> المسار الأكاديمي</legend><label><span>الجامعة</span><select required value={form.universityId} onChange={event=>setPath('universityId',event.target.value)}><option value="">اختر الجامعة</option>{catalog?.universities.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>الكلية</span><select required value={form.collegeId} onChange={event=>setPath('collegeId',event.target.value)}><option value="">اختر الكلية</option>{colleges.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>القسم</span><select required value={form.departmentId} onChange={event=>setPath('departmentId',event.target.value)}><option value="">اختر القسم</option>{departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>المرحلة</span><select required value={form.phaseId} onChange={event=>setPath('phaseId',event.target.value)}><option value="">اختر المرحلة</option>{phases.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="sectionSelect"><span>الشعبة (اختياري)</span><select value={form.sectionId} onChange={event=>setPath('sectionId',event.target.value)}><option value="">دون شعبة محددة</option>{sections.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label></fieldset>}
        {mode==='login'&&<div className="authOptions"><label className="rememberChoice"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/><span aria-hidden="true"/> تذكّر بريدي</label><button type="button" className="authTextButton" onClick={()=>changeMode('forgot')}>نسيت كلمة المرور؟</button></div>}
        <button className={'emailSubmit '+(success?'success':'')} disabled={busy||success}>{success?<><CheckCircle2/> تم التحقق، جارٍ فتح المنصة…</>:busy?<><LoaderCircle className="spin"/> جارٍ التحقق…</>:<><span>{submitText}</span><ChevronLeft/></>}</button>
        {mode==='forgot'&&<button type="button" className="authTextButton backToLogin" onClick={()=>changeMode('login')}>العودة إلى تسجيل الدخول</button>}{canResend&&<button type="button" className="authTextButton backToLogin" disabled={busy} onClick={()=>void resend()}>إعادة إرسال رسالة التحقق</button>}
      </form>
      {message&&<div className="authMessage" role="alert">{message}</div>}
      <footer className="authNote"><ShieldCheck/> {mode==='register'?'يلزم توثيق البريد ثم موافقة المشرف':'دخول مشفّر — لن نطلب منك مشاركة كلمة المرور'}</footer>
      {mode==='login'&&<p className="authHint"><Building2/> اضغط Enter للمتابعة</p>}
    </section>
  </main>;
}
