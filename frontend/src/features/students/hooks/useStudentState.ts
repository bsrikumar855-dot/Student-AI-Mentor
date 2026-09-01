import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { StudentStateSchema, type StudentState } from '../../../api/schemas';

export function useStudentState(studentId: string) {
  return useQuery({
    queryKey: ['state', studentId],
    queryFn: () => apiClient.get<StudentState>(`/students/${studentId}/state`, StudentStateSchema),
    enabled: !!studentId,
  });
}

export default useStudentState;
