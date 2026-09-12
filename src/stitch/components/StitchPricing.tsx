import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  Sparkles, 
  CreditCard, 
  Lock, 
  Zap, 
  X, 
  ArrowRight,
  Clock,
  BookOpen
} from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchPricing() {
  const { notify, setView } = useStitch();
  const [selectedPlan, setSelectedPlan] = useState<string>('smle-pro');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'apple' | 'card'>('mada');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const plans = [
    {
      id: 'basic',
      name: 'باقة المران السريري الأساسي',
      price: '99',
      period: 'شهرياً',
      popular: false,
      features: [
        'وصول كامل لبنك الأسئلة التفاعلي (Q-Bank)',
        'وضع التدريب السريري مع التفسيرات (Tutor Mode)',
        'خطة المذاكرة اليومية التلقائية',
        'دعم التكرار المتباعد للبطاقات SM-2'
      ],
      excluded: [
        'امتحانات المحاكاة الموقوتة غير المحدودة (Mock Blocks)',
        'حاسبة التنبؤ بالدرجة التنافسية للامتحانات السريرية والتقويمية',
        'خطة التعافي السريري الموجه لسد الثغرات'
      ]
    },
    {
      id: 'smle-pro',
      name: 'باقة التحضير الوطني السريري المكثف (Clinical Pro)',
      price: '249',
      period: 'لكل 3 أشهر',
      popular: true,
      features: [
        'كل ما تشمله الباقة الأساسية',
        'امتحانات محاكاة سريرية تفاعلية غير محدودة',
        'خوارزمية التنبؤ بدرجة الرخصة والمئين التنافسي',
        'خطة التعافي السريري واللآلئ الذهبية High-Yield',
        'دعم الاستخدام دون اتصال بالإنترنت وحفظ الجلسات',
        'أولوية الوصول للأسئلة المحدثة للدليل الأخير'
      ],
      excluded: []
    },
    {
      id: 'institutional',
      name: 'الترخيص الجامعي والمؤسسي',
      price: 'مخصص',
      period: 'للكليات والمستشفيات',
      popular: false,
      features: [
        'تراخيص جماعية لجميع طلاب الدفعة',
        'لوحة قيادة وتحليلات للعمادة ورؤساء الأقسام',
        'منشئ امتحانات مخصص بموازين الكلية Blueprint Engine',
        'تصدير السجلات والتقارير الأكاديمية المعتمدة'
      ],
      excluded: []
    }
  ];

  const handleOpenCheckout = (planId: string) => {
    setSelectedPlan(planId);
    setCheckoutModalOpen(true);
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutModalOpen(false);
      notify('تم تأكيد الاشتراك بنجاح! تم فتح كامل المزايا وحزم امتحانات المحاكاة بحسابك.');
      setView('home');
    }, 1500);
  };

  return (
    <div className="stitchPricingContainer" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{
        background: 'var(--stitch-surface-container-lowest)',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-xl)',
        padding: '28px',
        boxShadow: 'var(--stitch-shadow-sm)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--stitch-surface-container-high)',
          color: 'var(--stitch-primary)',
          padding: '4px 14px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 700
        }}>
          <Sparkles size={14} />
          <span>اشتراكات أكاديمية موثوقة ومطابقة لضوابط الهيئة</span>
        </div>

        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--stitch-text-primary)' }}>
          خطط الاشتراك الأكاديمي والتحضير لرخصة الممارسة
        </h1>
        <p style={{ margin: 0, color: 'var(--stitch-text-secondary)', fontSize: '15px', maxWidth: '640px', lineHeight: 1.6 }}>
          استثمر في جاهزيتك السريرية مع أكبر بنك أسئلة طبي محايد ومبني على الأدلة، مع وصول فوري لكافة التخصصات والمحاكيات.
        </p>
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        alignItems: 'stretch'
      }}>
        {plans.map(p => {
          const isPro = p.popular;
          return (
            <div
              key={p.id}
              style={{
                background: 'var(--stitch-surface-container-lowest)',
                border: isPro ? '2px solid var(--stitch-primary)' : '1px solid var(--stitch-border)',
                borderRadius: 'var(--stitch-radius-xl)',
                padding: '28px',
                boxShadow: isPro ? 'var(--stitch-shadow-lg)' : 'var(--stitch-shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              {isPro && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '24px',
                  background: 'var(--stitch-primary)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  boxShadow: 'var(--stitch-shadow-sm)'
                }}>
                  الخيار الأكثر ترشيحاً لأطباء الامتياز
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--stitch-text-primary)' }}>
                    {p.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '10px' }}>
                    <strong style={{ fontSize: '36px', color: 'var(--stitch-text-primary)', fontWeight: 800 }}>
                      {p.price}
                    </strong>
                    {p.price !== 'مخصص' && <span style={{ fontSize: '14px', color: 'var(--stitch-text-muted)' }}>ر.س</span>}
                    <span style={{ fontSize: '13px', color: 'var(--stitch-text-muted)' }}>/ {p.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {p.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                      <Check size={16} color="var(--stitch-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: 'var(--stitch-text-primary)', lineHeight: 1.5 }}>{feat}</span>
                    </div>
                  ))}
                  {p.excluded.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', opacity: 0.5 }}>
                      <X size={16} color="var(--stitch-text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: 'var(--stitch-text-muted)', textDecoration: 'line-through' }}>{ex}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCheckout(p.id)}
                style={{
                  marginTop: '24px',
                  background: isPro ? 'var(--stitch-primary)' : 'var(--stitch-surface-container-high)',
                  color: isPro ? '#ffffff' : 'var(--stitch-text-primary)',
                  border: 'none',
                  borderRadius: 'var(--stitch-radius-md)',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isPro ? 'var(--stitch-shadow-md)' : 'none'
                }}
              >
                {p.price === 'مخصص' ? 'تواصل مع منسق الجامعات' : 'اختيار هذه الخطة وبدء الوصول'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Checkout Payment Modal */}
      {checkoutModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--stitch-surface-container-lowest)',
            border: '1px solid var(--stitch-border)',
            borderRadius: 'var(--stitch-radius-xl)',
            padding: '28px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: 'var(--stitch-shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={22} color="var(--stitch-secondary)" />
                <strong style={{ fontSize: '16px', color: 'var(--stitch-text-primary)' }}>
                  بوابة الدفع الآمن والترخيص الفوري
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'var(--stitch-surface-container-low)',
              borderRadius: 'var(--stitch-radius-md)',
              padding: '12px 16px',
              fontSize: '13px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>الخطة المختارة:</span>
              <strong style={{ color: 'var(--stitch-primary)' }}>
                {selectedPlan === 'smle-pro' ? 'Clinical Pro (الباقة الاحترافية)' : 'باقة التدريب الأساسية'}
              </strong>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stitch-text-primary)' }}>
                اختر طريقة الدفع المعتمدة:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'mada', label: 'مدى (Mada)' },
                  { id: 'apple', label: 'Apple Pay' },
                  { id: 'card', label: 'بطاقة ائتمانية' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: 'var(--stitch-radius-md)',
                      border: paymentMethod === m.id ? '2px solid var(--stitch-primary)' : '1px solid var(--stitch-border)',
                      background: paymentMethod === m.id ? 'var(--stitch-surface-container-high)' : 'var(--stitch-surface-container-low)',
                      color: 'var(--stitch-text-primary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Card Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="رقم البطاقة (•••• •••• •••• ••••)"
                defaultValue="4242 •••• •••• 4242"
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--stitch-radius-md)',
                  border: '1px solid var(--stitch-border)',
                  background: 'var(--stitch-surface-container-low)',
                  fontSize: '13px',
                  outline: 'none',
                  color: 'var(--stitch-text-primary)'
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="MM/YY"
                  defaultValue="12/28"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--stitch-radius-md)',
                    border: '1px solid var(--stitch-border)',
                    background: 'var(--stitch-surface-container-low)',
                    fontSize: '13px',
                    outline: 'none',
                    color: 'var(--stitch-text-primary)'
                  }}
                />
                <input
                  type="text"
                  placeholder="CVV"
                  defaultValue="921"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--stitch-radius-md)',
                    border: '1px solid var(--stitch-border)',
                    background: 'var(--stitch-surface-container-low)',
                    fontSize: '13px',
                    outline: 'none',
                    color: 'var(--stitch-text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={isProcessing}
              style={{
                background: 'var(--stitch-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isProcessing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              <Lock size={16} />
              <span>{isProcessing ? 'جارٍ معالجة الدفع والتفعيل...' : 'تأكيد ودفع (249 ر.س)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StitchPricing;
