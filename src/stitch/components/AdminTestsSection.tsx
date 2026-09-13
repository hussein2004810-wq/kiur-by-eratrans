import React, { useState } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import ShareButton from '../../ShareButton';
import type { Test } from '../../RealAppV2';

type Props = {
  tests: Test[];
  loading?: boolean;
  userRole: string;
  audit: any[];
  notify: (msg: string) => void;
  onCreateTest: () => void;
  onEditTest: (id: string) => void;
  onRemoveTest: (id: string) => Promise<void>;
};

export default function AdminTestsSection({
  tests,
  loading = false,
  userRole,
  audit,
  notify,
  onCreateTest,
  onEditTest,
  onRemoveTest
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleRemove = async (id: string, title: string) => {
    if (busyId) return;
    if (!confirm(`أرشفة الاختبار «${title}»؟ لن يظهر للطلاب بعد ذلك.`)) return;
    setBusyId(id);
    try {
      await onRemoveTest(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="contentGrid">
      <section className="panel tableWrap responsiveRecordWrap">
        <div className="adminHead">
          <div>
            <h3>إدارة الاختبارات</h3>
            <small>لا تظهر إلا الاختبارات الواقعة ضمن نطاق صلاحيتك</small>
          </div>
          <button type="button" className="solid" onClick={onCreateTest}>
            <Plus aria-hidden="true" />
            اختبار جديد
          </button>
        </div>

        {loading ? (
          <div className="stitchAdminEmpty" role="status">
            <ClipboardList aria-hidden="true" />
            <b>جارٍ تحميل الاختبارات...</b>
            <p>يرجى الانتظار لحين جلب البيانات من الخادم.</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="stitchAdminEmpty" role="status">
            <ClipboardList aria-hidden="true" />
            <b>لا توجد اختبارات منشورة ضمن نطاقك</b>
            <p>يمكنك إنشاء أول اختبار بالضغط على زر «اختبار جديد» في الأعلى.</p>
          </div>
        ) : (
          <table className="responsiveRecords adminTestRecords">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>المسار</th>
                <th>الأسئلة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(test => (
                <tr key={test.id}>
                  <td data-label="العنوان">{test.title}</td>
                  <td data-label="المسار">
                    {test.subjectName || test.subject}
                    <small className="tableLecture">{test.lectureName || test.lecture}</small>
                  </td>
                  <td data-label="الأسئلة">{test.questionCount}</td>
                  <td data-label="الحالة">
                    <span className={test.status === 'published' ? 'success' : 'draft'}>
                      {test.status === 'published' ? 'منشور' : 'مسودة'}
                    </span>
                  </td>
                  <td data-label="الإجراءات" className="actions">
                    <ShareButton
                      kind="test"
                      id={test.id}
                      title={test.title}
                      label="مشاركة"
                      notify={notify}
                      className="tableShare"
                    />
                    <button
                      type="button"
                      disabled={busyId === test.id}
                      onClick={() => onEditTest(test.id)}
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      className="trash"
                      aria-label={`أرشفة اختبار ${test.title}`}
                      disabled={busyId === test.id}
                      onClick={() => void handleRemove(test.id, test.title)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {userRole === 'owner' && (
        <section className="panel">
          <div className="panelHead">
            <h3>آخر التعديلات</h3>
          </div>
          {audit.length === 0 ? (
            <div className="stitchAdminEmpty">
              <b>لا توجد تعديلات مسجلة</b>
              <p>تظهر هنا العمليات التي ينفذها المشرفون والكوادر.</p>
            </div>
          ) : (
            audit.slice(0, 8).map(item => (
              <div className="audit" key={item.id}>
                <b>{item.action}</b>
                <small>
                  {item.actorName || 'النظام'} •{' '}
                  {new Intl.DateTimeFormat('ar-IQ', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  }).format(new Date(item.at))}
                </small>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}
