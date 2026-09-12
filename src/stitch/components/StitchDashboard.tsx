import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  SlidersHorizontal, 
  RotateCcw, 
  CheckSquare, 
  HeartPulse, 
  Timer, 
  Users, 
  ChevronLeft, 
  BarChart3, 
  Stethoscope, 
  Baby, 
  Activity, 
  CheckCircle2, 
  ArrowRight,
  BookOpen,
  Calendar,
  Brain
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchDashboard() {
  const { user, catalog, tests, history, startExam, openSmartReview, setView } = useStitch();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  // Derive real specialties dynamically from catalog and tests
  const specialties = useMemo(() => {
    const subjectNames = Array.from(new Set([
      ...(catalog?.subjects?.map(s => s.name) || []),
      ...tests.map(t => t.subjectName || t.subject).filter(Boolean)
    ]));

    if (subjectNames.length === 0) {
      return [
        { id: 'general', name: 'العلوم الطبية والسريرية', icon: Stethoscope, progress: 0, answered: 0, total: tests.reduce((acc, t) => acc + (t.questionCount || 0), 0), tone: 'primary', level: 'لم يُختبر بعد' }
      ];
    }

    return subjectNames.slice(0, 6).map((name, idx) => {
      const subjectTests = tests.filter(t => (t.subjectName || t.subject) === name);
      const totalQuestions = subjectTests.reduce((acc, t) => acc + (t.questionCount || 0), 0);
      const subjectHistory = history.filter(h => h.subject === name);
      const answeredCount = subjectHistory.length;
      
      let progress = 0;
      let level = 'لم يُختبر بعد';
      let tone = 'primary';
      
      if (answeredCount > 0) {
        const avg = Math.round(subjectHistory.reduce((acc, h) => acc + (h.percentage || 0), 0) / answeredCount);
        progress = avg;
        if (avg >= 80) {
          level = 'مستوى ممتاز';
          tone = 'tertiary';
        } else if (avg >= 60) {
          level = 'مستوى متقدم';
          tone = 'secondary';
        } else {
          level = 'يحتاج تعزيز';
          tone = 'error';
        }
      }

      const icons = [Stethoscope, Activity, Baby, HeartPulse, Brain, BookOpen];
      const icon = icons[idx % icons.length];

      return {
        id: `subj-${idx}`,
        name,
        icon,
        progress,
        answered: answeredCount,
        total: totalQuestions || (subjectTests.length * 10),
        tone,
        level
      };
    });
  }, [catalog, tests, history]);

  const failedAttempts = history.filter(h => !h.passed);
  const failedCount = failedAttempts.length;

  // High-yield pearl of the day
  const pearlQuestion = tests[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
      
      {/* Central Grid: Quick Actions Mosaic (7 cols) & Performance By Specialty (5 cols) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Right Section: Suggested Quick Actions Mosaic */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--stitch-primary-container)" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--stitch-text-primary)' }}>
                الإجراءات السريرية المقترحة
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--stitch-text-muted)', fontWeight: 600 }}>
              وفق ثغرات الأداء والامتحانات
            </span>
          </div>

          {/* 3 Quick Action Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {/* Card 1: Q-Bank Session Builder */}
            <button
              type="button"
              onClick={() => setView('qbank')}
              style={{
                padding: '16px',
                borderRadius: 'var(--stitch-radius-lg)',
                background: 'var(--stitch-bg-surface)',
                border: '1px solid var(--stitch-border)',
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                cursor: 'pointer',
                boxShadow: 'var(--stitch-shadow-sm)',
                minHeight: '140px',
                transition: 'transform 0.15s ease, border-color 0.15s ease'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--stitch-primary-container)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center'
              }}>
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <b style={{ display: 'block', fontSize: '13px', color: 'var(--stitch-text-primary)', marginBottom: '3px' }}>
                  بنك الأسئلة والمحاكاة
                </b>
                <small style={{ fontSize: '11px', color: 'var(--stitch-text-muted)', lineHeight: '1.4' }}>
                  تخصيص البلوك وتحديد التخصص والنمط
                </small>
              </div>
            </button>

            {/* Card 2: Review Center & Remediation */}
            <button
              type="button"
              onClick={() => setView('review-center')}
              style={{
                padding: '16px',
                borderRadius: 'var(--stitch-radius-lg)',
                background: 'var(--stitch-surface-container-low)',
                border: '1px solid var(--stitch-border)',
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                cursor: 'pointer',
                boxShadow: 'var(--stitch-shadow-sm)',
                minHeight: '140px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: failedCount > 0 ? 'var(--stitch-error)' : 'var(--stitch-secondary-container)',
                  color: failedCount > 0 ? '#fff' : 'var(--stitch-on-secondary-container)',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <RotateCcw size={20} />
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: failedCount > 0 ? 'var(--stitch-error)' : 'var(--stitch-primary)',
                  color: '#fff'
                }}>
                  {failedCount > 0 ? `${failedCount} ثغرة` : 'جاهزية تامة'}
                </span>
              </div>
              <div>
                <b style={{ display: 'block', fontSize: '13px', color: 'var(--stitch-text-primary)', marginBottom: '3px' }}>
                  مركز مراجعة الأخطاء
                </b>
                <small style={{ fontSize: '11px', color: 'var(--stitch-text-muted)', lineHeight: '1.4' }}>
                  {failedCount > 0 ? 'خطة تعافي سريري موجهة لسد الثغرات' : 'لا توجد أخطاء حالية في سجلّك'}
                </small>
              </div>
            </button>

            {/* Card 3: Timed Exam */}
            <button
              type="button"
              onClick={() => {
                if (tests.length > 0) {
                  const formalTest = tests.find(t => t.examMode === 'formal') || tests[0];
                  startExam(formalTest.id);
                } else {
                  setView('tests');
                }
              }}
              style={{
                padding: '16px',
                borderRadius: 'var(--stitch-radius-lg)',
                background: 'var(--stitch-bg-surface)',
                border: '1px solid var(--stitch-border)',
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                cursor: 'pointer',
                boxShadow: 'var(--stitch-shadow-sm)',
                minHeight: '140px'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--stitch-secondary-container)',
                color: 'var(--stitch-on-secondary-container)',
                display: 'grid',
                placeItems: 'center'
              }}>
                <CheckSquare size={20} />
              </div>
              <div>
                <b style={{ display: 'block', fontSize: '13px', color: 'var(--stitch-text-primary)', marginBottom: '3px' }}>
                  محاكاة الاختبارات الموقوتة
                </b>
                <small style={{ fontSize: '11px', color: 'var(--stitch-text-muted)', lineHeight: '1.4' }}>
                  {tests.length > 0 ? `${tests.length} اختبارات معتمدة ببيئة إلكترونية` : 'ابدأ جلستك التدريبية'}
                </small>
              </div>
            </button>

            {/* Card 4: Analytics */}
            <button
              type="button"
              onClick={() => setView('analytics')}
              style={{
                padding: '16px',
                borderRadius: 'var(--stitch-radius-lg)',
                background: 'var(--stitch-bg-surface)',
                border: '1px solid var(--stitch-border)',
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                cursor: 'pointer',
                boxShadow: 'var(--stitch-shadow-sm)',
                minHeight: '140px'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--stitch-surface-container-high)',
                color: 'var(--stitch-primary)',
                display: 'grid',
                placeItems: 'center'
              }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <b style={{ display: 'block', fontSize: '13px', color: 'var(--stitch-text-primary)', marginBottom: '3px' }}>
                  تحليلات الأداء والجاهزية
                </b>
                <small style={{ fontSize: '11px', color: 'var(--stitch-text-muted)', lineHeight: '1.4' }}>
                  سجل المحاولات ومستوى التقدّم
                </small>
              </div>
            </button>
          </div>

          {/* Clinical High-Yield Case Spotlight */}
          <div style={{
            background: 'var(--stitch-bg-surface)',
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
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 'var(--stitch-radius-sm)',
                background: 'var(--stitch-surface-container)',
                color: 'var(--stitch-primary-container)'
              }}>
                سؤال اليوم عالي الأهمية (High-Yield Pearl)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--stitch-text-muted)', fontFamily: 'monospace' }}>
                {pearlQuestion ? `ID: #${pearlQuestion.id.slice(0, 6).toUpperCase()}` : 'ID: #KIUR-01'}
              </span>
            </div>

            {pearlQuestion ? (
              <>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--stitch-text-primary)', lineHeight: '1.5' }}>
                  حالة سريرية: {pearlQuestion.title} — {pearlQuestion.subjectName || pearlQuestion.subject}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: '1.6' }}>
                  محاضرة {pearlQuestion.lectureName || pearlQuestion.lecture}. يشمل الاختبار {pearlQuestion.questionCount} أسئلة سريرية محكمة مع مراجعة تصحيحية فورية.
                </p>
              </>
            ) : (
              <>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--stitch-text-primary)', lineHeight: '1.5' }}>
                  حالة سريرية ومراجعة فورية
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: '1.6' }}>
                  اختر أحد الاختبارات المتاحة في مسارك الأكاديمي لبدء المراجعة والتدريب السريري التفاعلي.
                </p>
              </>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--stitch-border)',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--stitch-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Timer size={15} /> {pearlQuestion ? `${pearlQuestion.durationMinutes} دقيقة` : '15 دقيقة'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={15} /> {pearlQuestion ? `${pearlQuestion.questionCount} سؤال` : 'محتوى معتمد'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (pearlQuestion) startExam(pearlQuestion.id);
                  else setView('tests');
                }}
                style={{
                  minHeight: '38px',
                  padding: '0 16px',
                  borderRadius: 'var(--stitch-radius-md)',
                  background: 'var(--stitch-primary-container)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 0,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>حل السؤال السريع</span>
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Left Section: Performance By Specialty */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="var(--stitch-primary-container)" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--stitch-text-primary)' }}>
                الأداء حسب التخصصات
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setView('history')}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--stitch-primary-container)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              التقرير المفصل
            </button>
          </div>

          <div style={{
            background: 'var(--stitch-bg-surface)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-lg)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--stitch-shadow-sm)'
          }}>
            {specialties.map(spec => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--stitch-radius-md)',
                    background: selectedSpecialty === spec.id ? 'var(--stitch-surface-container-low)' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedSpecialty === spec.id ? 'var(--stitch-border)' : 'transparent',
                    cursor: 'pointer',
                    transition: '0.15s ease'
                  }}
                  onClick={() => setSelectedSpecialty(selectedSpecialty === spec.id ? null : spec.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--stitch-surface-container)',
                        color: 'var(--stitch-primary-container)',
                        display: 'grid',
                        placeItems: 'center'
                      }}>
                        <Icon size={18} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                        {spec.name}
                      </span>
                    </div>
                    <b style={{ fontSize: '14px', color: 'var(--stitch-primary-container)' }}>
                      {spec.progress}%
                    </b>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    width: '100%',
                    height: '7px',
                    borderRadius: '999px',
                    background: 'var(--stitch-surface-container-highest)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      borderRadius: '999px',
                      background: 'var(--stitch-primary-container)',
                      width: `${spec.progress}%`
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--stitch-text-muted)' }}>
                    <span>{spec.answered} من أصل {spec.total} سؤالاً</span>
                    <span style={{ color: 'var(--stitch-secondary)', fontWeight: 600 }}>{spec.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

export default StitchDashboard;
