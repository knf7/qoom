import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Target, Shield, Coins, Settings, CheckCircle2, Terminal, BrainCircuit, Scan, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiClient } from '../utils/apiClient';

export default function Landing() {
  const navigate = useNavigate();
  const { user, token } = useStore();
  
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = 'http://localhost:3001';

  const handleCreateAndScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    if (!user || !token) {
      navigate('/auth?mode=register');
      return;
    }

    // Redirect to Co-Pilot mode
    navigate('/copilot', { state: { idea: description } });
  };

  return (
    <div className="relative flex-1 flex flex-col items-center pt-24 pb-32 px-4 overflow-hidden grid-bg text-white">
      {/* Absolute top gradient to match design */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {/* --- HERO SECTION --- */}
      <div className="max-w-4xl w-full flex flex-col items-center text-center relative z-10">
        
        {/* Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/5 px-4 py-1.5 rounded-full flex items-center gap-2 mb-8"
        >
          <span className="text-[10px] font-sans tracking-wide text-zinc-500 font-semibold">قُوم • منصة الذكاء الاستثماري</span>
          <Sparkles size={12} className="text-amber-500" />
        </motion.div>

        {/* Big Headlines */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tight mb-4 text-white glow-text-white"
        >
          قُوم
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto mb-16 leading-relaxed font-medium"
        >
          من مجرد فكرة ببالك إلى مشروع حقيقي ومدروس.
        </motion.p>

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 w-full max-w-2xl text-rose-400 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-sm flex items-center gap-2"
            >
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Core Input Area */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl relative"
        >
          <div className="glass rounded-[2rem] p-1 border border-white/5 transition-all duration-300 focus-within:border-white/20 focus-within:shadow-[0_0_40px_rgba(255,255,255,0.05)] bg-[#0f0f0f]">
            <form onSubmit={handleCreateAndScan} className="relative flex flex-col h-[200px]">
              <div className="flex justify-between items-center px-6 pt-5 pb-2">
                <span className="text-[10px] text-zinc-600 font-mono">فكرة الاستثمار</span>
                <span className="text-[10px] text-zinc-600 font-mono">{description.length} / 2000</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب فكرة الابتكار أو المشروع هنا..."
                className="flex-1 w-full bg-transparent resize-none outline-none px-6 text-white placeholder:text-zinc-700 text-lg leading-relaxed"
                maxLength={2000}
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center px-4 pb-4">
                <div className="flex items-center gap-2 px-2 opacity-50">
                  <div className="flex -space-x-1 rtl:space-x-reverse">
                    <div className="w-4 h-4 rounded-full bg-emerald-500" />
                    <div className="w-4 h-4 rounded-full bg-amber-500" />
                    <div className="w-4 h-4 rounded-full bg-rose-500" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">وكلاء جاهزون 5</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || description.length < 5}
                  className="bg-[#1c1c1c] hover:bg-[#2a2a2a] text-white rounded-full px-6 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/5 hover:border-white/10"
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> جاري التجهيز...</>
                  ) : (
                    <>ابدأ التحليل العميق <ArrowLeft size={16} /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
        
        {/* Under Input Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex gap-4 text-xs font-mono text-zinc-500"
        >
          <Link to="/dashboard" className="hover:text-white transition-colors">تصفح مشاريع تم تحليلها</Link>
          <span className="opacity-30">|</span>
          <Link to="/auth?mode=register" className="hover:text-white transition-colors">ابدأ تحليل فكرتك مجاناً</Link>
        </motion.div>

      </div>

      {/* --- AGENT CARDS --- */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-5xl mt-32"
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { id: 'finance', name: 'المالية', role: 'FINANCE', icon: Coins, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
            { id: 'team', name: 'الفريق', role: 'TEAM', icon: Bot, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { id: 'moat', name: 'الحصانة', role: 'MOAT', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            { id: 'tech', name: 'التقنية', role: 'TECH', icon: Terminal, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            { id: 'market', name: 'السوق', role: 'MARKET', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
          ].map((agent) => (
            <div key={agent.id} className="glass rounded-2xl p-6 flex flex-col items-center justify-center text-center border-white/5 hover:border-white/10 transition-all cursor-default group h-[140px] bg-[#111]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${agent.bg} ${agent.border} border`}>
                <agent.icon size={18} className={agent.color} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{agent.name}</h3>
              <span className="text-[9px] font-mono tracking-widest text-zinc-500">{agent.role}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* --- BOTTOM FEATURES --- */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-5xl mt-32 mb-16 text-center"
      >
        <h2 className="text-2xl font-bold mb-12">عناية واجبة مؤسسية في دقائق.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
          
          <div className="glass rounded-2xl p-8 border-white/5 bg-[#111]">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mb-6">
              <Shield size={14} className="text-zinc-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-3">سرية مؤسسية</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">تشفير طرفاً لطرف، ولا تُستخدم أفكارك في تدريب أي نموذج، وتُحذف خلال ٣٠ يوماً.</p>
          </div>

          <div className="glass rounded-2xl p-8 border-white/5 bg-[#111]">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mb-6">
              <BrainCircuit size={14} className="text-zinc-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-3">قرار خلال دقائق</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">بدلاً من أسابيع من العناية الواجبة، تحصل على حكم: تنفيذ، محور، أو إلغاء.</p>
          </div>

          <div className="glass rounded-2xl p-8 border-white/5 bg-[#111]">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mb-6">
              <Scan size={14} className="text-zinc-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-3">تحليل متعدد الزوايا</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">خمسة وكلاء متخصصون يفحصون فكرتك من السوق إلى المالية بمنطق مؤسسي.</p>
          </div>

        </div>
      </motion.div>

    </div>
  );
}
