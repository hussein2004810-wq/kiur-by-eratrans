import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Flag, 
  Calculator, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  RotateCcw, 
  X, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Layers, 
  BarChart3, 
  TrendingUp, 
  BookOpen
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export interface ExamQuestion {
  id: string;
  code: string;
  specialty: string;
  subspecialty: string;
  vignette: string;
  patientHistory: string;
  physicalExam: string;
  labs?: { test: string; result: string; normal: string; unit: string }[];
  stem: string;
  options: { id: string; letter: string; text: string; isCorrect: boolean }[];
}

const SAMPLE_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 'q-5119',
    code: 'Q-5119',
    specialty: 'الطب الباطني',
    subspecialty: 'أمراض الكلى والغدد الصماء (Nephrology & Endocrine)',
    vignette: 'سيدة تبلغ من العمر 58 عاماً، تراجع العيادة الباطنية بعد تحويلها من عيادة الرعاية الأولية بسبب شعور متزايد بالوهن العام، التعب المزمن، غثيان متكرر، ونوبات من التشوش الذهني الخفيف على مدار الأسبوعين الماضيين.',
    patientHistory: 'تعاني من سرطان الثدي المنتشر مع نقائل عظمية (Metastatic breast cancer) شُخص قبل 8 أشهر، وتتلقى علاجاً هرمونياً مضاداً للأستروجين. المريضة لا تدخن، وتنفي تناول أي مستحضرات عشبية أو أدوية مدرة للبول.',
    physicalExam: 'المريضة تبدو هزيلة وجافة الأغشية المخاطية مع تراجع مرونة الجلد (Signs of dehydration). ضغط الدم 118/74 mmHg، معدل النبض 84 bpm منتظم، معدل التنفس 16/min، ودرجة الحرارة 37.1 °C. الفحص العصبي يُظهر بطء الاستجابة المنعكسة وتشتت الانتباه دون عجز بؤري.',
    labs: [
      { test: 'Serum Calcium (Total)', result: '13.8', normal: '8.5 - 10.2', unit: 'mg/dL' },
      { test: 'Serum Albumin', result: '3.2', normal: '3.5 - 5.0', unit: 'g/dL' },
      { test: 'Serum Potassium (K⁺)', result: '3.9', normal: '3.5 - 5.0', unit: 'mEq/L' },
      { test: 'Serum Creatinine', result: '1.6', normal: '0.6 - 1.1', unit: 'mg/dL' },
      { test: 'Blood Urea Nitrogen (BUN)', result: '32', normal: '7 - 20', unit: 'mg/dL' }
    ],
    stem: 'ما هي الخطوة العلاجية الإسعافية الأولى والأكثر إلحاحاً لتثبيت حالة المريضة والوقاية من المضاعفات الكلوية والقلبية الحادة؟',
    options: [
      { id: 'opt-1', letter: 'A', text: 'تسريب وريدي فوري لمحلول ملحي نظامي متساوي التوتر (Normal Saline 0.9% IV)', isCorrect: true },
      { id: 'opt-2', letter: 'B', text: 'إعطاء جرعة فورية من مدرات البول العروية فوروسيميد (IV Furosemide)', isCorrect: false },
      { id: 'opt-3', letter: 'C', text: 'تسريب وريدي لمضادات ارتشاف العظم كحمض الزوليدرونيك (IV Zoledronic acid)', isCorrect: false },
      { id: 'opt-4', letter: 'D', text: 'إعطاء حقن هيدروكورتيزون وريدياً (IV Hydrocortisone 100 mg)', isCorrect: false },
      { id: 'opt-5', letter: 'E', text: 'جلسة غسيل كلوي دموية عاجلة (Emergency Hemodialysis)', isCorrect: false }
    ]
  },
  {
    id: 'q-5120',
    code: 'Q-5120',
    specialty: 'الجراحة العامة',
    subspecialty: 'طوارئ البطن والإصابات (Acute Abdomen)',
    vignette: 'شاب يبلغ من العمر 26 عاماً، يحضر إلى الطوارئ بألم بطني حاد بدأ حول السرة منذ 14 ساعة ثم تركز تدريجياً في الحفرة الحرقفية اليمنى (Right lower quadrant). يصاحبه غثيان وفقدان تام للشهية وارتفاع خفيف بالحرارة (38.2 °C).',
    patientHistory: 'لا توجد سوابق مرضية أو جراحية. لا يتناول أي أدوية منتظمة.',
    physicalExam: 'ألم بالجس ومضض ارتدادي واضح في نقطة ماكبورني (McBurney point tenderness with rebound tenderness). علامة روفسينغ إيجابية (Positive Rovsing sign).',
    stem: 'ما هو التدبير السريري الجراحي القياسي الأكثر ملائمة بعد إعطاء السوائل الوريدية والمسكنات؟',
    options: [
      { id: 'opt-21', letter: 'A', text: 'استئصال الزائدة الدودية بالمنظار العاجل (Laparoscopic Appendectomy)', isCorrect: true },
      { id: 'opt-22', letter: 'B', text: 'تصوير مقطعي محوسب بالأمواج فوق الصوتية فقط مع مراقبة 24 ساعة', isCorrect: false },
      { id: 'opt-23', letter: 'C', text: 'علاج بالمضادات الحيوية الفموية في المنزل مع مراجعة بعد 48 ساعة', isCorrect: false },
      { id: 'opt-24', letter: 'D', text: 'تنظير قولون إسعافي لنفي داء كرون المعوي (Colonoscopy)', isCorrect: false }
    ]
  }
];

