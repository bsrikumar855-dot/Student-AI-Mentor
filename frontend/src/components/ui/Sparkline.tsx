import React from 'react';
import { motion } from 'framer-motion';

interface SparklineProps {
  data: number[];
  trend: 'up' | 'down' | 'steady';
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  trend,
  width = 120,
  height = 40,
  color = 'var(--color-ink)',
}) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // avoid div by zero

  const paddingX = 4;
  const paddingY = 8;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const points = data.map((val, i) => {
    const x = paddingX + (i / (data.length - 1)) * usableWidth;
    const y = paddingY + usableHeight - ((val - min) / range) * usableHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const lastPoint = points[points.length - 1].split(',');
  const lastX = parseFloat(lastPoint[0]);
  const lastY = parseFloat(lastPoint[1]);

  const trendSymbol = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '–';
  const trendColor = trend === 'up' ? 'var(--color-primary)' : trend === 'down' ? 'var(--color-risk-high)' : 'var(--color-ink-soft)';

  return (
    <div className="relative inline-block" style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Engraved ledger grid (horizontal lines) */}
        <line x1="0" y1={paddingY} x2={width} y2={paddingY} stroke="var(--color-hairline)" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="0" y1={height - paddingY} x2={width} y2={height - paddingY} stroke="var(--color-hairline)" strokeWidth="1" strokeDasharray="2 2" />
        
        {/* The Sparkline Path */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Trend Indicator at the tip */}
        <motion.text
          x={lastX + 4}
          y={lastY + 4}
          fill={trendColor}
          className="font-mono text-[10px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          {trendSymbol}
        </motion.text>
      </svg>
    </div>
  );
};
