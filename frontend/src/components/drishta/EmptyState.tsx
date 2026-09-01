import React from 'react';
import { GlassCard } from './GlassCard';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <GlassCard className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      {icon && <div className="p-3 bg-drishta-blue/20 rounded-full text-drishta-dark">{icon}</div>}
      <h3 className="text-lg font-semibold text-drishta-dark">{title}</h3>
      <p className="text-sm text-drishta-stone max-w-sm">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </GlassCard>
  );
};

export default EmptyState;
