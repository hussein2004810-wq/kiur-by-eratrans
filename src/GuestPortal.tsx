import {useEffect,useMemo,useState} from 'react';
import {Award,BookOpen,Brain,CheckCircle2,ChevronLeft,Clock3,FileCheck,GraduationCap,HeartPulse,Search,ShieldCheck,Sparkles,Stethoscope,Trophy} from 'lucide-react';
import AuthScreen from './AuthScreen';
import './guest.css';
import {ThemeToggle} from './theme-preference';

type Item={id:string;name:string;universityId?:string;collegeId?:string;departmentId?:string;phaseId?:string;subjectId?:string};
type Catalog={universities:Item[];colleges:Item[];departments:Item[];phases:Item[];sections:Item[];subjects:Item[];lectures:Item[]};
type Test={id:string;title:string;durationMinutes:number;questionCount:number;universityId:string;collegeId:string;departmentId:string;phaseId:string;sectionId?:string;subjectId:string;lectureId:string;subjectName:string;lectureName:string;departmentName:string;phaseName:string;examMode?:string};
type GuestPath={universityId:string;collegeId:string;departmentId:string;phaseId:string;sectionId:string;subjectId:string;lectureId:string};

const empty:GuestPath={universityId:'',collegeId:'',departmentId:'',phaseId:'',sectionId:'',subjectId:'',lectureId:''};
function saved():GuestPath{try{return {...empty,...JSON.parse(localStorage.getItem('kiur-guest-path')||'{}')}}catch{return empty}}

