import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatHistoryItem } from '../../api/schemas';

interface ChatStore {
  messages: ChatHistoryItem[];
  addMessage: (message: ChatHistoryItem) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [
        {
          id: 'welcome_1',
          sender: 'mentor',
          message: 'Hello! I am your Drishta Mentor. I can explain complex syllabus subjects, review practice exercises, or encourage your career plans. How can I help you today?',
          timestamp: new Date().toISOString(),
          used_llm: false
        }
      ],
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      clearHistory: () =>
        set({
          messages: [
            {
              id: 'welcome_1',
              sender: 'mentor',
              message: 'Hello! I am your Drishta Mentor. I can explain complex syllabus subjects, review practice exercises, or encourage your career plans. How can I help you today?',
              timestamp: new Date().toISOString(),
              used_llm: false
            }
          ]
        })
    }),
    {
      name: 'drishta-mentor-chats'
    }
  )
);
