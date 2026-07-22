// API Types and Mock Implementation

export type Role = 'student' | 'faculty';

// Global state for mocking
let currentRole: Role = 'student';
export const setRole = (role: Role) => { currentRole = role; };
export const getRole = () => currentRole;

// --- Types ---

export type RiskBand = 'low' | 'medium' | 'high' | 'crit';

export interface CodingProfile {
  handle: string;
  rating?: number;
  max_rating?: number;
  rank?: string;
  solved_count?: number;
  last_active_days?: number;
  source?: string;
}

export interface ComponentBar {
  id: string;
  label: string;
  value: number; // 0-100
  risk: RiskBand;
}

export interface StudentState {
  id: string;
  name: string;
  motto: string;
  riskBand: RiskBand;
  riskScore?: number;
  components: ComponentBar[];
  // role-specific fields
  kindTag?: string; // student-only
  whyCopy?: string; // student-only
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  type: 'mission' | 'review' | 'other';
}

export interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  status: 'pending' | 'auto_sent' | 'approved' | 'rejected';
  date: string;
}

export interface StudentPlan {
  tasks: Task[];
  interventions: Intervention[];
  freshness?: string; // faculty-only
}

export interface ReviewTopic {
  id: string;
  title: string;
  dueToday: boolean;
  lastGrade?: number;
}

export interface InternshipMatch {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  haveSkills: string[];
  missingSkills: string[];
  whyCopy: string;
}

export interface Prediction {
  id: string;
  metric: string;
  forecast: number;
  trend: 'up' | 'down' | 'steady';
  history: number[]; // for sparkline
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: string;
}

export interface StudentSummary {
  id: string;
  name: string;
  riskBand: RiskBand;
  score?: number;
  segment: string;
  lastActive: string;
}

export interface IngestJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedRows: number;
  totalRows: number;
  skippedRows: number;
}

// --- Mock Data ---

const mockState: Record<Role, StudentState> = {
  student: {
    id: 'STU_HERO',
    name: 'Aisha',
    motto: 'Constantia et Labore',
    riskBand: 'medium',
    riskScore: 35,
    components: [
      { id: 'score_gap', label: 'Academics', value: 85, risk: 'low' },
      { id: 'syllabus_behind', label: 'Syllabus', value: 45, risk: 'high' },
      { id: 'activity_recency', label: 'Activity', value: 70, risk: 'low' },
      { id: 'trend', label: 'Trend', value: 60, risk: 'medium' },
      { id: 'coding_activity', label: 'Coding', value: 50, risk: 'medium' }
    ],
    kindTag: 'Supportive',
    whyCopy: 'Medium risk: Syllabus completion is low for nearest exam.'
  },
  faculty: {
    id: 'STU_HERO',
    name: 'Aisha',
    motto: 'Constantia et Labore',
    riskBand: 'medium',
    riskScore: 35,
    components: [
      { id: 'score_gap', label: 'Academics', value: 85, risk: 'low' },
      { id: 'syllabus_behind', label: 'Syllabus', value: 45, risk: 'high' },
      { id: 'activity_recency', label: 'Activity', value: 70, risk: 'low' },
      { id: 'trend', label: 'Trend', value: 60, risk: 'medium' },
      { id: 'coding_activity', label: 'Coding', value: 50, risk: 'medium' }
    ]
  }
};

const mockPlan: Record<Role, StudentPlan> = {
  student: {
    tasks: [
      { id: 't1', title: 'Complete DSA Revision Module', completed: false, type: 'mission' },
      { id: 't2', title: 'Practice Codeforces Daily Problem', completed: false, type: 'mission' },
      { id: 't3', title: 'Review Database Systems Chapter 3', completed: true, type: 'review' }
    ],
    interventions: [
      { id: 'i1', studentId: 'STU_HERO', studentName: 'Aisha', title: 'Revision Timetable', description: 'Exam in 5 days, syllabus completion low.', status: 'auto_sent', date: '2026-07-22' }
    ]
  },
  faculty: {
    tasks: [
      { id: 't1', title: 'Complete DSA Revision Module', completed: false, type: 'mission' },
      { id: 't2', title: 'Practice Codeforces Daily Problem', completed: false, type: 'mission' }
    ],
    interventions: [],
    freshness: 'Generated recently'
  }
};

let consentState = { dataSharing: false, mentorAI: false };
let chatThread: ChatMessage[] = [
  { id: 'm1', role: 'mentor', content: 'Good morning, Aisha. How are you feeling about your upcoming exams?', timestamp: new Date(Date.now() - 3600000).toISOString() }
];

