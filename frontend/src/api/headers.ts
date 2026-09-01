import { CONFIG } from '../app/config';

export function getAuthHeaders(): Record<string, string> {
  const role = localStorage.getItem('drishta_role') || CONFIG.DEFAULT_ROLE;
  const userId = localStorage.getItem('drishta_user_id') || localStorage.getItem('drishta_student_id') || CONFIG.DEFAULT_STUDENT_ID;
  const apiKey = localStorage.getItem('drishta_api_key') || 'dev-key-123';

  return {
    'X-API-Key': apiKey,
    'X-User-Role': role,
    'X-User-Id': userId,
  };
}
