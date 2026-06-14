import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard, Lock, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiClient } from '../utils/apiClient';

export default function CheckoutSimulation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useStore();

  const sessionId = searchParams.get('session_id') || '';
  const packageId = searchParams.get('packageId') || 'basic';
  const credits = searchParams.get('credits') || '5';
  const price = searchParams.get('price') || '10';

  const [email, setEmail] = useState(user?.email || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [nameOnCard, setNameOnCard] = useState(user?.name || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get package details in Arabic
  const getPackageName = () => {
    switch (packageId) {
      case 'premium': return 'الباقة المتقدمة';
      case 'enterprise': return 'الباقة الاحترافية';
      default: return 'الباقة الأساسية';
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cardNumber.replace(/\s/g, '').length < 16) {
      setError('رقم البطاقة الائتمانية غير صالح.');
      return;
    }
    if (expiry.length < 5) {
      setError('تاريخ انتهاء الصلاحية غير صالح.');
      return;
    }
    if (cvc.length < 3) {
      setError('رمز الأمان غير صالح.');
      return;
    }

    setIsLoading(true);

    try {
      // Confirm the mock payment with backend
      const res = await apiClient('/billing/confirm-mock-payment', {
        method: 'POST',
        data: {
          packageId,
          sessionId,
        },
      });

      // Update state safely with backend confirmation
      if (user) {
        useStore.getState().setAuth({ ...user, scanCredits: res.newCredits }, useStore.getState().token);
      }
      
      setTimeout(() => {
        navigate(`/payment/success?credits=${credits}&price=${price}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء معالجة الدفعة.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg bg-[#0a0a0a] text-white flex flex-col md:flex-row relative overflow-hidden" dir="rtl">
      {/* Ambient background glows */}
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full blur-[150px] bg-cyan-500/5 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full blur-[150px] bg-purple-500/5 pointer-events-none"></div>

      {/* Left Column: Order Summary */}
      <div className="flex-1 flex flex-col justify-center px-8 py-16 md:px-16 lg:px-24 border-l border-white/5 relative z-10 bg-zinc-950/40 backdrop-blur-md">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full mb-4 border border-white/5">
              <ShieldCheck size={12} className="text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-400 tracking-wider">بوابة دفع آمنة مشفرة</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">قُوم للاستخبارات</h1>
            <p className="text-zinc-500 text-sm">شراء رصيد تحليلات إضافي لمساعد الأفكار الذكي</p>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">تفاصيل الطلب</div>
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div>
                <h3 className="font-bold text-white text-base">{getPackageName()}</h3>
                <p className="text-xs text-zinc-500 mt-1">باقة شحن رصيد تحليلات الفحص الذاتي</p>
              </div>
              <span className="text-2xl font-black text-cyan-400 font-mono num-ltr">${price}.00</span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">عدد تحليلات الفحص:</span>
                <span className="text-white font-bold">{credits} فحوصات</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">الصلاحية:</span>
                <span className="text-emerald-400 font-bold">صلاحية غير محدودة</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">سرعة المعالجة:</span>
                <span className="text-cyan-400 font-bold">فحص متوازي فوري</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">المزايا المضمنة</div>
            <div className="space-y-3">
              {[
                'تفعيل السرب الاستراتيجي المتوازي المكون من 5 وكلاء ذكاء اصطناعي',
                'دعم الفحص والتحليل بالهجة الطلابية السعودية وحفظ الأفكار',
                'إصدار فوري لبطاقة وجواز سفر الابتكار المهني المعتمد (Passport)',
                'مستند تقرير متكامل وخالي من أي مدخلات عشوائية أو وهمية'
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-400 leading-relaxed">
                  <CheckCircle2 size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => navigate('/copilot')}
            className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 pt-4"
          >
            <ArrowRight size={12} />
            إلغاء الطلب والعودة للرئيسية
          </button>
        </div>
      </div>

      {/* Right Column: Payment Fields */}
      <div className="flex-1 flex flex-col justify-center px-8 py-16 md:px-16 lg:px-24 relative z-10 bg-zinc-950/20">
        <div className="max-w-md w-full mx-auto glass rounded-[2.5rem] p-8 border-cyan-500/20 bg-zinc-900/80 shadow-[0_15px_40px_rgba(6,182,212,0.05)] relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">تفاصيل الدفع ببطاقة الائتمان</h2>
              <p className="text-xs text-zinc-500 mt-0.5">معلومات الدفع محاكاة بالكامل لأغراض التجربة</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePay} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 font-mono">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="glass-input w-full pl-4 pr-4 bg-zinc-950/80 text-left num-ltr"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 font-mono">تفاصيل البطاقة</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="4242 4242 4242 4242"
                  className="glass-input w-full pl-11 pr-4 bg-zinc-950/80 text-left num-ltr font-mono"
                  maxLength={19}
                />
                <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-mono">تاريخ الانتهاء</label>
                <input
                  type="text"
                  required
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  className="glass-input w-full pl-4 pr-4 bg-zinc-950/80 text-center font-mono"
                  maxLength={5}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-mono">رمز الأمان (CVC)</label>
                <input
                  type="text"
                  required
                  value={cvc}
                  onChange={e => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123"
                  className="glass-input w-full pl-4 pr-4 bg-zinc-950/80 text-center font-mono"
                  maxLength={3}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 font-mono">الاسم المكتوب على البطاقة</label>
              <input
                type="text"
                required
                value={nameOnCard}
                onChange={e => setNameOnCard(e.target.value)}
                placeholder="Jane Doe"
                className="glass-input w-full pl-4 pr-4 bg-zinc-950/80 text-right"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_25px_rgba(6,182,212,0.25)] hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>جاري معالجة الدفع بأمان...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>دفع ${price}.00 الآن</span>
                </>
              )}
            </button>
          </form>

          <div className="flex justify-center items-center gap-2 mt-6 text-[10px] text-zinc-500 font-mono">
            <Lock size={10} />
            <span>اتصال محمي وتشفير AES-256 بت</span>
          </div>
        </div>
      </div>
    </div>
  );
}
