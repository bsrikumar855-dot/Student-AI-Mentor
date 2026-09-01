import React from 'react';
import { PageHeader } from '../../components/drishta/PageHeader';
import { EmptyState } from '../../components/drishta/EmptyState';
import { Calendar } from 'lucide-react';

export const TodayPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Dashboard"
        subtitle="Daily academic schedule, active targets, and telemetry overview."
      />
      <EmptyState
        title="Dashboard Ready for Hydration"
        description="Connect your student telemetry context to surface today's study plan."
        icon={<Calendar className="h-6 w-6" />}
      />
    </div>
  );
};

export default TodayPage;
