import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { useConsentStore } from '../features/consent/consentStore';
import {
  StudentStateSchema,
  PlanSchema,
  TopicMemorySchema,
  InternshipMatchSchema,
  PredictionResultSchema,
  CohortStudentSchema,
  InterventionSchema,
  CodingProfileSchema,
  type StudentState,
  type Plan,
  type TopicMemory,
  type InternshipMatch,
  type PredictionResult,
  type CohortStudent,
  type Intervention,
  type CodingProfile
} from './schemas';
import { z } from 'zod';

// 1. Fetch Student State
export function useStudentState(studentId: string) {
  const hasLmsConsent = useConsentStore((state) => state.lms);
  
  return useQuery({
    queryKey: ['state', studentId],
    queryFn: () => apiClient.get<StudentState>(`/students/${studentId}/state`, StudentStateSchema),
    enabled: !!studentId && hasLmsConsent,
  });
}

// 2. Fetch Student Plan
export function useStudentPlan(studentId: string) {
  const hasLmsConsent = useConsentStore((state) => state.lms);
  
  return useQuery({
    queryKey: ['plan', studentId],
    queryFn: () => apiClient.get<Plan>(`/students/${studentId}/plan`, PlanSchema),
    enabled: !!studentId && hasLmsConsent,
  });
}

// 3. Fetch Spaced Repetition Due Reviews
export function useReviews(studentId: string) {
  const hasLmsConsent = useConsentStore((state) => state.lms);
  
  return useQuery({
    queryKey: ['reviews', studentId],
    queryFn: () => apiClient.get<TopicMemory[]>(`/students/${studentId}/reviews`, z.array(TopicMemorySchema)),
    enabled: !!studentId && hasLmsConsent,
  });
}

// 4. Complete a mission task (Optimistic Mutation + Rollback)
export function useCompleteTask(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      apiClient.post<any>(`/students/${studentId}/tasks/${taskId}/complete`, { completed }),
    
    onMutate: async ({ taskId, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['plan', studentId] });
      await queryClient.cancelQueries({ queryKey: ['state', studentId] });

      // Snapshot current values
      const previousPlan = queryClient.getQueryData<Plan>(['plan', studentId]);
      const previousState = queryClient.getQueryData<StudentState>(['state', studentId]);

      // Optimistically update plan missions
      if (previousPlan) {
        queryClient.setQueryData<Plan>(['plan', studentId], {
          ...previousPlan,
          missions: previousPlan.missions.map((m) =>
            m.id === taskId ? { ...m, completed } : m
          ),
        });
      }

      // Optimistically update state streak
      if (previousState) {
        const diff = completed ? 1 : -1;
        queryClient.setQueryData<StudentState>(['state', studentId], {
          ...previousState,
          goals_met_streak: Math.max(0, previousState.goals_met_streak + diff),
        });
      }

      return { previousPlan, previousState };
    },
    
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousPlan) {
        queryClient.setQueryData(['plan', studentId], context.previousPlan);
      }
      if (context?.previousState) {
        queryClient.setQueryData(['state', studentId], context.previousState);
      }
    },
    
    onSettled: () => {
      // Invalidate to trigger server sync
      queryClient.invalidateQueries({ queryKey: ['plan', studentId] });
      queryClient.invalidateQueries({ queryKey: ['state', studentId] });
    },
  });
}

// 5. Grade Spaced Repetition Topic (Optimistic Mutation + Rollback)
export function useGradeReview(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topic, grade }: { topic: string; grade: number }) =>
      apiClient.post<TopicMemory>(
        `/students/${studentId}/reviews/${encodeURIComponent(topic)}/grade`,
        { quality: grade },
        TopicMemorySchema
      ),

    onMutate: async ({ topic, grade }) => {
      await queryClient.cancelQueries({ queryKey: ['reviews', studentId] });
      const previousReviews = queryClient.getQueryData<TopicMemory[]>(['reviews', studentId]);

      if (previousReviews) {
        // Remove completed review from the due-today list optimistically if grade >= 3
        if (grade >= 3) {
          queryClient.setQueryData<TopicMemory[]>(
            ['reviews', studentId],
            previousReviews.filter((m) => m.topic !== topic)
          );
        } else {
          // If grade < 3, keep in list but update reps
          queryClient.setQueryData<TopicMemory[]>(
            ['reviews', studentId],
            previousReviews.map((m) =>
              m.topic === topic ? { ...m, reps: 0, interval: 1 } : m
            )
          );
        }
      }

      return { previousReviews };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(['reviews', studentId], context.previousReviews);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', studentId] });
    },
  });
}

