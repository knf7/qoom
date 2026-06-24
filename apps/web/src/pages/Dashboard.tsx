import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Play, Eye, AlertCircle, X, Shield, Terminal, BrainCircuit, Scan, Trash2, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../utils/i18n';
import DOMPurify from 'dompurify';
import { sanitizeUILanguage } from '../utils/languageSanitizer';
import ThinkingCanvas from '../components/ThinkingCanvas';
import ThoughtProcessLoader from '../components/ThoughtProcessLoader';
import { apiClient } from '../utils/apiClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, token, projects, setProjects, refreshUser } = useStore();
  const { t, lang } = useI18n();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [validatingProjectId, setValidatingProjectId] = useState<string | null>(null);
  const [aiValidation, setAiValidation] = useState<any>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user || !token) navigate('/auth');
    else fetchProjects();
  }, [user, token, navigate]);

  const fetchProjects = async () => {
    try {
      const data = await apiClient('/projects');
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'فشل في جلب المشاريع. يرجى المحاولة لاحقاً.');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient('/projects', {
        method: 'POST',
        data: { title, description },
      });
      await fetchProjects();
      setIsCreating(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('لا يمكن الوصول إلى الخادم. تأكد من تشغيل الـ API على المنفذ 3001.');
      } else {
        setError(err.message || 'حدث خطأ غير متوقع');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateAndTriggerScan = async (project: any) => {
    setAiValidation(null);
    setValidatingProjectId(project.id);
    try {
      await apiClient('/validate-idea', {
        method: 'POST',
        data: { description: project.description },
      });
      setValidatingProjectId(null);
      await triggerScanAnalysis(project.id);
    } catch (err: any) {
      setValidatingProjectId(null);
      setError(err.message || 'فكرة غير واضحة');
    }
  };

  const handleSaveEditAndScan = async (projectId: string) => {
    setIsSavingEdit(true);
    setAiValidation(null);
    try {
      await apiClient(`/projects/${projectId}`, {
        method: 'PATCH',
        data: { description: editDescription },
      });
      await fetchProjects();
      await apiClient('/validate-idea', {
        method: 'POST',
        data: { description: editDescription },
      });
      setEditingProjectId(null);
      await triggerScanAnalysis(projectId);
    } catch (err: any) {
      setError(err.message || 'فكرة غير واضحة');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const triggerScanAnalysis = async (projectId: string) => {
    try {
      const scanData = await apiClient('/scan', {
        method: 'POST',
        data: { projectId },
      });

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('scan_initiated', {
          projectId,
          scanId: scanData.scanId
        });
      }

      if (scanData.scanId) {
        // Immediately update credits badge in TopNav (deduction happened server-side)
        await refreshUser();
        navigate(`/scan/${scanData.scanId}`);
      } else {
        setError(scanData.message || 'فشل في إطلاق التحليل. حاول مرة أخرى.');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('لا يمكن الاتصال بالخادم. تأكد من أن الـ API يعمل على المنفذ 3001.');
      } else {
        setError('فشل في بدء التحليل: ' + msg);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeletingId(projectId);
    try {
      await apiClient(`/projects/${projectId}`, {
        method: 'DELETE',
      });
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || 'فشل في حذف المشروع');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a] text-white">
      {/* Hero Gradient Background */}
      <div className="hero-gradient absolute inset-0 pointer-events-none" />
      <div className="grid-bg absolute inset-0 pointer-events-none opacity-40" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Global Error Toast */}
        <AnimatePresence>
          {error && !isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-between text-sm backdrop-blur-sm"
            >
              <span className="flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-400" />
                {error}
              </span>
              <button onClick={() => setError(null)} className="text-rose-400/60 hover:text-rose-300 transition-colors ms-4">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4"
        >
          <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full w-fit">
                <Shield size={14} className="text-cyan-400" />
                <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                  {lang === 'ar' ? 'نظام تشغيل الاستخبارات V9' : 'Intelligence OS V9'}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full border border-amber-500/20 bg-amber-500/10 w-fit">
                <Scan size={14} className="text-amber-400" />
                <span className="text-xs font-mono text-amber-400 font-bold">
                  {lang === 'ar' ? `الرصيد: ${user?.scanCredits || 0} فحص متبقي` : `Credits: ${user?.scanCredits || 0} Scans Left`}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="text-gradient-cyan">
                {lang === 'ar' ? 'مشاريعك' : 'Your Targets'}
              </span>
            </h1>
          </div>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="btn-primary group"
          >
            <Plus size={14} className="me-2 group-hover:rotate-90 transition-transform duration-300" /> 
            {lang === 'ar' ? 'تهيئة مشروع' : 'INITIALIZE TARGET'}
          </button>
        </motion.div>

        {/* Create Project Panel */}
        <AnimatePresence>
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="glass-panel rounded-2xl p-8 neon-cyan relative">
                <button onClick={() => setIsCreating(false)} className="absolute top-6 end-6 text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
                <h3 className="text-lg font-semibold text-white mb-8 flex items-center gap-2">
                  <Scan size={20} className="text-cyan-400" /> {lang === 'ar' ? 'بروتوكول تهيئة المشروع' : 'Target Initialization Protocol'}
                </h3>
                {error && <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">{error}</div>}
                
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-12"
                    >
                      <ThoughtProcessLoader />
                    </motion.div>
                  ) : (
                    <motion.form 
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleCreateProject} 
                      className="space-y-6 relative z-10"
                    >
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2 font-mono uppercase tracking-widest">{lang === 'ar' ? 'الاسم الرمزي / عنوان المشروع' : 'Codename / Title'}</label>
                        <input 
                          type="text" 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)} 
                          className="glass-input w-full"
                          placeholder={lang === 'ar' ? 'مثال: مشروع أبولو' : 'e.g. Project Apollo'}
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2 font-mono uppercase tracking-widest">{lang === 'ar' ? 'موجز المشروع (التفكير)' : 'Intelligence Brief'}</label>
                        <div className="mt-2">
                          <ThinkingCanvas 
                            value={description}
                            onChange={setDescription}
                            placeholder={lang === 'ar' ? 'صف فكرتك، المشكلة التي تحلها، والجمهور المستهدف...' : 'Describe the startup idea, problem, and target market...'}
                            isSubmitting={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <button type="submit" disabled={description.trim().length < 5} className="btn-primary flex items-center">
                          {lang === 'ar' ? 'إنشاء مشروع' : 'CREATE TARGET'}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl p-6 bento-card spotlight-wrapper flex flex-col h-[280px] relative overflow-hidden group neon-cyan"
            >
              
              <div className="flex-1 relative z-10 flex flex-col">
                <div className="flex justify-between items-start mb-5 gap-2">
                  <div className="flex items-start gap-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">{project.title}</h3>
                    <div className="px-2.5 py-1 glass rounded-md text-[10px] font-mono tracking-widest text-zinc-400 border border-white/10 shrink-0">
                      {project.id.substring(0, 8).toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Delete Button / Confirmation */}
                  <div className="shrink-0 flex items-center">
                    {confirmDeleteId === project.id ? (
                      <div className="flex items-center gap-1 glass p-1 rounded-md border-rose-500/30 bg-rose-500/10">
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={deletingId === project.id}
                          className="p-1 text-rose-400 hover:bg-rose-500/20 rounded transition-colors"
                          title="تأكيد الحذف"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deletingId === project.id}
                          className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
                          title="إلغاء"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDeleteId(project.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 rounded-md hover:bg-white/5"
                        title="حذف المشروع"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                {editingProjectId === project.id ? (
                  <div className="h-full flex flex-col relative z-20 glass absolute inset-0 p-6 rounded-xl border border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-400 mb-3 text-sm font-semibold">
                      <AlertCircle size={16} /> {lang === 'ar' ? 'مطلوب مراجعة المدخلات' : 'REVISION REQUIRED'}
                    </div>
                    {aiValidation?.message && (
                      <p className="text-xs text-zinc-500 mb-3 line-clamp-3">{aiValidation.message}</p>
                    )}
                    <textarea
                      ref={editTextareaRef}
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      className="flex-1 glass-input text-sm p-3 resize-none"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setEditingProjectId(null)} className="btn-secondary px-3 py-1.5 text-xs">
                        {lang === 'ar' ? 'إلغاء' : 'CANCEL'}
                      </button>
                      <button onClick={() => handleSaveEditAndScan(project.id)} disabled={isSavingEdit} className="btn-primary px-4 py-1.5 text-xs">
                        {isSavingEdit ? (lang === 'ar' ? 'جاري الفحص...' : 'PROCESSING...') : (lang === 'ar' ? 'تحديث وفحص' : 'UPDATE & SCAN')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm line-clamp-4 leading-relaxed mb-4 font-sans">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Action Bar */}
              {editingProjectId !== project.id && (
                <div className="pt-4 flex justify-between items-center relative z-10 mt-auto border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-500 num-ltr glass px-2.5 py-1 rounded-full border border-white/10">
                      {project.scans?.length || 0} {lang === 'ar' ? 'فحوصات' : 'SCANS'}
                    </span>
                    {project.scans?.[0]?.score != null && (
                      <span className="text-xs font-mono text-emerald-400 glass px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10">
                        {project.scans[0].score}/100
                      </span>
                    )}
                  </div>
                  
                  {validatingProjectId === project.id ? (
                    <div className="flex items-center text-cyan-400 text-xs font-semibold font-mono animate-pulse">
                      <BrainCircuit size={14} className="me-2 text-cyan-400" /> {lang === 'ar' ? 'جاري التحقق...' : 'VALIDATING...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {project.scans?.length > 0 ? (
                        <Link
                          to={`/scan/${project.scans[0].id}`}
                          className="flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors glow-text-cyan"
                        >
                          <Eye size={16} />
                          {lang === 'ar' ? 'عرض التحليل' : 'VIEW REPORT'}
                        </Link>
                      ) : (
                        <button
                          onClick={() => validateAndTriggerScan(project)}
                          className="flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Play size={14} className="fill-current" />
                          {lang === 'ar' ? 'تشغيل' : 'INITIATE'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          
          {projects.length === 0 && !isCreating && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full py-32 flex flex-col items-center justify-center text-center glass rounded-2xl border-dashed border-2 border-white/10"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 glass rounded-full flex items-center justify-center mb-6 neon-cyan"
              >
                <Target size={32} className="text-cyan-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                {lang === 'ar' ? 'لا توجد مشاريع نشطة' : 'No Active Targets'}
              </h3>
              <p className="text-zinc-500 text-sm mb-8 max-w-md leading-relaxed">
                {lang === 'ar' ? 'قم بتهيئة أول مشروع لك لبدء عمليات التقييم والاستخبارات باستخدام السرب الاستراتيجي.' : 'Initialize your first startup target to deploy the strategic AI swarm for deep intelligence gathering.'}
              </p>
              <button 
                onClick={() => setIsCreating(true)}
                className="btn-neon-cyan px-6 py-3 shadow-lg shadow-cyan-500/20"
              >
                <Plus size={16} className="me-2" /> 
                {lang === 'ar' ? 'تهيئة مشروع جديد' : 'Initialize Target'}
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
