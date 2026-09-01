import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ReviewTopicSchema, type ReviewTopic } from '../../../api/schemas';

export function useReviews(studentId: string, dueOnly: boolean = true) {
  return useQuery({
    queryKey: ['reviews', studentId, dueOnly],
    queryFn: () =>
      apiClient.get<ReviewTopic[]>(
        `/students/${studentId}/reviews${dueOnly ? '?due=today' : ''}`,
        ReviewTopicSchema.array()
      ),
    enabled: !!studentId,
  });
}

export default useReviews;
