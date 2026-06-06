import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../utils/i18n';

export default function ThoughtProcessLoader() {
  const { lang } = useI18n();
  const [loadingText, setLoadingText] = useState(0);

  const textsAr = [
    'جاري تحليل المعطيات المبدئية...',
    'ربط خوارزميات السوق وبناء النماذج...',
    'تقييم الجدوى التقنية وهياكل التكلفة...',
    'استخراج مصفوفات المخاطر والفرص...',
    'محاكاة سيناريوهات النمو...'
  ];

  const textsEn = [
    'Analyzing preliminary data vectors...',
    'Correlating market algorithms...',
    'Evaluating technical feasibility...',
    'Extracting risk & opportunity matrices...',
    'Simulating growth scenarios...'
  ];

  const texts = lang === 'ar' ? textsAr : textsEn;

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText((prev) => (prev + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-24 h-24 mb-6">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full"
        />
        {/* Inner Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border-2 border-t-emerald-500 border-r-transparent border-b-emerald-500 border-l-transparent rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
        />
        {/* Core Pulse */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-8 bg-cyan-500/30 rounded-full blur-[8px]"
        />
        {/* Center Dot */}
        <div className="absolute inset-10 bg-cyan-400 rounded-full z-10 shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
      </div>

      <div className="flex flex-col items-center">
        <motion.div
          key={loadingText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-sm font-mono text-cyan-300 font-bold tracking-widest text-center"
        >
          {texts[loadingText]}
        </motion.div>
        
        {/* Streaming Code Effect */}
        <div className="mt-4 flex gap-1 overflow-hidden h-4 w-48 justify-center opacity-50">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.1, 1, 0.1] }}
              transition={{ duration: Math.random() * 2 + 0.5, repeat: Infinity, delay: Math.random() }}
              className="w-1.5 h-full bg-cyan-500/60 rounded-sm"
              style={{ height: `${Math.random() * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
