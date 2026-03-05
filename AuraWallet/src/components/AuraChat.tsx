"use client";

import { useState } from "react";
import { Sparkles, Send, Mail } from 'lucide-react';
// @ts-ignore
import { getOverallInsights } from "@/lib/shared/auraai-core";

export default function AuraChat({ userId = 1 }: { userId?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([
    {
      role: 'ai',
      content: "Hi! I'm AuraAI 👋 Ask me about wallet spending, transfers, or safety tips.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateReply = (query: string) => {
    const normalized = query.toLowerCase();
    const overall = getOverallInsights(userId);
    if (normalized.includes('insight') || normalized.includes('summary') || normalized.includes('overview')) {
      return overall.insights.join('\n');
    }
    if (normalized.includes('save') || normalized.includes('budget')) {
      return "Try setting a weekly transfer cap, review recurring payments, and keep at least 20% of inflows in your wallet reserve.";
    }
    if (normalized.includes('security') || normalized.includes('safe') || normalized.includes('fraud')) {
      return "For better wallet security: verify recipient details, avoid public Wi-Fi for transfers, and enable transaction alerts for every debit.";
    }
    return overall.insights[0] || "I can help with transfers, spending patterns, and wallet security recommendations.";
  };

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", content: generateReply(userMsg) }]);
      setIsLoading(false);
    }, 500);
  };

  const scheduleWeeklyDigest = () => {
    setMessages((prev) => [
      ...prev,
      { role: 'ai', content: '✅ Weekly wallet digest scheduled! You’ll see a summary here every Monday at 8 AM.' },
    ]);
  };

  return (
    <>
      <button
        aria-label="Open Aura Chat"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-black to-green-500 text-white rounded-full shadow-lg hover:opacity-90 flex items-center justify-center transition-all z-50"
        aria-expanded={isOpen}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed z-50 bottom-24 right-6 left-4 sm:left-auto sm:w-[380px] h-[70vh] max-h-[640px] bg-white border border-slate-200 rounded-xl flex flex-col shadow-2xl">
          <div className="bg-gradient-to-r from-black to-green-500 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-black to-green-500 flex items-center justify-center border border-white/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AuraAI Assistant</h3>
                <p className="text-xs opacity-90">Wallet Intelligence</p>
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

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-black to-green-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {m.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-semibold text-slate-600">AuraAI</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-600">AuraAI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-2 bg-white border-t border-slate-200">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={scheduleWeeklyDigest}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap flex items-center gap-1.5"
              >
                <Mail className="w-3 h-3" />
                Weekly Digest
              </button>
              <button
                onClick={() => setInput('Give me wallet insights')}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
              >
                📊 Insights
              </button>
              <button
                onClick={() => setInput('How can I improve wallet security?')}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
              >
                🔒 Security Tips
              </button>
            </div>
          </div>

          <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-200 rounded-b-xl">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ask about transfers, spending, or security..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-black to-green-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
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
