"use client";

import { Code } from "lucide-react";
import { Button } from "./ui/button";

export function Integration() {
  const partners = [
    "Visa", "Mastercard", "PayPal", "Stripe", "Plaid", "Coinbase",
    "Binance", "Apple Pay", "Google Pay", "AWS", "Cloudflare", "MongoDB"
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Plays Well With Others</h2>
          <p className="text-xl text-muted-foreground">Integrated with the tools and platforms you already use</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {partners.map((partner, index) => (
            <div key={index} className="glass rounded-lg p-6 flex items-center justify-center hover:scale-105 transition-transform">
              <span className="font-semibold text-muted-foreground">{partner}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
