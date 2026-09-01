import React from 'react';
import { PageHeader } from '../../components/drishta/PageHeader';
import { EmptyState } from '../../components/drishta/EmptyState';
import { BookOpen } from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Spaced Repetition Reviews"
        subtitle="Active memory topics due for review based on SM-2 scheduling."
      />
      <EmptyState
        title="Review Queue Ready"
        description="Spaced repetition memory cards will be retrieved here."
        icon={<BookOpen className="h-6 w-6" />}
      />
    </div>
  );
};

export default ReviewsPage;
