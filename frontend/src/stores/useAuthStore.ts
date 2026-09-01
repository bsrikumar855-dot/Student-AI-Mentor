import { create } from 'zustand';
import { UserRole } from '../types';
import { CONFIG } from '../app/config';

interface AuthState {
  role: UserRole;
  studentId: string;
  userId: string;
  apiKey: string;
  setRole: (role: UserRole) => void;
  setStudentId: (id: string) => void;
  setUserId: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: (localStorage.getItem('drishta_role') as UserRole) || (CONFIG.DEFAULT_ROLE as UserRole),
  studentId: localStorage.getItem('drishta_student_id') || CONFIG.DEFAULT_STUDENT_ID,
  userId: localStorage.getItem('drishta_user_id') || CONFIG.DEFAULT_STUDENT_ID,
  apiKey: localStorage.getItem('drishta_api_key') || 'dev-key-123',

  setRole: (role) => {
    localStorage.setItem('drishta_role', role);
    set({ role });
  },
  setStudentId: (studentId) => {
    localStorage.setItem('drishta_student_id', studentId);
    set({ studentId });
  },
  setUserId: (userId) => {
    localStorage.setItem('drishta_user_id', userId);
    set({ userId });
  },
}));
