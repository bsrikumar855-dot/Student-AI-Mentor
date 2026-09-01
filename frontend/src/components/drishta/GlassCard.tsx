import React from 'react';
import { cn } from '../../lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'light',
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl p-5 shadow-sm transition-all duration-200',
        variant === 'light' ? 'glass-card text-drishta-dark' : 'glass-card-dark text-drishta-cream',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
