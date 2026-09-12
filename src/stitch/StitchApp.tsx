import React, { Suspense } from 'react';
import './stitch.css';
import { useStitch } from './StitchContext';
import StitchSidebar from './components/StitchSidebar';
import StitchTopbar from './components/StitchTopbar';
import StitchHero from './components/StitchHero';
import StitchDashboard from './components/StitchDashboard';
import StitchStudyPlan from './components/StitchStudyPlan';
import StitchNotes from './components/StitchNotes';
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

        {view === 'tests' && studyContent}

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
        {view === 'admin' && adminElement}
      </main>

      {/* Global Modals */}
      {smartReviewElement}
      {commandPaletteElement}
    </div>
  );
}

export default StitchApp;
