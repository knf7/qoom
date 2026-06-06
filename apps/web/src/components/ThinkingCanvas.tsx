import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Lightbulb, UserCheck, Play } from 'lucide-react';
import { Activity, Network, Shield, Cpu, Target } from 'lucide-react';
import { useI18n } from '../utils/i18n';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

interface ThinkingCanvasProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isSubmitting?: boolean;
  onTriggerScan?: () => void;
  isValidating?: boolean;
}

export default function ThinkingCanvas({
  value,
  onChange,
  placeholder = '',
  isSubmitting = false,
  onTriggerScan,
  isValidating = false
}: ThinkingCanvasProps) {
  const { t, lang } = useI18n();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const particleIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);



  // Keystroke handler for typing effects
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);

    // Spawn 2-3 colorful bubbles around the typing container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newParticles: Particle[] = [];
      const colors = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
      
      for (let i = 0; i < 3; i++) {
        const id = particleIdRef.current++;
        // Spawn from random positions near the bottom/sides
        const x = Math.random() * rect.width;
        const y = rect.height - 20 - Math.random() * 20;
        const size = Math.random() * 8 + 4;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        newParticles.push({ id, x, y, size, color });
      }

      setParticles((prev) => [...prev, ...newParticles].slice(-30));
    }
  };

  // Remove old particles to avoid memory leaks
  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => {
        setParticles((prev) => prev.slice(3));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Compute text completion statistics
  const charCount = value.trim().length;
  let gradientClass = 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20';
  let glowColor = 'rgba(16, 185, 129, 0.1)';

  if (charCount > 0 && charCount < 30) {
    gradientClass = 'from-cyan-500/10 to-blue-500/5 border-cyan-500/20';
    glowColor = 'rgba(6, 182, 212, 0.1)';
  } else if (charCount >= 30 && charCount < 100) {
    gradientClass = 'from-purple-500/10 to-fuchsia-500/5 border-purple-500/20';
    glowColor = 'rgba(139, 92, 246, 0.1)';
  } else if (charCount >= 100) {
    gradientClass = 'from-amber-500/15 to-orange-500/5 border-amber-500/35 shadow-[0_0_20px_rgba(245,158,11,0.1)]';
    glowColor = 'rgba(245, 158, 11, 0.15)';
  }

  return (
    <div ref={containerRef} className="w-full relative flex flex-col items-center">
      
      {/* 1. Sleek Abstract Intelligence Visualizer */}
      <div className="w-full grid grid-cols-5 gap-4 max-w-2xl mb-6 relative z-10 px-2 select-none h-16">
        {[
          { id: 'shield', Icon: Shield, color: 'text-cyan-400', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]' },
          { id: 'network', Icon: Network, color: 'text-cyan-500', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]' },
          { id: 'activity', Icon: Activity, color: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' },
          { id: 'cpu', Icon: Cpu, color: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' },
          { id: 'target', Icon: Target, color: 'text-cyan-400', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]' }
        ].map(({ id, Icon, color, glow }, index) => {
          return (
            <div key={id} className="flex flex-col items-center justify-end relative h-full">
              <motion.div
                animate={isTyping ? { 
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 1, 0.6],
                  y: [0, -5, 0]
                } : {
                  scale: charCount >= 100 ? 1.1 : 1,
                  opacity: charCount >= 100 ? 0.9 : 0.4,
                  y: 0
                }}
                transition={{ 
                  duration: isTyping ? 0.6 : 2, 
                  repeat: Infinity,
                  delay: index * 0.1 
                }}
                className={`w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center ${color} ${isTyping ? glow : ''}`}
              >
                <Icon size={18} />
              </motion.div>
              
              {/* Connecting line to input */}
              <motion.div 
                className={`w-px mt-2 bg-gradient-to-b from-cyan-500/50 to-transparent`}
                animate={{ height: isTyping ? 16 : 8, opacity: isTyping ? 0.8 : 0.2 }}
              />
            </div>
          );
        })}
      </div>

      {/* 2. Interactive Thinking Canvas with glass design */}
      <div 
        className="glass rounded-xl w-full p-6 md:p-8 relative overflow-hidden transition-all duration-300"
        style={{ borderColor: isTyping ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.1)' }}
      >
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

        {/* Text Area */}
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting || isValidating}
            placeholder={lang === 'ar' ? "صف فكرتك حتى لو كانت غير مرتبة... النظام الاستخباراتي جاهز للتحليل." : "Describe your idea... The intelligence system is ready to parse."}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 resize-none outline-none text-lg md:text-xl leading-relaxed min-h-[140px] p-4 focus:border-cyan-500/40 textarea-glow disabled:opacity-50 transition-colors"
            spellCheck="false"
            dir="auto"
          />

        {/* Canvas Footer Diagnostics */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-4 mt-4 relative z-10 gap-3">
          
          {/* Character completion milestones - Glass pills */}
          <div className="flex items-center gap-2 text-[11px] font-mono select-none uppercase tracking-widest">
            <span className={`px-2.5 py-1 rounded-full glass transition-colors ${charCount >= 5 ? 'text-cyan-400 border-cyan-500/20' : 'text-zinc-500'}`}>
              {charCount >= 5 ? '■' : '□'} {lang === 'ar' ? 'البصمة الأولى' : 'Init'}
            </span>
            <span className={`px-2.5 py-1 rounded-full glass transition-colors ${charCount >= 30 ? 'text-amber-400 border-amber-500/20' : 'text-zinc-500'}`}>
              {charCount >= 30 ? '■' : '□'} {lang === 'ar' ? 'السياق' : 'Context'}
            </span>
            <span className={`px-2.5 py-1 rounded-full glass transition-colors ${charCount >= 100 ? 'text-cyan-400 border-cyan-500/20' : 'text-zinc-500'}`}>
              {charCount >= 100 ? '■' : '□'} {lang === 'ar' ? 'جاهزية الفحص' : 'Ready'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isValidating && (
              <span className="text-xs font-mono text-zinc-400 flex items-center animate-pulse">
                <Brain className="w-3 h-3 mr-1 text-cyan-400" /> {lang === 'ar' ? 'جاري تقييم الفكرة...' : 'EVALUATING...'}
              </span>
            )}
            <span className={`text-xs font-mono ${charCount > 100 ? 'text-cyan-400' : 'text-zinc-600'}`}>
              {charCount} {lang === 'ar' ? 'حرف' : 'chars'}
            </span>
          </div>   {/* In-canvas Direct AI Scan Button if provided */}
            {onTriggerScan && (
              <button
                type="button"
                onClick={onTriggerScan}
                disabled={isSubmitting || isValidating || charCount < 5}
                className="btn-primary gap-2"
              >
                {isValidating ? (
                  <>
                    <div className="w-3 h-3 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    <span>{lang === 'ar' ? 'جاري الفحص المسبق...' : 'Pre-flight Scan...'}</span>
                  </>
                ) : (
                  <>
                    <Play size={12} className="text-black fill-current" />
                    <span>{lang === 'ar' ? 'تشغيل فحص الوكلاء' : 'Launch Agent Scan'}</span>
                  </>
                )}
              </button>
            )}

        </div>
      </div>
      
    </div>
  );
}
