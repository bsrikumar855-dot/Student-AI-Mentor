import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { CompleteTaskResponseSchema, type CompleteTaskResponse } from '../../../api/schemas';

export function useCompleteTask(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      apiClient.post<CompleteTaskResponse>(
        `/students/${studentId}/tasks/${taskId}/complete`,
        {},
        CompleteTaskResponseSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', studentId] });
      queryClient.invalidateQueries({ queryKey: ['state', studentId] });
      queryClient.invalidateQueries({ queryKey: ['risk', studentId] });
      queryClient.invalidateQueries({ queryKey: ['predictions', studentId] });
    },
  });
}

export default useCompleteTask;
