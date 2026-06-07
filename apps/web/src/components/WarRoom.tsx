import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Network, Shield, Cpu, Target, ShieldAlert, CheckCircle2, TrendingUp, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Home, HelpCircle, MessageSquare } from 'lucide-react';
import { useI18n } from '../utils/i18n';
import DOMPurify from 'dompurify';
import { sanitizeUILanguage } from '../utils/languageSanitizer';

interface ScanResultDetail {
  agentType: string;
  score: number;
  opportunities: string[];
  risks: string[];
  recommendation: string;
}

interface ScanPayload {
  id: string;
  decision: 'BUILD' | 'PIVOT' | 'KILL';
  score: number;
  confidence: number;
  summary: string;
  recommendation: string;
  results: ScanResultDetail[];
}

interface WarRoomProps {
  scan: ScanPayload;
  onReplay?: () => void;
  onBackToDashboard?: () => void;
}

export default function WarRoom({ scan, onReplay, onBackToDashboard }: WarRoomProps) {
  const { t, lang } = useI18n();
  const [selectedAgent, setSelectedAgent] = useState<string>('ValidationAgent');
  const [activeTab, setActiveTab] = useState<'opps' | 'risks'>('opps');
  const [activePillar, setActivePillar] = useState<'problem' | 'user' | 'model'>('problem');

  // Generate dynamic interactive panel chats from actual AI scan results
  const getDynamicChatText = (agentId: string, type: 'opps' | 'risks' | 'rec', fallbackAr: string, fallbackEn: string) => {
    const result = scan?.results?.find((r) => r.agentType === agentId);
    if (!result) return lang === 'ar' ? fallbackAr : fallbackEn;
    
    let text = '';
    if (type === 'opps' && result.opportunities?.length > 0) text = result.opportunities[0];
    else if (type === 'risks' && result.risks?.length > 0) text = result.risks[0];
    else if (type === 'rec' && result.recommendation) text = result.recommendation;
    
    // Fallback if data is missing
    if (!text || text.trim() === '') text = lang === 'ar' ? fallbackAr : fallbackEn;
    return text;
  };

  const pillarChats = {
    problem: [
      {
        agent: 'ValidationAgent',
        textAr: getDynamicChatText('ValidationAgent', 'opps', 'الفكرة تعالج فجوة حقيقية يواجهها المستخدمون يومياً في السوق المحلي!', 'The idea addresses a real gap that users face daily in the local market!'),
        textEn: getDynamicChatText('ValidationAgent', 'opps', 'الفكرة تعالج فجوة حقيقية يواجهها المستخدمون يومياً في السوق المحلي!', 'The idea addresses a real gap that users face daily in the local market!')
      },
      {
        agent: 'CompetitionAgent',
        textAr: getDynamicChatText('CompetitionAgent', 'risks', 'يجب فحص حدة المنافسة بدقة لضمان التفوق.', 'We must rigorously examine competition density to ensure superiority.'),
        textEn: getDynamicChatText('CompetitionAgent', 'risks', 'يجب فحص حدة المنافسة بدقة لضمان التفوق.', 'We must rigorously examine competition density to ensure superiority.')
      }
    ],
    user: [
      {
        agent: 'MarketAgent',
        textAr: getDynamicChatText('MarketAgent', 'opps', 'حجم السوق المستهدف ينمو بمعدلات ممتازة!', 'The target market size is growing at excellent rates!'),
        textEn: getDynamicChatText('MarketAgent', 'opps', 'حجم السوق المستهدف ينمو بمعدلات ممتازة!', 'The target market size is growing at excellent rates!')
      },
      {
        agent: 'ValidationAgent',
        textAr: getDynamicChatText('ValidationAgent', 'rec', 'الجمهور المستهدف لديه قدرة عالية على التبني الرقمي.', 'The target audience shows very high digital adoption capability.'),
        textEn: getDynamicChatText('ValidationAgent', 'rec', 'الجمهور المستهدف لديه قدرة عالية على التبني الرقمي.', 'The target audience shows very high digital adoption capability.')
      }
    ],
    model: [
      {
        agent: 'FeasibilityAgent',
        textAr: getDynamicChatText('FeasibilityAgent', 'rec', 'النموذج التقني قابل للبناء والتشغيل التدريجي.', 'The technical model is highly feasible to build as a lean MVP.'),
        textEn: getDynamicChatText('FeasibilityAgent', 'rec', 'النموذج التقني قابل للبناء والتشغيل التدريجي.', 'The technical model is highly feasible to build as a lean MVP.')
      },
      {
        agent: 'MonetizationAgent',
        textAr: getDynamicChatText('MonetizationAgent', 'opps', 'هذا النموذج يضمن هوامش ربح مرتفعة ونموذج مستدام.', 'This ensures high gross margins and a stable recurring model.'),
        textEn: getDynamicChatText('MonetizationAgent', 'opps', 'هذا النموذج يضمن هوامش ربح مرتفعة ونموذج مستدام.', 'This ensures high gross margins and a stable recurring model.')
      }
    ]
  };

  // Agent intelligence nodes mapping
  const agentsMap = [
    {
      id: 'ValidationAgent',
      nameKey: 'landing.agents.ValidationAgent.name',
      role: 'The Validator',
      roleAr: 'المحقق المتعاطف',
      Icon: Shield,
      hue: '#F59E0B',
      bgColor: 'bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'MarketAgent',
      nameKey: 'landing.agents.MarketAgent.name',
      role: 'The Researcher',
      roleAr: 'الباحث السريع',
      Icon: Network,
      hue: '#06B6D4',
      bgColor: 'bg-cyan-500/10 border-cyan-500/30'
    },
    {
      id: 'CompetitionAgent',
      nameKey: 'landing.agents.CompetitionAgent.name',
      role: 'The Auditor',
      roleAr: 'المدقق الصارم',
      Icon: Target,
      hue: '#64748B',
      bgColor: 'bg-slate-500/10 border-slate-500/30'
    },
    {
      id: 'FeasibilityAgent',
      nameKey: 'landing.agents.FeasibilityAgent.name',
      role: 'The Tech Scout',
      roleAr: 'المكتشف التقني',
      Icon: Cpu,
      hue: '#8B5CF6',
      bgColor: 'bg-purple-500/10 border-purple-500/30'
    },
    {
      id: 'MonetizationAgent',
      nameKey: 'landing.agents.MonetizationAgent.name',
      role: 'The Commander',
      roleAr: 'القائد التكتيكي',
      Icon: Activity,
      hue: '#10B981',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30'
    }
  ];

  const activeAgentConfig = agentsMap.find((a) => a.id === selectedAgent) || agentsMap[0];
  const activeResult = scan.results?.find((r) => r.agentType === selectedAgent);

  // Stepper functions
  const handleNextAgent = () => {
    const currentIndex = agentsMap.findIndex((a) => a.id === selectedAgent);
    const nextIndex = (currentIndex + 1) % agentsMap.length;
    setSelectedAgent(agentsMap[nextIndex].id);
  };

  const handlePrevAgent = () => {
    const currentIndex = agentsMap.findIndex((a) => a.id === selectedAgent);
    const prevIndex = (currentIndex - 1 + agentsMap.length) % agentsMap.length;
    setSelectedAgent(agentsMap[prevIndex].id);
  };

  // Safe cleaner renderer
  const renderCleanText = (text: string) => {
    const sanitized = sanitizeUILanguage(text || '', lang);
    return { __html: DOMPurify.sanitize(sanitized) };
  };

  const getDecisionTheme = (decision: string) => {
    switch (decision) {
      case 'BUILD':
        return {
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-500/[0.02]',
          shadow: 'shadow-[0_0_50px_rgba(16,185,129,0.15)]',
          glow: '#10B981',
          characterGlow: 'drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]'
        };
      case 'PIVOT':
        return {
          text: 'text-orange-400',
          border: 'border-orange-500/30',
          bg: 'bg-orange-500/[0.02]',
          shadow: 'shadow-[0_0_50px_rgba(249,115,22,0.15)]',
          glow: '#f97316',
          characterGlow: 'drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]'
        };
      case 'KILL':
        return {
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          bg: 'bg-rose-500/[0.02]',
          shadow: 'shadow-[0_0_50px_rgba(244,63,94,0.15)]',
          glow: '#f43f5e',
          characterGlow: 'drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]'
        };
      default:
        return {
          text: 'text-primaryGlow',
          border: 'border-cardBorder',
          bg: 'bg-cardBg',
          shadow: 'shadow-none',
          glow: '#10B981',
          characterGlow: ''
        };
    }
  };

  const decisionTheme = getDecisionTheme(scan.decision);

  return (
    <div className="space-y-8 select-none">
      
      {/* Verdict / Result Stage */}
      <div className={`bento-panel spotlight-wrapper p-6 md:p-10 relative overflow-hidden border ${decisionTheme.border} ${decisionTheme.bg} ${decisionTheme.shadow}`}>
        {/* Navigation / Action bars */}
        <div className="absolute top-6 right-6 z-10 flex gap-2">
          {onReplay && (
            <button
              onClick={onReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-cardBorder/30 text-slate-300 text-[10px] font-bold rounded-lg transition-all font-mono"
            >
              <RefreshCw size={11} className="text-primaryGlow animate-spin-fast" />
              {lang === 'ar' ? 'إعادة الفحص السينمائي' : 'REPLAY CINEMATIC RUN'}
            </button>
          )}
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-cardBorder/30 text-slate-300 text-[10px] font-bold rounded-lg transition-all font-mono"
            >
              <Home size={11} className="text-primaryGlow" />
              {lang === 'ar' ? 'الرئيسية' : 'DASHBOARD'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Semicircular Reactor Gauge Meter */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="relative w-48 h-24 flex items-center justify-center overflow-visible">
              <svg className="absolute bottom-0 w-44 h-22 overflow-visible" viewBox="0 0 100 50">
                {/* Arc tracks */}
                <path d="M 10 45 A 35 35 0 0 1 90 45" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="10" strokeLinecap="round" />
                <path d="M 10 45 A 35 35 0 0 1 35 22.5" fill="none" stroke="#f43f5e" strokeWidth="8" opacity="0.3" />
                <path d="M 35 22.5 A 35 35 0 0 1 65 22.5" fill="none" stroke="#f97316" strokeWidth="8" opacity="0.3" />
                <path d="M 65 22.5 A 35 35 0 0 1 90 45" fill="none" stroke="#10B981" strokeWidth="8" opacity="0.3" />
                
                {/* Pointer needle */}
                {(() => {
                  const angle = 180 - (scan.score / 100) * 180;
                  return (
                    <g transform="translate(50, 45)">
                      <motion.line 
                        x1="0" 
                        y1="0" 
                        x2="-36" 
                        y2="0" 
                        stroke={decisionTheme.glow} 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        animate={{ rotate: angle }}
                        transition={{ type: "spring", stiffness: 60, damping: 15 }}
                      />
                      <circle cx="0" cy="0" r="5" fill="#0A0A0F" stroke={decisionTheme.glow} strokeWidth="3" />
                    </g>
                  );
                })()}
              </svg>

              {/* Text Score Value Panel */}
              <div className="absolute bottom-[-10px] text-center">
                <span className="text-3xl font-black font-mono tracking-tight text-slate-100 num-ltr">
                  {scan.score}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-widest font-mono">
                  {t('scan.scoreLabel')}
                </span>
              </div>
            </div>
          </div>

          {/* Verdict summary and stats */}
          <div className="lg:col-span-8 space-y-3 text-center lg:text-left">
            <div className="text-[10px] uppercase font-mono tracking-widest font-extrabold text-slate-400">
              {t('scan.verdictTitle')} // STAGE_3_DECISION_BOARD
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-display text-slate-100">
              {t('scan.verdictSubtitle')}: <span className={`${decisionTheme.text} num-ltr`}>{scan.decision}</span>
            </h1>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-cardBorder/30 flex items-center justify-center text-slate-300 font-mono font-bold text-sm num-ltr">
                  {scan.score}
                </div>
                <div className="text-left">
                  <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">{t('scan.scoreLabel')}</div>
                  <div className="text-xs text-slate-300 font-mono font-bold">{lang === 'ar' ? 'النقاط المرجحة' : 'Consensus quotient'}</div>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-cardBorder/40 hidden sm:block"></div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-cardBorder/30 flex items-center justify-center text-slate-300 font-mono font-bold text-sm num-ltr">
                  {(scan.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-left">
                  <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">{t('scan.confidenceLabel')}</div>
                  <div className="text-xs text-slate-300 font-mono font-bold">{lang === 'ar' ? 'نسبة دقة التقييم' : 'Confidence Quotient'}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Global Summary and Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 border-t border-cardBorder/30 pt-6">
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-sm font-bold flex items-center gap-2 font-display text-slate-200">
              <Sparkles size={16} className="text-primaryGlow" />
              {t('scan.summaryTitle')}
            </h3>
            <p 
              dangerouslySetInnerHTML={renderCleanText(scan.summary)}
              className="text-xs md:text-sm text-slate-300 leading-relaxed font-light font-sans text-left"
            />
          </div>
          <div className="bento-panel p-4 bg-[#10151C] border-[#27272a] space-y-2">
            <h3 className="text-xs font-bold flex items-center gap-2 font-display text-slate-200">
              <TrendingUp size={14} className="text-primaryGlow" />
              {t('scan.guidanceTitle')}
            </h3>
            <p 
              dangerouslySetInnerHTML={renderCleanText(scan.recommendation)}
              className="text-xs text-slate-400 leading-relaxed font-sans text-left"
            />
          </div>
        </div>

      </div>

      {/* 1.5 INTERACTIVE PILLARS CHAT LOUNGE */}
      <div className="bento-panel p-6 md:p-8 select-none relative overflow-hidden">
        <div className="absolute inset-0 neon-grid-scan opacity-10 pointer-events-none" />
        <h2 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2 mb-2">
          <MessageSquare className="text-cyan-400 shrink-0" size={18} />
          <span>{lang === 'ar' ? 'جلسة النقاش المشتركة للخبراء' : 'Expert Panel Debate Board'}</span>
        </h2>
        <p className="text-xs text-slate-400 font-sans mb-6">
          {lang === 'ar' ? 'اختر أحد أركان فكرتك لترى كيف يتفاعل ويتناقش الخبراء حولها معاً مباشرة!' : 'Select any core pillar of your pitch to view direct interactive panel discussion loops!'}
        </p>

        {/* Pillar toggle deck buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { id: 'problem', labelAr: 'المشكلة الجوهرية', labelEn: 'Core Market Problem', Icon: Target },
            { id: 'user', labelAr: 'الجمهور المستهدف', labelEn: 'Target User Fit', Icon: HelpCircle },
            { id: 'model', labelAr: 'النموذج الفني والمالي', labelEn: 'Technical & Financial Model', Icon: Cpu }
          ].map((pill) => {
            const isSelected = activePillar === pill.id;
            const PillIcon = pill.Icon;
            return (
              <button
                key={pill.id}
                onClick={() => setActivePillar(pill.id as any)}
                className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isSelected 
                    ? 'bg-primaryGlow/10 border-primaryGlow text-primaryGlow shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'bg-slate-900/60 border-cardBorder/30 text-slate-400 hover:text-slate-200'
                }`}
              >
                <PillIcon size={14} className="shrink-0" />
                <span>{lang === 'ar' ? pill.labelAr : pill.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic chat thread room */}
        <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-cardBorder/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePillar}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {pillarChats[activePillar].map((chat, idx) => {
                const companion = agentsMap.find((a) => a.id === chat.agent);
                if (!companion) return null;
                const AgentIcon = companion.Icon;
                const isEven = idx % 2 === 0;

                return (
                  <div key={idx} className={`flex items-start gap-4 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Abstract glowing node */}
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-12 rounded-full bg-slate-900 border overflow-hidden flex items-center justify-center shrink-0 shadow-lg"
                      style={{ borderColor: `${companion.hue}50`, color: companion.hue }}
                    >
                      <AgentIcon size={20} />
                    </motion.div>
                    {/* Conversation balloon */}
                    <div 
                      className="p-3.5 rounded-2xl text-xs max-w-lg leading-relaxed text-left relative"
                      style={{ 
                        backgroundColor: `${companion.hue}07`, 
                        borderColor: `${companion.hue}30`, 
                        borderWidth: '1px',
                        color: companion.hue 
                      }}
                    >
                      <span className="font-mono text-[9px] uppercase block mb-1 opacity-70">
                        {lang === 'ar' ? companion.roleAr : companion.role}
                      </span>
                      <p className="text-slate-200 font-medium font-sans">
                        {lang === 'ar' ? chat.textAr : chat.textEn}
                      </p>
                      {/* Dialogue arrow tail */}
                      <div 
                        className={`absolute top-5 w-2 h-2 rotate-45 border-l border-t`}
                        style={{
                          borderColor: `${companion.hue}30`,
                          backgroundColor: '#070A0F',
                          left: isEven ? '-5px' : 'auto',
                          right: isEven ? 'auto' : '-5px',
                          transform: isEven ? 'rotate(-45deg)' : 'rotate(135deg)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE ROUND TABLE / SELECTOR GRID */}
      <div className="bento-panel p-6 md:p-8 select-none">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b border-cardBorder/30 pb-4">
          <div className="text-left">
            <h2 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
              <Cpu className="text-cyan-400 shrink-0" size={18} />
              <span>{lang === 'ar' ? 'غرفة عمليات تقييم المشروع' : 'Venture Evaluation War Room'}</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              {lang === 'ar' ? 'انقر على بطاقة أي خبير لتسمعه وهو يلقي تقييمه المالي والتكتيكي الدقيق فورا!' : 'Click any companion character to spotlight their precise strategic evaluation dossiers.'}
            </p>
          </div>

          {/* Stepper Navigation buttons */}
          <div className="flex gap-2">
            <button 
              onClick={handlePrevAgent}
              className="p-2 bg-slate-900 border border-cardBorder hover:border-slate-500 rounded-xl text-slate-300 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleNextAgent}
              className="p-2 bg-slate-900 border border-cardBorder hover:border-slate-500 rounded-xl text-slate-300 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Character select deck row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {agentsMap.map((agent) => {
            const isSelected = selectedAgent === agent.id;
            const matchedResult = scan.results?.find((r) => r.agentType === agent.id);
            const agentScore = matchedResult?.score || 70;
            const AgentIcon = agent.Icon;

            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`bento-panel p-4 flex flex-col items-center relative overflow-hidden group ${
                  isSelected 
                    ? 'scale-105 border-transparent shadow-xl' 
                    : 'opacity-55 hover:opacity-100 hover:scale-102 border-cardBorder/40'
                }`}
                style={isSelected ? { backgroundColor: `${agent.hue}07`, borderColor: agent.hue } : {}}
              >
                {/* Horizontal scanline active effect */}
                {isSelected && (
                  <div className="cyber-scanline" style={{ color: agent.hue }} />
                )}

                {/* Abstract Data Node */}
                <motion.div 
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 border border-white/10 ${isSelected ? decisionTheme.characterGlow : ''}`}
                  style={{ backgroundColor: `${agent.hue}15`, color: agent.hue }}
                  animate={isSelected ? { scale: [1, 1.05, 1], boxShadow: [`0 0 0px ${agent.hue}00`, `0 0 20px ${agent.hue}60`, `0 0 0px ${agent.hue}00`] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AgentIcon size={32} />
                </motion.div>

                {/* Character Name badge */}
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono mt-2 tracking-wider">
                  {lang === 'ar' ? agent.roleAr : agent.role}
                </span>
                <span className="text-xs font-extrabold text-slate-200 font-display mt-0.5 group-hover:text-primaryGlow transition-colors">
                  {t(agent.nameKey)}
                </span>

                {/* score badge */}
                <span 
                  className="text-xs font-black font-mono mt-1.5 px-2 py-0.5 rounded num-ltr"
                  style={{ backgroundColor: `${agent.hue}15`, color: agent.hue }}
                >
                  {agentScore}/100
                </span>
              </button>
            );
          })}
        </div>

        {/* Spotlighted character panel with speech bubble details */}
        <AnimatePresence mode="wait">
          {activeResult && (
            <motion.div
              key={selectedAgent}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bento-panel spotlight-wrapper p-6 relative overflow-hidden flex flex-col lg:flex-row items-center lg:items-start gap-6"
              style={{ borderColor: `${activeAgentConfig.hue}30`, backgroundColor: `${activeAgentConfig.hue}02` }}
            >
              <div className="cyber-scanline" style={{ color: activeAgentConfig.hue }} />

              {/* Big character spotlight */}
              <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center bg-slate-950/60 rounded-2xl border border-cardBorder/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                <activeAgentConfig.Icon size={64} className="text-white" />
              </div>

              {/* Strategic speech bubble card */}
              <div className="flex-1 w-full space-y-4">
                
                {/* Speech title row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cardBorder/30 pb-3 gap-2">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded tracking-wide" style={{ backgroundColor: `${activeAgentConfig.hue}15`, color: activeAgentConfig.hue }}>
                      {lang === 'ar' ? activeAgentConfig.roleAr : activeAgentConfig.role} // ACTIVE_DOSSIER
                    </span>
                    <h3 className="text-lg font-bold font-display text-slate-100 mt-1">
                      {t(activeAgentConfig.nameKey)}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-2xl font-black font-mono num-ltr" style={{ color: activeAgentConfig.hue }}>
                      {activeResult.score}/100
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-widest font-mono">
                      {lang === 'ar' ? 'نقاط البعد المرجحة' : 'DIMENSION SCORE'}
                    </span>
                  </div>
                </div>

                {/* Opportunities vs Risks Tab Selection */}
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setActiveTab('opps')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'opps'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'bg-transparent text-slate-400 border-cardBorder/30 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles size={12} />
                    {lang === 'ar' ? 'الفرص الاستراتيجية' : 'Strategic Opportunities'}
                  </button>
                  <button
                    onClick={() => setActiveTab('risks')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'risks'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                        : 'bg-transparent text-slate-400 border-cardBorder/30 hover:text-slate-200'
                    }`}
                  >
                    <ShieldAlert size={12} />
                    {lang === 'ar' ? 'المخاطر والعيوب المكتشفة' : 'Key Risks Identified'}
                  </button>
                </div>

                {/* Content bullets container */}
                <div className="min-h-[100px] text-left">
                  <AnimatePresence mode="wait">
                    {activeTab === 'opps' ? (
                      <motion.div
                        key="opps-bullets"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-2"
                      >
                        {activeResult.opportunities.map((opp: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/[0.01] border border-emerald-500/5 hover:border-emerald-500/15 transition-all">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5 animate-pulse" />
                            <p className="text-xs text-emerald-200/90 leading-relaxed font-sans">{opp}</p>
                          </div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="risks-bullets"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-2"
                      >
                        {activeResult.risks.map((risk: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/[0.01] border border-rose-500/5 hover:border-rose-500/15 transition-all">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5 animate-pulse" />
                            <p className="text-xs text-rose-200/90 leading-relaxed font-sans">{risk}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Companion unique recommend description */}
                <div className="border-t border-cardBorder/30 pt-4 mt-4 text-left">
                  <h4 className="text-[10px] uppercase font-mono tracking-widest font-extrabold text-slate-500 mb-2">
                    {t('scan.recommendationLabel')} // COMPANION_TACTICAL_BLUEPRINT
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {activeResult.recommendation}
                  </p>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
      
    </div>
  );
}
