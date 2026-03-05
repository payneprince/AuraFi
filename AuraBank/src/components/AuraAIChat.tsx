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
      content: "Hi! I'm AuraAI 👋 Ask me about your banking, spending, or financial goals.",
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
          userId: 'demo',
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
          { role: 'ai', content: '✅ Weekly report scheduled! You\'ll get it every Monday at 8 AM via email.' },
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-magenta-500 to-teal-500 text-white rounded-full shadow-lg hover:opacity-90 flex items-center justify-center transition-all z-50"
        aria-label="Ask AuraAI"
        aria-expanded={isOpen}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Live Chat Panel (non-modal) */}
      {isOpen && (
        <div className="fixed z-50 bottom-24 right-6 left-4 sm:left-auto sm:w-[380px] h-[70vh] max-h-[640px] bg-white border border-slate-200 rounded-xl flex flex-col shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-magenta-500 to-teal-500 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <h3 className="font-semibold text-lg">AuraAI Assistant</h3>
                <p className="text-xs opacity-90">Banking & Finance Insights</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                      ? 'bg-gradient-to-r from-magenta-500 to-teal-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-teal-500" />
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
                    <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
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
                onClick={() => setInput('How can I save more?')}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
              >
                💰 Savings Tips
              </button>
              <button
                onClick={() => setInput('Analyze my spending')}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
              >
                📊 Spending
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
                placeholder="Ask AuraAI anything..."
                className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-gradient-to-r from-magenta-500 to-teal-500 text-white rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
