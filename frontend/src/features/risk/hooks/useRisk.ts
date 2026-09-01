import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { StudentRiskSchema, type StudentRisk } from '../../../api/schemas';
import { z } from 'zod';

export function useRisk(studentId: string) {
  return useQuery({
    queryKey: ['risk', studentId],
    queryFn: () => apiClient.get<StudentRisk & { student_id: string }>(`/students/${studentId}/risk`, StudentRiskSchema.extend({ student_id: z.string() })),
    enabled: !!studentId,
  });
}

export default useRisk;
