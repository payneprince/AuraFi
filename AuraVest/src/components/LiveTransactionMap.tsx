'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, X, Clock, MapPin } from 'lucide-react';
import { cryptoAssets, stockAssets } from '@/lib/mockData';

const WORLD_MAP_URL = 'https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg';

const LOCATIONS = [
  { name: 'Accra', flag: '🇬🇭', lat: 5.6, lng: -0.2 },
  { name: 'Lagos', flag: '🇳🇬', lat: 6.5, lng: 3.4 },
  { name: 'Nairobi', flag: '🇰🇪', lat: -1.3, lng: 36.8 },
  { name: 'Johannesburg', flag: '🇿🇦', lat: -26.2, lng: 28.0 },
  { name: 'New York', flag: '🇺🇸', lat: 40.7, lng: -74.0 },
  { name: 'Toronto', flag: '🇨🇦', lat: 43.7, lng: -79.4 },
  { name: 'São Paulo', flag: '🇧🇷', lat: -23.5, lng: -46.6 },
  { name: 'London', flag: '🇬🇧', lat: 51.5, lng: -0.1 },
  { name: 'Dubai', flag: '🇦🇪', lat: 25.2, lng: 55.3 },
  { name: 'Mumbai', flag: '🇮🇳', lat: 19.1, lng: 72.9 },
  { name: 'Singapore', flag: '🇸🇬', lat: 1.35, lng: 103.8 },
  { name: 'Tokyo', flag: '🇯🇵', lat: 35.7, lng: 139.7 },
  { name: 'Sydney', flag: '🇦🇺', lat: -33.9, lng: 151.2 },
] as const;

const LOCATION_FLAGS: Record<string, string> = Object.fromEntries(LOCATIONS.map((l) => [l.name, l.flag]));

const GOLD_LOGO = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/gold.svg';

const ASSET_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'GOLD'];

const ASSET_LOGOS: Record<string, string> = (() => {
  const map: Record<string, string> = { GOLD: GOLD_LOGO };
  for (const a of [...cryptoAssets, ...stockAssets]) {
    if (a.image?.startsWith('http')) map[a.symbol] = a.image;
  }
  return map;
})();

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  location: string;
  lat: number;
  lng: number;
  timestamp: number;
}

