import { useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  FileCheck,
  GraduationCap,
  HeartPulse,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  Zap,
  Check,
  AlertCircle
} from 'lucide-react';
import { ThemeToggle } from '../../theme-preference';
import '../stitch.css';

export type CatalogItem = {
  id: string;
  name: string;
  universityId?: string;
  collegeId?: string;
  departmentId?: string;
  phaseId?: string;
  subjectId?: string;
};

export type Catalog = {
  universities: CatalogItem[];
  colleges: CatalogItem[];
  departments: CatalogItem[];
  phases: CatalogItem[];
  sections: CatalogItem[];
  subjects: CatalogItem[];
  lectures: CatalogItem[];
};

export type PublicTest = {
  id: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  universityId: string;
  collegeId: string;
  departmentId: string;
  phaseId: string;
  sectionId?: string;
  subjectId: string;
  lectureId: string;
  subjectName: string;
  lectureName: string;
  departmentName: string;
  phaseName: string;
  examMode?: string;
};

export type GuestPath = {
  universityId: string;
  collegeId: string;
  departmentId: string;
  phaseId: string;
  sectionId: string;
  subjectId: string;
  lectureId: string;
};

interface StitchPublicLandingProps {
  onStartAuth?: () => void;
  onStart?: () => void;
  catalog?: Catalog | null;
  tests?: PublicTest[];
  path?: GuestPath;
  onSelectPath?: (key: keyof GuestPath, value: string) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  visibleTests?: PublicTest[];
  loading?: boolean;
  onStartTest?: (id: string) => void;
}

