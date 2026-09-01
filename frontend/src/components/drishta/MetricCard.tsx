import React from 'react';
import { GlassCard } from './GlassCard';
import { cn } from '../../lib/utils';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  className,
}) => {
  return (
    <GlassCard className={cn('flex flex-col justify-between space-y-2', className)}>
      <div className="flex items-center justify-between text-drishta-stone text-xs font-medium tracking-wide uppercase">
        <span>{label}</span>
        {icon && <div className="text-drishta-steel">{icon}</div>}
      </div>
      <div className="text-2xl font-bold font-mono text-drishta-dark tracking-tight">
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-drishta-stone font-medium">
          {subtext}
        </div>
      )}
    </GlassCard>
  );
};

export default MetricCard;
