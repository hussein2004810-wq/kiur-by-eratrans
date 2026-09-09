import {useEffect, useId, useMemo, useRef, useState} from 'react';
import {ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ClipboardList, Clock3, Search, Star, Wifi, WifiOff, X} from 'lucide-react';
import ShareButton from './ShareButton';
import {buildStudyShelf, matchesStudySearch, studyTimestamp} from './study-shelf-model';
import type {ShelfCatalog, ShelfHistory, ShelfTest} from './study-shelf-model';
import './study-shelf.css';

type Props = {
  catalog: ShelfCatalog; tests: ShelfTest[]; history: ShelfHistory[];
  user: {phaseId?: string | null; universityName?: string | null; collegeName?: string | null; departmentName?: string | null; phaseName?: string | null; sectionName?: string | null; role: string};
  search: string; setSearch: (value: string) => void;
  directTarget?: {kind: 'test' | 'lecture'; id: string} | null;
  onClearDirect: () => void; onStart: (id: string) => void; onChangeProfile: () => void;
  notify: (message: string) => void; startingId: string | null;
  learningHub?: LearningHub | null; favoriteIds?: string[];
  onToggleFavorite?: (testId: string, favorite: boolean) => Promise<void>;
};

export type LearningHub = {
  activeAttempt?: (ShelfTest & {attemptId:string; answeredCount:number; questionCount:number; lastSavedAt:string}) | null;
  favorites: ShelfTest[];
  weakTopics: {subjectId?:string|null; subjectName:string; wrongAnswers:number; answered:number; accuracy:number}[];
  reviewPlan?: {subjectId:string;subjectName:string;intervalDays:number;lastScore:number;lastReviewedAt:string;nextReviewAt:string;due:number}[];
};

