"use client";

import { useState } from "react";

export function ProductTabs() {
  const [active, setActive] = useState(0);

  const tabs = [
    { name: "AuraBank", features: ["High-yield savings (up to 4.5% APY)", "No-fee checking accounts", "Virtual and physical debit cards", "Personal and business loans", "Credit builder tools", "Direct deposit", "ATM network access", "Overdraft protection"] },
    { name: "AuraVest", features: ["Stocks, ETFs, and fractional shares", "Cryptocurrency trading (50+ coins)", "Digital and physical gold", "NFT marketplace", "Real-time market data", "Portfolio analytics", "Automated investing", "Tax reporting tools"] },
    { name: "AuraWallet", features: ["Instant P2P payments", "QR code transactions", "Bill payments and reminders", "Virtual cards for online shopping", "Split expenses with groups", "International transfers", "Cashback rewards", "Merchant payments"] },
    { name: "AuraAI", features: ["Personalized spending insights", "Investment recommendations", "Budget optimization", "Bill negotiation alerts", "Fraud detection", "Savings goal tracking", "Natural language queries", "Predictive analytics"] }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Product Deep Dive</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              className={`px-6 py-3 rounded-full font-semibold transition ${
                active === idx
                  ? "bg-gradient-to-r from-primary to-magenta text-white"
                  : "glass hover:bg-white/10"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="glass rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6">{tabs[active].name} Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {tabs[active].features.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
