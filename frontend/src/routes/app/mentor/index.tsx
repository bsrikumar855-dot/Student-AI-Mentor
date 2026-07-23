import React from 'react';
import { Send, Sparkles, AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';

import apiClient from '../../../api/client';
import { useChatStore } from '../../../features/mentor/chatStore';
import { useToast } from '../../../components/components';
import { BentoGrid, BentoCard } from '../../../design/bento';

export const MentorPage: React.FC = () => {
  const { messages, addMessage, clearHistory } = useChatStore();
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const { toast } = useToast();
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const studentId = localStorage.getItem('drishta_student_id') || 'STU_HERO';
    const userMessage = input.trim();
    setInput('');
    setSending(true);

    const userMsgObj = {
      id: Math.random().toString(36).slice(2),
      sender: 'student' as const,
      message: userMessage,
      timestamp: new Date().toISOString(),
      used_llm: true
    };

    addMessage(userMsgObj);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'mentor' ? 'assistant' : 'user',
        content: m.message,
      }));

      const data = await apiClient.post<{ reply: string; used_llm: boolean }>(
        '/chat',
        {
          student_id: studentId,
          message: userMessage,
          history
        }
      );
      
      const mentorMsgObj = {
        id: Math.random().toString(36).slice(2),
        sender: 'mentor' as const,
        message: data.reply,
        timestamp: new Date().toISOString(),
        used_llm: data.used_llm
      };

      addMessage(mentorMsgObj);
    } catch (err: any) {
      toast('Mentor Offline', 'Unable to reach the language model service.', 'error');
      // Add a failure system message
      addMessage({
        id: Math.random().toString(36).slice(2),
        sender: 'mentor',
        message: 'Could not contact mentor. System in offline backup mode. Re-check network parameters.',
        timestamp: new Date().toISOString(),
        used_llm: false
      });
    } finally {
      setSending(false);
    }
  };

  const SUGGESTED_PROMPTS = [
    "Explain my GPA trend",
    "How to prepare for Data Structures?",
    "Why is my risk level Medium?",
    "Suggest a LeetCode problem"
  ];

  return (
    <BentoGrid className="h-full">
      <BentoCard size="wide" className="flex flex-col h-[82vh] !p-0 overflow-hidden relative border border-line">
        {/* 1. Header with clear disclaimer */}
        <div className="shrink-0 flex items-center justify-between border-b border-line p-5 bg-surface-2/30">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-speak block">
              LANGUAGE INTERPRETATION LAYER
            </span>
            <h1 className="text-xl font-display font-medium text-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-speak" />
              <span>Mentor Advisor</span>
            </h1>
          </div>
          <button
            onClick={clearHistory}
            className="p-2 hover:bg-surface border border-line hover:border-risk-high/30 hover:text-risk-high rounded-md text-text-dim transition cursor-pointer"
            title="Clear Chat Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Honesty Banner - Pinned Disclaimer */}
        <div className="shrink-0 px-5 py-3 bg-speak-lo/50 border-b border-speak/10 flex items-start gap-2.5 text-xs text-text-dim">
          <ShieldAlert className="w-4 h-4 text-speak mt-0.5 shrink-0" />
          <p className="leading-snug">
            <strong className="text-text font-medium">Honesty Statement:</strong> The mentor is a phrased translation engine. Conversation guides and explains, but <span className="text-speak font-semibold">never edits your risk standing score or official grades.</span>
          </p>
        </div>

        {/* 3. Conversation log container */}
        <div className="flex-1 overflow-y-auto space-y-5 px-5 py-6 bg-surface">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Sparkles className="w-8 h-8 text-speak/20" />
              <div>
                <h3 className="text-sm font-semibold text-text">How can I help you today?</h3>
                <p className="text-xs text-text-dim">Ask a question about your syllabus, goals, or schedule.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="px-3 py-1.5 bg-surface-2 hover:bg-speak-lo hover:text-speak border border-line rounded-full text-xs text-text-dim transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const isMentor = m.sender === 'mentor';
            
            return (
              <div key={m.id} className={`flex ${isMentor ? 'justify-start' : 'justify-end'}`}>
                <div 
                  className={`max-w-[80%] md:max-w-[70%] rounded-xl p-4 text-[13px] relative shadow-sm ${
                    isMentor 
                      ? 'bg-surface-2 border border-line text-text rounded-tl-none' 
                      : 'bg-text text-surface rounded-tr-none'
                  }`}
                >
                  {/* Fallback tagging for templated response transparency */}
                  {isMentor && !m.used_llm && (
                    <span className="inline-flex items-center space-x-1 text-[9px] bg-surface-2 border border-line text-speak px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider mb-2">
                      <AlertTriangle className="w-3 h-3" />
                      <span>offline mode — templated reply</span>
                    </span>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  <span className={`block text-[9px] mt-2 font-mono ${isMentor ? 'text-text-dim text-left' : 'text-surface/70 text-right'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-surface-2 border border-line rounded-xl p-4 rounded-tl-none shadow-sm flex items-center space-x-1.5 h-12">
                <div className="w-1.5 h-1.5 bg-speak rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-speak rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-speak rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 4. Chat Input Form Composer */}
        <form onSubmit={handleSendMessage} className="shrink-0 p-4 border-t border-line bg-surface-2/30">
          <div className="flex items-center space-x-3 max-w-4xl mx-auto relative bg-surface border border-line rounded-lg shadow-sm focus-within:border-speak focus-within:ring-1 focus-within:ring-speak/20 transition-all p-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a syllabus question..."
              className="flex-1 bg-transparent border-none outline-none py-2 px-3 text-sm text-text placeholder:text-text-dim/50"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="p-2.5 bg-text hover:bg-text/90 disabled:bg-surface-2 disabled:text-text-dim disabled:opacity-50 text-surface rounded-md transition-colors cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </BentoCard>
    </BentoGrid>
  );
};
