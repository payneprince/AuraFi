'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { STOCK_LOGO_FILES } from '@/lib/marketData';

interface Asset {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  image?: string;
}

const CRYPTO_ICONS = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color';

function getLogoUrl(symbol: string, image?: string): string {
  if (image?.startsWith('http') || image?.startsWith('/')) return image;
  if (STOCK_LOGO_FILES[symbol]) return `/logos/stocks/${STOCK_LOGO_FILES[symbol]}`;
  return `${CRYPTO_ICONS}/${symbol.toLowerCase()}.svg`;
}

const SYMBOL_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', BNB: '#F3BA2F', SOL: '#9945FF', ADA: '#0033AD',
  DOT: '#E6007A', LINK: '#2A5ADA', AVAX: '#E84142', MATIC: '#8247E5', UNI: '#FF007A',
};
function getSymbolColor(symbol: string) {
  return SYMBOL_COLORS[symbol] ?? '#7C3AED';
}

function AssetLogo({ symbol, image, size = 'lg' }: { symbol: string; image?: string; size?: 'lg' | 'sm' }) {
  const [failed, setFailed] = useState(false);
  const url = getLogoUrl(symbol, image);
  const isStock = !!STOCK_LOGO_FILES[symbol];
  const dims = size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';

  if (!failed) {
    return (
      <div className={`${dims} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${isStock ? 'bg-white p-1.5' : 'bg-transparent'}`}>
        <img src={url} alt={symbol} className="w-full h-full object-contain" onError={() => setFailed(true)} />
      </div>
    );
  }

  return (
    <div
      className={`${dims} rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold`}
      style={{ background: `linear-gradient(135deg, ${getSymbolColor(symbol)}, ${getSymbolColor(symbol)}99)` }}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}

function AnimatedPrice({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (value !== displayed) {
      setFlash(true);
      const t = setTimeout(() => { setDisplayed(value); setFlash(false); }, 150);
      return () => clearTimeout(t);
    }
  }, [value, displayed]);

  return (
    <p className={`text-2xl font-bold transition-all duration-150 ${flash ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      ${displayed.toLocaleString('en-US', { minimumFractionDigits: displayed < 10 ? 4 : 2, maximumFractionDigits: displayed < 10 ? 4 : 2 })}
    </p>
  );
}

interface PriceComparisonProps { assets: Asset[]; }

export default function PriceComparison({ assets }: PriceComparisonProps) {
  const [asset1, setAsset1] = useState(assets[0]);
  const [asset2, setAsset2] = useState(assets[1]);
  const [swapPhase, setSwapPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [sparkVisible, setSparkVisible] = useState(false);
  const nextA1 = useRef(assets[0]);
  const nextA2 = useRef(assets[1]);

  const handleSwap = () => {
    if (swapPhase !== 'idle') return;
    // Capture the swapped values before any state updates
    nextA1.current = asset2;
    nextA2.current = asset1;
    setSwapPhase('exit');
    setSparkVisible(true);
    setTimeout(() => {
      setAsset1(nextA1.current);
      setAsset2(nextA2.current);
      setSparkVisible(false);
      setSwapPhase('enter');
      // Double rAF: let React paint the `enter` position (off-screen snap),
      // then release to `idle` so the CSS transition animates back in.
      requestAnimationFrame(() => requestAnimationFrame(() => setSwapPhase('idle')));
    }, 320);
  };

  const cardTransform = (idx: number) => {
    const left = idx === 0;
    if (swapPhase === 'exit') return left
      ? 'translate-x-10 -translate-y-2 opacity-0 scale-90 rotate-6'
      : '-translate-x-10 -translate-y-2 opacity-0 scale-90 -rotate-6';
    if (swapPhase === 'enter') return left
      ? '-translate-x-10 translate-y-2 opacity-0 scale-90 -rotate-6'
      : 'translate-x-10 translate-y-2 opacity-0 scale-90 rotate-6';
    return 'translate-x-0 translate-y-0 opacity-100 scale-100 rotate-0';
  };
  // Disable transition during enter snap so cards teleport, not slide
  const cardTransition = (idx: number) =>
    swapPhase === 'enter' ? 'transition-none' : `transition-all duration-300 ease-out ${idx === 1 ? 'delay-[30ms]' : ''}`;

  const priceDiff = ((asset2.price / asset1.price - 1) * 100).toFixed(2);
  const isDiffPositive = Number(priceDiff) >= 0;
  const ratio = asset1.price / asset2.price;
  const a1WinsChange = asset1.change24h >= asset2.change24h;

  const logA1 = Math.log10(Math.max(asset1.price, 0.0001));
  const logA2 = Math.log10(Math.max(asset2.price, 0.0001));
  const logMax = Math.max(logA1, logA2);
  const bar1 = Math.round((logA1 / logMax) * 100);
  const bar2 = Math.round((logA2 / logMax) * 100);

  const cards = [
    { asset: asset1, setAsset: setAsset1, accent: 'from-violet-500/10 to-blue-500/10', border: 'border-violet-500/20', ring: 'border-t-violet-400/80 border-r-blue-400/40', glow: 'from-violet-500/20 to-blue-500/20', idx: 0 },
    { asset: asset2, setAsset: setAsset2, accent: 'from-cyan-500/10 to-emerald-500/10', border: 'border-cyan-500/20', ring: 'border-t-cyan-400/80 border-r-emerald-400/40', glow: 'from-cyan-500/20 to-emerald-500/20', idx: 1 },
  ];

  return (
    <div className="group/pc relative bg-card border border-border rounded-2xl p-6 overflow-hidden space-y-5">
      {/* Corner glow blobs */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center gap-3">
        <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-400/80 border-r-blue-400/40 group-hover/pc:animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-[3px] rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="font-bold text-lg">Price Comparison</h3>
          <p className="text-xs text-muted-foreground">Compare any two assets side by side</p>
        </div>
      </div>

      {/* Two asset cards */}
      <div className="relative grid grid-cols-2 gap-3" style={{ perspective: '900px' }}>
        {/* Spark burst between cards during swap */}
        {sparkVisible && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative w-10 h-10">
              <span className="absolute inset-0 rounded-full bg-violet-400/60 animate-ping [animation-duration:0.4s]" />
              <span className="absolute inset-2 rounded-full bg-white/80 blur-sm animate-pulse [animation-duration:0.3s]" />
              <ArrowLeftRight className="absolute inset-0 m-auto w-4 h-4 text-violet-300 animate-spin [animation-duration:0.4s]" />
            </div>
          </div>
        )}
        {cards.map(({ asset, setAsset, accent, border, ring, glow, idx }) => (
          <div
            key={idx}
            className={`group/card relative overflow-hidden bg-gradient-to-br ${accent} border ${border} rounded-2xl p-4 ${cardTransition(idx)} ${cardTransform(idx)} hover:-translate-y-0.5 hover:shadow-lg`}
          >
            {/* shimmer sweep */}
            <span className="absolute inset-0 -translate-x-full group-hover/card:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            {/* Dropdown */}
            <select
              value={asset.symbol}
              onChange={(e) => { const found = assets.find((a) => a.symbol === e.target.value); if (found) setAsset(found); }}
              className="w-full bg-background/60 border border-border rounded-lg px-2.5 py-1.5 mb-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary backdrop-blur-sm"
            >
              {assets.map((a) => (
                <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>
              ))}
            </select>

            {/* Spinning-ring logo badge */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="relative" style={{ width: 52, height: 52 }}>
                <div className={`absolute inset-0 rounded-full border-2 border-transparent ${ring} group-hover/card:animate-spin`} style={{ animationDuration: '2.5s' }} />
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${glow} blur-xl opacity-0 group-hover/card:opacity-70 transition-opacity duration-300`} />
                <div className="absolute inset-[3px] rounded-full bg-white overflow-hidden flex items-center justify-center">
                  <AssetLogo symbol={asset.symbol} image={asset.image} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">{asset.symbol}</p>
                <AnimatedPrice value={asset.price} />
                <div className={`flex items-center justify-center gap-1 text-xs font-semibold mt-1 ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison stats */}
      <div className="relative bg-muted/40 border border-border/50 rounded-2xl p-4 space-y-3 overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-violet-500/5 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price Ratio</span>
          <span className="font-mono font-semibold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            1 {asset1.symbol} = {ratio >= 1
              ? ratio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : (1 / ratio).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
            } {ratio >= 1 ? asset2.symbol : asset1.symbol}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price Difference</span>
          <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${isDiffPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {isDiffPositive ? '+' : ''}{priceDiff}%
          </span>
        </div>

        {/* Relative price bars */}
        <div className="pt-1 space-y-2.5">
          {[{ asset: asset1, bar: bar1 }, { asset: asset2, bar: bar2 }].map(({ asset, bar }) => (
            <div key={asset.symbol} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-medium">{asset.symbol}</span>
                <span>${asset.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="group/bar relative h-full rounded-full transition-all duration-700 overflow-hidden"
                  style={{ width: `${bar}%`, background: `linear-gradient(90deg, ${getSymbolColor(asset.symbol)}, ${getSymbolColor(asset.symbol)}88)`, boxShadow: `0 0 8px ${getSymbolColor(asset.symbol)}55` }}
                >
                  <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 24h winner */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
          <span className="text-muted-foreground">24h leader:</span>
          <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] shadow-sm ${a1WinsChange ? 'bg-green-500/15 text-green-500 shadow-green-500/10' : 'bg-cyan-500/15 text-cyan-500 shadow-cyan-500/10'}`}>
            {a1WinsChange ? asset1.symbol : asset2.symbol}
            {' '}
            {(a1WinsChange ? asset1.change24h : asset2.change24h) >= 0 ? '+' : ''}
            {(a1WinsChange ? asset1.change24h : asset2.change24h).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Swap button */}
      <button
        onClick={handleSwap}
        disabled={swapPhase !== 'idle'}
        className="group/sw relative w-full flex items-center justify-center gap-2 py-2.5 overflow-hidden rounded-xl font-medium text-sm bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="absolute inset-0 -translate-x-full group-hover/sw:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <ArrowLeftRight className={`relative w-4 h-4 transition-transform duration-500 ${swapPhase === 'exit' ? 'rotate-180 scale-125' : swapPhase === 'enter' ? '-rotate-180' : ''}`} />
        <span className="relative">{swapPhase !== 'idle' ? 'Swapping…' : 'Swap Assets'}</span>
      </button>
    </div>
  );
}
