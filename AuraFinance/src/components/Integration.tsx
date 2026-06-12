"use client";

const ROW_1 = [
  { name: "Paystack",     src: "/images/int-paystack.png" },
  { name: "Visa",         src: "/images/int-visa.svg" },
  { name: "Mastercard",   src: "/images/int-mastercard.svg" },
  { name: "MTN MoMo",     src: "/images/int-mtnmomo.png" },
  { name: "Amex",         src: "/images/int-amex.svg" },
  { name: "Telecel Cash", src: "/images/int-telecelcash.jpg" },
  { name: "Ecobank",      src: "/images/int-ecobank.png" },
];

const ROW_2 = [
  { name: "GCB Bank",      src: "/images/int-gcb.png" },
  { name: "Bank of Ghana", src: "/images/int-bog.png" },
  { name: "Databank",      src: "/images/int-databank.png" },
  { name: "NASDAQ",        src: "/images/int-nasdaq.png" },
  { name: "Binance",   src: "/images/int-binance.svg" },
  { name: "CoinGecko", src: "/images/int-coingecko.svg" },
  { name: "Groq AI",   src: "/images/int-groq.svg" },
];

function Pill({ name, src }: { name: string; src: string }) {
  return (
    <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-gray-100 mx-3 flex-shrink-0">
      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="w-7 h-7 object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <span className="font-semibold text-gray-800 text-sm whitespace-nowrap">{name}</span>
    </div>
  );
}

export function Integration() {
  const track1 = [...ROW_1, ...ROW_1];
  const track2 = [...ROW_2, ...ROW_2];

  return (
    <section className="py-24 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal bg-teal/10 px-4 py-1.5 rounded-full mb-4">
          Ecosystem
        </span>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Plays Well With Others</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Built on the financial infrastructure you already trust — payments,
          banking, market data, and more.
        </p>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="relative w-full overflow-hidden py-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-slate-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white to-transparent z-10" />
        <div
          className="flex items-center"
          style={{ animation: "marquee-left 38s linear infinite", willChange: "transform" }}
        >
          {track1.map((item, i) => (
            <Pill key={i} {...item} />
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right */}
      <div className="relative w-full overflow-hidden py-3 mt-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-slate-50 to-transparent z-10" />
        <div
          className="flex items-center"
          style={{ animation: "marquee-right 38s linear infinite", willChange: "transform" }}
        >
          {track2.map((item, i) => (
            <Pill key={i} {...item} />
          ))}
        </div>
      </div>

      {/* Bottom stat strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-wrap justify-center gap-10 text-center">
          {[
            { value: "14+", label: "Integrated Partners" },
            { value: "99.9%", label: "Uptime Guarantee" },
            { value: "256-bit", label: "Encryption Standard" },
            { value: "PCI DSS", label: "Compliant" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-gray-900">{value}</div>
              <div className="text-sm text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
