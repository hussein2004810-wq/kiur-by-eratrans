import React from 'react';
import { ClipboardList, Brain, Sparkles, Play, CheckCircle2, TrendingUp, CheckSquare, Flame, School, ArrowRight } from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchHero() {
  const { user, setView, openSmartReview, tests, history, summary, startExam } = useStitch();

  // Real dynamic metrics calculations
  const totalCompleted = history.length;
  const passedCount = history.filter(h => h.passed).length;
  const avgAccuracy = summary.averagePercentage > 0 ? summary.averagePercentage : 0;
  const targetExam = user.phaseName || 'البورد العراقي والامتحان التقويمي';
  const totalBankQuestions = tests.reduce((acc, t) => acc + (t.questionCount || 0), 0) || (tests.length * 10);
  const totalAnsweredQuestions = history.reduce((acc, h) => acc + (h.maxScore || 10), 0);
  const dailyTarget = 20;
  const todayProgress = Math.min(dailyTarget, totalCompleted * 5);

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
                {user.role === 'student' ? (user.phaseName || 'طالب سريري') : 'كادر أكاديمي'}
              </span>
            </div>
            <p className="stitchDoctorSub">
              {user.universityName ? `${user.universityName} • ${user.collegeName || ''}` : 'البرنامج التحضيري المعتمد للاختبارات السريرية والتقييمية'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="stitchEngineBadge">
            <Sparkles size={13} /> المنظومة السريرية المعتمدة
          </span>
        </div>
      </div>

      {/* Hero Countdown & Active Session Card */}
      <div className="stitchHeroCard">
        <div className="stitchHeroBackgroundOrb" />

        <div className="stitchHeroTopRow">
          <span className="stitchHeroActivePill">
            <span className="stitchHeroPulseDot" />
            جاهزية الاختبارات السريرية
          </span>
          <span className="stitchHeroTopic">
            {firstTest ? `${firstTest.subject} • ${firstTest.lecture}` : (user.departmentName || 'المسار الأكاديمي')}
          </span>
        </div>

        <h1 className="stitchHeroTitle">
          المسار المستهدف: <span className="stitchHeroCountdownHighlight">{targetExam}</span>
        </h1>

        <p className="stitchHeroDesc">
          {firstTest
            ? `اختبارك القادم بعنوان "${firstTest.title}" يضم ${firstTest.questionCount} سؤالاً سريرياً موقوتاً مع تصحيح وتحليل فوري.`
            : `يتوفر في مسارك الأكاديمي ${tests.length} اختباراً سريرياً جاهزاً للبدء والتدريب المباشر.`}
        </p>

        <div className="stitchHeroActions">
          <button
            type="button"
            className="stitchHeroResumeBtn"
            onClick={() => firstTest ? (startExam ? startExam(firstTest.id) : setView('exam-player')) : setView('tests')}
          >
            <Play size={18} fill="currentColor" />
            <span>{firstTest ? `بدء اختبار: ${firstTest.title}` : 'استكشاف بنك الاختبارات'}</span>
          </button>

          <button
            type="button"
            className="stitchHeroSecondaryBtn"
            onClick={() => setView('tests')}
          >
            <ClipboardList size={16} />
            <span>بنك الاختبارات ({tests.length})</span>
          </button>

          <button
            type="button"
            className="stitchHeroSecondaryBtn"
            onClick={() => setView('tutor-player')}
          >
            <Brain size={16} />
            <span>وضع التدريب السريري</span>
          </button>

          <button
            type="button"
            className="stitchHeroSecondaryBtn"
            onClick={() => setView('remediation')}
          >
            <Sparkles size={16} />
            <span>خطة التعافي وسد الثغرات</span>
          </button>
        </div>
      </div>

      {/* 4-Card High-Yield Metrics Grid */}
      <div className="stitchMetricsGrid">
        {/* Card 1: Daily Target Ring */}
        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">التقدم في الأسئلة</span>
            <div className="stitchMetricValues">
              <b>{todayProgress}</b>
              <span>/ {dailyTarget} سؤالاً</span>
            </div>
            <span className="stitchMetricFootnote">
              <CheckCircle2 size={14} />
              متبقي {Math.max(0, dailyTarget - todayProgress)} أسئلة للهدف اليومي
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
                strokeDashoffset={163.36 * (1 - Math.min(1, todayProgress / dailyTarget))}
                strokeLinecap="round"
              />
            </svg>
            <span style={{ position: 'absolute', fontSize: '11px', fontWeight: 800, color: 'var(--stitch-primary-container)' }}>
              {Math.round(Math.min(100, (todayProgress / dailyTarget) * 100))}%
            </span>
          </div>
        </div>

        {/* Card 2: Overall Accuracy & Cohort Benchmark */}
        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">معدل الدقة الإجمالي</span>
            <div className="stitchMetricValues">
              <b>{avgAccuracy}%</b>
              <span className="stitchMetricPill">{passedCount} ناجح</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--stitch-text-muted)' }}>
              {totalCompleted > 0 ? `من واقع ${totalCompleted} محاولة مكتملة` : 'ابدأ أول اختبار لاحتساب الدقة'}
            </span>
          </div>
          <div className="stitchMetricIconSquare">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 3: Questions Completed Total */}
        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">إجمالي الأسئلة المحلولة</span>
            <div className="stitchMetricValues">
              <b>{totalAnsweredQuestions}</b>
              <span>/ {totalBankQuestions || 100}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--stitch-primary)', fontWeight: 600 }}>
              {totalBankQuestions > 0 ? Math.round((totalAnsweredQuestions / totalBankQuestions) * 100) : 0}% من بنك الأسئلة المتاح
            </span>
          </div>
          <div className="stitchMetricIconSquare">
            <CheckSquare size={24} />
          </div>
        </div>

        {/* Card 4: Study Streak */}
        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">المحاولات السريرية الناجحة</span>
            <div className="stitchMetricValues">
              <b>{passedCount}</b>
              <span>اختباراً مجتازاً</span>
            </div>
            <span className="stitchMetricFootnote" style={{ color: 'var(--stitch-secondary)' }}>
              <Flame size={14} color="#f59e0b" fill="#f59e0b" />
              {passedCount > 0 ? 'أداء أكاديمي ممتاز' : 'بانتظار أول محاولة ناجحة'}
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
