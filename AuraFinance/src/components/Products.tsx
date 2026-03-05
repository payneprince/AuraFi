"use client";

import Image from "next/image";

export function Products() {
  const products = [
    {
      name: "AuraBank",
      image: "/images/bank.jpg",
      desc: "Complete digital banking with savings, checking, loans, and cards",
      features: ["Zero fees", "Instant transfers", "High-yield savings", "Virtual cards"]
    },
    {
      name: "AuraVest",
      image: "/images/vest.jpeg",
      desc: "Invest in stocks, crypto, gold, and NFTs from one platform",
      features: ["Multi-asset trading", "Real-time analytics", "Low fees", "Portfolio insights"]
    },
    {
      name: "AuraWallet",
      image: "/images/wallet.jpg",
      desc: "Send, receive, and manage money instantly with zero friction",
      features: ["QR payments", "Bill payments", "Split expenses", "Instant transfers"]
    },
    {
      name: "AuraAI",
      image: "/images/ai.jpg",
      desc: "AI-powered financial advisor that learns your habits and helps you grow",
      features: ["Smart insights", "Spending analysis", "Investment tips", "24/7 guidance"]
    }
  ];

  return (
    <section id="products" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Four Products, One Powerful Ecosystem</h2>
          <p className="text-xl text-muted-foreground">Everything you need to master your financial life</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, idx) => (
            <div key={idx} className="glass rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer">
              <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center mb-4 overflow-hidden border border-gray-200">
                <Image src={product.image} alt={`${product.name} logo`} width={48} height={48} className="object-cover rounded-xl" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
              <p className="text-muted-foreground mb-4">{product.desc}</p>
              <ul className="space-y-2">
                {product.features.map((f, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="mt-4 text-teal font-semibold hover:underline">
                Explore {product.name.split('Aura')[1]} →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
