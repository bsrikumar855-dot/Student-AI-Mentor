import { z } from 'zod';

export const RiskBandSchema = z.enum(['low', 'med', 'high']);
export const MissionKindSchema = z.enum(['review', 'practice', 'academic', 'career', 'recovery', 'stretch']);

export const RiskComponentsSchema = z.object({
  score_gap: z.number(),
  syllabus_behind: z.number(),
  activity_recency: z.number(),
  trend: z.number(),
});

export const StudentRiskSchema = z.object({
  level: RiskBandSchema,
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  components: RiskComponentsSchema.optional(),
});

export const SubjectStateSchema = z.object({
  name: z.string(),
  score: z.number(),
  trend: z.array(z.number()),
  flag: z.boolean(),
});

export const ExamStateSchema = z.object({
  subject: z.string(),
  days_to_exam: z.number(),
  completion: z.number().min(0).max(1),
});

export const ActivityStateSchema = z.object({
  days_since_active: z.number(),
  days_since_commit: z.number(),
  days_since_linkedin: z.number(),
});

export const StudentStateSchema = z.object({
  student_id: z.string(),
  name: z.string(),
  email: z.string(),
  risk: StudentRiskSchema,
  subjects: z.array(SubjectStateSchema),
  exams: z.array(ExamStateSchema),
  activity: ActivityStateSchema,
  goals_met_streak: z.number(),
  days_since_leetcode: z.number(),
  leetcode_solved_count: z.number(),
  contribution_weeks: z.array(z.object({
    week_start: z.string(),
    commit_count: z.number(),
  })).length(12),
});

export const DailyTargetSchema = z.object({
  id: z.string(),
  task: z.string(),
  kind: MissionKindSchema,
  why: z.string(),
  why_source: z.enum(['decide', 'speak']),
  completed: z.boolean(),
});

export const ScheduleItemSchema = z.object({
  time: z.string(),
  title: z.string(),
  location: z.string().optional(),
});

export const InterventionSchema = z.object({
  id: z.string(),
  student_id: z.string(),
  student_name: z.string().optional(),
  action: z.string(),
  why: z.string(),
  kind: z.string(),
  auto: z.boolean(),
  approved: z.boolean().optional(),
  note: z.string().optional(),
});

export const PlanSchema = z.object({
  student_id: z.string(),
  generated_at: z.string(),
  missions: z.array(DailyTargetSchema),
  schedule: z.array(ScheduleItemSchema),
  intervention_triggered: z.boolean(),
  intervention: InterventionSchema.optional(),
});

export const TopicMemorySchema = z.object({
  topic: z.string(),
  subject: z.string(),
  why: z.string(),
  reps: z.number(),
  interval: z.number(),
  ease_factor: z.number(),
  due_date: z.string(),
});

export const InternshipMatchSchema = z.object({
  title: z.string(),
  company: z.string(),
  match: z.number().min(0).max(1),
  have_skills: z.array(z.string()),
  missing_skills: z.array(z.string()),
  why: z.string(),
});

export const PredictionResultSchema = z.object({
  projected_gpa: z.number(),
  exam_trend: z.enum(['improving', 'stable', 'declining']),
  exam_forecast: z.array(
    z.object({
      subject: z.string(),
      score: z.number(),
    })
  ),
  computed_at: z.string(),
});

export const ChatHistoryItemSchema = z.object({
  id: z.string(),
  sender: z.enum(['student', 'mentor']),
  message: z.string(),
  timestamp: z.string(),
  used_llm: z.boolean(),
});

export const CohortStudentSchema = z.object({
  student_id: z.string(),
  name: z.string(),
  risk: z.object({
    level: RiskBandSchema,
    score: z.number().min(0).max(100),
    reasons: z.array(z.string()),
  }),
});

// Infer TypeScript types from schemas
export type RiskBand = z.infer<typeof RiskBandSchema>;
export type MissionKind = z.infer<typeof MissionKindSchema>;
export type RiskComponents = z.infer<typeof RiskComponentsSchema>;
export type StudentRisk = z.infer<typeof StudentRiskSchema>;
export type SubjectState = z.infer<typeof SubjectStateSchema>;
export type ExamState = z.infer<typeof ExamStateSchema>;
export type ActivityState = z.infer<typeof ActivityStateSchema>;
export type StudentState = z.infer<typeof StudentStateSchema>;
export type DailyTarget = z.infer<typeof DailyTargetSchema>;
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;
export type Intervention = z.infer<typeof InterventionSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type TopicMemory = z.infer<typeof TopicMemorySchema>;
export type InternshipMatch = z.infer<typeof InternshipMatchSchema>;
export type PredictionResult = z.infer<typeof PredictionResultSchema>;
export type ChatHistoryItem = z.infer<typeof ChatHistoryItemSchema>;
export type CohortStudent = z.infer<typeof CohortStudentSchema>;
