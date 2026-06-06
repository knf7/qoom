import React, { useState } from 'react';
import { Shield, ChevronRight, Loader2, Target, BrainCircuit, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../utils/apiClient';
import { useNavigate } from 'react-router-dom';

interface IdeaBuilderProps {
  scan: any;
  projectId: string;
}

export default function IdeaBuilderView({ scan, projectId }: IdeaBuilderProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  
  const clarityScore = scan?.clarity_score ?? scan?.payload?.clarity_score ?? 0;
  const questions = scan?.questions ?? scan?.payload?.questions ?? [];
  const missingElements = scan?.missing_elements ?? scan?.payload?.missing_elements ?? scan?.payload?.missing_data ?? [];
  const gaps = scan?.gaps ?? scan?.payload?.gaps ?? [];
  const summary = scan?.summary ?? scan?.payload?.key_reason ?? 'فكرتك لا تزال في مرحلة التكوين الأولى. نحن بحاجة إلى مزيد من التفاصيل لتوضيحها.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(answers).length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      const oldDescription = scan.payload?.submittedDescription || scan.project?.description || '';
      
      let answersText = '';
      questions.forEach((q: any, i: number) => {
        const questionText = typeof q === 'string' ? q : q.question;
        const answerText = answers[i] || 'غير محدد';
        answersText += `${questionText}\nالجواب: ${answerText}\n\n`;
      });

      const newDescription = `
${oldDescription}

=== توضيحات من المستخدم ===
${answersText}
      `.trim();

      await apiClient(`/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: newDescription })
      });

      const newScan = await apiClient('/scan', {
        method: 'POST',
        body: JSON.stringify({ projectId })
      });

      navigate(`/scan/${newScan.scanId || newScan.id}`);
    } catch (err: any) {
      console.error('Failed to update idea:', err);
      setError(err.message || 'حدث خطأ أثناء تحديث الفكرة. يرجى المحاولة مرة أخرى.');
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center pt-8"
    >
      <div className="glass max-w-2xl w-full p-8 md:p-12 rounded-[2rem] border border-cyan-500/30 bg-[#0a0a0a] relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 border-b border-white/10 pb-8">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * clarityScore) / 100} className="text-cyan-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-white leading-none">{clarityScore}%</span>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-bold mb-2 border border-cyan-500/20 uppercase tracking-widest">
              وضع المقابلة (Interview Mode)
            </div>
            <h2 className="text-3xl font-black text-white mb-2">دعنا نطور فكرتك</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              فكرتك واعدة ولكنها تحتاج إلى بعض التوضيح. بدلاً من إعطائك تقييماً منخفضاً، أجب عن هذه الأسئلة لنتمكن من تحليل الفكرة بشكل أدق.
            </p>
          </div>
        </div>

        {/* SECTION 1: What We Understood */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <BrainCircuit size={20} />
            ما فهمناه حتى الآن
          </h3>
          <div className="p-4 bg-[#111] border border-white/10 rounded-xl">
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        </div>

        {/* SECTION 2: What Is Missing */}
        {(missingElements.length > 0 || gaps.length > 0) && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Target size={20} />
              الفجوات الأساسية (ما ينقصنا)
            </h3>
            <ul className="space-y-2">
              {(missingElements.length > 0 ? missingElements : gaps).map((gap: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* SECTION 3: Help Us Complete The Idea */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <HelpCircle size={20} className="text-cyan-400" />
            ساعدنا في استكمال الفكرة
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((q: any, i: number) => {
              const isObj = typeof q === 'object';
              const questionText = isObj ? q.question || q.text : q;
              const type = isObj ? q.type : 'free_text';
              const options = isObj ? q.options || [] : [];

              return (
                <div key={i} className="space-y-3 p-4 bg-[#111] border border-white/10 rounded-xl">
                  <label className="text-sm font-bold text-white block">
                    {questionText}
                  </label>
                  
                  {options.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                      {options.map((opt: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAnswers({...answers, [i]: opt})}
                          className={`p-3 text-sm rounded-xl border text-left transition-all ${
                            answers[i] === opt 
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                              : 'bg-black/50 border-white/5 text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea 
                      value={answers[i] || ''}
                      onChange={(e) => setAnswers({...answers, [i]: e.target.value})}
                      placeholder="اكتب توضيحك هنا..."
                      className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all resize-none mt-3"
                    />
                  )}
                </div>
              );
            })}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || Object.keys(answers).length === 0}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl p-4 text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 mt-6"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
              تحديث الفكرة وإعادة التحليل
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
