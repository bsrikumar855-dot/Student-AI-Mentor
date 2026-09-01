import React from 'react';
import { RiskLevel } from '../../types';
import { cn } from '../../lib/utils';

export interface RiskIndicatorProps {
  level: RiskLevel | string;
  score: number;
  className?: string;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ score, className }) => {
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      <div className="flex justify-between text-xs font-mono font-medium text-drishta-stone">
        <span>Academic Drift Score</span>
        <span>{clampedScore}/100</span>
      </div>
      <div className="w-full bg-drishta-blue/30 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            clampedScore < 30
              ? 'bg-emerald-500'
              : clampedScore < 60
              ? 'bg-amber-500'
              : 'bg-rose-500'
          )}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
};

export default RiskIndicator;
