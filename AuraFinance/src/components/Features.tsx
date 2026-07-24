'use client';

import { Zap, Shield, Sparkles, BarChart, DollarSign, Headphones, Link, Globe } from "lucide-react";

const FEATURES = [
  { icon: Zap,         title: "All-in-One Platform",      desc: "Stop juggling multiple apps. Banking, investing, payments, and AI — all in one suite." },
  { icon: Shield,      title: "Secure by Design",         desc: "Server-side API proxying, environment key isolation, and user-scoped data namespacing." },
  { icon: DollarSign,  title: "Zero Hidden Fees",          desc: "Transparent pricing with no surprises, ever." },
  { icon: Sparkles,    title: "Real-Time Everything",      desc: "Live stock quotes, crypto prices, and candlestick charts powered by Finnhub, CoinGecko, and Binance WebSocket." },
  { icon: BarChart,    title: "AI-Powered Intelligence",   desc: "Aura AI uses your real balances, portfolio, and transactions to give you personalised financial guidance." },
  { icon: Headphones,  title: "Aura AI, Always On",       desc: "Your AI financial assistant is available across all four apps, any time — no waiting, no appointments." },
  { icon: Link,        title: "Seamless Integration",      desc: "A unified ledger keeps your money in sync across AuraBank, AuraVest, and AuraWallet in real time." },
  { icon: Globe,       title: "Mobile Money Ready",        desc: "Built for Ghana — Paystack MoMo integration and live GHS/USD exchange rates via Frankfurter." },
];

export function Features() {
  return (
    <section id="features" className="relative py-14 overflow-hidden">

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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal bg-teal/20 px-4 py-1.5 rounded-full mb-3">
            Why Us
          </span>
          <h2 className="text-4xl font-bold text-white">Why Choose Aura Finance?</h2>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-white/20 transition-[background-color,border-color] duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-teal/15 border border-teal/20 flex items-center justify-center mb-4">
                <Icon size={19} className="text-teal" />
              </div>
              <h3 className="text-white font-bold text-base mb-1.5">{title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
