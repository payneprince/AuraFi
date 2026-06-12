"use client";

import { Fragment } from "react";

// Row 1 — payments & cards
const ROW_1 = [
  { name: "Paystack",     src: "/images/int-paystack.png" },
  { name: "Visa",         src: "/images/int-visa.svg" },
  { name: "Mastercard",   src: "/images/int-mastercard.svg" },
  { name: "Stripe",       src: "/images/int-stripe.svg" },
  { name: "MTN MoMo",    src: "/images/int-mtnmomo.png" },
  { name: "Amex",         src: "/images/int-amex.svg" },
  { name: "Telecel Cash", src: "/images/int-telecelcash.jpg" },
  { name: "Flutterwave",  src: "/images/int-flutterwave.png" },
  { name: "Apple Pay",    src: "/images/int-applepay.svg" },
  { name: "Google Pay",   src: "/images/int-googlepay.svg" },
  { name: "Plaid",        src: "/images/int-plaid.png" },
];

// Row 2 — banking, markets & infrastructure
const ROW_2 = [
  { name: "Ecobank",       src: "/images/int-ecobank.png" },
  { name: "GCB Bank",      src: "/images/int-gcb.png" },
  { name: "Bank of Ghana", src: "/images/int-bog.png" },
  { name: "Databank",      src: "/images/int-databank.png" },
  { name: "SWIFT",         src: "/images/int-swift.svg" },
  { name: "NASDAQ",        src: "/images/int-nasdaq.png" },
  { name: "TradingView",   src: "/images/int-tradingview.svg" },
  { name: "Binance",       src: "/images/int-binance.svg" },
  { name: "CoinGecko",     src: "/images/int-coingecko.svg" },
  { name: "Yahoo Finance", src: "/images/int-yahoo.svg" },
  { name: "AWS",           src: "/images/int-aws.svg" },
  { name: "Twilio",        src: "/images/int-twilio.svg" },
  { name: "Groq AI",       src: "/images/int-groq.svg" },
  { name: "GSE",           src: "/images/int-gse.png" },
  { name: "GoldBod",       src: "/images/int-goldbod.png" },
];

const track1 = [...ROW_1, ...ROW_1, ...ROW_1];
const track2 = [...ROW_2, ...ROW_2, ...ROW_2];

function Pill({ name, src }: { name: string; src: string }) {
  return (
    <div className="inline-flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 mx-2 flex-shrink-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-gray-100/80 hover:shadow-[0_8px_24px_rgba(0,0,0,0.13)] hover:border-teal/30 hover:scale-105 hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-200 cursor-default will-change-transform">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        className="w-7 h-7 object-contain flex-shrink-0"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
      <span className="text-gray-700 text-xs font-semibold whitespace-nowrap tracking-wide">{name}</span>
    </div>
  );
}

export function Integration() {
  return (
    <section className="py-10 overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-7">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal bg-teal/10 px-4 py-1.5 rounded-full mb-3">
          Ecosystem
        </span>
        <h2 className="text-3xl font-bold mb-1.5">Plays Well With Others</h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Built on the financial infrastructure you already trust.
        </p>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="relative w-full overflow-hidden py-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10" />
        <div
          className="flex items-center"
          style={{ animation: "marquee-left 40s linear infinite", willChange: "transform" }}
        >
          {track1.map((item, i) => <Pill key={i} {...item} />)}
        </div>
      </div>

      {/* Row 2 — scrolls right */}
      <div className="relative w-full overflow-hidden py-2 mt-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10" />
        <div
          className="flex items-center"
          style={{ animation: "marquee-right 40s linear infinite", willChange: "transform" }}
        >
          {track2.map((item, i) => <Pill key={i} {...item} />)}
        </div>
      </div>

      {/* Stat strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-7">
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3">
          {[
            "Zero Hidden Fees",
            "Instant Settlements",
            "Real-time Sync",
            "Bank-Grade Security",
          ].map((item, i, arr) => (
            <Fragment key={item}>
              <span className="text-sm font-semibold text-gray-500">{item}</span>
              {i < arr.length - 1 && (
                <span className="hidden sm:block w-1 h-1 rounded-full bg-teal/50" />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-left {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-33.333%, 0, 0); }
        }
        @keyframes marquee-right {
          from { transform: translate3d(-33.333%, 0, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </section>
  );
}
