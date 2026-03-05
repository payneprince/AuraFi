// src/components/AuraAIChat.tsx
'use client';

import { useState } from 'react';
import { Sparkles, Send, Mail } from 'lucide-react';

export default function PayneAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    {
      role: 'ai',
      content: "Hi! I'm PayneAI 👋 Ask me about your portfolio performance, risk, or tax strategy.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: input,
          userId: 'demo', // ← replace with real user ID later
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, { role: 'ai', content: data.message }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: data.message || 'Hmm, I ran into an issue. Try rephrasing?' },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Network error. Check your connection and try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const requestWeeklyReport = async () => {
    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: '✅ Weekly report scheduled! You’ll get it every Monday at 8 AM via email.' },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Failed to schedule report. Try again later.' },
      ]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-black to-crimson-600 text-white rounded-full shadow-lg hover:opacity-90 flex items-center justify-center transition-all z-50"
        aria-label="Ask PayneAI"
        aria-expanded={isOpen}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Live Chat Panel (non-modal) */}
      {isOpen && (
        <div className="fixed z-50 bottom-24 right-6 left-4 sm:left-auto sm:w-[380px] h-[70vh] max-h-[640px] bg-card border border-border rounded-xl flex flex-col animate-slideIn shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-bold">PayneAI</h3>
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                  AI-Powered
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-3 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted p-3 rounded-xl animate-pulse">Thinking...</div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-border flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about risk, performance, or tax..."
                className="flex-1 p-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center disabled:opacity-50"
                aria-label="Send"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Weekly Report CTA */}
            <div className="px-4 pb-3 text-center">
              <button
                onClick={requestWeeklyReport}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Mail className="w-3 h-3" />
                Request Weekly Report
              </button>
            </div>
        </div>
      )}
    </>
  );
}