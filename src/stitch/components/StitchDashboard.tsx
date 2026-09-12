import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchDashboard() {
  const { user, tests, history, startExam, openSmartReview, setView } = useStitch();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  // Derive specialties from available tests or standard SCFHS / Iraqi curriculum
  const specialties = [
    { id: 'internal', name: 'الطب الباطني (Internal Medicine)', icon: Stethoscope, progress: 78, answered: 610, total: 780, tone: 'primary', level: 'مستوى متقدم' },
    { id: 'surgery', name: 'الجراحة العامة (General Surgery)', icon: Activity, progress: 64, answered: 390, total: 610, tone: 'secondary', level: 'مستوى متوسط' },
    { id: 'pediatrics', name: 'طب الأطفال (Pediatrics)', icon: Baby, progress: 81, answered: 312, total: 385, tone: 'tertiary', level: 'مستوى ممتاز' },
    { id: 'obgyn', name: 'النساء والتوليد (OB/GYN)', icon: HeartPulse, progress: 54, answered: 180, total: 330, tone: 'error', level: 'يحتاج تعزيز' }
  ];

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
                  background: 'var(--stitch-error)',
                  color: '#fff',
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
                  background: 'var(--stitch-error)',
                  color: '#fff'
                }}>
                  13 ثغرة
                </span>
              </div>
              <div>
                <b style={{ display: 'block', fontSize: '13px', color: 'var(--stitch-text-primary)', marginBottom: '3px' }}>
                  مركز مراجعة الأخطاء
                </b>
                <small style={{ fontSize: '11px', color: 'var(--stitch-text-muted)', lineHeight: '1.4' }}>
                  خطة تعافي سريري موجهة لسد الثغرات
                </small>
              </div>
            </button>

            {/* Card 3: SMLE Mock Exam */}
            <button
              type="button"
              onClick={() => setView('exam-player')}
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
                  محاكاة SMLE الموقوتة
                </b>
                <small style={{ fontSize: '11px', color: 'var(--stitch-text-muted)', lineHeight: '1.4' }}>
                  بلوك تجريبي 40 سؤالاً ببيئة Prometric
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
                  مقارنة مع الدفعة والمئين التنافسي
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
                Case ID: #8921
              </span>
            </div>

            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--stitch-text-primary)', lineHeight: '1.5' }}>
              {pearlQuestion
                ? `حالة سريرية: ${pearlQuestion.title} — ${pearlQuestion.subject}`
                : 'حالة سريرية: رجل يبلغ 54 عاماً يعاني من ضيق تنفس جهدي ونفخة انقباضية'}
            </h4>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: '1.6' }}>
              {pearlQuestion
                ? `محاضرة ${pearlQuestion.lecture}. يشمل الاختبار ${pearlQuestion.questionCount} أسئلة سريرية محكمة مع تفسير كامل للمشتتات.`
                : 'راجع مريض غرفة الطوارئ بأعراض متزايدة على مدى أسبوعين. يظهر تخطيط القلب تضخماً في البطين الأيسر. ما هي الخطوة التشخيصية الأكثر دقة؟'}
            </p>

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
                  <Timer size={15} /> دقيقة واحدة
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={15} /> أجاب عليه 84% من الطلبة
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
