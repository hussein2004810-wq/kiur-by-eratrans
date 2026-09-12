import React, { useState } from 'react';
import {
  Clock,
  FileText,
  Play,
  ArrowLeft,
  ShieldCheck,
  Search
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export interface ExamQuestion {
  id: string;
  code: string;
  specialty: string;
  subspecialty: string;
  vignette: string;
  patientHistory: string;
  physicalExam: string;
  labs?: { test: string; result: string; normal: string; unit: string }[];
  stem: string;
  options: { id: string; letter: string; text: string; isCorrect: boolean }[];
}

export function StitchExamPlayer({ onFinishExam }: { onFinishExam?: () => void }) {
  const { tests, startExam, setView, notify } = useStitch();
  const [search, setSearch] = useState('');

  const filteredTests = (tests || []).filter(t => 
    !search || 
    (t.title && t.title.toLowerCase().includes(search.toLowerCase())) || 
    (t.subject && t.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="stitchExamLauncher" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                background: 'rgba(13, 148, 136, 0.12)',
                color: 'var(--stitch-primary)',
                padding: '3px 10px',
                borderRadius: 'var(--stitch-radius-full)',
                fontSize: '12px',
                fontWeight: 700
              }}>
                جلسات الاختبار السريري المعتمدة
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--stitch-text-primary)' }}>
              منصة الاختبارات السريرية الرسمية (Clinical Examination Hub)
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: 1.5 }}>
              اختر الاختبار المعتمد من مسارك الأكاديمي لبدء جلسة امتحان حقيقية بمؤقت معتمد وحفظ فوري للإجابات والنتائج في قاعدة البيانات.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView('qbank')}
            style={{
              background: 'var(--stitch-surface-container-high)',
              color: 'var(--stitch-text-primary)',
              border: '1px solid var(--stitch-border)',
              padding: '8px 16px',
              borderRadius: 'var(--stitch-radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>بنك الأسئلة والمواد</span>
            <ArrowLeft size={16} />
          </button>
        </div>

        {/* Search */}
        {(tests || []).length > 0 && (
          <div style={{ marginTop: '8px', position: 'relative' }}>
            <input
              type="text"
              placeholder="ابحث باسم الاختبار أو المادة السريرية..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 'var(--stitch-radius-md)',
                border: '1px solid var(--stitch-border)',
                background: 'var(--stitch-surface-container-low)',
                color: 'var(--stitch-text-primary)',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stitch-text-muted)' }} />
          </div>
        )}
      </div>

      {/* Tests Grid or Empty State */}
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
          <FileText size={48} color="var(--stitch-text-muted)" />
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
            {(tests || []).length === 0 ? 'لا توجد اختبارات سريرية منشورة حالياً في مسارك الأكاديمي' : 'لا توجد اختبارات تطابق البحث'}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-muted)', maxWidth: '440px' }}>
            {(tests || []).length === 0
              ? 'يقوم الكادر الأكاديمي والأساتذة باعتماد ونشر الاختبارات دورياً. تفقد بنك الأسئلة أو عد لاحقاً.'
              : 'جرّب كتابة اسم مادة أخرى أو مسح نص البحث لعرض جميع الاختبارات.'}
          </p>
          <button
            type="button"
            onClick={() => setView('qbank')}
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
            استعراض بنك الأسئلة والمواد
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
                    background: 'var(--stitch-surface-container-high)',
                    color: 'var(--stitch-primary)',
                    padding: '2px 8px',
                    borderRadius: 'var(--stitch-radius-full)',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {test.subject}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--stitch-text-muted)' }}>
                    {test.lecture || 'اختبار شامل'}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                  {test.title}
                </h3>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '12px',
                color: 'var(--stitch-text-muted)',
                padding: '10px 12px',
                background: 'var(--stitch-surface-container-low)',
                borderRadius: 'var(--stitch-radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} />
                  <span>{test.durationMinutes} دقيقة</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileText size={14} />
                  <span>{test.questionCount} سؤال</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} />
                  <span>نجاح {test.passPercentage}%</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  notify(`جارٍ تهيئة جلسة الاختبار: ${test.title}`);
                  startExam(test.id);
                }}
                style={{
                  width: '100%',
                  background: 'var(--stitch-primary)',
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
                <span>بدء جلسة الاختبار الآن</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StitchExamPlayer;
