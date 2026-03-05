'use client';

import { useState } from 'react';
import { portfolioData, recentTransactions, cryptoAssets, stockAssets, riskMetrics } from '@/lib/mockData';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles, Shield, AlertTriangle } from 'lucide-react';
import LiveTransactionMap from '@/components/LiveTransactionMap';
import MobileAppShowcase from '@/components/MobileAppShowcase';
import PriceComparison from '@/components/PriceComparison';
import Gamification from '@/components/Gamification';
import TradeModal from '@/components/TradeModal';
import AssetDetailsModal from '@/components/AssetDetailsModal';
import AuraAIInsight from '@/components/AuraAIInsight';

export default function DashboardHome() {
  const { totalValue = 0, change24h = 0, changeAmount = 0 } = portfolioData || {};
  const isPositive = change24h >= 0;
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [tradeModal, setTradeModal] = useState<any>(null);
  const [showGamification, setShowGamification] = useState(false);

  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset);
  };

  const handleTrade = (asset: any, type: 'buy' | 'sell') => {
    setSelectedAsset(null);
    setTradeModal({ asset, type });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here's your portfolio overview.</p>
        </div>
        <button onClick={() => setShowGamification(!showGamification)} className="px-4 py-2 bg-gradient-to-r from-black to-crimson-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
          {showGamification ? 'Hide' : 'Show'} Achievements
        </button>
      </div>

      {showGamification && (
        <div className="animate-fadeIn">
          <Gamification />
        </div>
      )}

      <div className="gradient-primary rounded-xl p-6 text-white animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90 mb-1">Total Portfolio Value</p>
            <h2 className="text-4xl font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-semibold">{isPositive ? '+' : ''}{change24h}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
          <span className="text-sm">{isPositive ? '+' : '-'}${Math.abs(changeAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} (24h)</span>
        </div>
      </div>

      {/* Portfolio Health Widget */}
      <div className="bg-card border border-border rounded-lg p-6 animate-slideIn">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">Portfolio Health</h3>
          </div>
          <button className="text-sm text-primary hover:underline">View Details</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Risk Score */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Risk Score</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">{riskMetrics.score}/100</span>
              <span className={`text-xs px-2 py-0.5 rounded ${riskMetrics.level === 'High' ? 'bg-red-500/20 text-red-500' : riskMetrics.level === 'Moderate' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                {riskMetrics.level}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className={`h-2 rounded-full ${riskMetrics.score > 70 ? 'bg-red-500' : riskMetrics.score > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${riskMetrics.score}%` }} />
            </div>
          </div>

          {/* Diversification */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Diversification</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">{riskMetrics.diversification}%</span>
              <span className="text-xs text-muted-foreground">Target: 70%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className={`h-2 rounded-full ${riskMetrics.diversification >= 70 ? 'bg-green-500' : riskMetrics.diversification >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${riskMetrics.diversification}%` }} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Quick Actions</p>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                Rebalance
              </button>
              <button className="flex-1 px-3 py-2 bg-blue-500/10 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors">
                Add Gold
              </button>
            </div>
          </div>
        </div>

        {/* Risk Recommendations */}
        {riskMetrics.recommendations && riskMetrics.recommendations.length > 0 && (
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Recommendations</p>
                <ul className="text-xs text-orange-600 dark:text-orange-300 mt-1 space-y-1">
                  {riskMetrics.recommendations.map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PriceComparison assets={[...(cryptoAssets || []), ...(stockAssets || [])]} />
        <AuraAIInsight />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Trending Crypto</h3>
          <div className="space-y-3">
            {cryptoAssets.slice(0, 4).map((crypto) => {
              const isPositive = crypto.change24h >= 0;
              return (
                <div key={crypto.id} onClick={() => handleAssetClick(crypto)} className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {crypto.image}
                    </div>
                    <div>
                      <p className="font-semibold">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold">${crypto.price.toLocaleString()}</p>
                      <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{crypto.change24h}%
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrade(crypto, 'buy');
                        }}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Top Stocks</h3>
          <div className="space-y-3">
            {stockAssets.slice(0, 4).map((stock) => {
              const isPositive = stock.change24h >= 0;
              return (
                <div key={stock.id} onClick={() => handleAssetClick(stock)} className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">{stock.name}</p>
                      <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold">${stock.price.toLocaleString()}</p>
                      <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{stock.change24h}%
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrade(stock, 'buy');
                        }}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                      >
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

      <LiveTransactionMap />

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map((tx) => {
            const isBuy = tx.type === 'buy';
            return (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                    {isBuy ? <ArrowDownRight className="w-5 h-5 text-green-500" /> : <ArrowUpRight className="w-5 h-5 text-red-500" />}
                  </div>
                  <div>
                    <p className="font-semibold">{isBuy ? 'Bought' : 'Sold'} {tx.assetName}</p>
                    <p className="text-sm text-muted-foreground">{tx.amount} {tx.asset} @ ${tx.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${tx.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MobileAppShowcase />

      {selectedAsset && <AssetDetailsModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} onTrade={handleTrade} />}
      {tradeModal && <TradeModal asset={tradeModal.asset} onClose={() => setTradeModal(null)} initialType={tradeModal.type} />}
    </div>
  );
}
