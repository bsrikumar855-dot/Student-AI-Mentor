import type {
  StudentState,
  Plan,
  TopicMemory,
  InternshipMatch,
  PredictionResult,
  CohortStudent,
  Intervention
} from '../api/schemas';

// ----------------------------------------------------
// Fixtures Data
// ----------------------------------------------------

export const richStudentState: StudentState = {
  student_id: 'student_1',
  name: 'Alex Mercer',
  email: 'alex.mercer@university.edu',
  risk: {
    level: 'high',
    score: 72,
    reasons: [
      'Graph accuracy fell by 18% in Discrete Math',
      'Inactive on learning platform for 6 consecutive days',
      'No GitHub commits in the last 8 days (profile missing active green blocks)'
    ],
    components: {
      score_gap: 15,
      syllabus_behind: 25,
      activity_recency: 20,
      trend: 12
    }
  },
  subjects: [
    { name: 'Discrete Mathematics', score: 62, trend: [80, 78, 72, 68, 62], flag: true },
    { name: 'Data Structures & Algorithms', score: 78, trend: [75, 76, 74, 78, 78], flag: false },
    { name: 'Computer Systems', score: 85, trend: [82, 83, 85, 84, 85], flag: false },
    { name: 'Software Engineering', score: 90, trend: [88, 89, 90, 90, 90], flag: false }
  ],
  exams: [
    { subject: 'Discrete Mathematics', days_to_exam: 5, completion: 0.42 },
    { subject: 'Data Structures & Algorithms', days_to_exam: 12, completion: 0.75 },
    { subject: 'Computer Systems', days_to_exam: 19, completion: 0.88 }
  ],
  activity: {
    days_since_active: 6,
    days_since_commit: 8,
    days_since_linkedin: 15
  },
  goals_met_streak: 5,
  days_since_leetcode: 3,
  leetcode_solved_count: 124,
  contribution_weeks: [
    { week_start: '2026-05-03', commit_count: 2 },
    { week_start: '2026-05-10', commit_count: 0 },
    { week_start: '2026-05-17', commit_count: 5 },
    { week_start: '2026-05-24', commit_count: 8 },
    { week_start: '2026-05-31', commit_count: 0 },
    { week_start: '2026-06-07', commit_count: 1 },
    { week_start: '2026-06-14', commit_count: 3 },
    { week_start: '2026-06-21', commit_count: 12 },
    { week_start: '2026-06-28', commit_count: 4 },
    { week_start: '2026-07-05', commit_count: 0 },
    { week_start: '2026-07-12', commit_count: 0 },
    { week_start: '2026-07-19', commit_count: 1 }
  ]
};

export const richStudentPlan: Plan = {
  student_id: 'student_1',
  generated_at: '2026-07-22T08:00:00Z',
  missions: [
    {
      id: 'task_1',
      task: 'Solve 3 Graph Isomorphism practice proofs',
      kind: 'recovery',
      why: 'Graph accuracy is currently 42% and inactive 6d',
      why_source: 'decide',
      completed: false
    },
    {
      id: 'task_2',
      task: 'Complete Spaced Repetition cards for Trees & Traversals',
      kind: 'review',
      why: 'Topic "Red-Black Trees" recall is decaying (reps: 3, interval: 4 days)',
      why_source: 'decide',
      completed: false
    },
    {
      id: 'task_3',
      task: 'Review Software Design Patterns lecture notes',
      kind: 'academic',
      why: 'Preparing for Software Engineering upcoming milestone in 4 days',
      why_source: 'speak',
      completed: false
    },
    {
      id: 'task_4',
      task: 'Submit your resume link to your Mentor chat',
      kind: 'career',
      why: 'Active resume review will unlock next-tier match profiles',
      why_source: 'speak',
      completed: false
    }
  ],
  schedule: [
    { time: '10:00 AM', title: 'CS 251: Discrete Mathematics Lecture', location: 'Hall B' },
    { time: '02:00 PM', title: 'CS 251 Office Hours (Professor H.)', location: 'Room 402' },
    { time: '04:30 PM', title: 'Peer Study Group: Data Structures', location: 'Library Pod A' }
  ],
  intervention_triggered: true,
  intervention: {
    id: 'int_1',
    student_id: 'student_1',
    student_name: 'Alex Mercer',
    action: 'Schedule 1-on-1 Academic Counseling session',
    why: 'Discrete Math performance is declining rapidly (-18% trend) combined with low active platform logins',
    kind: 'academic-recovery',
    auto: false,
    approved: false
  }
};

