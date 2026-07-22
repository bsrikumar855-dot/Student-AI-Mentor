import React from 'react';
import { useStudentState, useStudentPlan, useCompleteTask } from '../../../api/hooks';
import { BentoGrid, BentoCard } from '../../../design/bento';
import {
  StreakPip,
  MentorMessage,
  MissionRow,
  InterventionBanner,
  EmptyState,
  useToast
} from '../../../components/components';
import { Calendar, Clock, MapPin, Sparkles } from 'lucide-react';

export const TodayPage: React.FC = () => {
  const studentId = localStorage.getItem('drishta_student_id') || 'student_1';
  const { data: state, isLoading: stateLoading, error: stateError } = useStudentState(studentId);
  const { data: plan, isLoading: planLoading, error: planError } = useStudentPlan(studentId);
  const completeTaskMutation = useCompleteTask(studentId);
  const { toast } = useToast();

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await completeTaskMutation.mutateAsync({ taskId, completed });
      toast(
        completed ? 'Target Completed' : 'Target Restored',
        completed 
          ? 'Great job! Your daily streak has been updated.' 
          : 'Task restored to your queue.',
        'decide'
      );
    } catch (err: any) {
      toast('Mutation Failed', 'Could not sync completion to database. Reverting.', 'error');
    }
  };

  if (stateLoading || planLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-decide" />
        <span className="text-sm text-text-dim font-mono">Fetching student state from Core...</span>
      </div>
    );
  }

  if (stateError || planError || !state || !plan) {
    return (
      <div className="max-w-md mx-auto py-10">
        <EmptyState
          title="Network Sync Interrupted"
          description="We failed to resolve student records from the server boundary. Ensure the mock worker is running."
        />
      </div>
    );
  }

  // Greeting based on time of day
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 w-full">
      {/* Upper header section */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-text-dim">
            STUDENT PATHWAY
          </span>
          <h1 className="text-3xl font-display font-medium italic text-text">
            {getGreeting()}, {state.name}
          </h1>
        </div>
        <div className="shrink-0">
          <StreakPip streak={state.goals_met_streak} />
        </div>
      </div>

      <BentoGrid>
        {/* 1. Governance Safety Intervention Banner (if triggered) */}
        {plan.intervention_triggered && plan.intervention && (
          <BentoCard size="wide" className="!p-0 border-risk-high/30">
            <InterventionBanner intervention={plan.intervention} />
          </BentoCard>
        )}

        {/* 2. Mentor Message (LLM Voice) */}
        <BentoCard size="wide" className="!p-0">
          <MentorMessage
            message={`Welcome back, ${state.name.split(' ')[0]}. Today, we need to focus on lifting your Discrete Math understanding. I've prepared 4 critical targets based on your latest topic reviews. Let's make today count!`}
          />
        </BentoCard>

        {/* 3. Daily Target Missions */}
        <BentoCard size="lg" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-decide" />
              <span>Today's Missions</span>
            </h2>
            <span className="text-sm text-text-dim font-mono bg-surface-2 px-3 py-1 rounded-full border border-line">
              {plan.missions.filter((m) => m.completed).length} / {plan.missions.length} Done
            </span>
          </div>

          <div className="space-y-4">
            {plan.missions.length === 0 ? (
              <EmptyState
                title="All targets clear"
                description="Your study path has no active missions assigned for today. Memory tracks are stable."
              />
            ) : (
              plan.missions.map((mission, index) => (
                <div
                  key={mission.id}
                  className="animate-stagger-item"
                  style={{ animationDelay: `${(index + 2) * 40}ms`, animationFillMode: 'both' }}
                >
                  <MissionRow
                    mission={mission}
                    onToggle={(completed) => handleToggleTask(mission.id, completed)}
                    isPending={completeTaskMutation.isPending}
                  />
                </div>
              ))
            )}
          </div>
        </BentoCard>

        {/* 4. Schedule Calendar */}
        <BentoCard size="md" className="space-y-6">
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            <Calendar className="w-5 h-5 text-guard" />
            <span>Schedule</span>
          </h2>

          <div className="divide-y divide-line">
            {plan.schedule.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between py-4 first:pt-0 last:pb-0">
                <div className="space-y-1.5">
                  <h4 className="text-[15px] font-semibold text-text">{item.title}</h4>
                  {item.location && (
                    <div className="flex items-center text-sm text-text-dim space-x-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{item.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-xs text-text-dim space-x-1.5 font-mono bg-surface-2 border border-line px-2.5 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-decide" />
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </BentoGrid>
    </div>
  );
};
