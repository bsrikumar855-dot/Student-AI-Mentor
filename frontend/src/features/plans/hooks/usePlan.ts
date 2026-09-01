import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { PlanSchema, type Plan } from '../../../api/schemas';

export function usePlan(studentId: string) {
  return useQuery({
    queryKey: ['plan', studentId],
    queryFn: () => apiClient.get<Plan>(`/students/${studentId}/plan`, PlanSchema),
    enabled: !!studentId,
  });
}

export default usePlan;
