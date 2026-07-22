import React from 'react';
import { usePredictions } from '../../../api/hooks';
import { EmptyState, ChartCard } from '../../../components/components';
import { BentoGrid, BentoCard } from '../../../design/bento';
import { TrendingUp, Clock, HelpCircle } from 'lucide-react';

export const PredictionsPage: React.FC = () => {
  const studentId = localStorage.getItem('drishta_student_id') || 'student_1';
  const { data: forecast, isLoading, error } = usePredictions(studentId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-decide" />
        <span className="text-sm text-text-dim font-mono">Running predictive models...</span>
      </div>
    );
  }

  if (error || !forecast) {
    return (
      <div className="max-w-md mx-auto py-10">
        <EmptyState
          title="Prediction Engine Offline"
          description="Failed to resolve GPA projections from the core calculation models. Ensure MSW is operational."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-1">
        <span className="text-xs font-mono uppercase tracking-wider text-text-dim">
          DETERMINISTIC PREDICTIONS
        </span>
        <h1 className="text-3xl font-display font-medium text-text flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-decide" />
          <span>Academic Forecasts</span>
        </h1>
      </div>

      <BentoGrid>
        <ChartCard
          title="Projected GPA"
          value={forecast.projected_gpa.toFixed(2)}
          caption="projection, not a promise"
          chartData={forecast.exam_forecast}
          className="col-span-1 md:col-span-3"
        />

        {/* Freshness/Audit trail marker */}
        <BentoCard size="md" className="space-y-4">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2 border-b border-line pb-2">
            <Clock className="w-4 h-4 text-decide" />
            <span>Audit Trail</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs text-text-dim">
              <div className="w-1.5 h-1.5 rounded-full bg-guard shrink-0" />
              <span>Calculated: {new Date(forecast.computed_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-text-dim">
              <div className="w-1.5 h-1.5 rounded-full bg-speak shrink-0" />
              <span>Core engine model v1.4.2</span>
            </div>
          </div>
        </BentoCard>

        {/* Info Card */}
        <BentoCard size="lg" className="space-y-4 bg-surface-2 border-line">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2 border-b border-line pb-2">
            <HelpCircle className="w-4 h-4 text-speak" />
            <span>How to read this forecast</span>
          </h3>
          <p className="text-sm text-text-dim">
            This projection is deterministically calculated from your current standing, historical performance velocity, and upcoming syllabus weight. 
            <strong className="text-text font-medium block mt-2">It is a projection, not a promise.</strong>
            Any deviation in effort will shift the curve.
          </p>
        </BentoCard>
      </BentoGrid>
    </div>
  );
};
