import React from 'react';
import { PageHeader } from '../../components/drishta/PageHeader';
import { EmptyState } from '../../components/drishta/EmptyState';
import { Shield } from 'lucide-react';

export const InterventionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Intervention Review Center"
        subtitle="Review and approve human-in-the-loop interventions for high-risk students."
      />
      <EmptyState
        title="Intervention Queue Ready"
        description="Pending faculty interventions will be listed here for approval."
        icon={<Shield className="h-6 w-6" />}
      />
    </div>
  );
};

export default InterventionsPage;