function timeAgo(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function LiveTransactionMap() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const place = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      // Small jitter so repeat visits to the same city don't stack on the exact same pixel
      const jitter = () => (Math.random() - 0.5) * 6;
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        asset: ASSET_SYMBOLS[Math.floor(Math.random() * ASSET_SYMBOLS.length)],
        amount: Math.random() * 10000,
        location: place.name,
        lat: place.lat + jitter(),
        lng: place.lng + jitter(),
        timestamp: Date.now(),
      };
      setTransactions(prev => [newTx, ...prev].slice(0, 20));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const lastMinute = transactions.filter((t) => Date.now() - t.timestamp < 60000);
  const volume = lastMinute.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="relative bg-card border border-border rounded-lg p-6 overflow-hidden group/live">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-green-500/5 blur-3xl pointer-events-none transition-transform duration-700 group-hover/live:scale-125" />

      <div className="relative flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          Live Transactions
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-primary" />
            <span className="font-semibold text-foreground tabular-nums">{lastMinute.length}</span> /min
          </span>
          <span className="flex items-center gap-1">
            <span className="font-semibold text-foreground tabular-nums">${volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : volume.toFixed(0)}</span> vol
          </span>
        </div>
      </div>

      <div className="relative aspect-[2/1] bg-black rounded-lg overflow-hidden mb-4">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.35] mix-blend-luminosity"
          style={{ backgroundImage: `url('${WORLD_MAP_URL}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-crimson-500/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Radar sweep */}
        <div
          className="absolute inset-0 origin-center animate-spin opacity-40 pointer-events-none [animation-duration:6s]"
          style={{
            background: 'conic-gradient(from 0deg, rgba(34,197,94,0.35), transparent 35%)',
          }}
        />
        {/* Concentric radar rings from center hub */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-green-400/30 animate-ping"
              style={{ width: `${(i + 1) * 64}px`, height: `${(i + 1) * 64}px`, animationDuration: '3.5s', animationDelay: `${i * 0.6}s` }}
            />
          ))}
          <span className="relative block w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
        </div>

        {transactions.slice(0, 8).map((tx, idx) => {
          const left = ((tx.lng + 180) / 360) * 100;
          const top = ((90 - tx.lat) / 180) * 100;
          const isBuy = tx.type === 'buy';
          return (
            <button
              key={tx.id}
              type="button"
              onClick={() => setSelectedTx(tx)}
              className="absolute animate-fadeIn -translate-x-1/2 -translate-y-1/2 cursor-pointer group/dot"
              style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${idx * 0.1}s` }}
              aria-label={`View ${tx.type} transaction in ${tx.location}`}
            >
              {/* Connecting line to hub */}
              <svg className="absolute pointer-events-none overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1 }}>
                <line
                  x1={0} y1={0}
                  x2={`${(50 - left) * 2.56}`} y2={`${(50 - top) * 2.56}`}
                  className={isBuy ? 'stroke-green-400/25' : 'stroke-red-400/25'}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              </svg>
              <div className={`absolute inset-0 w-3 h-3 rounded-full blur-[3px] ${isBuy ? 'bg-green-400' : 'bg-red-400'} animate-ping`} style={{ animationDuration: '1.8s' }} />
              <div className={`relative w-3 h-3 rounded-full ring-2 ring-white/30 transition-transform duration-200 group-hover/dot:scale-150 ${isBuy ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} />
            </button>
          );
        })}

        {/* Latest transaction callout */}
        {transactions[0] && (
          <button
            type="button"
            onClick={() => setSelectedTx(transactions[0])}
            className="absolute bottom-2 left-2 right-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-[11px] text-white/90 animate-in fade-in slide-in-from-bottom-1 duration-300 hover:bg-black/60 transition-colors cursor-pointer text-left" key={transactions[0].id}>
            <span>{LOCATION_FLAGS[transactions[0].location] ?? '🌍'}</span>
            <span className="font-medium">{transactions[0].location}</span>
            <span className="text-white/50">•</span>
            <span className={transactions[0].type === 'buy' ? 'text-green-400' : 'text-red-400'}>
              {transactions[0].type === 'buy' ? 'Bought' : 'Sold'} {transactions[0].asset}
            </span>
            <span className="ml-auto font-semibold tabular-nums">${transactions[0].amount.toFixed(0)}</span>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {transactions.slice(0, 6).map((tx, idx) => (
          <button
            key={tx.id}
            type="button"
            onClick={() => setSelectedTx(tx)}
            className={`group w-full flex items-center justify-between p-2 rounded-lg border-l-2 bg-muted/40 hover:bg-muted/70 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-left-2 fill-mode-both text-left cursor-pointer ${tx.type === 'buy' ? 'border-l-green-500' : 'border-l-red-500'}`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`relative w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 transition-transform duration-300 group-hover:scale-110 ${tx.type === 'buy' ? 'ring-green-500/30 bg-green-500/10' : 'ring-red-500/30 bg-red-500/10'}`}>
                {ASSET_LOGOS[tx.asset] ? (
                  <img
                    src={ASSET_LOGOS[tx.asset]}
                    alt={tx.asset}
                    className="w-full h-full object-cover p-0.5"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const fallback = img.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span
                  className="text-[9px] font-bold text-foreground"
                  style={{ display: ASSET_LOGOS[tx.asset] ? 'none' : 'flex' }}
                >
                  {tx.asset.slice(0, 3)}
                </span>
              </div>
              <div className="text-xs min-w-0">
                <p className="font-medium">{tx.asset}</p>
                <p className="text-muted-foreground flex items-center gap-1 truncate">
                  <span>{LOCATION_FLAGS[tx.location] ?? '🌍'}</span>
                  {tx.location}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <p className={`text-xs font-semibold tabular-nums ${tx.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                {tx.type === 'buy' ? '+' : '−'}${tx.amount.toFixed(0)}
              </p>
              <div className={`p-1 rounded transition-transform duration-300 group-hover:scale-110 ${tx.type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {tx.type === 'buy' ? (
                  <ArrowDownRight className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowUpRight className="w-3 h-3 text-red-500" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Transaction detail modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`relative px-5 pt-5 pb-4 border-b border-border ${selectedTx.type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ring-2 ${selectedTx.type === 'buy' ? 'ring-green-500/40 bg-green-500/10' : 'ring-red-500/40 bg-red-500/10'}`}>
                  {ASSET_LOGOS[selectedTx.asset] ? (
                    <img
                      src={ASSET_LOGOS[selectedTx.asset]}
                      alt={selectedTx.asset}
                      className="w-full h-full object-cover p-1"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const fallback = img.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    className="text-xs font-bold text-foreground"
                    style={{ display: ASSET_LOGOS[selectedTx.asset] ? 'none' : 'flex' }}
                  >
                    {selectedTx.asset.slice(0, 3)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-base">{selectedTx.asset}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${selectedTx.type === 'buy' ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>
                    {selectedTx.type === 'buy' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {selectedTx.type === 'buy' ? 'Buy order' : 'Sell order'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className={`text-lg font-bold tabular-nums ${selectedTx.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedTx.type === 'buy' ? '+' : '−'}${selectedTx.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Location
                </span>
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <span>{LOCATION_FLAGS[selectedTx.location] ?? '🌍'}</span>
                  {selectedTx.location}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Time
                </span>
                <span className="text-sm font-medium tabular-nums">{timeAgo(selectedTx.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Coordinates</span>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {selectedTx.lat.toFixed(2)}°, {selectedTx.lng.toFixed(2)}°
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Reference</span>
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">{selectedTx.id}</span>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
