import React from 'react';
import { RiskLevel } from '../../types';
import { cn } from '../../lib/utils';

export interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, className }) => {
  const normalizedLevel = String(level).toLowerCase() as RiskLevel;

  const colorMap = {
    low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    high: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border',
        colorMap[normalizedLevel] || colorMap.medium,
        className
      )}
    >
      {normalizedLevel} {score !== undefined && `(${score})`}
    </span>
  );
};

export default RiskBadge;
