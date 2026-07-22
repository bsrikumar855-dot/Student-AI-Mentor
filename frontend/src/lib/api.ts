// API Types and Mock Implementation

export type Role = 'student' | 'faculty';

// Global state for mocking
let currentRole: Role = 'student';
export const setRole = (role: Role) => { currentRole = role; };
export const getRole = () => currentRole;

// --- Types ---

export type RiskBand = 'low' | 'medium' | 'high' | 'crit';

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
    id: 'stu_123',
    name: 'Eleanor Vance',
    motto: 'Constantia et Labore',
    riskBand: 'medium',
    components: [
      { id: 'c1', label: 'Attendance', value: 92, risk: 'low' },
      { id: 'c2', label: 'Coursework', value: 65, risk: 'medium' },
      { id: 'c3', label: 'Engagement', value: 80, risk: 'low' },
      { id: 'c4', label: 'Wellness', value: 45, risk: 'high' }
    ],
    kindTag: 'Supportive',
    whyCopy: 'Your coursework rhythm is a bit off this week. Let\'s steady it together.'
  },
  faculty: {
    id: 'stu_123',
    name: 'Eleanor Vance',
    motto: 'Constantia et Labore',
    riskBand: 'medium',
    components: [
      { id: 'c1', label: 'Attendance', value: 92, risk: 'low' },
      { id: 'c2', label: 'Coursework', value: 65, risk: 'medium' },
      { id: 'c3', label: 'Engagement', value: 80, risk: 'low' },
      { id: 'c4', label: 'Wellness', value: 45, risk: 'high' }
    ]
  }
};

const mockPlan: Record<Role, StudentPlan> = {
  student: {
    tasks: [
      { id: 't1', title: 'Review Chapter 4 concepts', completed: false, type: 'mission' },
      { id: 't2', title: 'Schedule advising meeting', completed: true, type: 'other' }
    ],
    interventions: [
      { id: 'i1', studentId: 'stu_123', studentName: 'Eleanor', title: 'Coursework Check-in', description: 'Gentle nudge on missing assignments.', status: 'approved', date: '2026-07-22' }
    ]
  },
  faculty: {
    tasks: [
      { id: 't1', title: 'Review Chapter 4 concepts', completed: false, type: 'mission' },
      { id: 't2', title: 'Schedule advising meeting', completed: true, type: 'other' }
    ],
    interventions: [],
    freshness: 'Generated 2 hours ago'
  }
};

let consentState = { dataSharing: false, mentorAI: false };
let chatThread: ChatMessage[] = [
  { id: 'm1', role: 'mentor', content: 'Good morning, Eleanor. How are you feeling about the upcoming midterms?', timestamp: new Date(Date.now() - 3600000).toISOString() }
];

