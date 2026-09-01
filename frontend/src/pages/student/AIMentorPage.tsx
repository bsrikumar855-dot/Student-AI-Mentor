import React from 'react';
import { PageHeader } from '../../components/drishta/PageHeader';
import { EmptyState } from '../../components/drishta/EmptyState';
import { MessageSquare } from 'lucide-react';

export const AIMentorPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Academic Mentor"
        subtitle="Context-aware study guidance powered by student telemetry."
      />
      <EmptyState
        title="AI Mentor Ready"
        description="Interactive academic advisory chat session will load here."
        icon={<MessageSquare className="h-6 w-6" />}
      />
    </div>
  );
};

export default AIMentorPage;
