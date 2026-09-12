import React, { useState } from 'react';
import { ArrowLeft, BookOpenCheck, HeartPulse, RotateCw, Sparkles, AlertTriangle } from 'lucide-react';
import type { Glimpse } from './ClinicalGlimpses';

export interface ClinicalFlipCardProps {
  glimpse: Glimpse;
  onOpenDetail: (glimpse: Glimpse) => void;
}

/**
 * ClinicalFlipCard
 * Interactive 3D flip card for high-yield medical pearls and clinical cases.
 * Features:
 * - 3D depth & perspective (1000px) with cubic-bezier spring physics.
 * - Dual triggers: Hover on desktop + Click/Tap on mobile/tablet.
 * - Accessible: ARIA attributes, keyboard support (Space/Enter).
 * - Light & Dark theme parity with medical grade contrast.
 * - Reduced motion safe.
 */
export function ClinicalFlipCard({ glimpse, onOpenDetail }: ClinicalFlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  const toggleFlip = (e: React.MouseEvent | React.KeyboardEvent) => {
    // If clicking the action button on the back face, let that action fire instead of just flipping
    if ((e.target as HTMLElement).closest('.clinicalFlipDetailBtn')) {
      return;
    }
    setFlipped(v => !v);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setFlipped(v => !v);
    }
  };

  const formattedDate = glimpse.publishedAt
    ? new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'short' }).format(new Date(glimpse.publishedAt))
    : 'KIUR';

  return (
    <div
      className={`clinicalFlipCard ${flipped ? 'isFlipped' : ''}`}
      onClick={toggleFlip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`بطاقة سريرية: ${glimpse.title}. اضغط مسافة أو انقر لقلب البطاقة.`}
      aria-expanded={flipped}
    >
      <div className="clinicalFlipCardInner">
        {/* FRONT FACE: Clinical Case & Presentation */}
        <div className="clinicalFlipCardFace clinicalFlipCardFront">
          <div className="clinicalFlipVisual">
            {glimpse.imageUrl ? (
              <img src={glimpse.imageUrl} alt={glimpse.title} loading="lazy" />
            ) : (
              <div className="clinicalFlipIconPlaceholder">
                <HeartPulse size={36} />
              </div>
            )}
            <span className="clinicalFlipDateBadge">{formattedDate}</span>
          </div>

          <div className="clinicalFlipContent">
            <h4 className="clinicalFlipTitle">{glimpse.title}</h4>
            <p className="clinicalFlipSummary">{glimpse.summary}</p>
          </div>

          <div className="clinicalFlipFooter">
            <span className="clinicalFlipHint">
              <RotateCw size={12} className="spinIcon" />
              <span>اقلب للؤلؤة السريرية</span>
            </span>
            <span className="clinicalFlipTag">
              <Sparkles size={11} /> سريري
            </span>
          </div>
        </div>

        {/* BACK FACE: Medical Pearl, Diagnosis & References */}
        <div className="clinicalFlipCardFace clinicalFlipCardBack">
          <div className="clinicalFlipBackHead">
            <span className="clinicalFlipBackBadge">
              <BookOpenCheck size={14} /> اللؤلؤة السريرية
            </span>
            <small>{glimpse.title}</small>
          </div>

          <div className="clinicalFlipBackBody">
            <div className="clinicalPearlBox">
              <strong>التوجيه السريري المعتمد:</strong>
              <p>{glimpse.clinicalPoint}</p>
            </div>

            {glimpse.warning && (
              <div className="clinicalWarningBox">
                <AlertTriangle size={13} />
                <span>{glimpse.warning}</span>
              </div>
            )}

            {glimpse.referenceText && (
              <cite className="clinicalRefText">
                المرجع: {glimpse.referenceText}
              </cite>
            )}
          </div>

          <div className="clinicalFlipBackFooter">
            <button
              type="button"
              className="clinicalFlipDetailBtn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(glimpse);
              }}
            >
              <span>التفاصيل الكاملة</span>
              <ArrowLeft size={13} />
            </button>
            <span className="clinicalFlipLeaveHint">
              <RotateCw size={11} /> انقر للعودة
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClinicalFlipCard;
