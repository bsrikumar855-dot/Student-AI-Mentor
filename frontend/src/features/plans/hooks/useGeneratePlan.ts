import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { PlanSchema, type Plan } from '../../../api/schemas';

export function useGeneratePlan(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post<Plan>(`/students/${studentId}/plan/generate`, {}, PlanSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', studentId] });
      queryClient.invalidateQueries({ queryKey: ['state', studentId] });
      queryClient.invalidateQueries({ queryKey: ['risk', studentId] });
    },
  });
}

export default useGeneratePlan;
