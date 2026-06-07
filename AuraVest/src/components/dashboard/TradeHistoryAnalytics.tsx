'use client';

import { useState, useEffect } from 'react';
import { getTradeAnalytics } from '@/lib/mockAPI';
import { loadCrypto, loadStocks, getGoldList } from '@/lib/marketData';
import { TrendingUp, TrendingDown, BarChart3, Calendar, DollarSign, BookOpen, Target, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
        <img
          src={image}
          alt={symbol}
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

export default function TradeHistoryAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [assetImages, setAssetImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const data = getTradeAnalytics();
    setAnalytics(data);
  }, []);

  useEffect(() => {
    Promise.all([loadCrypto(), loadStocks(), getGoldList()]).then(([crypto, stocks, gold]) => {
      const map: Record<string, string> = {};
      [...crypto, ...stocks, ...(gold as any[])].forEach((a: any) => {
        if (a?.symbol && a?.image) map[a.symbol] = a.image;
      });
      map.GOLD = map.GOLD || (gold as any[]).find((g: any) => g?.image)?.image || '';
      setAssetImages(map);
    });
  }, []);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 rounded-full border-2 border-transparent border-t-primary border-r-primary/30 animate-spin" />
          <span className="text-sm">Loading analytics...</span>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Trades',
      value: analytics.totalTrades,
      icon: BarChart3,
      color: 'text-blue-500',
      ring: 'border-t-blue-400/80 border-r-blue-400/30',
      glow: 'from-blue-500/10 to-transparent',
    },
    {
      label: 'Win/Loss Ratio',
      value: analytics.closedTrades > 0 ? analytics.winLossRatio.toFixed(2) : '—',
      icon: TrendingUp,
      color: 'text-green-500',
      ring: 'border-t-green-400/80 border-r-emerald-400/30',
      glow: 'from-green-500/10 to-transparent',
    },
    {
      label: 'Average Return',
      value: analytics.closedTrades > 0 ? `$${analytics.averageReturn.toFixed(2)}` : '—',
      icon: DollarSign,
      color: analytics.averageReturn >= 0 ? 'text-green-500' : 'text-red-500',
      ring: analytics.averageReturn >= 0 ? 'border-t-green-400/80 border-r-emerald-400/30' : 'border-t-red-400/80 border-r-rose-400/30',
      glow: analytics.averageReturn >= 0 ? 'from-green-500/10 to-transparent' : 'from-red-500/10 to-transparent',
    },
    {
      label: 'Total P&L',
      value: `$${analytics.totalPnL.toFixed(2)}`,
      icon: analytics.totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: analytics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500',
      ring: analytics.totalPnL >= 0 ? 'border-t-green-400/80 border-r-emerald-400/30' : 'border-t-red-400/80 border-r-rose-400/30',
      glow: analytics.totalPnL >= 0 ? 'from-green-500/10 to-transparent' : 'from-red-500/10 to-transparent',
    },
  ];

  const recommendations = [
    { label: 'Risk Management Course', icon: BookOpen, color: 'text-blue-500' },
    { label: 'Technical Analysis Guide', icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Position Sizing Strategies', icon: Target, color: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Trade History &amp; Analytics
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

      {/* Personalized Learning Recommendations */}
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

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="relative overflow-hidden bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 60}ms` }}
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

      {/* Win/Loss Distribution */}
      <div className="bg-card border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '120ms' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-primary" />
          Win/Loss Distribution
        </h3>
        {analytics.closedTrades > 0 ? (
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-green-500 font-medium flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" />Winning Trades</span>
                <span className="text-sm font-bold">{analytics.winningTrades}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-600 to-emerald-400 h-2.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(analytics.winningTrades / analytics.closedTrades) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-red-500 font-medium flex items-center gap-1"><ArrowDownRight className="w-3.5 h-3.5" />Losing Trades</span>
                <span className="text-sm font-bold">{analytics.losingTrades}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 to-rose-400 h-2.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(analytics.losingTrades / analytics.closedTrades) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            {analytics.totalTrades > 0
              ? 'Sell a position to start tracking your win/loss record — wins and losses are measured on closed (sell) trades.'
              : 'Place your first trade to start building your win/loss record.'}
          </p>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '160ms' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-primary" />
          Recent Transactions
        </h3>
        <div className="space-y-2.5">
          {/* Mock recent transactions - in real app, fetch from API */}
          {Array.from({ length: 5 }, (_, i) => ({
            id: `tx-${i}`,
            type: Math.random() > 0.5 ? 'buy' : 'sell',
            asset: ['BTC', 'ETH', 'AAPL', 'GOLD'][Math.floor(Math.random() * 4)],
            amount: (Math.random() * 100).toFixed(2),
            price: (Math.random() * 50000).toFixed(2),
            total: (Math.random() * 5000).toFixed(2),
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          })).map((tx, idx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-xl transition-colors animate-in fade-in slide-in-from-bottom-1"
              style={{ animationDelay: `${180 + idx * 40}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <TxAssetLogo symbol={tx.asset} image={assetImages[tx.asset]} />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-card ${
                    tx.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {tx.type === 'buy' ? 'B' : 'S'}
                  </div>
                </div>
                <div>
                  <p className="font-medium flex items-center gap-1.5">
                    {tx.asset}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${tx.type === 'buy' ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>
                      {tx.type.toUpperCase()}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">${tx.total}</p>
                <p className="text-xs text-muted-foreground">{tx.amount} @ ${tx.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
