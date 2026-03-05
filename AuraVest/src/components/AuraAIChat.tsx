// src/components/AuraAIChat.tsx
'use client';

import { useState } from 'react';
import { Sparkles, Send, Mail } from 'lucide-react';

export default function AuraAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    {
      role: 'ai',
      content: "Hi! I'm AuraAI 👋 Ask me about your portfolio performance, risk, or investment strategy.",
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
        aria-label="Ask AuraAI"
        aria-expanded={isOpen}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Live Chat Panel (non-modal) */}
      {isOpen && (
        <div className="fixed z-50 bottom-24 right-6 left-4 sm:left-auto sm:w-[380px] h-[70vh] max-h-[640px] bg-white border border-slate-200 rounded-xl flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-black to-crimson-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-black to-crimson-500 flex items-center justify-center border border-white/30">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold">AuraAI</h3>
                <span className="text-xs px-2 py-0.5 bg-white/20 text-white rounded">
                  AI-Powered
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                          ? 'bg-gradient-to-r from-black to-crimson-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    {msg.role === 'ai' && (
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-crimson-500" />
                        <span className="text-xs font-semibold text-slate-600">AuraAI</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-crimson-500 animate-pulse" />
                      <span className="text-xs font-semibold text-slate-600">AuraAI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white border-t border-slate-200">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={requestWeeklyReport}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap flex items-center gap-1.5"
                >
                  <Mail className="w-3 h-3" />
                  Weekly Report
                </button>
                <button
                  onClick={() => setInput('Analyze my portfolio risk')}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                >
                  📊 Risk Analysis
                </button>
                <button
                  onClick={() => setInput('Show top performers')}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                >
                  🚀 Top Picks
                </button>
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-200 rounded-b-xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about risk, performance, or strategy..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-crimson-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-black to-crimson-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
        </div>
      )}
    </>
  );
}