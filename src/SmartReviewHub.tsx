import { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Flame,
  Layers,
  RotateCw,
  Sparkles,
  Stethoscope,
  Target,
  Wand2,
  X,
  Zap
} from 'lucide-react';
import './smart-review.css';
import {
  type SpacedCard,
  type ReviewGrade,
  type CustomQuizFilter,
  syncCardsFromTests,
  getDueCards,
  calculateNextReview,
  saveStoredCards,
  getStoredCards,
  buildCustomQuiz
} from './smart-review-model';

export interface SmartReviewHubProps {
  open?: boolean;
  onClose: () => void;
  tests: any[];
  catalog: any;
  history: any[];
  onLaunchCustomQuiz: (quiz: any) => void;
  initialTab?: 'flashcards' | 'quizBuilder' | 'stats';
  notify?: (message: string) => void;
}

export default function SmartReviewHub({
  open = true,
  onClose,
  tests,
  catalog,
  history,
  onLaunchCustomQuiz,
  initialTab = 'flashcards',
  notify
}: SmartReviewHubProps) {
  const [tab, setTab] = useState<'flashcards' | 'quizBuilder' | 'stats'>(initialTab);
  const [cards, setCards] = useState<SpacedCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Custom Quiz Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [onlyMistakes, setOnlyMistakes] = useState(true);
  const [hasImagesOnly, setHasImagesOnly] = useState(false);
  const [questionCount, setQuestionCount] = useState(15);
  const [durationMinutes, setDurationMinutes] = useState(20);

  // Sync cards from loaded tests
  useEffect(() => {
    if (tests && tests.length > 0) {
      const synced = syncCardsFromTests(tests);
      setCards(synced);
    }
  }, [tests]);

  // Extract set of question IDs where the student made mistakes from history
  const mistakeQuestionIds = useMemo(() => {
    const set = new Set<string>();
    for (const h of history) {
      if (h.mistakes && Array.isArray(h.mistakes)) {
        for (const m of h.mistakes) {
          if (m.questionId) set.add(m.questionId);
          else if (m.id) set.add(m.id);
        }
      }
    }
    return set;
  }, [history]);

  const dueCards = useMemo(() => getDueCards(cards), [cards]);
  const currentCard = dueCards[currentCardIndex] || null;

  // Keyboard navigation for flashcards
  useEffect(() => {
    if (!open || tab !== 'flashcards') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(f => !f);
      } else if (isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        handleGrade(Number(e.key) as ReviewGrade);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, tab, isFlipped, currentCardIndex, dueCards]);

  const handleGrade = (grade: ReviewGrade) => {
    if (!currentCard) return;
    const result = calculateNextReview(currentCard, grade);
    const updatedCard: SpacedCard = {
      ...currentCard,
      ...result,
      lastReviewedAt: new Date().toISOString()
    };

    const stored = getStoredCards();
    stored[currentCard.questionId] = updatedCard;
    saveStoredCards(stored);

    setCards(Object.values(stored));
    setIsFlipped(false);
    if (currentCardIndex >= dueCards.length - 1) {
      setCurrentCardIndex(0);
    }
  };

  const handleStartQuickMistakes = () => {
    const quiz = buildCustomQuiz(tests, mistakeQuestionIds, {
      onlyMistakes: true,
      questionCount: 15,
      durationMinutes: 15
    });
    if (!quiz.questions.length) {
      // If no recorded mistakes yet, build practice quiz from current tests
      const fallbackQuiz = buildCustomQuiz(tests, mistakeQuestionIds, {
        onlyMistakes: false,
        questionCount: 10,
        durationMinutes: 15
      });
      notify?.('بدء اختبار تدريبي عام لعدم توفر أخطاء مسجلة حاليًا');
      onLaunchCustomQuiz(fallbackQuiz);
    } else {
      notify?.(`تم تجهيز اختبار الأخطاء السابقة (${quiz.questions.length} أسئلة)`);
      onLaunchCustomQuiz(quiz);
    }
    onClose();
  };

  const handleStartCustomQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const filter: CustomQuizFilter = {
      subjectId: selectedSubjectId || undefined,
      lectureId: selectedLectureId || undefined,
      onlyMistakes,
      hasImagesOnly,
      questionCount: Number(questionCount) || 10,
      durationMinutes: Number(durationMinutes) || 0
    };
    const quiz = buildCustomQuiz(tests, mistakeQuestionIds, filter);
    if (!quiz.questions.length) {
      notify?.('لا توجد أسئلة مطابقة للشروط المحددة');
      return;
    }
    notify?.(`تم إنشاء الاختبار التدريبي بنجاح (${quiz.questions.length} أسئلة)`);
    onLaunchCustomQuiz(quiz);
    onClose();
  };

  if (!open) return null;

  const subjects = catalog?.subjects || [];
  const lectures = selectedSubjectId
    ? (catalog?.lectures || []).filter((l: any) => l.subjectId === selectedSubjectId)
    : catalog?.lectures || [];

  return (
    <div className="smartReviewModal" role="dialog" aria-modal="true" aria-labelledby="smart-review-title">
      <div className="smartReviewCard" dir="rtl">
        <header className="smartReviewHead">
          <div className="smartReviewHeadBrand">
            <Brain />
            <div>
              <h3 id="smart-review-title">مركز المراجعة والتكرار السريري الذكي</h3>
              <small>خوارزمية SM-2 للاستذكار الطبي طويل المدى</small>
            </div>
          </div>
          <button type="button" className="smartReviewClose" onClick={onClose} aria-label="إغلاق">
            <X />
          </button>
        </header>

        <nav className="smartReviewTabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'flashcards'}
            className={tab === 'flashcards' ? 'active' : ''}
            onClick={() => setTab('flashcards')}
          >
            <Layers />
            <span>البطاقات السريرية (Flashcards)</span>
            <span className="smartReviewBadge">{dueCards.length} مستحق</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'quizBuilder'}
            className={tab === 'quizBuilder' ? 'active' : ''}
            onClick={() => setTab('quizBuilder')}
          >
            <Wand2 />
            <span>منشئ الاختبار المخصص والأخطاء</span>
            {mistakeQuestionIds.size > 0 && (
              <span className="smartReviewBadge">{mistakeQuestionIds.size} خطأ</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'stats'}
            className={tab === 'stats' ? 'active' : ''}
            onClick={() => setTab('stats')}
          >
            <Target />
            <span>إحصائيات الذاكرة والاستيعاب</span>
          </button>
        </nav>

        <main className="smartReviewBody">
          {tab === 'flashcards' && (
            <>
              {currentCard ? (
                <div className="flashcardStage">
                  <div className="flashcardProgress">
                    <span>
                      البطاقة {currentCardIndex + 1} من أصل {dueCards.length} مستحقة اليوم
                    </span>
                    <div className="flashcardMetaTags">
                      <span className="flashcardMetaTag">{currentCard.subjectName}</span>
                      <span className="flashcardMetaTag">{currentCard.lectureName}</span>
                    </div>
                  </div>

                  <div
                    className={`flashcardBox ${isFlipped ? 'flipped' : ''}`}
                    onClick={() => setIsFlipped(f => !f)}
                    role="button"
                    tabIndex={0}
                    aria-label="اقلب البطاقة السريرية"
                  >
                    <div className="flashcardInner">
                      {/* Front Face */}
                      <article className="flashcardFace flashcardFront">
                        <span className="flashcardFaceLabel">
                          <Stethoscope size={14} /> الحالة السريرية / السؤال
                        </span>
                        <p className="flashcardPrompt">{currentCard.front}</p>
                        {currentCard.imageUrl && (
                          <div className="flashcardImageWrap" onClick={e => { e.stopPropagation(); setPreviewImage(currentCard.imageUrl!); }}>
                            <img src={currentCard.imageUrl} alt="فحص سريري مصور" />
                          </div>
                        )}
                        {(currentCard.buzzwords || []).length > 0 && (
                          <div className="buzzwordsList">
                            {(currentCard.buzzwords || []).map(bw => (
                              <span key={bw} className="buzzwordPill">
                                <Sparkles size={11} /> {bw}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="flashcardFlipHint">
                          <RotateCw size={13} /> اضغط مسافة أو انقر لإظهار التشخيص والإجابة
                        </span>
                      </article>

                      {/* Back Face */}
                      <article className="flashcardFace flashcardBack">
                        <span className="flashcardFaceLabel">
                          <CheckCircle2 size={14} /> التشخيص المعتمد والحل النموذجي
                        </span>
                        <h4 className="flashcardAnswer">{currentCard.back}</h4>
                        {currentCard.explanation && (
                          <p className="flashcardExplanation">{currentCard.explanation}</p>
                        )}
                        <span className="flashcardFlipHint">
                          قيّم مدى استحضارك للمعلومة أدناه لتحديد موعد المراجعة القادم
                        </span>
                      </article>
                    </div>
                  </div>

                  {/* SM-2 Grading Controls */}
                  {isFlipped ? (
                    <div className="flashcardGrading">
                      <button
                        type="button"
                        className="gradeBtn again"
                        onClick={() => handleGrade(1)}
                        title="اختصار: 1"
                      >
                        <span>إعادة (Again)</span>
                        <small>خلال 15 دقيقة</small>
                      </button>
                      <button
                        type="button"
                        className="gradeBtn hard"
                        onClick={() => handleGrade(2)}
                        title="اختصار: 2"
                      >
                        <span>صعبة (Hard)</span>
                        <small>خلال 12 ساعة</small>
                      </button>
                      <button
                        type="button"
                        className="gradeBtn good"
                        onClick={() => handleGrade(3)}
                        title="اختصار: 3"
                      >
                        <span>جيدة (Good)</span>
                        <small>خلال يوم واحد</small>
                      </button>
                      <button
                        type="button"
                        className="gradeBtn easy"
                        onClick={() => handleGrade(4)}
                        title="اختصار: 4"
                      >
                        <span>سهلة (Easy)</span>
                        <small>خلال 3 - 4 أيام</small>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="quizBuilderSubmit"
                      onClick={() => setIsFlipped(true)}
                    >
                      <RotateCw size={16} /> كشف الإجابة والتقييم
                    </button>
                  )}
                </div>
              ) : (
                <div className="smartReviewEmpty">
                  <CheckCircle2 />
                  <h3>أحسنت! أتممت جميع البطاقات المستحقة لليوم</h3>
                  <p>
                    تمت مراجعة جميع المفاهيم السريرية المجدولة بنجاح وفق خوارزمية التكرار المتباعد.
                    يمكنك بناء اختبار مخصص أو العودة لمتابعة اختباراتك.
                  </p>
                  <button type="button" className="quizBuilderSubmit" onClick={() => setTab('quizBuilder')}>
                    <Wand2 size={16} /> بناء اختبار مخصص من الأخطاء
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'quizBuilder' && (
            <form className="quizBuilderForm" onSubmit={handleStartCustomQuiz}>
              <div className="quizBuilderCard">
                <h4>
                  <Zap size={18} color="#f59e0b" /> البدء السريع للأخطاء
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                  اختبر معلوماتك فوراً في الأسئلة التي تعثرت بها سابقاً لترسيخ التصحيح السريري السليم.
                </p>
                <button
                  type="button"
                  className="quizBuilderSubmit"
                  onClick={handleStartQuickMistakes}
                  style={{ background: 'linear-gradient(120deg, #d97706, #b45309)' }}
                >
                  <Flame size={18} /> مراجعة أخطائي الأخيرة فوراً (15 سؤال)
                </button>
              </div>

              <div className="quizBuilderCard">
                <h4>
                  <Wand2 size={18} color="#2dd4bf" /> تخصيص دقيق للاختبار
                </h4>

                <div className="quizBuilderFields">
                  <label>
                    <span>المادة الأكاديمية</span>
                    <select
                      value={selectedSubjectId}
                      onChange={e => {
                        setSelectedSubjectId(e.target.value);
                        setSelectedLectureId('');
                      }}
                    >
                      <option value="">جميع المواد</option>
                      {subjects.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>المحاضرة المحددة</span>
                    <select
                      value={selectedLectureId}
                      onChange={e => setSelectedLectureId(e.target.value)}
                      disabled={!selectedSubjectId}
                    >
                      <option value="">جميع محاضرات المادة</option>
                      {lectures.map((l: any) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>عدد الأسئلة</span>
                    <select
                      value={questionCount}
                      onChange={e => setQuestionCount(Number(e.target.value))}
                    >
                      <option value={5}>5 أسئلة (سريعة)</option>
                      <option value={10}>10 أسئلة</option>
                      <option value={15}>15 سؤالاً</option>
                      <option value={20}>20 سؤالاً</option>
                      <option value={30}>30 سؤالاً (مكثف)</option>
                    </select>
                  </label>

                  <label>
                    <span>الوقت المحدد</span>
                    <select
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value))}
                    >
                      <option value={10}>10 دقائق</option>
                      <option value={15}>15 دقيقة</option>
                      <option value={20}>20 دقيقة</option>
                      <option value={30}>30 دقيقة</option>
                      <option value={0}>تدريب مفتوح دون مؤقت</option>
                    </select>
                  </label>
                </div>

                <label className="quizCheckbox">
                  <input
                    type="checkbox"
                    checked={onlyMistakes}
                    onChange={e => setOnlyMistakes(e.target.checked)}
                  />
                  <span>قصر الاختبار على الأسئلة التي أخطأت بها فقط</span>
                </label>

                <label className="quizCheckbox">
                  <input
                    type="checkbox"
                    checked={hasImagesOnly}
                    onChange={e => setHasImagesOnly(e.target.checked)}
                  />
                  <span>حالات سريرية مصورة فقط (ECG / X-Ray / CT)</span>
                </label>

                <button type="submit" className="quizBuilderSubmit">
                  <span>بدء الاختبار التدريبي المخصص</span>
                  <ChevronLeft size={16} />
                </button>
              </div>
            </form>
          )}

          {tab === 'stats' && (
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              <div className="retentionStatsGrid">
                <article className="retentionStatCard">
                  <b>{cards.length}</b>
                  <span>إجمالي البطاقات السريرية</span>
                </article>
                <article className="retentionStatCard">
                  <b style={{ color: '#fcd34d' }}>{dueCards.length}</b>
                  <span>مستحقة للمراجعة اليوم</span>
                </article>
                <article className="retentionStatCard">
                  <b style={{ color: '#38bdf8' }}>
                    {cards.filter(c => c.repetitions >= 3).length}
                  </b>
                  <span>مفاهيم تم إتقانها (Mature)</span>
                </article>
              </div>

              <div className="quizBuilderCard">
                <h4>
                  <Target size={18} color="#2dd4bf" /> كيف تعمل خوارزمية التكرار السريري (SM-2) في KIUR؟
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.8 }}>
                  تعتمد المنصة على خوارزمية SuperMemo 2 المثبتة طبياً لتعزيز الذاكرة طويلة المدى.
                  تقوم الخوارزمية باحتساب عامل السهولة لكل معلومة وتشخيص طبي بناءً على تقييمك الذاتي:
                  <br />• <b>Again</b>: يعيد السؤال خلال 15 دقيقة لمراجعة المفهوم فوراً.
                  <br />• <b>Hard</b>: يرفع الفترة الزمنية تدريجياً لتقوية الاسترجاع الصعب.
                  <br />• <b>Good</b>: يضاعف الفترة الزمنية بالأيام عند الإجابة الواثقة.
                  <br />• <b>Easy</b>: يمنح قفزة زمنية لترسيخ المعلومات السهلة دون هدر الوقت.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '20px'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="تكبير الفحص السريري"
            style={{
              maxWidth: '92vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '14px',
              border: '1px solid rgba(45,212,191,0.5)'
            }}
          />
        </div>
      )}
    </div>
  );
}
