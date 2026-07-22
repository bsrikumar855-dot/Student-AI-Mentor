import React from 'react';
import { motion } from 'framer-motion';
import { type RiskBand, type ComponentBar } from '../../lib/api';
import { cn } from '../../lib/utils';

interface LivingCrestProps {
  riskBand: RiskBand;
  components: ComponentBar[];
  motto: string;
  variant?: 'warm' | 'clinical';
  animateOnLoad?: boolean;
}

const riskColors = {
  low: 'var(--color-risk-low)',
  medium: 'var(--color-risk-medium)',
  high: 'var(--color-risk-high)',
  crit: 'var(--color-risk-crit)',
};

export const LivingCrest: React.FC<LivingCrestProps> = ({
  riskBand,
  components,
  motto,
  variant = 'warm',
  animateOnLoad = true,
}) => {
  const isClinical = variant === 'clinical';
  const bandColor = riskColors[riskBand];

  const drawTransition = animateOnLoad
    ? {
        pathLength: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const },
        fillOpacity: { duration: 0.8, delay: 0.5 },
      }
    : { pathLength: { duration: 0 }, fillOpacity: { duration: 0 } };

  // Calculate an overall percentage (average of components) to determine how far the wreath grows
  const overallStanding = components.length 
    ? components.reduce((acc, c) => acc + c.value, 0) / components.length 
    : 100;
  // Convert 0-100 to pathLength 0-1
  const wreathProgress = overallStanding / 100;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center relative max-w-sm mx-auto",
      isClinical ? "p-8 rounded-lg bg-surface border border-hairline pressed-plate shadow-sm" : "p-4"
    )}>
      <svg width="240" height="280" viewBox="0 0 240 280" className="drop-shadow-sm">
        
        {/* Laurel Wreath (Risk Ring) - left branch */}
        <motion.path
          d="M 120 230 C 50 230 20 160 30 80 C 40 40 70 20 100 10"
          fill="transparent"
          stroke={bandColor}
          strokeWidth="4"
          initial={{ pathLength: animateOnLoad ? 0 : wreathProgress }}
          animate={{ pathLength: wreathProgress }}
          transition={drawTransition}
        />
        {/* Laurel leaves left */}
        <motion.g
          initial={{ opacity: animateOnLoad ? 0 : 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animateOnLoad ? 1 : 0, duration: 1 }}
          fill={bandColor}
        >
          {/* Decorative pseudo-leaves along the path */}
          <path d="M 40 180 Q 25 170 35 155 Q 50 160 40 180" />
          <path d="M 32 130 Q 15 120 25 105 Q 40 110 32 130" />
          <path d="M 45 75 Q 35 60 50 45 Q 65 55 45 75" />
        </motion.g>

        {/* Laurel Wreath (Risk Ring) - right branch */}
        <motion.path
          d="M 120 230 C 190 230 220 160 210 80 C 200 40 170 20 140 10"
          fill="transparent"
          stroke={bandColor}
          strokeWidth="4"
          initial={{ pathLength: animateOnLoad ? 0 : wreathProgress }}
          animate={{ pathLength: wreathProgress }}
          transition={drawTransition}
        />
        {/* Laurel leaves right */}
        <motion.g
          initial={{ opacity: animateOnLoad ? 0 : 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animateOnLoad ? 1 : 0, duration: 1 }}
          fill={bandColor}
        >
          <path d="M 200 180 Q 215 170 205 155 Q 190 160 200 180" />
          <path d="M 208 130 Q 225 120 215 105 Q 200 110 208 130" />
          <path d="M 195 75 Q 205 60 190 45 Q 175 55 195 75" />
        </motion.g>

        {/* The Escutcheon (Shield) Base */}
        <motion.path
          d="M 70 40 L 170 40 L 170 120 C 170 180 120 210 120 210 C 120 210 70 180 70 120 Z"
          fill="var(--color-surface)"
          stroke="var(--color-brass)"
          strokeWidth="3"
          initial={{ pathLength: animateOnLoad ? 0 : 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Shield Quarters (representing the 4 components) */}
        <g stroke="var(--color-brass)" strokeWidth="1.5">
          {/* Top Left */}
          <motion.path
            d="M 71 41 L 120 41 L 120 120 L 71 120 Z"
            fill={riskColors[components[0]?.risk || 'low']}
            initial={{ fillOpacity: animateOnLoad ? 0 : 0.8 }}
            animate={{ fillOpacity: 0.8 }}
            transition={{ delay: animateOnLoad ? 0.6 : 0, duration: 0.5 }}
          />
          {/* Top Right */}
          <motion.path
            d="M 120 41 L 169 41 L 169 120 L 120 120 Z"
            fill={riskColors[components[1]?.risk || 'medium']}
            initial={{ fillOpacity: animateOnLoad ? 0 : 0.8 }}
            animate={{ fillOpacity: 0.8 }}
            transition={{ delay: animateOnLoad ? 0.7 : 0, duration: 0.5 }}
          />
          {/* Bottom Left */}
          <motion.path
            d="M 71 120 L 120 120 L 120 206 C 105 197 85 178 71 145 Z"
            fill={riskColors[components[2]?.risk || 'low']}
            initial={{ fillOpacity: animateOnLoad ? 0 : 0.8 }}
            animate={{ fillOpacity: 0.8 }}
            transition={{ delay: animateOnLoad ? 0.8 : 0, duration: 0.5 }}
          />
          {/* Bottom Right */}
          <motion.path
            d="M 120 120 L 169 120 L 169 145 C 155 178 135 197 120 206 Z"
            fill={riskColors[components[3]?.risk || 'high']}
            initial={{ fillOpacity: animateOnLoad ? 0 : 0.8 }}
            animate={{ fillOpacity: 0.8 }}
            transition={{ delay: animateOnLoad ? 0.9 : 0, duration: 0.5 }}
          />
        </g>
        
        {/* Shield Engraved Cross (Grid) */}
        <path d="M 120 40 L 120 208 M 70 120 L 170 120" stroke="var(--color-brass)" strokeWidth="2" />

        {/* Motto Ribbon Base */}
        <motion.path
          d="M 50 240 Q 120 260 190 240 L 180 260 Q 120 280 60 260 Z"
          fill="var(--color-brass)"
          initial={{ scaleX: animateOnLoad ? 0 : 1, opacity: animateOnLoad ? 0 : 1 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: animateOnLoad ? 1.2 : 0, duration: 0.5 }}
          style={{ transformOrigin: 'center 250px' }}
        />
        
        {/* Motto Text */}
        <motion.text
          x="120"
          y="256"
          textAnchor="middle"
          fill="var(--color-ink)"
          className="font-ceremonial text-[10px] tracking-widest uppercase"
          initial={{ opacity: animateOnLoad ? 0 : 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animateOnLoad ? 1.5 : 0, duration: 0.5 }}
        >
          {motto}
        </motion.text>
      </svg>
    </div>
  );
};
