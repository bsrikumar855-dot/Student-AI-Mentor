import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { IngestResultSchema, type IngestResult } from '../../../api/schemas';

export function useIngest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post<IngestResult>('/ingest', formData, IngestResultSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort'] });
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
    },
  });
}

export default useIngest;
