'use client';

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Chart as ChartJS,
  type ScriptableContext,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { loadCrypto, loadStocks, getGoldList } from '@/lib/marketData';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  BarChart2,
  Calendar,
  DollarSign,
  BookOpen,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react';

const TradingChart = lazy(() => import('./TradingChart'));

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler, Legend);

// ─── helpers ──────────────────────────────────────────────────────────────────

function TxAssetLogo({ symbol, image }: { symbol: string; image?: string }) {
  const isBrandLogo = !!image && (image.includes('simpleicons.org') || image.includes('/logos/stocks/'));
  const isUrl = !!image && (image.startsWith('http') || image.startsWith('/'));
  const isGlyph = !!image && !isUrl;
  return (
    <div
      className={`flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${isBrandLogo ? 'bg-white border border-slate-200' : 'bg-gradient-to-br from-purple-500 to-blue-500'}`}
      style={{ width: 34, height: 34 }}
    >
      {isUrl ? (
        <img src={image} alt={symbol}
          className={isBrandLogo ? 'w-5 h-5 object-contain' : 'w-full h-full object-cover'}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : isGlyph ? (
        <span className="text-base">{image}</span>
      ) : (
        <span className="text-white font-bold text-xs">{symbol.slice(0, 2)}</span>
      )}
    </div>
  );
}

const DATE_CUTOFFS: Record<string, number> = {
  '7d':  7  * 86400000,
  '30d': 30 * 86400000,
  '90d': 90 * 86400000,
  '1y':  365 * 86400000,
};

const KNOWN_CRYPTO = new Set([
  'BTC','ETH','BNB','SOL','ADA','DOT','LINK','AVAX','MATIC','UNI','ALGO','VET',
  'ICP','FIL','TRX','ETC','XLM','THETA','FTM','HBAR','NEAR','FLOW','MANA','SAND',
  'AXS','CHZ','ATOM','XMR','EGLD','AAVE','MKR','COMP','SUSHI','SNX','YFI','CRV',
  '1INCH','ZRX','REN','KNC','ENJ','GALA','ILV','GRT','DYDX','LDO','RUNE','GMX',
  'OP','ARB','DOGE','XRP','LTC','BCH','SHIB','PEPE','WIF','BONK',
]);
const KNOWN_GOLD = new Set(['GOLD','XAU','DGOLD','DXAU','GOLD-1G','GOLD-5G','GOLD-10G','GLD.GH']);

function symbolCategory(symbol: string): 'crypto' | 'stocks' | 'gold' {
  if (KNOWN_GOLD.has(symbol)) return 'gold';
  if (KNOWN_CRYPTO.has(symbol)) return 'crypto';
  return 'stocks';
}

function applyFilters(txs: any[], filter: string, dateRange: string) {
  const now = Date.now();
  const cutoff = DATE_CUTOFFS[dateRange] ?? Infinity;
  return txs.filter((tx) => {
    const ts = Date.parse(tx?.timestamp || '');
    if (!isNaN(ts) && ts < now - cutoff) return false;
    if (filter !== 'all') {
      const cat = symbolCategory(String(tx?.asset || '').toUpperCase());
      if (cat !== filter) return false;
    }
    return true;
  });
}

function computeAnalytics(txs: any[]) {
  const filled = txs.filter((tx) => {
    const status = String(tx?.status || '').toLowerCase();
    return !status || status === 'filled' || status === 'completed';
  });

  if (filled.length === 0) {
    return { totalTrades: 0, winLossRatio: 0, averageReturn: 0, totalPnL: 0, winningTrades: 0, losingTrades: 0, closedTrades: 0 };
  }

  const chrono = [...filled].sort((a, b) => Date.parse(a?.timestamp || '') - Date.parse(b?.timestamp || ''));
  const positions: Record<string, { amount: number; avgCost: number }> = {};
  let totalPnL = 0, wins = 0, losses = 0;

  chrono.forEach((tx) => {
    const symbol = String(tx?.asset || '');
    const amount = Number(tx?.amount || 0);
    const price = Number(tx?.price || 0);
    const gross = Number.isFinite(Number(tx?.gross)) ? Number(tx.gross) : amount * price;
    const fee = Number.isFinite(Number(tx?.fee)) ? Number(tx.fee) : gross * 0.001;
    const type = String(tx?.type || '').toLowerCase();
    const pos = positions[symbol] || { amount: 0, avgCost: 0 };

    if (type === 'buy') {
      const newAmt = pos.amount + amount;
      pos.avgCost = newAmt > 0 ? (pos.avgCost * pos.amount + price * amount) / newAmt : price;
      pos.amount = newAmt;
      positions[symbol] = pos;
    } else if (type === 'sell' && pos.amount > 0) {
      const sellAmt = Math.min(amount, pos.amount);
      const pnl = (price - pos.avgCost) * sellAmt - fee;
      totalPnL += pnl;
      if (pnl > 0) wins++;
      else if (pnl < 0) losses++;
      pos.amount -= sellAmt;
      positions[symbol] = pos;
    }
  });

  const closed = wins + losses;
  return {
    totalTrades: filled.length,
    winLossRatio: closed > 0 ? wins / Math.max(losses, 1) : 0,
    averageReturn: closed > 0 ? totalPnL / closed : 0,
    totalPnL,
    winningTrades: wins,
    losingTrades: losses,
    closedTrades: closed,
  };
}

function computePnLSeries(txs: any[]): { label: string; value: number }[] {
  const filled = txs
    .filter((tx) => {
      const status = String(tx?.status || '').toLowerCase();
      return !status || status === 'filled' || status === 'completed';
    })
    .sort((a, b) => Date.parse(a?.timestamp || '') - Date.parse(b?.timestamp || ''));

  const positions: Record<string, { amount: number; avgCost: number }> = {};
  let cum = 0;
  const series: { label: string; value: number }[] = [];

  filled.forEach((tx) => {
    const symbol = String(tx?.asset || '');
    const amount = Number(tx?.amount || 0);
    const price = Number(tx?.price || 0);
    const gross = amount * price;
    const fee = gross * 0.001;
    const type = String(tx?.type || '').toLowerCase();
    const pos = positions[symbol] || { amount: 0, avgCost: 0 };

    if (type === 'buy') {
      const newAmt = pos.amount + amount;
      pos.avgCost = newAmt > 0 ? (pos.avgCost * pos.amount + price * amount) / newAmt : price;
      pos.amount = newAmt;
      positions[symbol] = pos;
    } else if (type === 'sell' && pos.amount > 0) {
      const sellAmt = Math.min(amount, pos.amount);
      const pnl = (price - pos.avgCost) * sellAmt - fee;
      cum += pnl;
      pos.amount -= sellAmt;
      positions[symbol] = pos;
      const d = new Date(tx?.timestamp || '');
      series.push({
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Number(cum.toFixed(2)),
      });
    }
  });

  return series;
}

function computeAssetVolumes(txs: any[]): { symbol: string; volume: number; image?: string }[] {
  const map: Record<string, number> = {};
  txs.forEach((tx) => {
    const type = String(tx?.type || '').toLowerCase();
    if (type !== 'buy' && type !== 'sell') return;
    const symbol = String(tx?.asset || 'Unknown');
    const total = Number(tx?.total) || (Number(tx?.amount || 0) * Number(tx?.price || 0));
    map[symbol] = (map[symbol] || 0) + total;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([symbol, volume]) => ({ symbol, volume }));
}

// ─── component ────────────────────────────────────────────────────────────────

export default function TradeHistoryAnalytics() {
  const [view, setView] = useState<'chart' | 'analytics'>('chart');
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [allTxs, setAllTxs] = useState<any[]>([]);
  const [assetImages, setAssetImages] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);
  const [chartSymbol, setChartSymbol] = useState<string | undefined>(undefined);
  const [tickerAssets, setTickerAssets] = useState<any[]>([]);

  useEffect(() => { setIsClient(true); }, []);

  // Load real transactions from localStorage
  useEffect(() => {
    const load = () => {
      const stored = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
      setAllTxs(Array.isArray(stored) ? stored : []);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  // Build symbol→image map + ticker asset list from live market data
  useEffect(() => {
    Promise.all([loadCrypto(), loadStocks(), getGoldList()]).then(([crypto, stocks, gold]) => {
      const map: Record<string, string> = {};
      [...crypto, ...stocks, ...(gold as any[])].forEach((a: any) => {
        if (a?.symbol && a?.image) map[a.symbol] = a.image;
      });
      setAssetImages(map);
      setTickerAssets((crypto as any[]).slice(0, 24));
    });
  }, []);

  const filtered = useMemo(() => applyFilters(allTxs, filter, dateRange), [allTxs, filter, dateRange]);
  const analytics = useMemo(() => computeAnalytics(filtered), [filtered]);
  const pnlSeries = useMemo(() => computePnLSeries(filtered), [filtered]);
  const assetVolumes = useMemo(() => computeAssetVolumes(filtered), [filtered]);

  // Real recent transactions (newest first, max 10)
  const recentTxs = useMemo(() =>
    [...filtered]
      .filter((tx) => ['buy', 'sell'].includes(String(tx?.type || '').toLowerCase()))
      .sort((a, b) => Date.parse(b?.timestamp || '') - Date.parse(a?.timestamp || ''))
      .slice(0, 10),
    [filtered]
  );

  // ── Chart data ────────────────────────────────────────────────────────────

  const pnlIsPositive = pnlSeries.length === 0 || pnlSeries[pnlSeries.length - 1].value >= 0;
  const lineColor = pnlIsPositive ? 'rgb(34,197,94)' : 'rgb(239,68,68)';
  const gradTop   = pnlIsPositive ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';

  const pnlChartData = {
    labels: pnlSeries.map((p) => p.label),
    datasets: [{
      label: 'Cumulative P&L',
      data: pnlSeries.map((p) => p.value),
      borderColor: lineColor,
      borderWidth: 2,
      pointRadius: pnlSeries.length <= 12 ? 4 : 0,
      pointHoverRadius: 6,
      pointBackgroundColor: lineColor,
      tension: 0.35,
      fill: true,
      backgroundColor: (ctx: ScriptableContext<'line'>) => {
        const chart = ctx.chart;
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return gradTop;
        const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        grad.addColorStop(0, gradTop);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        return grad;
      },
    }],
  };

  const pnlChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(8,13,26,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: 'rgba(255,255,255,0.5)',
        bodyColor: '#fff',
        padding: 10,
        callbacks: {
          label: (item: any) => ` $${Number(item.raw).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: 'rgba(255,255,255,0.35)',
          font: { size: 10 },
          callback: (v: any) => `$${Number(v).toFixed(0)}`,
        },
      },
    },
  } as const;

  const volChartData = {
    labels: assetVolumes.map((a) => a.symbol),
    datasets: [{
      label: 'Volume (USD)',
      data: assetVolumes.map((a) => Number(a.volume.toFixed(2))),
      backgroundColor: assetVolumes.map((_, i) =>
        `hsla(${260 + i * 18},80%,${60 + i * 2}%,0.75)`
      ),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const volChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(8,13,26,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: 'rgba(255,255,255,0.5)',
        bodyColor: '#fff',
        padding: 10,
        callbacks: {
          label: (item: any) => ` $${Number(item.raw).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: 'rgba(255,255,255,0.35)',
          font: { size: 10 },
          callback: (v: any) => `$${Number(v) >= 1000 ? (Number(v) / 1000).toFixed(0) + 'k' : Number(v).toFixed(0)}`,
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 11, weight: 'bold' as const } },
      },
    },
  };

  // ── Metric cards ─────────────────────────────────────────────────────────

  const metrics = [
    {
      label: 'Total Trades',
      value: analytics.totalTrades,
      icon: BarChart3,
      color: 'text-blue-400',
      ring: 'border-t-blue-400/80 border-r-blue-400/30',
      glow: 'from-blue-500/10 to-transparent',
    },
    {
      label: 'Win/Loss Ratio',
      value: analytics.closedTrades > 0 ? analytics.winLossRatio.toFixed(2) : '—',
      icon: TrendingUp,
      color: 'text-green-400',
      ring: 'border-t-green-400/80 border-r-emerald-400/30',
      glow: 'from-green-500/10 to-transparent',
    },
    {
      label: 'Avg Return',
      value: analytics.closedTrades > 0 ? `$${analytics.averageReturn.toFixed(2)}` : '—',
      icon: DollarSign,
      color: analytics.averageReturn >= 0 ? 'text-green-400' : 'text-red-400',
      ring: analytics.averageReturn >= 0 ? 'border-t-green-400/80 border-r-emerald-400/30' : 'border-t-red-400/80 border-r-rose-400/30',
      glow: analytics.averageReturn >= 0 ? 'from-green-500/10 to-transparent' : 'from-red-500/10 to-transparent',
    },
    {
      label: 'Total P&L',
      value: `${analytics.totalPnL >= 0 ? '+' : ''}$${analytics.totalPnL.toFixed(2)}`,
      icon: analytics.totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: analytics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400',
      ring: analytics.totalPnL >= 0 ? 'border-t-green-400/80 border-r-emerald-400/30' : 'border-t-red-400/80 border-r-rose-400/30',
      glow: analytics.totalPnL >= 0 ? 'from-green-500/10 to-transparent' : 'from-red-500/10 to-transparent',
    },
  ];

  const recommendations = [
    { label: 'Risk Management Course', icon: BookOpen, color: 'text-blue-400' },
    { label: 'Technical Analysis Guide', icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Position Sizing Strategies', icon: Target, color: 'text-indigo-400' },
  ];

  const isEmpty = allTxs.length === 0;

  return (
    <div className="space-y-6">

      {/* Header + Filters */}
      {/* ── Sub-tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border animate-in fade-in duration-300">
        <button
          onClick={() => setView('chart')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
            view === 'chart'
              ? 'bg-background text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Live Chart
        </button>
        <button
          onClick={() => setView('analytics')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
            view === 'analytics'
              ? 'bg-background text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
      </div>

      {/* ── Live Chart tab ───────────────────────────────────────────────────── */}
      {view === 'chart' && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Chart */}
          <div style={{ height: 560 }}>
            <Suspense fallback={
              <div className="flex items-center justify-center h-full bg-[#080d1a] rounded-2xl border border-white/8">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading chart…</span>
                </div>
              </div>
            }>
              <TradingChart initialSymbol={chartSymbol} />
            </Suspense>
          </div>

          {/* Auto-scrolling asset ticker */}
          {tickerAssets.length > 0 && (
            <div className="relative overflow-hidden rounded-xl border border-border bg-card/50">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card/80 to-transparent z-10 pointer-events-none" />
              <style>{`
                @keyframes analyticsTicker {
                  0%   { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .analytics-ticker-track {
                  animation: analyticsTicker 35s linear infinite;
                  display: flex;
                  width: max-content;
                }
                .analytics-ticker-track:hover { animation-play-state: paused; }
              `}</style>
              <div className="py-2 px-2">
                <div className="analytics-ticker-track" style={{ gap: 6 }}>
                  {[...tickerAssets, ...tickerAssets].map((asset: any, i: number) => {
                    const isActive = chartSymbol === asset.symbol;
                    const isPos    = (asset.change24h ?? 0) >= 0;
                    const isBrand  = asset.image?.includes('simpleicons.org') || asset.image?.includes('/logos/stocks/');
                    return (
                      <button
                        key={`${asset.id}-${i}`}
                        onClick={() => setChartSymbol(asset.symbol)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex-shrink-0 transition-all active:scale-95 ${
                          isActive
                            ? 'bg-primary/15 border-primary/40 text-primary'
                            : 'bg-background/60 border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border'
                        }`}
                        style={{ marginRight: 6 }}
                      >
                        <span className={`w-5 h-5 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${isBrand ? 'bg-white' : 'bg-gradient-to-br from-purple-500 to-blue-500'}`}>
                          {(asset.image?.startsWith('http') || asset.image?.startsWith('/')) ? (
                            <img src={asset.image} alt={asset.symbol}
                              className={isBrand ? 'w-3.5 h-3.5 object-contain' : 'w-5 h-5 object-cover'}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : <span className="text-white text-[8px] font-bold">{asset.symbol?.slice(0, 2)}</span>}
                        </span>
                        <span>{asset.symbol}</span>
                        <span className={`text-[10px] ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                          {isPos ? '+' : ''}{Number(asset.change24h ?? 0).toFixed(2)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'analytics' && <>

      {/* Analytics header + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Trade Analytics
        </h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
          >
            <option value="all">All Assets</option>
            <option value="crypto">Crypto</option>
            <option value="stocks">Stocks</option>
            <option value="gold">Gold</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="relative w-16 h-16 mb-1">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="w-7 h-7 text-primary/60" />
            </div>
          </div>
          <p className="font-semibold text-foreground">No trades yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">Head to the Trade tab to place your first order — your analytics will appear here.</p>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Learning recommendation banner */}
          {analytics.closedTrades > 0 && analytics.winLossRatio < 1.0 && (
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '40ms' }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
              <div className="relative flex items-start gap-3">
                <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400/80 border-r-purple-400/30 animate-spin" style={{ animationDuration: '2.5s' }} />
                  <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-700 dark:text-blue-400">Improve Your Trading Performance</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    Based on your win/loss ratio of {analytics.winLossRatio.toFixed(2)}, we recommend:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recommendations.map((rec) => (
                      <button
                        key={rec.label}
                        onClick={() => window.dispatchEvent(new CustomEvent('auravest:navigate', { detail: { tab: 'learn' } }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-background/70 border border-border/60 rounded-lg text-xs font-medium hover:bg-background hover:border-primary/40 hover:-translate-y-0.5 transition-all active:scale-95"
                      >
                        <rec.icon className={`w-3.5 h-3.5 ${rec.color}`} />
                        {rec.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, i) => (
              <div
                key={i}
                className="relative overflow-hidden bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.glow} opacity-60 pointer-events-none`} />
                <div className="relative flex items-center gap-2 mb-3">
                  <div className="relative flex-shrink-0" style={{ width: 30, height: 30 }}>
                    <div className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin ${metric.ring}`} style={{ animationDuration: '2.5s' }} />
                    <div className="absolute inset-[2px] rounded-full bg-card flex items-center justify-center">
                      <metric.icon className={`w-3.5 h-3.5 ${metric.color}`} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{metric.label}</span>
                </div>
                <p className="relative text-2xl font-black">{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Cumulative P&L Chart */}
          <div className="bg-card border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                Cumulative P&L
              </h3>
              {pnlSeries.length > 0 && (
                <span className={`text-sm font-bold ${pnlIsPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {pnlIsPositive ? '+' : ''}${pnlSeries[pnlSeries.length - 1].value.toFixed(2)}
                </span>
              )}
            </div>
            {isClient && pnlSeries.length > 0 ? (
              <div style={{ height: 200 }}>
                <Line data={pnlChartData} options={pnlChartOptions} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {analytics.totalTrades > 0
                    ? 'Sell a position to start tracking your P&L over time.'
                    : 'No trades in this period.'}
                </p>
              </div>
            )}
          </div>

          {/* Win/Loss + Asset Volume row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Win/Loss Distribution */}
            <div className="bg-card border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '160ms' }}>
              <h3 className="font-semibold mb-4 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-primary" />
                Win / Loss
              </h3>
              {analytics.closedTrades > 0 ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-green-500 font-medium flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" />Winning</span>
                      <span className="text-sm font-bold">{analytics.winningTrades} <span className="text-muted-foreground font-normal text-xs">({((analytics.winningTrades / analytics.closedTrades) * 100).toFixed(0)}%)</span></span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-400 h-2.5 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(analytics.winningTrades / analytics.closedTrades) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-red-500 font-medium flex items-center gap-1"><ArrowDownRight className="w-3.5 h-3.5" />Losing</span>
                      <span className="text-sm font-bold">{analytics.losingTrades} <span className="text-muted-foreground font-normal text-xs">({((analytics.losingTrades / analytics.closedTrades) * 100).toFixed(0)}%)</span></span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-red-600 to-rose-400 h-2.5 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(analytics.losingTrades / analytics.closedTrades) * 100}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/60 flex justify-between text-sm">
                    <span className="text-muted-foreground">Win rate</span>
                    <span className={`font-bold ${((analytics.winningTrades / analytics.closedTrades) * 100) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {((analytics.winningTrades / analytics.closedTrades) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  {analytics.totalTrades > 0
                    ? 'Sell a position to start tracking wins and losses.'
                    : 'No trades in this period.'}
                </p>
              )}
            </div>

            {/* Asset Volume Chart */}
            <div className="bg-card border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '200ms' }}>
              <h3 className="font-semibold mb-4 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-primary" />
                Volume by Asset
              </h3>
              {isClient && assetVolumes.length > 0 ? (
                <div style={{ height: 180 }}>
                  <Bar data={volChartData} options={volChartOptions} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-44 gap-2 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No trade volume in this period.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions — real data */}
          <div className="bg-card border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '240ms' }}>
            <h3 className="font-semibold mb-4 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              Recent Transactions
              <span className="ml-auto text-[11px] text-muted-foreground font-normal">{recentTxs.length} shown</span>
            </h3>
            {recentTxs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transactions in this period.</p>
            ) : (
              <div className="space-y-2.5">
                {recentTxs.map((tx, idx) => {
                  const isBuy = String(tx?.type || '').toLowerCase() === 'buy';
                  const symbol = String(tx?.asset || '—');
                  const total = Number(tx?.total) || (Number(tx?.amount || 0) * Number(tx?.price || 0));
                  const amount = Number(tx?.amount || 0);
                  const price = Number(tx?.price || 0);
                  return (
                    <div
                      key={tx?.id || idx}
                      className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-xl transition-colors animate-in fade-in slide-in-from-bottom-1"
                      style={{ animationDelay: `${260 + idx * 35}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <TxAssetLogo symbol={symbol} image={assetImages[symbol]} />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-card ${isBuy ? 'bg-green-500' : 'bg-red-500'}`}>
                            {isBuy ? 'B' : 'S'}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-1.5">
                            {symbol}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${isBuy ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>
                              {isBuy ? 'BUY' : 'SELL'}
                            </span>
                            {tx?.status === 'queued' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-amber-500/15 text-amber-500">QUEUED</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx?.timestamp ? new Date(tx.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${isBuy ? 'text-red-400' : 'text-green-400'}`}>
                          {isBuy ? '-' : '+'}${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {amount.toLocaleString('en-US', { maximumFractionDigits: 6 })} @ ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      </> /* end analytics view */}
    </div>
  );
}
