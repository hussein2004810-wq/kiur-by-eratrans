import React, { useMemo } from 'react';
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
  const { setView, tests, history, summary, catalog } = useStitch();

  const totalAvailableQuestions = tests.reduce((acc, t) => acc + (t.questionCount || 0), 0);
  const completedAttempts = history.length;
  const passedAttempts = history.filter(h => h.passed).length;
  const passRate = completedAttempts > 0 ? Math.round((passedAttempts / completedAttempts) * 100) : 0;
  const avgAccuracy = summary.averagePercentage || 0;

  const systemsData = useMemo(() => {
    const subjectNames = Array.from(new Set([
      ...(catalog?.subjects?.map(s => s.name) || []),
      ...tests.map(t => t.subjectName || t.subject).filter(Boolean)
    ]));

    if (subjectNames.length === 0) {
      return [
        { name: 'العلوم الطبية التأسيسية والسريرية', done: completedAttempts, total: totalAvailableQuestions, accuracy: avgAccuracy, status: 'good' }
      ];
    }

    return subjectNames.map(name => {
      const subjectTests = tests.filter(t => (t.subjectName || t.subject) === name);
      const subjectQuestions = subjectTests.reduce((acc, t) => acc + (t.questionCount || 0), 0);
      const subjectHistory = history.filter(h => h.subject === name);
      const done = subjectHistory.length;
      const accuracy = done > 0 
        ? Math.round(subjectHistory.reduce((acc, h) => acc + (h.percentage || 0), 0) / done) 
        : 0;
      const status: 'good' | 'moderate' | 'critical' = accuracy >= 75 ? 'good' : accuracy >= 50 ? 'moderate' : 'critical';

      return {
        name,
        done,
        total: subjectQuestions || (subjectTests.length * 10),
        accuracy,
        status
      };
    });
  }, [catalog, tests, history, completedAttempts, totalAvailableQuestions, avgAccuracy]);

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
            تحديث فوري متزامن مع نتائجك
          </span>
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--stitch-text-primary)' }}>
            تحليلات الأداء والجاهزية الأكاديمية
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--stitch-text-secondary)', fontSize: '14px' }}>
            تقييم تراكمي حقيقي لنسبة الإتقان ومعدل الدرجات والاختبارات المنجزة في مسارك الدراسي.
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
            <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>المتوسط العام للدرجات</span>
            <TrendingUp size={18} color="var(--stitch-secondary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '32px', color: 'var(--stitch-primary)', fontWeight: 800 }}>{avgAccuracy}%</strong>
            <span style={{ fontSize: '12px', color: avgAccuracy >= 60 ? 'var(--stitch-secondary)' : 'var(--stitch-error)', fontWeight: 600 }}>
              {avgAccuracy >= 60 ? 'أداء مؤهل للاجتياز' : 'يحتاج تعزيز ومراجعة'}
            </span>
          </div>
          <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px' }}>
            محسوبة بناءً على {completedAttempts} محاولة مسجلة
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
            <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>الاختبارات الناجحة</span>
            <Award size={18} color="var(--stitch-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '32px', color: 'var(--stitch-secondary)', fontWeight: 800 }}>{passedAttempts}</strong>
            <span style={{ fontSize: '12px', color: 'var(--stitch-primary)', fontWeight: 600 }}>
              من أصل {completedAttempts} محاولة
            </span>
          </div>
          <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px' }}>
            نسبة النجاح الإجمالية: {passRate}%
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
            <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>بنك الاختبارات المتاحة</span>
            <BookOpen size={18} color="var(--stitch-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '32px', color: 'var(--stitch-text-primary)', fontWeight: 800 }}>{tests.length}</strong>
            <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>
              اختبار منشور
            </span>
          </div>
          <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px' }}>
            إجمالي {totalAvailableQuestions} سؤالاً معتمداً في المنصة
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
            <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>معدل الإنجاز</span>
            <CheckCircle2 size={18} color="var(--stitch-secondary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '32px', color: 'var(--stitch-text-primary)', fontWeight: 800 }}>{passRate}%</strong>
            <span style={{ fontSize: '12px', color: 'var(--stitch-secondary)', fontWeight: 600 }}>
              {passRate >= 70 ? 'ممتاز' : 'مستمر'}
            </span>
          </div>
          <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px' }}>
            شهادات الإنجاز الصادرة: {passedAttempts}
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