// --- API Client ---

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Auth
  login: async (_rollNumber: string) => {
    await delay();
    return { token: 'mock-jwt-token', id: 'stu_123' };
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
    try {
      const resp = await fetch(`${BASE}/students/${studentId}/state`);
      if (!resp.ok) throw new Error("CORS or network error");
      const s = await resp.json();
      
      const level = (s.risk?.level || "low").toLowerCase() as RiskBand;
      const contributions = s.risk?.explanation?.contributions || [];
      
      const componentLabels: Record<string, string> = {
        score_gap: "Coursework Gap",
        syllabus_behind: "Syllabus Behind",
        activity_recency: "Activity Recency",
        trend: "Grade Trend",
        coding_activity: "Coding Activity"
      };

      const components = contributions.map((c: any, idx: number) => {
        const valPct = Math.round(c.value * 100);
        let band: RiskBand = 'low';
        if (c.value >= 0.5) band = 'high';
        else if (c.value >= 0.25) band = 'medium';
        return {
          id: `c_${idx}`,
          label: componentLabels[c.name] || c.name,
          value: valPct,
          risk: band
        };
      });

      return {
        id: s.student_id,
        name: s.name,
        motto: "Constantia et Labore",
        riskBand: level,
        components: components,
        kindTag: "Supportive",
        whyCopy: s.risk?.explanation?.summary || "Let's steady it together."
      };
    } catch (e) {
      console.warn("getState failed, using mock:", e);
      return mockState[currentRole];
    }
  },
  getPlan: async (studentId: string): Promise<StudentPlan> => {
    try {
      const resp = await fetch(`${BASE}/students/${studentId}/plan`);
      if (!resp.ok) throw new Error("CORS or network error");
      const p = await resp.json();
      
      const tasks = (p.daily_targets || []).map((t: any) => {
        let type: 'mission' | 'review' | 'other' = 'other';
        if (t.kind === 'review') type = 'review';
        else if (t.kind === 'recovery' || t.kind === 'practice' || t.kind === 'academic') type = 'mission';
        return {
          id: t.id,
          title: t.task,
          completed: t.done,
          type: type
        };
      });

      const interventions = (p.interventions || []).map((i: any) => {
        return {
          id: i.id,
          studentId: studentId,
          studentName: "Student",
          title: i.action,
          description: i.why,
          status: i.auto ? 'auto_sent' : (i.reviewed ? 'approved' : 'pending'),
          date: new Date().toISOString().split('T')[0]
        };
      });

      return {
        tasks,
        interventions,
        freshness: p.generated_at ? `Generated at ${p.generated_at}` : 'Just now'
      };
    } catch (e) {
      console.warn("getPlan failed, using mock:", e);
      return mockPlan[currentRole];
    }
  },
  generatePlan: async (_studentId: string) => {
    await delay(1200);
    return { success: true, freshness: 'Just now' };
  },
  completeTask: async (_studentId: string, taskId: string) => {
    await delay(400);
    const task = mockPlan.student.tasks.find(t => t.id === taskId);
    if (task) task.completed = true;
    return { success: true };
  },

  // Reviews
  getReviewsDueToday: async (_studentId: string): Promise<ReviewTopic[]> => {
    await delay();
    return [
      { id: 'rt1', title: 'Calculus - Limits', dueToday: true },
      { id: 'rt2', title: 'Physics - Kinematics', dueToday: true }
    ];
  },
  gradeReview: async (_studentId: string, _topicId: string, _grade: number) => {
    await delay(300);
    return { success: true };
  },

  // Internships
  getInternships: async (_studentId: string): Promise<InternshipMatch[]> => {
    await delay();
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
  },

  // Predictions
  getPredictions: async (_studentId: string): Promise<Prediction[]> => {
    await delay();
    return [
      { id: 'p1', metric: 'End of Term GPA', forecast: 3.4, trend: 'up', history: [3.1, 3.2, 3.2, 3.3, 3.4] },
      { id: 'p2', metric: 'Credit Completion', forecast: 100, trend: 'steady', history: [100, 100, 100, 100, 100] }
    ];
  },

  // Chat
  getChatThread: async (_studentId: string) => {
    await delay(400);
    return chatThread;
  },
  sendChatMessage: async (studentId: string, message: string) => {
    try {
      const history = chatThread.map(m => ({
        role: m.role === 'mentor' ? 'assistant' : 'user',
        content: m.content
      }));

      const newMsg: ChatMessage = { id: `m_${Date.now()}`, role: 'user', content: message, timestamp: new Date().toISOString() };
      chatThread.push(newMsg);

      const resp = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          message: message,
          history: history
        })
      });
      if (!resp.ok) throw new Error("CORS or network error");
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
      const newMsg: ChatMessage = { id: `m${Date.now()}`, role: 'user', content: message, timestamp: new Date().toISOString() };
      chatThread.push(newMsg);
      const reply: ChatMessage = { id: `m${Date.now()+1}`, role: 'mentor', content: 'I hear you. Let us break that down into smaller steps.', timestamp: new Date().toISOString() };
      chatThread.push(reply);
      return { success: true, messages: [newMsg, reply] };
    }
  },

  // Faculty specific
  getStudents: async (_segment: string): Promise<StudentSummary[]> => {
    try {
      const resp = await fetch(`${BASE}/students`);
      if (!resp.ok) throw new Error("CORS or network error");
      const data = await resp.json();
      return data.map((s: any) => ({
        id: s.student_id,
        name: s.name,
        riskBand: (s.risk?.level || "low").toLowerCase() as RiskBand,
        segment: 'sophomore',
        lastActive: '2h ago'
      }));
    } catch (e) {
      console.warn("getStudents failed, using mock:", e);
      return [
        { id: 'stu_123', name: 'Eleanor Vance', riskBand: 'medium', segment: 'sophomore', lastActive: '2h ago' },
        { id: 'stu_124', name: 'Julian Black', riskBand: 'low', segment: 'sophomore', lastActive: '1d ago' },
        { id: 'stu_125', name: 'Aria Montgomery', riskBand: 'high', segment: 'freshman', lastActive: '3h ago' },
      ];
    }
  },
  getInterventions: async (status: 'pending' | 'auto_sent'): Promise<Intervention[]> => {
    await delay();
    if (status === 'pending') {
      return [
        { id: 'i2', studentId: 'stu_125', studentName: 'Aria Montgomery', title: 'Wellness Check', description: 'Multiple missed assignments in a row.', status: 'pending', date: '2026-07-22' }
      ];
    }
    return [];
  },
  reviewIntervention: async (id: string, action: 'approve' | 'reject', note?: string) => {
    try {
      const decision = action === 'reject' ? 'override' : 'approve';
      const resp = await fetch(`${BASE}/interventions/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decision,
          note: note || ""
        })
      });
      if (!resp.ok) throw new Error("CORS or network error");
      return await resp.json();
    } catch (e) {
      console.warn("reviewIntervention failed, using mock:", e);
      return { success: true };
    }
  },
  
  // Demo endpoints
  driftHero: async () => {
    try {
      const resp = await fetch(`${BASE}/demo/drift-hero`, { method: 'POST' });
      if (!resp.ok) throw new Error("CORS or network error");
      return await resp.json();
    } catch (e) {
      console.warn("driftHero failed:", e);
      return { success: false };
    }
  },
  resetDemo: async () => {
    try {
      const resp = await fetch(`${BASE}/demo/reset`, { method: 'POST' });
      if (!resp.ok) throw new Error("CORS or network error");
      return await resp.json();
    } catch (e) {
      console.warn("resetDemo failed:", e);
      return { success: false };
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
