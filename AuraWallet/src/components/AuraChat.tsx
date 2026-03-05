"use client";

import { useState } from "react";
// @ts-ignore
import { getOverallInsights } from "@/lib/shared/auraai-core";

export default function AuraChat({ userId = 1 }: { userId?: number }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ from: string; text: string }>>([
    { from: "aura", text: "Hello — I'm AuraAI. Ask me about your finances or type 'insights'." },
  ]);
  const [input, setInput] = useState("");

  function sendMessage() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { from: "user", text: userMsg }]);
    setInput("");

    // Simple local AI reply using auraai-core insights
    const overall = getOverallInsights(userId);
    const reply = overall.insights.join(" \n");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "aura", text: reply }]);
    }, 400);
  }

  return (
    <div>
      <button
        aria-label="Open Aura Chat"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 bg-[#29C7D9] text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        aria-expanded={open}
      >
        A
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 left-4 sm:left-auto z-50 sm:w-80 bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 shadow-2xl">
          <div className="h-56 overflow-y-auto mb-3">
            {messages.map((m, i) => (
              <div key={i} className={`mb-2 ${m.from === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-3 py-2 rounded-lg ${m.from === 'user' ? 'bg-[#29C7D9]/40' : 'bg-white/6'}`}>
                  <small className="text-xs text-white/70">{m.from}</small>
                  <div className="text-sm text-white">{m.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 bg-transparent border border-white/10 rounded-md px-3 py-2 text-white text-sm"
              placeholder="Message AuraAI..."
            />
            <button onClick={sendMessage} className="bg-[#29C7D9] text-black px-3 py-2 rounded-md">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