export const mockTopicMemories: TopicMemory[] = [
  {
    topic: 'Graph Isomorphism',
    subject: 'Discrete Mathematics',
    why: 'Recall is decaying. Last reviewed 8 days ago.',
    reps: 2,
    interval: 3,
    ease_factor: 2.1,
    due_date: '2026-07-22'
  },
  {
    topic: 'Red-Black Trees Rotation',
    subject: 'Data Structures & Algorithms',
    why: 'Difficulty rating was high on last repetition.',
    reps: 4,
    interval: 2,
    ease_factor: 1.8,
    due_date: '2026-07-22'
  },
  {
    topic: 'Virtual Memory & Page Tables',
    subject: 'Computer Systems',
    why: 'Scheduled system check. Core computed decay warning.',
    reps: 3,
    interval: 6,
    ease_factor: 2.4,
    due_date: '2026-07-22'
  },
  {
    topic: 'Singleton & Factory Patterns',
    subject: 'Software Engineering',
    why: 'Recall is decaying. Standard milestone review due.',
    reps: 5,
    interval: 10,
    ease_factor: 2.6,
    due_date: '2026-07-22'
  }
];

export const mockInternshipMatches: InternshipMatch[] = [
  {
    title: 'Systems Engineering Intern',
    company: 'Core Systems Lab',
    match: 0.92,
    have_skills: ['C/C++', 'Virtual Memory', 'Operating Systems Core', 'POSIX Threads'],
    missing_skills: [],
    why: '100% core systems exam performance and 12/12 requirements met',
  },
  {
    title: 'Software Engineer Intern (Frontend)',
    company: 'Retrospect Inc.',
    match: 0.78,
    have_skills: ['TypeScript', 'React Primitives', 'CSS layouts'],
    missing_skills: ['GitHub Actions CI/CD pipeline setup', 'Unit test writing (Vitest)'],
    why: 'TypeScript proficiency is high, but lacks verified testing or build pipeline commits in Git activity.'
  },
  {
    title: 'Database Engineer Intern',
    company: 'Prism Data Systems',
    match: 0.58,
    have_skills: ['SQL Basics', 'Index Optimization'],
    missing_skills: ['Tree Index Implementations (B-Trees)', 'Query Parser logic'],
    why: 'Data structures grades are stable, but student skipped the B-Tree index memory review tasks.'
  }
];

export const mockPredictionResult: PredictionResult = {
  projected_gpa: 3.42,
  exam_trend: 'improving',
  exam_forecast: [
    { subject: 'Discrete Mathematics', score: 68 },
    { subject: 'Data Structures & Algorithms', score: 81 },
    { subject: 'Computer Systems', score: 87 },
    { subject: 'Software Engineering', score: 92 }
  ],
  computed_at: '2026-07-22T11:00:00Z'
};

