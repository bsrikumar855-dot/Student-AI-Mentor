import React from 'react';
import { PageHeader } from '../../components/drishta/PageHeader';
import { EmptyState } from '../../components/drishta/EmptyState';
import { Briefcase } from 'lucide-react';

export const InternshipsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Career & Internships"
        subtitle="AI-matched internship opportunities based on skill alignment."
      />
      <EmptyState
        title="Internship Engine Ready"
        description="Matched industry opportunities and skill gaps will appear here."
        icon={<Briefcase className="h-6 w-6" />}
      />
    </div>
  );
};

export default InternshipsPage;
