export type SpacedCard = {
  id: string;
  questionId: string;
  testId: string;
  subjectName: string;
  lectureName: string;
  front: string;
  back: string;
  explanation?: string;
  imageUrl?: string;
  buzzwords: string[];
  repetitions: number;
  interval: number; // in days
  easeFactor: number;
  dueDate: string; // ISO string
  lastReviewedAt?: string;
  lapses: number;
};

export type ReviewGrade = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

const STORAGE_KEY = 'kiur-spaced-review-cards';
const DEFAULT_EASE_FACTOR = 2.5;

export function calculateNextReview(
  card: SpacedCard,
  grade: ReviewGrade,
  now: Date = new Date()
): { interval: number; easeFactor: number; repetitions: number; dueDate: string; lapses: number } {
  let { repetitions, interval, easeFactor, lapses } = card;

  if (grade === 1) {
    // Again: reset repetitions, lapse counted, review soon (15 mins)
    repetitions = 0;
    interval = 0.01; // ~15 minutes
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    lapses += 1;
  } else if (grade === 2) {
    // Hard: small interval increase, slightly reduce ease factor
    repetitions += 1;
    interval = repetitions <= 1 ? 0.5 : Math.max(1, Math.round(interval * 1.2 * 10) / 10);
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (grade === 3) {
    // Good: standard SM-2 progression
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor * 10) / 10;
    }
    repetitions += 1;
  } else {
    // Easy: bonus multiplier and ease increase
    if (repetitions === 0) {
      interval = 3;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor * 1.35 * 10) / 10;
    }
    repetitions += 1;
    easeFactor = Math.min(3.2, easeFactor + 0.15);
  }

  const dueTime = now.getTime() + interval * 24 * 60 * 60 * 1000;
  const dueDate = new Date(dueTime).toISOString();

  return { repetitions, interval, easeFactor, dueDate, lapses };
}

export function extractBuzzwords(text: string): string[] {
  if (!text) return [];
  const stopWords = new Set(['the','and','with','for','from','that','this','have','has','had','are','was','were','old','year','male','female','which','what','when','where','how','most','likely','show','shows']);
  const allEnglish = (text.match(/\b[A-Za-z]{3,}\b/g) || []).filter(w => !stopWords.has(w.toLowerCase()));
  const sortedEnglish = allEnglish.sort((a, b) => b.length - a.length);
  const arabicKeywords = [
    'تخطيط قلب', 'أشعة سينية', 'احتشاء عضلة القلب', 'متلازمة', 'جرعة',
    'التهاب الزائدة', 'تسمم', 'فشل كلوي', 'ارتفاع ضغط الدم', 'صدمة إنتانية',
    'داء السكري', 'ربو حاد', 'جلطة رئوية', 'قصور القلب', 'فقر دم'
  ];
  const matchedArabic = arabicKeywords.filter(keyword => text.includes(keyword));
  const unique = Array.from(new Set([...sortedEnglish.slice(0, 3), ...matchedArabic.slice(0, 3)]));
  return unique.slice(0, 5);
}


export function getStoredCards(): Record<string, SpacedCard> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    for (const key of Object.keys(parsed)) {
      const card = parsed[key];
      if (card && typeof card === 'object') {
        if (!Array.isArray(card.buzzwords)) card.buzzwords = [];
        if (typeof card.interval !== 'number') card.interval = 0;
        if (typeof card.easeFactor !== 'number') card.easeFactor = DEFAULT_EASE_FACTOR;
        if (typeof card.repetitions !== 'number') card.repetitions = 0;
      }
    }
    return parsed;
  } catch {
    return {};
  }
}

export function saveStoredCards(cards: Record<string, SpacedCard>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // quota exceeded or private mode
  }
}

