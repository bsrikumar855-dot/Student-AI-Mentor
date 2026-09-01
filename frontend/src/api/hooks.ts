/**
 * hooks.ts — Central barrel export for all TanStack Query hooks
 */

export { useStudentState } from '../features/students/hooks/useStudentState';
export { useCohort, useCohort as useStudents } from '../features/students/hooks/useCohort';
export { useRisk, useRisk as useStudentRisk } from '../features/risk/hooks/useRisk';
export { usePlan, usePlan as useStudentPlan } from '../features/plans/hooks/usePlan';
export { useGeneratePlan } from '../features/plans/hooks/useGeneratePlan';
export { usePredictions } from '../features/predictions/hooks/usePredictions';
export { useReviews } from '../features/reviews/hooks/useReviews';
export { useGradeReview } from '../features/reviews/hooks/useGradeReview';
export { useCompleteTask } from '../features/tasks/hooks/useCompleteTask';
export { useInternships } from '../features/internships/hooks/useInternships';
export { useCoding, useCoding as useCodingProfile } from '../features/coding/hooks/useCoding';
export { useInterventions } from '../features/interventions/hooks/useInterventions';
export { useReviewIntervention } from '../features/interventions/hooks/useReviewIntervention';
export { useChat } from '../features/chat/hooks/useChat';
export { useIngest, useIngest as useIngestCohort } from '../features/ingest/hooks/useIngest';
export { useDriftHero } from '../features/demo/hooks/useDriftHero';
export { useResetDemo } from '../features/demo/hooks/useResetDemo';
