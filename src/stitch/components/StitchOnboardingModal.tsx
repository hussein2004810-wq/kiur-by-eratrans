import React, { useState } from 'react';
import { 
  HeartPulse, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User 
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchOnboardingModal({ 
  open, 
  onClose,
  initialMode = 'onboarding'
}: { 
  open: boolean; 
  onClose: () => void;
  initialMode?: 'onboarding' | 'signin' | 'recovery';
}) {
  const { notify, setView } = useStitch();
  const [mode, setMode] = useState<'onboarding' | 'signin' | 'recovery'>(initialMode);
  const [step, setStep] = useState<number>(1);

  // Onboarding fields
  const [selectedUni, setSelectedUni] = useState('جامعات وكليات العراق (ERATRANS)');
  const [selectedExam, setSelectedExam] = useState('البورد العراقي والامتحان التقويمي');
  const [selectedPhase, setSelectedPhase] = useState('المرحلة السريرية • تدريب سريري');

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!open) return null;

  const handleFinishOnboarding = () => {
    notify('تم ضبط مسارك الأكاديمي واختبارك المستهدف بنجاح! مرحباً بك في KIUR by ERATRANS.');
    onClose();
    setView('home');
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    notify('تم تسجيل الدخول بنجاح.');
    onClose();
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    notify('تم إرسال رابط استعادة كلمة المرور المعتمد إلى بريدك الأكاديمي.');
    setMode('signin');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} dir="rtl">
      <div style={{
        background: 'var(--stitch-surface-container-lowest)',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-xl)',
        padding: '32px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: 'var(--stitch-shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative'
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--stitch-text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Mode: Onboarding Flow */}
        {mode === 'onboarding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--stitch-radius-md)',
                background: 'var(--stitch-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GraduationCap size={22} />
              </div>
              <div>
                <strong style={{ fontSize: '18px', color: 'var(--stitch-text-primary)' }}>
                  تهيئة المسار الأكاديمي السريري
                </strong>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--stitch-text-muted)' }}>
                  الخطوة {step} من 3 • معايرة المنصة والامتحانات
                </span>
              </div>
            </div>

            {/* Step 1: University & College */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                  اختر الجامعة والكلية الطبية:
                </label>
                <select
                  value={selectedUni}
                  onChange={e => setSelectedUni(e.target.value)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--stitch-radius-md)',
                    border: '1px solid var(--stitch-border)',
                    background: 'var(--stitch-surface-container-low)',
                    color: 'var(--stitch-text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="جامعات وكليات العراق (ERATRANS)">جامعات وكليات العراق (منظومة ERATRANS الأكاديمية)</option>
                  <option value="جامعة بغداد — كلية الطب">جامعة بغداد — كلية الطب</option>
                  <option value="جامعة المستنصرية — كلية الطب">جامعة المستنصرية — كلية الطب</option>
                  <option value="جامعة النهرين — كلية الطب">جامعة النهرين — كلية الطب</option>
                  <option value="جامعة بابل — كلية الطب">جامعة بابل — كلية الطب</option>
                </select>

                <div style={{
                  background: 'var(--stitch-surface-container-low)',
                  padding: '12px',
                  borderRadius: 'var(--stitch-radius-md)',
                  fontSize: '12px',
                  color: 'var(--stitch-text-secondary)',
                  lineHeight: 1.5
                }}>
                  يتم ضبط بنك الأسئلة والتقويم الدراسي تلقائياً بما يتطابق مع المناهج والموازين المعتمدة لدى كليتك.
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    background: 'var(--stitch-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--stitch-radius-md)',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                >
                  <span>المتابعة إلى الاختبار المستهدف</span>
                  <ArrowLeft size={16} />
                </button>
              </div>
            )}

            {/* Step 2: Target Exam & Phase */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                  الاختبار المهني المستهدف:
                </label>
                <select
                  value={selectedExam}
                  onChange={e => setSelectedExam(e.target.value)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--stitch-radius-md)',
                    border: '1px solid var(--stitch-border)',
                    background: 'var(--stitch-surface-container-low)',
                    color: 'var(--stitch-text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="البورد العراقي والامتحان التقويمي">البورد العراقي والامتحان التقويمي الوطني</option>
                  <option value="امتحانات الكفاءة والترخيص السريري">امتحانات الكفاءة والترخيص السريري الشامل</option>
                  <option value="IFOM Clinical Sciences Examination">IFOM CSE (اختبار العلوم السريرية الدولي)</option>
                  <option value="Medical Finals (الامتحانات النهائية للكلية)">الامتحانات السريرية والنهائية للكلية</option>
                </select>

                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                  المرحلة الدراسية الحالية:
                </label>
                <select
                  value={selectedPhase}
                  onChange={e => setSelectedPhase(e.target.value)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--stitch-radius-md)',
                    border: '1px solid var(--stitch-border)',
                    background: 'var(--stitch-surface-container-low)',
                    color: 'var(--stitch-text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="سنة الامتياز (Medical Internship)">سنة الامتياز (Medical Internship)</option>
                  <option value="السنة السادسة (Final Year)">السنة السادسة (Final Year)</option>
                  <option value="السنة الخامسة (Fifth Year)">السنة الخامسة (Fifth Year)</option>
                  <option value="السنة الرابعة (Clinical Clerkship)">السنة الرابعة (Clinical Clerkship)</option>
                </select>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      background: 'var(--stitch-surface-container-high)',
                      color: 'var(--stitch-text-primary)',
                      border: 'none',
                      borderRadius: 'var(--stitch-radius-md)',
                      padding: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{
                      flex: 1,
                      background: 'var(--stitch-primary)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--stitch-radius-md)',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>معايرة التقييم التشخيصي</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation & Baseline Calibration */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: 'var(--stitch-secondary-container)',
                  color: 'var(--stitch-on-secondary-container)',
                  padding: '14px',
                  borderRadius: 'var(--stitch-radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 size={20} />
                  <strong style={{ fontSize: '14px' }}>
                    تمت تهيئة بيئة التعلم السريري الخاصة بك بنجاح
                  </strong>
                </div>

                <div style={{
                  background: 'var(--stitch-surface-container-low)',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '14px',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div>الجامعة: <strong>{selectedUni}</strong></div>
                  <div>الاختبار المستهدف: <strong>{selectedExam}</strong></div>
                  <div>المرحلة: <strong>{selectedPhase}</strong></div>
                </div>

                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  style={{
                    background: 'var(--stitch-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--stitch-radius-md)',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--stitch-shadow-md)',
                    marginTop: '8px'
                  }}
                >
                  الدخول المباشر إلى لوحة التحكم الرئيسية
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mode: Sign In */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--stitch-radius-md)',
                background: 'var(--stitch-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Lock size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '18px', color: 'var(--stitch-text-primary)' }}>
                  تسجيل الدخول الأكاديمي
                </strong>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--stitch-text-muted)' }}>
                  KIUR by ERATRANS • الدخول الأكاديمي المعتمد
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stitch-text-primary)' }}>
                البريد الإلكتروني الأكاديمي:
              </label>
              <input
                type="email"
                required
                placeholder="doctor@medical.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--stitch-radius-md)',
                  border: '1px solid var(--stitch-border)',
                  background: 'var(--stitch-surface-container-low)',
                  fontSize: '14px',
                  outline: 'none',
                  color: 'var(--stitch-text-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stitch-text-primary)' }}>
                  كلمة المرور:
                </label>
                <button
                  type="button"
                  onClick={() => setMode('recovery')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--stitch-primary)', fontSize: '12px', cursor: 'pointer' }}
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--stitch-radius-md)',
                  border: '1px solid var(--stitch-border)',
                  background: 'var(--stitch-surface-container-low)',
                  fontSize: '14px',
                  outline: 'none',
                  color: 'var(--stitch-text-primary)'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: 'var(--stitch-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              تسجيل الدخول المباشر
            </button>
          </form>
        )}

        {/* Mode: Recovery */}
        {mode === 'recovery' && (
          <form onSubmit={handleRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <strong style={{ fontSize: '18px', color: 'var(--stitch-text-primary)' }}>
                استعادة كلمة المرور
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
                أدخل بريدك الأكاديمي المسجل وسنرسل لك رابط إعادة تعيين آمن ومطابق لضوابط الخصوصية.
              </p>
            </div>

            <input
              type="email"
              required
              placeholder="doctor@medical.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: 'var(--stitch-radius-md)',
                border: '1px solid var(--stitch-border)',
                background: 'var(--stitch-surface-container-low)',
                fontSize: '14px',
                outline: 'none',
                color: 'var(--stitch-text-primary)'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setMode('signin')}
                style={{
                  background: 'var(--stitch-surface-container-high)',
                  color: 'var(--stitch-text-primary)',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '10px 16px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                العودة لتسجيل الدخول
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  background: 'var(--stitch-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                إرسال رابط الاستعادة
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default StitchOnboardingModal;
