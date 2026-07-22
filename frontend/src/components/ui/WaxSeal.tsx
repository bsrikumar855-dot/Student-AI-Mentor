import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WaxSealProps {
  show: boolean;
  color?: 'primary' | 'risk-high' | 'risk-medium' | 'brass';
  size?: 'sm' | 'md' | 'lg';
}

const colorMap = {
  primary: 'var(--color-primary)',
  'risk-high': 'var(--color-risk-high)',
  'risk-medium': 'var(--color-risk-medium)',
  brass: 'var(--color-brass)',
};

const sizeMap = {
  sm: 24,
  md: 40,
  lg: 64,
};

export const WaxSeal: React.FC<WaxSealProps> = ({
  show,
  color = 'primary',
  size = 'md',
}) => {
  const d = sizeMap[size];
  const fill = colorMap[color];

  return (
    <AnimatePresence>
      {show && (
        <div className="relative inline-flex items-center justify-center" style={{ width: d, height: d }}>
          {/* Faint brass ring ripple */}
          <motion.div
            className="absolute rounded-full border border-brass-bright"
            initial={{ width: d, height: d, opacity: 0.8 }}
            animate={{ width: d * 1.5, height: d * 1.5, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
          />

          {/* The Wax Stamp Squash */}
          <motion.svg
            width={d}
            height={d}
            viewBox="0 0 100 100"
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ 
              scale: [1.3, 0.9, 1], 
              opacity: 1 
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.4, 
              times: [0, 0.7, 1],
              ease: "circOut" 
            }}
            style={{ transformOrigin: 'center' }}
            className="drop-shadow-md"
          >
            {/* Irregular wax shape base */}
            <path
              d="M 50 5 C 70 2, 90 15, 95 35 C 98 55, 85 85, 60 95 C 35 102, 10 85, 5 60 C 2 35, 20 10, 50 5 Z"
              fill={fill}
            />
            
            {/* Inner pressed ring */}
            <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            
            {/* Minimal insignia (ivy leaf / crest abstract) */}
            <path
              d="M 50 25 C 60 40, 70 50, 50 75 C 30 50, 40 40, 50 25 Z"
              fill="rgba(0,0,0,0.2)"
            />
          </motion.svg>
        </div>
      )}
    </AnimatePresence>
  );
};