// 6. Fetch Internship Match Profiles (GATED BY GITHUB CONSENT)
export function useInternships(studentId: string) {
  const hasGithubConsent = useConsentStore((state) => state.github);

  return useQuery({
    queryKey: ['internships', studentId],
    queryFn: () => apiClient.get<InternshipMatch[]>(`/students/${studentId}/internships`, z.array(InternshipMatchSchema)),
    enabled: !!studentId && hasGithubConsent, // Gating: won't execute if consent is disabled
  });
}

// 6b. Fetch Coding Platform Profile (Codeforces) - GATED BY GITHUB CONSENT, same
// bucket as internships since both are "external developer profile" data.
export function useCodingProfile(studentId: string) {
  const hasGithubConsent = useConsentStore((state) => state.github);

  return useQuery({
    queryKey: ['coding', studentId],
    queryFn: () => apiClient.get<CodingProfile>(`/students/${studentId}/coding`, CodingProfileSchema),
    enabled: !!studentId && hasGithubConsent,
  });
}

// 7. Fetch GPA & Exam Forecast Predictions
export function usePredictions(studentId: string) {
  const hasLmsConsent = useConsentStore((state) => state.lms);

  return useQuery({
    queryKey: ['predictions', studentId],
    queryFn: () => apiClient.get<PredictionResult>(`/students/${studentId}/predictions`, PredictionResultSchema),
    enabled: !!studentId && hasLmsConsent,
  });
}

// 8. Fetch Cohort (Faculty view)
export function useCohort() {
  return useQuery({
    queryKey: ['cohort'],
    queryFn: () => apiClient.get<CohortStudent[]>('/students', z.array(CohortStudentSchema)),
  });
}

// 9. Fetch Interventions list (Faculty view)
export function useInterventions() {
  return useQuery({
    queryKey: ['interventions'],
    queryFn: () => apiClient.get<Intervention[]>('/interventions', z.array(InterventionSchema)),
  });
}

// 10. Approve/Override Intervention (Faculty)
export function useReviewIntervention() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved, note }: { id: string; approved: boolean; note?: string }) =>
      apiClient.post<Intervention>(
        `/interventions/${id}/review`,
        { decision: approved ? 'approve' : 'override', note },
        InterventionSchema
      ),
    
    onMutate: async ({ id, approved, note }) => {
      await queryClient.cancelQueries({ queryKey: ['interventions'] });
      const previousInterventions = queryClient.getQueryData<Intervention[]>(['interventions']);

      if (previousInterventions) {
        queryClient.setQueryData<Intervention[]>(
          ['interventions'],
          previousInterventions.map((i) =>
            i.id === id ? { ...i, approved, note } : i
          )
        );
      }

      return { previousInterventions };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousInterventions) {
        queryClient.setQueryData(['interventions'], context.previousInterventions);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      // Invalidate student plans as well since approved state is shared
      queryClient.invalidateQueries({ queryKey: ['plan'] });
    },
  });
}

// 11. Regenerate student plan (Faculty console)
export function useGeneratePlan(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post<Plan>(`/students/${studentId}/plan/generate`, {}, PlanSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', studentId] });
    },
  });
}

// 12. Ingest Cohort students upload mock (Faculty)
export function useIngestCohort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post<{ success: boolean; count: number; skipped: number }>('/ingest', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort'] });
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
    },
  });
}
