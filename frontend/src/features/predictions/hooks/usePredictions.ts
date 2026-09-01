import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { PredictionResultSchema, type PredictionResult } from '../../../api/schemas';

export function usePredictions(studentId: string) {
  return useQuery({
    queryKey: ['predictions', studentId],
    queryFn: () => apiClient.get<PredictionResult>(`/students/${studentId}/predictions`, PredictionResultSchema),
    enabled: !!studentId,
  });
}

export default usePredictions;