export default function StudyShelf({catalog, tests, history, user, search, setSearch, directTarget, onClearDirect, onStart, onChangeProfile, notify, startingId, learningHub, favoriteIds=[], onToggleFavorite}: Props) {
  const [selection, setSelection] = useState({subjectId: '', lectureId: ''});
  const [pendingFocus, setPendingFocus] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [formalCheck, setFormalCheck] = useState<ShelfTest|null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const profileId = useId();
  const visibleTests = useMemo(() => tests.filter(test => !test.status || test.status === 'published'), [tests]);
  const shelf = useMemo(() => buildStudyShelf(catalog, visibleTests, history, user.phaseId || ''), [catalog, visibleTests, history, user.phaseId]);
  const subject = shelf.find(item => item.id === selection.subjectId);
  const lecture = subject?.lectures.find(item => item.id === selection.lectureId);
  const searching = Boolean(search.trim()) && !directTarget;
  const recent = useMemo(() => shelf.filter(item => item.latest)
    .sort((a, b) => studyTimestamp(b.latest!.finishedAt) - studyTimestamp(a.latest!.finishedAt))[0], [shelf]);
  const selectedTests = useMemo(() => {
    if (directTarget?.kind === 'test') return visibleTests.filter(test => test.id === directTarget.id);
    if (directTarget?.kind === 'lecture') return visibleTests.filter(test => test.lectureId === directTarget.id);
    const candidates=searching ? visibleTests.filter(test => matchesStudySearch(search, test.title, test.subjectName, test.subject, test.lectureName, test.lecture, test.departmentName, test.phaseName)) : lecture ? subject!.tests.filter(test => test.lectureId === lecture.id) : [];
    return favoritesOnly?candidates.filter(test=>favoriteIds.includes(test.id)):candidates;
  }, [visibleTests, directTarget, searching, search, lecture, subject, favoritesOnly, favoriteIds]);
  const matchedLectures = useMemo(() => searching ? shelf.flatMap(item => item.lectures
    .filter(value => matchesStudySearch(search, value.name, item.name))
    .map(value => ({...value, subjectName: item.name, count: item.tests.filter(test => test.lectureId === value.id).length}))) : [], [searching, search, shelf]);
  useEffect(() => {
    if (pendingFocus) { headingRef.current?.focus(); setPendingFocus(false); }
  }, [pendingFocus]);
  useEffect(() => {setVisibleCount(24);}, [search, selection.subjectId, selection.lectureId, directTarget?.kind, directTarget?.id]);
  const reviewProfile = () => {setProfileOpen(true); setPendingFocus(true);};
  const choose = (subjectId = '', lectureId = '') => {
    onClearDirect(); setSearch(''); setSelection({subjectId, lectureId}); setPendingFocus(true);
  };
  const showTests = Boolean(directTarget || searching || lecture);
  const requestStart=(test:ShelfTest)=>test.examMode==='formal'?setFormalCheck(test):onStart(test.id);
  const title = directTarget ? (directTarget.kind === 'test' ? 'الاختبار المُشارك' : 'اختبارات المحاضرة المُشاركة')
    : searching ? 'نتائج البحث' : lecture?.name || subject?.name || 'رفّي الدراسي';

  return <section className="studyShelf" aria-labelledby={headingId}>
    <div className="shelfToolbar">
      <div><p className="shelfAcademic">{[user.departmentName, user.phaseName].filter(Boolean).join(' / ') || 'المحتوى الدراسي المتاح'}</p>
        <h2 id={headingId} ref={headingRef} tabIndex={-1}>{title}</h2></div>
      <button type="button" className="shelfTextButton" aria-expanded={profileOpen} aria-controls={profileId} onClick={() => setProfileOpen(value => !value)}>بيانات مساري الدراسي</button>
    </div>
    {profileOpen && <section id={profileId} className="shelfProfile"><h3>مسارك المسجل</h3><p>{[user.universityName, user.collegeName, user.departmentName, user.phaseName, user.sectionName].filter(Boolean).join(' / ') || 'لم يكتمل المسار الدراسي'}</p><p>لتصحيح مسارك بعد تثبيته، تواصل مع إدارة المنصة.</p>{!user.phaseId && <button type="button" onClick={onChangeProfile}>استكمال بيانات المسار</button>}</section>}
    <nav className="shelfBreadcrumb" aria-label="مسار الدراسة">
      <button type="button" onClick={() => choose()} aria-current={!subject && !showTests ? 'page' : undefined}>المواد</button>
      {(subject || showTests) && <ChevronLeft aria-hidden="true"/>}
      {subject && !directTarget && !searching && <button type="button" onClick={() => choose(subject.id)} aria-current={!lecture ? 'page' : undefined}>{subject.name}</button>}
      {lecture && !searching && !directTarget && <><ChevronLeft aria-hidden="true"/><span aria-current="page">{lecture.name}</span></>}
      {(directTarget || searching) && <span aria-current="page">{title}</span>}
    </nav>
    <label className="shelfSearch"><Search aria-hidden="true"/><span className="shelfSrOnly">ابحث عن مادة أو محاضرة أو اختبار</span>
      <input type="search" value={search} maxLength={200} placeholder="اسم المادة، المحاضرة أو الاختبار…" onChange={event => {onClearDirect(); setSearch(event.target.value);}}/>
    </label>
    {searching && <div className="shelfSearchSummary" role="status"><span>{selectedTests.length} اختبار و{matchedLectures.length} محاضرة ضمن المحتوى المتاح لك</span><button type="button" className="shelfTextButton" onClick={() => setSearch('')}>مسح البحث</button></div>}
    {!showTests&&learningHub?.activeAttempt&&<aside className="shelfResume"><span><Clock3/></span><div><small>لديك اختبار محفوظ</small><b>{learningHub.activeAttempt.title}</b><p>أجبت عن {learningHub.activeAttempt.answeredCount} من {learningHub.activeAttempt.questionCount} — سيكمل المؤقت من الخادم.</p></div><button type="button" disabled={Boolean(startingId)} onClick={()=>onStart(learningHub.activeAttempt!.id)}>متابعة الاختبار <ChevronLeft/></button></aside>}
    {!showTests&&Boolean(learningHub?.weakTopics.length)&&<section className="weakTopics" aria-labelledby="weak-topics-title"><header><div><small>مراجعة ذكية</small><h3 id="weak-topics-title">موضوعات تحتاج تركيزًا</h3></div><span>مبنية على إجاباتك فقط</span></header><div>{learningHub!.weakTopics.slice(0,3).map(item=><button type="button" key={item.subjectId||item.subjectName} onClick={()=>item.subjectId&&choose(item.subjectId)}><b>{item.subjectName}</b><span>الدقة {Number(item.accuracy||0)}%</span><small>{item.wrongAnswers} إجابة خاطئة من {item.answered}</small></button>)}</div></section>}
    {!showTests&&Boolean(learningHub?.reviewPlan?.length)&&<section className="reviewPlan" aria-labelledby="review-plan-title"><header><div><small>التكرار المتباعد</small><h3 id="review-plan-title">خطة مراجعتك</h3></div><span>{learningHub!.reviewPlan!.filter(item=>item.due).length} مستحقة الآن</span></header><div>{learningHub!.reviewPlan!.slice(0,4).map(item=><button type="button" key={item.subjectId} className={item.due?'due':''} onClick={()=>choose(item.subjectId)}><span><BookOpen/><b>{item.subjectName}</b></span><small>{item.due?'موعد المراجعة الآن':`المراجعة القادمة ${new Intl.DateTimeFormat('ar-IQ').format(new Date(item.nextReviewAt))}`}</small><em>آخر نتيجة {Number(item.lastScore)}% • كل {item.intervalDays} يوم</em></button>)}</div></section>}
    {!showTests && !subject && <>
      <p className="shelfIntro">افتح مادة، اختر محاضرة، ثم اختبر فهمك. تصفّح الرف لا يبدأ مؤقت الاختبار.</p>
      {recent && <aside className="shelfRecent"><BookOpen aria-hidden="true"/><div><b>ارجع إلى آخر مادة اختبرتها</b><p>{recent.name} — آخر نتيجة {recent.latest!.percentage}%</p></div><button type="button" onClick={() => choose(recent.id)}>فتح المادة <ChevronLeft aria-hidden="true"/></button></aside>}
      <div className="shelfSubjects">{shelf.map(item => <button type="button" className="shelfSubject" key={item.id} onClick={() => choose(item.id)}>
        <span className="shelfSubjectIcon"><BookOpen aria-hidden="true"/></span><h3>{item.name}</h3>
        <span className="shelfCounts">{item.lectures.length} محاضرة <span aria-hidden="true">/</span> {item.tests.length} اختبار</span>
        <span className="shelfSubjectNote">{item.latest ? `آخر نتيجة: ${item.latest.percentage}%` : item.tests.length ? 'جاهزة للمراجعة' : 'بانتظار نشر الاختبارات'}</span>
        <span className="shelfSubjectAction">فتح المحاضرات <ChevronLeft aria-hidden="true"/></span>
      </button>)}</div>
      {!shelf.length && <div className="shelfEmpty"><BookOpen aria-hidden="true"/><h3>لم تُضف مواد لهذا المسار بعد</h3><p>تحقق من قسمك ومرحلتك أو عد بعد نشر المحتوى.</p><button type="button" onClick={reviewProfile}>مراجعة مساري الدراسي</button></div>}
    </>}
    {!showTests && subject && <>
      <div className="shelfSectionHead"><p>{subject.lectures.length} محاضرة — اختر المحاضرة لعرض اختباراتها.</p><button type="button" className="shelfTextButton" onClick={() => choose()}><ArrowRight aria-hidden="true"/> كل المواد</button></div>
      <div className="shelfLectures">{subject.lectures.map(item => <button type="button" key={item.id} onClick={() => choose(subject.id, item.id)}><BookOpen aria-hidden="true"/><span><b>{item.name}</b><small>{subject.tests.filter(test => test.lectureId === item.id).length} اختبار متاح</small></span><ChevronLeft aria-hidden="true"/></button>)}</div>
      {!subject.lectures.length && <div className="shelfEmpty"><h3>المحاضرات لم تُضف بعد</h3><p>يمكنك مراجعة مادة أخرى حتى يُضاف المحتوى.</p><button type="button" onClick={() => choose()}>عرض المواد</button></div>}
    </>}
    {searching && matchedLectures.length > 0 && <details className="shelfLectureMatches" open><summary>المحاضرات المطابقة ({matchedLectures.length})</summary><div className="shelfLectures">{matchedLectures.map(item => <button type="button" key={item.id} onClick={() => choose(item.subjectId, item.id)}><BookOpen aria-hidden="true"/><span><b>{item.name}</b><small>{item.subjectName} — {item.count} اختبار</small></span><ChevronLeft aria-hidden="true"/></button>)}</div></details>}
    {showTests && <>
      <div className="shelfSectionHead"><p>{selectedTests.length} اختبار متاح. يُحفظ التقدم تلقائيًا بعد فتح الاختبار.</p>
        <div className="shelfFilters"><button type="button" className={favoritesOnly?'active':''} aria-pressed={favoritesOnly} onClick={()=>setFavoritesOnly(value=>!value)}><Star/> المفضلة فقط</button>{(lecture || directTarget?.kind === 'lecture') && <ShareButton kind="lecture" id={directTarget?.kind === 'lecture' ? directTarget.id : lecture!.id} title={lecture?.name || selectedTests[0]?.lectureName || 'محاضرة KIUR'} label="مشاركة المحاضرة" notify={notify}/>}</div>
      </div>
      <div className="shelfTests">{selectedTests.slice(0, visibleCount).map(test => <article className="shelfTest" key={test.id}>
        <div className="shelfTestKind"><ClipboardList aria-hidden="true"/>{test.examMode === 'formal' ? 'امتحان رسمي' : 'اختبار تدريبي'}</div>
        <h3>{test.title}</h3><p>{test.subjectName || test.subject} / {test.lectureName || test.lecture}</p>
        <div className="shelfTestFacts"><span><Clock3 aria-hidden="true"/>{test.durationMinutes} دقيقة</span><span>{test.questionCount} أسئلة</span><span><CheckCircle2 aria-hidden="true"/>النجاح {test.passPercentage}%</span></div>
        {test.examMode === 'formal' && <p className="shelfExamNotice">{test.maxAttempts ? `${test.maxAttempts} محاولة كحد أقصى. ` : ''}الوقت والمحاولات يحددهما الخادم. فتح الامتحان يبدأ المؤقت أو يستأنف المحاولة الحالية.</p>}
        <div className="shelfTestActions"><button type="button" className="solid" disabled={Boolean(startingId)} aria-busy={startingId === test.id} onClick={() => requestStart(test)}>{startingId === test.id ? 'جارٍ فتح الاختبار…' : 'فتح الاختبار'}</button><button type="button" className={'favoriteButton '+(favoriteIds.includes(test.id)?'active':'')} aria-pressed={favoriteIds.includes(test.id)} aria-label={favoriteIds.includes(test.id)?'إزالة من المفضلة':'إضافة إلى المفضلة'} onClick={()=>void onToggleFavorite?.(test.id,!favoriteIds.includes(test.id))}><Star/></button><ShareButton kind="test" id={test.id} title={test.title} label="مشاركة الاختبار" notify={notify}/></div>
      </article>)}</div>
      {selectedTests.length > visibleCount && <button type="button" className="shelfMore" onClick={() => setVisibleCount(value => value + 24)}>عرض المزيد من الاختبارات ({selectedTests.length - visibleCount} متبقية)</button>}
      {!selectedTests.length && <div className="shelfEmpty"><Search aria-hidden="true"/><h3>{searching ? 'لم نجد اختبارًا مطابقًا' : 'لا توجد اختبارات متاحة هنا'}</h3><p>{directTarget ? 'قد يكون الرابط غير صحيح أو المحتوى غير منشور أو خارج مسارك الدراسي.' : searching ? 'جرّب اسمًا أقصر، أو افتح إحدى المحاضرات المطابقة.' : 'لم يُنشر اختبار لهذه المحاضرة بعد. يمكنك اختيار محاضرة أخرى.'}</p><button type="button" onClick={() => choose(subject?.id)}>العودة إلى {subject ? 'المحاضرات' : 'المواد'}</button></div>}
    </>}
    {history.length > 0 && <p className="shelfFootnote">النتائج المعروضة تخص حسابك وتستند إلى آخر 100 محاولة مكتملة، وليست نسبة إكمال المنهج.</p>}
    {formalCheck&&<div className="readinessBackdrop" role="presentation"><section className="readinessDialog" role="dialog" aria-modal="true" aria-labelledby="readiness-title"><header><span><Wifi/></span><div><small>فحص الجاهزية</small><h3 id="readiness-title">قبل بدء الامتحان الرسمي</h3></div><button type="button" onClick={()=>setFormalCheck(null)} aria-label="إغلاق"><X/></button></header><ul><li className={navigator.onLine?'ready':'warning'}>{navigator.onLine?<Wifi/>:<WifiOff/>}<span><b>{navigator.onLine?'الاتصال متوفر':'لا يوجد اتصال'}</b><small>يحتاج الامتحان اتصالًا مستقرًا لحفظ الإجابات.</small></span></li><li className="ready"><CheckCircle2/><span><b>الحفظ التلقائي مفعل</b><small>تُرسل كل إجابة إلى الخادم فور اختيارها.</small></span></li><li><Clock3/><span><b>{formalCheck.durationMinutes} دقيقة</b><small>{formalCheck.maxAttempts?`${formalCheck.maxAttempts} محاولة كحد أقصى`:'عدد المحاولات حسب إعداد الاختبار'}.</small></span></li></ul><p>بعد البدء يعمل المؤقت من الخادم، وإغلاق الصفحة لا يعيد الزمن.</p><footer><button type="button" onClick={()=>setFormalCheck(null)}>العودة</button><button type="button" className="solid" disabled={!navigator.onLine||Boolean(startingId)} onClick={()=>{const id=formalCheck.id;setFormalCheck(null);onStart(id)}}>أنا جاهز، ابدأ الاختبار</button></footer></section></div>}
  </section>;
}
