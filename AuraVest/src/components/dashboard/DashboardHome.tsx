'use client';

import { useEffect, useState } from 'react';
import { cryptoAssets, stockAssets } from '@/lib/mockData';
import { loadCrypto, loadStocks, subscribeToCrypto, startCryptoWebSocket } from '@/lib/marketData';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles, Shield, AlertTriangle, Landmark, Flame, Activity, Zap, BarChart2 } from 'lucide-react';

function SparkLine({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64, h = 28;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="opacity-75 flex-shrink-0">
      <polyline points={pts} fill="none" stroke={isPositive ? '#22c55e' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
import { readUnifiedAuthSession } from '../../../../shared/unified-auth';
import LiveTransactionMap from '@/components/LiveTransactionMap';
import MobileAppShowcase from '@/components/MobileAppShowcase';
import InterAppTransfer from './InterAppTransfer';
import PriceComparison from '@/components/PriceComparison';
import TradeModal from '@/components/TradeModal';
import AssetDetailsModal from '@/components/AssetDetailsModal';
import AuraAIInsight from '@/components/AuraAIInsight';
import { getPortfolio, getWatchlist } from '@/lib/mockAPI';

export default function DashboardHome({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [portfolio, setPortfolio] = useState<any | null>(null);
  const isPortfolioReady = portfolio && typeof portfolio.totalValue === 'number';
  const { totalValue = 0, change24h = 0, changeAmount = 0 } = portfolio || {};
  const isPositive = change24h >= 0;
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [tradeModal, setTradeModal] = useState<any>(null);
  const [transactionFeed, setTransactionFeed] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [netTradeCashflow, setNetTradeCashflow] = useState(0);
  const holdingsValue = Number(Math.max(totalValue - cashBalance, 0).toFixed(2));
  const isNewUser = isPortfolioReady && totalValue === 0 && cashBalance === 0 && transactionFeed.length === 0;
  const [liveAssets, setLiveAssets] = useState<any[]>(cryptoAssets.slice(0, 8));
  const [liveStocks, setLiveStocks] = useState<any[]>(stockAssets.slice(0, 8));
  const [tickerAssets, setTickerAssets] = useState<any[]>(cryptoAssets.slice(0, 16));
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [miniCurve, setMiniCurve] = useState<number[]>([]);
  const [fearGreed, setFearGreed] = useState<{ value: number; label: string } | null>(null);
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);

  // ── Dynamic portfolio health ──────────────────────────────────
  const computePortfolioHealth = () => {
    let holdings: any[] = (() => {
      try { return JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]'); }
      catch { return []; }
    })();

    // Fallback: derive from portfolio.assets (e.g. demo user before any trades are recorded)
    if (holdings.length === 0 && Array.isArray((portfolio as any)?.assets) && (portfolio as any).assets.length > 0) {
      holdings = (portfolio as any).assets.map((a: any) => ({
        type: a.type || 'stocks',
        currentValue: Number(a.value || 0),
      }));
    }

    if (holdings.length === 0) return null;

    const riskWeights: Record<string, number> = {
      crypto: 85, nft: 90, stocks: 55, gold: 25, local: 35,
    };

    // Value by asset class
    const classTotals: Record<string, number> = {};
    let totalHoldingsValue = 0;
    for (const h of holdings) {
      const cls = ((h.type || h.assetClass || 'stocks') as string).toLowerCase().replace(' ', '_');
      const key = cls.includes('crypto') ? 'crypto'
        : cls.includes('nft') ? 'nft'
        : cls.includes('gold') ? 'gold'
        : cls.includes('local') ? 'local'
        : 'stocks';
      const val = Number(h.currentValue || h.value || 0);
      classTotals[key] = (classTotals[key] || 0) + val;
      totalHoldingsValue += val;
    }

    if (totalHoldingsValue === 0) return null;

    // Risk score: weighted average
    let weightedRisk = 0;
    for (const [cls, val] of Object.entries(classTotals)) {
      const pct = val / totalHoldingsValue;
      weightedRisk += pct * (riskWeights[cls] ?? 55);
    }
    const riskScore = Math.round(weightedRisk);
    const riskLevel = riskScore > 70 ? 'High' : riskScore > 40 ? 'Moderate' : 'Low';

    // Diversification: classes with >5% of portfolio
    const significantClasses = Object.entries(classTotals)
      .filter(([, v]) => v / totalHoldingsValue > 0.05).length;
    const divScore = Math.min(100, [0, 20, 45, 65, 82, 100][significantClasses] ?? 100);

    // Recommendations
    const recs: string[] = [];
    const cryptoPct = ((classTotals.crypto || 0) / totalHoldingsValue) * 100;
    const goldPct = ((classTotals.gold || 0) / totalHoldingsValue) * 100;
    const stocksPct = ((classTotals.stocks || 0) / totalHoldingsValue) * 100;

    if (cryptoPct > 60) recs.push(`${cryptoPct.toFixed(0)}% in crypto — consider moving some to stable assets.`);
    if (goldPct === 0) recs.push('No gold holdings — gold hedges against inflation.');
    if (stocksPct === 0 && cryptoPct > 0) recs.push('Add stocks to balance your crypto exposure.');
    if (significantClasses < 2) recs.push('Portfolio is highly concentrated — diversify across more asset classes.');
    if (divScore >= 65 && recs.length === 0) recs.push('Well diversified — keep monitoring your allocation balance.');

    return { riskScore, riskLevel, divScore, recs, classTotals, totalHoldingsValue };
  };

  const health = computePortfolioHealth();

  const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const session = readUnifiedAuthSession();
  const firstName = (session?.name ?? '').split(' ')[0] || 'there';

  const openAuraBank = () => {
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const uid = session?.userId || '1';
    window.open(`${protocol}//${host}:3001?userId=${uid}`, '_blank', 'noopener,noreferrer');
  };

  const refreshCapitalMetrics = () => {
    const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    const cash = Number(localStorage.getItem('auravest_cash_balance') || '0');

    const netCashflow = (transactions || []).reduce((sum: number, tx: any) => {
      const status = String(tx?.status || '').toLowerCase();
      if (status && status !== 'filled' && status !== 'completed') return sum;

      const type = String(tx?.type || '').toLowerCase();
      const amount = Number(tx?.amount || 0);
      const price = Number(tx?.price || 0);
      const gross = Number.isFinite(Number(tx?.gross)) ? Number(tx.gross) : amount * price;
      const fee = Number.isFinite(Number(tx?.fee)) ? Number(tx.fee) : gross * 0.001;
      const buyCost = gross + fee;
      const sellProceeds = Math.max(gross - fee, 0);

      if (type === 'deposit') return sum + amount;
      if (type === 'withdrawal') return sum - amount;
      if (type === 'buy') return sum - buyCost;
      if (type === 'sell') return sum + sellProceeds;
      return sum;
    }, 0);

    setCashBalance(Number.isFinite(cash) ? cash : 0);
    setNetTradeCashflow(Number(netCashflow.toFixed(2)));
  };

  const loadLivePortfolio = async () => {
    try {
      const data = await getPortfolio();
      if (data && Object.keys(data).length > 0) {
        setPortfolio(data);
      }
    } catch (error) {
      console.error('Failed to load live portfolio in overview:', error);
    }
  };

  const loadRecentTransactions = () => {
    const storedTransactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    const mapped = storedTransactions.slice(0, 8).map((tx: any) => ({
      ...tx,
      date: tx.timestamp || tx.date,
      status: tx.status || 'filled',
    }));
    setTransactionFeed(mapped);
  };

  useEffect(() => {
    try {
      const storedPortfolio = JSON.parse(localStorage.getItem('auravest_portfolio') || '{}');
      if (storedPortfolio && Object.keys(storedPortfolio).length > 0) {
        setPortfolio(storedPortfolio);
      }
    } catch (error) {
      console.error('Failed to read initial portfolio from localStorage:', error);
    }

    loadLivePortfolio();
    loadRecentTransactions();
    refreshCapitalMetrics();

    // Load live asset prices
    loadCrypto().then((data) => {
      setLiveAssets(data.slice(0, 8));
      setTickerAssets(data.slice(0, 16));
      // Fetch 7-day sparklines for top 8 crypto (parallel)
      const symbols = data.slice(0, 8).map((a: any) => a.symbol);
      Promise.all(
        symbols.map((sym: string) =>
          fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=8`)
            .then((r) => r.json())
            .then((rows: any[]) => ({ sym, closes: rows.map((k) => parseFloat(k[4])) }))
            .catch(() => ({ sym, closes: [] as number[] }))
        )
      ).then((results) => {
        const map: Record<string, number[]> = {};
        for (const { sym, closes } of results) if (closes.length) map[sym] = closes;
        setSparklines(map);
      });
    }).catch(() => {});
    loadStocks().then((data) => setLiveStocks(data.slice(0, 8))).catch(() => {});

    // Fear & Greed index
    fetch('https://api.alternative.me/fng/?limit=1')
      .then((r) => r.json())
      .then((d) => {
        const v = Number(d?.data?.[0]?.value ?? 0);
        const label = d?.data?.[0]?.value_classification ?? '';
        if (v > 0) setFearGreed({ value: v, label });
      }).catch(() => {});

    // Watchlist
    setWatchlistItems(getWatchlist());

    startCryptoWebSocket();
    const unsubPrices = subscribeToCrypto((prices) => {
      setLiveAssets((prev) =>
        prev.map((a) => {
          const p = prices[a.symbol];
          return p ? { ...a, price: p.price, change24h: p.change24h } : a;
        })
      );
      setTickerAssets((prev) =>
        prev.map((a) => {
          const p = prices[a.symbol];
          return p ? { ...a, price: p.price, change24h: p.change24h } : a;
        })
      );
    });

    const capitalInterval = setInterval(() => {
      refreshCapitalMetrics();
      loadRecentTransactions();
      void loadLivePortfolio();
    }, 2000);

    return () => {
      clearInterval(capitalInterval);
      unsubPrices();
    };
  }, []);

  useEffect(() => {
    if (!isPortfolioReady || totalValue === 0) return;

    // Count-up animation (runs once)
    if (!hasAnimated) {
      setHasAnimated(true);
      const start = Date.now();
      const duration = 1400;
      const tick = () => {
        const t = Math.min((Date.now() - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        setDisplayValue(totalValue * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setDisplayValue(totalValue);
      };
      requestAnimationFrame(tick);
    } else {
      setDisplayValue(totalValue);
    }

    // Mini equity curve from buy history
    try {
      const txs: any[] = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
      const buyTxs = txs.filter((tx) => tx?.type === 'buy')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (buyTxs.length >= 2) {
        let cum = 0;
        const byMonth = new Map<string, number>();
        for (const tx of buyTxs) {
          const d = new Date(tx.timestamp);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          cum += Number(tx.gross) || (Number(tx.amount || 0) * Number(tx.price || 0));
          byMonth.set(key, cum);
        }
        const vals = Array.from(byMonth.values());
        if (vals.length > 0) vals[vals.length - 1] = totalValue;
        setMiniCurve(vals.length >= 2 ? vals : []);
      }
    } catch { /* */ }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPortfolioReady, totalValue]);

  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset);
  };

  const handleTrade = (asset: any, type: 'buy' | 'sell') => {
    setSelectedAsset(null);
    setTradeModal({ asset, type });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Live price ticker strip — pulled flush to top via negative margin ── */}
      <div className="-mt-4 md:-mt-6 -mx-4 md:-mx-6 mb-2">
      <style>{`
        @keyframes dashTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .dash-ticker-track {
          animation: dashTicker 40s linear infinite;
          display: flex;
          width: max-content;
        }
        .dash-ticker-track:hover { animation-play-state: paused; }
        @keyframes moverPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .mover-badge { animation: moverPulse 2.4s ease-in-out infinite; }
        .mover-arrow { animation: moverPulse 1.8s ease-in-out infinite; }
      `}</style>
      <div className="relative overflow-hidden rounded-xl border border-white/8 bg-card/60 backdrop-blur-sm py-2.5">
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="overflow-hidden">
          <div className="dash-ticker-track">
            {[...tickerAssets, ...tickerAssets].map((asset, i) => {
              const pos = asset.change24h >= 0;
              return (
                <div key={i} className="flex items-center gap-2 px-4 border-r border-white/5 flex-shrink-0">
                  {asset.image?.startsWith('http') && (
                    <img src={asset.image} alt={asset.symbol} className="w-4 h-4 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <span className="text-xs font-bold text-foreground whitespace-nowrap">{asset.symbol}</span>
                  <span className="text-xs font-semibold text-foreground/80 whitespace-nowrap">
                    ${(asset.price ?? 0) >= 1000
                      ? (asset.price / 1000).toFixed(2) + 'K'
                      : (asset.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[11px] font-semibold whitespace-nowrap ${pos ? 'text-green-400' : 'text-red-400'}`}>
                    {pos ? '+' : ''}{(asset.change24h ?? 0).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      {/* Personalized header */}
      {(() => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
        const hour = now.getHours();
        const minute = now.getMinutes();
        const etOffset = -5; // EST (approximate)
        const etHour = (hour + etOffset + 24) % 24;
        const etMinutes = etHour * 60 + minute;
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        const nyseOpen = isWeekday && etMinutes >= 570 && etMinutes < 960; // 9:30–16:00 ET
        // GSE: Mon–Fri 9:30–15:00 GMT (Ghana is GMT/UTC+0)
        const gmtMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        const gseOpen = isWeekday && gmtMinutes >= 570 && gmtMinutes < 900; // 9:30–15:00 GMT

        const dynamicSubtext = (() => {
          if (isPortfolioReady && totalValue > 0 && change24h !== 0) {
            return isPositive
              ? `Your portfolio is up ${change24h}% today — keep it going`
              : `Markets dipped ${Math.abs(change24h)}% today — stay the course`;
          }
          if (hour < 9) return 'Pre-market hours — crypto never sleeps';
          if (hour < 12) return 'Morning session underway — catch the moves early';
          if (hour < 14) return 'Midday check-in — see what\'s moving';
          if (hour < 17) return 'Afternoon session — markets closing soon';
          return 'After-hours — crypto trading 24/7';
        })();

        return (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black leading-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                {getTimeGreeting()}{firstName && firstName !== 'there' ? `, ${firstName}` : ''} 👋
              </h1>
              <p className="text-muted-foreground text-sm mt-1.5">{dynamicSubtext}</p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-0.5">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  nyseOpen ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted text-muted-foreground border-border'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${nyseOpen ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                  NYSE {nyseOpen ? 'Open' : 'Closed'}
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  gseOpen ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted text-muted-foreground border-border'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${gseOpen ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                  GSE {gseOpen ? 'Open' : 'Closed'}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Portfolio value card — redesigned */}
      <div className="relative rounded-2xl overflow-hidden text-white shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #080d1c 0%, #0c1428 55%, #080f20 100%)' }}>

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

        {/* Glowing orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 65%)' }} />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-64 h-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />

        {/* Mini equity curve watermark */}
        {miniCurve.length >= 2 && (() => {
          const maxV = Math.max(...miniCurve);
          const pts = miniCurve.map((v, i) =>
            `${(i / (miniCurve.length - 1)) * 100},${40 - (v / maxV) * 34}`).join(' ');
          const area = `M 0 40 ${miniCurve.map((v, i) =>
            `L ${(i / (miniCurve.length - 1)) * 100} ${40 - (v / maxV) * 34}`).join(' ')} L 100 40 Z`;
          return (
            <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#mcGrad)" />
                <polyline points={pts} fill="none" stroke={isPositive ? '#22c55e' : '#ef4444'} strokeWidth="0.8" strokeOpacity="0.4" />
              </svg>
            </div>
          );
        })()}

        {/* Card content */}
        <div className="relative z-10 p-6">

          {/* Top row: label + action buttons */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">Total Portfolio Value</p>
            <div className="flex gap-2">
              <button onClick={() => onNavigate?.('portfolio')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-white/15 bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95">
                + Deposit
              </button>
              <button onClick={() => onNavigate?.('trade')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/70 hover:bg-indigo-500 border border-indigo-400/30 transition-all duration-200 active:scale-95">
                Quick Trade
              </button>
            </div>
          </div>

          {/* Big number + 24h badge */}
          <div className="flex items-end gap-4 mb-2">
            {!isPortfolioReady
              ? <div className="h-12 w-56 rounded-xl bg-white/10 animate-pulse" />
              : <h2 className="text-5xl font-black tracking-tight tabular-nums leading-none">
                  ${displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
            }
            {isPortfolioReady && totalValue > 0 && (
              <span className={`self-end pb-1 text-xs font-bold px-2.5 py-1 rounded-full border tabular-nums mover-badge ${isPositive ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                {isPositive ? <TrendingUp className="inline w-3 h-3 mr-1" /> : <TrendingDown className="inline w-3 h-3 mr-1" />}
                {`${isPositive ? '+' : '-'}$${Math.abs(changeAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} (${isPositive ? '+' : ''}${change24h}%)`}
              </span>
            )}
          </div>

          <div className="mb-5" />

          {/* Stat pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Holdings Value', value: `$${holdingsValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: '◈', colored: false, positive: true },
              { label: 'Cash Balance',   value: `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: '◎', colored: false, positive: true },
              { label: 'Net Cashflow',   value: `${netTradeCashflow >= 0 ? '+' : '-'}$${Math.abs(netTradeCashflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: netTradeCashflow >= 0 ? '↑' : '↓', colored: true, positive: netTradeCashflow >= 0 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl px-3.5 py-3 border border-white/10 bg-white/[0.06] backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-white/35 text-xs">{stat.icon}</span>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{stat.label}</p>
                </div>
                {!isPortfolioReady
                  ? <div className="h-5 w-20 rounded bg-white/10 animate-pulse" />
                  : <p className={`font-bold text-sm tabular-nums ${stat.colored ? (stat.positive ? 'text-green-300' : 'text-red-300') : 'text-white'}`}>{stat.value}</p>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Global market stats bar ──────────────────────────────── */}
      {(() => {
        const btcAsset = liveAssets.find((a) => a.symbol === 'BTC');
        const totalMCap = liveAssets.reduce((s, a) => s + (a.marketCap || 0), 0);
        const btcDom = totalMCap > 0 && btcAsset?.marketCap ? (btcAsset.marketCap / totalMCap) * 100 : null;
        const totalVol = liveAssets.reduce((s, a) => s + (a.volume24h || 0), 0);
        const fgColor = fearGreed
          ? fearGreed.value >= 75 ? 'text-emerald-400' : fearGreed.value >= 55 ? 'text-green-400'
          : fearGreed.value >= 47 ? 'text-yellow-400' : fearGreed.value >= 26 ? 'text-orange-400' : 'text-red-400'
          : 'text-muted-foreground';
        const stats = [
          { label: 'BTC Dominance', value: btcDom != null ? `${btcDom.toFixed(1)}%` : '—', sub: 'of crypto market', color: 'text-orange-400', icon: '₿' },
          { label: 'Total Market Cap', value: totalMCap > 0 ? `$${(totalMCap / 1e9).toFixed(0)}B` : '—', sub: 'crypto only', color: 'text-blue-400', icon: '◈' },
          { label: '24h Volume', value: totalVol > 0 ? `$${(totalVol / 1e9).toFixed(1)}B` : '—', sub: 'top assets', color: 'text-purple-400', icon: '⬡' },
          { label: 'Fear & Greed', value: fearGreed ? `${fearGreed.value}` : '—', sub: fearGreed?.label ?? 'Loading…', color: fgColor, icon: '⚡' },
        ];
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <span className={`text-lg flex-shrink-0 ${s.color}`}>{s.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{s.label}</p>
                  <p className={`text-base font-black tabular-nums leading-tight ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Empty state — new users */}
      {isNewUser && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold mb-2">Start your investment journey</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Fund your AuraVest account from AuraBank to start trading stocks, crypto, gold and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate?.('portfolio')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-black to-red-700 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
            >
              <Landmark className="w-4 h-4" />
              Fund from AuraBank
            </button>
          </div>
        </div>
      )}

      {/* Portfolio Health Widget */}
      <div className="relative bg-card border border-border rounded-xl p-6 animate-slideIn overflow-hidden group/health">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-orange-500/5 blur-3xl pointer-events-none transition-transform duration-700 group-hover/health:scale-125" />
        <div className="relative flex items-center gap-3 mb-6">
          <div className="relative w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <span className="absolute inset-0 rounded-lg bg-orange-500/20 animate-ping [animation-duration:2.5s]" />
            <Shield className="relative w-5 h-5 text-orange-500" />
          </div>
          <h3 className="font-semibold">Portfolio Health</h3>
          {health && (
            <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-300 hover:scale-105 ${
              health.riskLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              : health.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
              : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
            }`}>
              {health.riskLevel} Risk
            </span>
          )}
        </div>

        {!health ? (
          /* Empty state */
          <div className="text-center py-6">
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-medium text-muted-foreground">No holdings to analyse</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Make your first trade to see your portfolio health score.</p>
          </div>
        ) : (
          <>
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
              {/* Risk Score — animated radial gauge */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/30 border border-border/50 transition-all duration-300 hover:bg-muted/50 hover:-translate-y-0.5">
                <div className="relative flex-shrink-0" style={{ width: 76, height: 76 }}>
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="34" strokeWidth="8" className="fill-none stroke-muted" />
                    <circle
                      cx="40" cy="40" r="34" strokeWidth="8" strokeLinecap="round"
                      className={`fill-none transition-all duration-1000 ease-out ${health.riskScore > 70 ? 'stroke-red-500' : health.riskScore > 40 ? 'stroke-yellow-500' : 'stroke-green-500'}`}
                      style={{
                        strokeDasharray: `${2 * Math.PI * 34}`,
                        strokeDashoffset: `${2 * Math.PI * 34 * (1 - health.riskScore / 100)}`,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold leading-none">{health.riskScore}</span>
                    <span className="text-[10px] text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {health.riskScore > 70 ? 'High volatility — consider balancing with stable assets'
                      : health.riskScore > 40 ? 'Moderate risk — reasonable balance for growth'
                      : 'Conservative — low volatility portfolio'}
                  </p>
                </div>
              </div>

              {/* Diversification */}
              <div className="space-y-2.5 p-4 rounded-xl bg-muted/30 border border-border/50 transition-all duration-300 hover:bg-muted/50 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Diversification</p>
                  </div>
                  <span className="text-sm font-bold">{health.divScore}% <span className="text-xs font-normal text-muted-foreground">/ target 65%</span></span>
                </div>
                <div className="relative w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`relative h-2.5 rounded-full transition-all duration-1000 ease-out overflow-hidden ${health.divScore >= 65 ? 'bg-green-500' : health.divScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${health.divScore}%` }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2.2s_ease-in-out_infinite]" />
                  </div>
                </div>
                {/* Asset class breakdown */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(health.classTotals).map(([cls, val], i) => {
                    const pct = Math.round((val / health.totalHoldingsValue) * 100);
                    return (
                      <span
                        key={cls}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium capitalize transition-all duration-300 hover:bg-primary/15 hover:text-primary hover:scale-110 animate-in fade-in zoom-in-95 fill-mode-both"
                        style={{ animationDelay: `${i * 70}ms` }}
                      >
                        {cls} {pct}%
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {health.recs.length > 0 && (
              <div className={`p-3 rounded-xl border text-sm transition-all duration-300 hover:shadow-md ${
                health.divScore >= 65 && health.riskScore <= 70
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-orange-500/5 border-orange-500/20'
              }`}>
                <div className="flex items-start gap-2">
                  {health.divScore >= 65 && health.riskScore <= 70
                    ? <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0 animate-pulse" />
                  }
                  <ul className="space-y-1">
                    {health.recs.map((rec, i) => (
                      <li key={i} className="text-xs text-muted-foreground animate-in fade-in slide-in-from-left-1 fill-mode-both" style={{ animationDelay: `${i * 90}ms` }}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Market Movers ─────────────────────────────────────────── */}
      {(() => {
        const all = [...liveAssets, ...liveStocks].filter((a) => a.change24h != null);
        const gainers = [...all].sort((a, b) => b.change24h - a.change24h).slice(0, 4);
        const losers  = [...all].sort((a, b) => a.change24h - b.change24h).slice(0, 4);
        const renderMover = (asset: any, i: number) => {
          const pos = (asset.change24h ?? 0) >= 0;
          const isCrypto = !asset.exchange && !asset.image?.startsWith('/logos/stocks/');
          return (
            <div key={asset.symbol}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/60 transition-colors duration-150 cursor-pointer"
              onClick={() => handleAssetClick(asset)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold ${isCrypto ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                  {asset.image?.startsWith('http') || asset.image?.startsWith('/logos/') ? (
                    <img src={asset.image} alt={asset.symbol} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : <span>{asset.symbol?.slice(0,2)}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate leading-tight">{asset.symbol}</p>
                  <p className="text-[10px] text-muted-foreground truncate tabular-nums">${(asset.price ?? 0) >= 1000 ? (asset.price/1000).toFixed(2)+'K' : (asset.price ?? 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                </div>
              </div>
              <span className={`mover-badge text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg ${pos ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}
                style={{ animationDelay: `${i * 300}ms` }}>
                {pos ? '+' : ''}{(asset.change24h ?? 0).toFixed(2)}%
              </span>
            </div>
          );
        };
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="mover-arrow text-green-500 text-base">▲</span>
                <h3 className="font-semibold text-sm">Top Gainers</h3>
                <span className="ml-auto text-[10px] text-muted-foreground">24h</span>
              </div>
              <div className="space-y-0.5">{gainers.map((a, i) => renderMover(a, i))}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="mover-arrow text-red-500 text-base" style={{ animationDelay: '0.9s' }}>▼</span>
                <h3 className="font-semibold text-sm">Top Losers</h3>
                <span className="ml-auto text-[10px] text-muted-foreground">24h</span>
              </div>
              <div className="space-y-0.5">{losers.map((a, i) => renderMover(a, i))}</div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PriceComparison assets={[...(cryptoAssets || []), ...(stockAssets || [])]} />
        <AuraAIInsight />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative bg-card rounded-lg border border-border p-6 overflow-hidden group/panel">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-purple-500/5 blur-3xl pointer-events-none transition-transform duration-700 group-hover/panel:scale-125" />
          <div className="relative flex items-center gap-2 mb-4">
            <div className="relative w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold">Trending Crypto</h3>
            <span className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              Live
            </span>
          </div>
          <div className="space-y-2.5">
            {liveAssets.slice(0, 4).map((crypto, i) => {
              const isPositive = (crypto.change24h ?? 0) >= 0;
              const spark = sparklines[crypto.symbol];
              return (
                <div
                  key={crypto.id ?? crypto.symbol}
                  onClick={() => handleAssetClick(crypto)}
                  className="relative flex items-center justify-between p-3 hover:bg-muted/60 rounded-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] group animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0" style={{ width: 42, height: 42 }}>
                      <div className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${isPositive ? 'bg-green-500/40' : 'bg-red-500/40'}`} />
                      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-2 ring-transparent group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-110">
                        {crypto.image?.startsWith('http') ? (
                          <img src={crypto.image} alt={crypto.symbol} className="w-full h-full object-cover"
                            onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none'; const fb = img.nextElementSibling as HTMLElement; if (fb) fb.style.display = 'flex'; }} />
                        ) : null}
                        <span className="text-xs" style={{ display: crypto.image?.startsWith('http') ? 'none' : 'flex' }}>{crypto.symbol?.slice(0, 2)}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {spark && <SparkLine data={spark} isPositive={isPositive} />}
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        ${(crypto.price ?? 0) >= 1000
                          ? (crypto.price / 1000).toFixed(2) + 'K'
                          : (crypto.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm flex items-center justify-end gap-0.5 tabular-nums ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{(crypto.change24h ?? 0).toFixed(2)}%
                      </p>
                    </div>
                    <div className="w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 overflow-hidden">
                      <button onClick={(e) => { e.stopPropagation(); handleTrade(crypto, 'buy'); }}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap">
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative bg-card rounded-lg border border-border p-6 overflow-hidden group/panel">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/5 blur-3xl pointer-events-none transition-transform duration-700 group-hover/panel:scale-125" />
          <div className="relative flex items-center gap-3 mb-4">
            <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400/80 border-r-indigo-400/40 group-hover/panel:animate-spin" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-[3px] rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-lg font-semibold">Top Stocks</h3>
            <span className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              Live
            </span>
          </div>
          <div className="space-y-2.5">
            {liveStocks.slice(0, 4).map((stock, i) => {
              const isPositive = (stock.change24h ?? 0) >= 0;
              return (
                <div
                  key={stock.id ?? stock.symbol}
                  onClick={() => handleAssetClick(stock)}
                  className="relative flex items-center justify-between p-3 hover:bg-muted/60 rounded-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] group animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0" style={{ width: 42, height: 42 }}>
                      <div className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${isPositive ? 'bg-green-500/40' : 'bg-red-500/40'}`} />
                      <div className="relative w-full h-full rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-110">
                        {stock.image?.startsWith('/logos/') || stock.image?.startsWith('http') ? (
                          <img src={stock.image} alt={stock.symbol} className="w-7 h-7 object-contain"
                            onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none'; const fb = img.nextElementSibling as HTMLElement; if (fb) fb.style.display = 'flex'; }} />
                        ) : null}
                        <span className="text-xs font-bold text-slate-700"
                          style={{ display: (stock.image?.startsWith('/logos/') || stock.image?.startsWith('http')) ? 'none' : 'flex' }}>
                          {stock.symbol?.slice(0, 2)}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{stock.name}</p>
                      <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">${(stock.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className={`text-sm flex items-center justify-end gap-0.5 tabular-nums ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{(stock.change24h ?? 0).toFixed(2)}%
                      </p>
                    </div>
                    <div className="w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 overflow-hidden">
                      <button onClick={(e) => { e.stopPropagation(); handleTrade(stock, 'buy'); }}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap">
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Watchlist ─────────────────────────────────────────────── */}
      {(() => {
        const allLive = [...liveAssets, ...liveStocks];
        const resolved = watchlistItems
          .map((w) => allLive.find((a) => a.symbol === w.id || a.id === w.id))
          .filter(Boolean);
        if (resolved.length === 0) return (
          <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm mb-0.5">Your Watchlist</p>
              <p className="text-xs text-muted-foreground">Star assets from Markets to track them here</p>
            </div>
            <span className="text-2xl">⭐</span>
          </div>
        );
        return (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-base">⭐</span>
                <h3 className="font-semibold text-sm">Watchlist</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{resolved.length}</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-2 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {resolved.map((asset: any, i: number) => {
                const pos = (asset.change24h ?? 0) >= 0;
                const isCrypto = !asset.exchange && !asset.image?.startsWith('/logos/stocks/');
                return (
                  <div key={asset.symbol}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-accent/20 hover:bg-accent/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group animate-in fade-in zoom-in-95 fill-mode-both"
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => handleAssetClick(asset)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold ${isCrypto ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                        {asset.image?.startsWith('http') || asset.image?.startsWith('/logos/') ? (
                          <img src={asset.image} alt={asset.symbol} className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : <span>{asset.symbol?.slice(0,2)}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{asset.symbol}</p>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          ${(asset.price ?? 0) >= 1000 ? (asset.price/1000).toFixed(2)+'K' : (asset.price ?? 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${pos ? 'text-green-500' : 'text-red-500'}`}>
                      {pos ? '+' : ''}{(asset.change24h ?? 0).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <LiveTransactionMap />

      {/* ── Recent Transactions (polished) ───────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Transactions</h3>
          <span className="text-xs text-muted-foreground">{transactionFeed.length} recent</span>
        </div>
        {transactionFeed.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No transactions yet</div>
        ) : (
          <div className="space-y-1">
            {transactionFeed.map((tx, i) => {
              const isBuy = tx.type === 'buy';
              const isDeposit = tx.type === 'deposit';
              const isWithdrawal = tx.type === 'withdrawal';
              const status = (tx.status || 'filled').toLowerCase();
              const safeAmount = Number(tx.amount || 0);
              const safePrice = Number(tx.price || 0);
              const safeTotal = Number(tx.total || (safeAmount * safePrice) || 0);
              const logo = [...liveAssets, ...liveStocks].find((a) => a.symbol === tx.asset)?.image;
              const typeColor = isBuy ? 'bg-green-500/15 text-green-500 border-green-500/25'
                : tx.type === 'sell' ? 'bg-red-500/15 text-red-500 border-red-500/25'
                : isDeposit ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                : 'bg-orange-500/15 text-orange-400 border-orange-500/25';
              const typeLabel = isBuy ? 'BUY' : tx.type === 'sell' ? 'SELL' : isDeposit ? 'DEP' : 'WDR';
              return (
                <div key={tx.id ?? i}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-accent/60 transition-all duration-150 group animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Asset logo or icon */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center text-white text-[10px] font-bold ${logo ? 'bg-muted' : isBuy || tx.type === 'sell' ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                        {logo ? (
                          <img src={logo} alt={tx.asset} className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          isDeposit ? <ArrowDownRight className="w-4 h-4" /> :
                          isWithdrawal ? <ArrowUpRight className="w-4 h-4" /> :
                          <span>{(tx.asset || '??').slice(0, 2)}</span>
                        )}
                      </div>
                      {/* Type badge overlay */}
                      <span className={`absolute -bottom-1 -right-1 text-[8px] font-black px-1 rounded border ${typeColor}`}>{typeLabel}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">
                        {isDeposit ? 'Deposit' : isWithdrawal ? 'Withdrawal' : `${isBuy ? 'Bought' : 'Sold'} ${tx.assetName || tx.asset}`}
                      </p>
                      {!isDeposit && !isWithdrawal && (
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {safeAmount} {tx.asset} · ${safePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-sm font-bold tabular-nums ${isBuy || isDeposit ? 'text-foreground' : 'text-foreground'}`}>
                      {isDeposit ? '+' : isWithdrawal ? '-' : ''}${safeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${status === 'queued' ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/25' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                        {status === 'queued' ? 'QUEUED' : '✓ FILLED'}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Cross-App Transfer */}
      <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Cross-App Transfer</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Move funds between AuraVest, AuraBank &amp; AuraWallet instantly</p>
        </div>
        <InterAppTransfer sourceApp="vest" />
      </div>

      <MobileAppShowcase />

      {selectedAsset && <AssetDetailsModal asset={selectedAsset} onClose={() => { setSelectedAsset(null); setWatchlistItems(getWatchlist()); }} onTrade={handleTrade} />}
      {tradeModal && (
        <TradeModal
          asset={tradeModal.asset}
          onClose={() => {
            setTradeModal(null);
            loadLivePortfolio();
            loadRecentTransactions();
          }}
          initialType={tradeModal.type}
        />
      )}
    </div>
  );
}
