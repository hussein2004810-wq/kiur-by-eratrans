import React, { Suspense } from 'react';
import './stitch.css';
import { useStitch } from './StitchContext';
import StitchSidebar from './components/StitchSidebar';
import StitchTopbar from './components/StitchTopbar';
import StitchHero from './components/StitchHero';
import StitchDashboard from './components/StitchDashboard';
import StitchStudyPlan from './components/StitchStudyPlan';
import StitchNotes from './components/StitchNotes';
import StitchQBank from './components/StitchQBank';
import StitchTutorPlayer from './components/StitchTutorPlayer';
import StitchExamPlayer from './components/StitchExamPlayer';
import StitchReviewCenter from './components/StitchReviewCenter';
import StitchRemediationPlan from './components/StitchRemediationPlan';
import StitchAnalytics from './components/StitchAnalytics';
import StitchPricing from './components/StitchPricing';
import StitchAdminSuite from './components/StitchAdminSuite';
import StitchPublicLanding from './components/StitchPublicLanding';
import { ClinicalGlimpsesLibrary, ClinicalGlimpsesSpotlight } from '../ClinicalGlimpses';
import { HeartPulse } from 'lucide-react';

export function StitchApp({
  studyContent,
  examRunnerElement,
  smartReviewElement,
  commandPaletteElement,
  historyElement,
  pointsElement,
  profileElement,
  adminElement
}: {
  studyContent: React.ReactNode;
  examRunnerElement?: React.ReactNode;
  smartReviewElement?: React.ReactNode;
  commandPaletteElement?: React.ReactNode;
  historyElement?: React.ReactNode;
  pointsElement?: React.ReactNode;
  profileElement?: React.ReactNode;
  adminElement?: React.ReactNode;
}) {
  const { view, setView } = useStitch();

  // If currently taking an exam, render the ExamRunner directly
  if (examRunnerElement) {
    return <>{examRunnerElement}</>;
  }

  return (
    <div className="stitchApp">
      <StitchSidebar />

      <main className="stitchMain">
        <StitchTopbar />

        {view === 'home' && (
          <>
            <StitchHero />
            <StitchDashboard />
            <div style={{ marginTop: '24px' }}>
              {studyContent}
            </div>
            <ClinicalGlimpsesSpotlight onBrowse={() => setView('glimpses')} />
          </>
        )}

        {view === 'study-plan' && (
          <div style={{ marginTop: '12px' }}>
            <StitchStudyPlan />
          </div>
        )}

        {view === 'notes' && (
          <div style={{ marginTop: '12px' }}>
            <StitchNotes />
          </div>
        )}

        {view === 'qbank' && (
          <div style={{ marginTop: '12px' }}>
            <StitchQBank 
              onStartCustomSession={(spec, cnt, mode) => {
                setView(mode === 'tutor' ? 'tutor-player' : 'exam-player');
              }}
              onLaunchExamBlock={() => setView('exam-player')}
            />
          </div>
        )}

        {view === 'tests' && (
          <div style={{ marginTop: '12px' }}>
            <StitchQBank 
              onStartCustomSession={(spec, cnt, mode) => {
                setView(mode === 'tutor' ? 'tutor-player' : 'exam-player');
              }}
              onLaunchExamBlock={() => setView('exam-player')}
            />
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>قوائم المواد والاختبارات المفتوحة:</h3>
              {studyContent}
            </div>
          </div>
        )}

        {view === 'tutor-player' && (
          <div style={{ marginTop: '12px' }}>
            <StitchTutorPlayer onExit={() => setView('qbank')} />
          </div>
        )}

        {view === 'exam-player' && (
          <div style={{ marginTop: '12px' }}>
            <StitchExamPlayer onFinishExam={() => setView('review-center')} />
          </div>
        )}

        {view === 'review-center' && (
          <div style={{ marginTop: '12px' }}>
            <StitchReviewCenter />
          </div>
        )}

        {view === 'remediation' && (
          <div style={{ marginTop: '12px' }}>
            <StitchRemediationPlan />
          </div>
        )}

        {view === 'analytics' && (
          <div style={{ marginTop: '12px' }}>
            <StitchAnalytics />
          </div>
        )}

        {view === 'pricing' && (
          <div style={{ marginTop: '12px' }}>
            <StitchPricing />
          </div>
        )}

        {view === 'landing' && (
          <div style={{ marginTop: '12px' }}>
            <StitchPublicLanding onStart={() => setView('qbank')} />
          </div>
        )}

        {view === 'glimpses' && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <HeartPulse size={28} color="var(--stitch-accent)" />
              <div>
                <h2 style={{ margin: 0, fontSize: '22px' }}>اللمحات السريرية التفاعلية</h2>
                <small style={{ color: 'var(--stitch-text-muted)' }}>مكتبة البطاقات ثلاثية الأبعاد المعتمدة</small>
              </div>
            </div>
            <ClinicalGlimpsesLibrary />
          </div>
        )}

        {view === 'history' && historyElement}
        {view === 'points' && pointsElement}
        {view === 'profile' && profileElement}
        {view === 'admin' && (
          <div style={{ marginTop: '12px' }}>
            <StitchAdminSuite />
            {adminElement && (
              <div style={{ marginTop: '32px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>سجلات النظام وإدارة الاستيراد المباشر:</h4>
                {adminElement}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Modals */}
      {smartReviewElement}
      {commandPaletteElement}
    </div>
  );
}

export default StitchApp;
