import React from 'react';
import { useStudentState } from '../../../api/hooks';
import { CompletionRing } from '../../../design/charts';
import { BentoGrid, BentoCard } from '../../../design/bento';
import { RiskCard, EmptyState, CodingActivityCard, ListPanel, ListRow } from '../../../components/components';
import { Metric } from '../../../design/primitives';
import { Clock, MonitorPlay, Terminal } from 'lucide-react';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Github = GithubIcon;
const Linkedin = LinkedinIcon;

export const MePage: React.FC = () => {
  const studentId = localStorage.getItem('drishta_student_id') || 'student_1';
  const { data: state, isLoading, error } = useStudentState(studentId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-decide" />
        <span className="text-sm text-text-dim font-mono">Loading standing telemetry...</span>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="max-w-md mx-auto py-10">
        <EmptyState
          title="Telemetry Load Interrupted"
          description="Failed to retrieve student performance state from the LMS API gateway. Ensure MSW is initialized."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-1">
        <span className="text-xs font-mono uppercase tracking-wider text-text-dim">
          ACADEMIC STANDING
        </span>
        <h1 className="text-3xl font-display font-medium text-text">Your Standing</h1>
      </div>

      <BentoGrid>
        {/* Left Column (takes 2/3 on desktop) - Using BentoCard lg spans */}
        
        {/* 1. Core Risk Card (Explainable Factors + 4-bar vector breakdown) */}
        <BentoCard size="wide" className="!p-0 border-0 shadow-none bg-transparent">
           <RiskCard risk={state.risk} showBreakdown={true} />
        </BentoCard>

        {/* 2. Course Syllabus Status Table */}
        <BentoCard size="lg" className="!p-0">
          <ListPanel title="Active Course Status">
            {state.subjects.map((sub, idx) => {
              const isDownward = sub.trend && sub.trend[sub.trend.length - 1] < sub.trend[0];
              const trend = isDownward ? 'declining' : 'improving';
              const dotColor = sub.flag ? 'bg-risk-high animate-pulse' : 'bg-guard';
              return (
                <ListRow
                  key={idx}
                  dotColorClass={dotColor}
                  label={sub.name}
                  subLabel={sub.flag ? 'Action Required' : 'Stable'}
                  value={`${sub.score}%`}
                  trend={trend}
                />
              );
            })}
          </ListPanel>
        </BentoCard>

        {/* 3. Upcoming Milestone Exam Strip */}
        <BentoCard size="md" className="space-y-4">
          <h3 className="text-base font-semibold text-text">Upcoming Exam Deadlines</h3>
          <div className="flex flex-col gap-3">
            {state.exams.map((exam, idx) => (
              <div key={idx} className="p-3 bg-surface-2 border border-line rounded-lg flex items-center justify-between space-x-4">
                <div className="space-y-1 min-w-0">
                  <h4 className="text-xs font-semibold text-text truncate" title={exam.subject}>
                    {exam.subject}
                  </h4>
                  <p className="text-xs text-text-dim flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-decide" />
                    <span>
                      In <Metric value={exam.days_to_exam} className="text-xs text-text font-bold" /> days
                    </span>
                  </p>
                </div>
                <div className="shrink-0">
                  <CompletionRing completion={exam.completion} size={42} />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* 4. Activity Integrations status row - Spans full wide area */}
        <div className="col-span-1 md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Counter 1: Platform Inactivity */}
          <BentoCard size="none" className="p-5 flex flex-col items-center justify-center text-center space-y-2">
            <MonitorPlay className="w-6 h-6 text-decide mb-1" />
            <span className="text-[10px] text-text-dim uppercase tracking-wider">Inactivity</span>
            <div className="flex items-baseline space-x-0.5">
              <Metric value={state.activity.days_since_active} className="text-2xl font-bold" />
              <span className="text-[10px] text-text-dim font-mono">days</span>
            </div>
          </BentoCard>

          {/* Counter 2: Github Integrations */}
          <BentoCard size="none" className="p-5 flex flex-col items-center justify-center text-center space-y-2">
            <Github className="w-6 h-6 text-guard mb-1" />
            <span className="text-[10px] text-text-dim uppercase tracking-wider">Last Commit</span>
            <div className="flex items-baseline space-x-0.5">
              <Metric value={state.activity.days_since_commit} className="text-2xl font-bold" />
              <span className="text-[10px] text-text-dim font-mono">days</span>
            </div>
          </BentoCard>

          {/* Counter 3: LeetCode Inactivity */}
          <BentoCard size="none" className="p-5 flex flex-col items-center justify-center text-center space-y-2">
            <Terminal className="w-6 h-6 text-speak mb-1" />
            <span className="text-[10px] text-text-dim uppercase tracking-wider">LeetCode Gap</span>
            <div className="flex items-baseline space-x-0.5">
              <Metric value={state.days_since_leetcode} className="text-2xl font-bold" />
              <span className="text-[10px] text-text-dim font-mono">days</span>
            </div>
          </BentoCard>

          {/* Counter 4: LinkedIn Connector */}
          <BentoCard size="none" className="p-5 flex flex-col items-center justify-center text-center space-y-2">
            <Linkedin className="w-6 h-6 text-speak mb-1" opacity="0.6" />
            <span className="text-[10px] text-text-dim uppercase tracking-wider">LinkedIn Gap</span>
            <div className="flex items-baseline space-x-0.5">
              <Metric value={state.activity.days_since_linkedin} className="text-2xl font-bold" />
              <span className="text-[10px] text-text-dim font-mono">days</span>
            </div>
          </BentoCard>
        </div>

        {/* 5. Coding Activity Detail (ContributionStrip & Solved counts) */}
        <BentoCard size="wide" className="!p-0 border-0 shadow-none bg-transparent">
          <CodingActivityCard state={state} />
        </BentoCard>

      </BentoGrid>
    </div>
  );
};
