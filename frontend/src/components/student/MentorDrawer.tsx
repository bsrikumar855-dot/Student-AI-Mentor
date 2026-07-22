import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type ChatMessage } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Send } from 'lucide-react';

interface MentorDrawerProps {
  studentId: string;
}

export const MentorDrawer: React.FC<MentorDrawerProps> = ({ studentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      api.getChatThread(studentId).then(setMessages);
    }
  }, [isOpen, studentId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = input;
    setInput('');
    // Optimistic user message
    setMessages(prev => [...prev, { id: 'temp', role: 'user', content: newMsg, timestamp: new Date().toISOString() }]);
    setIsTyping(true);

    const res = await api.sendChatMessage(studentId, newMsg);
    // Replace temp with actuals
    setMessages(prev => [...prev.filter(m => m.id !== 'temp'), ...res.messages]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 bg-primary-deep text-surface px-4 py-2 rounded-full border border-brass shadow-lg"
        aria-label="Ask Drishta"
      >
        <span className="font-ceremonial font-bold">Ask Drishta</span>
      </button>

      {/* Unrolling Letter Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              className="fixed inset-0 bg-ink/20 z-40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 right-0 md:right-6 md:bottom-24 w-full md:w-[400px] h-[80vh] md:h-[600px] bg-[#FAF8F5] shadow-2xl z-50 flex flex-col rounded-t-lg md:rounded-lg overflow-hidden border-2 border-brass/30"
              initial={{ height: 0, opacity: 0, y: 50 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: 50 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="bg-primary-deep text-surface p-4 flex justify-between items-center relative">
                <h3 className="font-ceremonial text-2xl">Ask Drishta</h3>
                <button onClick={() => setIsOpen(false)} className="text-surface/70 hover:text-surface">
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiPjwvcmVjdD48cGF0aCBkPSJNMCAwbDhfOHptOCAwTDBfOHoiIHN0cm9rZT0iI2YwZjBmMCIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+PC9zdmc+')] bg-repeat">
                {messages.map((msg, i) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "max-w-[85%] relative",
                      msg.role === 'user' ? "ml-auto" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded shadow-sm text-[15px] font-body",
                      msg.role === 'user' ? "bg-surface border border-hairline text-ink" : "bg-primary-tint text-primary-deep border border-primary/10 font-medium"
                    )}>
                      {msg.content}
                    </div>
                    {/* Quill stroke underline for mentor */}
                    {msg.role === 'mentor' && i === messages.length - 1 && (
                      <motion.div
                        className="h-0.5 bg-brass absolute -bottom-2 left-0"
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }}
                        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      />
                    )}
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="mr-auto p-4 rounded bg-primary-tint text-primary-deep border border-primary/10 max-w-[85%] flex gap-1">
                    <motion.div className="w-2 h-2 bg-primary rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-2 h-2 bg-primary rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 bg-primary rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-surface border-t border-hairline">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Drishta..."
                    className="flex-1 bg-transparent border-b border-hairline focus:border-brass py-2 font-body outline-none text-ink"
                  />
                  <button type="submit" disabled={!input.trim()} className="text-primary disabled:opacity-50 p-2">
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
