import React from 'react';
import { PageHeader } from '../../components/drishta/PageHeader';
import { EmptyState } from '../../components/drishta/EmptyState';
import { User } from 'lucide-react';

export const MePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Plan & Academic Standing"
        subtitle="Individual performance trajectory, subject breakdown, and active study plan."
      />
      <EmptyState
        title="Standing Telemetry Ready"
        description="Student standing metrics and study plan will display here."
        icon={<User className="h-6 w-6" />}
      />
    </div>
  );
};

export default MePage;
