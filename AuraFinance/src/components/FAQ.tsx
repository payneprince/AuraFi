"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "What is Aura Finance?",
    a: "A complete financial ecosystem — banking, investing, payments, and AI insights — all unified in one platform across AuraBank, AuraVest, AuraWallet, and AuraAI.",
  },
  {
    q: "Is my money safe?",
    a: "Security is built into the architecture. All API keys are stored server-side and never exposed to the client. User data is isolated by account across all four apps. Biometric login and AI fraud monitoring are planned for production deployment.",
  },
  {
    q: "How much does it cost?",
    a: "The current platform is fully free — a complete demonstration of Aura Finance. Planned commercial tiers start at GHS 29.99/month (Plus) and GHS 79.99/month (Premium), billed in Ghanaian cedis at launch.",
  },
  {
    q: "Can I transfer between products instantly?",
    a: "Absolutely — funds move between AuraBank, AuraWallet, and AuraVest in real time with zero fees. It's one connected ecosystem.",
  },
  {
    q: "What cryptocurrencies are supported?",
    a: "AuraVest provides live crypto prices and charts via CoinGecko, covering major coins including Bitcoin, Ethereum, Solana, and more. Real-time OHLC candlestick data is streamed via Binance WebSocket.",
  },
  {
    q: "Are there any hidden fees?",
    a: "None. Transparent pricing across all plans — no overdraft fees, no minimum balance fees, no surprises. What you see is what you pay.",
  },
  {
    q: "How do I get started?",
    a: "Visit any of the four apps — AuraBank, AuraVest, AuraWallet, or AuraAI — sign up with an email and password, and get instant access to the full platform. No credit card or identity verification required.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Paid plans are not yet live — the platform is in demo mode and fully free. When commercial tiers launch, you will be able to upgrade, downgrade, or cancel at any time with no lock-in.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-14 overflow-hidden">

      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/faq.mp4"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal bg-teal/20 px-4 py-1.5 rounded-full mb-3">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white">Frequently Asked Questions</h2>
          <p className="text-white/60 text-base">Everything you need to know about Aura Finance</p>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-200 ${
                  isOpen
                    ? "border-teal/40 bg-white/10 backdrop-blur-sm"
                    : "border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-sm text-white leading-snug">{faq.q}</span>
                  <span className={`flex-shrink-0 mt-0.5 transition-colors ${isOpen ? "text-teal" : "text-white/40"}`}>
                    {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? "max-h-40 pb-4" : "max-h-0"
                  }`}
                >
                  <p className="px-5 text-white/60 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
