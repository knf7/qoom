import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Target, Shield, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Sparkles, PlusCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiClient } from '../utils/apiClient';

export default function Copilot() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useStore();
  
  const [step, setStep] = useState<'analyzing' | 'questions' | 'finalizing' | 'profile'>('analyzing');
  const [rawIdea, setRawIdea] = useState(location.state?.idea || '');
  const [analysis, setAnalysis] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawIdea) {
      navigate('/');
      return;
    }
    analyzeIdea();
  }, []);

  const analyzeIdea = async () => {
    try {
      setStep('analyzing');
      const data = await apiClient('/copilot/analyze', {
        method: 'POST',
        data: { idea: rawIdea }
      });
      setAnalysis(data);
      setStep('questions');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحليل الفكرة.');
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitAnswers = async () => {
    try {
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
      setError(err.message || 'حدث خطأ أثناء بناء الملف.');
      setStep('questions');
    }
  };

  const startVCEvaluation = async () => {
    try {
      const combinedIdea = profile?.profile?.summary + '\n' + profile?.profile?.value_proposition;
      const newProject = await apiClient('/projects', {
        method: 'POST',
        data: { 
          title: combinedIdea.substring(0, 30) + '...',
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
        throw new Error(scanData.message || 'فشل في إطلاق التحليل.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center pt-24 pb-32 px-4 overflow-hidden grid-bg text-white min-h-screen">
      <div className="max-w-3xl w-full flex flex-col relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-full border border-white/10 bg-[#111] flex items-center justify-center text-cyan-400">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">QOOM Idea Co-Pilot</h1>
            <p className="text-zinc-500 text-sm">شريك التفكير الذكي لتطوير فكرتك</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 w-full text-rose-400 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-sm flex items-center gap-2">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {step === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-cyan-500 animate-spin mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">جاري تحليل الفكرة المبدئية...</h2>
              <p className="text-zinc-500">نستخرج المعنى، ونحدد الفجوات الأساسية.</p>
            </motion.div>
          )}

          {step === 'questions' && analysis && (
            <motion.div key="questions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              
              <div className="glass rounded-[2rem] p-8 border-white/5 bg-[#111] mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-cyan-400 mt-1"><Sparkles size={20} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">هذا ما فهمته حتى الآن:</h3>
                    <p className="text-zinc-300 text-sm leading-relaxed mb-4">{analysis.extracted_idea.problem} - {analysis.extracted_idea.solution}</p>
                    
                    {analysis.assumptions?.length > 0 && (
                      <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                        <div className="text-[10px] font-mono text-zinc-500 mb-2 uppercase">افتراضات (تحتاج تأكيد)</div>
                        <ul className="space-y-2">
                          {analysis.assumptions.map((a: any, i: number) => (
                            <li key={i} className="text-xs text-zinc-400 flex gap-2">
                              <span className="text-amber-500">⚠️</span> {a.element}: {a.guess}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                لدي بعض الأسئلة السريعة لتوضيح الفكرة:
              </h3>

              <div className="space-y-8">
                {analysis.questions.map((q: any, idx: number) => (
                  <div key={q.id} className="glass rounded-2xl p-6 border-white/5 bg-[#111]">
                    <h4 className="font-bold text-white mb-4 flex gap-3 items-center">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono">{idx + 1}</span>
                      {q.text}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {q.options.map((opt: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(q.id, opt)}
                          className={`px-4 py-2 rounded-xl text-sm transition-all border ${
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

              <div className="mt-10 flex justify-end">
                <button
                  onClick={submitAnswers}
                  disabled={Object.keys(answers).length < analysis.questions.length}
                  className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  صياغة الفكرة النهائية <ArrowLeft size={16} />
                </button>
              </div>

            </motion.div>
          )}

          {step === 'finalizing' && (
            <motion.div key="finalizing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-cyan-500 animate-spin mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">جاري بناء ملف الفكرة...</h2>
            </motion.div>
          )}

          {step === 'profile' && profile && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              
              <div className="glass rounded-[2rem] p-8 border-emerald-500/20 bg-emerald-500/5 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <div className="text-[10px] font-mono text-emerald-500 mb-1">ملف الفكرة المعتمد</div>
                    <h2 className="text-2xl font-black text-white">{profile.profile.summary}</h2>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-emerald-400">{profile.completeness_score}%</div>
                    <div className="text-[10px] font-mono text-zinc-500">وضوح الفكرة</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                    <div className="text-[10px] text-zinc-500 mb-2">الجمهور المستهدف</div>
                    <p className="text-sm font-bold">{profile.profile.audience}</p>
                  </div>
                  <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                    <div className="text-[10px] text-zinc-500 mb-2">القيمة المقترحة</div>
                    <p className="text-sm font-bold text-cyan-400">{profile.profile.value_proposition}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="glass p-6 rounded-2xl border-white/5 bg-[#111]">
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> نقاط واضحة</h4>
                  <ul className="space-y-2">
                    {profile.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                        <span className="text-emerald-500">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass p-6 rounded-2xl border-white/5 bg-[#111]">
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Target size={16} className="text-amber-400"/> تحتاج توضيح مستقبلاً</h4>
                  <ul className="space-y-2">
                    {profile.unclear_points.map((u: string, i: number) => (
                      <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                        <span className="text-amber-500">•</span> {u}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="glass p-8 rounded-2xl border-cyan-500/30 bg-cyan-500/10 text-center mb-10">
                <div className="text-[10px] font-mono text-cyan-500 mb-2 uppercase">الخطوة القادمة</div>
                <p className="text-lg font-bold text-white">{profile.next_step}</p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button onClick={() => navigate('/')} className="px-8 py-3 rounded-full text-sm font-bold border border-white/10 hover:bg-white/5 transition-all">
                  البدء من جديد
                </button>
                <button onClick={startVCEvaluation} className="bg-white text-black px-8 py-3 rounded-full text-sm font-bold hover:scale-105 transition-all flex items-center gap-2 justify-center">
                  <Shield size={16} /> إطلاق تقييم QOOM الاستثماري
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
