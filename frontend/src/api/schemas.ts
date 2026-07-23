import { z } from 'zod';

export const RiskBandSchema = z.union([
  z.enum(['low', 'med', 'high', 'Low', 'Medium', 'High', 'crit', 'Critical', 'Crit']),
  z.string()
]);
export const MissionKindSchema = z.enum(['review', 'practice', 'academic', 'career', 'recovery', 'stretch']);

export const RiskComponentsSchema = z.object({
  score_gap: z.number().default(0),
  syllabus_behind: z.number().default(0),
  activity_recency: z.number().default(0),
  trend: z.number().default(0),
  coding_activity: z.number().optional(),
}).passthrough();

export const StudentRiskSchema = z.object({
  level: RiskBandSchema,
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()).default([]),
  components: RiskComponentsSchema.optional(),
  explanation: z.any().optional(),
}).passthrough();

export const SubjectStateSchema = z.object({
  name: z.string(),
  score: z.number().default(0),
  latest: z.number().optional(),
  trend: z.array(z.number()).default([]),
  flag: z.union([z.boolean(), z.string()]).optional().catch(false),
}).passthrough();

export const ExamStateSchema = z.object({
  subject: z.string(),
  days_to_exam: z.number().default(0),
  completion: z.number().default(0),
}).passthrough();

export const ActivityStateSchema = z.object({
  days_since_active: z.number().default(0),
  days_since_commit: z.number().default(0),
  days_since_linkedin: z.number().default(0),
}).passthrough();

export const StudentStateSchema = z.object({
  student_id: z.string(),
  name: z.string(),
  email: z.string().default('student@drishta.edu'),
  risk: StudentRiskSchema,
  subjects: z.array(SubjectStateSchema).default([]),
  exams: z.array(ExamStateSchema).default([]),
  activity: ActivityStateSchema.default({ days_since_active: 0, days_since_commit: 0, days_since_linkedin: 0 }),
  goals_met_streak: z.number().default(0),
}).passthrough();

export const CodeforcesProfileSchema = z.object({
  handle: z.string(),
  rating: z.number().default(0),
  max_rating: z.number().default(0),
  rank: z.string().default('unrated'),
  solved_count: z.number().default(0),
  last_active_days: z.number().default(-1),
  source: z.string().optional(),
}).passthrough();

export const CodingProfileSchema = z.object({
  codeforces: CodeforcesProfileSchema.nullable(),
  note: z.string().optional(),
}).passthrough();

export const DailyTargetSchema = z.object({
  id: z.string(),
  task: z.string(),
  kind: MissionKindSchema.default('recovery'),
  why: z.string().default('Customized study task'),
  why_source: z.enum(['decide', 'speak']).default('decide'),
  completed: z.boolean().default(false),
}).passthrough();

export const ScheduleItemSchema = z.object({
  time: z.string(),
  title: z.string(),
  location: z.string().default('Virtual'),
}).passthrough();

export const InterventionSchema = z.object({
  id: z.string(),
  student_id: z.string(),
  student_name: z.string().default(''),
  action: z.string(),
  why: z.string(),
  kind: z.string(),
  auto: z.boolean(),
  approved: z.boolean().optional(),
  note: z.string().optional(),
}).passthrough();

export const PlanSchema = z.object({
  student_id: z.string(),
  generated_at: z.string().default(() => new Date().toISOString()),
  missions: z.array(DailyTargetSchema).default([]),
  schedule: z.array(ScheduleItemSchema).default([]),
  intervention_triggered: z.boolean().default(false),
  intervention: InterventionSchema.optional(),
  interventions: z.array(InterventionSchema).optional(),
}).passthrough();

export const TopicMemorySchema = z.object({
  topic: z.string(),
  subject: z.string(),
  why: z.string().default(''),
  reps: z.number().default(1),
  interval: z.number().default(1),
  ease_factor: z.number().default(2.5),
  due_date: z.string().default(() => new Date().toISOString()),
}).passthrough();

export const InternshipMatchSchema = z.object({
  title: z.string(),
  company: z.string(),
  match: z.number().default(0),
  have_skills: z.array(z.string()).default([]),
  missing_skills: z.array(z.string()).default([]),
  why: z.string().default(''),
}).passthrough();

export const PredictionResultSchema = z.object({
  projected_gpa: z.number().default(3.4),
  exam_trend: z.enum(['improving', 'stable', 'declining']).default('stable'),
  exam_forecast: z.array(
    z.object({
      subject: z.string(),
      score: z.number(),
    })
  ).default([]),
  computed_at: z.string().default(() => new Date().toISOString()),
}).passthrough();

export const ChatHistoryItemSchema = z.object({
  id: z.string(),
  sender: z.string(),
  message: z.string(),
  timestamp: z.string(),
  used_llm: z.boolean().default(false),
}).passthrough();

export const CohortStudentSchema = z.object({
  student_id: z.string(),
  name: z.string(),
  risk: z.object({
    level: RiskBandSchema,
    score: z.number().min(0).max(100),
    reasons: z.array(z.string()).default([]),
  }).passthrough(),
}).passthrough();

// Infer TypeScript types from schemas
export type RiskBand = z.infer<typeof RiskBandSchema>;
export type MissionKind = z.infer<typeof MissionKindSchema>;
export type RiskComponents = z.infer<typeof RiskComponentsSchema>;
export type StudentRisk = z.infer<typeof StudentRiskSchema>;
export type SubjectState = z.infer<typeof SubjectStateSchema>;
export type ExamState = z.infer<typeof ExamStateSchema>;
export type ActivityState = z.infer<typeof ActivityStateSchema>;
export type StudentState = z.infer<typeof StudentStateSchema>;
export type CodeforcesProfile = z.infer<typeof CodeforcesProfileSchema>;
export type CodingProfile = z.infer<typeof CodingProfileSchema>;
export type DailyTarget = z.infer<typeof DailyTargetSchema>;
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;
export type Intervention = z.infer<typeof InterventionSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type TopicMemory = z.infer<typeof TopicMemorySchema>;
export type InternshipMatch = z.infer<typeof InternshipMatchSchema>;
export type PredictionResult = z.infer<typeof PredictionResultSchema>;
export type ChatHistoryItem = z.infer<typeof ChatHistoryItemSchema>;
export type CohortStudent = z.infer<typeof CohortStudentSchema>;
