import React from 'react';
import { PageHeader } from '../../components/drishta/PageHeader';
import { EmptyState } from '../../components/drishta/EmptyState';
import { Code } from 'lucide-react';

export const CodingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Coding Platform Intelligence"
        subtitle="GitHub commits, LeetCode solutions, and Codeforces ratings."
      />
      <EmptyState
        title="Coding Telemetry Ready"
        description="Developer profile metrics and activity streaks will render here."
        icon={<Code className="h-6 w-6" />}
      />
    </div>
  );
};

export default CodingPage;