export default function GuestPortal(){
  const [auth,setAuth]=useState(false);
  const [catalog,setCatalog]=useState<Catalog|null>(null);
  const [tests,setTests]=useState<Test[]>([]);
  const [path,setPath]=useState(saved);
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([
      fetch('/api/public/catalog').then(r=>r.json()),
      fetch('/api/public/tests').then(r=>r.json())
    ]).then(([tree,result])=>{
      setCatalog(tree);
      setTests(result.data||[]);
    }).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{try{localStorage.setItem('kiur-guest-path',JSON.stringify(path))}catch{}},[path]);

  const colleges=catalog?.colleges.filter(x=>x.universityId===path.universityId)||[];
  const departments=catalog?.departments.filter(x=>x.collegeId===path.collegeId)||[];
  const phases=catalog?.phases.filter(x=>x.departmentId===path.departmentId)||[];
  const sections=catalog?.sections.filter(x=>x.phaseId===path.phaseId)||[];
  const subjects=catalog?.subjects.filter(x=>x.phaseId===path.phaseId)||[];
  const lectures=catalog?.lectures.filter(x=>x.subjectId===path.subjectId)||[];

  const choose=(key:keyof typeof path,value:string)=>setPath(current=>{
    const next={...current,[key]:value};
    if(key==='universityId'){
      const collegeId=value?(catalog?.colleges.find(x=>x.universityId===value)?.id||''):'';
      const departmentId=collegeId?(catalog?.departments.find(x=>x.collegeId===collegeId)?.id||''):'';
      const phaseId=departmentId?(catalog?.phases.find(x=>x.departmentId===departmentId)?.id||''):'';
      Object.assign(next,{collegeId,departmentId,phaseId,sectionId:'',subjectId:'',lectureId:''});
    }
    if(key==='collegeId'){
      const departmentId=value?(catalog?.departments.find(x=>x.collegeId===value)?.id||''):'';
      const phaseId=departmentId?(catalog?.phases.find(x=>x.departmentId===departmentId)?.id||''):'';
      Object.assign(next,{departmentId,phaseId,sectionId:'',subjectId:'',lectureId:''});
    }
    if(key==='departmentId'){
      const phaseId=value?(catalog?.phases.find(x=>x.departmentId===value)?.id||''):'';
      Object.assign(next,{phaseId,sectionId:'',subjectId:'',lectureId:''});
    }
    if(key==='phaseId'){
      const subjectId=value?(catalog?.subjects.find(x=>x.phaseId===value)?.id||''):'';
      Object.assign(next,{sectionId:'',subjectId,lectureId:''});
    }
    if(key==='subjectId')next.lectureId=value?(catalog?.lectures.find(x=>x.subjectId===value)?.id||''):'';
    return next;
  });

  const visible=useMemo(()=>{
    const needle=search.trim().toLocaleLowerCase('ar');
    return tests.filter(t=>(!path.universityId||t.universityId===path.universityId)&&
      (!path.collegeId||t.collegeId===path.collegeId)&&
      (!path.departmentId||t.departmentId===path.departmentId)&&
      (!path.phaseId||t.phaseId===path.phaseId)&&
      (!path.sectionId||!t.sectionId||t.sectionId===path.sectionId)&&
      (!path.subjectId||t.subjectId===path.subjectId)&&
      (!path.lectureId||t.lectureId===path.lectureId)&&
      (!needle||[t.title,t.subjectName,t.lectureName,t.departmentName,t.phaseName].some(v=>v?.toLocaleLowerCase('ar').includes(needle)))
    );
  },[tests,path,search]);

  const start=(id:string)=>{
    try{localStorage.setItem('kiur-intended-test',id)}catch{}
    window.history.replaceState({},'',`/test/${encodeURIComponent(id)}`);
    setAuth(true);
  };

  if(auth)return <AuthScreen onBrowse={()=>{window.history.replaceState({},'', '/');setAuth(false)}}/>;

  return (
    <main className="guestPortal" dir="rtl">
      <header className="guestHeader">
        <div className="guestBrand">
          <span className="guestLogo"><HeartPulse/></span>
          <div>
            <b>KIUR</b>
            <small>BY ERATRANS • MEDICAL ACADEMY</small>
          </div>
        </div>
        <div className="guestHeaderActions">
          <ThemeToggle compact/>
          <button type="button" className="guestLoginBtn" onClick={()=>setAuth(true)}>
            <ShieldCheck/>
            <span>دخول الأطباء والطلبة</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="guestHero">
        <span className="guestHeroBadge">
          <Sparkles/> المنظومة الطبية والتقييم السريري التفاعلي في العراق
        </span>
        <h1>المرجع السريري الذكي لطلبة وأطباء العراق</h1>
        <p>
          بيئة تدريب وامتحانات طبية متكاملة مصممة وفق المعايير الأكاديمية للكليات الطبية، بحالات مصورة، تكرار متباعد، وشهادات معتمدة فورية.
        </p>

        {/* Live Vitals Indicator */}
        <div className="guestVitalsStrip">
          <div className="guestVital">
            <span className="vitalDot pulse"/>
            <span>SpO₂ <b>98%</b></span>
          </div>
          <div className="guestVital">
            <HeartPulse size={14}/>
            <span>HR <b>72 bpm</b></span>
          </div>
          <div className="guestVital">
            <FileCheck size={14}/>
            <span>{tests.length} اختبار متاح</span>
          </div>
          <div className="guestVital">
            <Stethoscope size={14}/>
            <span>حالات سريرية مصورة</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="guestSearchWrap">
          <Search/>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="ابحث عن مادة، محاضرة أو اختبار سريري..."
            aria-label="بحث في بنك الاختبارات"
          />
          {search&&<button type="button" className="guestClearSearch" onClick={()=>setSearch('')}>مسح</button>}
        </div>

        {/* Quick Filter Tags */}
        <div className="guestQuickTags">
          <span>شائع الآن:</span>
          {['الطب الباطني','الجراحة العامة','طب الأطفال','النسائية والتوليد','علم الأدوية','التشريح'].map(tag=>(
            <button type="button" key={tag} onClick={()=>setSearch(tag)}>{tag}</button>
          ))}
        </div>
      </section>

      {/* Medical Bento Showcase */}
      <section className="guestBentoSection">
        <div className="guestSectionHeader">
          <small>مميزات المنظومة السريرية</small>
          <h2>تقنيات متقدمة لبناء التفكير التشخيصي</h2>
        </div>

        <div className="guestBentoGrid">
          <article className="guestBentoCard featureBento">
            <div className="bentoIcon"><Stethoscope/></div>
            <span className="bentoPill">Split View Mode</span>
            <h3>حالات سريرية بأسلوب الفحص المزدوج</h3>
            <p>عرض تفاعلي متزامن لصورة الأشعة السينية، رنين المغناطيسي، أو تخطيط القلب إلى جانب السؤال لتشخيص واقعي.</p>
            <div className="miniSplitPreview">
              <div className="miniImagePane">
                <span className="ecgMiniLine"/>
                <small>ECG Lead II: Sinus Rhythm</small>
              </div>
              <div className="miniQuestions">
                <span>1. خيار تشخيصي أول</span>
                <span className="activeMini">2. التشخيص المعتمد ✓</span>
              </div>
            </div>
          </article>

          <article className="guestBentoCard">
            <div className="bentoIcon amber"><Brain/></div>
            <span className="bentoPill">Adaptive Engine</span>
            <h3>خوارزمية التكرار المتباعد</h3>
            <p>تحليل تلقائي لأنماط الأخطاء في الإجابات وإعادة جدولة الأسئلة المحورية لترسيخ المعلومة في الذاكرة طويلة المدى.</p>
          </article>

          <article className="guestBentoCard">
            <div className="bentoIcon blue"><Award/></div>
            <span className="bentoPill">Verified QR</span>
            <h3>شهادات إنجاز موثقة فورية</h3>
            <p>إصدار شهادات أكاديمية رقمية لكل اختبار رسمي مجتاز، مزودة برمز QR فريد للتحقق الفوري من صحة النتيجة.</p>
          </article>

          <article className="guestBentoCard">
            <div className="bentoIcon purple"><Trophy/></div>
            <span className="bentoPill">Clinical Ranks</span>
            <h3>سلّم الرتب الطبية والتحفيز</h3>
            <p>تدرّج من طبيب متدرب (Intern) إلى طبيب استشاري (Consultant) مع كل إنجاز تحققه داخل قاعات المنصة.</p>
          </article>
        </div>
      </section>

      {/* Academic Catalog Hierarchy Path */}
      <section className="guestPath">
        <div className="guestPathHeader">
          <GraduationCap/>
          <div>
            <b>تحديد المسار الأكاديمي</b>
            <small>اختر جامعتك، كليتك، مرحلتك، ومادتك لعرض الاختبارات المناسبة لك</small>
          </div>
        </div>
        <div className="guestSelectors">
          <Select label="الجامعة" value={path.universityId} items={catalog?.universities||[]} onChange={v=>choose('universityId',v)}/>
          <Select label="الكلية" value={path.collegeId} items={colleges} onChange={v=>choose('collegeId',v)}/>
          <Select label="القسم" value={path.departmentId} items={departments} onChange={v=>choose('departmentId',v)}/>
          <Select label="المرحلة" value={path.phaseId} items={phases} onChange={v=>choose('phaseId',v)}/>
          <Select label="الشعبة" value={path.sectionId} items={sections} onChange={v=>choose('sectionId',v)} optional/>
          <Select label="المادة" value={path.subjectId} items={subjects} onChange={v=>choose('subjectId',v)}/>
          <Select label="المحاضرة" value={path.lectureId} items={lectures} onChange={v=>choose('lectureId',v)}/>
        </div>
      </section>

      {/* Available Tests Cards Grid */}
      <section className="guestResults">
        <header className="guestResultsHeader">
          <div>
            <h2>الاختبارات السريرية المتاحة</h2>
            <p>{visible.length} اختبار مطابق لاختياراتك الحالية</p>
          </div>
          {search&&<button type="button" className="guestResetBtn" onClick={()=>setSearch('')}>مسح التصفية</button>}
        </header>

        <div className="guestCardsGrid">
          {visible.map(test=>(
            <article key={test.id} className="guestTestCard">
              <div className="guestCardHead">
                <span className="guestCardTag">{test.subjectName||'مادة سريرية'}</span>
                {test.examMode==='formal'&&<span className="guestFormalTag">امتحان رسمي</span>}
              </div>
              <h3>{test.title}</h3>
              <p className="guestLectureName">{test.lectureName||'المحاضرة'}</p>
              <div className="guestCardMeta">
                <span><Clock3/> {test.durationMinutes} دقيقة</span>
                <span><BookOpen/> {test.questionCount} أسئلة</span>
              </div>
              <button type="button" className="guestStartBtn" onClick={()=>start(test.id)}>
                <span>بدء التقييم السريري</span>
                <ChevronLeft/>
              </button>
            </article>
          ))}
        </div>

        {loading&&<div className="guestStatusState"><p>جارٍ تحميل بنك الاختبارات السريرية…</p></div>}
        {!loading&&!visible.length&&(
          <div className="guestStatusState empty">
            <BookOpen/>
            <h3>لا توجد اختبارات مطابقة</h3>
            <p>جرّب اختيار قسم أو مرحلة أخرى، أو امسح شريط البحث لعرض كافة الاختبارات المتوفرة.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function Select({label,value,items,onChange,optional=false}:{label:string;value:string;items:Item[];onChange:(value:string)=>void;optional?:boolean}){
  return (
    <label className="guestField">
      <span>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)}>
        <option value="">{optional?'الكل / دون تحديد':`كل ${label}`}</option>
        {items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
  );
}
