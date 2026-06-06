import { motion } from 'framer-motion';
import { useAgentsStore } from '../../store/agents.store';
import { BrainCircuit, Cpu, Database, Network, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const AgentCommandCenter = () => {
  const { agents } = useAgentsStore();

  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'orchestrator': return <BrainCircuit size={24} />;
      case 'market': return <Network size={24} />;
      case 'competition': return <Database size={24} />;
      case 'feasibility': return <Cpu size={24} />;
      case 'validator': return <ShieldCheck size={24} />;
      default: return <Cpu size={24} />;
    }
  };

  return (
    <div className="glass rounded-2xl p-6 neon-cyan relative overflow-hidden">
      {/* Clean surface, no background neon blurs */}
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-cyan-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          ACTIVE SWARM CLUSTER
        </h3>
        <span className="text-xs text-zinc-500 font-mono tracking-widest">QOOM_V7_ORCHESTRATOR ⎈</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
        {Object.values(agents).map((agent) => {
          const isThinking = agent.status === 'THINKING' || agent.status === 'STREAMING';
          const isDebating = agent.status === 'DEBATING';
          let glowClass = "border-primary-glow";
          if (agent.id === 'validator') glowClass = "border-destructive-glow";
          else if (agent.id === 'competition' || agent.id === 'market') glowClass = "border-warning-glow";
          else if (agent.id === 'feasibility') glowClass = "border-primary-glow";

          return (
            <motion.div
              key={agent.id}
              layout
              className={cn(
                "glass rounded-xl p-6 relative flex flex-col items-center justify-center text-center transition-all duration-500",
                "border-2",
                isThinking || isDebating ? glowClass : "border-white/5 shadow-none"
              )}
            >
              {/* Removed aggressive background blur pulse to favor a clean UI */}

              <div 
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center mb-4 relative z-10",
                  "bg-transparent backdrop-blur-md"
                )}
                style={{ color: agent.color }}
              >
                {getAgentIcon(agent.id)}
                
                {/* Clean Indicator Ring for Thinking State */}
                {(isThinking || isDebating) && (
                  <svg className="absolute -inset-2 w-16 h-16 animate-spin pointer-events-none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke={agent.color} strokeWidth="1.5" strokeDasharray="30 70" opacity="0.8" />
                  </svg>
                )}
              </div>
              
              <h4 className="text-white font-bold text-sm mb-1">{agent.name}</h4>
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">{agent.role}</span>
              
              <div className="mt-4 h-10 w-full flex items-center justify-center">
                {agent.status === 'IDLE' && <span className="text-xs text-zinc-500 font-mono">STANDBY</span>}
                {isThinking && (
                  <motion.span 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-mono line-clamp-2"
                    style={{ color: agent.color }}
                  >
                    {agent.currentThought || "Extracting telemetry..."}
                  </motion.span>
                )}
                {isDebating && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: [0.5, 1, 0.5], scale: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-xs text-amber-400 font-mono font-bold"
                  >
                    CROSS-EXAMINING EVIDENCE
                  </motion.span>
                )}
                {agent.status === 'COMPLETED' && <span className="text-xs text-emerald-400 font-mono">COMPILED</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
