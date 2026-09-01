import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ChatResponseSchema, type ChatResponse, type ChatRequestSchema } from '../../../api/schemas';
import { z } from 'zod';

export function useChat() {
  return useMutation({
    mutationFn: (payload: z.infer<typeof ChatRequestSchema>) =>
      apiClient.post<ChatResponse>('/chat', payload, ChatResponseSchema),
  });
}

export default useChat;