export function syncCardsFromTests(
  tests: Array<{
    id: string;
    title: string;
    subjectName?: string;
    subject?: string;
    lectureName?: string;
    lecture?: string;
    questions?: Array<{
      id?: string;
      text: string;
      options?: string[];
      correctOption: number;
      explanation?: string;
      imageUrl?: string;
      questionType?: string;
      acceptedAnswers?: string[];
    }>;
  }>
): SpacedCard[] {
  const existing = getStoredCards();
  let updated = false;

  for (const test of tests) {
    if (!test || !Array.isArray(test.questions)) continue;
    const sub = test.subjectName || test.subject || 'مادة سريرية';
    const lec = test.lectureName || test.lecture || 'محاضرة سريرية';

    for (const q of test.questions) {
      if (!q.id) continue;
      if (!existing[q.id]) {
        const correctText =
          q.questionType === 'fill_blank'
            ? (q.acceptedAnswers && q.acceptedAnswers[0]) || 'إجابة نموذجية'
            : (Array.isArray(q.options) && q.options[q.correctOption]) || 'إجابة صحيحة';

        existing[q.id] = {
          id: `card-${q.id}`,
          questionId: q.id,
          testId: test.id,
          subjectName: sub,
          lectureName: lec,
          front: q.text,
          back: correctText,
          explanation: q.explanation,
          imageUrl: q.imageUrl,
          buzzwords: extractBuzzwords(q.text + ' ' + correctText),
          repetitions: 0,
          interval: 0,
          easeFactor: DEFAULT_EASE_FACTOR,
          dueDate: new Date().toISOString(),
          lapses: 0
        };
        updated = true;
      }
    }
  }

  if (updated) {
    saveStoredCards(existing);
  }

  return Object.values(existing);
}

export function getDueCards(cards: SpacedCard[], now: Date = new Date()): SpacedCard[] {
  const threshold = now.toISOString();
  return cards
    .filter(c => c.dueDate <= threshold)
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
}

export type CustomQuizFilter = {
  subjectId?: string;
  lectureId?: string;
  onlyMistakes?: boolean;
  hasImagesOnly?: boolean;
  questionCount: number;
  durationMinutes: number; // 0 for unlimited / practice mode
};

export function buildCustomQuiz(
  allTests: Array<{
    id: string;
    title: string;
    subjectId?: string;
    lectureId?: string;
    subjectName?: string;
    lectureName?: string;
    questions?: Array<{
      id?: string;
      text: string;
      options: string[];
      correctOption: number;
      explanation?: string;
      imageUrl?: string;
      questionType?: string;
      acceptedAnswers?: string[];
    }>;
  }>,
  mistakeQuestionIds: Set<string>,
  filter: CustomQuizFilter
): {
  title: string;
  durationMinutes: number;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    correctOption: number;
    explanation?: string;
    imageUrl?: string;
    questionType?: string;
    acceptedAnswers?: string[];
    sourceTestTitle: string;
  }>;
} {
  const pool: Array<{
    id: string;
    text: string;
    options: string[];
    correctOption: number;
    explanation?: string;
    imageUrl?: string;
    questionType?: string;
    acceptedAnswers?: string[];
    sourceTestTitle: string;
  }> = [];

  for (const test of allTests) {
    if (filter.subjectId && test.subjectId !== filter.subjectId) continue;
    if (filter.lectureId && test.lectureId !== filter.lectureId) continue;
    if (!test.questions) continue;

    for (const q of test.questions) {
      if (!q.id) continue;
      if (filter.onlyMistakes && !mistakeQuestionIds.has(q.id)) continue;
      if (filter.hasImagesOnly && !q.imageUrl) continue;

      pool.push({
        id: q.id,
        text: q.text,
        options: Array.isArray(q.options) ? [...q.options] : [],
        correctOption: q.correctOption,
        explanation: q.explanation,
        imageUrl: q.imageUrl,
        questionType: q.questionType,
        acceptedAnswers: q.acceptedAnswers,
        sourceTestTitle: test.title
      });
    }
  }

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, Math.max(1, filter.questionCount));

  return {
    title: filter.onlyMistakes ? 'اختبار مراجعة الأخطاء السريرية' : 'اختبار تدريبي سريري مخصص',
    durationMinutes: filter.durationMinutes || Math.max(5, selected.length * 2),
    questions: selected
  };
}
