import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, 
  Stethoscope, 
  Activity, 
  Brain, 
  Baby, 
  Scissors, 
  Pill, 
  SlidersHorizontal, 
  Search, 
  CheckCircle2, 
  Play, 
  Sparkles, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  Filter, 
  Check, 
  Zap, 
  BookOpen 
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export interface SpecialtyItem {
  id: string;
  nameEn: string;
  nameAr: string;
  totalQuestions: number;
  accuracy: number;
  status: 'critical' | 'moderate' | 'good';
  icon: React.ComponentType<any>;
  topics: { name: string; count: number; highYield?: boolean }[];
  testsList?: any[];
}

export function StitchQBank({ 
  onStartCustomSession,
  onLaunchExamBlock
}: { 
  onStartCustomSession?: (specialty: string, count: number, mode: 'tutor' | 'exam') => void;
  onLaunchExamBlock?: () => void;
}) {
  const { setView, catalog, tests, history, startExam, openSmartReview } = useStitch();

  const specialties = useMemo<SpecialtyItem[]>(() => {
    const subjectList = catalog?.subjects?.length 
      ? catalog.subjects.map(s => ({ id: s.id, name: s.name }))
      : Array.from(new Set(tests.map(t => t.subjectName || t.subject).filter(Boolean))).map((name, i) => ({ id: `subj-${i}`, name }));

    if (subjectList.length === 0) {
      return [{
        id: 'general',
        nameEn: 'General Medicine',
        nameAr: 'العلوم الطبية والسريرية',
        totalQuestions: tests.reduce((sum, t) => sum + (t.questionCount || 0), 0),
        accuracy: 0,
        status: 'moderate',
        icon: HeartPulse,
        topics: [{ name: 'الاختبارات المنشورة والمقررات', count: tests.length, highYield: true }],
        testsList: tests
      }];
    }

    const icons = [HeartPulse, Stethoscope, Activity, Brain, Baby, Scissors];

    return subjectList.map((subj, idx) => {
      const subjectTests = tests.filter(t => t.subjectId === subj.id || (t.subjectName || t.subject) === subj.name);
      const totalQuestions = subjectTests.reduce((sum, t) => sum + (t.questionCount || 0), 0);
      const subjectHistory = history.filter(h => h.subject === subj.name);
      const done = subjectHistory.length;
      const accuracy = done > 0 ? Math.round(subjectHistory.reduce((sum, h) => sum + h.percentage, 0) / done) : 0;
      const status: 'critical' | 'moderate' | 'good' = accuracy >= 75 ? 'good' : accuracy >= 50 ? 'moderate' : 'critical';

      const lectures = catalog?.lectures?.filter(l => l.subjectId === subj.id) || [];
      const topics = lectures.length > 0
        ? lectures.map(l => ({
            name: l.name,
            count: subjectTests.filter(t => t.lectureId === l.id).reduce((sum, t) => sum + (t.questionCount || 0), 0) || 10,
            highYield: true
          }))
        : subjectTests.map(t => ({
            name: t.title,
            count: t.questionCount,
            highYield: true
          }));

      return {
        id: subj.id,
        nameEn: subj.name,
        nameAr: subj.name,
        totalQuestions: totalQuestions || (subjectTests.length * 10),
        accuracy,
        status,
        icon: icons[idx % icons.length],
        topics: topics.length > 0 ? topics : [{ name: 'المفاهيم السريرية الأساسية', count: totalQuestions || 10, highYield: true }],
        testsList: subjectTests
      };
    });
  }, [catalog, tests, history]);

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<'tutor' | 'exam'>('tutor');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [includeUnused, setIncludeUnused] = useState(true);
  const [includeIncorrect, setIncludeIncorrect] = useState(true);
  const [includeMarked, setIncludeMarked] = useState(false);
  const [highYieldOnly, setHighYieldOnly] = useState(true);

  const activeSpecialty = specialties.find(s => s.id === selectedSpecialty) || specialties[0];

  const handleStart = () => {
    if (selectedMode === 'tutor') {
      if (openSmartReview) {
        openSmartReview('quizBuilder');
      } else if (onStartCustomSession) {
        onStartCustomSession(activeSpecialty.id, questionCount, 'tutor');
      } else {
        setView('tests');
      }
    } else {
      if (activeSpecialty.testsList && activeSpecialty.testsList.length > 0) {
        startExam(activeSpecialty.testsList[0].id);
      } else if (tests.length > 0) {
        startExam(tests[0].id);
      } else {
        setView('tests');
      }
    }
  };

  return (
    <div className="stitchQBankContainer" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Clinical Breadcrumb & Hero */}
      <div className="stitchQBankHeader" style={{
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
            <span>بنك الأسئلة الطبي المركزي</span>
            <span>←</span>
            <span style={{ color: 'var(--stitch-primary)', fontWeight: 600 }}>إعداد جلسة تدريبية ومحاكاة</span>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--stitch-surface-container-high)',
            color: 'var(--stitch-primary)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600
          }}>
            <Sparkles size={14} />
            <span>معتمد وفق معايير التقييم السريري والبورد العراقي</span>
          </div>
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
            بنك الأسئلة الطبي المتقدم (Q-Bank)
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--stitch-text-secondary)', fontSize: '14px' }}>
            اختر التخصص والمنظومة الحيوية، واضبط ضوابط الجلسة للتدريب الفوري مع التفسيرات السريرية أو الاختبار المحاكي الموقوت.
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left/Main Column: Specialties & Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search and Filters Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-lg)',
            padding: '12px 16px'
          }}>
            <Search size={18} color="var(--stitch-text-muted)" />
            <input 
              type="text"
              placeholder="ابحث في التخصصات، المتلازمات، أو المفاهيم السريرية..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                color: 'var(--stitch-text-primary)'
              }}
            />
            <button 
              type="button"
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: filterDrawerOpen ? 'var(--stitch-primary)' : 'var(--stitch-surface-container)',
                color: filterDrawerOpen ? '#ffffff' : 'var(--stitch-text-primary)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--stitch-radius-md)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <Filter size={14} />
              <span>فلاتر بنك الأسئلة</span>
            </button>
          </div>

          {/* Filter Drawer / Accordion */}
          {filterDrawerOpen && (
            <div style={{
              background: 'var(--stitch-surface-container-low)',
              border: '1px solid var(--stitch-border)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                خيارات تصفية الأسئلة السريرية:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={includeUnused} 
                    onChange={e => setIncludeUnused(e.target.checked)} 
                    style={{ accentColor: 'var(--stitch-primary)' }}
                  />
                  <span>الأسئلة غير المنجزة (Unused)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={includeIncorrect} 
                    onChange={e => setIncludeIncorrect(e.target.checked)} 
                    style={{ accentColor: 'var(--stitch-error)' }}
                  />
                  <span style={{ color: 'var(--stitch-error)', fontWeight: 600 }}>الأسئلة الخاطئة مسبقاً (Incorrect)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={includeMarked} 
                    onChange={e => setIncludeMarked(e.target.checked)} 
                    style={{ accentColor: 'var(--stitch-tertiary)' }}
                  />
                  <span>الأسئلة المُعلّمة (Marked / Flagged)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={highYieldOnly} 
                    onChange={e => setHighYieldOnly(e.target.checked)} 
                    style={{ accentColor: 'var(--stitch-secondary)' }}
                  />
                  <span style={{ color: 'var(--stitch-secondary)', fontWeight: 600 }}>عالية التكرار (High Yield Only)</span>
                </label>
              </div>
            </div>
          )}

          {/* Specialties Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                اختر المنظومة السريرية (Organ System)
              </h3>
              <small style={{ color: 'var(--stitch-text-muted)' }}>مرتبة حسب مستوى الحاجة للمراجعة</small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {specialties
                .filter(item => !searchQuery || item.nameAr.includes(searchQuery) || item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(item => {
                const Icon = item.icon;
                const isSelected = selectedSpecialty === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSpecialty(item.id)}
                    style={{
                      background: isSelected ? 'var(--stitch-surface-container-high)' : 'var(--stitch-surface-container-lowest)',
                      border: isSelected ? '2px solid var(--stitch-primary)' : '1px solid var(--stitch-border)',
                      borderRadius: 'var(--stitch-radius-lg)',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--stitch-radius-md)',
                          background: isSelected ? 'var(--stitch-primary)' : 'var(--stitch-surface-container-low)',
                          color: isSelected ? '#ffffff' : 'var(--stitch-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '14px', color: 'var(--stitch-text-primary)' }}>
                            {item.nameAr}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--stitch-text-muted)' }}>
                            {item.nameEn}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <span style={{
                          background: 'var(--stitch-primary)',
                          color: '#ffffff',
                          borderRadius: '9999px',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px'
                        }}>
                          <Check size={12} />
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                      <span style={{ color: 'var(--stitch-text-muted)' }}>
                        {item.totalQuestions} سؤالاً متاحاً
                      </span>
                      <span style={{
                        fontWeight: 700,
                        color: item.status === 'critical' ? 'var(--stitch-error)' : item.status === 'moderate' ? 'var(--stitch-secondary)' : 'var(--stitch-primary)'
                      }}>
                        دقة الأداء: {item.accuracy}%
                      </span>
                    </div>

                    {/* Mini Accuracy Bar */}
                    <div style={{ width: '100%', height: '4px', background: 'var(--stitch-surface-container-highest)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${item.accuracy}%`,
                        height: '100%',
                        background: item.status === 'critical' ? 'var(--stitch-error)' : 'var(--stitch-secondary)',
                        borderRadius: '9999px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Specialty Topic Breakdown */}
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
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                المحاور السريرية داخل {activeSpecialty.nameAr}
              </h4>
              <span style={{ fontSize: '12px', color: 'var(--stitch-secondary)', fontWeight: 600 }}>
                High-Yield Core Topics
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeSpecialty.topics.map((topic, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--stitch-surface-container-low)',
                  borderRadius: 'var(--stitch-radius-md)',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--stitch-primary)', fontWeight: 600 }}>•</span>
                    <span style={{ color: 'var(--stitch-text-primary)' }}>{topic.name}</span>
                    {topic.highYield && (
                      <span style={{
                        fontSize: '10px',
                        background: 'var(--stitch-secondary-container)',
                        color: 'var(--stitch-on-secondary-container)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 700
                      }}>
                        تركيز عالٍ
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--stitch-text-muted)', fontSize: '12px' }}>
                    {topic.count} سؤالاً
                  </span>
                </div>
              ))}
            </div>

            {activeSpecialty.testsList && activeSpecialty.testsList.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                  الاختبارات المتاحة للبدء المباشر:
                </span>
                {activeSpecialty.testsList.map((t: any) => (
                  <div key={t.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--stitch-surface-container-lowest)',
                    border: '1px solid var(--stitch-border)',
                    borderRadius: 'var(--stitch-radius-md)'
                  }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--stitch-text-primary)' }}>{t.title}</strong>
                      <small style={{ display: 'block', color: 'var(--stitch-text-muted)', fontSize: '11px' }}>
                        {t.lectureName || t.lecture} • {t.durationMinutes} دقيقة • {t.questionCount} أسئلة
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={() => startExam(t.id)}
                      style={{
                        padding: '6px 14px',
                        background: 'var(--stitch-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--stitch-radius-md)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      بدء الاختبار
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Custom Session Builder */}
        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-xl)',
          padding: '24px',
          boxShadow: 'var(--stitch-shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'sticky',
          top: '80px'
        }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--stitch-primary)', fontWeight: 700 }}>
              Session Builder Engine
            </span>
            <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
              مُنشئ الجلسة المخصصة
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
              اختر نمط التدريب وحجم البلوك لبدء الجلسة فوراً.
            </p>
          </div>

          {/* Mode Selector (Tutor vs Exam) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
              نمط الجلسة التعليمي:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div 
                onClick={() => setSelectedMode('tutor')}
                style={{
                  border: selectedMode === 'tutor' ? '2px solid var(--stitch-primary)' : '1px solid var(--stitch-border)',
                  background: selectedMode === 'tutor' ? 'var(--stitch-surface-container-high)' : 'var(--stitch-surface-container-low)',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--stitch-primary)', fontWeight: 700, fontSize: '14px' }}>
                  <Brain size={16} />
                  <span>وضع التدريب</span>
                </div>
                <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px', lineHeight: 1.4 }}>
                  تفسير فوري لكل خيار، ولآلئ سريرية ومراجع بعد كل إجابة.
                </small>
              </div>

              <div 
                onClick={() => setSelectedMode('exam')}
                style={{
                  border: selectedMode === 'exam' ? '2px solid var(--stitch-primary)' : '1px solid var(--stitch-border)',
                  background: selectedMode === 'exam' ? 'var(--stitch-surface-container-high)' : 'var(--stitch-surface-container-low)',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--stitch-primary)', fontWeight: 700, fontSize: '14px' }}>
                  <Clock size={16} />
                  <span>وضع الامتحان</span>
                </div>
                <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px', lineHeight: 1.4 }}>
                  موقوت بدون كشف الإجابات، محاكاة بيئة الامتحانات السريرية الرسمية.
                </small>
              </div>
            </div>
          </div>

          {/* Question Count Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
              عدد الأسئلة المستهدفة:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[10, 20, 40].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--stitch-radius-md)',
                    border: questionCount === cnt ? '2px solid var(--stitch-primary)' : '1px solid var(--stitch-border)',
                    background: questionCount === cnt ? 'var(--stitch-primary)' : 'var(--stitch-surface-container-low)',
                    color: questionCount === cnt ? '#ffffff' : 'var(--stitch-text-primary)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{cnt} سؤالاً</span>
                  <span style={{ fontSize: '10px', opacity: 0.85, fontWeight: 400 }}>
                    {cnt === 40 ? 'بلوك كامل' : cnt === 20 ? 'نصف بلوك' : 'سريع'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Session Summary Pill */}
          <div style={{
            background: 'var(--stitch-surface-container-low)',
            borderRadius: 'var(--stitch-radius-md)',
            padding: '12px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--stitch-text-secondary)' }}>
              <span>التخصص المختار:</span>
              <strong style={{ color: 'var(--stitch-text-primary)' }}>{activeSpecialty.nameAr}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--stitch-text-secondary)' }}>
              <span>النمط المعتمد:</span>
              <strong style={{ color: 'var(--stitch-text-primary)' }}>
                {selectedMode === 'tutor' ? 'وضع التدريب التفاعلي' : 'محاكاة الامتحان الموقوت'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--stitch-text-secondary)' }}>
              <span>الزمن التقديري:</span>
              <strong style={{ color: 'var(--stitch-text-primary)' }}>
                {questionCount * 1.5} دقيقة (90 ثانية/سؤال)
              </strong>
            </div>
          </div>

          {/* Launch Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={handleStart}
              style={{
                background: 'var(--stitch-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--stitch-shadow-md)',
                transition: 'all 0.2s'
              }}
            >
              <Play size={18} fill="currentColor" />
              <span>إطلاق الجلسة التدريبية الآن</span>
            </button>

            {onLaunchExamBlock && (
              <button
                type="button"
                onClick={onLaunchExamBlock}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--stitch-primary)',
                  color: 'var(--stitch-primary)',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Clock size={16} />
                <span>بدء الاختبار السريري التقويمي الكامل (40 سؤالاً)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StitchQBank;
