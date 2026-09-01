import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { CodingProfileSchema, type CodingProfile } from '../../../api/schemas';

export function useCoding(studentId: string) {
  return useQuery({
    queryKey: ['coding', studentId],
    queryFn: () => apiClient.get<CodingProfile>(`/students/${studentId}/coding`, CodingProfileSchema),
    enabled: !!studentId,
  });
}

export default useCoding;