export default function StitchPublicLanding({
  onStartAuth,
  onStart,
  catalog = null,
  tests = [],
  path = { universityId: '', collegeId: '', departmentId: '', phaseId: '', sectionId: '', subjectId: '', lectureId: '' },
  onSelectPath = () => {},
  search = '',
  onSearchChange = () => {},
  visibleTests = [],
  loading = false,
  onStartTest = () => {},
}: StitchPublicLandingProps) {
  const [vignetteAnswer, setVignetteAnswer] = useState<'A' | 'B' | null>('B');
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const colleges = catalog?.colleges?.filter(x => x.universityId === path.universityId) || [];
  const departments = catalog?.departments?.filter(x => x.collegeId === path.collegeId) || [];
  const phases = catalog?.phases?.filter(x => x.departmentId === path.departmentId) || [];
  const sections = catalog?.sections?.filter(x => x.phaseId === path.phaseId) || [];
  const subjects = catalog?.subjects?.filter(x => x.phaseId === path.phaseId) || [];
  const lectures = catalog?.lectures?.filter(x => x.subjectId === path.subjectId) || [];

  const faqs = [
    {
      q: 'هل المنصة متوافقة مع امتحانات البورد العراقي والتراخيص العربية (SMLE / IFOM)؟',
      a: 'نعم، تم تدقيق كافة بنوك الأسئلة والسيناريوهات السريرية وفق المعايير المعتمدة لكليات الطب العراقية والمجلس العربي للاختصاصات الصحية، بالإضافة إلى امتحانات الكفاءة الوزارية والتراخيص الدولية.'
    },
    {
      q: 'هل أحتاج إلى بطاقة مصرفية أو اشتراك مدفوع للبدء؟',
      a: 'لا، تتيح المنصة وصولاً مجانياً للأساسيات السريرية وبنك الاختبارات العام لجميع الطلبة والأطباء دون الحاجة لإدخال أي بطاقة دفع.'
    },
    {
      q: 'كيف تعمل خوارزمية التكرار المتباعد (Spaced Repetition)؟',
      a: 'تقوم المنظومة بمراقبة أخطائك بدقة وحساب زمن استجابتك لكل سيناريو. إذا تعثرت في مفهوم دوائي أو تشخيصي، تتم إعادة جدولة السؤال تلقائياً بعد 3 أيام ثم 7 أيام لضمان ثبات المعلومة في الذاكرة السريرية الدائمة.'
    },
    {
      q: 'هل تصدر المنصة شهادات معتمدة بعد إنهاء الاختبارات الرسمية؟',
      a: 'نعم، يحصل الممتحن فور إنهاء الاختبار الرسمي على وثيقة إنجاز إلكترونية مزودة برمز QR فريد للتحقق الأكاديمي الفوري من صحة النتيجة وتفاصيل الأداء.'
    }
  ];

  return (
    <div className="stitchLanding" dir="rtl">
      {/* Top Clinical Trust & Operational Status Bar */}
      <div className="stitchStatusBanner">
        <div className="stitchStatusContainer">
          <div className="stitchStatusRight">
            <span className="stitchStatusPulse">
              <span className="stitchPulseDot" />
              تحديث بنك الأسئلة السريري: ربيع 2026 متاح الآن
            </span>
            <span className="stitchStatusDivider">|</span>
            <span className="stitchStatusBadge">
              <ShieldCheck size={14} className="text-secondary" />
              مطابق لمعايير الامتحانات السريرية المحوسبة SCFHS و IFOM والبورد العراقي
            </span>
          </div>
          <div className="stitchStatusLeft">
            <span className="stitchUptime">زمن الاستجابة للأنظمة: 99.98%</span>
            <a href="#catalog-section" className="stitchPortalLink">
              بوابات كليات الطب والجامعات ←
            </a>
          </div>
        </div>
      </div>

      {/* Main Academic Sticky Header */}
      <header className="stitchLandingHeader">
        <div className="stitchLandingHeaderInner">
          <div className="stitchBrandArea">
            <a href="#" className="stitchLogoGroup">
              <div className="stitchLogoIcon">
                <HeartPulse size={24} />
              </div>
              <div className="stitchBrandTexts">
                <span className="stitchBrandName">منصة نبض الطبية</span>
                <span className="stitchBrandSub">MEDPULSE ACADEMIC • KIUR</span>
              </div>
            </a>

            <nav className="stitchNavLinks">
              <a href="#hero" className="active">الرئيسية</a>
              <a href="#features">المميزات</a>
              <a href="#catalog-section">بنك الأسئلة</a>
              <a href="#how-it-works">كيف تعمل المنصة؟</a>
              <a href="#faqs">الأسئلة الشائعة</a>
            </nav>
          </div>

          <div className="stitchHeaderActions">
            <ThemeToggle compact />
            <button
              type="button"
              className="stitchBtn stitchBtnGhost"
              onClick={() => onStart ? onStart() : onStartAuth?.()}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              className="stitchBtn stitchBtnPrimary"
              onClick={() => onStart ? onStart() : onStartAuth?.()}
            >
              <Sparkles size={16} />
              <span>ابدأ مجاناً</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="stitchLandingHero" id="hero">
        <div className="stitchLandingContainer">
          <div className="stitchHeroContent">
            <div className="stitchHeroPill">
              <Stethoscope size={16} />
              <span>منظومة التحضير والتقييم السريري الرقمية المتقدمة</span>
            </div>

            <h1 className="stitchHeroTitle">
              استعد لامتحاناتك الطبية بوضوح أكبر
            </h1>

            <p className="stitchHeroDesc">
              حل الأسئلة، اختبر نفسك، افهم نقاط ضعفك، ونظّم دراستك في منصة متكاملة مصممة خصيصاً لطلبة وأطباء المجموعة الطبية بدون تشتيت، وبأعلى معايير الإحكام العلمي.
            </p>

            <div className="stitchHeroCtas">
              <button
                type="button"
                className="stitchBtn stitchBtnLgPrimary"
                onClick={() => onStart ? onStart() : onStartAuth?.()}
              >
                <span>ابدأ مجاناً الآن</span>
                <ChevronLeft size={20} />
              </button>
              <a href="#catalog-section" className="stitchBtn stitchBtnLgSecondary">
                <Search size={18} />
                <span>استكشف بنك الاختبارات ({tests.length} اختبار متاح)</span>
              </a>
            </div>

            <div className="stitchTrustPillars">
              <span className="stitchPillarItem">
                <CheckCircle2 size={16} className="text-secondary" />
                بدون بطاقة بنكية للبدء
              </span>
              <span className="stitchDotSep">•</span>
              <span className="stitchPillarItem">
                <Zap size={16} className="text-secondary" />
                وصول فوري للأساسيات السريرية
              </span>
              <span className="stitchDotSep">•</span>
              <span className="stitchPillarItem">
                <GraduationCap size={16} className="text-secondary" />
                تكامل مباشر مع الجامعات وكليات الطب
              </span>
            </div>
          </div>

          {/* Live Real Academic Platform Statistics & Preview */}
          <div className="stitchWorkspacePreviewCard">
            <div className="stitchPreviewTopBar">
              <div className="stitchPreviewTitleGroup">
                <div className="stitchPreviewIcon">
                  <Activity size={20} />
                </div>
                <div>
                  <h4>لوحة المنظومة الأكاديمية الطبية الحية</h4>
                  <p>البيانات المعتمدة لكليات الطب والجامعات العراقية المربوطة بالمنظومة</p>
                </div>
              </div>
              <div className="stitchPreviewBadges">
                <span className="stitchCountdownTag">
                  <Clock3 size={14} /> {tests.length} اختباراً سريرياً متاحاً
                </span>
                <span className="stitchStatusTag">
                  <span className="stitchDotLive" /> النظام متصل ونشط
                </span>
              </div>
            </div>

            {/* Metrics Bento Grid with REAL numbers */}
            <div className="stitchPreviewMetricsGrid">
              <div className="stitchMetricTile">
                <div className="stitchMetricTileHeader">
                  <span>بنك الأسئلة المعتمد</span>
                  <Award size={16} className="text-secondary" />
                </div>
                <div className="stitchMetricTileValue">
                  <h3>{tests.reduce((acc, t) => acc + (t.questionCount || 0), 0) || tests.length}</h3>
                  <span className="stitchPositiveTrend">سؤال سريري وتدريبي</span>
                </div>
                <div className="stitchMetricProgressTrack">
                  <div className="stitchMetricProgressFill sec" style={{ width: '85%' }} />
                </div>
              </div>

              <div className="stitchMetricTile">
                <div className="stitchMetricTileHeader">
                  <span>الاختبارات المنشورة</span>
                  <Target size={16} className="text-primary" />
                </div>
                <div className="stitchMetricTileValue">
                  <h3>{tests.length}</h3>
                  <span className="stitchMutedSub">اختباراً موقوتاً وتدريبياً</span>
                </div>
                <div className="stitchMetricProgressTrack">
                  <div className="stitchMetricProgressFill prim" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="stitchMetricTile">
                <div className="stitchMetricTileHeader">
                  <span>المواد والمحاضرات الموثقة</span>
                  <BookOpen size={16} />
                </div>
                <div className="stitchMetricTileValue">
                  <h3>{catalog?.subjects?.length || 0}</h3>
                  <span className="stitchMutedSub">مادة سريرية وأكاديمية</span>
                </div>
                <span className="stitchMetricTagSuccess">محدثة حسب متطلبات العام</span>
              </div>

              <div className="stitchMetricTile">
                <div className="stitchMetricTileHeader">
                  <span>الجامعات والكليات</span>
                  <GraduationCap size={16} className="text-secondary" />
                </div>
                <div className="stitchMetricTileValue">
                  <h3>{catalog?.universities?.length || 1}</h3>
                  <span className="stitchMutedSub">جامعة • {catalog?.colleges?.length || 1} كليات</span>
                </div>
                <a href="#catalog-section" className="stitchMetricLink">
                  استعراض الهيكل الأكاديمي ←
                </a>
              </div>
            </div>

            {/* Featured Live Tests */}
            {tests.length > 0 && (
              <div className="stitchMasterySection">
                <div className="stitchMasteryHeader">
                  <b>نماذج من الاختبارات السريرية المتاحة الآن</b>
                  <span>اضغط على أي اختبار للبدء الفوري</span>
                </div>
                <div className="stitchMasteryGrid">
                  {tests.slice(0, 3).map(t => (
                    <div key={t.id} className="stitchMasteryCard" style={{ cursor: 'pointer' }} onClick={() => onStartTest(t.id)}>
                      <div className="stitchMasteryCardHead">
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{t.title}</span>
                        <b className="text-primary">{t.questionCount} سؤالاً</b>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--stitch-text-muted)', marginTop: '4px' }}>
                        <span>{t.subjectName || (t as any).subject}</span>
                        <span>{t.durationMinutes} دقيقة</span>
                      </div>
                      <button
                        type="button"
                        className="stitchBtn stitchBtnPrimary"
                        style={{ width: '100%', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}
                        onClick={e => { e.stopPropagation(); onStartTest(t.id); }}
                      >
                        ابدأ هذا الاختبار الآن ←
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* 4 Core Academic Pillars Section */}
      <section className="stitchPillarsSection" id="features">
        <div className="stitchLandingContainer">
          <div className="stitchPillarsGrid">
            <div className="stitchPillarCard">
              <div className="stitchPillarIconBox">
                <Stethoscope size={24} />
              </div>
              <h3>بنك أسئلة سريري تفاعلي</h3>
              <p>سيناريوهات علاجية محكّمة ومحدثة لعام 2026، متوافقة مع مناهج كليات الطب وامتحانات البورد والتراخيص المهنية وفق المحتوى الأكاديمي المعتمد.</p>
              <span className="stitchPillarNote">تحديث أسبوعي للحالات السريرية</span>
            </div>

            <div className="stitchPillarCard">
              <div className="stitchPillarIconBox">
                <Clock3 size={24} />
              </div>
              <h3>اختبارات تجريبية موقوتة</h3>
              <p>محاكاة تامة ودقيقة لشاشات الامتحانات الوطنية الرسمية، بنفس المؤقت وسرعة الاستجابة والجداول المرجعية للمختبرات.</p>
              <span className="stitchPillarNote">نفس برمجية Prometric و Pearson</span>
            </div>

            <div className="stitchPillarCard">
              <div className="stitchPillarIconBox">
                <Activity size={24} />
              </div>
              <h3>تحليل تشخيصي دقيق</h3>
              <p>كشف دقيق لمناطق الفهم السطحي وتوزيع زمن التفكير في كل خيار، لتجنب نفاد الوقت في الامتحان الواقعي.</p>
              <span className="stitchPillarNote">تشخيص زمني بالثواني لكل سؤال</span>
            </div>

            <div className="stitchPillarCard">
              <div className="stitchPillarIconBox">
                <Brain size={24} />
              </div>
              <h3>خطة دراسة ومركز مراجعة</h3>
              <p>توزيع مؤتمت للأسئلة المتبقية بناءً على تاريخ اختبارك، مع إعادة طرح الأخطاء تلقائياً وفق تقنية التكرار المتباعد.</p>
              <span className="stitchPillarNote">Spaced-Repetition System مدمج</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="stitchHowSection" id="how-it-works">
        <div className="stitchLandingContainer">
          <div className="stitchSectionHeader">
            <span className="stitchSectionSub">المسار الأكاديمي المنهجي</span>
            <h2 className="stitchSectionTitle">كيف تعمل المنصة؟</h2>
            <p className="stitchSectionLead">
              خطوات واضحة وقابلة للتطبيق تنقلك من مرحلة التشتت بين المذكرات المتفرقة إلى التحضير السريري المتزن والمرتّب.
            </p>
          </div>

          <div className="stitchStepsGrid">
            <div className="stitchStepCard">
              <div className="stitchStepNumber">1</div>
              <h4>اختر التخصص والأنظمة السريرية</h4>
              <p>حدد المواد أو الأجهزة (Cardiovascular, Renal, GI) ونمط الأسئلة المستهدف سواءً كانت أسئلة لم يسبق حلها، أو أسئلة متعثرة.</p>
            </div>
            <div className="stitchStepCard">
              <div className="stitchStepNumber">2</div>
              <h4>تدرّب بوضع الشرح الفوري أو المحاكاة</h4>
              <p>اختر وضع التدريب (Tutor Mode) للاطلاع على التعليل والفسيولوجيا فوراً، أو وضع الامتحان الموقوت (Timed Mode) لتطوير السرعة.</p>
            </div>
            <div className="stitchStepCard">
              <div className="stitchStepNumber">3</div>
              <h4>حلّل أخطاءك في مركز المراجعة</h4>
              <p>يقوم النظام بتجميع كل سؤال أخطأت فيه وربطه بالمفهوم الفسيولوجي المقابل حتى تعيد اختباره بعد 3 إلى 7 أيام لإتقانه.</p>
            </div>
            <div className="stitchStepCard">
              <div className="stitchStepNumber">4</div>
              <h4>اتبع خطتك المجدولة حتى يوم الاختبار</h4>
              <p>شاهد نسبة اكتمال المنهاج ترتفع يومياً، وادخل الاختبار النهائي بثقة مبنية على أرقام واقعية وساعات تدريب سريرية دقيقة.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Academic Catalog & Tests Explorer */}
      <section className="stitchCatalogSection" id="catalog-section">
        <div className="stitchLandingContainer">
          <div className="stitchSectionHeader">
            <span className="stitchSectionSub">تصفح بنك الاختبارات الحية</span>
            <h2 className="stitchSectionTitle">اختر مسارك الأكاديمي وابدأ الاختبار</h2>
            <p className="stitchSectionLead">
              اختر جامعتك، كليتك، مرحلتك، ومادتك للاطلاع على الاختبارات السريرية المتاحة فوراً.
            </p>
          </div>

          {/* Search Bar */}
          <div className="stitchSearchContainer">
            <Search size={20} className="stitchSearchIcon" />
            <input
              type="text"
              className="stitchSearchInput"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="ابحث باسم المادة، المحاضرة، أو الاختبار السريري..."
              aria-label="بحث في بنك الاختبارات"
            />
            {search && (
              <button
                type="button"
                className="stitchSearchClearBtn"
                onClick={() => onSearchChange('')}
              >
                مسح
              </button>
            )}
          </div>

          {/* Quick Tags */}
          <div className="stitchQuickTags">
            <span>شائع الآن:</span>
            {['الطب الباطني', 'الجراحة العامة', 'طب الأطفال', 'النسائية والتوليد', 'علم الأدوية', 'التشريح'].map(tag => (
              <button
                type="button"
                key={tag}
                className="stitchTagBtn"
                onClick={() => onSearchChange(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Catalog Path Dropdowns */}
          <div className="stitchSelectorsGrid">
            <div className="stitchSelectorField">
              <label>الجامعة</label>
              <select
                value={path.universityId}
                onChange={e => onSelectPath('universityId', e.target.value)}
              >
                <option value="">كل الجامعات</option>
                {(catalog?.universities || []).map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="stitchSelectorField">
              <label>الكلية</label>
              <select
                value={path.collegeId}
                onChange={e => onSelectPath('collegeId', e.target.value)}
              >
                <option value="">كل الكليات</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="stitchSelectorField">
              <label>القسم</label>
              <select
                value={path.departmentId}
                onChange={e => onSelectPath('departmentId', e.target.value)}
              >
                <option value="">كل الأقسام</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="stitchSelectorField">
              <label>المرحلة</label>
              <select
                value={path.phaseId}
                onChange={e => onSelectPath('phaseId', e.target.value)}
              >
                <option value="">كل المراحل</option>
                {phases.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="stitchSelectorField">
              <label>المادة السريرية</label>
              <select
                value={path.subjectId}
                onChange={e => onSelectPath('subjectId', e.target.value)}
              >
                <option value="">كل المواد</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="stitchSelectorField">
              <label>المحاضرة</label>
              <select
                value={path.lectureId}
                onChange={e => onSelectPath('lectureId', e.target.value)}
              >
                <option value="">كل المحاضرات</option>
                {lectures.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Cards Header */}
          <div className="stitchTestsListHeader">
            <div>
              <h3>الاختبارات السريرية المتاحة</h3>
              <p>{visibleTests.length} اختبار مطابق لاختياراتك الحالية</p>
            </div>
            {search && (
              <button
                type="button"
                className="stitchResetFilterBtn"
                onClick={() => onSearchChange('')}
              >
                إلغاء التصفية
              </button>
            )}
          </div>

          {/* Tests Cards Grid */}
          <div className="stitchTestsGrid">
            {visibleTests.map(test => (
              <article key={test.id} className="stitchTestCard">
                <div className="stitchTestCardHead">
                  <span className="stitchTestSubjectTag">{test.subjectName || 'مادة سريرية'}</span>
                  {test.examMode === 'formal' && (
                    <span className="stitchFormalTag">امتحان رسمي موقوت</span>
                  )}
                </div>

                <h4 className="stitchTestTitle">{test.title}</h4>
                <p className="stitchTestLecture">{test.lectureName || 'المحاضرة العامة'}</p>

                <div className="stitchTestMeta">
                  <span><Clock3 size={14} /> {test.durationMinutes} دقيقة</span>
                  <span><FileCheck size={14} /> {test.questionCount} سؤالاً</span>
                </div>

                <button
                  type="button"
                  className="stitchTestStartBtn"
                  onClick={() => onStartTest(test.id)}
                >
                  <span>بدء التقييم السريري</span>
                  <ChevronLeft size={16} />
                </button>
              </article>
            ))}
          </div>

          {loading && (
            <div className="stitchStateBox">
              <p>جارٍ تحميل بنك الاختبارات السريرية المباشرة…</p>
            </div>
          )}

          {!loading && !visibleTests.length && (
            <div className="stitchStateBox empty">
              <BookOpen size={36} />
              <h4>لا توجد اختبارات مطابقة للتصفية الحالية</h4>
              <p>جرّب اختيار قسم أو مرحلة أخرى، أو امسح شريط البحث لعرض كافة الاختبارات المتوفرة.</p>
            </div>
          )}
        </div>
      </section>

      {/* FAQs Section */}
      <section className="stitchFaqSection" id="faqs">
        <div className="stitchLandingContainer">
          <div className="stitchSectionHeader">
            <span className="stitchSectionSub">إجابات استفسارات الطلبة والأطباء</span>
            <h2 className="stitchSectionTitle">الأسئلة الشائعة</h2>
          </div>

          <div className="stitchFaqList">
            {faqs.map((faq, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div
                  key={faq.q}
                  className={`stitchFaqItem ${isOpen ? 'open' : ''}`}
                >
                  <button
                    type="button"
                    className="stitchFaqQuestionBtn"
                    onClick={() => setFaqOpen(isOpen ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`stitchFaqChevron ${isOpen ? 'rotate' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="stitchFaqAnswer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="stitchCtaSection">
        <div className="stitchLandingContainer">
          <div className="stitchCtaBox">
            <h2>انضم الآن إلى مجتمع الأطباء والطلبة المتميزين</h2>
            <p>ابدأ تدريبك السريري اليوم مجاناً واستعد لامتحاناتك القادمة بأعلى درجات الثقة والإحكام الأكاديمي.</p>
            <div className="stitchCtaButtons">
              <button
                type="button"
                className="stitchBtn stitchBtnLgPrimary"
                onClick={onStartAuth}
              >
                <span>إنشاء حساب أكاديمي مجاني</span>
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="stitchBtn stitchBtnLgGhost"
                onClick={onStartAuth}
              >
                تسجيل الدخول للمنظومة
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Footer */}
      <footer className="stitchLandingFooter">
        <div className="stitchLandingContainer">
          <div className="stitchFooterGrid">
            <div className="stitchFooterBrandCol">
              <div className="stitchLogoGroup">
                <div className="stitchLogoIcon">
                  <HeartPulse size={22} />
                </div>
                <div>
                  <b className="stitchBrandName">منصة نبض الطبية</b>
                  <small className="stitchBrandSub">MEDPULSE ACADEMIC • KIUR</small>
                </div>
              </div>
              <p className="stitchFooterDesc">
                المنظومة الأكاديمية والسريرية المحوسبة لطلبة وأطباء كليات الطب في العراق والوطن العربي.
              </p>
            </div>

            <div className="stitchFooterCol">
              <h5>المنصة</h5>
              <a href="#hero">الرئيسية</a>
              <a href="#features">المميزات السريرية</a>
              <a href="#catalog-section">بنك الاختبارات</a>
              <a href="#how-it-works">كيف تعمل المنصة؟</a>
            </div>

            <div className="stitchFooterCol">
              <h5>التراخيص والامتحانات</h5>
              <a href="#catalog-section">البورد العراقي</a>
              <a href="#catalog-section">الامتحانات التقويمية والسريرية المعتمدة</a>
              <a href="#catalog-section">امتحانات IFOM السريرية</a>
              <a href="#catalog-section">التقييم الشامل لخريجي الطب</a>
            </div>

            <div className="stitchFooterCol">
              <h5>المساعدة والدعم</h5>
              <a href="#faqs">الأسئلة الشائعة</a>
              <a href="mailto:support@kiur-iraq.com">تواصل مع الدعم الأكاديمي</a>
              <button type="button" onClick={onStartAuth} className="text-right hover:underline">
                بوابة الكادر التدريسي
              </button>
            </div>
          </div>

          <div className="stitchFooterBottom">
            <p>© 2026 منصة نبض الطبية (KIUR by ERATRANS). جميع الحقوق محفوظة لطلبة وأطباء المجموعة الطبية.</p>
            <div className="stitchFooterDisclaimer">
              إخلاء مسؤولية: المنصة للأغراض التعليمية والتحضير للامتحانات الأكاديمية ولا تقدم استشارات طبية للمرضى.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
