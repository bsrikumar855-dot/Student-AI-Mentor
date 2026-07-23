import React from 'react';
import { useStudentState, useStudentPlan, useGeneratePlan } from '../../../api/hooks';
import { Metric, KindTag } from '../../../design/primitives';
import { BentoGrid, BentoCard } from '../../../design/bento';
import { RiskCard, EmptyState, useToast, CodingActivityCard, ListPanel, ListRow } from '../../../components/components';
import { ArrowLeft, RefreshCw, Clock, Play } from 'lucide-react';

interface ConsoleDetailProps {
  studentId: string;
  onBackToCohort: () => void;
  onNavigateToReviews: () => void;
}

export const ConsoleDetailPage: React.FC<ConsoleDetailProps> = ({
  studentId,
  onBackToCohort,
  onNavigateToReviews
}) => {
  const { data: state, isLoading: stateLoading, error: stateError } = useStudentState(studentId);
  const { data: plan, isLoading: planLoading, error: planError } = useStudentPlan(studentId);
  const generatePlanMutation = useGeneratePlan(studentId);
  const { toast } = useToast();

  const handleRegeneratePlan = async () => {
    try {
      await generatePlanMutation.mutateAsync();
      toast(
        'Pathway Regenerated',
        `Re-initialized targets for ${state?.name || studentId}. Core audit log written.`,
        'decide'
      );
    } catch (err) {
      toast('Regeneration Failed', 'Could not sync pathway generation requests.', 'error');
    }
  };

  if (stateLoading || planLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-decide" />
        <span className="text-sm text-text-dim font-mono">Parsing student files...</span>
      </div>
    );
  }

  if (stateError || planError || !state || !plan) {
    return (
      <div className="max-w-md mx-auto py-10">
        <EmptyState
          title="Telemetry Link Error"
          description="Failed to resolve specific student directory data blocks."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToCohort}
            className="p-1.5 hover:bg-surface-2 border border-line rounded text-text-dim hover:text-text transition cursor-pointer"
            title="Return to Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-semibold text-text">{state.name}</h1>
              <span className="text-xs text-text-dim">({state.email})</span>
            </div>
            <p className="text-xs text-text-dim">ID: <Metric value={state.student_id} /></p>
          </div>
        </div>
        
        <div className="shrink-0 flex items-center space-x-2">
          {/* Action to regenerate plan */}
          <button
            onClick={handleRegeneratePlan}
            disabled={generatePlanMutation.isPending}
            className="px-4 py-2 bg-surface-2 hover:bg-line border border-line text-text rounded font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generatePlanMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Regenerate plan</span>
          </button>
        </div>
      </div>

      {/* Main split grid */}
      <BentoGrid>
        {/* Left Column: standing, components */}
        <div className="col-span-1 md:col-span-1 space-y-6">
          <RiskCard risk={state.risk} showBreakdown={true} />
          
          <BentoCard size="none" className="p-5 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-[10px] text-text-dim font-semibold uppercase tracking-wider block">Goals Met Streak</span>
            <div className="flex items-center space-x-1.5 font-bold text-3xl text-speak">
              <span>{state.goals_met_streak}</span>
              <span className="text-sm text-text-dim">days</span>
            </div>
          </BentoCard>

          <CodingActivityCard state={state} />
        </div>

        {/* Right Column: subjects and study pathway */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {/* Subjects List */}
          <BentoCard size="none" className="!p-0">
          <ListPanel title="Course Syllabus Performance">
            {state.subjects.map((sub, idx) => {
              const isDownward = sub.trend && sub.trend[sub.trend.length - 1] < sub.trend[0];
              const trend = isDownward ? 'declining' : 'improving';
              const dotColor = sub.flag ? 'bg-risk-high animate-pulse' : 'bg-guard';
              return (
                <ListRow
                  key={idx}
                  dotColorClass={dotColor}
                  label={sub.name}
                  subLabel={sub.flag ? 'Declining Deficit' : 'Stable'}
                  value={`${sub.score}%`}
                  trend={trend}
                />
              );
            })}
          </ListPanel>
          </BentoCard>

          {/* Current Pathway Plan */}
          <BentoCard size="none" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-base font-semibold text-text">Active Intervention Pathway</h3>
              <div className="flex items-center text-[10px] text-text-dim font-mono gap-1">
                <Clock className="w-3.5 h-3.5 text-decide" />
                <span>Generated: {new Date(plan.generated_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              {plan.missions.map((mission, idx) => (
                <div key={idx} className="p-3 bg-surface-2 border border-line rounded flex items-start justify-between space-x-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-text-dim flex items-center gap-1.5">
                      <KindTag kind={mission.kind} className="text-[9px]" />
                      <span>▎ Why: {mission.why}</span>
                    </span>
                    <p className="text-sm font-semibold text-text leading-tight">{mission.task}</p>
                  </div>
                  <div className="shrink-0 pt-1">
                    {mission.completed ? (
                      <span className="text-guard bg-guard-lo px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-guard/25">Completed</span>
                    ) : (
                      <span className="text-text-dim bg-surface-2 px-2 py-0.5 rounded text-[10px] uppercase font-mono border border-line">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* Faculty Intervention status & review queue portal */}
          {plan.intervention && (
            <BentoCard size="none" className="border-t-[3px] border-t-guard p-5 space-y-4">
              <div className="flex items-start justify-between space-x-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-guard block">
                    Safety Override Action Status
                  </span>
                  <h4 className="text-sm font-semibold text-text">{plan.intervention.action}</h4>
                  <p className="text-xs text-text-dim">{plan.intervention.why}</p>
                </div>
                <div className="shrink-0 pt-1">
                  {plan.intervention.approved ? (
                    <span className="text-guard bg-guard/10 border border-guard/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Approved</span>
                  ) : (
                    <div className="space-y-1.5 text-right">
                      <span className="text-speak bg-speak/10 border border-speak/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase block">Pending Review</span>
                      <button
                        onClick={onNavigateToReviews}
                        className="text-[10px] text-decide hover:underline font-semibold flex items-center gap-0.5 justify-end cursor-pointer"
                      >
                        <span>Open Levers</span>
                        <Play className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </BentoCard>
          )}
        </div>
      </BentoGrid>
    </div>
  );
};
