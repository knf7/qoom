import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  const dotSizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <motion.div 
      className={`relative inline-flex items-center justify-center font-black tracking-tight ${className}`}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <div className="relative flex items-baseline">
        {/* Animated dot (representing the "point" in Arabic letters or an AI node) */}
        <motion.div
          className={`absolute -top-1 end-1/2 translate-x-1/2 rounded-full bg-cyan-400 ${dotSizeClasses[size]}`}
          variants={{
            initial: { opacity: 0.5, scale: 0.8 },
            animate: { 
              opacity: [0.5, 1, 0.5], 
              scale: [0.8, 1.2, 0.8],
              boxShadow: [
                "0 0 0px rgba(34,211,238,0)",
                "0 0 15px rgba(34,211,238,0.8)",
                "0 0 0px rgba(34,211,238,0)"
              ]
            },
            hover: {
              scale: 1.5,
              opacity: 1,
              boxShadow: "0 0 20px rgba(34,211,238,1)",
              transition: { duration: 0.3 }
            }
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Main Text */}
        <span className={`text-white font-sans ${sizeClasses[size]}`}>
          قُـ
        </span>
        <motion.span 
          className={`text-cyan-400 font-sans ${sizeClasses[size]} glow-text-cyan`}
          variants={{
            initial: { opacity: 0.8 },
            hover: { opacity: 1, textShadow: "0 0 30px rgba(34,211,238,0.8)" }
          }}
        >
          وم
        </motion.span>
      </div>

      {/* Subtle ambient background glow on hover */}
      <motion.div
        className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full -z-10"
        variants={{
          initial: { opacity: 0, scale: 0.5 },
          hover: { opacity: 0.5, scale: 1.5 }
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
