import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Github, Package, MessageSquare, Zap, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

interface RealityEvidencePack {
  reality_signal: number;
  saturation_score: number;
  novelty_score: number;
  clone_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  trend_direction: 'RISING' | 'STABLE' | 'DECLINING';
  market_momentum: number;
  opportunity_gap_score: number;
  github_repos_count: number;
  npm_packages_count: number;
  hn_mentions_30d: number;
  stackoverflow_questions: number;
  producthunt_launches: number;
  top_competitors: string[];
  dominant_incumbents: string[];
  evidence_confidence: number;
  evidence_sources: string[];
  insufficient_evidence: boolean;
}

interface RealitySignalPanelProps {
  data: RealityEvidencePack;
}

const sourceIcons: Record<string, React.ReactNode> = {
  github: <Github size={14} />,
  npm: <Package size={14} />,
  hackernews: <MessageSquare size={14} />,
  stackoverflow: <Globe size={14} />,
  producthunt: <Zap size={14} />,
};

function Signal({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-white font-bold">{value}<span className="text-slate-500">/{max}</span></span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function RealitySignalPanel({ data }: RealitySignalPanelProps) {
  const trendIcon = data.trend_direction === 'RISING'
    ? <TrendingUp size={14} className="text-emerald-400" />
    : data.trend_direction === 'DECLINING'
    ? <TrendingDown size={14} className="text-red-400" />
    : <Minus size={14} className="text-slate-400" />;

  const cloneColors = {
    LOW: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    MEDIUM: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    HIGH: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bento-panel spotlight-wrapper p-6 border-[#27272a] space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-slate-300">Reality Intelligence Layer</h3>
        </div>
        <div className={`text-xs font-mono px-2 py-1 rounded border ${data.insufficient_evidence ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'}`}>
          {Math.round(data.evidence_confidence * 100)}% CONFIDENCE
        </div>
      </div>

      {/* Insufficient Evidence Warning */}
      <AnimatePresence>
        {data.insufficient_evidence && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Insufficient External Evidence</p>
              <p className="text-xs text-red-300/70">Only {data.evidence_sources.length}/5 data sources responded. Scores penalized. Hallucination risk elevated.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evidence Sources */}
      <div>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Intelligence Engines</p>
        <div className="flex flex-wrap gap-2">
          {['serpapi', 'gemini_intelligence', 'github'].map(src => {
            const isUsed = data.evidence_sources.includes(src);
            const iconMap: Record<string, any> = {
              'serpapi': <Globe size={14} />,
              'gemini_intelligence': <Zap size={14} />,
              'github': <Github size={14} />
            };
            return (
              <div
                key={src}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono border transition-colors ${
                  isUsed
                    ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
                    : 'text-slate-600 bg-white/2 border-white/5'
                }`}
              >
                {iconMap[src] || <Zap size={14} />}
                {src.replace('_', ' ').toUpperCase()}
                {isUsed ? <CheckCircle size={10} /> : <span className="opacity-40">✗</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Evidence Counts */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'GitHub Repos', value: data.github_repos_count.toLocaleString(), icon: <Github size={12} /> },
          { label: 'npm Packages', value: data.npm_packages_count.toLocaleString(), icon: <Package size={12} /> },
          { label: 'HN Mentions (30d)', value: data.hn_mentions_30d.toString(), icon: <MessageSquare size={12} /> },
          { label: 'SO Questions', value: data.stackoverflow_questions.toLocaleString(), icon: <Globe size={12} /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white/3 border border-white/5 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              {icon}
              <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-lg font-bold text-white font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Signal Bars */}
      <div className="space-y-4">
        <Signal label="Reality Signal" value={data.reality_signal} color="bg-cyan-400" />
        <Signal label="Market Saturation" value={data.saturation_score} color={data.saturation_score > 70 ? 'bg-red-400' : data.saturation_score > 40 ? 'bg-yellow-400' : 'bg-emerald-400'} />
        <Signal label="Innovation Novelty" value={data.novelty_score} color="bg-purple-400" />
        <Signal label="Market Momentum" value={data.market_momentum} color="bg-blue-400" />
        <Signal label="Opportunity Gap" value={data.opportunity_gap_score} color="bg-emerald-400" />
      </div>

      {/* Meta Signals Row */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          {trendIcon}
          <span>Trend: <span className="text-white">{data.trend_direction}</span></span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded border ${cloneColors[data.clone_risk]}`}>
          <Shield size={11} />
          Clone Risk: {data.clone_risk}
        </div>
      </div>

      {/* Top Competitors */}
      {data.top_competitors.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Competitors Found in Evidence</p>
          <div className="flex flex-wrap gap-2">
            {data.top_competitors.slice(0, 5).map(c => (
              <span key={c} className="text-[10px] font-mono px-2 py-1 bg-white/5 border border-white/10 rounded text-slate-300">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
