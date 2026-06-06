import { motion } from 'framer-motion';
import { useAgentsStore } from '../../store/agents.store';
import { ShieldAlert, Fingerprint, Radar, KeySquare, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const TIMELINE_STEPS = [
  { id: 'auth', labelAr: 'التحقق من الهوية', labelEn: 'VERIFICATION', icon: Fingerprint },
  { id: 'ice', labelAr: 'محرك النية والوضوح', labelEn: 'INTENT & CLARITY ENGINE (ICE)', icon: Radar },
  { id: 'krl', labelAr: 'طبقة استرجاع المعرفة', labelEn: 'KNOWLEDGE RETRIEVAL LAYER (KRL)', icon: KeySquare },
  { id: 'swarm', labelAr: 'تنفيذ سرب الوكلاء', labelEn: 'AGENT SWARM EXECUTION', icon: ShieldAlert },
  { id: 'consensus', labelAr: 'توافق الأدلة والتحقق', labelEn: 'EVIDENCE & VALIDATION CONSENSUS', icon: CheckCircle2 },
];

export const InvestigationTimelineHUD = () => {
  const { isScanning, scanProgress } = useAgentsStore();

  const getStepStatus = (index: number) => {
    const stepThreshold = (index + 1) * 20; // 20, 40, 60, 80, 100
    if (scanProgress >= stepThreshold) return 'COMPLETED';
    if (scanProgress > (index * 20) && scanProgress < stepThreshold) return 'PROCESSING';
    return 'PENDING';
  };

  return (
    <div className="glass rounded-2xl p-6 relative h-full flex flex-col scanline">
      {/* Cyber Scanline effect */}
      {isScanning && <div className="cyber-scanline" />}
      
      <div className="flex flex-col items-start mb-8 relative z-10 border-b border-white/5 pb-4">
        <span className="text-xl font-mono text-cyan-400 font-bold mb-1">
          {Math.round(scanProgress)}%
        </span>
        <h3 className="text-sm uppercase font-bold text-cyan-300 flex flex-col gap-1">
          <span className="font-sans">الجدول الزمني للتحقيق</span>
          <span className="text-[10px] tracking-[0.2em] text-zinc-500 font-mono">TIMELINE</span>
        </h3>
      </div>

      <div className="relative flex-1">
        {/* Vertical track line */}
        <div className="absolute end-6 top-4 bottom-4 w-[2px] bg-white/5 rounded-full" />
        
        {/* Animated Progress Line */}
        <motion.div 
          className="absolute end-6 top-4 w-[2px] bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/20"
          initial={{ height: "0%" }}
          animate={{ height: `${scanProgress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        <div className="space-y-8 relative z-10 h-full flex flex-col justify-between py-2">
          {TIMELINE_STEPS.map((step, index) => {
            const status = getStepStatus(index);
            const isCompleted = status === 'COMPLETED';
            const isProcessing = status === 'PROCESSING';
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-start gap-6 group">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all duration-300 bg-zinc-900/50",
                    isCompleted ? "border-cyan-500 text-cyan-400" : 
                    isProcessing ? "border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/20 animate-pulse" : 
                    "border-zinc-700 text-zinc-500"
                  )}
                >
                  <Icon size={20} className={cn(isProcessing && "animate-pulse")} />
                  {isProcessing && (
                    <motion.div
                      className="absolute inset-0 rounded-full border border-cyan-500/50"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </div>
                
                <div className="pt-2 flex-1 ps-4">
                  <h4 className={cn(
                    "text-sm font-bold transition-colors font-sans mb-1",
                    isCompleted ? "text-white" :
                    isProcessing ? "text-white" :
                    "text-zinc-500"
                  )}>
                    {step.labelAr}
                  </h4>
                  <div className={cn(
                    "text-[10px] font-mono tracking-widest uppercase transition-colors",
                    isCompleted ? "text-zinc-400" :
                    isProcessing ? "text-cyan-400" :
                    "text-zinc-600"
                  )}>
                    {step.labelEn}
                  </div>
                  
                  {isProcessing && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-[11px] font-mono text-zinc-400 mt-3 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400/80">Executing telemetry sequence...</span>
                      </div>
                      <div className="opacity-50 text-cyan-500">
                        &gt; {step.id === 'krl' ? 'Fetching evidence...' : step.id === 'swarm' ? 'Evaluating DNA...' : 'Awaiting nodes...'}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
