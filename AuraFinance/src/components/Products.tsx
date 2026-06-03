"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Bell, Search, Plus, ArrowUpRight, ArrowDownRight, Home, BarChart2, Activity, Briefcase, Menu, TrendingUp } from "lucide-react";

type ProductPromo = {
  name: string;
  mobileTitle: string;
  image: string;
  desc: string;
  features: string[];
  mobileHighlights: Array<{ title: string; desc: string }>;
  promoTitle: string;
  promoCopy: string;
  promoStat: string;
  promoDelta: string;
  watchlist: string[];
  cta: string;
  port: number;
  path?: string;
  theme: {
    overlay: string;
    glow: string;
    accent: string;
    button: string;
    chip: string;
    aura: string;
    pointBg: string;
    pointDot: string;
    ctaShadow: string;
    phoneCard: string;
    phonePillBg: string;
    phonePillText: string;
    phoneActionBg: string;
    phoneActionIcon: string;
    phoneLink: string;
    phoneNavActive: string;
  };
};

export default function Products() {
  const [activeProduct, setActiveProduct] = useState<ProductPromo | null>(null);

  const products = useMemo<ProductPromo[]>(
    () => [
      {
        name: "AuraBank",
        mobileTitle: "AuraBank Mobile",
        image: "/images/bank.jpg",
        desc: "Complete digital banking with savings, checking, loans, and cards",
        features: ["Zero fees", "Instant transfers", "High-yield savings", "Virtual cards"],
        mobileHighlights: [
          { title: "Instant Transfers", desc: "Send money in seconds across your suite accounts" },
          { title: "Secure Biometric Login", desc: "Face ID and fingerprint authentication for safer access" },
          { title: "Bill Pay & Alerts", desc: "Smart reminders and one-tap payment flows" },
          { title: "AuraAI Assistant", desc: "Personalized insights to improve your money habits" },
        ],
        promoTitle: "Every move, your money grows",
        promoCopy:
          "Run daily banking from one cockpit with checking, savings, cards, and transfers that stay in sync across the suite.",
        promoStat: "$82,430.22",
        promoDelta: "+$1,204 this month",
        watchlist: ["Checking", "Savings Vault", "Virtual Card", "Scheduled Bills"],
        cta: "Open AuraBank",
        port: 3001,
        theme: {
          overlay: "from-[#060911]/95 via-[#070d1c]/90 to-[#09142a]/95",
          glow: "bg-[radial-gradient(50%_35%_at_68%_38%,rgba(217,30,120,0.45),transparent_60%),radial-gradient(45%_36%_at_78%_75%,rgba(64,201,201,0.36),transparent_65%)]",
          accent: "text-[#40c9c9]",
          button: "from-[#d91e78] to-[#40c9c9]",
          chip: "bg-[#40c9c9]/20 border-[#40c9c9]/35",
          aura: "bg-[radial-gradient(65%_45%_at_82%_60%,rgba(217,30,120,0.28),transparent_70%)]",
          pointBg: "bg-[#40c9c9]/20",
          pointDot: "bg-[#40c9c9]",
          ctaShadow: "shadow-[0_12px_35px_rgba(217,30,120,0.35)]",
          phoneCard: "from-black/80 via-[#54103d]/80 to-[#0ea5a5]/60",
          phonePillBg: "bg-[#40c9c9]/20",
          phonePillText: "text-[#67e8f9]",
          phoneActionBg: "bg-[#d91e78]/20",
          phoneActionIcon: "text-[#f472b6]",
          phoneLink: "text-[#67e8f9]",
          phoneNavActive: "text-[#67e8f9]",
        },
      },
      {
        name: "AuraVest",
        mobileTitle: "AuraVest Mobile",
        image: "/images/vest.jpeg",
        desc: "Invest in stocks, crypto, gold, and NFTs from one platform",
        features: ["Multi-asset trading", "Real-time analytics", "Low fees", "Portfolio insights"],
        mobileHighlights: [
          { title: "Real-Time Market Data", desc: "Live prices, charts, and alerts as markets move" },
          { title: "Secure Biometric Login", desc: "Protected access with Face ID and fingerprint" },
          { title: "Smart Notifications", desc: "Trade confirmations and portfolio updates instantly" },
          { title: "AuraAI Assistant", desc: "AI-powered investment signals and recommendations" },
        ],
        promoTitle: "Trade smarter, compound faster",
        promoCopy:
          "Execute multi-asset strategies with a fast portfolio view, live performance tracking, and clear insight signals.",
        promoStat: "$126,918.57",
        promoDelta: "+12.8% this month",
        watchlist: ["US Equities", "Crypto", "Gold", "NFTs"],
        cta: "Open AuraVest",
        port: 3002,
        theme: {
          overlay: "from-[#050b19]/95 via-[#071427]/90 to-[#0b1f3c]/95",
          glow: "bg-[radial-gradient(50%_35%_at_68%_38%,rgba(220,38,38,0.48),transparent_60%),radial-gradient(45%_36%_at_78%_75%,rgba(239,68,68,0.38),transparent_65%)]",
          accent: "text-[#f87171]",
          button: "from-[#7f1d1d] to-[#ef4444]",
          chip: "bg-[#f87171]/20 border-[#f87171]/35",
          aura: "bg-[radial-gradient(65%_45%_at_82%_60%,rgba(220,38,38,0.30),transparent_70%)]",
          pointBg: "bg-[#f87171]/20",
          pointDot: "bg-[#f87171]",
          ctaShadow: "shadow-[0_12px_35px_rgba(220,38,38,0.35)]",
          phoneCard: "from-black/80 via-[#6b1111]/80 to-[#ef4444]/60",
          phonePillBg: "bg-[#f87171]/20",
          phonePillText: "text-[#fca5a5]",
          phoneActionBg: "bg-[#ef4444]/20",
          phoneActionIcon: "text-[#fca5a5]",
          phoneLink: "text-[#fca5a5]",
          phoneNavActive: "text-[#fca5a5]",
        },
      },
      {
        name: "AuraWallet",
        mobileTitle: "AuraWallet Mobile",
        image: "/images/aurawallet-logo.jpeg",
        desc: "Send, receive, and manage money instantly with zero friction",
        features: ["QR payments", "Bill payments", "Split expenses", "Instant transfers"],
        mobileHighlights: [
          { title: "QR & Instant Pay", desc: "Pay and receive with near-zero friction" },
          { title: "Card & Wallet Controls", desc: "Track linked cards and spending in real time" },
          { title: "Split Expenses", desc: "Share group costs without manual reconciliation" },
          { title: "Security Alerts", desc: "Transaction notifications keep you protected" },
        ],
        promoTitle: "Fast payments, no friction",
        promoCopy:
          "Handle everyday money flow with instant transfers, bill pay, and split tools designed for mobile-first speed.",
        promoStat: "$6,241.08",
        promoDelta: "+$318 this month",
        watchlist: ["QR Pay", "Bills", "Split Groups", "Top-ups"],
        cta: "Open AuraWallet",
        port: 3003,
        theme: {
          overlay: "from-[#030b18]/95 via-[#051425]/90 to-[#082038]/95",
          glow: "bg-[radial-gradient(50%_35%_at_68%_38%,rgba(14,165,233,0.45),transparent_60%),radial-gradient(45%_36%_at_78%_75%,rgba(45,212,191,0.35),transparent_65%)]",
          accent: "text-[#2dd4bf]",
          button: "from-[#0ea5e9] to-[#2dd4bf]",
          chip: "bg-[#2dd4bf]/20 border-[#2dd4bf]/35",
          aura: "bg-[radial-gradient(65%_45%_at_82%_60%,rgba(34,197,94,0.28),transparent_70%)]",
          pointBg: "bg-[#2dd4bf]/20",
          pointDot: "bg-[#2dd4bf]",
          ctaShadow: "shadow-[0_12px_35px_rgba(45,212,191,0.35)]",
          phoneCard: "from-black/80 via-[#0d271a]/80 to-[#16a34a]/60",
          phonePillBg: "bg-[#2dd4bf]/20",
          phonePillText: "text-[#6ee7b7]",
          phoneActionBg: "bg-[#22c55e]/20",
          phoneActionIcon: "text-[#6ee7b7]",
          phoneLink: "text-[#6ee7b7]",
          phoneNavActive: "text-[#6ee7b7]",
        },
      },
      {
        name: "AuraAI",
        mobileTitle: "AuraAI Mobile",
        image: "/images/ai.jpg",
        desc: "AI-powered financial advisor that learns your habits and helps you grow",
        features: ["Smart insights", "Spending analysis", "Investment tips", "24/7 guidance"],
        mobileHighlights: [
          { title: "Smart Insights", desc: "Cross-app analysis from your bank, vest, and wallet data" },
          { title: "Behavior Tracking", desc: "Spending and investment pattern recognition" },
          { title: "Personalized Nudges", desc: "Actionable next steps based on your goals" },
          { title: "Always-On Guidance", desc: "24/7 recommendations that adapt to your activity" },
        ],
        promoTitle: "AI that reads your money patterns",
        promoCopy:
          "Get unified recommendations from your banking, investing, and wallet activity with guidance tuned to your behavior.",
        promoStat: "97.4% insight relevance",
        promoDelta: "Live adaptive guidance",
        watchlist: ["Spending Signals", "Risk Alerts", "Goal Coaching", "Portfolio Nudges"],
        cta: "Open AuraAI",
        port: 3000,
        path: "/login",
        theme: {
          overlay: "from-[#06091a]/95 via-[#0b1230]/90 to-[#10243f]/95",
          glow: "bg-[radial-gradient(50%_35%_at_68%_38%,rgba(129,140,248,0.45),transparent_60%),radial-gradient(45%_36%_at_78%_75%,rgba(45,212,191,0.34),transparent_65%)]",
          accent: "text-[#a5b4fc]",
          button: "from-[#818cf8] to-[#2dd4bf]",
          chip: "bg-[#a5b4fc]/20 border-[#a5b4fc]/35",
          aura: "bg-[radial-gradient(65%_45%_at_82%_60%,rgba(129,140,248,0.30),transparent_70%)]",
          pointBg: "bg-[#a5b4fc]/20",
          pointDot: "bg-[#a5b4fc]",
          ctaShadow: "shadow-[0_12px_35px_rgba(129,140,248,0.35)]",
          phoneCard: "from-black/80 via-[#312e81]/80 to-[#2dd4bf]/55",
          phonePillBg: "bg-[#a5b4fc]/20",
          phonePillText: "text-[#c7d2fe]",
          phoneActionBg: "bg-[#818cf8]/20",
          phoneActionIcon: "text-[#c7d2fe]",
          phoneLink: "text-[#c7d2fe]",
          phoneNavActive: "text-[#c7d2fe]",
        },
      },
    ],
    [],
  );

  useEffect(() => {
    if (!activeProduct) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveProduct(null);
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("keydown", onEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [activeProduct]);

  const openProduct = (product: ProductPromo) => {
    const host = window.location.hostname || "localhost";
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const url = `${protocol}//${host}:${product.port}${product.path || ""}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="products" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Four Products, One Powerful Ecosystem</h2>
          <p className="text-xl text-muted-foreground">Everything you need to master your financial life</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, idx) => (
            <div key={idx} className="glass rounded-2xl p-6 hover:scale-105 transition-transform">
              <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center mb-4 overflow-hidden border border-gray-200">
                <Image
                  src={product.image}
                  alt={`${product.name} logo`}
                  width={48}
                  height={48}
                  className="object-cover rounded-xl"
                />
              </div>
              <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
              <p className="text-muted-foreground mb-4">{product.desc}</p>
              <ul className="space-y-2">
                {product.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="text-sm flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setActiveProduct(product)}
                className="mt-4 text-teal font-semibold hover:underline"
              >
                Explore {product.name.split("Aura")[1]} →
              </button>
            </div>
          ))}
        </div>
      </div>

      {activeProduct && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${activeProduct.name} promotion`}>
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setActiveProduct(null)}
            aria-label="Close promotion"
          />

          <div className="relative h-screen w-screen flex items-center justify-center p-3 sm:p-6">
            <div
              className={`relative h-[82vh] w-[94vw] max-w-[1180px] overflow-y-auto overflow-x-hidden scrollbar-hide rounded-[28px] border border-white/10 bg-gradient-to-br ${activeProduct.theme.overlay} shadow-[0_40px_120px_rgba(0,0,0,0.75)]`}
            >
              <div className={`pointer-events-none absolute inset-0 ${activeProduct.theme.glow}`} />
              <div className={`pointer-events-none absolute inset-0 ${activeProduct.theme.aura}`} />

              <div className="relative h-full grid lg:grid-cols-[0.95fr_1.05fr] gap-8 p-6 sm:p-10 lg:p-14">
                <div className="flex flex-col justify-center z-10 space-y-6">
                  <div className="inline-flex items-center gap-3 mb-5">
                    <div className="h-12 w-12 rounded-xl bg-white/90 border border-white/40 overflow-hidden flex items-center justify-center">
                      <Image
                        src={activeProduct.image}
                        alt={`${activeProduct.name} logo`}
                        width={48}
                        height={48}
                        className="object-cover rounded-xl"
                      />
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-[0.2em]">Spotlight</p>
                      <p className="text-white font-semibold text-lg">{activeProduct.mobileTitle}</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-3 text-white/85 text-sm mb-5">
                    <span className="text-xl">🚀</span>
                    <span>1,482 launched today</span>
                  </div>

                  <h3 className="text-3xl sm:text-5xl font-bold leading-tight text-white">
                    {activeProduct.promoTitle}
                  </h3>

                  <p className="max-w-xl text-white/85 text-base sm:text-2xl leading-relaxed">
                    {activeProduct.promoCopy}
                  </p>

                  <div className="space-y-3">
                    {activeProduct.mobileHighlights.map((item) => (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className={`mt-1.5 h-5 w-5 rounded-full ${activeProduct.theme.pointBg} flex items-center justify-center`}>
                          <div className={`h-2 w-2 rounded-full ${activeProduct.theme.pointDot}`} />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                          <p className="text-white/75 text-sm sm:text-base">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="bg-black/30 backdrop-blur-sm hover:bg-black/40 px-2 py-2 rounded-xl transition-colors">
                      <Image src="/images/app-store-badge.svg" alt="Download on the App Store" width={160} height={48} className="h-10 w-auto" />
                    </button>

                    <button className="bg-black/30 backdrop-blur-sm hover:bg-black/40 px-2 py-2 rounded-xl transition-colors">
                      <Image src="/images/google-play-badge.svg" alt="Get it on Google Play" width={170} height={48} className="h-10 w-auto" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openProduct(activeProduct)}
                      className={`rounded-full bg-gradient-to-r ${activeProduct.theme.button} px-8 py-4 text-base sm:text-lg font-bold text-white ${activeProduct.theme.ctaShadow} hover:brightness-110 transition-all`}
                    >
                      {activeProduct.cta}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveProduct(null)}
                      className="rounded-full border border-white/25 bg-white/5 px-8 py-4 text-base sm:text-lg font-semibold text-white/90 hover:bg-white/10 transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-1 max-w-md">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">4.9</p>
                      <p className="text-xs text-white/70">App Rating</p>
                    </div>
                    <div className="text-center border-x border-white/20">
                      <p className="text-2xl font-bold text-white">1M+</p>
                      <p className="text-xs text-white/70">Downloads</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">24/7</p>
                      <p className="text-xs text-white/70">Support</p>
                    </div>
                  </div>
                </div>

                <div className="relative hidden lg:flex items-center justify-center">
                  <div className="relative w-64 h-[520px] mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl transform rotate-6 opacity-50" />

                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black rounded-[3rem] shadow-2xl border-[10px] border-gray-800 overflow-hidden">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-30" />

                      <div className="absolute top-1 left-0 right-0 px-7 flex justify-between items-center text-[9px] text-white/90 z-20">
                        <span className="font-medium">9:41</span>
                        <div className="w-3 h-1.5 border border-white/80 rounded-[2px] flex items-center px-[1px]">
                          <div className="w-full h-[3px] bg-white rounded-[1px]" />
                        </div>
                      </div>

                      <div className="h-full pt-6 pb-14 flex flex-col">
                        <div className="flex-1 overflow-y-scroll scrollbar-hide px-3 space-y-2">
                          <div className="flex justify-between items-center pt-1 pb-2">
                            <div>
                              <p className="text-[9px] text-white/50">Welcome back</p>
                              <p className="text-xs font-bold text-white">{activeProduct.name}</p>
                            </div>
                            <div className="flex gap-1.5">
                              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                                <Bell className="w-2.5 h-2.5 text-white" />
                              </div>
                              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                                <Search className="w-2.5 h-2.5 text-white" />
                              </div>
                            </div>
                          </div>

                          <div className={`bg-gradient-to-r ${activeProduct.theme.phoneCard} rounded-xl p-3 shadow-lg`}>
                            <div className="flex justify-between items-start mb-1.5">
                              <div>
                                <p className="text-[8px] text-white/70">Total Balance</p>
                                <p className="text-xl font-bold text-white">{activeProduct.promoStat}</p>
                              </div>
                              <div className={`${activeProduct.theme.phonePillBg} px-1.5 py-0.5 rounded-full flex items-center gap-0.5`}>
                                <TrendingUp className={`w-2.5 h-2.5 ${activeProduct.theme.phonePillText}`} />
                                <span className={`text-[8px] ${activeProduct.theme.phonePillText} font-semibold`}>Live</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5 py-1.5">
                            {[
                              { icon: Plus, label: "Buy" },
                              { icon: ArrowDownRight, label: "Sell" },
                              { icon: ArrowUpRight, label: "Trade" },
                              { icon: ArrowUpRight, label: "Send" },
                            ].map(({ icon: Icon, label }) => (
                              <button key={label} className="flex flex-col items-center gap-0.5 bg-white/5 rounded-lg p-1.5">
                                <div className={`w-6 h-6 ${activeProduct.theme.phoneActionBg} rounded-full flex items-center justify-center`}>
                                  <Icon className={`w-3 h-3 ${activeProduct.theme.phoneActionIcon}`} />
                                </div>
                                <span className="text-[7px] text-white/70">{label}</span>
                              </button>
                            ))}
                          </div>

                          <div className="pt-1">
                            <div className="flex justify-between items-center mb-1.5">
                              <p className="text-[10px] font-semibold text-white">Highlights</p>
                              <button className={`text-[8px] ${activeProduct.theme.phoneLink}`}>View All</button>
                            </div>
                            <div className="space-y-1.5">
                              {activeProduct.features.map((feature, idx) => (
                                <div key={feature} className="bg-white/5 rounded-lg p-1.5 flex items-center justify-between">
                                  <p className="text-[9px] font-semibold text-white">{feature}</p>
                                  <span className="text-[8px] text-white/50">#{idx + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-black/90 border-t border-white/5 px-2 py-2">
                          <div className="flex justify-around items-center">
                            {[
                              { icon: Home, label: "Home", active: true },
                              { icon: BarChart2, label: "Markets", active: false },
                              { icon: Activity, label: "Trade", active: false },
                              { icon: Briefcase, label: "Portfolio", active: false },
                              { icon: Menu, label: "More", active: false },
                            ].map(({ icon: Icon, label, active }) => (
                              <button key={label} className="flex flex-col items-center gap-0.5 w-10">
                                <Icon className={`w-3.5 h-3.5 ${active ? activeProduct.theme.phoneNavActive : "text-white/30"}`} />
                                <span className={`text-[6px] font-medium ${active ? activeProduct.theme.phoneNavActive : "text-white/30"}`}>{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveProduct(null)}
                  className="absolute right-4 top-4 sm:right-6 sm:top-6 h-10 w-10 rounded-full bg-white/10 text-white/90 hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
