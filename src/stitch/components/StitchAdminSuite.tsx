import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Settings2, 
  ClipboardList, 
  Plus, 
  Trash2, 
  Share2, 
  Users, 
  FileQuestion, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  SlidersHorizontal, 
  Edit3, 
  Sparkles, 
  Search, 
  Filter, 
  Check, 
  X, 
  Eye, 
  Save, 
  Clock, 
  BookOpen, 
  ChevronLeft,
  GraduationCap
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchAdminSuite() {
  const { notify, user } = useStitch();
  const [activeTab, setActiveTab] = useState<'attention' | 'editor' | 'blueprint' | 'users'>('attention');

  // Question Editor state
  const [editingCode, setEditingCode] = useState('Q-10482');
  const [editingVignette, setEditingVignette] = useState('مريض يبلغ من العمر 28 عاماً، يُراجع الطوارئ بنوبة خفقان متسارع. تخطيط القلب يُظهر تسارع مركب عريض مع دلتا ويف واضحة مشخصة لمتلازمة وولف باركنسون وايت (WPW Syndrome).');
  const [editingCorrect, setEditingCorrect] = useState('بروكايناميد وريدياً (IV Procainamide) أو كاردوفيرجن إن كان غير مستقر');
  const [editingPearl, setEditingPearl] = useState('في متلازمة WPW مع الرجفان الأذيني: يُحظر إطلاقاً إعطاء حاصرات العقدة AV مثل Verapamil أو Diltiazem أو Digoxin أو Adenosine لتفادي تحول النظم إلى رجفان بطيني مميت.');

  // Blueprint Weights state
  const [medWeight, setMedWeight] = useState(35);
  const [surgWeight, setSurgWeight] = useState(25);
  const [pedWeight, setPedWeight] = useState(20);
  const [obgynWeight, setObgynWeight] = useState(15);
  const [psychWeight, setPsychWeight] = useState(5);

  // Selected student for drawer
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    email: string;
    university: string;
    phase: string;
    accuracy: number;
    completedExams: number;
    licenseExpiry: string;
    status: 'active' | 'frozen';
  } | null>(null);

  const mockStudents = [
    { id: 'MED-8841', name: 'علي محمد أحمد', email: 'ali.ahmed@ksu.edu.sa', university: 'جامعة الملك سعود', phase: 'السنة الخامسة • طب بشري', accuracy: 72.4, completedExams: 34, licenseExpiry: '2026-12-31', status: 'active' as const },
    { id: 'MED-9214', name: 'سارة خالد العتيبي', email: 'sara.otaibi@kau.edu.sa', university: 'جامعة الملك عبد العزيز', phase: 'سنة الامتياز • SMLE Prep', accuracy: 78.1, completedExams: 48, licenseExpiry: '2026-10-15', status: 'active' as const },
    { id: 'MED-7632', name: 'عمر فهد الشمري', email: 'omar.shammari@imamu.edu.sa', university: 'جامعة الإمام محمد بن سعود', phase: 'السنة الرابعة • سريري', accuracy: 64.8, completedExams: 19, licenseExpiry: '2026-08-01', status: 'active' as const }
  ];

  const handleSaveQuestion = () => {
    notify('تم حفظ وتحديث السؤال والمشتتات السريرية في بنك الأسئلة المعتمد.');
  };

  const handlePublishBlueprint = () => {
    notify('تم اعتماد موازين البلوبرنت وجدولة الاختبار الوطني بنجاح.');
  };

  return (
    <div className="stitchAdminSuiteContainer" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
      <div style={{
        background: 'var(--stitch-surface-container-lowest)',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-xl)',
        padding: '24px',
        boxShadow: 'var(--stitch-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--stitch-text-muted)' }}>
            <span>لوحة القيادة الإدارية</span>
            <span>←</span>
            <span style={{ color: 'var(--stitch-primary)', fontWeight: 600 }}>مركز العمليات السريرية والأكاديمية</span>
          </div>
          <span style={{
            background: 'var(--stitch-surface-container-high)',
            color: 'var(--stitch-primary)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            نطاق الحوكمة: المشرف العام • Full Staff Access
          </span>
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--stitch-text-primary)' }}>
            مركز القيادة والرقابة التشغيلية (Admin Command Center)
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--stitch-text-secondary)', fontSize: '14px' }}>
            إدارة وتدقيق المحتوى الطبي، معالجة البلاغات العاجلة، ضبط موازين الامتحانات الوطنية، وحوكمة حسابات الطلاب.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--stitch-border)', paddingTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('attention')}
            style={{
              background: activeTab === 'attention' ? 'var(--stitch-primary)' : 'transparent',
              color: activeTab === 'attention' ? '#ffffff' : 'var(--stitch-text-secondary)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--stitch-radius-md)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldAlert size={15} />
            <span>صندوق التدخل العاجل (4 بنود)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            style={{
              background: activeTab === 'editor' ? 'var(--stitch-primary)' : 'transparent',
              color: activeTab === 'editor' ? '#ffffff' : 'var(--stitch-text-secondary)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--stitch-radius-md)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Edit3 size={15} />
            <span>محرر الأسئلة السريرية (Question Editor)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blueprint')}
            style={{
              background: activeTab === 'blueprint' ? 'var(--stitch-primary)' : 'transparent',
              color: activeTab === 'blueprint' ? '#ffffff' : 'var(--stitch-text-secondary)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--stitch-radius-md)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <SlidersHorizontal size={15} />
            <span>محرك موازين الامتحانات (Blueprint Engine)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            style={{
              background: activeTab === 'users' ? 'var(--stitch-primary)' : 'transparent',
              color: activeTab === 'users' ? '#ffffff' : 'var(--stitch-text-secondary)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--stitch-radius-md)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={15} />
            <span>حوكمة الطلاب والتراخيص (45,210 طالب)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Priority Attention Center */}
      {activeTab === 'attention' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Alert 1 */}
            <div style={{
              background: 'var(--stitch-surface-container-lowest)',
              border: '1px solid var(--stitch-error)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    background: 'var(--stitch-error)',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    حرج — تضارب سريري
                  </span>
                  <small style={{ color: 'var(--stitch-text-muted)' }}>منذ 34 دقيقة</small>
                </div>
                <strong style={{ display: 'block', fontSize: '15px', color: 'var(--stitch-text-primary)', marginTop: '8px' }}>
                  5 بلاغات متزامنة على السؤال Q-10482 (Arrhythmias — WPW Syndrome)
                </strong>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: 1.6 }}>
                  الطلاب يشيرون لتضارب خيار Verapamil مع موانع الاستعمال المحدثة في الدليل الإرشادي الأخير لهيئة التخصصات الصحية.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  style={{
                    background: 'var(--stitch-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--stitch-radius-md)',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  معاينة وتعديل فوري
                </button>
                <button
                  type="button"
                  onClick={() => notify('تم تعليق السؤال مؤقتاً لحين التدقيق العلمي')}
                  style={{
                    background: 'var(--stitch-surface-container-high)',
                    color: 'var(--stitch-text-primary)',
                    border: 'none',
                    borderRadius: 'var(--stitch-radius-md)',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  تعليق السؤال مؤقتاً
                </button>
              </div>
            </div>

            {/* Alert 2 */}
            <div style={{
              background: 'var(--stitch-surface-container-lowest)',
              border: '1px solid var(--stitch-border)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    background: 'var(--stitch-surface-container-high)',
                    color: 'var(--stitch-primary)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    عاجل — وسائط تالفة
                  </span>
                  <small style={{ color: 'var(--stitch-text-muted)' }}>منذ ساعتين</small>
                </div>
                <strong style={{ display: 'block', fontSize: '15px', color: 'var(--stitch-text-primary)', marginTop: '8px' }}>
                  18 سؤالاً مصوراً في قسم التشريح والأشعة تحوي روابط صور مفقودة
                </strong>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: 1.6 }}>
                  تعذر تحميل شرائح الـ CT والـ Histology بسبب انتهاء صلاحية نطاق مخزن الوسائط الاحتياطي.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => notify('تم تحويل مسار الصور تلقائياً إلى خادم النسخ المحلية الاحتياطية المعتمدة')}
                  style={{
                    background: 'var(--stitch-secondary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--stitch-radius-md)',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  استبدال بالنسخ المحلية المعتمدة
                </button>
              </div>
            </div>

            {/* Alert 3 */}
            <div style={{
              background: 'var(--stitch-surface-container-lowest)',
              border: '1px solid var(--stitch-border)',
              borderRadius: 'var(--stitch-radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    background: 'var(--stitch-secondary-container)',
                    color: 'var(--stitch-on-secondary-container)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    تنظيمي — جاهزية Mock
                  </span>
                  <small style={{ color: 'var(--stitch-text-muted)' }}>غداً 09:00 ص</small>
                </div>
                <strong style={{ display: 'block', fontSize: '15px', color: 'var(--stitch-text-primary)', marginTop: '8px' }}>
                  الاختبار التجريبي الشامل Mock Exam 05 لـ 1,240 طالباً مسجلاً
                </strong>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--stitch-text-secondary)', lineHeight: 1.6 }}>
                  مطلوب تأكيد إقفال حزمة الـ 100 سؤال، واعتماد التوزيع المتوازن قبل الإطلاق الآلي في الموعد المحدد.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => notify('تم التحقق من توازن المواد وإقفال حزمة الـ 100 سؤال للاختبار التجريبي')}
                  style={{
                    background: 'var(--stitch-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--stitch-radius-md)',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  التحقق من الجاهزية وإقفال الأسئلة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Clinical Question Editor */}
      {activeTab === 'editor' && (
        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-xl)',
          padding: '24px',
          boxShadow: 'var(--stitch-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                محرر السؤال السريري المتخصص ({editingCode})
              </h3>
              <small style={{ color: 'var(--stitch-text-muted)' }}>Cardiology • Arrhythmias & Conduction</small>
            </div>
            <button
              type="button"
              onClick={handleSaveQuestion}
              style={{
                background: 'var(--stitch-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Save size={16} />
              <span>حفظ واعتماد التعديل في بنك الأسئلة</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
              نص الحالة السريرية (Clinical Vignette):
            </label>
            <textarea
              rows={4}
              value={editingVignette}
              onChange={e => setEditingVignette(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--stitch-radius-md)',
                border: '1px solid var(--stitch-border)',
                background: 'var(--stitch-surface-container-low)',
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--stitch-text-primary)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-secondary)' }}>
              الإجابة الصحيحة المعتمدة والتفسير الدوائي:
            </label>
            <input
              type="text"
              value={editingCorrect}
              onChange={e => setEditingCorrect(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--stitch-radius-md)',
                border: '1px solid var(--stitch-secondary)',
                background: 'var(--stitch-surface-container-low)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--stitch-text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-primary)' }}>
              اللؤلؤة السريرية الذهبية (Clinical Pearl):
            </label>
            <textarea
              rows={2}
              value={editingPearl}
              onChange={e => setEditingPearl(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--stitch-radius-md)',
                border: '1px solid var(--stitch-primary)',
                background: 'var(--stitch-surface-container-low)',
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--stitch-text-primary)',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Blueprint Engine */}
      {activeTab === 'blueprint' && (
        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-xl)',
          padding: '24px',
          boxShadow: 'var(--stitch-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
              محرك موازين ومخططات الاختبار الوطني (SCFHS Blueprint Engine)
            </h3>
            <p style={{ margin: '4px 0 0', color: 'var(--stitch-text-secondary)', fontSize: '13px' }}>
              اضبط الأوزان النسبية للأسئلة في امتحانات المحاكاة لضمان تطابق تام مع معايير الهيئة.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <strong>الطب الباطني (Internal Medicine)</strong>
                <span style={{ fontWeight: 700, color: 'var(--stitch-primary)' }}>{medWeight}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="50" 
                value={medWeight} 
                onChange={e => setMedWeight(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--stitch-primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <strong>الجراحة العامة (General Surgery)</strong>
                <span style={{ fontWeight: 700, color: 'var(--stitch-primary)' }}>{surgWeight}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="40" 
                value={surgWeight} 
                onChange={e => setSurgWeight(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--stitch-primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <strong>طب الأطفال (Pediatrics)</strong>
                <span style={{ fontWeight: 700, color: 'var(--stitch-primary)' }}>{pedWeight}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="30" 
                value={pedWeight} 
                onChange={e => setPedWeight(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--stitch-primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <strong>النساء والتوليد (Obstetrics & Gynecology)</strong>
                <span style={{ fontWeight: 700, color: 'var(--stitch-primary)' }}>{obgynWeight}%</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="25" 
                value={obgynWeight} 
                onChange={e => setObgynWeight(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--stitch-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handlePublishBlueprint}
              style={{
                background: 'var(--stitch-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              حفظ واعتماد التوزيع وتوليد البلوكات
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Users Governance */}
      {activeTab === 'users' && (
        <div style={{
          background: 'var(--stitch-surface-container-lowest)',
          border: '1px solid var(--stitch-border)',
          borderRadius: 'var(--stitch-radius-xl)',
          padding: '24px',
          boxShadow: 'var(--stitch-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                سجل الطلاب والتراخيص الأكاديمية (Users Management)
              </h3>
              <small style={{ color: 'var(--stitch-text-muted)' }}>45,210 طالب مسجل من 32 كلية طب</small>
            </div>
          </div>

          {/* Student Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'var(--stitch-surface-container-high)', color: 'var(--stitch-text-secondary)', fontSize: '12px' }}>
                <th style={{ padding: '10px 14px' }}>المعرف السريري</th>
                <th style={{ padding: '10px 14px' }}>اسم الطالب</th>
                <th style={{ padding: '10px 14px' }}>الجامعة والمرحلة</th>
                <th style={{ padding: '10px 14px' }}>الدقة التراكمية</th>
                <th style={{ padding: '10px 14px' }}>الامتحانات المكتملة</th>
                <th style={{ padding: '10px 14px' }}>صلاحية الترخيص</th>
                <th style={{ padding: '10px 14px' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {mockStudents.map(st => (
                <tr key={st.id} style={{ borderTop: '1px solid var(--stitch-border)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--stitch-primary)' }}>{st.id}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{st.name}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--stitch-text-secondary)' }}>
                    <div>{st.university}</div>
                    <small style={{ color: 'var(--stitch-text-muted)' }}>{st.phase}</small>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--stitch-secondary)' }}>{st.accuracy}%</td>
                  <td style={{ padding: '12px 14px' }}>{st.completedExams} اختباراً</td>
                  <td style={{ padding: '12px 14px', color: 'var(--stitch-text-muted)' }}>{st.licenseExpiry}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(st)}
                      style={{
                        background: 'var(--stitch-surface-container-high)',
                        color: 'var(--stitch-primary)',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 'var(--stitch-radius-md)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      عرض الملف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Details Drawer */}
      {selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            width: '100%',
            maxWidth: '460px',
            height: '100%',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: 'var(--stitch-shadow-lg)',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={22} color="var(--stitch-primary)" />
                <strong style={{ fontSize: '16px', color: 'var(--stitch-text-primary)' }}>
                  ملف الطالب والترخيص السحابي
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: 'var(--stitch-surface-container-low)',
              padding: '16px',
              borderRadius: 'var(--stitch-radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <strong style={{ fontSize: '16px', color: 'var(--stitch-text-primary)' }}>
                {selectedStudent.name}
              </strong>
              <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>
                {selectedStudent.email}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--stitch-primary)', fontWeight: 600 }}>
                {selectedStudent.university} • {selectedStudent.phase}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>المعرف السريري:</span>
                <strong>{selectedStudent.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>معدل الدقة التراكمي:</span>
                <strong style={{ color: 'var(--stitch-secondary)' }}>{selectedStudent.accuracy}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>الاختبارات المكتملة:</span>
                <strong>{selectedStudent.completedExams} اختباراً</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>انتهاء الترخيص الأكاديمي:</span>
                <strong style={{ color: 'var(--stitch-primary)' }}>{selectedStudent.licenseExpiry}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={() => {
                  notify(`تم تمديد ترخيص الطالب ${selectedStudent.name} لمدة 6 أشهر إضافية`);
                  setSelectedStudent(null);
                }}
                style={{
                  background: 'var(--stitch-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                تمديد الترخيص الأكاديمي (6 أشهر)
              </button>

              <button
                type="button"
                onClick={() => {
                  notify(`تم تجميد حساب الطالب ${selectedStudent.name} مؤقتاً`);
                  setSelectedStudent(null);
                }}
                style={{
                  background: 'var(--stitch-surface-container-high)',
                  color: 'var(--stitch-error)',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                تجميد الحساب مؤقتاً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StitchAdminSuite;
