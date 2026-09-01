import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { InternshipMatchSchema, type InternshipMatch } from '../../../api/schemas';

export function useInternships(studentId: string) {
  return useQuery({
    queryKey: ['internships', studentId],
    queryFn: () =>
      apiClient.get<InternshipMatch[]>(`/students/${studentId}/internships`, InternshipMatchSchema.array()),
    enabled: !!studentId,
  });
}

export default useInternships;
