// src/lib/marketData.tsx
import { cryptoAssets as mockCrypto, stockAssets as mockStocks, goldData as mockGold } from './mockData';

// ── Client-side cache ─────────────────────────────────────────────────────────

type MarketAsset = {
  id: string; name: string; symbol: string; price: number; change24h: number;
  marketCap?: number; volume24h?: number; exchange?: string; image: string;
};

type GoldApiData = { pricePerOunce: number; pricePerGram: number; change24h: number };

const CLIENT_CACHE_TTL = 2 * 60 * 1000; // 2 min

let cryptoCache: { data: MarketAsset[] | null; fetchedAt: number } = { data: null, fetchedAt: 0 };
let stocksCache: { data: MarketAsset[] | null; fetchedAt: number } = { data: null, fetchedAt: 0 };
let goldApiCache: { data: GoldApiData | null; fetchedAt: number } = { data: null, fetchedAt: 0 };

export async function loadCrypto(): Promise<MarketAsset[]> {
  if (cryptoCache.data && Date.now() - cryptoCache.fetchedAt < CLIENT_CACHE_TTL) {
    return cryptoCache.data;
  }
  try {
    const res = await fetch('/api/market?type=crypto');
    const json = (await res.json()) as { ok: boolean; data: MarketAsset[] };
    if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
      cryptoCache = { data: json.data, fetchedAt: Date.now() };
      return json.data;
    }
  } catch {
    // fall through to mock
  }
  return mockCrypto as MarketAsset[];
}

// Locally-downloaded brand logos (public/logos/stocks/) so every listed equity
// (US & international) renders a real logo without depending on a remote CDN.
export const STOCK_LOGO_FILES: Record<string, string> = {
  AAPL: 'AAPL.png', MSFT: 'MSFT.png', GOOGL: 'GOOGL.png', TSLA: 'TSLA.png',
  AMZN: 'AMZN.png', NVDA: 'NVDA.png', META: 'META.png', NFLX: 'NFLX.png',
  JPM: 'JPM.png', V: 'V.svg', JNJ: 'JNJ.png', WMT: 'WMT.png',
  PG: 'PG.png', KO: 'KO.png', DIS: 'DIS.png', BA: 'BA.svg',
  XOM: 'XOM.png', PFE: 'PFE.png', INTC: 'INTC.png', AMD: 'AMD.svg',
  CRM: 'CRM.png', ORCL: 'ORCL.png', IBM: 'IBM.png', CSCO: 'CSCO.svg',
  ADBE: 'ADBE.png', NOW: 'NOW.png', UBER: 'UBER.png', SPOT: 'SPOT.png',
  ZM: 'ZM.png', SQ: 'SQ.svg', SHOP: 'SHOP.png', PYPL: 'PYPL.png',
  EBAY: 'EBAY.svg', TWTR: 'TWTR.svg',
};

function resolveStockLogos(list: MarketAsset[]): MarketAsset[] {
  return list.map((asset) => {
    if (asset.image?.startsWith('/logos/stocks/')) return asset;
    const file = STOCK_LOGO_FILES[asset.symbol];
    return file ? { ...asset, image: `/logos/stocks/${file}` } : asset;
  });
}

export async function loadStocks(): Promise<MarketAsset[]> {
  if (stocksCache.data && Date.now() - stocksCache.fetchedAt < CLIENT_CACHE_TTL) {
    return stocksCache.data;
  }
  try {
    const res = await fetch('/api/market?type=stocks');
    const json = (await res.json()) as { ok: boolean; data: MarketAsset[] };
    if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
      const resolved = resolveStockLogos(json.data);
      stocksCache = { data: resolved, fetchedAt: Date.now() };
      return resolved;
    }
  } catch {
    // fall through to mock
  }
  return resolveStockLogos(mockStocks as MarketAsset[]);
}

