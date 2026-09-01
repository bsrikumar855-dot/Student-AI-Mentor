import React from 'react';

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading telemetry data...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-drishta-dark border-t-transparent" />
      <span className="text-sm font-mono text-drishta-stone">{message}</span>
    </div>
  );
};

export default LoadingState;
