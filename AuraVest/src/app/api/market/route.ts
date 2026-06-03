import { NextRequest, NextResponse } from 'next/server';

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

type CacheEntry = { data: unknown; fetchedAt: number };
const cache: Record<string, CacheEntry> = {};

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry || Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
  return entry.data as T;
}

function setCache(key: string, data: unknown) {
  cache[key] = { data, fetchedAt: Date.now() };
}

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  Accept: 'application/json',
};

// ── Crypto via CoinGecko (free, no key) ──────────────────────────────────────

const COINGECKO_IDS = [
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano',
  'polkadot', 'chainlink', 'avalanche-2', 'matic-network', 'uniswap',
  'algorand', 'vechain', 'ripple', 'dogecoin', 'shiba-inu',
  'litecoin', 'monero', 'cosmos', 'near', 'the-sandbox',
].join(',');

const STOCK_ICON_SLUGS: Record<string, string> = {
  AAPL: 'apple',
  MSFT: 'microsoft',
  GOOGL: 'google',
  TSLA: 'tesla',
  AMZN: 'amazon',
  NVDA: 'nvidia',
  META: 'meta',
  JPM: 'jpmorgan',
  V: 'visa',
  NFLX: 'netflix',
};

async function fetchCrypto() {
  const cached = getCached<unknown[]>('crypto');
  if (cached) return cached;

  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINGECKO_IDS}&order=market_cap_desc&per_page=20&page=1&sparkline=false`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

  const raw = (await res.json()) as Array<{
    symbol: string; name: string; current_price: number; image: string;
    price_change_percentage_24h: number; market_cap: number; total_volume: number;
  }>;

  const data = raw
    .filter((c) => c.current_price != null)
    .map((c) => ({
      id: c.symbol.toUpperCase(),
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      price: c.current_price,
      change24h: Number((c.price_change_percentage_24h ?? 0).toFixed(2)),
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      image: c.image ?? '',
    }));

  setCache('crypto', data);
  return data;
}

// ── Single symbol via Yahoo Finance v8 chart ─────────────────────────────────

type YFMeta = {
  symbol?: string; shortName?: string; longName?: string;
  regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number;
  marketCap?: number; regularMarketVolume?: number; exchangeName?: string;
};

async function fetchYFSymbol(symbol: string): Promise<YFMeta | null> {
  try {
    const encoded = encodeURIComponent(symbol);
    const res = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`,
      { headers: YF_HEADERS },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { chart?: { result?: Array<{ meta?: YFMeta }> } };
    return json.chart?.result?.[0]?.meta ?? null;
  } catch {
    return null;
  }
}

function changePercent(current: number, previous: number): number {
  if (!previous || !current) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

// ── Stocks ────────────────────────────────────────────────────────────────────

const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'JPM', 'V', 'NFLX'];

async function fetchStocks() {
  const cached = getCached<unknown[]>('stocks');
  if (cached) return cached;

  const metas = await Promise.all(STOCK_SYMBOLS.map(fetchYFSymbol));

  const data = metas
    .map((meta, i) => {
      if (!meta?.regularMarketPrice) return null;
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
      return {
        id: STOCK_SYMBOLS[i],
        name: meta.shortName ?? meta.longName ?? STOCK_SYMBOLS[i],
        symbol: STOCK_SYMBOLS[i],
        price: meta.regularMarketPrice,
        change24h: changePercent(meta.regularMarketPrice, prev),
        marketCap: meta.marketCap ?? 0,
        volume24h: meta.regularMarketVolume ?? 0,
        exchange: meta.exchangeName ?? 'NASDAQ',
        image: STOCK_ICON_SLUGS[STOCK_SYMBOLS[i]]
          ? `https://cdn.simpleicons.org/${STOCK_ICON_SLUGS[STOCK_SYMBOLS[i]]}`
          : STOCK_SYMBOLS[i],
      };
    })
    .filter(Boolean);

  if (data.length > 0) setCache('stocks', data);
  return data;
}

// ── Gold via Yahoo Finance GC=F futures ──────────────────────────────────────

async function fetchGold() {
  const cached = getCached<unknown>('gold');
  if (cached) return cached;

  const meta = await fetchYFSymbol('GC=F');
  if (!meta?.regularMarketPrice) throw new Error('Gold price unavailable');

  const pricePerOunce = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? pricePerOunce;
  const TROY_OZ_PER_GRAM = 31.1035;

  const data = {
    pricePerOunce: Number(pricePerOunce.toFixed(2)),
    pricePerGram: Number((pricePerOunce / TROY_OZ_PER_GRAM).toFixed(2)),
    change24h: changePercent(pricePerOunce, prev),
  };

  setCache('gold', data);
  return data;
}

// ── Route ────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? '';

  try {
    if (type === 'crypto') return NextResponse.json({ ok: true, data: await fetchCrypto() }, { headers: corsHeaders });
    if (type === 'stocks') return NextResponse.json({ ok: true, data: await fetchStocks() }, { headers: corsHeaders });
    if (type === 'gold')   return NextResponse.json({ ok: true, data: await fetchGold() },   { headers: corsHeaders });
    return NextResponse.json({ ok: false, error: 'Use type=crypto|stocks|gold' }, { status: 400, headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fetch failed';
    console.error(`[/api/market] type=${type}: ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 502, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
