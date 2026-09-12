import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Play, 
  Sparkles, 
  Hourglass, 
  Activity, 
  ChevronLeft, 
  Target, 
  CheckSquare2, 
  RotateCcw,
  Stethoscope
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchStudyPlan() {
  const { tests, startExam, openSmartReview, setView } = useStitch();

  // State for daily tasks completion
  const [tasks, setTasks] = useState([
    { id: 1, title: 'حل 20 سؤالاً في طب القلب والجهاز الدوري (Cardiology Block)', duration: '25 دقيقة', done: true, tag: 'High-Yield MCQs', testId: tests[0]?.id },
    { id: 2, title: 'مراجعة أدوية الضغط والصدمات القلبية (Pharmacology Review)', duration: '15 دقيقة', done: true, tag: 'Flashcards', action: 'flashcards' },
    { id: 3, title: 'قراءة اللمحات السريرية لتخطيط القلب (ECG Clinical Glimpses)', duration: '10 دقائق', done: false, tag: '3D Cards', view: 'glimpses' },
    { id: 4, title: 'محاكاة اختبار موقوت لبلوك الطوارئ (Emergency Mini-Mock)', duration: '30 دقيقة', done: false, tag: 'Timed Exam', testId: tests[1]?.id || tests[0]?.id }
  ]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const completedCount = tasks.filter(t => t.done).length;

  const weekDays = [
    { day: 'السبت', date: '10 سبت', progress: '60 / 60', topic: 'باطني: كلى وغدد', completed: true },
    { day: 'الأحد', date: '11 سبت', progress: '50 / 50', topic: 'جراحة عامة + بلوك', completed: true },
    { day: 'الإثنين', date: '12 سبت', progress: '60 / 60', topic: 'أمراض نساء وتوليد', completed: true },
    { day: 'الثلاثاء', date: '13 سبت', progress: '60 / 60', topic: 'طب الأطفال + نمو', completed: true },
    { day: 'الأربعاء', date: 'اليوم', progress: `${completedCount * 15} / 60`, topic: 'قلب + فارما + ECG', active: true },
    { day: 'الخميس', date: '15 سبت', progress: '0 / 60', topic: 'باطني + جراحة عظام', upcoming: true },
    { day: 'الجمعة', date: '16 سبت', progress: 'إجازة', topic: 'راحة واستشفاء سريري', rest: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Calendar size={22} color="var(--stitch-primary-container)" />
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>خطة المذاكرة والمهام اليومية</h2>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-muted)' }}>
            جدول سريري منضبط وموجه لاجتياز اختبارات الترخيص والبورد الطبي
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: 'var(--stitch-radius-md)',
            background: 'var(--stitch-secondary-container)',
            color: 'var(--stitch-on-secondary-container)'
          }}>
            خطة نشطة: متبقي 24 يوماً
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="stitchMetricsGrid">
        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">تقدم الخطة الكلي</span>
            <div className="stitchMetricValues">
              <b>18</b>
              <span>/ 24 يوماً</span>
            </div>
            <span className="stitchMetricFootnote">
              <CheckCircle2 size={14} /> 75% نسبة الالتزام
            </span>
          </div>
          <div className="stitchMetricIconSquare">
            <Target size={24} />
          </div>
        </div>

        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">إنجاز اليوم المستهدف</span>
            <div className="stitchMetricValues">
              <b>{completedCount * 15}</b>
              <span>/ 60 سؤالاً</span>
            </div>
            <span className="stitchMetricFootnote">
              متبقي {60 - (completedCount * 15)} سؤالاً
            </span>
          </div>
          <div className="stitchMetricIconSquare">
            <CheckSquare2 size={24} />
          </div>
        </div>

        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">رصيد بنك الأسئلة المخطط</span>
            <div className="stitchMetricValues">
              <b>1,842</b>
              <span>/ 2,450</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--stitch-primary)', fontWeight: 600 }}>
              75.1% منجز
            </span>
          </div>
          <div className="stitchMetricIconSquare">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">الوقت التقديري لليوم</span>
            <div className="stitchMetricValues">
              <b>1س 20د</b>
              <span>متبقي</span>
            </div>
            <span className="stitchMetricFootnote">
              <Clock size={14} /> موزع صباحاً ومساءً
            </span>
          </div>
          <div className="stitchMetricIconSquare">
            <Hourglass size={24} />
          </div>
        </div>
      </div>

      {/* 7-Day Weekly Strip */}
      <div style={{
        background: 'var(--stitch-bg-surface)',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-lg)',
        padding: '20px',
        boxShadow: 'var(--stitch-shadow-sm)'
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800 }}>
          الجدول الزمني للأسبوع السريري
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px'
        }}>
          {weekDays.map((w, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px',
                borderRadius: 'var(--stitch-radius-md)',
                background: w.active ? 'var(--stitch-surface-container-high)' : 'var(--stitch-surface-container-low)',
                border: '1px solid',
                borderColor: w.active ? 'var(--stitch-primary-container)' : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '12px', color: w.active ? 'var(--stitch-primary-container)' : 'var(--stitch-text-primary)' }}>
                  {w.day}
                </b>
                <span style={{ fontSize: '10px', color: 'var(--stitch-text-muted)' }}>{w.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
                {w.completed && <CheckCircle2 size={14} color="var(--stitch-secondary)" />}
                <span style={{ fontSize: '11px', fontWeight: 700, color: w.completed ? 'var(--stitch-secondary)' : 'inherit' }}>
                  {w.progress}
                </span>
              </div>
              <small style={{ fontSize: '10px', color: 'var(--stitch-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {w.topic}
              </small>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Tasks Interactive Checklist */}
      <div style={{
        background: 'var(--stitch-bg-surface)',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-lg)',
        padding: '20px',
        boxShadow: 'var(--stitch-shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>مهام اليوم الإكلينيكية المجدولة</h3>
            <small style={{ color: 'var(--stitch-text-muted)' }}>إنجاز {completedCount} من {tasks.length} مهام</small>
          </div>
          <div style={{ width: '120px', height: '6px', borderRadius: '999px', background: 'var(--stitch-surface-container-highest)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '999px', background: 'var(--stitch-primary-container)', width: `${(completedCount / tasks.length) * 100}%` }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map(task => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--stitch-radius-md)',
                background: task.done ? 'var(--stitch-surface-container-low)' : 'var(--stitch-bg-surface)',
                border: '1px solid var(--stitch-border)',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--stitch-primary-container)' }}
                />
                <div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: task.done ? 'var(--stitch-text-muted)' : 'var(--stitch-text-primary)',
                    textDecoration: task.done ? 'line-through' : 'none',
                    display: 'block'
                  }}>
                    {task.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--stitch-text-muted)' }}>⏱ {task.duration}</span>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--stitch-surface-container)', color: 'var(--stitch-primary-container)', fontWeight: 700 }}>
                      {task.tag}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {task.testId && (
                  <button
                    type="button"
                    onClick={() => startExam(task.testId!)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'var(--stitch-primary-container)',
                      color: '#fff',
                      border: 0,
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Play size={12} fill="#fff" />
                    <span>ابدأ الآن</span>
                  </button>
                )}
                {task.action === 'flashcards' && (
                  <button
                    type="button"
                    onClick={() => openSmartReview('flashcards')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'var(--stitch-surface-container)',
                      color: 'var(--stitch-primary-container)',
                      border: '1px solid var(--stitch-border)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>فتح البطاقات</span>
                  </button>
                )}
                {task.view === 'glimpses' && (
                  <button
                    type="button"
                    onClick={() => setView('glimpses')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'var(--stitch-surface-container)',
                      color: 'var(--stitch-primary-container)',
                      border: '1px solid var(--stitch-border)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>تصفح اللمحات</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default StitchStudyPlan;
