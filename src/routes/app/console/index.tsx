import React from 'react';
import { useSearch } from '@tanstack/react-router';
import { useCohort, useIngestCohort } from '../../../api/hooks';
import { Metric, RiskBand } from '../../../design/primitives';
import { BentoGrid, BentoCard } from '../../../design/bento';
import { EmptyState, useToast, ListPanel } from '../../../components/components';
import { Users, FileDown, Plus, ChevronDown, ChevronUp, ExternalLink, Upload, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ConsolePageProps {
  onNavigateToStudentDetail: (id: string) => void;
}

export const ConsolePage: React.FC<ConsolePageProps> = ({ onNavigateToStudentDetail }) => {
  const { data: cohort, isLoading, error } = useCohort();
  const ingestMutation = useIngestCohort();
  const { toast } = useToast();
  const { q } = useSearch({ from: '/app/console' }) as { q?: string };
  const searchQuery = q || '';

  const [activeTab, setActiveTab] = React.useState<'at-risk' | 'on-track' | 'improved'>('at-risk');
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await ingestMutation.mutateAsync(formData);
      toast('Cohort Ingestion Completed', '30 students ingested, 1 row skipped.', 'guard');
      setIsIngestModalOpen(false);
      setSelectedFile(null);
    } catch (err) {
      toast('Ingestion Failed', 'Check file formatting and headers.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-decide" />
        <span className="text-sm text-text-dim font-mono">Loading cohort statistics...</span>
      </div>
    );
  }

  if (error || !cohort) {
    return (
      <div className="max-w-md mx-auto py-10">
        <EmptyState
          title="Cohort Registry Offline"
          description="Failed to resolve student directory records. Confirm MSW handlers are running."
        />
      </div>
    );
  }

  // Filter cohort based on active segment tab AND search query
  const filteredCohort = cohort.filter((student) => {
    let matchesTab = true;
    if (activeTab === 'at-risk') {
      matchesTab = student.risk.level === 'high' || student.risk.level === 'med';
    } else if (activeTab === 'on-track') {
      matchesTab = student.risk.level === 'low';
    } else if (activeTab === 'improved') {
      matchesTab = student.risk.score < 20;
    }

    let matchesSearch = true;
    if (searchQuery) {
      matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-text-dim">
            COHORT OVERVIEW
          </span>
          <h1 className="text-3xl font-display font-medium text-text flex items-center gap-2">
            <Users className="w-7 h-7 text-decide" />
            <span>Student Advisor Directory</span>
          </h1>
        </div>
        <div className="shrink-0 flex items-center space-x-2">
          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="px-4 py-2 bg-decide hover:bg-decide/90 text-white rounded font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg glow-decide"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest cohort</span>
          </button>
        </div>
      </div>

      {/* Cohort Stats summary strips */}
      <BentoGrid className="!gap-4 md:!gap-6">
        <BentoCard size="md" className="p-5 space-y-1">
          <span className="text-[10px] text-text-dim uppercase tracking-wider block">Total Directory</span>
          <Metric value={cohort.length} className="text-3xl font-bold text-text" />
        </BentoCard>
        <BentoCard size="md" className="p-5 border-l-[3px] border-l-risk-high space-y-1">
          <span className="text-[10px] text-text-dim uppercase tracking-wider block text-risk-high">At-Risk Alert</span>
          <Metric value={cohort.filter(s => s.risk.level === 'high').length} className="text-3xl font-bold text-risk-high" />
        </BentoCard>
        <BentoCard size="md" className="p-5 border-l-[3px] border-l-guard space-y-1">
          <span className="text-[10px] text-text-dim uppercase tracking-wider block text-guard">Stable / On-track</span>
          <Metric value={cohort.filter(s => s.risk.level === 'low').length} className="text-3xl font-bold text-guard" />
        </BentoCard>
      </BentoGrid>

      {/* Segment Tabs */}
      <div className="flex border-b border-line">
        {(['at-risk', 'on-track', 'improved'] as const).map((tab) => {
          const isActive = activeTab === tab;
          let label = 'At-Risk Alerts';
          if (tab === 'on-track') label = 'On-Track';
          if (tab === 'improved') label = 'Optimal (<20 Score)';

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
                isActive 
                  ? 'border-decide text-decide' 
                  : 'border-transparent text-text-dim hover:text-text'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Directory List Panel */}
      <BentoCard size="none" className="!p-0">
        <ListPanel title="Cohort Registry" className="border-0 shadow-none">
          {filteredCohort.length === 0 ? (
            <div className="py-8 text-center text-text-dim text-xs">
              No student profiles matched this search or segment filter.
            </div>
          ) : (
            filteredCohort.map((student) => {
              const isExpanded = expandedRow === student.student_id;
              const isHigh = student.risk.score > 70;
              const isMed = student.risk.score > 40 && student.risk.score <= 70;
              const dotColor = isHigh 
                ? 'bg-risk-high animate-pulse'
                : isMed 
                  ? 'bg-risk-med'
                  : 'bg-risk-low';

              const trend = student.risk.score > 50 ? 'declining' : 'improving';

              return (
                <div key={student.student_id} className="divide-y divide-line/40">
                  <div 
                    onClick={() => onNavigateToStudentDetail(student.student_id)}
                    className="flex items-center justify-between py-4 px-5 hover:bg-surface-2/50 transition-colors cursor-pointer"
                  >
                    {/* Dot + Name + primary reason */}
                    <div className="flex items-center space-x-4 min-w-0">
                      <span className={`w-3 h-3 rounded-full ${dotColor} shrink-0 shadow-sm`} />
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold text-text truncate">{student.name}</p>
                        <p className="text-xs text-text-dim truncate max-w-[250px] sm:max-w-md font-mono">
                          {student.risk.reasons[0] || 'No flags active'}
                        </p>
                      </div>
                    </div>

                    {/* Mono Score + Trend arrow + actions */}
                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-right flex items-center space-x-2 mr-2 bg-surface-2 px-2.5 py-1 rounded-md border border-line">
                        <Metric value={student.risk.score} className="text-sm font-bold font-mono" />
                        {trend === 'improving' ? (
                          <ArrowUpRight className="w-4 h-4 text-guard shrink-0" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-risk-high shrink-0" />
                        )}
                      </div>

                      <RiskBand score={student.risk.score} className="hidden sm:inline-flex" />

                      <div className="flex items-center space-x-1 border-l border-line pl-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRow(expandedRow === student.student_id ? null : student.student_id);
                          }}
                          className="p-1.5 hover:bg-surface border border-line rounded-lg text-text-dim hover:text-text transition cursor-pointer"
                          title="Toggle decision audit details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToStudentDetail(student.student_id);
                          }}
                          className="p-1.5 hover:bg-decide-lo hover:border-decide/30 border border-line rounded-lg text-decide transition cursor-pointer"
                          title="Open student dashboard"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-surface-2/30 px-6 py-4 border-t border-line/40 space-y-3">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-text-dim block border-b border-line pb-1">
                        Decision Audit Reasons
                      </span>
                      <div className="space-y-2">
                        {student.risk.reasons.map((r, rIdx) => (
                          <div key={rIdx} className="text-xs text-text bg-decide-lo/50 border-l-[3px] border-l-decide py-2 px-3 rounded text-balance">
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </ListPanel>
      </BentoCard>

      {/* Ingest cohort Dialog Modal (Custom implementation matching Radix spec styled to glass) */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <BentoCard size="none" className="w-full max-w-md p-6 relative animate-zoom-in space-y-4 shadow-2xl">
            <button
              onClick={() => setIsIngestModalOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-text text-sm p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-text flex items-center gap-1.5">
                <Upload className="w-5 h-5 text-decide" />
                <span>Ingest Cohort Telemetry</span>
              </h3>
              <p className="text-xs text-text-dim">
                Select a CSV spreadsheet format cohort file. Replaces simulated database values.
              </p>
            </div>

            <form onSubmit={handleIngestSubmit} className="space-y-4">
              <div className="border border-dashed border-line hover:border-decide/50 rounded-lg p-6 text-center space-y-2 transition-colors cursor-pointer relative bg-surface-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
                <FileDown className="w-8 h-8 text-text-dim mx-auto" />
                <div className="text-xs text-text">
                  {selectedFile ? (
                    <strong className="text-guard font-semibold">{selectedFile.name}</strong>
                  ) : (
                    <span>Drag and drop cohort.csv or click to browse</span>
                  )}
                </div>
                <span className="text-[10px] text-text-dim block">Supports UTF-8 CSV up to 10MB</span>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || ingestMutation.isPending}
                className="w-full py-2 bg-decide hover:bg-decide/90 text-white rounded font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40"
              >
                {ingestMutation.isPending ? 'Processing ingestion...' : 'Start Cohort Parse'}
              </button>
            </form>
          </BentoCard>
        </div>
      )}
    </div>
  );
};
