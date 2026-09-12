import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  HeartPulse, 
  Brain, 
  Sparkles, 
  BookOpen, 
  Target, 
  ArrowUpRight 
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchAnalytics() {
  const { setView } = useStitch();

  const systemsData = [
    { name: 'الطب الباطني (Internal Medicine)', done: 620, total: 850, accuracy: 74, status: 'good' },
    { name: 'الجراحة العامة (General Surgery)', done: 410, total: 600, accuracy: 68, status: 'moderate' },
    { name: 'طب الأطفال (Pediatrics)', done: 320, total: 420, accuracy: 76, status: 'good' },
    { name: 'النساء والتوليد (OB/GYN)', done: 280, total: 380, accuracy: 71, status: 'moderate' },
    { name: 'الطب النفسي (Psychiatry)', done: 120, total: 150, accuracy: 82, status: 'good' },
    { name: 'أمراض القلب (Cardiology Subsystem)', done: 115, total: 145, accuracy: 58, status: 'critical' },
    { name: 'علم الأدوية الكلوي (Renal Pharmacology)', done: 85, total: 110, accuracy: 62, status: 'critical' }
  ];

  return (
    <div className="stitchAnalyticsContainer" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
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
            <span>التحليل والسجل</span>
            <span>←</span>
            <span style={{ color: 'var(--stitch-primary)', fontWeight: 600 }}>لوحة تحليلات الأداء والتحصيل التراكمي</span>
          </div>
          <span style={{
            background: 'var(--stitch-surface-container-high)',
            color: 'var(--stitch-primary)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            تحديث فوري متزامن مع بنك الأسئلة
          </span>
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--stitch-text-primary)' }}>
            تحليلات الأداء السريري والجاهزية للاختبار الوطني
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--stitch-text-secondary)', fontSize: '14px' }}>
            تقييم تراكمي موضوعي لنسبة الدقة، سرعة الإجابة، ونقاط القوة والضعف مقارنة بمتوسط الدفعة الوطنية.
          </p>
        </div>
      </div>

      {/* KPI 4 Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-lg)',
          padding: '20px',
          boxShadow: 'var(--stitch-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>الدقة التراكمية العامة</span>
            <TrendingUp size={18} color="var(--stitch-secondary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '32px', color: 'var(--stitch-primary)', fontWeight: 800 }}>72.4%</strong>
            <span style={{ fontSize: '12px', color: 'var(--stitch-secondary)', fontWeight: 600 }}>
              +8.3% أعلى من متوسط الأقران (64.1%)
            </span>
          </div>
          <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px' }}>
            محسوبة على مدار 1,842 سؤالاً معتمداً
          </small>
        </div>

        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-lg)',
          padding: '20px',
          boxShadow: 'var(--stitch-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>الدرجة التقديرية (SMLE Score)</span>
            <Award size={18} color="var(--stitch-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '32px', color: 'var(--stitch-secondary)', fontWeight: 800 }}>685</strong>
            <span style={{ fontSize: '12px', color: 'var(--stitch-primary)', fontWeight: 600 }}>
              (مجال الثقة: 660 - 710)
            </span>
          </div>
          <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px' }}>
            حد الاجتياز الأدنى: 560 • الهدف التنافسي: 650+
          </small>
        </div>

        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-lg)',
          padding: '20px',
          boxShadow: 'var(--stitch-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>التقدم في بنك الأسئلة</span>
            <BookOpen size={18} color="var(--stitch-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '32px', color: 'var(--stitch-text-primary)', fontWeight: 800 }}>75.2%</strong>
            <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>
              1,842 من 2,450
            </span>
          </div>
          <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px' }}>
            608 أسئلة متبقية قبل إتمام البنك كاملاً
          </small>
        </div>

        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-lg)',
          padding: '20px',
          boxShadow: 'var(--stitch-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>متوسط سرعة الإجابة</span>
            <Clock size={18} color="var(--stitch-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '32px', color: 'var(--stitch-text-primary)', fontWeight: 800 }}>68s</strong>
            <span style={{ fontSize: '12px', color: 'var(--stitch-secondary)', fontWeight: 600 }}>
              ممتاز (&lt; 90s)
            </span>
          </div>
          <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px' }}>
            يوفر نحو 16 دقيقة إضافية للمراجعة في كل بلوك
          </small>
        </div>
      </div>

      {/* Specialty Breakdown Matrix */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
              مستوى الإتقان والدقة في التخصصات والأنظمة السريرية
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>
              Subject Mastery & Subsystem Accuracy
            </span>
          </div>
          <button
            type="button"
            onClick={() => setView('remediation')}
            style={{
              background: 'var(--stitch-surface-container-high)',
              color: 'var(--stitch-primary)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--stitch-radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            سد الفجوات في التخصصات الضعيفة
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {systemsData.map((sys, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: 'var(--stitch-text-primary)' }}>{sys.name}</strong>
                  {sys.status === 'critical' && (
                    <span style={{
                      background: 'var(--stitch-error-container)',
                      color: 'var(--stitch-on-error-container)',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      أولوية مراجعة عاجلة
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--stitch-text-muted)' }}>{sys.done} / {sys.total} سؤالاً</span>
                  <strong style={{
                    color: sys.status === 'critical' ? 'var(--stitch-error)' : sys.status === 'moderate' ? 'var(--stitch-primary)' : 'var(--stitch-secondary)',
                    fontWeight: 700,
                    width: '45px',
                    textAlign: 'left'
                  }}>
                    {sys.accuracy}%
                  </strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: 'var(--stitch-surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${sys.accuracy}%`,
                  height: '100%',
                  background: sys.status === 'critical' ? 'var(--stitch-error)' : sys.status === 'moderate' ? 'var(--stitch-primary)' : 'var(--stitch-secondary)',
                  borderRadius: '9999px'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StitchAnalytics;
