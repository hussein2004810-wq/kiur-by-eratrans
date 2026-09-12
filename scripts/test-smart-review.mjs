import assert from 'node:assert/strict';
import {
  calculateNextReview,
  extractBuzzwords,
  buildCustomQuiz
} from '../src/smart-review-model.ts';

console.log('Testing SM-2 Spaced Repetition logic...');

const baseCard = {
  id: 'card-1',
  questionId: 'q-1',
  testId: 't-1',
  subjectName: 'الجراحة العامة',
  lectureName: 'التهاب الزائدة الدودية',
  front: 'ما هي العلامة السريرية الأبرز لـ McBurney sign؟',
  back: 'ألم عند الضغط في الربع السفلي الأيمن من البطن',
  buzzwords: ['McBurney', 'ألم', 'التهاب الزائدة'],
  repetitions: 0,
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  lapses: 0
};

// Test Grade 1 (Again)
const againResult = calculateNextReview(baseCard, 1);
assert.equal(againResult.repetitions, 0, 'Again must reset repetitions to 0');
assert.equal(againResult.lapses, 1, 'Again must increment lapses count');
assert.ok(againResult.interval < 1, 'Again interval must be short (< 1 day)');
assert.ok(againResult.easeFactor < 2.5, 'Again must reduce ease factor');

// Test Grade 3 (Good) on new card
const goodResult = calculateNextReview(baseCard, 3);
assert.equal(goodResult.repetitions, 1, 'Good must increment repetitions');
assert.equal(goodResult.interval, 1, 'First Good must set 1 day interval');

// Test Grade 4 (Easy) on new card
const easyResult = calculateNextReview(baseCard, 4);
assert.equal(easyResult.repetitions, 1, 'Easy must increment repetitions');
assert.equal(easyResult.interval, 3, 'First Easy must set 3 days interval');
assert.ok(easyResult.easeFactor > 2.5, 'Easy must increase ease factor');

// Test extractBuzzwords
const buzzwords = extractBuzzwords('A 45-year-old male with acute Appendicitis and abnormal ECG findings with تخطيط قلب');
assert.ok(buzzwords.includes('Appendicitis') || buzzwords.includes('ECG'), 'English clinical terms extracted');
assert.ok(buzzwords.includes('تخطيط قلب'), 'Arabic medical keywords extracted');

// Test buildCustomQuiz
const sampleTests = [
  {
    id: 'test-1',
    title: 'اختبار الطوارئ',
    subjectId: 'sub-surgery',
    lectureId: 'lec-appendicitis',
    questions: [
      { id: 'q-1', text: 'سؤال 1', options: ['أ', 'ب'], correctOption: 0 },
      { id: 'q-2', text: 'سؤال 2', options: ['أ', 'ب'], correctOption: 1, imageUrl: 'https://example.com/xray.png' },
      { id: 'q-3', text: 'سؤال 3', options: ['أ', 'ب'], correctOption: 0 }
    ]
  }
];

const mistakes = new Set(['q-2']);

const mistakeQuiz = buildCustomQuiz(sampleTests, mistakes, {
  onlyMistakes: true,
  questionCount: 5,
  durationMinutes: 10
});

assert.equal(mistakeQuiz.questions.length, 1, 'Only mistake questions must be included');
assert.equal(mistakeQuiz.questions[0].id, 'q-2', 'Correct mistake question included');
assert.equal(mistakeQuiz.durationMinutes, 10, 'Duration must match filter');

console.log('✅ All SM-2 and Smart Review engine tests passed successfully!');
