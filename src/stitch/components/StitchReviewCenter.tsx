import React, { useState } from 'react';
import { 
  RotateCcw, 
  Brain, 
  Bookmark, 
  AlertTriangle, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingDown,
  Filter,
  Layers,
  Award
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export interface IncorrectQuestionItem {
  id: string;
  code: string;
  specialty: string;
  topic: string;
  timesMissed: number;
  lastAttemptDate: string;
  distractorChosen: string;
  correctAnswer: string;
  pearl: string;
}

const SAMPLE_INCORRECT_ITEMS: IncorrectQuestionItem[] = [
  {
    id: 'inc-1',
    code: 'Q-4821',
    specialty: 'Cardiovascular System',
    topic: 'Atrial Fibrillation — Rate vs Rhythm Control',
    timesMissed: 2,
    lastAttemptDate: 'اليوم، 10:45 ص',
    distractorChosen: 'أدينوسين وريدياً (IV Adenosine)',
    correctAnswer: 'ميتوبرولول وريدياً (IV Metoprolol)',
    pearl: 'في الرجفان الأذيني: مستقر ديناميكياً؟ ابدأ بـ Rate Control (حاصرات بيتا أو قنوات الكالسيوم).'
  },
  {
    id: 'inc-2',
    code: 'Q-5119',
    specialty: 'Nephrology & Endocrine',
    topic: 'Severe Hypercalcemia of Malignancy',
    timesMissed: 1,
    lastAttemptDate: 'أمس، 04:20 م',
    distractorChosen: 'فوروسيميد عاجل (Furosemide)',
    correctAnswer: 'تسريب ملحي متساوي التوتر (Normal Saline 0.9%)',
    pearl: 'فرط كالسيوم الدم الحاد: الإماهة الشديدة بالسوائل الوريدية تسبق دائماً أي مدرات بولية.'
  },
  {
    id: 'inc-3',
    code: 'Q-3920',
    specialty: 'Respiratory Medicine',
    topic: 'Acute Pulmonary Embolism Risk Stratification',
    timesMissed: 2,
    lastAttemptDate: 'منذ يومين',
    distractorChosen: 'وارفارين فموي فوري (Oral Warfarin)',
    correctAnswer: 'مضادات التخثر المباشرة / LMWH وريدياً',
    pearl: 'علاج الانصمام الرئوي الحاد: البدء الفوري بمضادات التخثر السريعة (DOACs / LMWH) دون تأخير.'
  },
  {
    id: 'inc-4',
    code: 'Q-2294',
    specialty: 'Pediatrics',
    topic: 'Febrile Seizures vs Meningitis Red Flags',
    timesMissed: 1,
    lastAttemptDate: 'منذ 3 أيام',
    distractorChosen: 'بزل قطني روتيني لجميع الحالات (LP for all)',
    correctAnswer: 'فحص سريري دقيق وتطمينات إن كانت نوبة حموية بسيطة',
    pearl: 'النوبة الحموية البسيطة (أقل من 15 دقيقة، معممة، بدون عجز بؤري) لا تستدعي بزلاً قطنياً روتينياً إلا بوجود علامات سحائية.'
  }
];

export function StitchReviewCenter() {
  const { setView, openSmartReview, notify } = useStitch();
  const [activeTab, setActiveTab] = useState<'incorrect' | 'bookmarks' | 'remediation'>('incorrect');

  const handleLaunchTargetedRecovery = () => {
    setView('remediation');
  };

  return (
    <div className="stitchReviewCenterContainer" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{
        background: 'var(--stitch-surface-container-lowest)',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-xl)',
        padding: '24px',
        boxShadow: 'var(--stitch-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--stitch-text-muted)' }}>
            <span>منظومة التعلم السريري</span>
            <span>←</span>
            <span style={{ color: 'var(--stitch-primary)', fontWeight: 600 }}>مركز المراجعة والتعافي السريري</span>
          </div>
          <span style={{
            background: 'var(--stitch-error-container)',
            color: 'var(--stitch-on-error-container)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            13 فجوة معرفية تحتاج معالجة استباقية
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
              مركز المراجعة السريرية الشامل (Review Center)
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--stitch-text-secondary)', fontSize: '14px' }}>
              حوّل أخطاءك السابقة إلى نقاط قوة عبر تدريب موجه على المفاهيم ذات المردود السريري الأعلى (High-Yield).
            </p>
          </div>

          <button
            type="button"
            onClick={handleLaunchTargetedRecovery}
            style={{
              background: 'var(--stitch-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--stitch-shadow-md)'
            }}
          >
            <Sparkles size={16} color="#fbbf24" />
            <span>إطلاق خطة التعافي السريري الفورية</span>
          </button>
        </div>

        {/* Tabs Bar */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--stitch-border)', paddingTop: '16px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('incorrect')}
            style={{
              background: activeTab === 'incorrect' ? 'var(--stitch-primary)' : 'transparent',
              color: activeTab === 'incorrect' ? '#ffffff' : 'var(--stitch-text-secondary)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--stitch-radius-md)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            الأسئلة الخاطئة مسبقاً (Incorrect Vault)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookmarks')}
            style={{
              background: activeTab === 'bookmarks' ? 'var(--stitch-primary)' : 'transparent',
              color: activeTab === 'bookmarks' ? '#ffffff' : 'var(--stitch-text-secondary)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--stitch-radius-md)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            المحفوظات واللآلئ السريرية (Pearls Vault)
          </button>
          <button
            type="button"
            onClick={() => openSmartReview('flashcards')}
            style={{
              background: 'transparent',
              color: 'var(--stitch-secondary)',
              border: '1px solid var(--stitch-secondary)',
              padding: '8px 16px',
              borderRadius: 'var(--stitch-radius-md)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              marginRight: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Brain size={14} />
            <span>فتح المراجعة الذكية والتكرار المتباعد (SM-2)</span>
          </button>
        </div>
      </div>

      {/* Main Incorrect Items Vault List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {SAMPLE_INCORRECT_ITEMS.map(item => (
          <div
            key={item.id}
            style={{
              background: 'var(--stitch-surface-container-lowest)',
              border: '1px solid var(--stitch-border)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '20px',
              boxShadow: 'var(--stitch-shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: 'var(--stitch-error-container)',
                  color: 'var(--stitch-on-error-container)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  {item.code}
                </span>
                <strong style={{ fontSize: '15px', color: 'var(--stitch-text-primary)' }}>
                  {item.topic}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>({item.specialty})</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>
                آخر محاولة: {item.lastAttemptDate}
              </span>
            </div>

            {/* Error vs Correction Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              <div style={{
                background: 'var(--stitch-error-container)',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '10px 14px',
                fontSize: '13px'
              }}>
                <span style={{ color: 'var(--stitch-error)', fontWeight: 700, display: 'block', fontSize: '11px' }}>
                  اختيارك الخاطئ السابق:
                </span>
                <strong style={{ color: 'var(--stitch-text-primary)' }}>{item.distractorChosen}</strong>
              </div>

              <div style={{
                background: 'var(--stitch-secondary-container)',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '10px 14px',
                fontSize: '13px'
              }}>
                <span style={{ color: 'var(--stitch-on-secondary-container)', fontWeight: 700, display: 'block', fontSize: '11px' }}>
                  الإجابة السريرية الصحيحة:
                </span>
                <strong style={{ color: 'var(--stitch-text-primary)' }}>{item.correctAnswer}</strong>
              </div>
            </div>

            {/* Pearl Callout */}
            <div style={{
              background: 'var(--stitch-surface-container-low)',
              borderRight: '3px solid var(--stitch-primary)',
              padding: '10px 14px',
              borderRadius: 'var(--stitch-radius-md)',
              fontSize: '13px',
              color: 'var(--stitch-text-secondary)'
            }}>
              <strong style={{ color: 'var(--stitch-primary)' }}>اللؤلؤة العلاجية: </strong>
              <span>{item.pearl}</span>
            </div>

            {/* Retest Single Question Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setView('tutor-player')}
                style={{
                  background: 'var(--stitch-surface-container-high)',
                  color: 'var(--stitch-primary)',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={13} />
                <span>إعادة التدريب الفوري على هذا السؤال</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StitchReviewCenter;
