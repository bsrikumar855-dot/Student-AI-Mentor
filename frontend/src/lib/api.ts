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
  getState: async (_studentId: string): Promise<StudentState> => {
    await delay();
    return mockState[currentRole];
  },
  getPlan: async (_studentId: string): Promise<StudentPlan> => {
    await delay();
    return mockPlan[currentRole];
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
  sendChatMessage: async (_studentId: string, message: string) => {
    await delay(800); // simulate typing
    const newMsg: ChatMessage = { id: `m${Date.now()}`, role: 'user', content: message, timestamp: new Date().toISOString() };
    chatThread.push(newMsg);
    
    // Auto-reply
    const reply: ChatMessage = { id: `m${Date.now()+1}`, role: 'mentor', content: 'I hear you. Let us break that down into smaller steps.', timestamp: new Date().toISOString() };
    chatThread.push(reply);
    
    return { success: true, messages: [newMsg, reply] };
  },

  // Faculty specific
  getStudents: async (_segment: string): Promise<StudentSummary[]> => {
    await delay();
    return [
      { id: 'stu_123', name: 'Eleanor Vance', riskBand: 'medium', segment: 'sophomore', lastActive: '2h ago' },
      { id: 'stu_124', name: 'Julian Black', riskBand: 'low', segment: 'sophomore', lastActive: '1d ago' },
      { id: 'stu_125', name: 'Aria Montgomery', riskBand: 'high', segment: 'freshman', lastActive: '3h ago' },
    ];
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
  reviewIntervention: async (_id: string, _action: 'approve' | 'reject', _note?: string) => {
    await delay(400);
    return { success: true };
  },
  
  // Ingest
  startIngest: async () => {
    await delay(600);
    return { jobId: 'job_999' };
  },
  pollIngest: async (jobId: string): Promise<IngestJob> => {
    await delay(300);
    // Simulate progression by using a random number or just returning completed after a few calls
    // For mock, we'll just return completed immediately to simplify UI testing, or we can make it stateful
    return { id: jobId, status: 'completed', processedRows: 250, totalRows: 254, skippedRows: 4 };
  }
};
