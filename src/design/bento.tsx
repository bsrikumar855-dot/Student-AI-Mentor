import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

// Bento Grid - a simple CSS grid wrapper
interface BentoGridProps extends HTMLMotionProps<'div'> {
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ className = '', children, ...props }) => {
  return (
    <motion.div 
      className={`grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05 }
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Bento Card sizes
export type BentoSize = 'lg' | 'wide' | 'md' | 'sm' | 'none';

interface BentoCardProps extends HTMLMotionProps<'div'> {
  size?: BentoSize;
  className?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({ size = 'md', className = '', children, ...props }) => {
  // Map size to grid column spans
  const sizeClasses = {
    lg: 'col-span-1 md:col-span-2 row-span-2',
    wide: 'col-span-1 md:col-span-3',
    md: 'col-span-1',
    sm: 'col-span-1 sm:col-span-1', // compact usually used in nested grids anyway
    none: '', // No grid span classes
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
      }}
      className={`
        bg-surface border border-line rounded-[16px] overflow-hidden
        shadow-[0_1px_2px_rgba(22,32,42,.04),0_6px_20px_rgba(22,32,42,.05)]
        p-6 flex flex-col h-full transition-all duration-200
        ${props.onClick ? 'cursor-pointer hover:-translate-y-[2px]' : ''}
        ${sizeClasses[size]} ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};
