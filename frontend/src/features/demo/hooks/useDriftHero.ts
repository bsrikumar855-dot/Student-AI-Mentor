import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { SuccessResponseSchema } from '../../../api/schemas';

export function useDriftHero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post<{ success: boolean }>('/demo/drift-hero', {}, SuccessResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort'] });
      queryClient.invalidateQueries({ queryKey: ['state'] });
      queryClient.invalidateQueries({ queryKey: ['risk'] });
      queryClient.invalidateQueries({ queryKey: ['plan'] });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
    },
  });
}

export default useDriftHero;