async function loadGold(): Promise<GoldApiData> {
  if (goldApiCache.data && Date.now() - goldApiCache.fetchedAt < CLIENT_CACHE_TTL) {
    return goldApiCache.data;
  }
  try {
    const res = await fetch('/api/market?type=gold');
    const json = (await res.json()) as { ok: boolean; data: GoldApiData };
    if (json.ok && json.data?.pricePerOunce) {
      goldApiCache = { data: json.data, fetchedAt: Date.now() };
      return json.data;
    }
  } catch {
    // fall through to mock
  }
  return { pricePerOunce: mockGold.pricePerOunce, pricePerGram: mockGold.pricePerGram, change24h: mockGold.change24h };
}

// ── Real-time polling (replaces fake WebSocket) ───────────────────────────────

let pollInterval: ReturnType<typeof setInterval> | null = null;
let subscribers: ((prices: Record<string, { price: number; change24h: number }>) => void)[] = [];

async function runPoll() {
  const assets = await loadCrypto();
  if (!assets.length) return;
  const prices: Record<string, { price: number; change24h: number }> = {};
  for (const a of assets) prices[a.symbol] = { price: a.price, change24h: a.change24h };
  subscribers.forEach((cb) => cb(prices));
}

export function startCryptoWebSocket() {
  if (pollInterval) return;
  void runPoll(); // immediate first fetch
  pollInterval = setInterval(() => void runPoll(), 30_000); // refresh every 30s
}

