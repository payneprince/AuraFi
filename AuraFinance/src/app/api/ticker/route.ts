import { NextResponse } from 'next/server';

const FALLBACK = [
  { id: 'bitcoin',      symbol: 'BTC',  price: 67420,   change: 2.14  },
  { id: 'ethereum',     symbol: 'ETH',  price: 3520,    change: 1.87  },
  { id: 'solana',       symbol: 'SOL',  price: 148.30,  change: 3.21  },
  { id: 'binancecoin',  symbol: 'BNB',  price: 582.40,  change: -0.45 },
  { id: 'ripple',       symbol: 'XRP',  price: 0.6182,  change: 1.12  },
  { id: 'cardano',      symbol: 'ADA',  price: 0.4521,  change: -1.03 },
  { id: 'avalanche-2',  symbol: 'AVAX', price: 36.84,   change: 4.56  },
  { id: 'polkadot',     symbol: 'DOT',  price: 7.23,    change: -0.78 },
];

export async function GET() {
  try {
    const ids = 'bitcoin,ethereum,solana,binancecoin,ripple,cardano,avalanche-2,polkadot';
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error('CoinGecko rate limited');

    const data = await res.json();

    const coins = FALLBACK.map(c => ({
      id:     c.id,
      symbol: c.symbol,
      price:  data[c.id]?.usd         ?? c.price,
      change: data[c.id]?.usd_24h_change ?? c.change,
    }));

    return NextResponse.json(coins, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch {
    return NextResponse.json(FALLBACK, {
      headers: { 'Cache-Control': 'public, s-maxage=30' },
    });
  }
}
