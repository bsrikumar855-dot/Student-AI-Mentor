import { z } from 'zod';

const BASE_URL = ''; // Relative path so Vite proxies API calls to the backend.

interface RequestOptions extends RequestInit {
  schema?: z.ZodType<any, any, any>;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { schema, ...init } = options;
  const token = localStorage.getItem('drishta_auth_token');

  const headers = new Headers(init.headers);
  if (!headers.has('X-API-Key')) {
    headers.set('X-API-Key', import.meta.env.VITE_API_KEY || 'drishta_secret_key');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const requestPath = path;

  const response = await fetch(`${BASE_URL}${requestPath}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errJson = JSON.parse(text);
      if (errJson.message) message = errJson.message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }

  let data = await response.json();

  // Map backend shapes to frontend-v2 schemas panel by panel.
  if (requestPath.endsWith('/state')) {
    data = {
      ...data,
      email: data.email || `${data.name?.toLowerCase().replace(/\s+/g, '') || 'student'}@drishta.edu`,
      risk: data.risk ? {
        ...data.risk,
        level: (data.risk.level || 'low').toLowerCase()
      } : { level: 'low', score: 0, reasons: [] },
      subjects: (data.subjects || []).map((s: any) => ({
        ...s,
        score: s.latest ?? s.score ?? 0
      })),
      activity: data.activity || {
        days_since_active: data.days_since_active || 0,
        days_since_commit: data.days_since_commit || 0,
        days_since_linkedin: data.days_since_linkedin || 0,
      },
      goals_met_streak: data.goals_met_streak || 0,
      days_since_leetcode: data.days_since_leetcode || 2,
      leetcode_solved_count: data.leetcode_solved_count || 142,
      contribution_weeks: data.contribution_weeks || Array.from({ length: 12 }, (_, i) => ({
        week_start: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        commit_count: [4, 2, 0, 8, 5, 0, 1, 3, 6, 2, 0, 5][i] || 0
      })).reverse(),
    };
  } else if (requestPath.endsWith('/plan') || requestPath.endsWith('/plan/generate')) {
    const targetId = requestPath.split('/')[2] || data.student_id || 'STU_HERO';
    const missions = data.daily_targets ? data.daily_targets.map((t: any) => ({
      id: t.id,
      task: t.task,
      kind: t.kind || 'recovery',
      why: t.why || 'Customized study task',
      why_source: 'decide',
      completed: t.done || false,
    })) : (data.missions || []);
    const schedule = (data.schedule || []).map((s: any) => s.slot ? ({
      time: s.slot,
      title: s.task,
      location: 'Virtual',
    }) : s);
    const firstIntervention = data.interventions && data.interventions[0] ? {
      id: data.interventions[0].id,
      student_id: targetId,
      action: data.interventions[0].action,
      why: data.interventions[0].why,
      kind: data.interventions[0].kind,
      auto: data.interventions[0].auto,
      approved: data.interventions[0].reviewed || false,
    } : undefined;

    const mappedInterventions = (data.interventions || []).map((inter: any) => ({
      id: inter.id,
      student_id: targetId,
      action: inter.action,
      why: inter.why,
      kind: inter.kind,
      auto: inter.auto,
      approved: inter.reviewed || false,
    }));

    data = {
      ...data,
      missions,
      schedule,
      intervention_triggered: Boolean(data.intervention_triggered),
      intervention: data.intervention || firstIntervention,
      interventions: mappedInterventions,
    };
  } else if (requestPath.endsWith('/predictions')) {
    data = {
      projected_gpa: data.projected_gpa || 3.4,
      exam_trend: data.exam_trend || 'stable',
      exam_forecast: (data.exam_forecast || []).map((f: any) => ({
        subject: f.subject,
        score: Math.round(f.projected_score || f.score || 0),
      })),
      computed_at: data.computed_at || new Date().toISOString(),
    };
  } else if (requestPath.endsWith('/internships')) {
    data = (data || []).map((item: any) => ({
      title: item.title,
      company: item.company,
      match: item.match || 0,
      have_skills: item.have || [],
      missing_skills: item.missing || [],
      why: item.why || '',
    }));
  } else if (requestPath.endsWith('/students') || requestPath === '/students') {
    data = (data || []).map((s: any) => ({
      student_id: s.student_id,
      name: s.name,
      risk: {
        level: (s.risk?.level || 'low').toLowerCase(),
        score: s.risk?.score || 0,
        reasons: s.risk?.reasons || [],
      },
    }));
  } else if (requestPath.endsWith('/reviews')) {
    data = (data || []).map((item: any) => ({
      topic: item.topic,
      subject: item.subject || 'General',
      why: item.why || '',
      reps: item.reps || 1,
      interval: item.interval || 1,
      ease_factor: item.ease_factor || 2.5,
      due_date: item.due_date || item.next_review || new Date().toISOString(),
    }));
  }

  if (schema) {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      const errorMsg = `Zod validation failure at ${path}: ${parseResult.error.message}`;
      console.error(errorMsg, parseResult.error.format());
      throw new Error(errorMsg);
    }
    return parseResult.data as T;
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, schema?: z.ZodType<T, any, any>, options?: RequestInit) =>
    request<T>(path, { method: 'GET', schema, ...options }),

  post: <T>(path: string, body?: any, schema?: z.ZodType<T, any, any>, options?: RequestInit) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      schema,
      ...options,
    }),
};
export default apiClient;
