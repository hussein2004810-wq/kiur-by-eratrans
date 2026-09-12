import React, { useState } from 'react';
import {
  HeartPulse,
  Brain,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Play
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export interface QuestionData {
  id: string;
  code: string;
  specialty: string;
  subspecialty: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  vignette: string;
  patientHistory: string;
  physicalExam: string;
  labTitle?: string;
  labs?: { test: string; result: string; normal: string; unit: string; flag?: string }[];
  ecgNote?: string;
  stem: string;
  options: {
    id: string;
    letter: string;
    text: string;
    subtext: string;
    peerPercent: number;
    isCorrect: boolean;
  }[];
  explanation: {
    statusTitle: string;
    statusSummary: string;
    learningObjective: string;
    whyCorrect: string;
    whyIncorrectMap: Record<string, string>;
    distractorBreakdown: { letter: string; name: string; critique: string }[];
    pearl: string;
    references: string;
  };
}

export function StitchTutorPlayer({ onExit }: { onExit?: () => void }) {
  const { tests, startExam, openSmartReview, setView, notify } = useStitch();
  const [search, setSearch] = useState('');

  const filteredTests = (tests || []).filter(t => 
    !search || 
    (t.title && t.title.toLowerCase().includes(search.toLowerCase())) || 
    (t.subject && t.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="stitchTutorLauncher" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'var(--stitch-surface-container-lowest)',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-xl)',
        padding: '24px',
        boxShadow: 'var(--stitch-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--stitch-secondary)',
                padding: '3px 10px',
                borderRadius: 'var(--stitch-radius-full)',
                fontSize: '12px',
                fontWeight: 700
              }}>
                نظام التعلم التفاعلي والتدريب السريري (Interactive Tutor)
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--stitch-text-primary)' }}>
              المرشد السريري التفاعلي (Clinical Tutor Mode)
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: 1.5 }}>
              تدرب على الحالات السريرية والأسئلة مع الشروحات الفورية، تفكيك المشتتات واللآلئ الطبية المعتمدة من بنك أسئلة كليتك.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                if (openSmartReview) {
                  openSmartReview('quizBuilder');
                } else {
                  notify('تم تفعيل مولد الاختبارات المخصصة');
                }
              }}
              style={{
                background: 'var(--stitch-primary)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--stitch-radius-md)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={16} />
              <span>إنشاء جلسة تدريب مخصصة</span>
            </button>
            <button
              type="button"
              onClick={() => onExit ? onExit() : setView('qbank')}
              style={{
                background: 'var(--stitch-surface-container-high)',
                color: 'var(--stitch-text-primary)',
                border: '1px solid var(--stitch-border)',
                padding: '8px 14px',
                borderRadius: 'var(--stitch-radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>العودة للبنك</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>

        {(tests || []).length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <input
              type="text"
              placeholder="ابحث باسم المادة أو الاختبار للتدريب التفاعلي..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--stitch-radius-md)',
                border: '1px solid var(--stitch-border)',
                background: 'var(--stitch-surface-container-low)',
                color: 'var(--stitch-text-primary)',
                fontSize: '13px'
              }}
            />
          </div>
        )}
      </div>

      {/* Tests Selection */}
      {filteredTests.length === 0 ? (
        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-xl)',
          padding: '48px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Brain size={48} color="var(--stitch-text-muted)" />
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
            {(tests || []).length === 0 ? 'لا توجد اختبارات سريرية متاحة للتدريب حالياً' : 'لا توجد مواد تطابق البحث'}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-muted)', maxWidth: '440px' }}>
            يمكنك دائماً مراجعة البطاقات الذكية ومفاهيم المراجعة السريرية عبر مركز المراجعة الذكية.
          </p>
          <button
            type="button"
            onClick={() => openSmartReview ? openSmartReview('flashcards') : setView('qbank')}
            style={{
              marginTop: '8px',
              background: 'var(--stitch-primary)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 'var(--stitch-radius-md)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            فتح البطاقات والمراجعة السريرية
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {filteredTests.map(test => (
            <div
              key={test.id}
              style={{
                background: 'var(--stitch-surface-container-lowest)',
                border: '1px solid var(--stitch-border)',
                borderRadius: 'var(--stitch-radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: 'var(--stitch-shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: 'var(--stitch-secondary)',
                    padding: '2px 8px',
                    borderRadius: 'var(--stitch-radius-full)',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {test.subject}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>
                    {test.questionCount} سؤال تدريبي
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                  {test.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  notify(`جارٍ بدء جلسة التدريب التفاعلي: ${test.title}`);
                  startExam(test.id);
                }}
                style={{
                  width: '100%',
                  background: 'var(--stitch-secondary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Play size={16} />
                <span>بدء التدريب السريري التفاعلي</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StitchTutorPlayer;
