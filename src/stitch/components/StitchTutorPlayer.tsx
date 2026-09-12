import React, { useState } from 'react';
import { 
  HeartPulse, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Bookmark, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  PauseCircle, 
  Maximize2, 
  Keyboard, 
  LogOut, 
  Lightbulb, 
  GraduationCap, 
  BookOpen, 
  AlertTriangle, 
  Check, 
  X, 
  RotateCcw,
  Sparkles,
  Award
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export interface QuestionData {
  id: string;
  code: string;
  specialty: string;
  subspecialty: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  vignette: string;
  patientHistory: string;
  physicalExam: string;
  labTitle?: string;
  labs?: { test: string; result: string; normal: string; unit: string; flag?: string }[];
  ecgNote?: string;
  stem: string;
  options: {
    id: string;
    letter: string;
    text: string;
    subtext: string;
    peerPercent: number;
    isCorrect: boolean;
  }[];
  explanation: {
    statusTitle: string;
    statusSummary: string;
    learningObjective: string;
    whyCorrect: string;
    whyIncorrectMap: Record<string, string>;
    distractorBreakdown: { letter: string; name: string; critique: string }[];
    pearl: string;
    references: string;
  };
}

const SAMPLE_TUTOR_QUESTION: QuestionData = {
  id: 'q-4821',
  code: 'Q-4821',
  specialty: 'أمراض القلب والأوعية الدموية',
  subspecialty: 'اضطرابات النظم والنقل (Arrhythmias & Conduction)',
  difficulty: 'Intermediate',
  vignette: 'رجل يبلغ من العمر 64 عاماً، يراجع قسم الطوارئ وهو يشكو من خفقان حاد ومفاجئ في الصدر مستمر منذ 4 ساعات، مصحوباً بدوار خفيف وضيق بسيط في التنفس عند بذل أي مجهود خفيف. ينفي المريض وجود ألم صدري ضاغط أو غشيان (Syncope).',
  patientHistory: 'لديه سوابق مرضية بارتفاع ضغط الدم الشرياني منذ 12 عاماً، ويتناول لوزارتان 50 ملغ يومياً بشكل منتظم. ينفي أي تاريخ عائلي للموت القلبي المفاجئ.',
  physicalExam: 'المريض واعٍ ومتجاوب تماماً، يبدو قلقاً نوعاً ما. ضغط الدم 105/70 mmHg، ومعدل ضربات القلب 144 نبضة/دقيقة غير منتظم إطلاقاً (Irregularly irregular pulse). معدل التنفس 18/min، وإشباع الأكسجين 96% على هواء الغرفة. لا توجد علامات احتقان وداجي، والأصوات الرئوية نقية في كلا الجانبين دون خِراخر (No crackles).',
  labTitle: 'لوحة الفحوصات المخبرية الإسعافية (Stat Emergency Panel)',
  labs: [
    { test: 'Serum Potassium (K⁺)', result: '4.2', normal: '3.5 - 5.0', unit: 'mEq/L' },
    { test: 'Serum Magnesium (Mg²⁺)', result: '2.1', normal: '1.7 - 2.2', unit: 'mg/dL' },
    { test: 'High-Sensitivity Troponin I', result: '< 0.02', normal: '< 0.04', unit: 'ng/mL' },
    { test: 'Hemoglobin (Hb)', result: '14.1', normal: '13.5 - 17.5', unit: 'g/dL' }
  ],
  ecgNote: 'تخطيط كهربية القلب (12-Lead ECG) أظهر: تسارع قلب غير منتظم بدون موجات P واضحة، مع خط أساس متذبذب وفواصل R-R عشوائية تامة (Atrial Fibrillation with Rapid Ventricular Response).',
  stem: 'ما هو التدبير السريري الدوائي الفوري الأنسب للسيطرة على معدل ضربات القلب (Rate Control) لدى هذا المريض مع الحفاظ على استقراره الديناميكي الدموي؟',
  options: [
    {
      id: 'opt-a',
      letter: 'A',
      text: 'أدينوسين وريدياً (IV Adenosine 6 mg bolus)',
      subtext: 'جرعة بلعة سريعة من الأدينوسين عبر الوريد متبوعة بدفق ملحي سريع.',
      peerPercent: 18,
      isCorrect: false
    },
    {
      id: 'opt-b',
      letter: 'B',
      text: 'ميتوبرولول وريدياً (IV Metoprolol 5 mg over 2-5 minutes)',
      subtext: 'حاصرات بيتا وريدياً لتثبيط التوصيل عبر العقدة الأذينية البطينية والسيطرة على المعدل.',
      peerPercent: 68,
      isCorrect: true
    },
    {
      id: 'opt-c',
      letter: 'C',
      text: 'أميودارون وريدياً (IV Amiodarone 150 mg over 10 minutes)',
      subtext: 'مضاد لاضطراب النظم من الصنف الثالث لتقويم النظم الكيميائي.',
      peerPercent: 8,
      isCorrect: false
    },
    {
      id: 'opt-d',
      letter: 'D',
      text: 'تقويم نظم القلب الكهربائي المتزامن الفوري (Synchronized DC Cardioversion)',
      subtext: 'صدمة كهربائية متزامنة 100-200 جول تحت التهدئة الواعية.',
      peerPercent: 4,
      isCorrect: false
    },
    {
      id: 'opt-e',
      letter: 'E',
      text: 'ديجوكسين فموياً (Oral Digoxin 0.25 mg daily)',
      subtext: 'مُثبط مضخة الصوديوم والبوتاسيوم كجرعة فموية صيانة.',
      peerPercent: 2,
      isCorrect: false
    }
  ],
  explanation: {
    statusTitle: 'الرجفان الأذيني مع استجابة بطينية سريعة (AF with Rapid Ventricular Response)',
    statusSummary: 'لدى المرضى المستقرين ديناميكياً (ضغط دم طبيعي، عدم وجود وذمة رئة حادة أو نقص تروية صريح)، الخطوة العلاجية الأولى الموصى بها هي السيطرة على معدل النبض (Rate Control) بحاصرات بيتا الوريدية أو حاصرات قنوات الكالسيوم غير الديهيدروبيريدينية، وليس الأدينوسين أو التقويم الفوري.',
    learningObjective: 'التمييز بين تدبير تسارع القلب فوق البطيني المنتظم (SVT) الذي يستجيب للأدينوسين، وبين الرجفان الأذيني غير المنتظم (AF) الذي يتطلب حاصرات العقدة AV (مثل ميتوبرولول أو ديلتيازيم) للسيطرة على المعدل، وتجنب Cardioversion دون التأكد من نفي الانصمام الخثاري إلا عند انعدام الاستقرار.',
    whyCorrect: 'يُظهر المريض رجفاناً أذينياً مع استجابة بطينية سريعة (HR > 140 bpm). العلامات الحيوية تُشير بوضوح إلى استقرار ديناميكي: ضغط الدم 105/70 mmHg والأكسجين 96% والرئتان خاليتان من علامات الوذمة الرئوية. في هذه الحالة، الهدف الفوري هو إبطاء معدل النبض البطيني (< 110 bpm) لتقليل العبء القلبي. الميتوبرولول الوريدي يُعتبر خطاً أول معيارياً لإطالة فترة الحران في العقدة AV وتقليل مرور النبضات الفوضوية إلى البطينات.',
    whyIncorrectMap: {
      'opt-a': 'يعمل الأدينوسين على إحداث حصر عابر كامل في العقدة AV لثوانٍ معدودة فقط. يُستخدم حصراً في تسارع القلب المنتظم ضيق المركب (AVNRT / AVRT) لكسر دارة إعادة الدخول. في الرجفان الأذيني، لا توجد دارة إعادة دخول في العقدة AV بل نشاط بؤري فوضوي في الأذينة. إعطاء الأدينوسين لن يُنهي الرجفان الأذيني، بل قد يتسبب في تسرع انعكاسي حاد، وقد يؤدي لتحويله لرجفان بطيني خطير إذا وُجد سبيل إضافي مستور (WPW).'
    },
    distractorBreakdown: [
      {
        letter: 'C',
        name: 'أميودارون (Amiodarone)',
        critique: 'دواء للسيطرة على النظم (Rhythm Control) قد يؤدي للتحويل التلقائي للنظم الجيبي، مما يشكل خطراً كبيراً بإطلاق صمة خثارية جهازية إن لم يُستبعد وجود خثرة أذينية أو لم يخضع المريض لمميعات الدم لمدة 3 أسابيع.'
      },
      {
        letter: 'D',
        name: 'التقويم الكهربائي المتزامن (DC Cardioversion)',
        critique: 'التقويم الكهربائي الفوري مخصص فقط لحالات عدم الاستقرار الديناميكي الشديد (صدمة دورانية، هبوط ضغط حاد، وذمة رئة صريحة، أو احتشاء قلبي حاد مستمر). المريض الحالي مستقر ديناميكياً.'
      },
      {
        letter: 'E',
        name: 'ديجوكسين فموياً (Oral Digoxin)',
        critique: 'الديجوكسين بطيء البدء (يحتاج عدة ساعات)، وغير فعال في السيطرة على معدل النبض أثناء الحركة أو التوتر الأدريناليني، ولا يُعتبر خياراً أولاً لحالات الطوارئ الحادة.'
      }
    ],
    pearl: 'في الرجفان الأذيني (AF)، القاعدة الذهبية للاختبارات والممارسة السريرية: مستقر ديناميكياً؟ ← ابدأ دائماً بـ Rate Control (حاصرات بيتا أو قنوات الكالسيوم). غير مستقر ديناميكياً؟ (Hypotension, AMS, Ischemic Chest Pain, Pulmonary Edema) ← توجه فوراً إلى Synchronized Cardioversion بغض النظر عن مدة الرجفان.',
    references: 'AHA/ACC/HRS Guidelines for the Management of Patients With Atrial Fibrillation • UpToDate 2025 • SMLE / USMLE Step 2 CK Yield: High'
  }
};

export function StitchTutorPlayer({ onExit }: { onExit?: () => void }) {
  const { setView, notify } = useStitch();
  const [question] = useState<QuestionData>(SAMPLE_TUTOR_QUESTION);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [currentIdx, setCurrentIdx] = useState<number>(7); // Question 8
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);

  // Mock answers map for 20 questions
  const [gridStatuses] = useState<('correct' | 'incorrect' | 'current' | 'unanswered')[]>([
    'correct', 'correct', 'incorrect', 'correct', 'correct', 'incorrect', 'correct',
    'current', 'unanswered', 'unanswered', 'unanswered', 'unanswered', 'unanswered',
    'unanswered', 'unanswered', 'unanswered', 'unanswered', 'unanswered', 'unanswered', 'unanswered'
  ]);

  const handleSelect = (id: string) => {
    if (isSubmitted) return;
    setSelectedOption(id);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    const chosen = question.options.find(o => o.id === selectedOption);
    if (chosen?.isCorrect) {
      notify('إجابة صحيحة! تم توثيق النتيجة السريرية.');
    } else {
      notify('إجابة غير صحيحة. تفقد التفسير واللؤلؤة السريرية.');
    }
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    notify(!bookmarked ? 'تم حفظ السؤال في المحفوظات السريرية' : 'تمت إزالة السؤال من المحفوظات');
  };

  const handleNextQuestion = () => {
    if (currentIdx >= 19) {
      setShowResultsModal(true);
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  };

  const chosenOptionData = question.options.find(o => o.id === selectedOption);
  const isCorrect = chosenOptionData?.isCorrect;

  return (
    <div className="stitchTutorContainer" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Session Navigation Top Strip */}
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
            <Brain size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                وضع التدريب التفاعلي (Tutor Mode)
              </span>
              <span style={{
                fontSize: '11px',
                background: 'var(--stitch-surface-container-high)',
                color: 'var(--stitch-primary)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                {question.specialty}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--stitch-text-muted)', marginTop: '2px' }}>
              <span>السؤال {currentIdx + 1} من 20</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--stitch-secondary)' }}>
                <CheckCircle2 size={13} />
                <span>تم الحفظ السحابي التلقائي</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={toggleBookmark}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: bookmarked ? 'var(--stitch-tertiary-container)' : 'var(--stitch-surface-container-low)',
              color: bookmarked ? '#ffffff' : 'var(--stitch-text-primary)',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 'var(--stitch-radius-md)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
            <span>{bookmarked ? 'محفوظ للمراجعة' : 'حفظ السؤال'}</span>
          </button>

          <button
            type="button"
            onClick={() => onExit ? onExit() : setView('qbank')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--stitch-surface-container-low)',
              color: 'var(--stitch-error)',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 'var(--stitch-radius-md)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <LogOut size={14} />
            <span>إنهاء الجلسة</span>
          </button>
        </div>
      </div>

      {/* Progress Strip with 20 Question Indicators */}
      <div style={{
        background: 'var(--stitch-surface-container-lowest)',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-lg)',
        padding: '14px 20px',
        boxShadow: 'var(--stitch-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: 'var(--stitch-text-primary)' }}>خريطة إنجاز الجلسة</strong>
            <span style={{ color: 'var(--stitch-text-muted)' }}>(40% مكتمل)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--stitch-text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '9999px', background: 'var(--stitch-secondary)' }} />
              <span>5 صحيحة</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '9999px', background: 'var(--stitch-error)' }} />
              <span>2 خاطئة</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '9999px', background: 'var(--stitch-surface-container-highest)' }} />
              <span>13 متبقية</span>
            </span>
          </div>
        </div>

        {/* 20 Segments Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)', gap: '4px', height: '8px' }}>
          {gridStatuses.map((st, i) => (
            <div
              key={i}
              title={`سؤال ${i + 1}`}
              style={{
                height: '100%',
                borderRadius: '9999px',
                background: 
                  st === 'correct' ? 'var(--stitch-secondary)' :
                  st === 'incorrect' ? 'var(--stitch-error)' :
                  st === 'current' ? 'var(--stitch-primary)' :
                  'var(--stitch-surface-container-highest)',
                outline: st === 'current' ? '2px solid var(--stitch-primary)' : 'none',
                outlineOffset: '2px'
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout: Question on Right/Center, Matrix on Left */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Main Clinical Vignette & Answer Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Clinical Vignette Card */}
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-xl)',
            padding: '24px',
            boxShadow: 'var(--stitch-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}>
            {/* Metadata bar */}
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
                  {question.code}
                </span>
                <span style={{ color: 'var(--stitch-text-secondary)', fontWeight: 600 }}>
                  حالة سريرية (Clinical Vignette)
                </span>
                <span style={{ color: 'var(--stitch-text-muted)' }}>•</span>
                <span style={{ color: 'var(--stitch-text-muted)' }}>{question.subspecialty}</span>
              </div>
              <span style={{
                background: 'var(--stitch-secondary-container)',
                color: 'var(--stitch-on-secondary-container)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '11px'
              }}>
                مستوى متوسط • Intermediate
              </span>
            </div>

            {/* Vignette Narrative */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '15px', lineHeight: 1.8, color: 'var(--stitch-text-primary)' }}>
              <p style={{ margin: 0 }}>
                {question.vignette}
              </p>

              {/* History callout */}
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
                <span>{question.patientHistory}</span>
              </div>

              {/* Physical Exam */}
              <p style={{ margin: 0 }}>
                <strong style={{ color: 'var(--stitch-primary)' }}>الفحص السريري: </strong>
                {question.physicalExam}
              </p>

              {/* ECG note */}
              {question.ecgNote && (
                <div style={{
                  background: 'var(--stitch-surface-container-high)',
                  border: '1px solid var(--stitch-outline-variant)',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <HeartPulse size={20} color="var(--stitch-primary)" style={{ marginTop: '2px', shrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--stitch-primary)' }}>
                      تخطيط القلب (12-Lead ECG Finding):
                    </strong>
                    <span style={{ fontSize: '13px', color: 'var(--stitch-text-primary)' }}>
                      {question.ecgNote}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Laboratory Table */}
            {question.labs && (
              <div style={{
                border: '1px solid var(--stitch-border)',
                borderRadius: 'var(--stitch-radius-md)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'var(--stitch-surface-container-low)',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--stitch-text-primary)'
                }}>
                  {question.labTitle}
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
                    {question.labs.map((lab, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--stitch-border)' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 600 }}>{lab.test}</td>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: 'var(--stitch-secondary)' }}>{lab.result}</td>
                        <td style={{ padding: '8px 14px', color: 'var(--stitch-text-muted)' }}>{lab.normal}</td>
                        <td style={{ padding: '8px 14px', color: 'var(--stitch-text-muted)' }}>{lab.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Stem / Question Lead */}
            <div style={{
              background: 'var(--stitch-surface-container-high)',
              border: '1px solid var(--stitch-primary)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '16px 20px',
              marginTop: '8px'
            }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--stitch-text-primary)', lineHeight: 1.6 }}>
                {question.stem}
              </h2>
            </div>
          </div>

          {/* Options Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {question.options.map(opt => {
              const isSelected = selectedOption === opt.id;
              let bg = 'var(--stitch-surface-container-lowest)';
              let border = '1px solid var(--stitch-border)';
              let iconToken = opt.letter;
              let tokenBg = 'var(--stitch-surface-container-high)';
              let tokenColor = 'var(--stitch-text-primary)';

              if (isSubmitted) {
                if (opt.isCorrect) {
                  bg = 'var(--stitch-secondary-container)';
                  border = '2px solid var(--stitch-secondary)';
                  tokenBg = 'var(--stitch-secondary)';
                  tokenColor = '#ffffff';
                } else if (isSelected && !opt.isCorrect) {
                  bg = 'var(--stitch-error-container)';
                  border = '2px solid var(--stitch-error)';
                  tokenBg = 'var(--stitch-error)';
                  tokenColor = '#ffffff';
                }
              } else if (isSelected) {
                bg = 'var(--stitch-surface-container-high)';
                border = '2px solid var(--stitch-primary)';
                tokenBg = 'var(--stitch-primary)';
                tokenColor = '#ffffff';
              }

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  style={{
                    background: bg,
                    border: border,
                    borderRadius: 'var(--stitch-radius-lg)',
                    padding: '16px 20px',
                    cursor: isSubmitted ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--stitch-radius-md)',
                    background: tokenBg,
                    color: tokenColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {isSubmitted && opt.isCorrect ? <Check size={18} /> : 
                     isSubmitted && isSelected && !opt.isCorrect ? <X size={18} /> : 
                     opt.letter}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--stitch-text-primary)' }}>
                        {opt.text}
                      </strong>
                      {isSubmitted && opt.isCorrect && (
                        <span style={{
                          background: 'var(--stitch-secondary)',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          الإجابة السريرية الصحيحة
                        </span>
                      )}
                      {isSubmitted && isSelected && !opt.isCorrect && (
                        <span style={{
                          background: 'var(--stitch-error)',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          إجابتك (غير صحيحة)
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: 1.5 }}>
                      {opt.subtext}
                    </span>
                    {isSubmitted && (
                      <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px', marginTop: '4px' }}>
                        اختار هذا الخيار {opt.peerPercent}% من زملائك المتقدمين للاختبار
                      </small>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Action / Next Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            {!isSubmitted ? (
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!selectedOption}
                style={{
                  background: selectedOption ? 'var(--stitch-primary)' : 'var(--stitch-surface-container-high)',
                  color: selectedOption ? '#ffffff' : 'var(--stitch-text-muted)',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-lg)',
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: selectedOption ? 'pointer' : 'not-allowed',
                  boxShadow: selectedOption ? 'var(--stitch-shadow-md)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Check size={18} />
                <span>تأكيد الإجابة وإظهار التفسير</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                style={{
                  background: 'var(--stitch-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-lg)',
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--stitch-shadow-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>السؤال التالي (السؤال {currentIdx + 2})</span>
                <ArrowLeft size={18} />
              </button>
            )}
          </div>

          {/* Comprehensive Clinical Explanation Block (Shown after answer submission) */}
          {isSubmitted && (
            <div style={{
              background: 'var(--stitch-surface-container-lowest)',
              border: '1px solid var(--stitch-border)',
              borderRadius: 'var(--stitch-radius-xl)',
              padding: '24px',
              boxShadow: 'var(--stitch-shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Status Header Banner */}
              <div style={{
                background: isCorrect ? 'var(--stitch-secondary-container)' : 'var(--stitch-error-container)',
                border: isCorrect ? '1px solid var(--stitch-secondary)' : '1px solid var(--stitch-error)',
                borderRadius: 'var(--stitch-radius-lg)',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                {isCorrect ? (
                  <CheckCircle2 size={24} color="var(--stitch-secondary)" style={{ shrink: 0, marginTop: '2px' }} />
                ) : (
                  <XCircle size={24} color="var(--stitch-error)" style={{ shrink: 0, marginTop: '2px' }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong style={{
                    fontSize: '15px',
                    color: isCorrect ? 'var(--stitch-secondary)' : 'var(--stitch-error)'
                  }}>
                    {isCorrect ? 'إجابة سريرية صحيحة وموفقة!' : 'إجابة غير صحيحة — مراجعة تشخيصية هامة'}
                  </strong>
                  <span style={{ fontSize: '13px', color: 'var(--stitch-text-primary)', lineHeight: 1.6 }}>
                    {question.explanation.statusSummary}
                  </span>
                </div>
              </div>

              {/* 1. Key Learning Objective */}
              <div style={{
                background: 'var(--stitch-surface-container-low)',
                borderRight: '4px solid var(--stitch-primary)',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--stitch-primary)', fontWeight: 700, fontSize: '13px' }}>
                  <Lightbulb size={16} />
                  <span>الهدف التعليمي المحوري (Key Learning Objective):</span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--stitch-text-primary)' }}>
                  {question.explanation.learningObjective}
                </p>
              </div>

              {/* 2. Why Correct */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--stitch-secondary)' }}>
                  لماذا خيار (B - ميتوبرولول وريدياً) هو الإجابة الصحيحة؟
                </h3>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.8, color: 'var(--stitch-text-primary)' }}>
                  {question.explanation.whyCorrect}
                </p>
              </div>

              {/* 3. Why Option A is incorrect (if student chose A or for learning) */}
              {!isCorrect && selectedOption === 'opt-a' && (
                <div style={{
                  background: 'var(--stitch-error-container)',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--stitch-error)' }}>
                    لماذا كان خيارك (A - الأدينوسين) خاطئاً وسريرياً غير ملائم؟
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: 'var(--stitch-text-primary)' }}>
                    {question.explanation.whyIncorrectMap['opt-a']}
                  </p>
                </div>
              )}

              {/* 4. Distractor Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                  تحليل بقية المشتتات والخيارات البديلة:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {question.explanation.distractorBreakdown.map((dist, i) => (
                    <div key={i} style={{
                      background: 'var(--stitch-surface-container-low)',
                      borderRadius: 'var(--stitch-radius-md)',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '9999px',
                          background: 'var(--stitch-surface-container-high)',
                          color: 'var(--stitch-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {dist.letter}
                        </span>
                        <strong style={{ fontSize: '12px', color: 'var(--stitch-text-primary)' }}>{dist.name}</strong>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', lineHeight: 1.5 }}>
                        {dist.critique}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Gold Clinical Pearl Card */}
              <div style={{
                background: 'var(--stitch-primary)',
                color: '#ffffff',
                borderRadius: 'var(--stitch-radius-lg)',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                boxShadow: 'var(--stitch-shadow-md)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--stitch-radius-md)',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={20} color="#fbbf24" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <strong style={{ fontSize: '15px', color: '#fbbf24' }}>
                    لؤلؤة سريرية ذهبية (Clinical Pearl)
                  </strong>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, opacity: 0.95 }}>
                    {question.explanation.pearl}
                  </p>
                </div>
              </div>

              {/* 6. References & Guidelines */}
              <div style={{
                background: 'var(--stitch-surface-container-low)',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--stitch-text-muted)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={14} color="var(--stitch-primary)" />
                  <span>المرجع: {question.explanation.references}</span>
                </div>
                <span style={{
                  background: 'var(--stitch-surface-container-high)',
                  color: 'var(--stitch-primary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 700
                }}>
                  SMLE / IFOM Yield: High
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Left Column: 20-Question Matrix Drawer & Reference Sheets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Question Navigator Grid */}
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-lg)',
            padding: '18px',
            boxShadow: 'var(--stitch-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '14px', color: 'var(--stitch-text-primary)' }}>
                خريطة أسئلة البلوك (20 سؤالاً)
              </strong>
              <small style={{ color: 'var(--stitch-text-muted)' }}>جلسة تدريبية</small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {gridStatuses.map((st: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    height: '38px',
                    borderRadius: 'var(--stitch-radius-md)',
                    border: 'none',
                    background: 
                      st === 'correct' ? 'var(--stitch-secondary)' :
                      st === 'incorrect' ? 'var(--stitch-error)' :
                      st === 'current' ? 'var(--stitch-primary)' :
                      'var(--stitch-surface-container-low)',
                    color: (st === 'correct' || st === 'incorrect' || st === 'current') ? '#ffffff' : 'var(--stitch-text-primary)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-lg)',
            padding: '16px',
            boxShadow: 'var(--stitch-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '13px'
          }}>
            <strong style={{ color: 'var(--stitch-text-primary)' }}>إحصاءات الجلسة الفورية</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--stitch-text-secondary)' }}>
              <span>متوسط زمن السؤال:</span>
              <strong style={{ color: 'var(--stitch-text-primary)' }}>64 ثانية</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--stitch-text-secondary)' }}>
              <span>نسبة الإجابات الصحيحة:</span>
              <strong style={{ color: 'var(--stitch-secondary)' }}>71.4% (5 من 7)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StitchTutorPlayer;
