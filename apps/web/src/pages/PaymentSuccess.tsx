import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const credits = searchParams.get('credits') || '5';
  const price = searchParams.get('price') || '10';

  return (
    <div className="min-h-screen grid-bg bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden" dir="rtl">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] bg-emerald-500/5 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass rounded-[2.5rem] p-8 border-emerald-500/20 bg-zinc-900/80 shadow-[0_15px_45px_rgba(16,185,129,0.05)] text-center relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"></div>

        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
        >
          <CheckCircle size={40} className="text-emerald-400" />
        </motion.div>

        <h1 className="text-2xl font-black text-white mb-2">تمت عملية الدفع بنجاح!</h1>
        <p className="text-zinc-500 text-xs px-4">تمت تسوية الفاتورة وتحديث رصيد حسابك الاستخباري بنجاح.</p>

        {/* Transaction Summary Panel */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 my-8 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">الرصيد المضاف:</span>
            <span className="text-emerald-400 font-bold font-sans text-sm">+{credits} تحليلات فحص</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">المبلغ المدفوع:</span>
            <span className="text-white font-bold font-mono text-sm">${price}.00 USD</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">حالة العملية:</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
              مكتملة (مضمونة)
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/copilot')}
            className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(255,255,255,0.1)] hover:scale-[1.01]"
          >
            <span>الذهاب لمساعد الأفكار (Co-Pilot)</span>
            <ArrowLeft size={16} />
          </button>

          <div className="flex justify-center items-center gap-2 text-[10px] text-zinc-600 font-mono">
            <ShieldCheck size={12} />
            <span>نظام حماية قُوم المعتمد للدفع السحابي</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
