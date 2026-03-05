'use client';

import { Check } from "lucide-react";

export function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      features: ["Full AuraBank access", "Basic AuraWallet features", "Limited AuraVest trades (10/month)", "Basic AuraAI insights"],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Plus",
      price: "$9.99",
      period: "/month",
      features: ["Everything in Free", "Unlimited AuraVest trades", "Advanced AuraAI features", "Priority support", "Cashback rewards (2%)"],
      cta: "Upgrade to Plus",
      popular: true
    },
    {
      name: "Premium",
      price: "$24.99",
      period: "/month",
      features: ["Everything in Plus", "Dedicated account manager", "Premium investment research", "Higher savings APY", "Cashback rewards (5%)", "Early access to features"],
      cta: "Go Premium",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Transparent Pricing, No Surprises</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div key={idx} className={`glass rounded-2xl p-8 relative ${plan.popular ? "ring-2 ring-primary" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-magenta text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-full font-semibold transition ${
                plan.popular
                  ? "bg-gradient-to-r from-primary to-magenta text-white hover:opacity-90"
                  : "border-2 hover:bg-white/10"
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