export function subscribeToCrypto(callback: (prices: Record<string, { price: number; change24h: number }>) => void) {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter((s) => s !== callback);
    if (subscribers.length === 0 && pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}

// ── Public data functions ──────────────────────────────────────────────────────

export async function getCryptoPage(page: number): Promise<MarketAsset[]> {
  const all = await loadCrypto();
  const start = (page - 1) * 10;
  return all.slice(start, start + 10);
}

export async function getStocksPage(page: number): Promise<MarketAsset[]> {
  const all = await loadStocks();
  const start = (page - 1) * 10;
  return all.slice(start, start + 10);
}

export async function getGoldList(): Promise<unknown[]> {
  const gold = await loadGold();
  const { pricePerOunce, pricePerGram, change24h } = gold;

  return [
    { id: 'gold-spot-gram',   name: 'Gold Spot (per gram)',      symbol: 'GOLD',    price: pricePerGram,             change24h, type: 'physical', purity: '24K', unit: 'gram',  image: '🥇' },
    { id: 'gold-spot-ounce',  name: 'Gold Spot (per ounce)',     symbol: 'XAU',     price: pricePerOunce,            change24h, type: 'physical', purity: '24K', unit: 'ounce', image: '🏆' },
    { id: 'gold-18k-gram',    name: 'Gold 18K (per gram)',       symbol: 'GOLD18K', price: pricePerGram * 0.75,      change24h, type: 'physical', purity: '18K', unit: 'gram',  image: '💍' },
    { id: 'gold-18k-ounce',   name: 'Gold 18K (per ounce)',      symbol: 'XAU18K',  price: pricePerOunce * 0.75,     change24h, type: 'physical', purity: '18K', unit: 'ounce', image: '💎' },
    { id: 'gold-etf',         name: 'SPDR Gold Shares ETF',      symbol: 'GLD',     price: pricePerOunce * 0.1,      change24h, type: 'digital',  purity: '24K', unit: 'share', image: '📈' },
    { id: 'gold-digital-gram',name: 'Digital Gold (per gram)',   symbol: 'DGOLD',   price: pricePerGram * 1.02,      change24h, type: 'digital',  purity: '24K', unit: 'gram',  image: '💰' },
    { id: 'gold-digital-ounce',name:'Digital Gold (per ounce)', symbol: 'DXAU',    price: pricePerOunce * 1.02,     change24h, type: 'digital',  purity: '24K', unit: 'ounce', image: '🪙' },
  ];
}

// ── NFT data (stays static — no free NFT API) ─────────────────────────────────

export async function getNFTList(): Promise<unknown[]> {
  return [
    { id: '1',  name: 'Bored Ape Yacht Club',       symbol: 'BAYC',      price: 25.5,  volume24h: 1250000, change24h: 2.3,  image: '/nft/bayc.jpg' },
    { id: '2',  name: 'CryptoPunks',                symbol: 'PUNK',      price: 45.2,  volume24h: 890000,  change24h: -1.8, image: '/nft/nft-2.jpg' },
    { id: '3',  name: 'Azuki',                      symbol: 'BEAN',      price: 12.8,  volume24h: 450000,  change24h: 5.1,  image: '/nft/nft-3.jpg' },
    { id: '4',  name: 'World of Women',             symbol: 'WOW',       price: 8.9,   volume24h: 320000,  change24h: 1.2,  image: '/nft/nft-4.jpg' },
    { id: '5',  name: 'Doodles',                    symbol: 'DOODLE',    price: 6.7,   volume24h: 280000,  change24h: -0.5, image: '/nft/nft-5.jpg' },
    { id: '6',  name: 'Clone X',                    symbol: 'CLONEX',    price: 15.3,  volume24h: 560000,  change24h: 3.7,  image: '/nft/nft-6.jpg' },
    { id: '7',  name: 'Pudgy Penguins',             symbol: 'PENGUIN',   price: 4.2,   volume24h: 180000,  change24h: 0.8,  image: '/nft/nft-7.jpg' },
    { id: '8',  name: 'Art Blocks',                 symbol: 'BLOCKS',    price: 3.1,   volume24h: 95000,   change24h: 1.9,  image: '/nft/nft-8.jpg' },
    { id: '9',  name: 'Moonbirds',                  symbol: 'MOON',      price: 9.8,   volume24h: 245000,  change24h: -2.1, image: '/nft/nft-9.jpg' },
    { id: '10', name: 'Beeple Everydays',           symbol: 'BEEPLE',    price: 18.5,  volume24h: 380000,  change24h: 4.2,  image: '/nft/nft-10.jpg' },
    { id: '11', name: 'Meebits',                    symbol: 'MEEBIT',    price: 2.9,   volume24h: 78000,   change24h: 0.7,  image: '/nft/nft-11.jpg' },
    { id: '12', name: 'World of Women Galaxy',      symbol: 'WOWG',      price: 5.4,   volume24h: 165000,  change24h: 2.8,  image: '/nft/nft-12.jpg' },
    { id: '13', name: 'Invisible Friends',          symbol: 'INVISIBLE', price: 7.2,   volume24h: 210000,  change24h: -1.4, image: '/nft/nft-13.jpg' },
    { id: '14', name: 'Otherdeed for Otherside',    symbol: 'OTHER',     price: 3.8,   volume24h: 125000,  change24h: 3.5,  image: '/nft/nft-14.jpg' },
    { id: '15', name: 'Mutant Ape Yacht Club',      symbol: 'MAYC',      price: 11.6,  volume24h: 320000,  change24h: 1.6,  image: '/nft/nft-15.jpg' },
    { id: '16', name: 'Bored Ape Kennel Club',      symbol: 'BAKC',      price: 8.9,   volume24h: 195000,  change24h: -0.9, image: '/nft/nft-16.jpg' },
    { id: '17', name: 'The Sandbox',               symbol: 'SAND',      price: 4.7,   volume24h: 140000,  change24h: 2.3,  image: '/nft/nft-17.jpg' },
    { id: '18', name: 'Decentraland',              symbol: 'MANA',      price: 2.1,   volume24h: 85000,   change24h: 1.1,  image: '/nft/nft-18.jpg' },
    { id: '19', name: 'Axie Infinity',             symbol: 'AXIE',      price: 6.3,   volume24h: 175000,  change24h: -1.7, image: '/nft/nft-19.jpg' },
    { id: '20', name: 'Illuvium',                  symbol: 'ILV',       price: 85.4,  volume24h: 420000,  change24h: 5.8,  image: '/nft/nft-20.jpg' },
    { id: '21', name: 'Gala Games',                symbol: 'GALA',      price: 0.15,  volume24h: 65000,   change24h: 3.2,  image: '/nft/nft-21.jpg' },
    { id: '22', name: 'Enjin Coin',                symbol: 'ENJ',       price: 1.8,   volume24h: 92000,   change24h: 0.4,  image: '/nft/nft-22.jpg' },
    { id: '23', name: 'The Graph',                 symbol: 'GRT',       price: 0.45,  volume24h: 135000,  change24h: -2.5, image: '/nft/nft-23.jpg' },
  ];
}