// --- Helper Utilities ---

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 4000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
};

const prettyLabel = (name: string): string => {
  const map: Record<string, string> = {
    score_gap: "Academics",
    syllabus_behind: "Syllabus",
    activity_recency: "Activity",
    trend: "Trend",
    coding_activity: "Coding"
  };
  return map[name] || name;
};

const bandFromContribution = (contribution: number): RiskBand => {
  if (contribution >= 0.15) return 'high';
  if (contribution >= 0.08) return 'medium';
  return 'low';
};

const prettyAction = (action: string): string => {
  const map: Record<string, string> = {
    recovery_plan: "Recovery Plan",
    revision_timetable: "Revision Timetable",
    weak_topic: "Weak Topic Drill",
    revision_mission: "Revision Mission",
    ramp_difficulty: "Ramp Difficulty",
    git_nudge: "Git Activity Nudge",
    linkedin_nudge: "LinkedIn Nudge",
    internship_match: "Internship Match",
    flag_at_risk: "Flag At-Risk",
    coding_nudge: "Coding Activity Nudge"
  };
  if (map[action]) return map[action];
  if (action.startsWith("coding_nudge:")) return `Coding Nudge (${action.split(":")[1]})`;
  return action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

// --- API Client ---

export const api = {
  // Auth
  login: async (_rollNumber: string) => {
    await delay();
    return { token: 'mock-jwt-token', id: 'STU_HERO' };
  },

  // Consent
  getConsent: async (_studentId: string) => {
    await delay(300);
    return consentState;
  },
  putConsent: async (_studentId: string, consent: typeof consentState) => {
    await delay(400);
    consentState = consent;
    return consentState;
  },

  // State & Plan
  getState: async (studentId: string): Promise<StudentState> => {
    const targetId = (studentId === 'stu_123' || !studentId) ? 'STU_HERO' : studentId;
    try {
      const resp = await fetchWithTimeout(`${BASE}/students/${targetId}/state`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const s = await resp.json();
      
      const level = (s.risk?.level || "low").toLowerCase() as RiskBand;
      const contributions = s.risk?.explanation?.contributions || [];

      const components = contributions.map((c: any, idx: number) => ({
        id: c.name || `c_${idx}`,
        label: prettyLabel(c.name),
        value: Math.round((c.value || 0) * 100),
        risk: bandFromContribution(c.contribution || 0)
      }));

      const whyCopy = s.risk?.reasons?.[0] || s.risk?.explanation?.summary || "Academic rhythm analysis updated.";

      return {
        id: s.student_id,
        name: s.name,
        motto: "Constantia et Labore",
        riskBand: level,
        riskScore: s.risk?.score,
        components: components,
        kindTag: "Supportive",
        whyCopy: whyCopy
      };
    } catch (e) {
      console.warn("getState failed, returning mock:", e);
      return mockState[currentRole];
    }
  },

  getPlan: async (studentId: string): Promise<StudentPlan> => {
    const targetId = (studentId === 'stu_123' || !studentId) ? 'STU_HERO' : studentId;
    try {
      const resp = await fetchWithTimeout(`${BASE}/students/${targetId}/plan`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const p = await resp.json();
      
      const tasks: Task[] = (p.daily_targets || []).map((t: any) => ({
        id: t.id,
        title: t.task,
        completed: Boolean(t.done),
        type: t.kind === "review" ? "review" : "mission"
      }));

      const interventions: Intervention[] = (p.interventions || []).map((i: any) => ({
        id: i.id,
        studentId: targetId,
        studentName: "Aisha",
        title: prettyAction(i.action),
        description: i.why,
        status: i.auto ? "auto_sent" : (i.reviewed ? "approved" : "pending"),
        date: new Date().toISOString().split('T')[0]
      }));

      return {
        tasks,
        interventions,
        freshness: p.generated_at ? `Generated at ${new Date(p.generated_at).toLocaleTimeString()}` : 'Just now'
      };
    } catch (e) {
      console.warn("getPlan failed, returning mock:", e);
      return mockPlan[currentRole];
    }
  },

  generatePlan: async (studentId: string) => {
    const targetId = (studentId === 'stu_123' || !studentId) ? 'STU_HERO' : studentId;
    try {
      const resp = await fetchWithTimeout(`${BASE}/students/${targetId}/plan/generate`, { method: 'POST' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return { success: true, freshness: 'Just now' };
    } catch (e) {
      console.warn("generatePlan failed, returning mock fallback:", e);
      await delay(800);
      return { success: true, freshness: 'Just now' };
    }
  },

  completeTask: async (studentId: string, taskId: string) => {
    const targetId = (studentId === 'stu_123' || !studentId) ? 'STU_HERO' : studentId;
    try {
      const resp = await fetchWithTimeout(`${BASE}/students/${targetId}/tasks/${taskId}/complete`, { method: 'POST' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn("completeTask failed, updating local mock state:", e);
      const task = mockPlan.student.tasks.find(t => t.id === taskId);
      if (task) task.completed = true;
      return { success: true };
    }
  },

  // Reviews
  getReviewsDueToday: async (studentId: string): Promise<ReviewTopic[]> => {
    const targetId = (studentId === 'stu_123' || !studentId) ? 'STU_HERO' : studentId;
    try {
      const resp = await fetchWithTimeout(`${BASE}/students/${targetId}/reviews`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.map((item: any) => ({
        id: item.topic,
        title: item.topic,
        dueToday: true,
        lastGrade: undefined
      }));
    } catch (e) {
      console.warn("getReviewsDueToday failed, using mock:", e);
      return [
        { id: 'rt1', title: 'Calculus - Limits', dueToday: true },
        { id: 'rt2', title: 'Physics - Kinematics', dueToday: true }
      ];
    }
  },
  gradeReview: async (studentId: string, topicId: string, grade: number) => {
    const targetId = (studentId === 'stu_123' || !studentId) ? 'STU_HERO' : studentId;
    try {
      const resp = await fetchWithTimeout(`${BASE}/students/${targetId}/reviews/${topicId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality: grade })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return { success: true };
    } catch (e) {
      console.warn("gradeReview failed, using mock success:", e);
      return { success: true };
    }
  },

  // Internships
  getInternships: async (studentId: string): Promise<InternshipMatch[]> => {
    const targetId = (studentId === 'stu_123' || !studentId) ? 'STU_HERO' : studentId;
    try {
      const resp = await fetchWithTimeout(`${BASE}/students/${targetId}/internships`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.map((item: any) => ({
        id: item.title,
        title: item.title,
        company: item.company,
        matchScore: Math.round((item.match || 0) * 100),
        haveSkills: item.have || [],
        missingSkills: item.missing || [],
        whyCopy: item.why || ""
      }));
    } catch (e) {
      console.warn("getInternships failed, using mock:", e);
      return [
        {
          id: 'int1',
          title: 'Data Science Intern',
          company: 'Stark Industries',
          matchScore: 85,
          haveSkills: ['Python', 'SQL'],
          missingSkills: ['Machine Learning'],
          whyCopy: 'Your strong analytical grades align perfectly here.'
        }
      ];
    }
  },

  // Predictions
  getPredictions: async (studentId: string): Promise<Prediction[]> => {
    const targetId = (studentId === 'stu_123' || !studentId) ? 'STU_HERO' : studentId;
    try {
      const resp = await fetchWithTimeout(`${BASE}/students/${targetId}/predictions`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      
      const forecasts: Prediction[] = (data.exam_forecast || []).map((f: any) => {
        let trend: 'up' | 'down' | 'steady' = 'steady';
        if (f.fail_risk === 'High') trend = 'down';
        else if (f.fail_risk === 'Low') trend = 'up';
        return {
          id: f.subject,
          metric: f.subject,
          forecast: Math.round(f.projected_score),
          trend,
          history: []
        };
      });

      if (data.projected_gpa !== undefined) {
        let gpaTrend: 'up' | 'down' | 'steady' = 'steady';
        if (data.exam_trend === 'improving') gpaTrend = 'up';
        else if (data.exam_trend === 'declining') gpaTrend = 'down';
        forecasts.unshift({
          id: 'gpa',
          metric: 'Projected GPA',
          forecast: data.projected_gpa,
          trend: gpaTrend,
          history: []
        });
      }

      return forecasts;
    } catch (e) {
      console.warn("getPredictions failed, using mock:", e);
      return [
        { id: 'p1', metric: 'End of Term GPA', forecast: 3.4, trend: 'up', history: [3.1, 3.2, 3.2, 3.3, 3.4] },
        { id: 'p2', metric: 'Credit Completion', forecast: 100, trend: 'steady', history: [100, 100, 100, 100, 100] }
      ];
    }
  },

  // Chat
  getChatThread: async (_studentId: string) => {
    await delay(400);
    return chatThread;
  },
  sendChatMessage: async (studentId: string, message: string) => {
    const targetId = (studentId === 'stu_123' || !studentId) ? 'STU_HERO' : studentId;
    try {
      const history = chatThread.map(m => ({
        role: m.role === 'mentor' ? 'assistant' : 'user',
        content: m.content
      }));

      const newMsg: ChatMessage = { id: `m_${Date.now()}`, role: 'user', content: message, timestamp: new Date().toISOString() };
      chatThread.push(newMsg);

      const resp = await fetchWithTimeout(`${BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: targetId,
          message: message,
          history: history
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      
      const replyMsg: ChatMessage = {
        id: `m_${Date.now() + 1}`,
        role: 'mentor',
        content: data.reply,
        timestamp: new Date().toISOString()
      };
      chatThread.push(replyMsg);
      
      return { success: true, messages: [newMsg, replyMsg] };
    } catch (e) {
      console.warn("sendChatMessage failed, using mock:", e);
      const newMsg: ChatMessage = { id: `m_${Date.now()}`, role: 'user', content: message, timestamp: new Date().toISOString() };
      chatThread.push(newMsg);
      const reply: ChatMessage = { id: `m_${Date.now()+1}`, role: 'mentor', content: 'I hear you. Let us break that down into smaller steps.', timestamp: new Date().toISOString() };
      chatThread.push(reply);
      return { success: true, messages: [newMsg, reply] };
    }
  },

  // Faculty specific
  getStudents: async (_segment?: string): Promise<StudentSummary[]> => {
    try {
      const resp = await fetchWithTimeout(`${BASE}/students`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.map((s: any) => ({
        id: s.student_id,
        name: s.name,
        riskBand: (s.risk?.level || "low").toLowerCase() as RiskBand,
        score: s.risk?.score,
        segment: 'Sophomore',
        lastActive: 'Active recent'
      }));
    } catch (e) {
      console.warn("getStudents failed, using mock:", e);
      return [
        { id: 'STU_HERO', name: 'Aisha', riskBand: 'medium', score: 35, segment: 'Sophomore', lastActive: '2h ago' },
        { id: 'STU_001', name: 'Rohan Sharma', riskBand: 'low', score: 18, segment: 'Sophomore', lastActive: '1d ago' },
        { id: 'STU_002', name: 'Priya Patel', riskBand: 'high', score: 52, segment: 'Freshman', lastActive: '3h ago' },
        { id: 'STU_003', name: 'Arjun Verma', riskBand: 'low', score: 22, segment: 'Junior', lastActive: '5h ago' },
        { id: 'STU_004', name: 'Fatima Khan', riskBand: 'medium', score: 38, segment: 'Senior', lastActive: '4h ago' },
      ];
    }
  },

  getInterventions: async (status: 'pending' | 'auto_sent'): Promise<Intervention[]> => {
    await delay();
    if (status === 'pending') {
      return [
        { id: 'i2', studentId: 'STU_HERO', studentName: 'Aisha', title: 'Revision Timetable', description: 'Upcoming exam requiring structured revision.', status: 'pending', date: '2026-07-22' }
      ];
    }
    return [];
  },

  reviewIntervention: async (id: string, action: 'approve' | 'reject', note?: string) => {
    try {
      const decision = action === 'reject' ? 'override' : 'approve';
      const resp = await fetchWithTimeout(`${BASE}/interventions/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decision,
          note: note || ""
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn("reviewIntervention failed, returning mock success:", e);
      return { success: true };
    }
  },

  // Demo endpoints
  driftHero: async () => {
    try {
      const resp = await fetchWithTimeout(`${BASE}/demo/drift-hero`, { method: 'POST' }, 6000);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn("driftHero failed:", e);
      return { success: false };
    }
  },

  resetDemo: async () => {
    try {
      const resp = await fetchWithTimeout(`${BASE}/demo/reset`, { method: 'POST' }, 6000);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn("resetDemo failed:", e);
      return { success: false };
    }
  },

  getCoding: async (studentId: string): Promise<CodingProfile | null> => {
    const targetId = (studentId === 'stu_123' || !studentId) ? 'STU_HERO' : studentId;
    try {
      const resp = await fetchWithTimeout(`${BASE}/students/${targetId}/coding`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.codeforces;
    } catch (e) {
      console.warn("getCoding failed, returning null:", e);
      return null;
    }
  },

  // Ingest
  startIngest: async () => {
    await delay(600);
    return { jobId: 'job_999' };
  },

  pollIngest: async (jobId: string): Promise<IngestJob> => {
    await delay(300);
    return { id: jobId, status: 'completed', processedRows: 250, totalRows: 254, skippedRows: 4 };
  }
};
