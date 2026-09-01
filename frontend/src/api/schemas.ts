import { z } from 'zod';

export const RiskReasonSchema = z.object({
  code: z.string(),
  description: z.string(),
  weight: z.number().optional(),
});

export const StudentRiskSchema = z.object({
  level: z.enum(['low', 'medium', 'high', 'Low', 'Medium', 'High']).transform((val) => val.toLowerCase() as 'low' | 'medium' | 'high'),
  score: z.number(),
  reasons: z.array(z.string()).or(z.array(RiskReasonSchema)).default([]),
});

export const SubjectPerformanceSchema = z.object({
  code: z.string(),
  name: z.string(),
  attendance: z.number(),
  marks: z.number(),
  grade: z.string().optional(),
});

export const StudentActivitySchema = z.object({
  days_inactive: z.number().default(0),
  last_login: z.string().optional(),
  submission_streak: z.number().default(0),
});

export const StudentStateSchema = z.object({
  student_id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  risk: StudentRiskSchema,
  subjects: z.array(SubjectPerformanceSchema).default([]),
  activity: StudentActivitySchema.optional(),
  goals_met_streak: z.number().default(0),
});

export const CohortStudentSchema = z.object({
  student_id: z.string(),
  name: z.string(),
  risk: StudentRiskSchema,
});

export const TaskItemSchema = z.object({
  task_id: z.string(),
  title: z.string(),
  subject: z.string().optional(),
  estimated_minutes: z.number().optional(),
  completed: z.boolean().default(false),
  due_date: z.string().optional(),
});

export const DailyTargetSchema = z.object({
  day: z.string(),
  date: z.string().optional(),
  tasks: z.array(TaskItemSchema).default([]),
  completed: z.boolean().default(false),
});

export const ScheduleSlotSchema = z.object({
  time: z.string(),
  title: z.string(),
  location: z.string().optional(),
  type: z.string().optional(),
});

export const PlanInterventionSchema = z.object({
  id: z.string(),
  kind: z.string(),
  action: z.string(),
  status: z.string(),
});

export const PlanSchema = z.object({
  student_id: z.string(),
  created_at: z.string().optional(),
  daily_targets: z.array(DailyTargetSchema).default([]),
  schedule: z.array(ScheduleSlotSchema).default([]),
  interventions: z.array(PlanInterventionSchema).default([]),
  missions: z.array(TaskItemSchema).optional(),
});

export const PredictionResultSchema = z.object({
  projected_gpa: z.number(),
  exam_trend: z.string().optional(),
  exam_forecast: z.array(
    z.object({
      subject: z.string(),
      score: z.number(),
    })
  ).default([]),
  computed_at: z.string().optional(),
});

export const InternshipMatchSchema = z.object({
  title: z.string(),
  company: z.string(),
  match: z.number(),
  have_skills: z.array(z.string()).default([]),
  missing_skills: z.array(z.string()).default([]),
  why: z.string().optional(),
});

export const CodingProfileSchema = z.object({
  student_id: z.string(),
  github: z.string().optional(),
  leetcode: z.string().optional(),
  codeforces: z.string().optional(),
  commits_30d: z.number().default(0),
  problems_solved: z.number().default(0),
  rating: z.number().default(0),
  languages: z.array(z.string()).default([]),
  active_days: z.number().default(0),
  last_commit: z.string().optional(),
});

export const ReviewTopicSchema = z.object({
  topic: z.string(),
  subject: z.string(),
  why: z.string().optional(),
  reps: z.number().default(0),
  interval: z.number().default(1),
  ease_factor: z.number().default(2.5),
  due_date: z.string().optional(),
});

export const CompleteTaskResponseSchema = z.object({
  task_id: z.string(),
  completed: z.boolean(),
  completed_at: z.string().optional(),
  plan: PlanSchema.optional(),
});

export const InterventionSchema = z.object({
  id: z.string(),
  student_id: z.string(),
  student_name: z.string().optional(),
  action: z.string(),
  why: z.string(),
  kind: z.string(),
  auto: z.boolean().default(false),
  status: z.string(),
  approved: z.boolean().optional(),
});

export const IngestResultSchema = z.object({
  ingested: z.number(),
  student_ids: z.array(z.string()).default([]),
  skipped: z.array(
    z.object({
      student_id: z.string(),
      reason: z.string(),
    })
  ).default([]),
});

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const ChatRequestSchema = z.object({
  student_id: z.string(),
  message: z.string(),
  history: z.array(ChatMessageSchema).optional(),
});

export const ChatResponseSchema = z.object({
  reply: z.string(),
  used_llm: z.boolean().default(false),
});

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

export type StudentState = z.infer<typeof StudentStateSchema>;
export type StudentRisk = z.infer<typeof StudentRiskSchema>;
export type CohortStudent = z.infer<typeof CohortStudentSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type PredictionResult = z.infer<typeof PredictionResultSchema>;
export type InternshipMatch = z.infer<typeof InternshipMatchSchema>;
export type CodingProfile = z.infer<typeof CodingProfileSchema>;
export type ReviewTopic = z.infer<typeof ReviewTopicSchema>;
export type CompleteTaskResponse = z.infer<typeof CompleteTaskResponseSchema>;
export type Intervention = z.infer<typeof InterventionSchema>;
export type IngestResult = z.infer<typeof IngestResultSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
