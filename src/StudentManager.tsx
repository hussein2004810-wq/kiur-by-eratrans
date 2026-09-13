import {useMemo} from 'react';
import {Activity,ChevronLeft,ChevronRight,Search,Trophy,UserRoundCheck,Users} from 'lucide-react';
import './insights.css';

export type StudentRow={id:string;name:string;email:string;registeredAt:string;universityId?:string|null;collegeId?:string|null;departmentId?:string|null;phaseId?:string|null;sectionId?:string|null;universityName?:string|null;collegeName?:string|null;departmentName?:string|null;phaseName?:string|null;sectionName?:string|null;attempts:number;averagePercentage:number;highestPercentage:number;latestPercentage?:number|null;passedAttempts:number;failedAttempts:number;lastActivity?:string|null};
type Item={id:string;name:string;universityId?:string;collegeId?:string;departmentId?:string;phaseId?:string};
type Catalog={universities:Item[];colleges:Item[];departments:Item[];phases:Item[];sections:Item[]};
export type StudentFilters={universityId:string;collegeId:string;departmentId:string;phaseId:string;sectionId:string};

type Props = {
  students: StudentRow[];
  total: number;
  search: string;
  onSearch: (value: string) => void;
  loading: boolean;
  catalog: Catalog;
  filters: StudentFilters;
  onFilters: (value: StudentFilters) => void;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export default function StudentManager({
  students,
  total,
  search,
  onSearch,
  loading,
  catalog,
  filters,
  onFilters,
  page = 1,
  pageSize = 100,
  onPageChange,
  onPageSizeChange
}: Props) {
  const attempted = students.filter(item => Number(item.attempts) > 0).length;
  const average = attempted
    ? Math.round((students.reduce((sum, item) => sum + Number(item.averagePercentage || 0), 0) / attempted) * 100) / 100
    : 0;

  const colleges = useMemo(() => catalog.colleges.filter(item => !filters.universityId || item.universityId === filters.universityId), [catalog, filters.universityId]);
  const departments = useMemo(() => catalog.departments.filter(item => !filters.collegeId || item.collegeId === filters.collegeId), [catalog, filters.collegeId]);
  const phases = useMemo(() => catalog.phases.filter(item => !filters.departmentId || item.departmentId === filters.departmentId), [catalog, filters.departmentId]);
  const sections = useMemo(() => catalog.sections.filter(item => !filters.phaseId || item.phaseId === filters.phaseId), [catalog, filters.phaseId]);

  const change = (key: keyof StudentFilters, value: string) => {
    const next = { ...filters, [key]: value };
    if (key === 'universityId') Object.assign(next, { collegeId: '', departmentId: '', phaseId: '', sectionId: '' });
    if (key === 'collegeId') Object.assign(next, { departmentId: '', phaseId: '', sectionId: '' });
    if (key === 'departmentId') Object.assign(next, { phaseId: '', sectionId: '' });
    if (key === 'phaseId') next.sectionId = '';
    onFilters(next);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="studentsManager">
      <div className="studentStats">
        <article>
          <span><Users aria-hidden="true" /></span>
          <div>
            <b>{total}</b>
            <small>طالب مطابق للفلاتر</small>
          </div>
        </article>
        <article>
          <span><UserRoundCheck aria-hidden="true" /></span>
          <div>
            <b>{attempted}</b>
            <small>أكملوا اختبارات في هذه الصفحة</small>
          </div>
        </article>
        <article>
          <span><Activity aria-hidden="true" /></span>
          <div>
            <b>{average}%</b>
            <small>متوسط المعروضين</small>
          </div>
        </article>
        <article>
          <span><Trophy aria-hidden="true" /></span>
          <div>
            <b>{students.length ? Math.max(...students.map(item => Number(item.highestPercentage || 0))) : 0}%</b>
            <small>أعلى نتيجة معروضة</small>
          </div>
        </article>
      </div>

      <section className="panel tableWrap">
        <div className="studentsHead">
          <div>
            <h3>سجل الطلاب والأداء</h3>
            <p>بيانات أكاديمية كاملة مع النجاح والرسوب وأعلى وآخر نتيجة والنشاط، تدعم تصفح المئات من الطلاب بسلاسة.</p>
          </div>
          <label>
            <Search aria-hidden="true" />
            <input
              value={search}
              onChange={event => onSearch(event.target.value)}
              placeholder="ابحث باسم الطالب أو بريده..."
              aria-label="البحث في سجل الطلاب"
            />
          </label>
        </div>

        <div className="studentFilters" aria-label="فلاتر سجل الطلاب">
          <select aria-label="الجامعة" value={filters.universityId} onChange={event => change('universityId', event.target.value)}>
            <option value="">كل الجامعات</option>
            {catalog.universities.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select aria-label="الكلية" value={filters.collegeId} onChange={event => change('collegeId', event.target.value)}>
            <option value="">كل الكليات</option>
            {colleges.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select aria-label="القسم" value={filters.departmentId} onChange={event => change('departmentId', event.target.value)}>
            <option value="">كل الأقسام</option>
            {departments.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select aria-label="المرحلة" value={filters.phaseId} onChange={event => change('phaseId', event.target.value)}>
            <option value="">كل المراحل</option>
            {phases.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select aria-label="الشعبة" value={filters.sectionId} onChange={event => change('sectionId', event.target.value)}>
            <option value="">كل الشعب</option>
            {sections.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        <table className="studentsTable wide">
          <thead>
            <tr>
              <th>الطالب</th>
              <th>المسار الأكاديمي</th>
              <th>المحاولات</th>
              <th>نجاح / رسوب</th>
              <th>أعلى نتيجة</th>
              <th>آخر نتيجة</th>
              <th>المتوسط</th>
              <th>آخر نشاط</th>
            </tr>
          </thead>
          <tbody>
            {students.map(item => (
              <tr key={item.id}>
                <td data-label="الطالب">
                  <div className="studentIdentity">
                    <span>{item.name.slice(0, 2)}</span>
                    <b>{item.name}</b>
                  </div>
                  <small className="studentEmail">{item.email}</small>
                </td>
                <td data-label="المسار الأكاديمي">
                  {item.universityName || 'غير محدد'}
                  <small className="tableLecture">
                    {[item.collegeName, item.departmentName, item.phaseName, item.sectionName].filter(Boolean).join(' • ') || 'لم يكمل المسار'}
                  </small>
                </td>
                <td data-label="المحاولات">{item.attempts}</td>
                <td data-label="نجاح / رسوب">
                  <span className="passFail">{item.passedAttempts} / {item.failedAttempts}</span>
                </td>
                <td data-label="أعلى نتيجة">
                  <span className="scorePill goodScore">{Number(item.highestPercentage || 0)}%</span>
                </td>
                <td data-label="آخر نتيجة">{item.latestPercentage == null ? '—' : `${Number(item.latestPercentage)}%`}</td>
                <td data-label="المتوسط">
                  <span className={'scorePill ' + (Number(item.averagePercentage) >= 60 ? 'goodScore' : 'lowScore')}>
                    {Number(item.averagePercentage || 0)}%
                  </span>
                </td>
                <td data-label="آخر نشاط">
                  {item.lastActivity
                    ? new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.lastActivity))
                    : 'لا يوجد نشاط'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div className="studentsLoading" role="status">جارٍ تحميل بيانات الطلاب...</div>}
        {!loading && !students.length && <div className="catalogEmpty">لا يوجد طلاب مطابقون للبحث والفلاتر.</div>}

        {total > 0 && (
          <div className="studentPagination" aria-label="شريط تصفح صفحات الطلاب">
            <div className="paginationInfo">
              <span>عرض <b>{students.length}</b> من أصل <b>{total}</b> طالب</span>
              {totalPages > 1 && <span> • صفحة <b>{page}</b> من <b>{totalPages}</b></span>}
            </div>

            <div className="paginationActions">
              {onPageSizeChange && (
                <label className="pageSizeSelect">
                  <span>لكل صفحة:</span>
                  <select
                    value={pageSize}
                    onChange={e => onPageSizeChange(Number(e.target.value))}
                    aria-label="عدد الطلاب لكل صفحة"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </label>
              )}

              {onPageChange && totalPages > 1 && (
                <div className="pageButtons">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => onPageChange(page - 1)}
                    aria-label="الصفحة السابقة"
                  >
                    <ChevronRight aria-hidden="true" size={16} />
                    السابقة
                  </button>
                  <span className="pageCurrent">{page} / {totalPages}</span>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => onPageChange(page + 1)}
                    aria-label="الصفحة التالية"
                  >
                    التالية
                    <ChevronLeft aria-hidden="true" size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
