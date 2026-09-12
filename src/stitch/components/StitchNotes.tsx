import React, { useState } from 'react';
import { 
  BookMarked, 
  Lightbulb, 
  Search, 
  Bookmark, 
  Clock, 
  Tag, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Filter,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { useStitch } from '../StitchContext';

interface ClinicalPearlNote {
  id: string;
  code: string;
  specialty: string;
  priority: 'high' | 'normal';
  title: string;
  summary: string;
  clinicalTakeaway: string;
  contraindication?: string;
  updatedAt: string;
  bookmarked: boolean;
}

export function StitchNotes() {
  const { setView } = useStitch();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('1');

  const notes: ClinicalPearlNote[] = [
    {
      id: '1',
      code: 'Q-10482',
      specialty: 'أمراض القلب (Cardiology)',
      priority: 'high',
      title: 'محاذير حاصرات AV node في متلازمة WPW مع رجفان أذيني',
      summary: 'في وجود متلازمة Wolff-Parkinson-White مع رجفان أذيني، يُحظر تماماً إعطاء حاصرات العقدة الأذينية البطينية (مثل Verapamil, Diltiazem, Digoxin, Beta-blockers) لأنها تسرّع التوصيل عبر المسار الإضافي (Accessory Pathway) مما قد يُحفز الرجفان البطيني (VFib).',
      clinicalTakeaway: 'العلاج الإسعافي للمريض غير المستقر هو الصدمة الكهربائية المتزامنة (Synchronized Cardioversion)، وفي المريض المستقر نستخدم Procainamide أو Ibutilide وريدياً.',
      contraindication: 'موانع مطلقة: Adenosine, Verapamil, Beta Blockers, Digoxin.',
      updatedAt: 'اليوم، 09:30 ص',
      bookmarked: true
    },
    {
      id: '2',
      code: 'Q-8492',
      specialty: 'الطب الباطني (Pulmonology)',
      priority: 'high',
      title: 'معايير Light للتمييز بين Transudate و Exudate في الانصباب الجنبي',
      summary: 'يُصنف السائل الجنبي كانصباب نتحي (Exudative) إذا حقق معياراً واحداً على الأقل من معايير لايت الثلاثة، مما يوجه نحو أسباب التهابية أو أورام خبيثة بدلاً من الفشل القلبي.',
      clinicalTakeaway: 'النسبة البروتينية للسائل/المصل > 0.5، أو نسبة LDH السائل/المصل > 0.6، أو مستوى LDH في السائل يتجاوز ثلثي الحد الأعلى الطبيعي لمصل الدم.',
      updatedAt: 'أمس، 18:45 م',
      bookmarked: true
    },
    {
      id: '3',
      code: 'Q-7193',
      specialty: 'العناية المركزة (ICU / Nephrology)',
      priority: 'high',
      title: 'بروتوكول التدخل الإسعافي في فرط بوتاسيوم الدم الحاد (K+ > 6.5)',
      summary: 'أول وأهم خطوة عند ملاحظة تغيرات تخطيط القلب (تسنن موجات T، اتساع QRS) هي تثبيت الغشاء القلبي لحماية المريض من توقف القلب الحتمي.',
      clinicalTakeaway: '1. كالسيوم جلوكونات وريدياً (Cardiac Membrane Stabilization)\n2. أنسولين نظامي + جلوكوز 50% (Intracellular Shift)\n3. بيكربونات صوديوم وبخاخات سالبيوتامول\n4. إدرار بولي أو غسيل كلوي إسعافي عند الفشل.',
      contraindication: 'لا يؤخر إعطاء الكالسيوم لحين الحصول على جرعة الإنسولين.',
      updatedAt: 'منذ 3 أيام',
      bookmarked: false
    },
    {
      id: '4',
      code: 'Q-6204',
      specialty: 'الجراحة العامة (General Surgery)',
      priority: 'normal',
      title: 'معايير علامة Murphy الإيجابية ودقة السونار في المرارة الحادة',
      summary: 'توقف الشهيق المفاجئ عند الضغط تحت الحافة الضلعية اليمنى أثناء الشهيق العميق يشير بقوة إلى التهاب المرارة الحاد (Acute Cholecystitis).',
      clinicalTakeaway: 'السونار البطني (Ultrasound) هو الفحص الأولي الذهبي، ويكشف سماكة جدار المرارة > 4mm، ووجود السوائل حولها مع الحصوات المرارية.',
      updatedAt: 'منذ 5 أيام',
      bookmarked: true
    }
  ];

  const filteredNotes = notes.filter(n => {
    const matchesFilter = filter === 'all' || 
      (filter === 'cardio' && n.specialty.includes('Cardiology')) ||
      (filter === 'internal' && n.specialty.includes('Pulmonology')) ||
      (filter === 'icu' && n.specialty.includes('ICU')) ||
      (filter === 'surgery' && n.specialty.includes('Surgery'));

    const matchesSearch = !searchTerm || 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      n.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.code.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const selectedNote = notes.find(n => n.id === selectedNoteId) || notes[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <BookMarked size={22} color="var(--stitch-primary-container)" />
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>مركز الملاحظات واللآلئ السريرية (Clinical Pearls)</h2>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-muted)' }}>
            مستخلصات عالية العائد، تنبيهات الأدوية، ومعايير التشخيص التفريقي المستندة إلى الأدلة
          </p>
        </div>

        <button
          type="button"
          onClick={() => setView('glimpses')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--stitch-radius-md)',
            background: 'var(--stitch-primary-container)',
            color: '#fff',
            border: 0,
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={16} />
          <span>عرض اللمحات الثلاثية الأبعاد 3D</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="stitchMetricsGrid">
        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">إجمالي اللآلئ والملاحظات</span>
            <div className="stitchMetricValues">
              <b>{notes.length}</b>
              <span>لؤلؤة طبية</span>
            </div>
            <span className="stitchMetricFootnote">
              <CheckCircle2 size={14} /> موثقة بالمراجع الأكاديمية
            </span>
          </div>
          <div className="stitchMetricIconSquare">
            <Lightbulb size={24} />
          </div>
        </div>

        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">الملاحظات المحفوظة بعلم</span>
            <div className="stitchMetricValues">
              <b>{notes.filter(n => n.bookmarked).length}</b>
              <span>محفوظة</span>
            </div>
            <span className="stitchMetricFootnote" style={{ color: 'var(--stitch-tertiary)' }}>
              للمراجعة قبل الاختبار
            </span>
          </div>
          <div className="stitchMetricIconSquare" style={{ color: 'var(--stitch-tertiary)' }}>
            <Bookmark size={24} />
          </div>
        </div>

        <div className="stitchMetricCard">
          <div className="stitchMetricInfo">
            <span className="stitchMetricLabel">أولويات سريرية حرجة</span>
            <div className="stitchMetricValues">
              <b>{notes.filter(n => n.priority === 'high').length}</b>
              <span className="stitchMetricPill" style={{ background: 'var(--stitch-error-container)', color: 'var(--stitch-error)' }}>
                High-Yield
              </span>
            </div>
            <span className="stitchMetricFootnote" style={{ color: 'var(--stitch-error)' }}>
              تكرار عالي في اختبارات البورد
            </span>
          </div>
          <div className="stitchMetricIconSquare" style={{ color: 'var(--stitch-error)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Split View: List (40%) & Detail (60%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* Left/Right Column: Filter & Notes List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Search & Filter Pills */}
          <div style={{
            background: 'var(--stitch-bg-surface)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-lg)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--stitch-surface-container-low)',
              border: '1px solid var(--stitch-border)',
              borderRadius: 'var(--stitch-radius-md)',
              padding: '6px 12px'
            }}>
              <Search size={16} color="var(--stitch-text-muted)" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ابحث في نصوص اللآلئ أو رقم السؤال..."
                style={{
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  color: 'var(--stitch-text-primary)',
                  fontSize: '12px',
                  width: '100%'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'cardio', label: 'القلبية' },
                { id: 'internal', label: 'الباطنية' },
                { id: 'icu', label: 'العناية المركزة' },
                { id: 'surgery', label: 'الجراحة' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--stitch-radius-sm)',
                    background: filter === tab.id ? 'var(--stitch-primary-container)' : 'var(--stitch-surface-container-low)',
                    color: filter === tab.id ? '#fff' : 'var(--stitch-text-secondary)',
                    border: 0,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredNotes.map(note => {
              const isSelected = selectedNote.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--stitch-radius-lg)',
                    background: isSelected ? 'var(--stitch-surface-container-low)' : 'var(--stitch-bg-surface)',
                    border: '1.5px solid',
                    borderColor: isSelected ? 'var(--stitch-primary-container)' : 'var(--stitch-border)',
                    boxShadow: isSelected ? 'var(--stitch-shadow-md)' : 'var(--stitch-shadow-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: 'var(--stitch-primary-container)'
                    }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'var(--stitch-surface-container)',
                        color: 'var(--stitch-primary-container)'
                      }}>
                        {note.code}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--stitch-text-muted)' }}>{note.specialty}</span>
                    </div>

                    {note.priority === 'high' && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: 'var(--stitch-error-container)',
                        color: 'var(--stitch-error)'
                      }}>
                        أولوية سريرية
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: 'var(--stitch-text-primary)', lineHeight: '1.4' }}>
                    {note.title}
                  </h4>

                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--stitch-text-secondary)',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {note.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Pane (Selected Note Full Rationale) */}
        {selectedNote && (
          <div style={{
            background: 'var(--stitch-bg-surface)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-lg)',
            padding: '24px',
            boxShadow: 'var(--stitch-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'var(--stitch-primary-container)',
                  color: '#fff'
                }}>
                  {selectedNote.code}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--stitch-text-muted)' }}>
                  {selectedNote.specialty}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--stitch-text-muted)' }}>
                <Clock size={14} />
                <span>{selectedNote.updatedAt}</span>
              </div>
            </div>

            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--stitch-text-primary)', lineHeight: '1.4' }}>
              {selectedNote.title}
            </h3>

            {/* Context / Scenario */}
            <div style={{
              padding: '16px',
              borderRadius: 'var(--stitch-radius-md)',
              background: 'var(--stitch-surface-container-low)',
              border: '1px solid var(--stitch-border)'
            }}>
              <b style={{ display: 'block', fontSize: '12px', color: 'var(--stitch-primary-container)', marginBottom: '6px' }}>
                السياق والفيزيولوجيا المرضية (Pathophysiology):
              </b>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.7', color: 'var(--stitch-text-primary)' }}>
                {selectedNote.summary}
              </p>
            </div>

            {/* Key Clinical Objective / Takeaway */}
            <div style={{
              padding: '16px',
              borderRadius: 'var(--stitch-radius-md)',
              background: 'var(--stitch-surface-container)',
              borderRight: '4px solid var(--stitch-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <CheckCircle2 size={16} color="var(--stitch-secondary)" />
                <b style={{ fontSize: '12px', color: 'var(--stitch-secondary)' }}>
                  الهدف التعليمي عالي الأهمية (High-Yield Objective):
                </b>
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.7', color: 'var(--stitch-text-primary)', whiteSpace: 'pre-line' }}>
                {selectedNote.clinicalTakeaway}
              </p>
            </div>

            {/* Contraindications Warning */}
            {selectedNote.contraindication && (
              <div style={{
                padding: '14px 16px',
                borderRadius: 'var(--stitch-radius-md)',
                background: 'var(--stitch-error-container)',
                border: '1px solid var(--stitch-error)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <AlertTriangle size={18} color="var(--stitch-error)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <b style={{ display: 'block', fontSize: '12px', color: 'var(--stitch-error)', marginBottom: '2px' }}>
                    تحذير إكلينيكي حرج:
                  </b>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--stitch-on-surface)' }}>
                    {selectedNote.contraindication}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}

export default StitchNotes;