export function StitchExamPlayer({ onFinishExam }: { onFinishExam?: () => void }) {
  const { setView, notify } = useStitch();
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [strikethroughs, setStrikethroughs] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(34 * 60 + 18);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showLabsModal, setShowLabsModal] = useState<boolean>(false);
  const [showCalcModal, setShowCalcModal] = useState<boolean>(false);
  const [isExamCompleted, setIsExamCompleted] = useState<boolean>(false);

  const totalQuestions = 40;
  const activeQ = SAMPLE_EXAM_QUESTIONS[currentIdx] || SAMPLE_EXAM_QUESTIONS[0];

  // Timer countdown
  useEffect(() => {
    if (isExamCompleted) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishBlock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isExamCompleted]);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  };

  const handleSelectOption = (optionId: string) => {
    if (isExamCompleted) return;
    setAnswers(prev => ({ ...prev, [currentIdx]: optionId }));
  };

  const toggleFlag = () => {
    setFlagged(prev => ({ ...prev, [currentIdx]: !prev[currentIdx] }));
    notify(!flagged[currentIdx] ? 'تم تعليم السؤال للمراجعة قبل التسليم' : 'تمت إزالة علامة المراجعة');
  };

  const toggleStrike = (optId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStrikethroughs(prev => ({ ...prev, [optId]: !prev[optId] }));
  };

  const handleFinishBlock = () => {
    setIsExamCompleted(true);
    setShowSubmitModal(false);
    notify('تم تسليم البلوك الاختباري بنجاح وتم توليد تقرير الأداء المعتمد.');
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  if (isExamCompleted) {
    return (
      <div className="stitchExamResultsView" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Results Top Banner */}
        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-xl)',
          padding: '28px',
          boxShadow: 'var(--stitch-shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'var(--stitch-secondary-container)',
                color: 'var(--stitch-on-secondary-container)',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                SMLE Mock Exam Block 1 — مكتمل
              </span>
              <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>
                تم التوثيق والاعتماد الأكاديمي
              </span>
            </div>
            <span style={{
              background: 'var(--stitch-surface-container-high)',
              color: 'var(--stitch-primary)',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700
            }}>
              المعيار الوطني لاجتياز الهيئة: 65%
            </span>
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--stitch-text-primary)' }}>
              ملخص نتائج الاختبار الشامل ومؤشرات الجاهزية
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--stitch-text-secondary)', fontSize: '14px' }}>
              تحليل أدائك السريري المقارن مع معايير اختبار الرخصة السعودية ومجلس الاعتماد الأكاديمي.
            </p>
          </div>

          {/* Core Score Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '8px'
          }}>
            <div style={{
              background: 'var(--stitch-surface-container-low)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>درجة البلوك الإجمالية:</span>
              <strong style={{ fontSize: '28px', color: 'var(--stitch-secondary)', fontWeight: 800 }}>77.5%</strong>
              <small style={{ color: 'var(--stitch-secondary)', fontWeight: 600 }}>ناجح وتجاوز الحد الأدنى بنجاح</small>
            </div>

            <div style={{
              background: 'var(--stitch-surface-container-low)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>المئين التنافسي (Percentile):</span>
              <strong style={{ fontSize: '28px', color: 'var(--stitch-primary)', fontWeight: 800 }}>82nd</strong>
              <small style={{ color: 'var(--stitch-text-muted)' }}>أعلى من 82% من أطباء الدفعة</small>
            </div>

            <div style={{
              background: 'var(--stitch-surface-container-low)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>الأسئلة الصحيحة:</span>
              <strong style={{ fontSize: '28px', color: 'var(--stitch-text-primary)', fontWeight: 800 }}>31 / 40</strong>
              <small style={{ color: 'var(--stitch-error)', fontWeight: 600 }}>9 أسئلة بحاجة لمراجعة علاجية</small>
            </div>

            <div style={{
              background: 'var(--stitch-surface-container-low)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>متوسط زمن السؤال:</span>
              <strong style={{ fontSize: '28px', color: 'var(--stitch-text-primary)', fontWeight: 800 }}>58s</strong>
              <small style={{ color: 'var(--stitch-secondary)', fontWeight: 600 }}>وتيرة ممتازة (أقل من 90 ثانية)</small>
            </div>
          </div>
        </div>

        {/* Action Next Steps */}
        <div style={{
          background: 'var(--stitch-primary)',
          color: '#ffffff',
          borderRadius: 'var(--stitch-radius-xl)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--stitch-shadow-md)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              خطة التعافي السريري لسد الثغرات (Remediation Plan)
            </h3>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '13px' }}>
              تم استخراج المفاهيم الـ 9 الخاطئة وتجهيز جلسة علاجية مخصصة تشمل شروحات المشتتات واللآلئ الذهبية.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setView('remediation')}
              style={{
                background: '#ffffff',
                color: 'var(--stitch-primary)',
                border: 'none',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              بدء جلسة التعافي السريري الآن
            </button>
            <button
              type="button"
              onClick={() => setView('qbank')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              العودة لبنك الأسئلة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stitchExamContainer" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Prometric Examination Header Bar */}
      <div style={{
        background: 'var(--stitch-surface-container-lowest)',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-xl)',
        padding: '16px 24px',
        boxShadow: 'var(--stitch-shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Exam Identification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--stitch-radius-md)',
            background: 'var(--stitch-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                محاكاة الاختبار الشامل (SMLE Mock Block 1)
              </span>
              <span style={{
                fontSize: '11px',
                background: 'var(--stitch-surface-container-high)',
                color: 'var(--stitch-primary)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                وضع الاختبار المحاكي الرسمي
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--stitch-text-muted)', marginTop: '2px' }}>
              <span>السؤال {currentIdx + 1} من {totalQuestions}</span>
              <span>•</span>
              <span style={{ color: 'var(--stitch-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} />
                <span>تم الحفظ التلقائي المباشر</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Timer & Exam Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Chronometer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--stitch-surface-container-high)',
            padding: '8px 16px',
            borderRadius: 'var(--stitch-radius-lg)',
            border: '1px solid var(--stitch-border)'
          }}>
            <Clock size={18} color="var(--stitch-primary)" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '10px', color: 'var(--stitch-text-muted)', lineHeight: 1 }}>الوقت المتبقي</span>
              <strong style={{ fontSize: '16px', color: 'var(--stitch-primary)', letterSpacing: '0.05em' }} dir="ltr">
                {formatTimer(secondsRemaining)}
              </strong>
            </div>
          </div>

          {/* Reference Labs Trigger */}
          <button
            type="button"
            onClick={() => setShowLabsModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--stitch-surface-container-low)',
              color: 'var(--stitch-text-primary)',
              border: '1px solid var(--stitch-border)',
              padding: '8px 12px',
              borderRadius: 'var(--stitch-radius-md)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <FileText size={15} color="var(--stitch-primary)" />
            <span>القيم المخبرية</span>
          </button>

          {/* Calculator Trigger */}
          <button
            type="button"
            onClick={() => setShowCalcModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--stitch-surface-container-low)',
              color: 'var(--stitch-text-primary)',
              border: '1px solid var(--stitch-border)',
              padding: '8px 12px',
              borderRadius: 'var(--stitch-radius-md)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Calculator size={15} color="var(--stitch-primary)" />
            <span>الحاسبة</span>
          </button>

          {/* Flag Toggle */}
          <button
            type="button"
            onClick={toggleFlag}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: flagged[currentIdx] ? 'var(--stitch-tertiary-container)' : 'var(--stitch-surface-container-low)',
              color: flagged[currentIdx] ? '#ffffff' : 'var(--stitch-text-primary)',
              border: '1px solid var(--stitch-border)',
              padding: '8px 12px',
              borderRadius: 'var(--stitch-radius-md)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Flag size={15} fill={flagged[currentIdx] ? 'currentColor' : 'none'} />
            <span>{flagged[currentIdx] ? 'مُعلّم للمراجعة' : 'تعليم السؤال'}</span>
          </button>

          {/* Submit Finish Exam Block Trigger */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--stitch-error)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--stitch-radius-md)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            <Send size={14} />
            <span>إنهاء وتسليم البلوك</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout: Question on Right, Matrix on Left */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Main Vignette & Options Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Vignette Card */}
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-xl)',
            padding: '24px',
            boxShadow: 'var(--stitch-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--stitch-surface-container-low)',
              padding: '8px 14px',
              borderRadius: 'var(--stitch-radius-md)',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: 'var(--stitch-primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {activeQ.code}
                </span>
                <span style={{ color: 'var(--stitch-text-secondary)', fontWeight: 600 }}>
                  حالة سريرية مركبة • سياق استشفائي
                </span>
              </div>
              <span style={{ color: 'var(--stitch-text-muted)' }}>
                {activeQ.specialty} ← {activeQ.subspecialty}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '15px', lineHeight: 1.8, color: 'var(--stitch-text-primary)' }}>
              <p style={{ margin: 0 }}>{activeQ.vignette}</p>
              
              <div style={{
                background: 'var(--stitch-surface-container-low)',
                borderRight: '3px solid var(--stitch-primary)',
                padding: '12px 16px',
                borderRadius: 'var(--stitch-radius-md)',
                fontSize: '14px'
              }}>
                <strong style={{ display: 'block', color: 'var(--stitch-primary)', marginBottom: '4px' }}>
                  السوابق المرضية والدوائية:
                </strong>
                <span>{activeQ.patientHistory}</span>
              </div>

              <p style={{ margin: 0 }}>
                <strong style={{ color: 'var(--stitch-primary)' }}>الفحص السريري: </strong>
                {activeQ.physicalExam}
              </p>
            </div>

            {/* Labs Table if any */}
            {activeQ.labs && (
              <div style={{ border: '1px solid var(--stitch-border)', borderRadius: 'var(--stitch-radius-md)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--stitch-surface-container-low)', padding: '8px 14px', fontSize: '12px', fontWeight: 700 }}>
                  لوحة الفحوصات المخبرية (Serum Chemistry Panel)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: 'var(--stitch-surface-container-high)', color: 'var(--stitch-text-secondary)', fontSize: '11px' }}>
                      <th style={{ padding: '8px 14px' }}>الفحص المخبري</th>
                      <th style={{ padding: '8px 14px' }}>النتيجة</th>
                      <th style={{ padding: '8px 14px' }}>المجال المرجعي</th>
                      <th style={{ padding: '8px 14px' }}>الوحدة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeQ.labs.map((l, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--stitch-border)' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 600 }}>{l.test}</td>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: 'var(--stitch-primary)' }}>{l.result}</td>
                        <td style={{ padding: '8px 14px', color: 'var(--stitch-text-muted)' }}>{l.normal}</td>
                        <td style={{ padding: '8px 14px', color: 'var(--stitch-text-muted)' }}>{l.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Stem */}
            <div style={{
              background: 'var(--stitch-surface-container-high)',
              border: '1px solid var(--stitch-primary)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '16px 20px',
              marginTop: '6px'
            }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                {activeQ.stem}
              </h2>
            </div>
          </div>

          {/* Options (Prometric format: No early leak of answers) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeQ.options.map(opt => {
              const isSelected = answers[currentIdx] === opt.id;
              const isStruck = strikethroughs[opt.id];

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  style={{
                    background: isSelected ? 'var(--stitch-surface-container-high)' : 'var(--stitch-surface-container-lowest)',
                    border: isSelected ? '2px solid var(--stitch-primary)' : '1px solid var(--stitch-border)',
                    borderRadius: 'var(--stitch-radius-lg)',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    opacity: isStruck ? 0.45 : 1,
                    textDecoration: isStruck ? 'line-through' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--stitch-radius-md)',
                      background: isSelected ? 'var(--stitch-primary)' : 'var(--stitch-surface-container-low)',
                      color: isSelected ? '#ffffff' : 'var(--stitch-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      {opt.letter}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 500, color: 'var(--stitch-text-primary)' }}>
                      {opt.text}
                    </span>
                  </div>

                  {/* Strike-out tool button */}
                  <button
                    type="button"
                    title="شطب الخيار كاستبعاد مؤقت"
                    onClick={e => toggleStrike(opt.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--stitch-text-muted)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {isStruck ? 'إلغاء الشطب' : 'شطب (Strike)'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Previous / Next Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              style={{
                background: currentIdx === 0 ? 'var(--stitch-surface-container-high)' : 'var(--stitch-surface-container-low)',
                color: currentIdx === 0 ? 'var(--stitch-text-muted)' : 'var(--stitch-text-primary)',
                border: '1px solid var(--stitch-border)',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ArrowRight size={16} />
              <span>السؤال السابق</span>
            </button>

            <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>
              {answers[currentIdx] ? '✓ تم تسجيل اختيارك' : 'لم يتم اختيار إجابة بعد'}
            </span>

            <button
              type="button"
              disabled={currentIdx >= totalQuestions - 1}
              onClick={() => setCurrentIdx(prev => prev + 1)}
              style={{
                background: 'var(--stitch-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: currentIdx >= totalQuestions - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>السؤال التالي</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>

        {/* Left Column: 40-Question Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-lg)',
            padding: '20px',
            boxShadow: 'var(--stitch-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '14px', color: 'var(--stitch-text-primary)' }}>
                مصفوفة أسئلة البلوك (40 سؤالاً)
              </strong>
              <small style={{ color: 'var(--stitch-text-muted)' }}>Prometric Grid</small>
            </div>

            {/* Matrix Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--stitch-text-muted)' }}>
              <span>تمت الإجابة: <strong style={{ color: 'var(--stitch-primary)' }}>{answeredCount}</strong></span>
              <span>المتبقي: <strong style={{ color: 'var(--stitch-error)' }}>{unansweredCount}</strong></span>
              <span>المُعلّم: <strong style={{ color: 'var(--stitch-tertiary)' }}>{flaggedCount}</strong></span>
            </div>

            {/* 40 Questions Grid (5 columns × 8 rows) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {Array.from({ length: totalQuestions }).map((_, i) => {
                const isAnswered = Boolean(answers[i]);
                const isFlagged = Boolean(flagged[i]);
                const isCurrent = currentIdx === i;

                let bg = 'var(--stitch-surface-container-low)';
                let color = 'var(--stitch-text-primary)';
                if (isAnswered) {
                  bg = 'var(--stitch-surface-container-highest)';
                  color = 'var(--stitch-primary)';
                }
                if (isCurrent) {
                  bg = 'var(--stitch-primary)';
                  color = '#ffffff';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIdx(i)}
                    style={{
                      height: '36px',
                      borderRadius: 'var(--stitch-radius-md)',
                      border: isFlagged ? '2px solid var(--stitch-tertiary)' : '1px solid var(--stitch-border)',
                      background: bg,
                      color: color,
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <span>{i + 1}</span>
                    {isFlagged && (
                      <span style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '9999px',
                        background: 'var(--stitch-tertiary)'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Finish Modal */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-xl)',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: 'var(--stitch-shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--stitch-error)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                تأكيد إنهاء وتسليم البلوك الاختباري
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: '14px', color: 'var(--stitch-text-secondary)', lineHeight: 1.6 }}>
              هل أنت متأكد من رغبتك في تسليم البلوك الآن؟ لا يمكن تعديل الإجابات بعد التسليم النهائي.
            </p>

            <div style={{
              background: 'var(--stitch-surface-container-low)',
              borderRadius: 'var(--stitch-radius-md)',
              padding: '12px 16px',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>إجمالي الأسئلة المجاب عنها:</span>
                <strong style={{ color: 'var(--stitch-primary)' }}>{answeredCount} سؤالاً</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>الأسئلة المتبقية دون إجابة:</span>
                <strong style={{ color: 'var(--stitch-error)' }}>{unansweredCount} سؤالاً</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>الأسئلة المُعلّمة للمراجعة:</span>
                <strong style={{ color: 'var(--stitch-tertiary)' }}>{flaggedCount} سؤالاً</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                style={{
                  background: 'var(--stitch-surface-container-high)',
                  color: 'var(--stitch-text-primary)',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                العودة للاختبار
              </button>
              <button
                type="button"
                onClick={handleFinishBlock}
                style={{
                  background: 'var(--stitch-error)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                تأكيد التسليم وتوليد النتيجة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Normal Reference Limits Labs Modal */}
      {showLabsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-xl)',
            padding: '24px',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: 'var(--stitch-shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: '16px', color: 'var(--stitch-text-primary)' }}>
                القيم المخبرية المرجعية المعتمدة (SMLE Laboratory Reference Sheet)
              </strong>
              <button
                type="button"
                onClick={() => setShowLabsModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ background: 'var(--stitch-surface-container-low)', padding: '10px', borderRadius: '6px' }}>
                <strong style={{ color: 'var(--stitch-primary)' }}>كيمياء الدم والأملاح:</strong>
                <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                  Sodium: 135–145 mEq/L • Potassium: 3.5–5.0 mEq/L • Calcium: 8.5–10.2 mg/dL • Magnesium: 1.7–2.2 mg/dL • Phosphate: 2.5–4.5 mg/dL
                </p>
              </div>
              <div style={{ background: 'var(--stitch-surface-container-low)', padding: '10px', borderRadius: '6px' }}>
                <strong style={{ color: 'var(--stitch-primary)' }}>وظائف الكلى والتمثيل الغذائي:</strong>
                <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                  BUN: 7–20 mg/dL • Serum Creatinine: 0.6–1.2 mg/dL • Fasting Glucose: 70–99 mg/dL • HbA1c: &lt; 5.7%
                </p>
              </div>
              <div style={{ background: 'var(--stitch-surface-container-low)', padding: '10px', borderRadius: '6px' }}>
                <strong style={{ color: 'var(--stitch-primary)' }}>تعداد الدم الشامل (CBC):</strong>
                <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                  Hemoglobin: 13.5–17.5 g/dL (M), 12.0–15.5 g/dL (F) • WBC: 4,500–11,000 /µL • Platelets: 150,000–450,000 /µL
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Calculator Modal */}
      {showCalcModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-xl)',
            padding: '24px',
            maxWidth: '360px',
            width: '100%',
            boxShadow: 'var(--stitch-shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: '15px', color: 'var(--stitch-text-primary)' }}>
                الحاسبة الطبية السريرية
              </strong>
              <button
                type="button"
                onClick={() => setShowCalcModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{
              background: 'var(--stitch-surface-container-high)',
              padding: '14px',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '20px',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'var(--stitch-primary)'
            }}>
              13.8 - (0.8 * (4 - 3.2)) = 13.16
            </div>
            <small style={{ color: 'var(--stitch-text-muted)', fontSize: '12px' }}>
              معادلة الكالسيوم المصحح: Corrected Ca = Total Ca + 0.8 × (4.0 - Albumin)
            </small>
          </div>
        </div>
      )}
    </div>
  );
}

export default StitchExamPlayer;
