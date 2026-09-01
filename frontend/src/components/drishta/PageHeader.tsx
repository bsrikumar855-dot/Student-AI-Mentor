import React from 'react';
import { cn } from '../../lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-drishta-steel/20 mb-6 gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-drishta-dark">{title}</h1>
        {subtitle && <p className="text-sm text-drishta-stone mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center space-x-3">{action}</div>}
    </div>
  );
};

export default PageHeader;
