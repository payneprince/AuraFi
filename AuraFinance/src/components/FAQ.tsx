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
    a: "Yes. We use 256-bit encryption, two-factor authentication, biometric login, and 24/7 fraud monitoring. AuraBank accounts are FDIC insured up to $250,000.",
  },
  {
    q: "How much does it cost?",
    a: "Free plan covers all core features. Plus is $9.99/month with unlimited trades and advanced AI. Premium is $24.99/month with a dedicated account manager.",
  },
  {
    q: "Can I transfer between products instantly?",
    a: "Absolutely — funds move between AuraBank, AuraWallet, and AuraVest in real time with zero fees. It's one connected ecosystem.",
  },
  {
    q: "What cryptocurrencies are supported?",
    a: "AuraVest supports 50+ cryptocurrencies including Bitcoin, Ethereum, Solana, and more. New coins are added regularly based on user demand.",
  },
  {
    q: "Are there any hidden fees?",
    a: "None. Transparent pricing across all plans — no overdraft fees, no minimum balance fees, no surprises. What you see is what you pay.",
  },
  {
    q: "How do I get started?",
    a: "Sign up, verify your identity in under 2 minutes, and get instant access to all four products. No credit card needed for the free plan.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — upgrade, downgrade, or cancel at any time. If you cancel a paid plan, you keep access until the end of your billing period.",
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
