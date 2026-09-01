import React from 'react';
import { PageHeader } from '../../components/drishta/PageHeader';
import { EmptyState } from '../../components/drishta/EmptyState';
import { Users } from 'lucide-react';

export const ConsolePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Operations Console"
        subtitle="Overview of student risk bands, drift indicators, and active interventions."
      />
      <EmptyState
        title="Cohort Telemetry Ready"
        description="Faculty risk matrix and student cohort list will render here."
        icon={<Users className="h-6 w-6" />}
      />
    </div>
  );
};

export default ConsolePage;
