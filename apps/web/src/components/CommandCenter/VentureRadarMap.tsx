import { motion } from 'framer-motion';

export interface RadarData {
  market: number;
  competition: number;
  monetization: number;
  feasibility: number;
  risk: number;
  regulatory: number;
}

interface VentureRadarMapProps {
  data: RadarData;
}

export const VentureRadarMap = ({ data }: VentureRadarMapProps) => {
  // Convert 0-100 scores to coordinates on a pentagon
  const size = 300;
  const center = size / 2;
  const radius = size * 0.35;
  
  const axes = ['Market', 'Competition', 'Monetization', 'Feasibility', 'Risk', 'Regulatory'];
  const values = [data.market, data.competition, data.monetization, data.feasibility, data.risk, data.regulatory];

  const getPoint = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const distance = (value / 100) * radius;
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    };
  };

  const points = values.map((val, i) => getPoint(val, i, axes.length));
  const polygonPath = points.map(p => `${p.x},${p.y}`).join(' ');

  // Base background pentagons
  const levels = [20, 40, 60, 80, 100];

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto flex items-center justify-center">
      {/* Dynamic Sweep */}
      <div className="absolute inset-0 rounded-full border border-primaryGlow/10 bg-primaryGlow/5 shadow-[0_0_50px_rgba(16,185,129,0.05)] overflow-hidden scale-75 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primaryGlow/20 to-transparent radar-sweep-line" />
      </div>

      <svg width={size} height={size} className="relative z-10 overflow-visible">
        {/* Draw background grid */}
        {levels.map((level) => {
          const levelPoints = axes.map((_, i) => getPoint(level, i, axes.length));
          return (
            <polygon
              key={level}
              points={levelPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          );
        })}

        {/* Draw axes lines */}
        {axes.map((_, i) => {
          const edge = getPoint(100, i, axes.length);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={edge.x}
              y2={edge.y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Draw animated data polygon */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          points={polygonPath}
          fill="rgba(16, 185, 129, 0.2)"
          stroke="#10B981"
          strokeWidth="2"
          className="shadow-neon-primary filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          style={{ transformOrigin: 'center' }}
        />

        {/* Draw data points */}
        {points.map((p, i) => (
          <motion.circle
            key={`point-${i}`}
            initial={{ opacity: 0, r: 0 }}
            animate={{ opacity: 1, r: 4 }}
            transition={{ duration: 0.5, delay: 1 + (i * 0.1) }}
            cx={p.x}
            cy={p.y}
            fill="#06b6d4"
            className="filter drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]"
          />
        ))}

        {/* Labels */}
        {axes.map((label, i) => {
          const p = getPoint(120, i, axes.length);
          return (
            <text
              key={`label-${i}`}
              x={p.x}
              y={p.y}
              fill="#8a99ad"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
              className="uppercase tracking-widest font-mono"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
