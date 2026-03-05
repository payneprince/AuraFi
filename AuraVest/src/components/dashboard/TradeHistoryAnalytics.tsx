'use client';

import { useState, useEffect } from 'react';
import { getTradeAnalytics } from '@/lib/mockAPI';
import { TrendingUp, TrendingDown, BarChart3, Filter, Calendar, DollarSign } from 'lucide-react';

export default function TradeHistoryAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    const data = getTradeAnalytics();
    setAnalytics(data);
  }, []);

  if (!analytics) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  const metrics = [
    {
      label: 'Total Trades',
      value: analytics.totalTrades,
      icon: BarChart3,
      color: 'text-blue-500',
    },
    {
      label: 'Win/Loss Ratio',
      value: analytics.winLossRatio.toFixed(2),
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      label: 'Average Return',
      value: `$${analytics.averageReturn.toFixed(2)}`,
      icon: DollarSign,
      color: analytics.averageReturn >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      label: 'Total P&L',
      value: `$${analytics.totalPnL.toFixed(2)}`,
      icon: analytics.totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: analytics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Trade History & Analytics</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="all">All Assets</option>
            <option value="crypto">Crypto</option>
            <option value="stocks">Stocks</option>
            <option value="gold">Gold</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Personalized Learning Recommendations */}
      {analytics.winLossRatio < 1.0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-700 dark:text-blue-400">Improve Your Trading Performance</h3>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                Based on your win/loss ratio of {analytics.winLossRatio.toFixed(2)}, we recommend:
              </p>
              <div className="mt-2 space-y-1">
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  📚 Risk Management Course
                </button>
                <span className="text-blue-600 dark:text-blue-400 mx-2">•</span>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  📈 Technical Analysis Guide
                </button>
                <span className="text-blue-600 dark:text-blue-400 mx-2">•</span>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  🎯 Position Sizing Strategies
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
              <span className="text-sm text-muted-foreground">{metric.label}</span>
            </div>
            <p className="text-2xl font-bold">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Win/Loss Distribution */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Win/Loss Distribution</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-green-500">Winning Trades</span>
              <span className="text-sm font-medium">{analytics.winningTrades}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(analytics.winningTrades / analytics.totalTrades) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-red-500">Losing Trades</span>
              <span className="text-sm font-medium">{analytics.losingTrades}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${(analytics.losingTrades / analytics.totalTrades) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {/* Mock recent transactions - in real app, fetch from API */}
          {Array.from({ length: 5 }, (_, i) => ({
            id: `tx-${i}`,
            type: Math.random() > 0.5 ? 'buy' : 'sell',
            asset: ['BTC', 'ETH', 'AAPL', 'GOLD'][Math.floor(Math.random() * 4)],
            amount: (Math.random() * 100).toFixed(2),
            price: (Math.random() * 50000).toFixed(2),
            total: (Math.random() * 5000).toFixed(2),
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          })).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  tx.type === 'buy' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {tx.type === 'buy' ? 'B' : 'S'}
                </div>
                <div>
                  <p className="font-medium">{tx.asset}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${tx.total}</p>
                <p className="text-xs text-muted-foreground">{tx.amount} @ ${tx.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
