import React from 'react';
import { ClipboardList, Brain, Sparkles, Play, CheckCircle2, TrendingUp, CheckSquare, Flame, School, ArrowRight } from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchHero() {
  const { user, setView, openSmartReview, tests, history, summary, startExam } = useStitch();

  // Metrics calculations
  const totalCompleted = history.length;
  const passedCount = history.filter(h => h.passed).length;
  const avgAccuracy = summary.averagePercentage > 0 ? summary.averagePercentage : 72.4;
  const targetExam = user.phaseName || 'SMLE 2025 / البورد العراقي';

  const firstTest = tests[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Ambient Context Bar & Clinical Status */}
      <div className="stitchContextBar">
        <div className="stitchDoctorInfo">
          <div className="stitchDoctorIcon">
            <School size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 className="stitchDoctorName">{user.name}</h2>
              <span className="stitchDoctorPill">
                {user.role === 'student' ? (user.phaseName || 'سنة 5 - إكلينيكي') : 'كادر أكاديمي'}
              </span>
            </div>
            <p className="stitchDoctorSub">
              {user.universityName ? `${user.universityName} • ${user.collegeName || ''}` : 'البرنامج التحضيري المعتمد للاختبارات السريرية والتقييمية'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="stitchEngineBadge">
            <Sparkles size={13} /> واجهة Google Stitch المعتمدة
          </span>
        </div>
      </div>

      {/* Hero Countdown & Active Session Card */}
      <div className="stitchHeroCard">
        <div className="stitchHeroBackgroundOrb" />

        <div className="stitchHeroTopRow">
          <span className="stitchHeroActivePill">
            <span className="stitchHeroPulseDot" />
            جلسة نشطة جاهزة للاستئناف
          </span>
          <span className="stitchHeroTopic">
            {firstTest ? `${firstTest.subject} • ${firstTest.lecture}` : 'الباطنة العامة • الجولة المسائية'}
          </span>
        </div>

        <h1 className="stitchHeroTitle">
          موعد الاختبار المستهدف: متبقي <span className="stitchHeroCountdownHighlight">24 يوماً</span>
        </h1>

        <p className="stitchHeroDesc">
          {firstTest
            ? `اختبارك القادم بعنوان "${firstTest.title}" يضم ${firstTest.questionCount} سؤالاً سريرياً موقوتاً مع تفسير فوري للمشتتات.`
            : 'لديك جلسة قيد التقدم مكونة من 40 سؤالاً في "أمراض القلب والجهاز الدوري". قطعت 22 سؤالاً وبقي 18 للمراجعة الفورية.'}
        </p>

        <div className="stitchHeroActions">
          <button
            type="button"
            className="stitchHeroResumeBtn"
            onClick={() => {
              if (firstTest) {
                startExam(firstTest.id);
              } else {
                setView('tests');
              }
            }}
          >
            <Play size={18} fill="currentColor" />
            <span>{firstTest ? `بدء اختبار: ${firstTest.title.slice(0, 28)}...` : 'استئناف الجلسة الحالية (22/40)'}</span>
          </button>

          <button
            type="button"
            className="stitchHeroSecondaryBtn"
            onClick={() => openSmartReview('flashcards')}
          >
            <Brain size={16} />
            <span>المراجعة الذكية والتكرار (SM-2)</span>
          </button>

          <button
            type="button"
            className="stitchHeroSecondaryBtn"
            onClick={() => setView('tests')}
          >
            <ClipboardList size={16} />
            <span>بنك الأسئلة الشامل ({tests.length})</span>
          </button>
        </div>
      </div>

      {/* 4-Card High-Yield Metrics Grid */}
      <div className="stitchMetricsGrid">
        {/* Card 1: Daily Target Ring */}
        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">الهدف اليومي المنجز</span>
            <div className="stitchMetricValues">
              <b>{totalCompleted > 0 ? totalCompleted : 48}</b>
              <span>/ 60 سؤالاً</span>
            </div>
            <span className="stitchMetricFootnote">
              <CheckCircle2 size={14} />
              متبقي {Math.max(0, 60 - totalCompleted)} أسئلة فقط
            </span>
          </div>

          {/* SVG Progress Ring */}
          <div style={{ position: 'relative', width: '56px', height: '56px', display: 'grid', placeItems: 'center' }}>
            <svg style={{ width: '56px', height: '56px', transform: 'rotate(-90deg)' }} viewBox="0 0 64 64">
              <circle
                cx="32" cy="32" r="26"
                fill="transparent"
                stroke="var(--stitch-surface-container-high)"
                strokeWidth="6"
              />
              <circle
                cx="32" cy="32" r="26"
                fill="transparent"
                stroke="var(--stitch-primary-container)"
                strokeWidth="6"
                strokeDasharray="163.36"
                strokeDashoffset={163.36 * (1 - Math.min(1, Math.max(0.2, totalCompleted / 60)))}
                strokeLinecap="round"
              />
            </svg>
            <span style={{ position: 'absolute', fontSize: '11px', fontWeight: 800, color: 'var(--stitch-primary-container)' }}>
              {Math.min(100, Math.round((totalCompleted || 48) / 60 * 100))}%
            </span>
          </div>
        </div>

        {/* Card 2: Overall Accuracy & Cohort Benchmark */}
        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">معدل الدقة الإجمالي</span>
            <div className="stitchMetricValues">
              <b>{avgAccuracy}%</b>
              <span className="stitchMetricPill">+3.2%</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--stitch-text-muted)' }}>
              أعلى من متوسط الدفعة (64%)
            </span>
          </div>
          <div className="stitchMetricIconSquare">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 3: Questions Completed Total */}
        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">الأسئلة المنجزة كلياً</span>
            <div className="stitchMetricValues">
              <b>{totalCompleted > 0 ? totalCompleted * 15 : 1842}</b>
              <span>/ 2,450</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--stitch-primary)', fontWeight: 600 }}>
              75.1% من بنك الأسئلة
            </span>
          </div>
          <div className="stitchMetricIconSquare">
            <CheckSquare size={24} />
          </div>
        </div>

        {/* Card 4: Study Streak */}
        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">سلسلة الالتزام السريري</span>
            <div className="stitchMetricValues">
              <b>14</b>
              <span>يوماً متواصلاً</span>
            </div>
            <span className="stitchMetricFootnote" style={{ color: 'var(--stitch-secondary)' }}>
              <Flame size={14} color="#f59e0b" fill="#f59e0b" />
              أداء منضبط ومستقر
            </span>
          </div>
          <div className="stitchMetricIconSquare" style={{ color: '#f59e0b' }}>
            <Flame size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StitchHero;
