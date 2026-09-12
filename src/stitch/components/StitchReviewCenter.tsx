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

export function StitchReviewCenter() {
  const { setView, openSmartReview, notify, history, startExam } = useStitch();
  const [activeTab, setActiveTab] = useState<'incorrect' | 'bookmarks' | 'remediation'>('incorrect');

  const failedAttempts = history.filter(h => !h.passed);

  const handleLaunchTargetedRecovery = () => {
    openSmartReview('quizBuilder');
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
            background: failedAttempts.length > 0 ? 'var(--stitch-error-container)' : 'var(--stitch-secondary-container)',
            color: failedAttempts.length > 0 ? 'var(--stitch-on-error-container)' : 'var(--stitch-on-secondary-container)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            {failedAttempts.length > 0 ? `${failedAttempts.length} اختبارات تحتاج إعادة ومراجعة` : 'لا توجد اختبارات غير مجتازة'}
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
        {failedAttempts.length === 0 ? (
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-lg)',
            padding: '40px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CheckCircle2 size={48} color="var(--stitch-primary)" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
              سجلّك خالٍ من الاختبارات غير المجتازة!
            </h3>
            <p style={{ margin: 0, color: 'var(--stitch-text-secondary)', fontSize: '14px', maxWidth: '480px' }}>
              جميع الاختبارات التي أنهيتها حققت فيها نسبة الاجتياز المطلوبة. يمكنك متابعة التدريب أو المراجعة الذكية للبطاقات.
            </p>
            <button
              type="button"
              onClick={() => openSmartReview('flashcards')}
              style={{
                marginTop: '8px',
                padding: '10px 20px',
                background: 'var(--stitch-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--stitch-radius-md)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              فتح مراجعة البطاقات الذكية
            </button>
          </div>
        ) : (
          failedAttempts.map(item => (
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
                    {item.percentage}%
                  </span>
                  <strong style={{ fontSize: '15px', color: 'var(--stitch-text-primary)' }}>
                    {item.title}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>({item.subject})</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>
                  تاريخ المحاولة: {new Intl.DateTimeFormat('ar-IQ').format(new Date(item.finishedAt))}
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
                    الدرجة المحققة:
                  </span>
                  <strong style={{ color: 'var(--stitch-text-primary)' }}>{item.percentage}% (دون حد الاجتياز)</strong>
                </div>

                <div style={{
                  background: 'var(--stitch-secondary-container)',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '10px 14px',
                  fontSize: '13px'
                }}>
                  <span style={{ color: 'var(--stitch-on-secondary-container)', fontWeight: 700, display: 'block', fontSize: '11px' }}>
                    حالة السجل:
                  </span>
                  <strong style={{ color: 'var(--stitch-text-primary)' }}>إعادة الاختبار مطلوبة لإصدار الشهادة</strong>
                </div>
              </div>

              {/* Retest Single Question Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => startExam(item.testId || item.id)}
                  style={{
                    background: 'var(--stitch-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--stitch-radius-md)',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCcw size={14} />
                  <span>إعادة هذا الاختبار الآن</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StitchReviewCenter;
