import React from 'react';
import { ClipboardList, Brain, Sparkles } from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchHero() {
  const { user, setView, openSmartReview } = useStitch();

  return (
    <section className="stitchHero">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="stitchHeroBadge">مرحبًا بعودتك</span>
          <span className="stitchEngineBadge">
            <Sparkles size={12} /> تصميم Google Stitch المعتمد
          </span>
        </div>
        <h1 className="stitchHeroTitle">{user.name}</h1>
        <p className="stitchHeroSub">
          {user.universityName ? `${user.universityName} • ${user.collegeName || ''} • ${user.phaseName || ''}` : 'منصة KIUR الطبية التابعة لقناة ERATRANS'}
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="solid"
            onClick={() => setView('tests')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(120deg, var(--stitch-primary), var(--stitch-secondary))',
              color: '#fff',
              border: 0,
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(13, 148, 136, 0.35)'
            }}
          >
            <ClipboardList size={16} />
            <span>ابدأ اختبارك الآن</span>
          </button>

          <button
            type="button"
            onClick={() => openSmartReview('flashcards')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'var(--stitch-bg-surface)',
              border: '1px solid var(--stitch-border)',
              color: 'var(--stitch-text-primary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Brain size={16} color="var(--stitch-accent)" />
            <span>المراجعة الذكية والتكرار</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default StitchHero;
