"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, Mail, ShieldCheck, Wallet } from "lucide-react";

export default function AuraChat({ userId = 1 }: { userId?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hi! I'm AuraAI 👋 Ask me about wallet spending, transfers, or safety tips." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPanelMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setPanelVisible(true)));
    } else {
      setPanelVisible(false);
      const t = setTimeout(() => setPanelMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuery: userMsg, userId: String(userId) }),
      });
      const data = await res.json() as { success: boolean; message: string };
      setMessages((prev) => [...prev, { role: "ai", content: data.message || "Hmm, I ran into an issue. Try rephrasing?" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "Network error. Check your connection and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleWeeklyDigest = async () => {
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: String(userId) }),
      });
      const data = await res.json() as { success: boolean; message: string };
      if (data.success) {
        setMessages((prev) => [...prev, { role: "ai", content: "✅ Weekly wallet digest scheduled! You'll get a summary every Monday at 8 AM." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "Failed to schedule digest. Try again later." }]);
    }
  };

  const chips = [
    { icon: Mail, label: "Weekly Digest", action: scheduleWeeklyDigest, color: "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" },
    { icon: Wallet, label: "Wallet Insights", action: () => setInput("Give me wallet insights"), color: "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" },
    { icon: ShieldCheck, label: "Security Tips", action: () => setInput("How can I improve wallet security?"), color: "text-green-400 bg-green-500/10 hover:bg-green-500/20" },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen((p) => !p)}
        aria-label="Open AuraAI"
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="relative" style={{ width: 56, height: 56 }}>
          <span className={`absolute inset-0 rounded-full blur-md transition-all duration-500 ${isOpen ? "bg-emerald-500/50 scale-125" : "bg-emerald-500/25 animate-pulse"}`} />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400/80 border-r-green-400/50 animate-spin"
            style={{ animationDuration: isOpen ? "1.5s" : "3s" }}
          />
          <div className="absolute inset-[3px] rounded-full bg-white overflow-hidden ring-1 ring-emerald-400/20 shadow-lg">
            <img src="/images/ai.jpg" alt="AuraAI" className="w-full h-full object-cover" />
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-background shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        </div>
      </button>

      {panelMounted && (
        <div
          className={`fixed z-50 bottom-24 right-6 left-4 sm:left-auto sm:w-[390px] h-[70vh] max-h-[640px] flex flex-col rounded-2xl shadow-2xl border border-white/10 overflow-hidden origin-bottom-right transition-all duration-300 ease-out bg-[#0B1629]/95 backdrop-blur-xl
            ${panelVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}`}
        >
          <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="relative flex-shrink-0" style={{ width: 38, height: 38 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400/80 border-r-green-400/40 animate-spin" style={{ animationDuration: "3s" }} />
                <div className="absolute inset-[2.5px] rounded-full bg-white overflow-hidden">
                  <img src="/images/ai.jpg" alt="AuraAI" className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-1 ring-[#0B1629] shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-none">AuraAI</p>
                <p className="text-[10px] text-white/40 mt-0.5">AI-powered wallet assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="relative p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 hover:rotate-90"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                style={{ animationFillMode: "both" }}
              >
                {msg.role === "ai" && (
                  <div className="relative flex-shrink-0 w-7 h-7 rounded-full bg-white overflow-hidden ring-1 ring-emerald-400/20 shadow mb-0.5">
                    <img src="/images/ai.jpg" alt="AI" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-emerald-600 to-green-600 text-white rounded-br-sm shadow-lg shadow-emerald-500/20"
                    : "bg-white/8 border border-white/10 text-white/90 rounded-bl-sm backdrop-blur-sm"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-end gap-2 animate-in fade-in duration-200">
                <div className="relative flex-shrink-0 w-7 h-7 rounded-full bg-white overflow-hidden ring-1 ring-emerald-400/20 shadow mb-0.5">
                  <img src="/images/ai.jpg" alt="AI" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-emerald-400/80 animate-bounce"
                        style={{ animationDelay: `${i * 160}ms`, animationDuration: "0.8s" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-2.5 border-t border-white/8 flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
              {chips.map(({ icon: Icon, label, action, color }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${color}`}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <Icon className="relative w-3 h-3 flex-shrink-0" />
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-white/8 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about transfers, spending, or security..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 bg-white/8 border border-white/10 rounded-xl text-sm text-white caret-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 transition-all duration-200"
                style={{ colorScheme: "dark" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 text-white overflow-hidden hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <Send className="relative w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
