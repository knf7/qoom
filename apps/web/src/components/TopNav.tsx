import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, BarChart3, Settings, CreditCard, ChevronDown, Mail, X, Send, ShieldCheck, Loader2, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiClient } from '../utils/apiClient';

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, lang } = useStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('أرغب في زيادة رصيد التحليلات الخاص بي بمقدار 10 نقاط.');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'premium' | 'enterprise'>('premium');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handlePurchaseInit = async () => {
    setIsCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const data = await apiClient('/billing/create-checkout-session', {
        method: 'POST',
        data: { packageId: selectedPackage },
      });
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('فشل إنشاء جلسة الدفع.');
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'حدث خطأ أثناء الاتصال بخادم الدفع.');
      setIsCheckoutLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      setSupportEmail(user.email);
    }
  }, [user]);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendSuccess(null);
    setSendError(null);

    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('support_request_submitted', {
        email: supportEmail,
        message: supportMessage,
      });
    }

    try {
      const data = await apiClient('/support/request', {
        method: 'POST',
        data: {
          email: supportEmail,
          message: supportMessage,
        },
      });

      if (data.success) {
        setSendSuccess('تم إرسال طلبك بنجاح! سنقوم بمراجعته وزيادة رصيدك قريباً.');
        setSupportMessage('');
        setTimeout(() => {
          setIsSupportOpen(false);
          setSendSuccess(null);
        }, 3000);
      } else {
        setSendError('فشل إرسال الطلب. يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setSendError(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setIsSending(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render nothing in auth if needed, or keep it consistent
  if (location.pathname === '/auth') return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 py-4 px-6 select-none pointer-events-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full pointer-events-auto">
        
        {/* Right Side (placed first in HTML to render on the right in RTL): Logo & Command */}
        <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-widest">قوم</span>
            <div className="w-6 h-6 rounded-md glass flex items-center justify-center text-zinc-400 border border-white/10 text-xs">
              ⌘
            </div>
          </div>
          <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase hidden sm:block">
            Venture Intelligence OS
          </span>
        </Link>

        {/* Center: Navigation Pills */}
        <div className="hidden md:flex glass rounded-full p-1 flex items-center border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                المشاريع
              </Link>
              <Link
                to="/copilot"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/copilot')
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                مساعد الأفكار (Co-Pilot)
              </Link>
              <Link
                to="/analytics"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/analytics')
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                التحليلات العامة
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/') 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                الرئيسية
              </Link>
              <Link
                to="/auth?mode=login"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/auth') 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                تسجيل الدخول
              </Link>
            </>
          )}
        </div>

        {/* Left Side (placed last in HTML to render on the left in RTL): User Actions & Full Projects */}
        <div className="flex items-center gap-3" ref={dropdownRef}>
          {user ? (
            <div className="relative">
              {/* Profile Toggle Avatar */}
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 glass border border-white/10 hover:border-cyan-500/30 rounded-full transition-all active:scale-95 text-zinc-400 hover:text-white"
              >
                <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                
                {/* User scan credits count quick badge */}
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                  {user.scanCredits ?? 0}
                </span>

                {/* Avatar Initials */}
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-bold text-zinc-300">
                  {(() => {
                    const name = user.name || user.email || '';
                    const parts = name.trim().split(' ');
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    }
                    return name[0]?.toUpperCase() || 'ع';
                  })()}
                </div>
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-3 w-72 glass rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50 text-right p-5 space-y-4"
                    dir="rtl"
                  >
                    {/* User Details */}
                    <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                        {(() => {
                          const name = user.name || user.email || '';
                          const parts = name.trim().split(' ');
                          if (parts.length >= 2) {
                            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                          }
                          return name[0]?.toUpperCase() || 'ع';
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{user.name || 'مستخدم قوم'}</div>
                        <div className="text-[10px] text-zinc-500 truncate num-ltr text-right">{user.email}</div>
                      </div>
                    </div>

                    {/* Scan Credits Account (Stripe) */}
                    <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">رصيد التحليلات المدفوعة:</span>
                        <span className="text-cyan-400 font-bold font-mono">{user.scanCredits ?? 0}</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (typeof window !== 'undefined' && (window as any).posthog) {
                            (window as any).posthog.capture('stripe_checkout_clicked');
                          }
                          setIsProfileOpen(false);
                          setIsPurchaseOpen(true);
                        }}
                        className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CreditCard size={12} />
                        شراء رصيد تحليلات (Stripe)
                      </button>
                      <div className="text-center pt-2 border-t border-white/5">
                        <button 
                          onClick={() => {
                            setIsProfileOpen(false);
                            setIsSupportOpen(true);
                          }}
                          className="w-full text-center text-[10px] text-cyan-400/80 hover:text-cyan-300 transition-colors pointer-events-auto font-bold flex items-center justify-center gap-1.5 py-1"
                        >
                          <Mail size={10} />
                          طلب زيادة رصيد مجاني / دعم فني
                        </button>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive('/dashboard')
                            ? 'bg-white/10 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Settings size={14} className="text-cyan-400" />
                        <span>المشاريع الكاملة (لوحة التحكم)</span>
                      </Link>

                      <Link
                        to="/copilot"
                        onClick={() => setIsProfileOpen(false)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive('/copilot')
                            ? 'bg-white/10 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <User size={14} className="text-cyan-400" />
                        <span>مساعد الأفكار (Co-Pilot)</span>
                      </Link>

                      <Link
                        to="/analytics"
                        onClick={() => setIsProfileOpen(false)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive('/analytics')
                            ? 'bg-white/10 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <BarChart3 size={14} className="text-cyan-400" />
                        <span>تحليلات المشاريع العامة</span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                        navigate('/auth');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all border-t border-white/5 pt-3"
                    >
                      <LogOut size={14} />
                      <span>تسجيل الخروج</span>
                    </button>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth?mode=login"
                className="md:hidden px-3 py-1.5 glass border border-white/10 hover:border-cyan-500/30 rounded-full text-xs font-bold text-white transition-all pointer-events-auto"
              >
                تسجيل الدخول
              </Link>
              <div className="hidden md:flex glass px-3 py-1.5 rounded-full items-center gap-2 border border-white/10">
                <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">NODE . ONLINE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>
            </div>
          )}
        </div>
        
      </div>

      {/* Support / Request Credits Modal */}
      <AnimatePresence>
        {isSupportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass max-w-md w-full rounded-[2rem] border border-white/10 bg-[#111] overflow-hidden shadow-[0_10px_45px_rgba(0,0,0,0.8)] relative text-right p-6 md:p-8"
              dir="rtl"
            >
              {/* Cyan top accent */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>

              {/* Close Button */}
              <button 
                onClick={() => setIsSupportOpen(false)}
                className="absolute top-4 left-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3 border border-cyan-500/20">
                  <Mail size={22} />
                </div>
                <h3 className="text-lg font-bold text-white">طلب زيادة رصيد / دعم فني</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  أرسل طلبك وسنقوم بالتواصل معك وزيادة رصيدك فوراً في غضون دقائق.
                </p>
              </div>

              {sendSuccess && (
                <div className="p-4 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-bold">
                  {sendSuccess}
                </div>
              )}

              {sendError && (
                <div className="p-4 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-bold">
                  {sendError}
                </div>
              )}

              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">البريد الإلكتروني للرد</label>
                  <input
                    type="email"
                    required
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="your-email@domain.com"
                    className="glass-input w-full pl-4 pr-4 bg-zinc-900/80 text-right"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">تفاصيل الطلب أو الرسالة</label>
                  <textarea
                    required
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="اكتب طلبك هنا..."
                    className="glass-input w-full pl-4 pr-4 py-3 bg-zinc-900/80 text-right resize-none text-xs md:text-sm leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-cyan-500/30 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-40"
                >
                  {isSending ? (
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin"></div>
                  ) : (
                    <>
                      <Send size={12} className="rotate-180" />
                      <span>إرسال الطلب</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isPurchaseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass max-w-lg w-full rounded-[2.5rem] border border-white/10 bg-[#111] overflow-hidden shadow-[0_10px_45px_rgba(0,0,0,0.8)] relative text-right p-6 md:p-8"
              dir="rtl"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>

              <button 
                onClick={() => {
                  setIsPurchaseOpen(false);
                  setCheckoutError(null);
                }}
                className="absolute top-4 left-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3 border border-cyan-500/20">
                  <CreditCard size={22} />
                </div>
                <h3 className="text-lg font-bold text-white">اختر باقة تحليلات قُوم</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  احصل على رصيد إضافي لإجراء تحليلات فحص متكاملة لأفكارك ومشروعاتك.
                </p>
              </div>

              {checkoutError && (
                <div className="p-4 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-bold">
                  {checkoutError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { id: 'basic', name: 'الباقة الأساسية', credits: 5, price: 10, desc: '5 فحوصات' },
                  { id: 'premium', name: 'المتقدمة', credits: 15, price: 25, desc: '15 فحصاً', popular: true },
                  { id: 'enterprise', name: 'الاحترافية', credits: 50, price: 50, desc: '50 فحصاً' },
                ].map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackage(pkg.id as any)}
                    className={`p-4 rounded-2xl border text-center transition-all relative flex flex-col items-center justify-between ${
                      selectedPackage === pkg.id
                        ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'border-white/5 bg-black/40 hover:border-white/20'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 px-2 py-0.5 bg-cyan-500 text-black text-[8px] font-black rounded-full uppercase tracking-wider scale-90">
                        موصى بها
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400 font-bold block mb-1">{pkg.name}</span>
                    <span className="text-2xl font-black text-white font-mono block num-ltr my-1">${pkg.price}</span>
                    <span className="text-[9px] text-cyan-400/80 font-semibold block">{pkg.desc}</span>
                  </button>
                ))}
              </div>

              <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-2.5 mb-6 text-xs text-zinc-400">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                  <Sparkles size={12} className="text-cyan-400" />
                  <span>الميزات المفعلة في الباقة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-cyan-500 shrink-0" />
                  <span>تحديث رصيد فوري وآمن 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-cyan-500 shrink-0" />
                  <span>إطلاق فحص السرب الاستراتيجي (5 وكلاء متوازيين)</span>
                </div>
              </div>

              <button
                onClick={handlePurchaseInit}
                disabled={isCheckoutLoading}
                className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isCheckoutLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>جاري تحضير بوابة الدفع الآمنة...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>الانتقال للدفع الآمن (Stripe)</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
