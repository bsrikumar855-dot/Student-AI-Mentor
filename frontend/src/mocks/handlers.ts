import { http, HttpResponse, delay } from 'msw';
import {
  richStudentState,
  richStudentPlan,
  mockTopicMemories,
  mockInternshipMatches,
  mockPredictionResult,
  cohortFixture,
  initialInterventions
} from './fixtures';
import {
  StudentStateSchema,
  PlanSchema,
  TopicMemorySchema,
  InternshipMatchSchema,
  PredictionResultSchema,
  CohortStudentSchema,
  InterventionSchema
} from '../api/schemas';
import { z } from 'zod';

// Stateful mock DB for the session
let studentState = { ...richStudentState };
let studentPlan = { ...richStudentPlan, missions: richStudentPlan.missions.map(m => ({ ...m })) };
let topicMemories = mockTopicMemories.map(m => ({ ...m }));
let interventions = initialInterventions.map(i => ({ ...i }));
let cohort = cohortFixture.map(c => ({ ...c }));

export const handlers = [
  // 1. POST /auth/login
  http.post('/auth/login', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as any;
    if (body.email && body.password) {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        student_id: 'student_1',
        name: 'Alex Mercer'
      });
    }
    return new HttpResponse('Invalid credentials', { status: 400 });
  }),

  // 2. GET /students/:id/state
  http.get('/students/:id/state', async ({ params }) => {
    await delay(250);
    const { id } = params;
    if (id === 'student_1') {
      // Validate with Zod
      const parsed = StudentStateSchema.safeParse(studentState);
      if (!parsed.success) {
        console.error('Zod schema validation failed for StudentState:', parsed.error);
        return new HttpResponse('Schema validation error', { status: 500 });
      }
      return HttpResponse.json(parsed.data);
    }
    // Return a default student for other IDs
    const matchedCohort = cohort.find(s => s.student_id === id);
    const mockStudent: any = {
      student_id: (id as string) || 'student_generic',
      name: matchedCohort ? matchedCohort.name : 'Jane Doe',
      email: `${id}@university.edu`,
      risk: matchedCohort ? matchedCohort.risk : { level: 'low', score: 10, reasons: ['Stable state'] },
      subjects: [
        { name: 'Discrete Mathematics', score: 75, trend: [70, 72, 74, 75, 75], flag: false },
        { name: 'Data Structures & Algorithms', score: 82, trend: [80, 81, 82, 82, 82], flag: false }
      ],
      exams: [
        { subject: 'Discrete Mathematics', days_to_exam: 8, completion: 0.60 }
      ],
      activity: {
        days_since_active: 1,
        days_since_commit: 2,
        days_since_linkedin: 3
      },
      goals_met_streak: 3,
      days_since_leetcode: 1,
      leetcode_solved_count: 82,
      contribution_weeks: [
        { week_start: '2026-05-03', commit_count: 1 },
        { week_start: '2026-05-10', commit_count: 2 },
        { week_start: '2026-05-17', commit_count: 4 },
        { week_start: '2026-05-24', commit_count: 1 },
        { week_start: '2026-05-31', commit_count: 0 },
        { week_start: '2026-06-07', commit_count: 3 },
        { week_start: '2026-06-14', commit_count: 2 },
        { week_start: '2026-06-21', commit_count: 5 },
        { week_start: '2026-06-28', commit_count: 1 },
        { week_start: '2026-07-05', commit_count: 2 },
        { week_start: '2026-07-12', commit_count: 4 },
        { week_start: '2026-07-19', commit_count: 3 }
      ]
    };
    return HttpResponse.json(StudentStateSchema.parse(mockStudent));
  }),

  // 3. GET /students/:id/plan
  http.get('/students/:id/plan', async ({ params }) => {
    await delay(200);
    const { id } = params;
    if (id === 'student_1') {
      const parsed = PlanSchema.safeParse(studentPlan);
      if (!parsed.success) {
        console.error('Zod schema validation failed for Plan:', parsed.error);
        return new HttpResponse('Schema validation error', { status: 500 });
      }
      return HttpResponse.json(parsed.data);
    }
    const genericPlan = {
      student_id: (id as string) || 'student_generic',
      generated_at: new Date().toISOString(),
      missions: [
        { id: 'gen_task_1', task: 'Complete daily practice set', kind: 'practice', why: 'Routine skill maintenance', why_source: 'decide', completed: false }
      ],
      schedule: [
        { time: '09:00 AM', title: 'Cohort Core Lecture', location: 'Hall A' }
      ],
      intervention_triggered: false
    };
    return HttpResponse.json(PlanSchema.parse(genericPlan));
  }),

  // 4. POST /students/:id/tasks/:tid/complete
  http.post('/students/:id/tasks/:tid/complete', async ({ params, request }) => {
    await delay(150);
    const { id, tid } = params;
    const body = (await request.json()) as { completed: boolean };

    // Simulating specific triggers or general updates
    if (id === 'student_1') {
      const mission = studentPlan.missions.find(m => m.id === tid);
      if (mission) {
        mission.completed = body.completed;
        
        // Update streak if a mission was completed
        if (body.completed) {
          studentState.goals_met_streak += 1;
        } else {
          studentState.goals_met_streak = Math.max(0, studentState.goals_met_streak - 1);
        }
        
        return HttpResponse.json(mission);
      }
    }
    return HttpResponse.json({ id: tid, completed: body.completed });
  }),

  // 5. GET /students/:id/reviews
  http.get('/students/:id/reviews', async () => {
    await delay(300);
    const parsed = z.array(TopicMemorySchema).safeParse(topicMemories);
    if (!parsed.success) {
      console.error('Zod schema validation failed for TopicMemories:', parsed.error);
      return new HttpResponse('Schema validation error', { status: 500 });
    }
    return HttpResponse.json(parsed.data);
  }),

  // 6. POST /students/:id/reviews/:topic/grade
  http.post('/students/:id/reviews/:topic/grade', async ({ params, request }) => {
    await delay(200);
    const { topic } = params;
    const { grade } = (await request.json()) as { grade: number };
    const decodedTopic = decodeURIComponent(topic as string);

    const memory = topicMemories.find(m => m.topic === decodedTopic);
    if (!memory) {
      return new HttpResponse('Topic memory not found', { status: 404 });
    }

    // SM-2 Spaced Repetition Algorithm
    // grade is 0 to 5.
    let { reps, interval, ease_factor } = memory;

    if (grade >= 3) {
      if (reps === 0) {
        interval = 1;
      } else if (reps === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease_factor);
      }
      reps = reps + 1;
    } else {
      reps = 0;
      interval = 1;
    }

    ease_factor = ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    ease_factor = Math.max(1.3, ease_factor);

    // Save back to in-memory state
    memory.reps = reps;
    memory.interval = interval;
    memory.ease_factor = Number(ease_factor.toFixed(2));
    
    // Push due date forward
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + interval);
    memory.due_date = nextDue.toISOString().split('T')[0];

    // Validate schema
    const parsed = TopicMemorySchema.safeParse(memory);
    if (!parsed.success) {
      console.error('SM-2 generated invalid Schema:', parsed.error);
      return new HttpResponse('Invalid algorithm state schema', { status: 500 });
    }

    return HttpResponse.json(parsed.data);
  }),

  // 7. GET /students/:id/internships
  http.get('/students/:id/internships', async () => {
    await delay(250);
    const parsed = z.array(InternshipMatchSchema).safeParse(mockInternshipMatches);
    if (!parsed.success) {
      return new HttpResponse('Schema validation error', { status: 500 });
    }
    return HttpResponse.json(parsed.data);
  }),

  // 8. POST /chat
  http.post('/chat', async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as { message: string };
    const query = body.message.toLowerCase().trim();

    let reply = '';
    let used_llm = true;

    // Check for offline/templated response triggers (simple queries)
    if (query === 'hello' || query === 'hi' || query === 'help') {
      reply = "Hello there! I am your Drishta Mentor. I'm here to explain concepts and encourage your studies, but remember: my suggestions do not affect your risk flags or formal grades.";
      used_llm = false; // templated fallback trigger
    } else if (query.includes('gpa') || query.includes('grade')) {
      reply = "Academic performance estimates are calculated by our Core System (in Indigo). If you study 45 minutes on Discrete Mathematics logic proofs today, our statistical forecast models suggest your projected course grade can improve by up to 6%.";
      used_llm = true;
    } else {
      reply = `I understand you're asking about "${body.message}". In our curriculum, reinforcing key details step-by-step is crucial. Let's tackle the relevant practice questions on your dashboard today to build confidence.`;
      used_llm = true;
    }

    return HttpResponse.json({
      reply,
      used_llm
    });
  }),

  // 9. GET /students/:id/predictions
  http.get('/students/:id/predictions', async () => {
    await delay(200);
    const parsed = PredictionResultSchema.safeParse(mockPredictionResult);
    if (!parsed.success) {
      return new HttpResponse('Schema validation error', { status: 500 });
    }
    return HttpResponse.json(parsed.data);
  }),

  // 10. GET /students
  http.get('/students', async () => {
    await delay(300);
    const parsed = z.array(CohortStudentSchema).safeParse(cohort);
    if (!parsed.success) {
      return new HttpResponse('Schema validation error', { status: 500 });
    }
    return HttpResponse.json(parsed.data);
  }),

  // 11. POST /students/:id/plan/generate
  http.post('/students/:id/plan/generate', async ({ params }) => {
    await delay(400);
    const { id } = params;
    if (id === 'student_1') {
      // Reset missions to false (uncompleted) for demo purposes
      studentPlan.missions.forEach(m => {
        m.completed = false;
      });
      studentPlan.generated_at = new Date().toISOString();
      return HttpResponse.json(studentPlan);
    }
    return new HttpResponse('Student not found', { status: 404 });
  }),

  // 12. POST /interventions/:id/review
  http.post('/interventions/:id/review', async ({ params, request }) => {
    await delay(250);
    const { id } = params;
    const { approved, note } = (await request.json()) as { approved: boolean; note?: string };

    const intervention = interventions.find(i => i.id === id);
    if (!intervention) {
      return new HttpResponse('Intervention not found', { status: 404 });
    }

    intervention.approved = approved;
    intervention.note = note;

    // Persist status change to student1 plan if it matches
    if (intervention.student_id === 'student_1' && studentPlan.intervention && studentPlan.intervention.id === id) {
      studentPlan.intervention.approved = approved;
      studentPlan.intervention.note = note;
    }

    // Remove from the pending cohort list if approved/overridden
    // Wait, the page lists pending interventions. If it is reviewed, we flag it so it won't show in the pending list.
    return HttpResponse.json(intervention);
  }),

  // Helper route to get all interventions (approved & pending) for Faculty Console
  http.get('/interventions', async () => {
    await delay(200);
    // Validate with schema (array of InterventionSchema)
    const validated = z.array(InterventionSchema).parse(interventions);
    return HttpResponse.json(validated);
  }),

  // 13. POST /ingest
  http.post('/ingest', async () => {
    await delay(500);
    // Simulating ingestion success
    return HttpResponse.json({
      success: true,
      count: 30,
      skipped: 1
    });
  })
];
