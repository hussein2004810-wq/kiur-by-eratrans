import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Play, 
  TrendingUp, 
  Brain, 
  RotateCcw, 
  ShieldCheck, 
  HelpCircle,
  Activity,
  Award
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchRemediationPlan() {
  const { setView, notify } = useStitch();
  const [remediationStep, setRemediationStep] = useState<number>(1);

  const handleStartRemediationBlock = () => {
    notify('تم إطلاق بلوك التعافي السريري الموجه (15 سؤالاً مستهدفاً للأخطاء)');
    setView('tutor-player');
  };

  return (
    <div className="stitchRemediationContainer" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--stitch-text-muted)' }}>
          <span>مركز المراجعة</span>
          <span>←</span>
          <span style={{ color: 'var(--stitch-primary)', fontWeight: 600 }}>خطة التعافي السريري المستهدف</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--stitch-text-primary)' }}>
              خطة التعافي السريري وسد الفجوات المعرفية
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--stitch-text-secondary)', fontSize: '14px' }}>
              تشخيص تحليلي محايد ومبني على الأدلة لمعالجة 13 مفهوماً سريرياً حرجاً قبل موعد الامتحان الوطني.
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartRemediationBlock}
            style={{
              background: 'var(--stitch-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--stitch-shadow-md)'
            }}
          >
            <Play size={16} fill="currentColor" />
            <span>بدء جلسة التعافي (15 سؤالاً)</span>
          </button>
        </div>
      </div>

      {/* Objective Clinical De-escalation Banner */}
      <div style={{
        background: 'var(--stitch-surface-container-low)',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--stitch-radius-md)',
          background: 'var(--stitch-surface-container-high)',
          color: 'var(--stitch-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Activity size={22} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <strong style={{ fontSize: '15px', color: 'var(--stitch-text-primary)' }}>
            تشخيص تحليلي محايد لجلسات الاختبار التجريبي
          </strong>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: 'var(--stitch-text-secondary)' }}>
            هناك فجوات معرفية محددة تستحق التوقف والمراجعة المتأنية قبل التقدم للمرحلة التالية. نتائج هذه الجلسة ليست تقييماً لمستواك العام، بل هي أداة تشخيصية موضوعية تساعدك على تركيز جهدك على المفاهيم الدوائية ذات المردود السريري الأعلى ووقايتك من تكرارها في الاختبار الحقيقي.
          </p>
        </div>
      </div>

      {/* Target Focus Domains */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {/* Domain 1 */}
        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-lg)',
          padding: '20px',
          boxShadow: 'var(--stitch-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              background: 'var(--stitch-error-container)',
              color: 'var(--stitch-on-error-container)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700
            }}>
              أولوية قصوى • Critical
            </span>
            <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>Cardiovascular</span>
          </div>

          <strong style={{ fontSize: '16px', color: 'var(--stitch-text-primary)' }}>
            Arrhythmias: Rate vs Rhythm Control & Adenosine Contraindications
          </strong>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: 1.6 }}>
            الخلط المتكرر بين تدبير SVT بالأدينوسين وبين تدبير الرجفان الأذيني (AF) بحاصرات بيتا وقنوات الكالسيوم.
          </p>

          <div style={{
            background: 'var(--stitch-surface-container-low)',
            borderRadius: 'var(--stitch-radius-md)',
            padding: '10px 12px',
            fontSize: '12px',
            color: 'var(--stitch-primary)',
            fontWeight: 600
          }}>
            خطة التدريب: 5 حالات سريرية مركزة مع تخطيط ECG ومقارنات أدوية.
          </div>
        </div>

        {/* Domain 2 */}
        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-lg)',
          padding: '20px',
          boxShadow: 'var(--stitch-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              background: 'var(--stitch-error-container)',
              color: 'var(--stitch-on-error-container)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700
            }}>
              أولوية قصوى • Critical
            </span>
            <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>Nephrology & Fluids</span>
          </div>

          <strong style={{ fontSize: '16px', color: 'var(--stitch-text-primary)' }}>
            Acute Severe Hypercalcemia & Fluid Resuscitation Order
          </strong>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: 1.6 }}>
            إعطاء المدرات البولية مبكراً قبل استعادة الحجم الوعائي الكامل بالمحلول الملحي متساوي التوتر.
          </p>

          <div style={{
            background: 'var(--stitch-surface-container-low)',
            borderRadius: 'var(--stitch-radius-md)',
            padding: '10px 12px',
            fontSize: '12px',
            color: 'var(--stitch-primary)',
            fontWeight: 600
          }}>
            خطة التدريب: 4 أسئلة عن بروتوكول الإماهة وجرعات البيسفوسفونات ومراقبة الأملاح.
          </div>
        </div>

        {/* Domain 3 */}
        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-lg)',
          padding: '20px',
          boxShadow: 'var(--stitch-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              background: 'var(--stitch-surface-container-high)',
              color: 'var(--stitch-primary)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700
            }}>
              مستوى متوسط • Intermediate
            </span>
            <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>Emergency Trauma</span>
          </div>

          <strong style={{ fontSize: '16px', color: 'var(--stitch-text-primary)' }}>
            Tension Pneumothorax vs Cardiac Tamponade Differentiation
          </strong>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: 1.6 }}>
            التفريق الفوري بين ثالوث بيك (Beck Triad) وأصوات التنفس الغائبة مع انحراف الرغامى في الصدمة الانسدادية.
          </p>

          <div style={{
            background: 'var(--stitch-surface-container-low)',
            borderRadius: 'var(--stitch-radius-md)',
            padding: '10px 12px',
            fontSize: '12px',
            color: 'var(--stitch-primary)',
            fontWeight: 600
          }}>
            خطة التدريب: 6 حالات رضوض إسعافية (ATLS Guidelines).
          </div>
        </div>
      </div>
    </div>
  );
}

export default StitchRemediationPlan;