export const cohortFixture: CohortStudent[] = [
  { student_id: 'student_1', name: 'Alex Mercer', risk: { level: 'high', score: 72, reasons: ['Discrete Math performance is declining rapidly (-18% trend)', 'Inactive on platform for 6 days', 'No commits for 8 days'] } },
  { student_id: 'student_2', name: 'Sarah Connor', risk: { level: 'high', score: 84, reasons: ['Missing 3 major homework submissions in Computer Systems', 'Active hours fell below 1hr/week'] } },
  { student_id: 'student_3', name: 'David Lightman', risk: { level: 'high', score: 78, reasons: ['Grade trend descending in Software Engineering', 'Zero logins in 9 days'] } },
  { student_id: 'student_4', name: 'Bruce Banner', risk: { level: 'med', score: 55, reasons: ['Syllabus progress behind by 3 chapters in Computer Systems'] } },
  { student_id: 'student_5', name: 'Tony Stark', risk: { level: 'low', score: 12, reasons: ['All metrics stable'] } },
  { student_id: 'student_6', name: 'Peter Parker', risk: { level: 'med', score: 48, reasons: ['DSA assignment score gap > 15%', 'Inactive 4 days'] } },
  { student_id: 'student_7', name: 'Diana Prince', risk: { level: 'low', score: 8, reasons: ['Exemplary performance across all modules'] } },
  { student_id: 'student_8', name: 'Clark Kent', risk: { level: 'low', score: 15, reasons: ['Stable academic activity'] } },
  { student_id: 'student_9', name: 'Bruce Wayne', risk: { level: 'low', score: 5, reasons: ['100% syllabus progress, 12 consecutive active days'] } },
  { student_id: 'student_10', name: 'Barry Allen', risk: { level: 'med', score: 42, reasons: ['High activity recency but rapid declination in math quiz scores'] } },
  { student_id: 'student_11', name: 'Arthur Curry', risk: { level: 'high', score: 71, reasons: ['Computer Systems final milestone score projection is low (58%)'] } },
  { student_id: 'student_12', name: 'Victor Stone', risk: { level: 'low', score: 9, reasons: ['All targets met'] } },
  { student_id: 'student_13', name: 'Hal Jordan', risk: { level: 'med', score: 52, reasons: ['Declining homework scores in Software Engineering'] } },
  { student_id: 'student_14', name: 'Selina Kyle', risk: { level: 'med', score: 46, reasons: ['Logins are sporadic (last active 5 days ago)'] } },
  { student_id: 'student_15', name: 'Wanda Maximoff', risk: { level: 'high', score: 88, reasons: ['Discrete Math grade is 45%, syllabus lag is 4 weeks'] } },
  { student_id: 'student_16', name: 'Stephen Strange', risk: { level: 'low', score: 11, reasons: ['Stable platform usage'] } },
  { student_id: 'student_17', name: 'Natasha Romanoff', risk: { level: 'low', score: 14, reasons: ['Consistent score metrics'] } },
  { student_id: 'student_18', name: 'Clint Barton', risk: { level: 'med', score: 44, reasons: ['Syllabus behind by 2 milestones'] } },
  { student_id: 'student_19', name: 'Carol Danvers', risk: { level: 'low', score: 6, reasons: ['Top percentile in cohort'] } },
  { student_id: 'student_20', name: 'Wade Wilson', risk: { level: 'high', score: 79, reasons: ['Low assessment grades and high activity gap (12 days offline)'] } },
  { student_id: 'student_21', name: 'Jean Grey', risk: { level: 'high', score: 82, reasons: ['Missed Computer Systems mid-term and graph quiz'] } },
  { student_id: 'student_22', name: 'Scott Summers', risk: { level: 'low', score: 18, reasons: ['Stable progress'] } },
  { student_id: 'student_23', name: 'Logan Howlett', risk: { level: 'med', score: 61, reasons: ['Discrete Mathematics score 55%, low commit metrics'] } },
  { student_id: 'student_24', name: 'Oren Shles', risk: { level: 'low', score: 20, reasons: ['Slight syllabus lag but stable quiz scores'] } },
  { student_id: 'student_25', name: 'Bobby Drake', risk: { level: 'med', score: 50, reasons: ['DSA scores decaying on recent tree questions'] } },
  { student_id: 'student_26', name: 'Hank McCoy', risk: { level: 'low', score: 4, reasons: ['All targets exceeded'] } },
  { student_id: 'student_27', name: 'Remy LeBeau', risk: { level: 'med', score: 58, reasons: ['Active on chat but quiz scores lagging by 12%'] } },
  { student_id: 'student_28', name: 'Anna Marie', risk: { level: 'med', score: 45, reasons: ['Logins fell from daily to twice-weekly'] } },
  { student_id: 'student_29', name: 'Kitty Pryde', risk: { level: 'low', score: 10, reasons: ['Continuous github activity'] } },
  { student_id: 'student_30', name: 'Kurt Wagner', risk: { level: 'low', score: 15, reasons: ['Stable state'] } }
];

export const initialInterventions: Intervention[] = [
  {
    id: 'int_1',
    student_id: 'student_1',
    student_name: 'Alex Mercer',
    action: 'Schedule 1-on-1 Academic Counseling session',
    why: 'Discrete Math performance is declining rapidly (-18% trend) combined with low active platform logins',
    kind: 'academic-recovery',
    auto: false,
    approved: false
  },
  {
    id: 'int_2',
    student_id: 'student_2',
    student_name: 'Sarah Connor',
    action: 'Require mandatory Lab Assistance attendance',
    why: '3 missed homework assignments in Systems Programming indicates a barrier in development setup',
    kind: 'systems-assistance',
    auto: false,
    approved: false
  },
  {
    id: 'int_3',
    student_id: 'student_3',
    student_name: 'David Lightman',
    action: 'Issue System Usage Warning notification',
    why: 'Student has not logged in for 9 days and missed the software development sprint milestone',
    kind: 'usage-alert',
    auto: false,
    approved: false
  },
  {
    id: 'int_4',
    student_id: 'student_15',
    student_name: 'Wanda Maximoff',
    action: 'Auto-schedule Mathematics tutoring session',
    why: 'Discrete Math score fell below 50% threshold, triggering automatic routing rules',
    kind: 'math-tutoring',
    auto: true,
    approved: true
  },
  {
    id: 'int_5',
    student_id: 'student_20',
    student_name: 'Wade Wilson',
    action: 'Auto-trigger platform recovery email checklist',
    why: 'Logged inactivity exceeded 10 days, automatic retention rules active',
    kind: 'retention-email',
    auto: true,
    approved: true
  }
];
