'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react';
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

function AssetLogo({ symbol, image }: { symbol: string; image?: string }) {
  const [failed, setFailed] = useState(false);
  const url = getLogoUrl(symbol, image);
  const isStock = !!STOCK_LOGO_FILES[symbol];

  if (!failed) {
    return (
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${
          isStock ? 'bg-white p-2 border border-slate-200/20' : 'bg-transparent'
        }`}
      >
        <img
          src={url}
          alt={symbol}
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
      style={{ background: `linear-gradient(135deg, ${getSymbolColor(symbol)}, ${getSymbolColor(symbol)}99)` }}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}

function AnimatedPrice({ value, symbol }: { value: number; symbol: string }) {
  const [displayed, setDisplayed] = useState(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (value !== displayed) {
      setFlash(true);
      const t = setTimeout(() => {
        setDisplayed(value);
        setFlash(false);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [value, displayed]);

  return (
    <p
      className={`text-2xl font-bold transition-all duration-150 ${flash ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
    >
      ${displayed.toLocaleString('en-US', { minimumFractionDigits: displayed < 10 ? 4 : 2, maximumFractionDigits: displayed < 10 ? 4 : 2 })}
    </p>
  );
}

interface PriceComparisonProps { assets: Asset[]; }

export default function PriceComparison({ assets }: PriceComparisonProps) {
  const [asset1, setAsset1] = useState(assets[0]);
  const [asset2, setAsset2] = useState(assets[1]);
  const [swapping, setSwapping] = useState(false);

  const handleSwap = () => {
    if (swapping) return;
    setSwapping(true);
    setTimeout(() => {
      setAsset1(asset2);
      setAsset2(asset1);
      setSwapping(false);
    }, 280);
  };

  const priceDiff = ((asset2.price / asset1.price - 1) * 100).toFixed(2);
  const isDiffPositive = Number(priceDiff) >= 0;
  const ratio = asset1.price / asset2.price;
  const a1WinsChange = asset1.change24h >= asset2.change24h;

  // Log-normalised bar widths (handles BTC $43K vs AAPL $178 gracefully)
  const logA1 = Math.log10(Math.max(asset1.price, 0.0001));
  const logA2 = Math.log10(Math.max(asset2.price, 0.0001));
  const logMax = Math.max(logA1, logA2);
  const bar1 = Math.round((logA1 / logMax) * 100);
  const bar2 = Math.round((logA2 / logMax) * 100);

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <h3 className="font-semibold text-lg">Price Comparison</h3>

      {/* Two asset cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { asset: asset1, setAsset: setAsset1, accent: 'from-violet-500/10 to-blue-500/10', border: 'border-violet-500/20', idx: 0 },
          { asset: asset2, setAsset: setAsset2, accent: 'from-cyan-500/10 to-emerald-500/10', border: 'border-cyan-500/20', idx: 1 },
        ].map(({ asset, setAsset, accent, border, idx }) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${accent} border ${border} rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
              swapping ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
            }`}
            style={{ transitionDelay: swapping ? `${idx * 60}ms` : '0ms' }}
          >
            {/* Dropdown */}
            <select
              value={asset.symbol}
              onChange={(e) => {
                const found = assets.find((a) => a.symbol === e.target.value);
                if (found) setAsset(found);
              }}
              className="w-full bg-background/60 border border-border rounded-lg px-2.5 py-1.5 mb-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary backdrop-blur-sm"
            >
              {assets.map((a) => (
                <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>
              ))}
            </select>

            {/* Logo + prices */}
            <div className="flex flex-col items-center text-center gap-2">
              <AssetLogo symbol={asset.symbol} image={asset.image} />
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">{asset.symbol}</p>
                <AnimatedPrice value={asset.price} symbol={asset.symbol} />
                <div className={`flex items-center justify-center gap-1 text-xs font-semibold mt-1 ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {asset.change24h >= 0
                    ? <TrendingUp className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />
                  }
                  {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison stats */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
        {/* Price ratio row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price Ratio</span>
          <span className="font-mono font-semibold text-xs">
            1 {asset1.symbol} = {ratio >= 1
              ? ratio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : (1 / ratio).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {ratio >= 1 ? asset2.symbol : asset1.symbol}
          </span>
        </div>

        {/* Price diff row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price Difference</span>
          <span className={`font-semibold text-xs ${isDiffPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isDiffPositive ? '+' : ''}{priceDiff}%
          </span>
        </div>

        {/* Relative price bars */}
        <div className="pt-1 space-y-2">
          {[
            { asset: asset1, bar: bar1 },
            { asset: asset2, bar: bar2 },
          ].map(({ asset, bar }) => (
            <div key={asset.symbol} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{asset.symbol}</span>
                <span>${asset.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${bar}%`,
                    background: `linear-gradient(90deg, ${getSymbolColor(asset.symbol)}, ${getSymbolColor(asset.symbol)}88)`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 24h winner */}
        <div className="flex items-center gap-1.5 pt-1 text-xs">
          <span className="text-muted-foreground">24h leader:</span>
          <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${a1WinsChange ? 'bg-green-500/15 text-green-500' : 'bg-cyan-500/15 text-cyan-500'}`}>
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
        disabled={swapping}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60"
      >
        <ArrowLeftRight className={`w-4 h-4 transition-transform duration-300 ${swapping ? 'rotate-180' : ''}`} />
        Swap Assets
      </button>
    </div>
  );
}
