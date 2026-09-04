// Presentation only: the API remains responsible for authorization and exam eligibility.
export type ShelfTest = {
  id: string; title: string; subject?: string; lecture?: string;
  subjectId?: string; lectureId?: string; phaseId?: string; sectionId?: string;
  subjectName?: string; lectureName?: string; departmentName?: string; phaseName?: string;
  status?: string; durationMinutes: number; questionCount: number; passPercentage: number;
  examMode?: string; availableFrom?: string | null; availableUntil?: string | null; maxAttempts?: number;
};
export type ShelfCatalog = {
  subjects: {id: string; name: string; phaseId: string; sortOrder: number}[];
  lectures: {id: string; name: string; subjectId: string; sortOrder: number}[];
};
export type ShelfHistory = {id: string; testId?: string; percentage: number; finishedAt: string};

export function studyTimestamp(value: string): number {
  // SQLite CURRENT_TIMESTAMP is UTC; normalize it before parsing on mobile browsers.
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? value.replace(' ', 'T') + 'Z' : value;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function normalizeStudySearch(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ar')
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
}

export function matchesStudySearch(query: string, ...values: (string | undefined)[]): boolean {
  const words = normalizeStudySearch(query).split(' ').filter(Boolean);
  const text = normalizeStudySearch(values.filter(Boolean).join(' '));
  return words.every(word => text.includes(word));
}

export function buildStudyShelf(catalog: ShelfCatalog, tests: ShelfTest[], history: ShelfHistory[], phaseId: string) {
  const published = tests.filter(test => !test.status || test.status === 'published');
  const bySubject = new Map<string, ShelfTest[]>();
  const byLecture = new Map<string, ShelfCatalog['lectures']>();
  const byTest = new Map<string, ShelfHistory[]>();
  for (const test of published) {
    if (!test.subjectId) continue;
    const group = bySubject.get(test.subjectId) || [];
    group.push(test); bySubject.set(test.subjectId, group);
  }
  for (const lecture of catalog.lectures) {
    const group = byLecture.get(lecture.subjectId) || [];
    group.push(lecture); byLecture.set(lecture.subjectId, group);
  }
  for (const item of history) {
    if (!item.testId || !Number.isFinite(Number(item.percentage))) continue;
    const group = byTest.get(item.testId) || [];
    group.push(item); byTest.set(item.testId, group);
  }
  return catalog.subjects.filter(subject => phaseId ? subject.phaseId === phaseId : bySubject.has(subject.id))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ar'))
    .map(subject => {
      const subjectTests = bySubject.get(subject.id) || [];
      const attempts = subjectTests.flatMap(test => byTest.get(test.id) || [])
        .sort((a, b) => studyTimestamp(b.finishedAt) - studyTimestamp(a.finishedAt));
      return {
        ...subject, tests: subjectTests,
        lectures: [...(byLecture.get(subject.id) || [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ar')),
        latest: attempts[0], attemptedTests: subjectTests.filter(test => byTest.has(test.id)).length,
      };
    });
}
