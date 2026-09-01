import React from 'react';
import { PageHeader } from '../../components/drishta/PageHeader';
import { EmptyState } from '../../components/drishta/EmptyState';
import { Upload } from 'lucide-react';

export const IngestPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Data Ingestion"
        subtitle="Upload Excel/CSV cohort datasets to ingest new student records."
      />
      <EmptyState
        title="Ingestion Pipeline Ready"
        description="File dropzone and cohort ingestion pipeline will be rendered here."
        icon={<Upload className="h-6 w-6" />}
      />
    </div>
  );
};

export default IngestPage;
