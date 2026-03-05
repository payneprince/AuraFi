'use client';

import { Zap, Shield, Sparkles, BarChart, DollarSign, Headphones, Link, Globe } from "lucide-react";

export function Features() {
  const features = [
    { icon: Zap, title: "All-in-One Platform", desc: "Stop juggling multiple apps. Everything you need in one place" },
    { icon: Shield, title: "Bank-Level Security", desc: "256-bit encryption, biometric auth, and fraud protection" },
    { icon: DollarSign, title: "Zero Hidden Fees", desc: "Transparent pricing with no surprises" },
    { icon: Sparkles, title: "Real-Time Everything", desc: "Instant transfers, live market data, immediate insights" },
    { icon: BarChart, title: "AI-Powered Intelligence", desc: "Smart recommendations that adapt to your goals" },
    { icon: Headphones, title: "24/7 Support", desc: "Human support when you need it, AI help anytime" },
    { icon: Link, title: "Seamless Integration", desc: "Money flows between products without friction" },
    { icon: Globe, title: "Global Access", desc: "Multi-currency support for international transactions" }
  ];

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Why Choose Aura Finance?</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="glass rounded-xl p-6 hover:scale-105 transition-transform">
                <Icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
