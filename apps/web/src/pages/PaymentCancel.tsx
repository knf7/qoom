import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Shield } from 'lucide-react';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid-bg bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden" dir="rtl">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] bg-rose-500/5 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass rounded-[2.5rem] p-8 border-rose-500/20 bg-zinc-900/80 shadow-[0_15px_45px_rgba(244,63,94,0.05)] text-center relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rose-400/60 to-transparent"></div>

        {/* Warning Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-6 shadow-[0_0_30px_rgba(244,63,94,0.15)]"
        >
          <AlertTriangle size={40} className="text-rose-400" />
        </motion.div>

        <h1 className="text-2xl font-black text-white mb-2">تم إلغاء عملية الدفع</h1>
        <p className="text-zinc-500 text-xs px-4">تم إلغاء عملية الدفع بناءً على طلبك. لم يتم خصم أي مبالغ من بطاقتك الائتمانية.</p>

        <div className="my-8 py-4 px-6 bg-black/40 border border-white/5 rounded-2xl text-xs text-zinc-400 leading-relaxed text-right">
          إذا واجهتك أي مشكلة أثناء عملية الدفع أو تعذر التحقق من البطاقة، يرجى تقديم طلب دعم فني مجاني من القائمة العلوية وسنقوم بحل المشكلة فوراً.
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/copilot')}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 hover:scale-[1.01]"
          >
            <span>العودة إلى مساعد الأفكار (Co-Pilot)</span>
            <ArrowLeft size={16} />
          </button>

          <div className="flex justify-center items-center gap-2 text-[10px] text-zinc-600 font-mono">
            <Shield size={12} />
            <span>نظام دفع آمن 100%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
