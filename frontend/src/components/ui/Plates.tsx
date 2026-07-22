import React from 'react';
import { cn } from '../../lib/utils';

export const Plate: React.FC<{ children: React.ReactNode; className?: string; pressed?: boolean }> = ({ children, className, pressed = false }) => (
  <div className={cn(
    "bg-surface border border-hairline rounded shadow-sm transition-shadow",
    pressed ? "pressed-plate" : "lift-shadow",
    className
  )}>
    {children}
  </div>
);

export const EngravedText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn("engraved-text font-medium text-ink", className)}>
    {children}
  </span>
);

export const BrassRule: React.FC<{ className?: string }> = ({ className }) => (
  <hr className={cn("border-t border-brass opacity-50 my-4", className)} />
);
