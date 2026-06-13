"use client";

import { useEffect, useState } from "react";

type Coin = { id: string; symbol: string; price: number; change: number };

const fmt = (n: number) =>
  n >= 1000
    ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${n.toFixed(n < 1 ? 4 : 2)}`;

const FALLBACK: Coin[] = [
  { id: 'bitcoin',     symbol: 'BTC',  price: 67420,  change: 2.14  },
  { id: 'ethereum',    symbol: 'ETH',  price: 3520,   change: 1.87  },
  { id: 'solana',      symbol: 'SOL',  price: 148.30, change: 3.21  },
  { id: 'binancecoin', symbol: 'BNB',  price: 582.40, change: -0.45 },
  { id: 'ripple',      symbol: 'XRP',  price: 0.6182, change: 1.12  },
  { id: 'cardano',     symbol: 'ADA',  price: 0.4521, change: -1.03 },
  { id: 'avalanche-2', symbol: 'AVAX', price: 36.84,  change: 4.56  },
  { id: 'polkadot',    symbol: 'DOT',  price: 7.23,   change: -0.78 },
];

export function MarketTicker() {
  const [coins, setCoins] = useState<Coin[]>(FALLBACK);

  const load = async () => {
    try {
      const res = await fetch('/api/ticker');
      if (res.ok) setCoins(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const items = [...coins, ...coins];

  return (
    <div className="w-full bg-white border-b border-gray-100 overflow-hidden py-2 shadow-sm">
      <div
        className="flex items-center gap-0 whitespace-nowrap"
        style={{ animation: 'ticker-scroll 36s linear infinite' }}
      >
        {items.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-5 border-r border-gray-100 last:border-r-0">
            <span className="font-bold text-gray-800 text-sm">{c.symbol}</span>
            <span className="text-gray-600 text-sm">{fmt(c.price)}</span>
            <span className={`text-xs font-semibold ${c.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
