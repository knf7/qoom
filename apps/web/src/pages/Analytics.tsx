import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart3, PieChart, TrendingUp, RefreshCcw, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../utils/i18n';
import { motion } from 'framer-motion';
import { apiClient } from '../utils/apiClient';

export default function Analytics() {
  const navigate = useNavigate();
  const { user, token, projects, setProjects } = useStore();
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      navigate('/auth');
    } else {
      fetchProjects();
    }
  }, [user, token, navigate]);

  const fetchProjects = async () => {
    try {
      const data = await apiClient('/projects');
      setProjects(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed loading analytics data', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin mx-auto mb-6"></div>
          <p className="text-zinc-400 text-sm">{lang === 'ar' ? 'جاري تجميع المؤشرات الإحصائية...' : 'Compiling analytics matrices...'}</p>
        </div>
      </div>
    );
  }

  // Calculate Aggregates
  const totalProjects = projects.length;
  const projectsWithScans = projects.filter(p => p.scans && p.scans.length > 0);
  const totalScans = projectsWithScans.length;
  
  let buildCount = 0;
  let pivotCount = 0;
  let killCount = 0;
  let totalScoreSum = 0;

  projectsWithScans.forEach(p => {
    const scan = p.scans[0];
    const rawDecision = (scan.verdict || scan.decision || '').toUpperCase();
    
    if (rawDecision === 'PASS' || rawDecision.includes('BUILD') || rawDecision.includes('STRONG GO') || rawDecision.includes('GO')) {
      buildCount++;
    } else if (rawDecision === 'FAIL' || rawDecision === 'FAILED' || rawDecision.includes('KILL')) {
      killCount++;
    } else {
      pivotCount++; // default/fallback for PARTIAL, PIVOT, etc.
    }
    
    if (scan.score) totalScoreSum += scan.score;
  });

  const averageScore = totalScans > 0 ? Math.round(totalScoreSum / totalScans) : 0;

  const getDecisionBadge = (decision: string) => {
    const d = (decision || '').toUpperCase();
    if (d === 'BUILD' || d === 'PASS' || d.includes('STRONG GO') || d.includes('GO')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (d === 'KILL' || d === 'FAIL' || d === 'FAILED') {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20'; // default/fallback for PIVOT, PARTIAL, etc.
  };

  const getDecisionText = (decision: string) => {
    const d = (decision || '').toUpperCase();
    if (d === 'BUILD' || d === 'PASS' || d.includes('STRONG GO') || d.includes('GO')) {
      return lang === 'ar' ? 'اعتماد التأسيس (BUILD)' : 'BUILD';
    }
    if (d === 'KILL' || d === 'FAIL' || d === 'FAILED') {
      return lang === 'ar' ? 'إيقاف العمل (KILL)' : 'KILL';
    }
    return lang === 'ar' ? 'تعديل المسار (PIVOT)' : 'PIVOT';
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-950 text-white" dir="rtl">
      {/* Hero Gradient Background */}
      <div className="hero-gradient absolute inset-0 pointer-events-none" />
      <div className="grid-bg absolute inset-0 pointer-events-none opacity-40" />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-12"
        >
          <div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-1 text-white">{t('analytics.title')}</h1>
            <p className="text-sm text-zinc-400">{t('analytics.sub')}</p>
          </div>

          <button
            onClick={fetchProjects}
            className="p-3 glass rounded-xl text-zinc-300 hover:text-white transition-all active:scale-95"
          >
            <RefreshCcw size={16} className="text-zinc-400" />
          </button>
        </motion.div>

        {totalProjects === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-3xl p-12 text-center max-w-xl mx-auto mt-16 neon-cyan"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mx-auto mb-6 border border-cyan-500/20">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">{t('analytics.noDataTitle')}</h3>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">{t('analytics.noDataSub')}</p>
            <Link
              to="/dashboard"
              className="btn-primary px-6 py-3 rounded-xl font-bold"
            >
              {t('analytics.noDataBtn')}
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-10">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {/* Total Projects - Cyan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-2xl p-6 neon-cyan"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <BarChart3 size={18} className="text-cyan-400" />
                  </div>
                </div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">{t('analytics.statTotal')}</div>
                <div className="text-3xl md:text-4xl font-extrabold text-white num-ltr">{totalProjects}</div>
              </motion.div>

              {/* Total Scans - Purple */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-6 neon-purple"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <PieChart size={18} className="text-purple-400" />
                  </div>
                </div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">{t('analytics.statScanned')}</div>
                <div className="text-3xl md:text-4xl font-extrabold text-white num-ltr">{totalScans}</div>
              </motion.div>

              {/* Average Score - Emerald */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-2xl p-6 neon-emerald"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <TrendingUp size={18} className="text-emerald-400" />
                  </div>
                </div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">{t('analytics.statAverage')}</div>
                <div className="text-3xl md:text-4xl font-extrabold glow-text-emerald text-emerald-400 num-ltr">{averageScore}</div>
              </motion.div>

              {/* BUILD Rate - Emerald */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-2xl p-6 neon-emerald"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <BarChart3 size={18} className="text-emerald-400" />
                  </div>
                </div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">{t('analytics.statHealth')}</div>
                <div className="text-3xl md:text-4xl font-extrabold text-emerald-400 glow-text-emerald num-ltr">
                  {totalScans > 0 ? ((buildCount + pivotCount) / totalScans * 100).toFixed(0) : 0}%
                </div>
              </motion.div>
            </div>

            {/* Graphical Distributions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-3xl p-8 md:col-span-2 space-y-6"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <TrendingUp size={18} className="text-cyan-400" />
                  {t('analytics.chartTitle')}
                </h3>

                {totalScans === 0 ? (
                  <p className="text-xs text-zinc-500 py-12 text-center">{lang === 'ar' ? 'سجل وافحص المشاريع لإظهار الإحصائيات المتقدمة.' : 'Run scans on dashboard to compile distributions.'}</p>
                ) : (
                  <div className="space-y-5 py-6">
                    {/* BUILD */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5 font-semibold text-zinc-300">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span>
                          {t('analytics.buildLabel')}
                        </span>
                        <span className="num-ltr font-mono">{buildCount} ({((buildCount / totalScans) * 100).toFixed(0)}%) {lang === 'ar' ? 'فحص' : 'Scans'}</span>
                      </div>
                      <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(buildCount / totalScans) * 100}%` }}
                          transition={{ duration: 1, delay: 0.6 }}
                          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] rounded-full"
                        />
                      </div>
                    </div>

                    {/* PIVOT */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5 font-semibold text-zinc-300">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"></span>
                          {t('analytics.pivotLabel')}
                        </span>
                        <span className="num-ltr font-mono">{pivotCount} ({((pivotCount / totalScans) * 100).toFixed(0)}%) {lang === 'ar' ? 'فحص' : 'Scans'}</span>
                      </div>
                      <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(pivotCount / totalScans) * 100}%` }}
                          transition={{ duration: 1, delay: 0.7 }}
                          className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] rounded-full"
                        />
                      </div>
                    </div>

                    {/* KILL */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5 font-semibold text-zinc-300">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"></span>
                          {t('analytics.killLabel')}
                        </span>
                        <span className="num-ltr font-mono">{killCount} ({((killCount / totalScans) * 100).toFixed(0)}%) {lang === 'ar' ? 'فحص' : 'Scans'}</span>
                      </div>
                      <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(killCount / totalScans) * 100}%` }}
                          transition={{ duration: 1, delay: 0.8 }}
                          className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Quick history log */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-3xl p-8 space-y-6 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
                    <PieChart size={18} className="text-cyan-400" />
                    {t('analytics.recentTitle')}
                  </h3>
                  
                  {projectsWithScans.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-12">{lang === 'ar' ? 'لا توجد سجلات مفحوصة بعد.' : 'No scanned records registered.'}</p>
                  ) : (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pe-1 terminal-scroll">
                      {projectsWithScans.slice(0, 4).map((p) => {
                        const scan = p.scans[0];
                        return (
                          <div key={p.id} className="flex justify-between items-center p-3 rounded-xl glass hover:border-cyan-500/20 transition-colors">
                            <div>
                              <div className="text-xs font-bold text-zinc-200 truncate max-w-[120px]">{p.title}</div>
                              <div className="text-[9px] text-zinc-500 mt-0.5 num-ltr font-mono">
                                {new Date(scan.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDecisionBadge(scan.verdict || scan.decision || 'PARTIAL')}`}>
                                {getDecisionText(scan.verdict || scan.decision || 'PARTIAL')}
                              </span>
                              <button
                                onClick={() => navigate(`/scan/${scan.id}`)}
                                className="p-1.5 glass rounded-md text-zinc-400 hover:text-cyan-400 transition-colors"
                              >
                                <ArrowRight size={12} className="rtl:rotate-180" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
