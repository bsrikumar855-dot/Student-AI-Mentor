import React from 'react';
import { PageHeader } from '../../components/drishta/PageHeader';
import { EmptyState } from '../../components/drishta/EmptyState';
import { TrendingUp } from 'lucide-react';

export const PredictionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictive Analytics"
        subtitle="Projected GPA trajectories and exam score forecasts."
      />
      <EmptyState
        title="Predictive Engine Ready"
        description="Forecast models will render GPA and exam trends here."
        icon={<TrendingUp className="h-6 w-6" />}
      />
    </div>
  );
};

export default PredictionsPage;
