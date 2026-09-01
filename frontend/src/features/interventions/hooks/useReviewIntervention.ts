import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';

export interface ReviewInterventionPayload {
  decision: 'approve' | 'override';
  note?: string;
}

export function useReviewIntervention() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ interventionId, payload }: { interventionId: string; payload: ReviewInterventionPayload }) =>
      apiClient.post<{ intervention_id: string; status: string }>(
        `/interventions/${interventionId}/review`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      queryClient.invalidateQueries({ queryKey: ['cohort'] });
      queryClient.invalidateQueries({ queryKey: ['plan'] });
    },
  });
}

export default useReviewIntervention;
