import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, CheckCircle2, Terminal, Target, Bot, Coins, ArrowLeft, Loader2, Download, Share2, AlertCircle, AlertTriangle, Cpu, HelpCircle, Activity, Compass, Zap, BrainCircuit, XCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../utils/i18n';
import DOMPurify from 'dompurify';
import { useAgentsStore } from '../store/agents.store';
import { apiClient, API_URL } from '../utils/apiClient';
import IdeaBuilderView from '../components/IdeaBuilderView';
export default function ScanResult() {
  const { id: scanId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user, refreshUser } = useStore();
  const { isScanning, scanProgress, initializeSwarm, updateAgentStatus, addTerminalLog, setScanning, setScanProgress, reset, agents, terminalLogs } = useAgentsStore();

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'MarketAgent':
        return <Target className="text-emerald-400 shrink-0" size={20} />;
      case 'CompetitionAgent':
        return <Shield className="text-slate-400 shrink-0" size={20} />;
      case 'MonetizationAgent':
        return <Coins className="text-amber-400 shrink-0" size={20} />;
      case 'FeasibilityAgent':
        return <Terminal className="text-cyan-400 shrink-0" size={20} />;
      case 'RiskAgent':
        return <AlertCircle className="text-rose-400 shrink-0" size={20} />;
      default:
        return <Bot className="text-cyan-400 shrink-0" size={20} />;
    }
  };

  const cleanTitle = (title: string) => {
    if (!title) return '';
    return title.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]\s*/g, '').trim();
  };

  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New state to hold the transition from War Room to Final Report
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [feedbackConfirmed, setFeedbackConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    if (scan?.payload?.problemInference?.confirmed) {
      setFeedbackConfirmed(true);
    }
  }, [scan?.payload?.problemInference?.confirmed]);
  
  // Interactive problem feedback states
  const [feedbackText, setFeedbackText] = useState('');
  const [reSubmitLoading, setReSubmitLoading] = useState(false);
  const [reSubmitError, setReSubmitError] = useState<string | null>(null);

  const handleReSubmitProblem = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setReSubmitLoading(true);
    setReSubmitError(null);
    try {
      const oldDescription = scan.project?.description || scan.payload?.submittedDescription || '';
      
      const newDescription = `
${oldDescription}

=== توضيحات من المستخدم ===
المشكلة الحقيقية: ${feedbackText}
      `.trim();

      await apiClient(`/projects/${projectId}`, {
        method: 'PATCH',
        data: { description: newDescription }
      });

      // Clear the current scan state and show isScanning / loading states
      setScanning(true);
      setShowFinalReport(false);
      setLoading(true);
      
      const newScan = await apiClient('/scan', {
        method: 'POST',
        body: JSON.stringify({ projectId })
      });

      // Refresh page view for the new scan
      navigate(`/scan/${newScan.scanId || newScan.id}`);
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to re-submit problem:', err);
      setReSubmitError(err.message || 'حدث خطأ أثناء إعادة إرسال الفكرة. يرجى المحاولة ثانية.');
      setReSubmitLoading(false);
    }
  };

  const agentNamesAr: Record<string, string> = {
    'MarketAgent': 'دراسة السوق والطلب',
    'CompetitionAgent': 'تحليل المنافسة والبدائل',
    'MonetizationAgent': 'نموذج الإيرادات والربحية',
    'FeasibilityAgent': 'الجدوى الفنية والتقنية',
    'RiskAgent': 'إدارة المخاطر والعقبات'
  };

  const statusLabels: Record<string, { text: string, color: string, bg: string, border: string }> = {
    'FULL': { text: 'تحليل كامل', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'PARTIAL': { text: 'تحليل جزئي', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    'NONE': { text: 'لا يوجد بيانات', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    'ANALYZED': { text: 'تحليل كامل', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'INSUFFICIENT_DATA': { text: 'تحليل جزئي', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    'ERROR': { text: 'فشل التحليل', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  };

  const confidenceLabels: Record<string, string> = {
    'HIGH': 'عالية',
    'MEDIUM': 'متوسطة',
    'LOW': 'منخفضة'
  };

  const getAgentText = (res: any, parsed: any) => {
    if (res.status === 'ERROR' || res.dataAvailability === 'NONE' && res.analysis?.includes('فشل')) return 'فشل في الاتصال بالوكيل';
    return parsed.analysis || res.analysis || '';
  };

  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<any>(null);
  const apiBaseUrl = API_URL;
  const wsBaseUrl = API_URL.replace(/^http/, 'ws') + '/ws';

  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const data = await apiClient(`/scan/${scanId}`);
        setScan(data);
        if (data.status !== 'PENDING' && data.status !== 'PROCESSING') {
          setScanProgress(100);
          setScanning(false);
          setShowFinalReport(true);
          stopPolling();
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error during status poll:', err);
      }
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!user || !token) {
      navigate('/auth');
      return;
    }
    
    setShowFinalReport(false);
    fetchScanSnapshot();
    reset(); 

    return () => {
      if (wsRef.current) wsRef.current.close();
      stopPolling();
      reset();
    };
  }, [scanId, token, user]);

  useEffect(() => {
    // Scan progress is now driven purely by real-time WebSocket events.
    // However, if the scan hangs for more than 3 minutes, show a failure timeout.
    let timeoutId: NodeJS.Timeout;
    if (isScanning && scan && (scan.status === 'PENDING' || scan.status === 'PROCESSING')) {
      timeoutId = setTimeout(() => {
        setError('تعذر إكمال الفحص بسبب ضغط على السيرفر. يرجى إعادة المحاولة لاحقاً.');
        setScanning(false);
        stopPolling();
        if (wsRef.current) {
          wsRef.current.close();
        }
      }, 3 * 60 * 1000); // 3 minutes timeout
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isScanning, scan?.status]);

  const fetchScanSnapshot = async () => {
    try {
      const data = await apiClient(`/scan/${scanId}?t=${Date.now()}`);

      setScan(data);
      setLoading(false);

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('scan_result_viewed', {
          scanId,
          verdict: data.verdict,
          score: data.score
        });
      }

      if (data.status === 'PENDING' || data.status === 'PROCESSING') {
        initializeSwarm();
        initializeWebSocketStream();
      } else {
        stopPolling();
        setScanProgress(100);
        setShowFinalReport(true);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ ما.');
      setLoading(false);
    }
  };

  const initializeWebSocketStream = () => {
    if (wsRef.current) return;
    const socket = new WebSocket(wsBaseUrl);
    wsRef.current = socket;

    const connectionTimeout = setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket handshake timed out, starting fallback poll...');
        startPolling();
      }
    }, 4000);

    socket.onopen = () => {
      clearTimeout(connectionTimeout);
      socket.send(JSON.stringify({ event: 'subscribeScan', data: { scanId, token } }));
    };

    socket.onerror = (err) => {
      clearTimeout(connectionTimeout);
      console.warn('WebSocket connection error, falling back to HTTP polling:', err);
      startPolling();
    };

    socket.onclose = () => {
      clearTimeout(connectionTimeout);
      console.log('WebSocket closed, falling back to HTTP polling.');
      startPolling();
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'subscribed') setScanProgress(5);
        
        const agentMap: Record<string, string> = {
          'MarketAgent': 'market',
          'CompetitionAgent': 'competition',
          'FeasibilityAgent': 'feasibility',
          'RiskAgent': 'risk',
          'MonetizationAgent': 'finance',
          'DebateModeratorAgent': 'validator',
          'IdeaReconstructionAgent': 'orchestrator',
          'ClarityAgent': 'orchestrator',
          'RealityIntelligenceLayer': 'validator',
          'EvidenceBuilder': 'validator',
          'RealityAuditor': 'validator'
        };

        if (payload.event === 'scan:started') {
          setScanProgress(10);
          ['market', 'competition', 'finance', 'feasibility', 'risk'].forEach(id => updateAgentStatus(id, 'THINKING', 'جاري التهيئة...'));
        }
        
        if (payload.event === 'scan:agent_started') {
          const aid = agentMap[payload.payload.agentType];
          if (aid) updateAgentStatus(aid, 'STREAMING', 'جاري تحليل الأنماط...');
        }

        if (payload.event === 'scan.log' || payload.event === 'scan:log') {
          const msg = payload.payload?.message || payload.data?.message;
          if (msg) addTerminalLog(msg);
        }

        if (payload.event === 'scan:agent_completed') {
          const aid = agentMap[payload.payload.agentType];
          if (aid) {
            updateAgentStatus(aid, 'COMPLETED');
            setScanProgress(Math.min(useAgentsStore.getState().scanProgress + 15, 95));
          }
        }
        
        if (payload.event === 'scan:completed') {
          clearTimeout(connectionTimeout);
          stopPolling();
          setScanProgress(100);
          ['market', 'competition', 'finance', 'feasibility', 'risk'].forEach(id => updateAgentStatus(id, 'COMPLETED', 'اكتمل'));
          setScanning(false);
          // Immediately fetch the final result and show the report
          fetchScanSnapshot();
          // Refresh credits in TopNav (deduction happened on server)
          refreshUser();
        }
        if (payload.event === 'scan:failed') {
          clearTimeout(connectionTimeout);
          stopPolling();
          setScanning(false);
          setError('واجه فحص الاستخبارات خطأ حرجاً. يرجى المحاولة مرة أخرى.');
        }
      } catch (err) {}
    };
  };

  const calculateOverallScore = () => {
    if (!scan?.results || scan.results.length === 0) return 0;
    const total = scan.results.reduce((acc: number, r: any) => acc + (r.score || 0), 0);
    return Math.round(total / scan.results.length);
  };

  const getVerdictDetails = (verdictStr: string) => {
    const v = verdictStr?.toUpperCase() || '';
    
    // PASS / BUILD
    if (v === 'PASS' || v.includes('BUILD') || v.includes('STRONG GO') || v.includes('GO')) {
      return { 
        text: 'فكرة عبقرية (ادعم الفكرة)', 
        sub: 'PASS', 
        color: 'text-emerald-400', 
        glow: 'shadow-[0_0_50px_rgba(16,185,129,0.2)]', 
        border: 'border-emerald-500/20' 
      };
    }
    
    // FAIL / KILL
    if (v === 'FAIL' || v.includes('KILL')) {
      return { 
        text: 'تحتاج تعديل جوهري', 
        sub: 'FAIL', 
        color: 'text-rose-400', 
        glow: 'shadow-[0_0_50px_rgba(244,63,94,0.2)]', 
        border: 'border-rose-500/20' 
      };
    }
    
    // PARTIAL / PIVOT
    if (v === 'PARTIAL' || v.includes('PIVOT') || v.includes('IDEA DEVELOPMENT REQUIRED')) {
      return { 
        text: 'فكرة واعدة (تحتاج تطوير)', 
        sub: 'PARTIAL', 
        color: 'text-amber-400', 
        glow: 'shadow-[0_0_50px_rgba(245,158,11,0.2)]', 
        border: 'border-amber-500/20' 
      };
    }
    
    // INTERVIEWING
    if (v === 'INTERVIEWING' || v.includes('INTERVIEW_REQUIRED') || v.includes('INTERVIEW_MODE')) {
      return { 
        text: 'بحاجة لتوضيحات', 
        sub: 'INTERVIEWING', 
        color: 'text-cyan-400', 
        glow: 'shadow-[0_0_50px_rgba(6,182,212,0.2)]', 
        border: 'border-cyan-500/20' 
      };
    }
    
    // RESEARCH_REQUIRED
    if (v === 'RESEARCH_REQUIRED' || v.includes('NEEDS MORE EXPLORATION') || v.includes('VALIDATE FIRST') || v.includes('EARLY STAGE')) {
      return { 
        text: 'بحاجة لأدلة', 
        sub: 'RESEARCH_REQUIRED', 
        color: 'text-violet-400', 
        glow: 'shadow-[0_0_50px_rgba(139,92,246,0.2)]', 
        border: 'border-violet-500/20' 
      };
    }
    
    return { 
      text: 'تحليل أولي', 
      sub: v || 'ANALYSIS', 
      color: 'text-cyan-400', 
      glow: 'shadow-[0_0_50px_rgba(6,182,212,0.2)]', 
      border: 'border-cyan-500/20' 
    };
  };

  const renderCleanText = (text: string) => {
    return { __html: DOMPurify.sanitize(text) };
  };

  // --- UI COMPONENTS ---
  
  const TopTimeline = () => (
    <div className="flex items-center justify-center gap-2 mb-12 select-none">
      <div className="glass px-4 py-1.5 rounded-full border border-white/5 flex items-center gap-2 opacity-50">
        <span className="text-[10px] font-mono text-zinc-500">01</span>
        <span className="text-xs font-bold text-zinc-400">إدخال الفكرة</span>
      </div>
      <div className="w-8 h-px bg-white/10" />
      <div className={`glass px-4 py-1.5 rounded-full flex items-center gap-2 transition-all ${!showFinalReport ? 'border-white/20 text-white' : 'border-white/5 opacity-50 text-zinc-400'}`}>
        <span className={`text-[10px] font-mono ${!showFinalReport ? 'text-cyan-400' : 'text-zinc-500'}`}>02</span>
        <span className="text-xs font-bold">غرفة العمليات</span>
      </div>
      <div className="w-8 h-px bg-white/10" />
      <div className={`glass px-4 py-1.5 rounded-full flex items-center gap-2 transition-all ${showFinalReport ? 'border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-white/5 opacity-50 text-zinc-400'}`}>
        <span className={`text-[10px] font-mono ${showFinalReport ? 'text-cyan-400' : 'text-zinc-500'}`}>03</span>
        <span className="text-xs font-bold">تقرير القرار</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="glass p-8 text-center max-w-md rounded-2xl border-rose-500/20">
          <div className="w-16 h-16 mx-auto bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
            <Shield size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">تعذر التحليل</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Link to="/" className="btn-secondary">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  const isAnalysisComplete = scanProgress === 100 || !isScanning;
  const verdict = getVerdictDetails(scan?.verdict ?? scan?.decision ?? 'PENDING');
  const score = scan?.score !== undefined && scan?.score !== null ? scan.score : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 grid-bg">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        
        <TopTimeline />

        {!showFinalReport ? (
          /* =========================================
             WAR ROOM (غرفة العمليات)
             ========================================= */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 glass px-3 py-1 rounded-md border border-white/5 mb-6 text-[10px] font-mono text-zinc-500 tracking-widest uppercase">
                {scan.id?.split('-')[0] ?? 'SCAN'}
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                {isAnalysisComplete ? 'اكتمل التحليل' : 'جاري تشريح الفكرة'}
              </h1>
              <p className="text-zinc-400 max-w-xl mx-auto">
                {isAnalysisComplete 
                  ? 'تم تجميع جميع المؤشرات. التقرير النهائي جاهز للعرض.'
                  : 'يقوم الوكلاء الخمسة الآن بتحليل وتقييم جوانب الفكرة من منظور مؤسسي...'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-3xl mb-12">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2">
                <span>{scanProgress}%</span>
                <span>التقدم الإجمالي</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
            </div>

            {/* Agent Grid */}
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
              {[
                { id: 'market', name: 'وكيل السوق', role: 'MARKET', icon: Target, border: 'border-emerald-500/30', text: 'text-emerald-400', ring: 'ring-emerald-500/20' },
                { id: 'competition', name: 'وكيل المنافسة', role: 'COMPETITION', icon: Shield, border: 'border-orange-500/30', text: 'text-orange-400', ring: 'ring-orange-500/20' },
                { id: 'finance', name: 'وكيل المالية', role: 'FINANCE', icon: Coins, border: 'border-amber-500/30', text: 'text-amber-400', ring: 'ring-amber-500/20' },
                { id: 'feasibility', name: 'وكيل التقنية', role: 'TECH', icon: Terminal, border: 'border-cyan-500/30', text: 'text-cyan-400', ring: 'ring-cyan-500/20' },
                { id: 'risk', name: 'وكيل المخاطر', role: 'RISK', icon: Shield, border: 'border-rose-500/30', text: 'text-rose-400', ring: 'ring-rose-500/20' }
              ].map((agent, idx) => {
                const isComplete = isAnalysisComplete || agents[agent.id]?.status === 'COMPLETED';
                return (
                  <motion.div 
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`glass rounded-2xl p-6 border ${isComplete ? agent.border : 'border-white/5'} bg-[#111] relative overflow-hidden group transition-all`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-6 h-6 rounded-full border ${isComplete ? agent.border + ' ' + agent.text : 'border-white/10 text-zinc-600'} flex items-center justify-center`}>
                        {isComplete ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-pulse" />}
                      </div>
                      <div className="text-end">
                        <h3 className="text-sm font-bold text-white mb-0.5">{agent.name}</h3>
                        <span className="text-[9px] font-mono tracking-widest text-zinc-500">AGENT . {agent.role}</span>
                      </div>
                      <agent.icon size={16} className={isComplete ? agent.text : 'text-zinc-600'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1 h-1 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-zinc-500 animate-pulse'}`} />
                        <span className="text-[10px] text-zinc-500">{isComplete ? 'مكتمل' : 'قيد العمل'}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed h-8 overflow-hidden">
                        {isComplete ? `تم تشريح ${agent.name.split(' ')[1]} عبر معايير تحليلية.` : (agents[agent.id]?.currentThought || 'يتم مطابقة البيانات ومعالجتها...')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Live Terminal Log */}
            {!isAnalysisComplete && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl bg-black rounded-xl border border-white/10 p-4 mb-16 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">سجل عمليات النظام</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                  </div>
                </div>
                
                <div className="h-40 overflow-y-auto font-mono text-xs flex flex-col gap-1 pr-2 scrollbar-hide" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
                  {terminalLogs.length === 0 ? (
                    <div className="text-zinc-600 animate-pulse">[SYSTEM] جاري تهيئة النظام والوكلاء الذكاء الاصطناعي...</div>
                  ) : (
                    terminalLogs.map((log) => (
                      <div key={log.id} className="flex gap-3 text-zinc-300">
                        <span className="text-zinc-600 shrink-0">
                          {new Date(log.timestamp).toISOString().split('T')[1].substring(0, 12)}
                        </span>
                        <span className={log.message.includes('[SYSTEM]') ? 'text-cyan-400' : log.message.includes('[MODERATOR]') ? 'text-purple-400' : 'text-emerald-400'}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                  {isScanning && (
                    <div className="flex gap-3 text-zinc-500 animate-pulse mt-1">
                      <span className="shrink-0">{new Date().toISOString().split('T')[1].substring(0, 12)}</span>
                      <span>_</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Final CTA (Appears when complete) */}
            <AnimatePresence>
              {isAnalysisComplete && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-4xl glass rounded-2xl p-8 border border-emerald-500/20 bg-emerald-500/5 text-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold mb-4 border border-emerald-500/20">
                    <Sparkles size={12} /> التقرير جاهز
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">الوكلاء وصلوا إلى قرار.</h2>
                  <p className="text-zinc-400 mb-8 max-w-md mx-auto text-sm">
                    تم توحيد ٥ تقارير في حكم نهائي واحد مع QOOM Score وملخصات تنفيذية.
                  </p>
                  <button 
                    onClick={() => setShowFinalReport(true)}
                    className="bg-white hover:bg-zinc-200 text-black rounded-full px-8 py-3 text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-all hover:scale-105"
                  >
                    عرض تقرير القرار <ArrowLeft size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (scan.status === 'INTERVIEW_REQUIRED' || scan.status === 'INTERVIEW_MODE' || scan.status === 'INTERVIEWING') ? (
          /* =========================================
             IDEA BUILDER MODE (فكرة خام)
             ========================================= */
          <IdeaBuilderView scan={scan} projectId={scan.projectId || scan.project?.id || scanId?.split('-')[0]} />
        ) : (scan.status === 'RESEARCH_REQUIRED') ? (
          /* =========================================
             DATA QUALITY REPORT (الحالة الصلبة)
             ========================================= */
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-4"
          >
            <div className="glass max-w-2xl w-full p-8 md:p-12 rounded-[2rem] border border-zinc-500/20 bg-[#111] relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               <div className="absolute top-0 left-0 w-full h-1 bg-zinc-500/20" />
               <div className="w-16 h-16 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-400 mb-6 border border-zinc-500/20">
                 <Shield size={32} />
               </div>
               <div className="text-[10px] text-zinc-500 font-mono tracking-[0.3em] mb-2 uppercase">القرار النهائي</div>
               <h2 className="text-4xl md:text-5xl font-black text-white mb-4">تقرير جودة البيانات</h2>
               <p className="text-zinc-400 text-sm mb-10 leading-relaxed" dangerouslySetInnerHTML={renderCleanText(scan.summary || 'تم رفض التحليل بسبب نقص البيانات الموثوقة أو انخفاض مستوى الثقة بالمعلومات المتوفرة.')} />
               
               <div className="space-y-6">
                 <div className="bg-black/50 border border-white/5 p-6 rounded-2xl">
                   <div className="text-[10px] font-mono text-rose-400 mb-4 tracking-widest uppercase">المتطلبات الأساسية المفقودة</div>
                   <ul className="space-y-3">
                     {scan.payload?.missing_data?.map((m: string, i: number) => (
                       <li key={i} className="text-sm text-zinc-300 flex items-start gap-3">
                         <span className="text-rose-500 mt-0.5">•</span> {m}
                       </li>
                     )) || (
                       <>
                         <li className="text-sm text-zinc-300 flex items-start gap-3"><span className="text-rose-500 mt-0.5">•</span> عدد المصادر غير كافٍ للتقييم الموثوق</li>
                         <li className="text-sm text-zinc-300 flex items-start gap-3"><span className="text-rose-500 mt-0.5">•</span> مستوى الثقة بالبيانات المتوفرة منخفض</li>
                         <li className="text-sm text-zinc-300 flex items-start gap-3"><span className="text-rose-500 mt-0.5">•</span> الأدلة المتاحة عن السوق المستهدف غير كافية</li>
                       </>
                     )}
                   </ul>
                 </div>
                 
                 <div className="bg-cyan-500/5 border border-cyan-500/20 p-6 rounded-2xl">
                   <div className="text-[10px] font-mono text-cyan-400 mb-4 tracking-widest uppercase">المطلوب للاستمرار</div>
                   <ul className="space-y-3">
                     <li className="text-sm text-cyan-100 flex items-start gap-3"><span className="text-cyan-500 mt-0.5">✓</span> إضافة تفاصيل أكثر عن الفكرة والميزة التنافسية</li>
                     <li className="text-sm text-cyan-100 flex items-start gap-3"><span className="text-cyan-500 mt-0.5">✓</span> توفير معلومات إضافية للسوق المستهدف أو نموذج العمل</li>
                     <li className="text-sm text-cyan-100 flex items-start gap-3"><span className="text-cyan-500 mt-0.5">✓</span> توسيع وصف المشكلة والحل المقترح بشكل دقيق</li>
                   </ul>
                 </div>
               </div>

               <div className="mt-10 pt-8 border-t border-white/5 flex gap-4">
                 <button onClick={() => navigate('/')} className="bg-white text-black px-6 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all">
                   <Sparkles size={16} /> مسح فكرة جديدة
                 </button>
               </div>
            </div>
          </motion.div>
        ) : (scan.status === 'FAILED') ? (
          /* =========================================
             FAILED SCAN SCREEN (فشل التحليل)
             ========================================= */
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-4"
          >
            <div className="glass max-w-2xl w-full p-8 md:p-12 rounded-[2rem] border border-rose-500/20 bg-[#111] relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/20" />
               <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-6 border border-rose-500/20">
                 <Shield size={32} className="text-rose-400" />
               </div>
               <div className="text-[10px] text-zinc-500 font-mono tracking-[0.3em] mb-2 uppercase">حالة النظام</div>
               
               {scan.key_reason === 'فكرة غير واضحة' || scan.summary === 'فكرة غير واضحة' || (scan.iraResult && scan.iraResult.status === 'FAIL') ? (
                 <>
                   <h2 className="text-4xl md:text-5xl font-black text-white mb-4">ما فهمت الفكرة</h2>
                   <p className="text-zinc-300 text-sm mb-6 leading-relaxed bg-[#0b0b0b] p-5 rounded-2xl border border-white/5">
                     {scan.iraResult?.reasoning || 'الفكرة المدخلة تفتقر إلى الوضوح الكافي أو النية الريادية لتمكين محرك التحليل من العمل.'}
                   </p>
                   
                   {scan.iraResult?.notes && scan.iraResult.notes.length > 0 && (
                     <div className="mb-6">
                       <div className="text-[10px] font-mono text-zinc-500 mb-2">نقاط تحتاج إلى توضيح:</div>
                       <ul className="space-y-2">
                         {scan.iraResult.notes.map((note: string, idx: number) => (
                           <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                             <span className="text-rose-400 font-bold">•</span>
                             <span>{note}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                   
                   <div className="bg-cyan-500/5 border border-cyan-500/10 p-5 rounded-2xl mb-8 text-right">
                     <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-2">جرب صياغة مثل:</div>
                     <p className="text-xs text-zinc-300 leading-relaxed font-bold">
                       "منصة ذكاء اصطناعي تقدم لرواد الأعمال تحليلات سريعة وتوصيات للشركات الناشئة بالاعتماد على 5 وكلاء ذكاء اصطناعي بنموذج اشتراك شهري."
                     </p>
                   </div>
                 </>
                ) : (
                  <>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">فشل التحليل</h2>
                    <p className="text-zinc-300 text-sm mb-6 leading-relaxed bg-[#0b0b0b] p-5 rounded-2xl border border-white/5">
                      {scan.key_reason || "حدث خطأ غير متوقع أثناء معالجة الفكرة. يرجى إعادة المحاولة."}
                    </p>
                  </>
                )}

                <div className="mt-10 pt-8 border-t border-white/5 flex gap-4">
                  <button onClick={() => navigate("/")} className="bg-white text-black px-6 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all">
                    <Sparkles size={16} /> مسح فكرة جديدة
                  </button>
                </div>
              </div>
            </motion.div>
         ) : (
           /* =========================================
              FINAL REPORT (تقرير القرار الناجح)
              ========================================= */
           (() => {
            const payload = scan?.payload || {};
            const meta = payload.meta || {
              ideaTitle: scan?.project?.title || 'تحليل الفكرة',
              ideaSubtitle: scan?.project?.description || '',
              scanDate: scan?.createdAt ? new Date(scan.createdAt).toISOString().split('T')[0] : '',
              overallStatus: scan?.status || 'PARTIAL_ANALYSIS',
              progressBar: { full: 0, partial: 5, none: 0 }
            };
            const executiveSummary = payload.executiveSummary || {
              verdict: scan?.verdict || 'فكرة واعدة (تحتاج تطوير)',
              verdictColor: scan?.verdict === 'PASS' ? 'emerald' : scan?.verdict === 'FAIL' ? 'rose' : 'amber',
              score: scan?.score,
              confidence: scan?.confidence ? Math.round(scan.confidence * 100) : 45,
              oneLiner: scan?.summary || 'الفكرة واعدة لكنها تحتاج دراسة سوقية وتقنية أعمق.',
              keyInsight: 'التميز المحتمل في الخدمة المقترحة، ولكن المخاطر التشغيلية تتطلب مراجعة.'
            };
             const getAgentsListFallback = (scanData: any) => {
               const pl = scanData?.payload || {};
               if (pl.agents && pl.agents.length > 0) {
                 return pl.agents;
               }
               const results = scanData?.results;
               if (results && Array.isArray(results)) {
                 const list: any[] = [];
                 const agentKeys = ['MarketAgent', 'CompetitionAgent', 'MonetizationAgent', 'FeasibilityAgent', 'RiskAgent'];
                 for (const key of agentKeys) {
                   const agentData = results.find((r: any) => r.agentType === key);
                   if (agentData) {
                     let parsedAnalysis: any = {};
                     try {
                       parsedAnalysis = agentData.analysis ? JSON.parse(agentData.analysis) : {};
                     } catch (e) {}

                     const agentTitleMap: Record<string, string> = {
                       MarketAgent: 'تحليل السوق والطلب',
                       CompetitionAgent: 'المنافسة والميزة التنافسية',
                       MonetizationAgent: 'الجدوى المالية والأرباح',
                       FeasibilityAgent: 'الجدوى التقنية والتنفيذ',
                       RiskAgent: 'المخاطر والتحديات'
                     };

                     list.push({
                       agentId: key,
                       agentName: agentTitleMap[key] || key,
                       status: agentData.status || 'FULL',
                       statusLabel: agentData.status === 'SUCCESS' || agentData.status === 'FULL' ? 'تحليل كامل' : agentData.status === 'FAILED' || agentData.status === 'FAIL' ? 'فشل التحليل' : 'تحليل جزئي',
                       statusColor: agentData.status === 'SUCCESS' || agentData.status === 'FULL' ? 'emerald' : agentData.status === 'FAILED' || agentData.status === 'FAIL' ? 'rose' : 'amber',
                       confidence: parsedAnalysis.confidence || 80,
                       confidenceLabel: (parsedAnalysis.confidence || 80) >= 70 ? 'عالية' : (parsedAnalysis.confidence || 80) >= 40 ? 'متوسطة' : 'منخفضة',
                       score: agentData.score !== undefined ? agentData.score : null,
                       sections: {
                         known: { title: 'ما أعرفه', items: parsedAnalysis.sections?.known?.items || parsedAnalysis.dimensions?.[0]?.evidence || [] },
                         unknown: { title: 'ما لا أعرفه', items: [] },
                         analysis: { title: 'التحليل', content: agentData.recommendation || parsedAnalysis.sections?.analysis?.content || '' },
                         recommendation: { title: 'التوصية', content: agentData.recommendation || parsedAnalysis.sections?.recommendation?.content || '' }
                       },
                       sources: parsedAnalysis.sources || []
                     });
                   }
                 }
                 if (list.length > 0) {
                   return list;
                 }
               }
               return [];
             };
             const agentsList = getAgentsListFallback(scan);
             const validScores = agentsList.filter((a: any) => a.score != null).map((a: any) => a.score);
             const calculatedScore = validScores.length > 0 ? Math.round(validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length) : null;
             executiveSummary.score = executiveSummary.score ?? calculatedScore;
             
             const synthesis = payload.synthesis || {
              title: 'التوليفة الاستراتيجية',
              summary: scan?.recommendation || 'بناءً على آراء الوكلاء...',
              content: scan?.recommendation || 'بناءً على آراء الوكلاء...',
              actionItems: []
            };
            const disclaimer = payload.disclaimer || 'هذا تحليل استشاري من AI. استشير خبير بشري قبل اتخاذ أي قرار مصيري.';

            return (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col text-right"
              >
                {/* Hero Section */}
                <div className="glass rounded-[2rem] p-8 md:p-12 border border-white/15 bg-gradient-to-br from-[#1c1c1c] to-[#121212] relative overflow-hidden mb-10 text-right shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  
                   <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
                     <div className="flex flex-col gap-1">
                       <h1 className="text-3xl md:text-4xl font-black text-white flex items-center justify-start gap-3">
                         <Sparkles className="text-cyan-400 shrink-0" size={28} />
                         <span>{meta.ideaTitle}</span>
                       </h1>
                       <p className="text-zinc-300 text-sm md:text-base mt-2 font-normal leading-relaxed max-w-3xl text-right whitespace-pre-wrap">
                         {meta.ideaSubtitle}
                       </p>
                     </div>
                    
                    <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                        executiveSummary.verdictColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' :
                        executiveSummary.verdictColor === 'rose' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                      }`}>
                        {executiveSummary.verdictColor === 'emerald' ? <CheckCircle2 size={12} className="inline-block ml-1" /> :
                         executiveSummary.verdictColor === 'rose' ? <XCircle size={12} className="inline-block ml-1" /> :
                         <AlertTriangle size={12} className="inline-block ml-1" />}
                        <span>{executiveSummary.verdict}</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{meta.scanDate && `تاريخ الفحص: ${meta.scanDate}`}</span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-white/10 mb-8" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-right">
                    <div className="bg-black/35 p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-300 hover:scale-[1.02]">
                      <span className="text-xs text-zinc-500 mb-1">التقدم الإجمالي للوكلاء</span>
                      <span className="text-lg font-bold text-white mb-2">
                        {meta.progressBar.full + meta.progressBar.partial}/5 وكلاء
                      </span>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                          style={{ width: `${((meta.progressBar.full + meta.progressBar.partial) / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 p-5 rounded-2xl border border-cyan-500/20 flex flex-col justify-between hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.02] shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                      <span className="text-xs text-cyan-400 block mb-1 font-bold">تقييم الابتكار</span>
                      {executiveSummary.score !== null && executiveSummary.score !== undefined ? (
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-4xl font-black text-white">{executiveSummary.score}</span>
                          <span className="text-sm font-bold text-cyan-500">/100</span>
                        </div>
                      ) : (
                        <span className="text-base font-bold text-zinc-400">تحليل استشاري</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <span className="text-zinc-500 text-xs font-bold block mb-1">السطر التعريفي للقرار</span>
                    <p className="text-base md:text-lg text-white font-bold leading-relaxed">
                      "{executiveSummary.oneLiner}"
                    </p>
                    {executiveSummary.keyInsight && (
                      <p className="text-sm text-zinc-400 mt-3 border-t border-white/5 pt-3">
                        <Sparkles size={14} className="text-cyan-400 inline-block ml-1" /> <span className="font-bold">ملاحظة جوهرية:</span> {executiveSummary.keyInsight}
                      </p>
                    )}
                  </div>
                </div>

                {/* Problem Inference Section */}
                {payload.problemInference && (
                  <div className="glass rounded-[2rem] p-6 md:p-8 border border-white/10 bg-[#111] relative overflow-hidden mb-10 text-right" dir="rtl">
                    <div className="flex flex-col gap-6">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                          payload.problemInference.status === 'EXPLICIT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          payload.problemInference.status === 'INFERRED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {payload.problemInference.status === 'EXPLICIT' ? <CheckCircle2 size={12} className="shrink-0" /> :
                           payload.problemInference.status === 'INFERRED' ? <AlertTriangle size={12} className="shrink-0" /> :
                           <HelpCircle size={12} className="shrink-0" />}
                          <span>
                            {payload.problemInference.status === 'EXPLICIT' ? 'مذكورة صراحة' :
                             payload.problemInference.status === 'INFERRED' ? 'مستنتجة — المستخدم لم يذكرها صراحة' :
                             'غير واضحة — ما فهمت المشكلة'}
                          </span>
                        </span>
                        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                          <Compass size={22} className="text-cyan-400 shrink-0" />
                          <span>تحليل المشكلة المستنتجة</span>
                        </h2>
                      </div>

                      {payload.problemInference.status === 'EXPLICIT' && (
                        <div className="bg-[#0b0b0b] p-5 rounded-2xl border border-white/5">
                          <span className="text-zinc-500 text-xs font-bold block mb-1">المشكلة المذكورة صراحة</span>
                          <p className="text-sm text-white leading-relaxed font-bold">
                            "{payload.problemInference.originalText || payload.refinedIdea?.problem}"
                          </p>
                        </div>
                      )}

                      {payload.problemInference.status === 'INFERRED' && (
                        <div className="space-y-4">
                          <div className="bg-[#0b0b0b] p-5 rounded-2xl border border-white/5">
                            <span className="text-zinc-500 text-xs font-bold block mb-1">المشكلة المستنتجة</span>
                            <p className="text-base text-amber-400 font-bold leading-relaxed">
                              "{payload.problemInference.inferredProblem}"
                            </p>
                            {payload.problemInference.reasoning && (
                              <p className="text-xs text-zinc-400 mt-3 border-t border-white/5 pt-3">
                                <HelpCircle size={14} className="text-amber-500 inline-block ml-1" /> <span className="font-bold">سبب الاستنتاج:</span> {payload.problemInference.reasoning}
                              </p>
                            )}
                          </div>

                          {/* Interaction logic */}
                          <div className="min-h-[160px] flex flex-col justify-center">
                            {feedbackConfirmed === null ? (
                              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 p-5 rounded-2xl border border-white/10" dir="rtl">
                                <span className="text-sm text-zinc-300 font-bold text-right w-full md:w-auto">هل المشكلة المستنتجة صحيحة وتطابق نيتك؟</span>
                                <div className="flex gap-3">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await apiClient(`/scan/${scanId}/problem-inference`, { method: 'PATCH' });
                                        setFeedbackConfirmed(true);
                                      } catch (err: any) {
                                        console.error('Failed to confirm problem inference:', err);
                                        setFeedbackConfirmed(true);
                                      }
                                    }}
                                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-full transition-all hover:scale-105"
                                  >
                                    نعم صح
                                  </button>
                                  <button
                                    onClick={() => setFeedbackConfirmed(false)}
                                    className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-full transition-all hover:scale-105"
                                  >
                                    لا خطأ
                                  </button>
                                </div>
                              </div>
                          ) : feedbackConfirmed === true ? (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl text-center">
                              شكرًا لتأكيدك! المشكلة المستنتجة صحيحة.
                            </div>
                            ) : (
                              <form onSubmit={(e) => handleReSubmitProblem(e, scan.projectId)} className="space-y-3 bg-[#150e0f] p-5 rounded-2xl border border-rose-500/15">
                                <label className="text-xs text-rose-300 font-bold block">
                                  ما هي المشكلة الفعلية التي تسعى لحلها بمشروعك؟
                                </label>
                                <textarea
                                  value={feedbackText}
                                  onChange={(e) => setFeedbackText(e.target.value)}
                                  placeholder="اكتب المشكلة الصحيحة بالتفصيل هنا..."
                                  className="w-full h-20 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all resize-none mt-2"
                                  required
                                  dir="rtl"
                                />
                                {reSubmitError && (
                                  <div className="text-xs text-rose-400 p-2 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                                    {reSubmitError}
                                  </div>
                                )}
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => setFeedbackConfirmed(null)}
                                    className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl hover:bg-zinc-700"
                                  >
                                    إلغاء
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={reSubmitLoading || !feedbackText.trim()}
                                    className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-50"
                                  >
                                    {reSubmitLoading && <Loader2 size={12} className="animate-spin" />}
                                    تعديل المشكلة وإعادة الفحص
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        </div>
                      )}

                      {payload.problemInference.status === 'UNCLEAR' && (
                        <div className="space-y-4">
                          <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10">
                            <p className="text-sm text-rose-300 font-bold leading-relaxed">
                              {payload.problemInference.note || 'لم نتمكن من تحديد المشكلة بوضوح من الإدخال الحالي.'}
                            </p>
                          </div>

                          <form onSubmit={(e) => handleReSubmitProblem(e, scan.projectId)} className="space-y-3 bg-[#150e0f] p-5 rounded-2xl border border-rose-500/15">
                            <label className="text-xs text-rose-300 font-bold block">
                              يرجى الإجابة عن السؤال لتصحيح الفحص:
                            </label>
                            <textarea
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              placeholder="اكتب ردك أو المشكلة هنا..."
                              className="w-full h-20 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all resize-none mt-2"
                              required
                              dir="rtl"
                            />
                            {reSubmitError && (
                              <div className="text-xs text-rose-400 p-2 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                                {reSubmitError}
                              </div>
                            )}
                            <button
                              type="submit"
                              disabled={reSubmitLoading || !feedbackText.trim()}
                              className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {reSubmitLoading && <Loader2 size={12} className="animate-spin" />}
                              تحديث الفكرة وتوضيح المشكلة
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Refined Idea Section */}
                {payload.refinedIdea && (
                  <div className="glass rounded-[2rem] p-6 md:p-8 border border-white/10 bg-[#111] relative overflow-hidden mb-10 text-right" dir="rtl">
                    <h2 className="text-xl md:text-2xl font-black text-white mb-6 flex items-center justify-start gap-2.5">
                      <Sparkles size={22} className="text-cyan-400 shrink-0" />
                      <span>الفكرة المُصقلة</span>
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/35 p-4 rounded-xl border border-white/5">
                        <span className="text-xs text-zinc-500 flex items-center justify-start gap-1.5 mb-1">
                          <Sparkles size={12} className="text-cyan-400" />
                          <span>الحل المقترح</span>
                        </span>
                        <p className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed">
                          {payload.refinedIdea.solution}
                        </p>
                      </div>

                      <div className="bg-black/35 p-4 rounded-xl border border-white/5">
                        <span className="text-xs text-zinc-500 flex items-center justify-start gap-1.5 mb-1">
                          <Target size={12} className="text-emerald-400" />
                          <span>الجمهور المستهدف</span>
                        </span>
                        <p className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed">
                          {payload.refinedIdea.targetAudience}
                        </p>
                      </div>

                      <div className="bg-black/35 p-4 rounded-xl border border-white/5">
                        <span className="text-xs text-zinc-500 flex items-center justify-start gap-1.5 mb-1">
                          <Coins size={12} className="text-amber-400" />
                          <span>نموذج العمل المالي</span>
                        </span>
                        <p className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed">
                          {payload.refinedIdea.businessModel}
                        </p>
                      </div>

                      <div className="bg-black/35 p-4 rounded-xl border border-white/5">
                        <span className="text-xs text-zinc-500 flex items-center justify-start gap-1.5 mb-1">
                          <Zap size={12} className="text-purple-400" />
                          <span>الميزة التنافسية</span>
                        </span>
                        <p className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed">
                          {payload.refinedIdea.uniqueEdge}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Agents Grid Title */}
                <div className="mb-6 text-right">
                  <h2 className="text-2xl font-black text-white">آراء وكلاء الذكاء الاصطناعي</h2>
                  <p className="text-zinc-500 text-xs mt-1">تحليل مستقل ومفصل لكل محور من محاور الفكرة</p>
                </div>

                {/* Agent Cards */}
                <div className="grid grid-cols-1 gap-6 mb-12">
                  {agentsList.map((agent: any, idx: number) => {
                    const statusColors: Record<string, string> = {
                      emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    };
                    const colorClass = statusColors[agent.statusColor || 'amber'] || 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                    return (
                      <div
                        key={agent.agentId || idx}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both glass rounded-[2rem] p-6 md:p-8 border border-white/10 bg-[#111] relative overflow-hidden flex flex-col gap-6 text-right hover:border-white/30 hover:-translate-y-1 transition-all shadow-lg hover:shadow-cyan-500/10"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                              {getAgentIcon(agent.agentId)}
                              <span>{agentNamesAr[agent.agentId] || agent.agentName}</span>
                            </h3>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          {agent.sections?.analysis?.content && (
                            <div>
                              <div className="font-bold text-cyan-400 text-sm mb-2 flex items-center justify-start gap-1.5">
                                <Sparkles size={16} className="text-cyan-400" />
                                <span>{cleanTitle(agent.sections.analysis.title) || 'التحليل'}</span>
                              </div>
                              <p className="text-xs md:text-sm text-cyan-50 leading-relaxed bg-cyan-500/10 p-5 rounded-2xl border border-cyan-500/20 whitespace-pre-wrap shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                                {agent.sections.analysis.content}
                              </p>
                            </div>
                          )}

                          {agent.sections?.recommendation?.content && (
                            <div className="pt-4 mt-4 border-t border-white/5">
                              <div className="font-bold text-emerald-400 text-sm mb-2 flex items-center justify-start gap-1.5">
                                <Zap size={16} className="text-emerald-400" />
                                <span>{cleanTitle(agent.sections.recommendation.title) || 'التوصية'}</span>
                              </div>
                              <p className="text-xs md:text-sm text-emerald-50 font-bold leading-relaxed bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                                {agent.sections.recommendation.content}
                              </p>
                            </div>
                          )}

                          {agent.sections?.known?.items?.length > 0 && (
                            <div className="pt-4 border-t border-white/5">
                              <div className="font-bold text-zinc-200 text-sm mb-2 flex items-center justify-start gap-2">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                <span>{cleanTitle(agent.sections.known.title) || 'ما أعرفه'}</span>
                                <span className="text-zinc-500 font-mono text-xs mr-1">({agent.sections.known.items.length})</span>
                              </div>
                              <ul className="space-y-2 text-right" dir="rtl">
                                {agent.sections.known.items.map((item: string, i: number) => (
                                  <li key={i} className="text-xs md:text-sm text-zinc-400 flex items-start gap-2 justify-start text-right">
                                    <span className="text-emerald-500 font-bold mt-1 text-base leading-none">•</span>
                                    <span className="leading-relaxed flex-1">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {agent.sections?.unknown?.items?.length > 0 && (
                            <div className="pt-4 border-t border-white/5">
                              <div className="font-bold text-zinc-200 text-sm mb-2 flex items-center justify-start gap-2">
                                <HelpCircle size={14} className="text-amber-400" />
                                <span>{cleanTitle(agent.sections.unknown.title) || 'ما لا أعرفه'}</span>
                                <span className="text-zinc-500 font-mono text-xs mr-1">({agent.sections.unknown.items.length})</span>
                              </div>
                              <ul className="space-y-2 text-right" dir="rtl">
                                {agent.sections.unknown.items.map((item: string, i: number) => (
                                  <li key={i} className="text-xs md:text-sm text-zinc-400 flex items-start gap-2 justify-start text-right">
                                    <span className="text-amber-500 font-bold mt-1 text-base leading-none">•</span>
                                    <span className="leading-relaxed flex-1">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="text-xs text-zinc-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 inline-block">
                            <span className="text-zinc-500 font-bold ml-1">مستوى ثقة الوكيل:</span> 
                            <span className={`font-bold ${
                              agent.confidenceColor === 'green' ? 'text-emerald-400' :
                              agent.confidenceColor === 'amber' ? 'text-amber-400' :
                              'text-rose-400'
                            }`}>{agent.confidence}% ({agent.confidenceLabel || (agent.confidence >= 70 ? 'عالية' : agent.confidence >= 40 ? 'متوسطة' : 'منخفضة')})</span>
                          </div>

                        {agent.sources?.length > 0 && (
                          <div>
                            <div className="text-xs text-zinc-500 mb-2 flex items-center justify-start gap-1.5">
                              <HelpCircle size={12} />
                              <span>المصادر والمراجع</span>
                            </div>
                            <div className="flex flex-row-reverse flex-wrap gap-2">
                              {agent.sources.map((src: any, sIdx: number) => {
                                const tierColors: Record<string, string> = {
                                  A: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                  B: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                  C: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                };
                                const badgeClass = tierColors[src.tier || 'B'] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
                                return (
                                  <span
                                    key={sIdx}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${badgeClass}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${src.tier === 'A' ? 'bg-emerald-400' : src.tier === 'B' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                                    <span>{src.name}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Scarcity & Existence Audit Section */}
                {scan?.payload?.realityEvidence && (
                  <div className="glass rounded-[2rem] p-8 border border-white/10 bg-[#111] relative overflow-hidden mb-10 text-right">
                    {/* Top edge neon accent */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>

                    <h2 className="text-2xl font-black text-white mb-6 flex items-center justify-end gap-2.5">
                      <Compass size={22} className="text-cyan-400 shrink-0" />
                      <span>تحليل ندرة الفكرة والتحقق من الوجود في السوق</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* Authenticity / Novelty Gauge */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-zinc-500 font-mono tracking-wider mb-2 uppercase">درجة الابتكار والأصالة</span>
                        <div className="text-3xl font-extrabold text-emerald-400 glow-text-emerald num-ltr">
                          {scan.payload.realityEvidence.novelty_score ?? 70}%
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1">مدى تميز وجدة الفكرة</span>
                      </div>

                      {/* Saturation / Market Existence Gauge */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-zinc-500 font-mono tracking-wider mb-2 uppercase">مستوى تشبع وتكرار السوق</span>
                        <div className="text-3xl font-extrabold text-amber-400 glow-text-amber num-ltr">
                          {scan.payload.realityEvidence.saturation_score ?? 30}%
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1">كثافة المنافسين والمشاريع المشابهة</span>
                      </div>

                      {/* Verdict Indicator */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-zinc-500 font-mono tracking-wider mb-2 uppercase">قرار أصالة الفكرة</span>
                        <div className={`text-base font-bold px-3 py-1.5 rounded-full border mt-1 ${
                          scan.payload.auditResult?.verdict === 'AUTHENTIC' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          scan.payload.auditResult?.verdict === 'CLONE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {scan.payload.auditResult?.verdict === 'AUTHENTIC' ? 'فكرة أصيلة ومبتكرة' :
                           scan.payload.auditResult?.verdict === 'CLONE' ? 'مشروع مكرر بالكامل' :
                           scan.payload.auditResult?.verdict === 'WRAPPER_STARTUP' ? 'غلاف تقني بسيط (Wrapper)' :
                           scan.payload.auditResult?.verdict === 'BUZZWORD_ABUSE' ? 'حشو مصطلحات تقنية' :
                           'تحتاج لإعادة دراسة'}
                        </div>
                        <span className="text-[9px] text-zinc-500 mt-2 text-center leading-relaxed">
                          {scan.payload.auditResult?.audit_note || 'تمت مقارنة الفكرة بالإنترنت بنجاح.'}
                        </span>
                      </div>
                    </div>

                    {/* Similar Starts & Repos */}
                    {((scan.payload.auditResult?.clone_indicators?.length > 0) || (scan.payload.realityEvidence?.top_competitors?.length > 0)) && (
                      <div className="bg-rose-950/10 border border-rose-500/10 p-6 rounded-2xl mb-6">
                        <div className="text-xs text-rose-400 font-bold mb-3 flex items-center justify-end gap-1.5">
                          <span>المشاريع أو المصادر المشابهة التي تم العثور عليها بالإنترنت:</span>
                          <AlertTriangle size={14} />
                        </div>
                        <div className="flex flex-row-reverse flex-wrap gap-2">
                          {[...(scan.payload.auditResult?.clone_indicators || []), ...(scan.payload.realityEvidence?.top_competitors || [])]
                            .filter((item, index, self) => self.indexOf(item) === index && item)
                            .map((name: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/5 text-rose-400 border border-rose-500/10"
                              >
                                {name}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Differentiation Analysis */}
                    {scan.payload.auditResult?.differentiation_analysis && (
                      <div className="bg-black/30 p-6 rounded-2xl border border-white/5">
                        <div className="text-xs text-zinc-400 font-bold mb-3 flex items-center justify-end gap-1.5">
                          <span>تحليل التميز والندرة للفكرة:</span>
                          <Sparkles size={14} className="text-cyan-400" />
                        </div>
                        <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                          {scan.payload.auditResult.differentiation_analysis}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Synthesis Section */}
                <div className="glass rounded-[2rem] p-8 border border-white/10 bg-[#111] relative overflow-hidden mb-10 text-right" dir="rtl">
                  <h2 className="text-2xl font-black text-white mb-6 flex items-center justify-start gap-2.5">
                    <BrainCircuit size={22} className="text-cyan-400 shrink-0" />
                    <span>{cleanTitle(synthesis.title) || 'التوليفة الاستراتيجية'}</span>
                  </h2>
                  <div 
                    className="text-zinc-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap mb-8 bg-black/30 p-6 rounded-2xl border border-white/5"
                    dangerouslySetInnerHTML={{ __html: synthesis.summary || synthesis.content }}
                  />
                  
                  <div className="w-full h-px bg-white/10 mb-8" />
                  
                  <div className="space-y-6">
                    {synthesis.actionItems?.some((item: any) => item.priority === 'HIGH') && (
                      <div>
                        <div className="flex items-center justify-start gap-2 text-rose-400 font-bold mb-3 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                          <span>أولوية عالية</span>
                        </div>
                        <ul className="space-y-2 pr-4 text-right" dir="rtl">
                          {synthesis.actionItems
                            .filter((item: any) => item.priority === 'HIGH')
                            .map((item: any, i: number) => (
                              <li key={i} className="text-xs md:text-sm text-zinc-300 flex items-start gap-2 justify-start text-right">
                                <span className="text-rose-500 font-bold mt-1 text-base leading-none">•</span>
                                <span className="leading-relaxed flex-1">{item.text}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {synthesis.actionItems?.some((item: any) => item.priority === 'MEDIUM') && (
                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-start gap-2 text-amber-400 font-bold mb-3 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span>أولوية متوسطة</span>
                        </div>
                        <ul className="space-y-2 pr-4 text-right" dir="rtl">
                          {synthesis.actionItems
                            .filter((item: any) => item.priority === 'MEDIUM')
                            .map((item: any, i: number) => (
                              <li key={i} className="text-xs md:text-sm text-zinc-300 flex items-start gap-2 justify-start text-right">
                                <span className="text-amber-500 font-bold mt-1 text-base leading-none">•</span>
                                <span className="leading-relaxed flex-1">{item.text}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {synthesis.actionItems?.some((item: any) => item.priority === 'LOW') && (
                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-end gap-2 text-emerald-400 font-bold mb-3 text-sm">
                          <span>أولوية منخفضة</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <ul className="space-y-2 pr-4 text-right" dir="rtl">
                          {synthesis.actionItems
                            .filter((item: any) => item.priority === 'LOW')
                            .map((item: any, i: number) => (
                              <li key={i} className="text-xs md:text-sm text-zinc-300 flex items-start gap-2 justify-start text-right">
                                <span className="text-emerald-500 font-bold mt-1 text-base leading-none">•</span>
                                <span className="leading-relaxed flex-1">{item.text}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer disclaimer */}
                <div className="glass rounded-2xl p-5 border border-rose-500/20 bg-[#150a0b] text-center mb-12 flex items-center justify-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-rose-400" />
                  <span className="text-rose-400 font-bold text-xs md:text-sm leading-relaxed">
                    {disclaimer}
                  </span>
                </div>

                {/* Bottom New Idea CTA */}
                <div className="flex flex-col items-center justify-center pt-8 pb-8">
                  <span className="text-xs text-zinc-500 mb-4">هل تريد استكشاف اتجاه آخر أو فكرة جديدة؟</span>
                  <button 
                    onClick={() => navigate('/')} 
                    className="bg-white hover:bg-zinc-200 text-black px-8 py-3 rounded-full text-sm font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                  >
                    <Sparkles size={16} /> مسح فكرة جديدة
                  </button>
                </div>
              </motion.div>
            );
          })()
        )}
      </main>
    </div>
  );
}