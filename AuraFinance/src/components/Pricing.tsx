'use client';

import { useState } from "react";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    monthly: 0,
    annual: 0,
    features: [
      "Full AuraBank dashboard access",
      "AuraWallet payments & MoMo deposits",
      "Up to 10 AuraVest trades / month",
      "Basic Aura AI financial guidance",
      "PWA installation on any device",
    ],
    cta: "Coming Soon",
    popular: false,
  },
  {
    name: "Plus",
    monthly: 29.99,
    annual: 19.99,
    features: [
      "Everything in Starter",
      "Unlimited AuraVest trades",
      "Full Aura AI with portfolio context",
      "Real-time price alerts",
      "Advanced spend analytics",
      "Priority in-app support",
    ],
    cta: "Coming Soon",
    popular: true,
  },
  {
    name: "Premium",
    monthly: 79.99,
    annual: 59.99,
    features: [
      "Everything in Plus",
      "Dedicated financial advisor access",
      "Biometric login (Face ID / Fingerprint)",
      "AI fraud monitoring & alerts",
      "Early access to new features",
      "Multi-user household accounts",
    ],
    cta: "Coming Soon",
    popular: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-10 overflow-hidden bg-gradient-to-b from-[#040c18] via-[#060e1e] to-[#040c18]">

      {/* Subtle white touch overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-white/[0.09]" />
      {/* Teal glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[300px] bg-teal/8 blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal bg-teal/10 px-4 py-1.5 rounded-full mb-3">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Planned Pricing for Commercial Launch
          </h2>
          <p className="text-white/50 text-sm">These tiers represent the commercial roadmap for Aura Finance. The current platform is fully accessible as a demonstration.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 mt-4 bg-white/5 border border-white/10 rounded-full px-1.5 py-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                !annual ? "bg-white text-gray-900 shadow-sm" : "text-white/50 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                annual ? "bg-white text-gray-900 shadow-sm" : "text-white/50 hover:text-white"
              }`}
            >
              Annual
              <span className="text-xs font-bold text-teal bg-teal/15 px-2 py-0.5 rounded-full">
                Save 33%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            const isPopular = plan.popular;

            const cardInner = (
              <div className={`h-full flex flex-col p-5 rounded-2xl ${isPopular ? "bg-[#08121f]" : "bg-[#0d1b2a]"}`}>

                {/* Plan name + badge */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  {isPopular && (
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-teal to-magenta px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  {price === 0 ? (
                    <span className="text-4xl font-extrabold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-extrabold text-white">GHS {price}</span>
                      <span className="text-white/40 text-sm ml-1">/ mo</span>
                      {annual && plan.monthly > 0 && (
                        <p className="text-white/30 text-xs mt-1 line-through">GHS {plan.monthly} / mo</p>
                      )}
                      {annual && plan.monthly > 0 && (
                        <p className="text-teal text-xs mt-0.5">Billed GHS {(price * 12).toFixed(2)} / year</p>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-teal/15 border border-teal/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-teal" strokeWidth={3} />
                      </div>
                      <span className="text-white/65 text-sm leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => window.location.href = '/login'}
                  className={`w-full py-3 rounded-full text-sm font-bold transition-all duration-200 ${
                    isPopular
                      ? "bg-gradient-to-r from-teal to-magenta text-white hover:opacity-90 shadow-lg shadow-teal/20"
                      : "border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );

            return isPopular ? (
              <div key={plan.name} className="rounded-[18px] p-px bg-gradient-to-b from-teal/50 via-magenta/20 to-transparent shadow-xl shadow-teal/10">
                {cardInner}
              </div>
            ) : (
              <div key={plan.name} className="rounded-2xl border border-white/8 overflow-hidden">
                {cardInner}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/25 text-xs mt-5">
          Planned tiers for commercial deployment · Current demo is fully free · All prices in GHS
        </p>

      </div>
    </section>
  );
}
