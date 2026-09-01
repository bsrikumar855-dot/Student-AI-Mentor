import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ReviewTopicSchema, type ReviewTopic } from '../../../api/schemas';

export function useGradeReview(studentId: string, topic: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (q: number) =>
      apiClient.post<ReviewTopic>(
        `/students/${studentId}/reviews/${encodeURIComponent(topic)}/grade`,
        { q },
        ReviewTopicSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', studentId] });
      queryClient.invalidateQueries({ queryKey: ['plan', studentId] });
      queryClient.invalidateQueries({ queryKey: ['risk', studentId] });
    },
  });
}

export default useGradeReview;
