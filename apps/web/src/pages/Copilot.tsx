import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Target, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Compass, 
  MessageSquare,
  Send,
  Zap,
  HelpCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiClient } from '../utils/apiClient';

export default function Copilot() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useStore();
  
  const [step, setStep] = useState<'input' | 'analyzing' | 'questions' | 'finalizing' | 'profile'>('input');
  const [rawIdea, setRawIdea] = useState(location.state?.idea || '');
  const [analysis, setAnalysis] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (rawIdea) {
      analyzeIdea(rawIdea);
    }
  }, []);

  const analyzeIdea = async (pitchText?: string) => {
    const textToSubmit = pitchText || rawIdea;
    if (!textToSubmit.trim()) return;
    
    if (!user || !token) {
      navigate('/auth?mode=register');
      return;
    }

    try {
      setError(null);
      setStep('analyzing');
      const data = await apiClient('/copilot/analyze', {
        method: 'POST',
        data: { idea: textToSubmit }
      });
      setAnalysis(data);
      setStep('questions');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحليل الفكرة.');
      setStep('input');
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitAnswers = async () => {
    try {
      setError(null);
      setStep('finalizing');
      const data = await apiClient('/copilot/finalize', {
        method: 'POST',
        data: {
          rawIdea,
          assumptions: analysis.assumptions,
          answers
        }
      });
      setProfile(data);
      setStep('profile');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء صياغة الفكرة.');
      setStep('questions');
    }
  };

  const startVCEvaluation = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const combinedIdea = profile?.profile?.summary + '\n' + profile?.profile?.value_proposition;
      const newProject = await apiClient('/projects', {
        method: 'POST',
        data: { 
          title: combinedIdea.split(' ').slice(0, 5).join(' '),
          description: combinedIdea 
        },
      });
      
      const scanData = await apiClient('/scan', {
        method: 'POST',
        data: { projectId: newProject.id },
      });
      
      if (scanData.scanId) {
        navigate(`/scan/${scanData.scanId}`);
      } else {
        throw new Error(scanData.message || 'فشل في إطلاق محرك الفحص التحليلي.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center pt-24 pb-32 px-4 overflow-hidden grid-bg text-white min-h-screen" dir="rtl">
      {/* Background radial glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />

      <div className="max-w-3xl w-full flex flex-col relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-12 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-full border border-white/10 bg-[#111] flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-l from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">مساعد الأفكار الذكي — قُوم</h1>
            <p className="text-zinc-500 text-sm">مساعدك الشخصي في تطوير وصياغة فكرة مشروعك بالشكل الأمثل</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 w-full text-rose-400 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-sm flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {step === 'input' && (
            <motion.div 
              key="input" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              className="w-full space-y-6"
            >
              <div className="glass rounded-[2rem] p-8 border-white/5 bg-[#0f0f0f] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Compass size={18} className="text-cyan-400" />
                    <span className="text-sm font-bold text-zinc-300">اشرح فكرتك للوكلاء</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono tracking-widest">{rawIdea.length} / 2000</span>
                </div>

                <textarea
                  value={rawIdea}
                  onChange={(e) => setRawIdea(e.target.value)}
                  placeholder="اكتب فكرة الابتكار أو مشروعك هنا. مثلاً: منصة SaaS لربط المزارعين المحليين بالمطاعم بشكل مباشر لتخفيض تكاليف التوريد..."
                  className="w-full min-h-[160px] bg-transparent resize-none outline-none text-white placeholder:text-zinc-700 text-lg leading-relaxed mb-6"
                  maxLength={2000}
                />

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 opacity-60">
                    <Zap size={14} className="text-amber-400" />
                    <span className="text-xs text-zinc-400">سيقوم الـ Co-Pilot بفحص الفكرة وطرح أسئلة تكميلية مخصصة.</span>
                  </div>
                  
                  <button
                    onClick={() => analyzeIdea()}
                    disabled={rawIdea.trim().length < 10}
                    className="bg-white hover:bg-zinc-200 text-black rounded-full px-8 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.2)]"
                  >
                    <span>تحليل الفكرة والمتابعة</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-cyan-500 animate-spin mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">جاري فحص وتفكيك الفكرة...</h2>
              <p className="text-zinc-500 text-sm">نستخلص المعنى، ونحدد الفجوات التأسيسية التي تحتاج إلى تفصيل.</p>
            </motion.div>
          )}

          {step === 'questions' && analysis && (
            <motion.div key="questions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              
              <div className="glass rounded-[2rem] p-8 border-white/5 bg-[#111] mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-cyan-400 mt-1 shrink-0"><Sparkles size={20} /></div>
                  <div className="space-y-4 w-full">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">هذا ما تم استخلاصه من فكرتك:</h3>
                      <p className="text-zinc-300 text-sm leading-relaxed">{analysis.extracted_idea.problem} - {analysis.extracted_idea.solution}</p>
                    </div>
                    
                    {analysis.assumptions?.length > 0 && (
                      <div className="bg-black/50 p-5 rounded-2xl border border-white/5 space-y-3">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Compass size={12} className="text-zinc-500" />
                          <span>افتراضات أولية مستنتجة (تحتاج تأكيدك)</span>
                        </div>
                        <ul className="space-y-2.5">
                          {analysis.assumptions.map((a: any, i: number) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                              <span><strong className="text-zinc-300">{a.element}:</strong> {a.guess}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-cyan-400" />
                <span>يرجى الإجابة لتعديل الصياغة الاستراتيجية:</span>
              </h3>

              <div className="space-y-8">
                {analysis.questions.map((q: any, idx: number) => (
                  <div key={q.id} className="glass rounded-2xl p-6 border-white/5 bg-[#111] hover:border-white/10 transition-all">
                    <h4 className="font-bold text-white mb-4 flex gap-3 items-center">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono">{idx + 1}</span>
                      <span>{q.text}</span>
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {q.options.map((opt: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(q.id, opt)}
                          className={`px-5 py-2.5 rounded-xl text-sm transition-all border ${
                            answers[q.id] === opt 
                              ? 'bg-cyan-500 text-white border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                              : 'bg-black border-white/10 text-zinc-300 hover:border-cyan-500/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex justify-between items-center">
                <button
                  onClick={() => setStep('input')}
                  className="px-6 py-3 rounded-full text-sm font-bold border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <ArrowRight size={16} />
                  <span>تعديل الفكرة المبدئية</span>
                </button>

                <button
                  onClick={submitAnswers}
                  disabled={Object.keys(answers).length < analysis.questions.length}
                  className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  <span>صياغة الفكرة النهائية</span>
                  <ArrowLeft size={16} />
                </button>
              </div>

            </motion.div>
          )}

          {step === 'finalizing' && (
            <motion.div key="finalizing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-cyan-500 animate-spin mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">جاري صياغة وبلورة مفهوم الابتكار...</h2>
              <p className="text-zinc-500 text-sm">نجمع إجاباتك لبناء نموذج مشروع متكامل وجاهز للتقييم.</p>
            </motion.div>
          )}

          {step === 'profile' && profile && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
              
              <div className="glass rounded-[2rem] p-8 border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <div className="text-[10px] font-mono text-emerald-500 mb-1 tracking-wider uppercase">ملف الفكرة الاستراتيجية المعتمد</div>
                    <h2 className="text-2xl font-black text-white leading-snug">{profile.profile.summary}</h2>
                  </div>
                  <div className="text-center bg-black/40 border border-white/5 px-4 py-2 rounded-2xl shrink-0">
                    <div className="text-3xl font-black text-emerald-400 font-mono num-ltr">{profile.completeness_score}%</div>
                    <div className="text-[9px] font-mono text-zinc-500">مستوى الوضوح</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-1">
                    <div className="text-[10px] text-zinc-500 font-mono">الجمهور المستهدف</div>
                    <p className="text-sm font-bold text-zinc-200">{profile.profile.audience}</p>
                  </div>
                  <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-1">
                    <div className="text-[10px] text-zinc-500 font-mono">القيمة المقترحة الجوهرية</div>
                    <p className="text-sm font-bold text-cyan-400">{profile.profile.value_proposition}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-2xl border-white/5 bg-[#111] hover:border-white/10 transition-all space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0"/> 
                    <span>جوانب واضحة ومدروسة</span>
                  </h4>
                  <ul className="space-y-3">
                    {profile.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-zinc-400 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="glass p-6 rounded-2xl border-white/5 bg-[#111] hover:border-white/10 transition-all space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                    <HelpCircle size={16} className="text-amber-400 shrink-0"/> 
                    <span>جوانب تحتاج إلى فحص مستقبلاً</span>
                  </h4>
                  <ul className="space-y-3">
                    {profile.unclear_points.map((u: string, i: number) => (
                      <li key={i} className="text-xs text-zinc-400 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl border-cyan-500/20 bg-cyan-500/5 text-center relative overflow-hidden space-y-2">
                <div className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase">الخطوة الاستراتيجية القادمة</div>
                <p className="text-base font-bold text-white leading-relaxed">{profile.next_step}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button 
                  onClick={() => {
                    setRawIdea('');
                    setAnswers({});
                    setProfile(null);
                    setStep('input');
                  }} 
                  className="px-8 py-3 rounded-full text-sm font-bold border border-white/10 hover:bg-white/5 transition-all text-center"
                >
                  البدء بفكرة جديدة
                </button>
                
                <button 
                  onClick={startVCEvaluation} 
                  disabled={isSubmitting}
                  className={`bg-white text-black px-8 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(255,255,255,0.1)] transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 hover:scale-102'}`}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />} 
                  <span>{isSubmitting ? 'جاري التحضير...' : 'إطلاق تقييم قُوم المتكامل'}</span>
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
