'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown, Zap, Star, Bell } from 'lucide-react';
import TransactionSuccessModal from '@/components/TransactionSuccessModal';

function DetailSparkline({ price, change24h, symbol, isPositive }: { price: number; change24h: number; symbol: string; isPositive: boolean }) {
  const N = 40;
  const seed = useMemo(() => symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0), [symbol]);

  const initialPrices = useMemo(() => {
    const yesterday = price / (1 + change24h / 100);
    return Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const base = yesterday + (price - yesterday) * t;
      const noise =
        Math.sin(i * 1.31 + seed * 0.017) * (price * 0.012) +
        Math.sin(i * 2.83 + seed * 0.031) * (price * 0.006) +
        Math.sin(i * 0.57 + seed * 0.009) * (price * 0.018);
      return Math.max(base + noise, price * 0.001);
    });
  }, [price, change24h, seed]);

  const [prices, setPrices] = useState<number[]>(initialPrices);

  // Re-seed when a different asset is opened
  useEffect(() => { setPrices(initialPrices); }, [symbol]);

  // Live tick — slide window forward every 1.5s like a real trading chart
  useEffect(() => {
    const id = setInterval(() => {
      setPrices(prev => {
        const last = prev[prev.length - 1];
        const delta = (Math.random() - 0.48) * last * 0.009;
        return [...prev.slice(1), Math.max(last + delta, last * 0.5)];
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const points = useMemo(() => {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    return prices.map((v, i) => ({ x: (i / (N - 1)) * 360, y: 72 - ((v - min) / range) * 64 }));
  }, [prices]);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L360,80 L0,80 Z`;
  const color = isPositive ? '#22c55e' : '#ef4444';
  const fillId = `detail-fill-${symbol}`;

  const allY = points.map((p) => p.y);
  const minIdx = allY.indexOf(Math.max(...allY));
  const maxIdx = allY.indexOf(Math.min(...allY));

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const fmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`;

  return (
    <div className="relative">
      <svg viewBox="0 0 360 80" className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="75%" stopColor={color} stopOpacity="0.04" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#${fillId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ transition: 'all 0.5s ease' }} />
        <circle cx={points[maxIdx].x} cy={points[maxIdx].y} r="3.5" fill={color} opacity="0.9" style={{ transition: 'all 0.5s ease' }} />
        <circle cx={points[minIdx].x} cy={points[minIdx].y} r="3.5" fill={color} opacity="0.5" style={{ transition: 'all 0.5s ease' }} />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={color} style={{ transition: 'all 0.5s ease' }} />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="7" fill={color} opacity="0.2" style={{ transition: 'all 0.5s ease' }} />
      </svg>
      <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5 px-0.5">
        <span>30d ago</span>
        <span className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>H {fmt(maxPrice)}</span>
        <span className="text-muted-foreground">L {fmt(minPrice)}</span>
        <span>Now</span>
      </div>
    </div>
  );
}

export default function AssetDetailsModal({ asset, onClose, onTrade }: any) {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTransaction, setSuccessTransaction] = useState<any>(null);
  const [tradeHoldings, setTradeHoldings] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  const isPositive = asset.change24h >= 0;
  const isLocalGhanaStock = asset?.exchange === 'GSE' || asset?.currency === 'GHS';
  const isStockIcon = typeof asset?.image === 'string' && (asset.image.includes('simpleicons.org') || asset.image.includes('/logos/stocks/'));
  const isExternalImage = typeof asset?.image === 'string' && asset.image.startsWith('http');
  const hasImage = isExternalImage || asset.image?.startsWith('/nft/') || asset.image?.startsWith('/logos/');
  const currencyPrefix = isLocalGhanaStock ? 'GH¢ ' : '$';
  const isNft = asset.image?.startsWith('/nft/');

  // Ring color per asset type
  const resolveAssetClass = () => {
    const ex = asset?.assetClass || asset?.assetType || asset?.category;
    if (typeof ex === 'string') {
      const n = ex.toLowerCase();
      if (n === 'crypto') return 'Crypto';
      if (n === 'stocks' || n === 'stock') return 'Stocks';
      if (n === 'nfts' || n === 'nft') return 'NFT';
      if (n === 'gold') return 'Gold';
    }
    if (isLocalGhanaStock) return 'Stocks';
    if (isNft || asset?.floorPrice) return 'NFT';
    if (asset?.symbol === 'GOLD' || asset?.purity) return 'Gold';
    if (asset?.peRatio !== undefined || asset?.exchange) return 'Stocks';
    return 'Crypto';
  };
  const assetClass = resolveAssetClass();
  const ringColors: Record<string, string> = {
    Crypto: 'border-t-orange-400/80 border-r-yellow-400/30',
    Stocks: 'border-t-blue-400/80 border-r-cyan-400/30',
    NFT: 'border-t-purple-400/80 border-r-pink-400/30',
    Gold: 'border-t-amber-400/80 border-r-yellow-300/30',
  };
  const ringClass = ringColors[assetClass] ?? 'border-t-primary/80 border-r-primary/20';

  useEffect(() => {
    setTradeHoldings(JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]'));
  }, [asset?.symbol]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const currentPrice = typeof asset?.price === 'number' ? asset.price : 0;
  const absoluteChange = (currentPrice * Number(asset?.change24h || 0)) / 100;
  const dayLow = currentPrice * (isPositive ? 0.985 : 0.965);
  const dayHigh = currentPrice * (isPositive ? 1.035 : 1.015);

  const currentPosition = useMemo(() => {
    if (!asset?.symbol) return null;
    return tradeHoldings.find((h: any) => h.symbol === asset.symbol && Number(h.amount || 0) > 0) || null;
  }, [tradeHoldings, asset?.symbol]);

  const positionValue = currentPosition ? Number(currentPosition.amount || 0) * currentPrice : 0;
  const costBasis = currentPosition ? Number(currentPosition.costBasis || 0) : 0;
  const pnl = positionValue - costBasis;
  const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  const gseOpen = (() => {
    const day = now.getUTCDay();
    const min = now.getUTCHours() * 60 + now.getUTCMinutes();
    return day >= 1 && day <= 5 && min >= 600 && min < 900;
  })();
  const ghanaTime = now.toLocaleString('en-GB', { timeZone: 'Africa/Accra', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

  const fmtLarge = (n: number) => n >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl shadow-black/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>

        {/* Top accent */}
        <div className={`h-1 w-full ${isPositive ? 'bg-gradient-to-r from-green-600 via-green-400 to-emerald-400' : 'bg-gradient-to-r from-red-600 via-red-400 to-rose-400'}`} />

        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/60 px-5 py-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {/* Spinning ring logo */}
            <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
              <div className={`absolute inset-0 rounded-full border-2 border-transparent ${ringClass} animate-spin`} style={{ animationDuration: '2.5s' }} />
              <div className="absolute inset-[3px] rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {hasImage ? (
                  <img src={asset.image} alt={asset.symbol}
                    className={isStockIcon ? 'w-6 h-6 object-contain' : 'w-full h-full object-cover'}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <span className="text-sm font-black text-foreground">{asset.symbol?.slice(0, 2) || '??'}</span>
                )}
              </div>
            </div>
            <div>
              <h2 className="font-black text-base leading-tight">{asset.name || asset.symbol}</h2>
              <p className="text-[11px] text-muted-foreground">{asset.symbol} · {assetClass}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4 pt-4">

          {/* Price hero */}
          <div className={`rounded-xl p-4 border ${isPositive ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
            <div className="flex items-end justify-between mb-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-black tracking-tight">
                  {currencyPrefix}{currentPrice.toLocaleString('en-US', { minimumFractionDigits: currentPrice < 1 ? 4 : 2, maximumFractionDigits: currentPrice < 1 ? 6 : 2 })}
                </span>
                <span className="relative flex h-2 w-2 mb-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              </div>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${isPositive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isPositive ? '+' : ''}{asset.change24h?.toFixed(2)}%
              </div>
            </div>
            <p className={`text-xs font-medium mb-3 ${absoluteChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {absoluteChange >= 0 ? '+' : ''}{currencyPrefix}{Math.abs(absoluteChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} today
            </p>

            {/* GSE market status */}
            {isLocalGhanaStock && (
              <div className={`flex items-center gap-2 text-xs mb-3 ${gseOpen ? 'text-green-500' : 'text-muted-foreground'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${gseOpen ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                <span className="font-semibold">{gseOpen ? 'GSE OPEN' : 'GSE CLOSED'}</span>
                <span className="text-muted-foreground">· {ghanaTime} GMT</span>
              </div>
            )}

            {/* Stats grid */}
            {(() => {
              const stats: { label: string; value: string; color: string }[] = isLocalGhanaStock ? [
                { label: '24h Change', value: `${isPositive ? '+' : ''}${asset.change24h?.toFixed(2)}%`, color: isPositive ? 'text-green-400' : 'text-red-400' },
                { label: 'Day High', value: `${currencyPrefix}${dayHigh.toFixed(2)}`, color: 'text-foreground' },
                { label: 'Day Low', value: `${currencyPrefix}${dayLow.toFixed(2)}`, color: 'text-foreground' },
              ] : [
                asset.marketCap ? { label: 'Market Cap', value: fmtLarge(asset.marketCap), color: 'text-foreground' } : { label: '24h Change', value: `${isPositive ? '+' : ''}${asset.change24h?.toFixed(2)}%`, color: isPositive ? 'text-green-400' : 'text-red-400' },
                asset.volume24h ? { label: '24h Volume', value: fmtLarge(asset.volume24h), color: 'text-foreground' } : { label: 'Day High', value: `${currencyPrefix}${dayHigh.toFixed(2)}`, color: 'text-foreground' },
                asset.peRatio ? { label: 'P/E Ratio', value: asset.peRatio.toFixed(1), color: 'text-blue-400' } : asset.dividend ? { label: 'Div Yield', value: `${asset.dividend}%`, color: 'text-blue-400' } : { label: 'Day Low', value: `${currencyPrefix}${dayLow.toFixed(2)}`, color: 'text-foreground' },
              ];
              return (
                <div className="grid grid-cols-3 gap-2">
                  {stats.map((s) => (
                    <div key={s.label} className="bg-background/60 rounded-lg px-2.5 py-2 text-center">
                      <p className="text-[9px] text-muted-foreground mb-0.5">{s.label}</p>
                      <p className={`text-xs font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Chart or NFT samples */}
          {isNft ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sample Collection</p>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((v) => (
                  <div key={v} className="bg-muted rounded-xl overflow-hidden border border-border">
                    <div className="aspect-square overflow-hidden">
                      <img src={`/nft/${asset.id === '1' ? 'bayc' : `nft-${asset.id}`}-variant${v}.jpg`} alt="" className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden'); }} />
                      <div className="hidden w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 items-center justify-center text-white font-bold text-2xl aspect-square">
                        {asset.symbol?.slice(0, 2)}
                      </div>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="text-xs font-semibold">#{Math.floor(asset.symbol.charCodeAt(0) * 137 + v * 3791) % 9999 + 1}</p>
                      <p className="text-[10px] text-muted-foreground">Floor: {asset.price} ETH</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> 30-Day Price
                </p>
                <span className={`text-[10px] font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '▲' : '▼'} {Math.abs(asset.change24h || 0).toFixed(2)}%
                </span>
              </div>
              <DetailSparkline price={currentPrice} change24h={asset.change24h || 0} symbol={asset.symbol || 'X'} isPositive={isPositive} />
            </div>
          )}

          {/* Your position (if any) */}
          {currentPosition && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-3">Your Position</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: isLocalGhanaStock ? 'Shares' : 'Amount', value: isLocalGhanaStock ? Math.floor(Number(currentPosition.amount || 0)).toString() : Number(currentPosition.amount || 0).toFixed(4) },
                  { label: 'Avg Price', value: `${currencyPrefix}${(costBasis / Math.max(Number(currentPosition.amount || 1), 1)).toFixed(2)}` },
                  { label: 'Value', value: `${currencyPrefix}${positionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                ].map((s) => (
                  <div key={s.label} className="text-center bg-background/60 rounded-lg py-2">
                    <p className="text-[9px] text-muted-foreground mb-0.5">{s.label}</p>
                    <p className="text-xs font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className={`flex items-center justify-between p-2.5 rounded-lg ${pnl >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <span className="text-xs text-muted-foreground">Unrealised P&L</span>
                <span className={`text-sm font-black ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}{currencyPrefix}{Math.abs(pnl).toFixed(2)} ({pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => onTrade(asset, 'buy')} disabled={!currentPrice}
              className="py-3 rounded-xl bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-green-500/20 transition-all disabled:opacity-50">
              ▲ Quick Buy
            </button>
            <button onClick={() => onTrade(asset, 'sell')} disabled={!currentPrice}
              className="py-3 rounded-xl bg-red-500 hover:bg-red-400 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all disabled:opacity-50">
              ▼ Quick Sell
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
              <Bell className="w-3 h-3" /> Set Alert
            </button>
            <button className="py-2 rounded-xl border border-border bg-background hover:bg-accent text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
              <Star className="w-3 h-3" /> Watchlist
            </button>
          </div>
        </div>
      </div>

      <TransactionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => { setShowSuccessModal(false); setSuccessTransaction(null); }}
        transaction={successTransaction}
      />
    </div>
  );
}
