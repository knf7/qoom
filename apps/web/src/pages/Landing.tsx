import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Target, 
  Shield, 
  Coins, 
  Terminal, 
  BrainCircuit, 
  Scan, 
  ArrowLeft, 
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Network
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiClient } from '../utils/apiClient';
import ThinkingCanvas from '../components/ThinkingCanvas';

export default function Landing() {
  const navigate = useNavigate();
  const { user, token } = useStore();

  React.useEffect(() => {
    if (user && token) {
      navigate('/copilot', { replace: true });
    }
  }, [user, token, navigate]);
  
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunchScan = async () => {
    if (description.trim().length < 5) return;
    setIsValidating(true);
    setError(null);
    try {
      // 1. Create a project
      const title = `فكرة مشروع - ${new Date().toLocaleDateString('ar-SA')}`;
      const project = await apiClient('/projects', {
        method: 'POST',
        data: { title, description },
      });

      // 2. Validate idea
      await apiClient('/validate-idea', {
        method: 'POST',
        data: { description },
      });

      setIsValidating(false);
      setIsSubmitting(true);

      // 3. Trigger scan
      const scanData = await apiClient('/scan', {
        method: 'POST',
        data: { projectId: project.id },
      });

      if (scanData.scanId) {
        navigate(`/scan/${scanData.scanId}`);
      } else {
        setError(scanData.message || 'فشل في إطلاق التحليل. حاول مرة أخرى.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setIsValidating(false);
      setIsSubmitting(false);
      setError(err.message || 'فكرة غير واضحة أو فشل في التحقق');
    }
  };

  const handleStart = () => {
    if (!user || !token) {
      navigate('/auth?mode=register');
    } else {
      navigate('/copilot');
    }
  };

  const agentsList = [
    { id: 'finance', name: 'دراسة الجدوى والمالية', role: 'الخبير الاقتصادي', icon: Coins, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
    { id: 'team', name: 'التقنية والتنفيذ', role: 'المهندس التقني', icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
    { id: 'moat', name: 'الحصانة والميزة التنافسية', role: 'المخطط الاستراتيجي', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]' },
    { id: 'tech', name: 'المخاطر والتحديات', role: 'محلل المخاطر', icon: Terminal, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]' },
    { id: 'market', name: 'دراسة السوق والطلب', role: 'المحلل الفني', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' }
  ];

  return (
    <div className="relative flex-1 flex flex-col items-center pt-24 pb-32 px-4 overflow-hidden grid-bg text-white" dir="rtl">
      {/* Deep space radial background glow */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* --- HERO SECTION --- */}
      <div className="max-w-5xl w-full flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10 mt-8">
        
        {/* Left Side: Creative Pitch & Actions */}
        <div className="flex-1 flex flex-col items-start text-right space-y-8 max-w-xl">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-white/5 px-4 py-1.5 rounded-full flex items-center gap-2"
          >
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[10px] font-sans tracking-wide text-zinc-400 font-semibold">قُوم • الجيل الجديد من تقييم الأفكار استثمارياً</span>
          </motion.div>

          {/* Title */}
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black tracking-tight text-white leading-none"
            >
              قُوم
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl md:text-3xl font-bold text-zinc-300 leading-tight"
            >
              نظام تشغيل الابتكار بالذكاء الاصطناعي
            </motion.h2>
          </div>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-sm md:text-base leading-relaxed font-medium"
          >
            حوّل فكرتك المبدئية إلى مستند مشروع متكامل ومدروس. يقوم مساعدنا الذكي بفحص فكرتك عبر 5 وكلاء ذكاء اصطناعي متخصصين يعملون بالتوازي لتحليل السوق، المنافسة، الجدوى، الأرباح، والمخاطر.
          </motion.p>

          {/* Main Action Buttons */}
          {user && token ? (
            <div className="w-full space-y-6 pt-4">
              {/* Show error toast if any */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center justify-between backdrop-blur-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Bot size={16} className="text-rose-400" />
                      {error}
                    </span>
                    <button onClick={() => setError(null)} className="text-rose-400/60 hover:text-rose-300 transition-colors">
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <ThinkingCanvas
                value={description}
                onChange={setDescription}
                placeholder="اكتب فكرتك الريادية هنا بالتفصيل... مثلاً: منصة لربط المزارعين بالمطاعم مباشرة لتقليل الهدر."
                isSubmitting={isSubmitting}
                isValidating={isValidating}
                onTriggerScan={handleLaunchScan}
              />

              <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 pt-2">
                <Link
                  to="/copilot"
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Sparkles size={12} className="text-cyan-400 animate-pulse" />
                  أو ابدأ باستخدام مساعد الأفكار الإرشادي (Co-Pilot)
                </Link>
                <Link
                  to="/dashboard"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  تصفح كافة المشاريع السابقة ←
                </Link>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full flex flex-col sm:flex-row gap-4 pt-4"
            >
              <button
                onClick={handleStart}
                className="bg-white hover:bg-zinc-200 text-black rounded-full px-8 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.15)] hover:scale-102"
              >
                <span>أطلق مساعد الأفكار (Co-Pilot)</span>
                <ArrowLeft size={16} />
              </button>

              <Link
                to="/auth?mode=login"
                className="glass hover:bg-white/5 text-white border border-white/10 rounded-full px-8 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Bot size={16} className="text-cyan-400" />
                <span>تسجيل الدخول للنظام</span>
              </Link>
            </motion.div>
          )}
          
          {/* Micro stats under action */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-6 pt-6 w-full text-zinc-600 border-t border-white/5 font-mono text-[10px] uppercase tracking-wider"
          >
            <div>
              <span className="block text-zinc-400 font-bold">5 وكلاء</span>
              تحليل متوازي
            </div>
            <div>
              <span className="block text-zinc-400 font-bold">~1.5 دقيقة</span>
              زمن الفحص الإجمالي
            </div>
            <div>
              <span className="block text-zinc-400 font-bold">PostgreSQL</span>
              حفظ سحابي آمن
            </div>
          </motion.div>

        </div>

        {/* Right Side: Creative Multi-Agent Orbiting preview panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.8 }}
          className="flex-1 w-full max-w-md aspect-square relative flex items-center justify-center"
        >
          {/* Central core node */}
          <div className="absolute w-36 h-36 rounded-full border border-white/10 bg-[#070707] flex flex-col items-center justify-center z-20 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border border-dashed border-white/10 rounded-full"
            />
            <Cpu size={32} className="text-white mb-2" />
            <span className="text-sm font-black tracking-widest font-sans">QOOM CORE</span>
            <span className="text-[8px] font-mono text-zinc-600 tracking-wider">INTELLIGENCE NETWORK</span>
          </div>

          {/* Background orbit circles */}
          <div className="absolute w-[340px] h-[340px] rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute w-[240px] h-[240px] rounded-full border border-dashed border-white/5 pointer-events-none" />

          {/* Deployed agents orbiting nodes */}
          {agentsList.map((agent, index) => {
            const angle = (index * 2 * Math.PI) / agentsList.length;
            const radius = 160; // radius of orbit
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const AgentIcon = agent.icon;

            return (
              <motion.div
                key={agent.id}
                className="absolute z-30 group"
                style={{ left: `calc(50% + ${x}px - 2rem)`, top: `calc(50% + ${y}px - 2rem)` }}
                whileHover={{ scale: 1.1 }}
              >
                {/* Glowing agent node button */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${agent.bg} ${agent.border} border cursor-default transition-all ${agent.glow} relative`}>
                  <AgentIcon size={22} className={agent.color} />
                  
                  {/* Tooltip description */}
                  <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none bottom-[-64px] right-1/2 translate-x-1/2 w-44 glass p-3 rounded-xl border border-white/10 text-center transition-all duration-300 z-50">
                    <span className="block text-[10px] font-black text-white">{agent.name}</span>
                    <span className="block text-[8px] text-zinc-500 font-mono mt-0.5">{agent.role}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Telemetry connection lines mapping */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 400 400">
            {agentsList.map((_, index) => {
              const angle = (index * 2 * Math.PI) / agentsList.length;
              const radius = 160;
              const x2 = 200 + radius * Math.cos(angle);
              const y2 = 200 + radius * Math.sin(angle);
              return (
                <line 
                  key={index} 
                  x1="200" 
                  y1="200" 
                  x2={x2} 
                  y2={y2} 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>

        </motion.div>

      </div>

      {/* --- AGENT INFO TILES GRID --- */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-5xl mt-32"
      >
        <div className="text-center mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white">تحليل شامل ومتكامل للفكرة</h2>
          <p className="text-zinc-500 text-xs mt-2">خمسة وكلاء برتبة شركاء استثمار يفحصون فكرتك من كافة الجوانب</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {agentsList.map((agent) => (
            <div key={agent.id} className="glass rounded-2xl p-6 flex flex-col items-center justify-center text-center border-white/5 hover:border-white/10 transition-all cursor-default group h-[160px] bg-[#111]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${agent.bg} ${agent.border} border`}>
                <agent.icon size={18} className={agent.color} />
              </div>
              <h3 className="text-xs font-bold text-white mb-1 leading-snug">{agent.name}</h3>
              <span className="text-[9px] font-mono tracking-widest text-zinc-500">{agent.role}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* --- BOTTOM FEATURES --- */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-5xl mt-32 mb-16 text-center"
      >
        <h2 className="text-2xl font-bold mb-12">ضمان الخصوصية والمصداقية المهنية.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
          
          <div className="glass rounded-2xl p-8 border border-white/5 bg-[#111] hover:border-white/10 transition-all">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mb-6 text-zinc-400">
              <Shield size={14} />
            </div>
            <h3 className="text-base font-bold text-white mb-3">خصوصية تامة للأفكار</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">تشفير كامل للبيانات، ولا نستخدم أفكارك في تدريب النماذج العامة. أفكارك ملكك بالكامل.</p>
          </div>

          <div className="glass rounded-2xl p-8 border border-white/5 bg-[#111] hover:border-white/10 transition-all">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mb-6 text-zinc-400">
              <BrainCircuit size={14} />
            </div>
            <h3 className="text-base font-bold text-white mb-3">حكم استثماري نزيه</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">نخرج بحكم واضح ومنطقي بناءً على البيانات دون أي انحيازات شخصية: اعتماد، تعديل مسار، أو إلغاء.</p>
          </div>

          <div className="glass rounded-2xl p-8 border border-white/5 bg-[#111] hover:border-white/10 transition-all">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mb-6 text-zinc-400">
              <Scan size={14} />
            </div>
            <h3 className="text-base font-bold text-white mb-3">تقييم تكتيكي فوري</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">تحصل على مؤشرات واضحة ونقاط ملموسة للبدء في العمل التكتيكي الفوري لتطوير مشروعك.</p>
          </div>

        </div>
      </motion.div>

    </div>
  );
}
