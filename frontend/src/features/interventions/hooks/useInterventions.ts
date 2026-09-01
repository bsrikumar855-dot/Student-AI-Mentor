import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { InterventionSchema, type Intervention } from '../../../api/schemas';

export function useInterventions() {
  return useQuery({
    queryKey: ['interventions'],
    queryFn: () => apiClient.get<Intervention[]>('/interventions', InterventionSchema.array()),
  });
}

export default useInterventions;
