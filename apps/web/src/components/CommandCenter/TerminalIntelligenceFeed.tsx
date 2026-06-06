import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentsStore } from '../../store/agents.store';
import { Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const TerminalIntelligenceFeed = () => {
  const { terminalLogs, agents } = useAgentsStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  return (
    <div className="glass rounded-2xl p-4 h-full flex flex-col scanline relative overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950/50 pointer-events-none" />
      <div className="noise-overlay" />
      
      {/* Terminal Header */}
      <div className="border-b border-white/5 p-3 relative z-10 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-300 tracking-widest">_&lt; SYSTEM_EVENT_LOG</span>
        </div>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-3 relative z-10 terminal-scroll bg-zinc-950/50 rounded-b-xl">
        <AnimatePresence initial={false}>
          {terminalLogs.map((log) => {
            const agent = log.agentId ? agents[log.agentId] : null;
            const timeString = new Date(log.timestamp).toISOString().split('T')[1].slice(0, -1);
            
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3"
              >
                <span className="text-cyan-500/60 shrink-0">[{timeString}]</span>
                <div className="flex-1">
                  {agent && (
                    <span 
                      className="font-bold me-2 uppercase"
                      style={{ color: agent.color }}
                    >
                      {agent.id}@qoom:~$
                    </span>
                  )}
                  <span className={cn(
                    "text-zinc-300 break-words font-mono",
                    log.message.includes('ERROR') ? "text-rose-400" : "",
                    log.message.includes('SUCCESS') ? "text-cyan-400 font-bold" : "",
                    log.message.includes('WARNING') ? "text-amber-400" : ""
                  )}>
                    {log.message}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Blinking Cursor */}
        <div className="flex items-center gap-3 mt-4 text-cyan-500/60">
          <span>root@qoom:~$</span>
          <span className="terminal-cursor text-cyan-400 font-bold block w-2 h-4" />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
