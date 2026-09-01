export type UserRole = 'student' | 'mentor' | 'faculty' | 'admin';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface UserSession {
  role: UserRole;
  studentId?: string;
  userId: string;
  apiKey: string;
}
