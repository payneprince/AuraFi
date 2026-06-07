'use client';

import { useEffect, useState } from 'react';
import { cryptoAssets, stockAssets } from '@/lib/mockData';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles, Shield, AlertTriangle, Landmark } from 'lucide-react';
import { readUnifiedAuthSession } from '../../../../shared/unified-auth';
import LiveTransactionMap from '@/components/LiveTransactionMap';
import MobileAppShowcase from '@/components/MobileAppShowcase';
import InterAppTransfer from './InterAppTransfer';
import PriceComparison from '@/components/PriceComparison';
import TradeModal from '@/components/TradeModal';
import AssetDetailsModal from '@/components/AssetDetailsModal';
import AuraAIInsight from '@/components/AuraAIInsight';
import { getPortfolio } from '@/lib/mockAPI';

export default function DashboardHome() {
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

    const capitalInterval = setInterval(() => {
      refreshCapitalMetrics();
      loadRecentTransactions();
      void loadLivePortfolio();
    }, 2000);

    return () => clearInterval(capitalInterval);
  }, []);

  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset);
  };

  const handleTrade = (asset: any, type: 'buy' | 'sell') => {
    setSelectedAsset(null);
    setTradeModal({ asset, type });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Personalized header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">{getTimeGreeting()}, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {isPortfolioReady && totalValue > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}{change24h}% today
          </div>
        )}
      </div>

      {/* Portfolio value card */}
      <div className="gradient-primary rounded-xl p-6 text-white animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80 mb-1">Total Portfolio Value</p>
            {!isPortfolioReady
              ? <div className="h-10 w-48 rounded-lg bg-white/20 animate-pulse" />
              : <h2 className="text-4xl font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            }
          </div>
          {isPortfolioReady && totalValue > 0 && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-semibold">{isPositive ? '+' : ''}{change24h}%</span>
            </div>
          )}
        </div>

        {isPortfolioReady && totalValue > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            <span className={`text-sm font-medium ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
              {isPositive ? '+' : '-'}${Math.abs(changeAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} (24h)
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: 'Holdings Value', value: `$${holdingsValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
            { label: 'Cash Balance', value: `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
            { label: 'Net Cashflow', value: `${netTradeCashflow >= 0 ? '+' : '-'}$${Math.abs(netTradeCashflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, colored: true, positive: netTradeCashflow >= 0 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white/10 border border-white/20 px-3 py-2">
              <p className="opacity-80 text-xs mb-0.5">{stat.label}</p>
              {!isPortfolioReady
                ? <div className="h-5 w-20 rounded bg-white/20 animate-pulse" />
                : <p className={`font-semibold ${stat.colored ? (stat.positive ? 'text-green-200' : 'text-red-200') : ''}`}>{stat.value}</p>
              }
            </div>
          ))}
        </div>
      </div>

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
              onClick={openAuraBank}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-black to-red-700 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
            >
              <Landmark className="w-4 h-4" />
              Fund from AuraBank
            </button>
          </div>
        </div>
      )}

      {/* Portfolio Health Widget */}
      <div className="bg-card border border-border rounded-xl p-6 animate-slideIn">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold">Portfolio Health</h3>
          {health && (
            <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${
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
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No holdings to analyse</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Make your first trade to see your portfolio health score.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
              {/* Risk Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <span className="text-sm font-bold">{health.riskScore}/100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${health.riskScore > 70 ? 'bg-red-500' : health.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${health.riskScore}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {health.riskScore > 70 ? 'High volatility — consider balancing with stable assets'
                    : health.riskScore > 40 ? 'Moderate risk — reasonable balance for growth'
                    : 'Conservative — low volatility portfolio'}
                </p>
              </div>

              {/* Diversification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Diversification</p>
                  <span className="text-sm font-bold">{health.divScore}% <span className="text-xs font-normal text-muted-foreground">/ target 65%</span></span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${health.divScore >= 65 ? 'bg-green-500' : health.divScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${health.divScore}%` }}
                  />
                </div>
                {/* Asset class breakdown */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(health.classTotals).map(([cls, val]) => {
                    const pct = Math.round((val / health.totalHoldingsValue) * 100);
                    return (
                      <span key={cls} className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium capitalize">
                        {cls} {pct}%
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {health.recs.length > 0 && (
              <div className={`p-3 rounded-xl border text-sm ${
                health.divScore >= 65 && health.riskScore <= 70
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-orange-500/5 border-orange-500/20'
              }`}>
                <div className="flex items-start gap-2">
                  {health.divScore >= 65 && health.riskScore <= 70
                    ? <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  }
                  <ul className="space-y-1">
                    {health.recs.map((rec, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                      {crypto.image?.startsWith('http') ? (
                        <img src={crypto.image} alt={crypto.symbol} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : crypto.symbol?.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold">${(crypto.price ?? 0).toLocaleString()}</p>
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
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {stock.image?.startsWith('http') ? (
                        <img
                          src={stock.image}
                          alt={stock.symbol}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            const fallback = img.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span
                        className="text-xs font-bold text-slate-700"
                        style={{ display: stock.image?.startsWith('http') ? 'none' : 'flex' }}
                      >
                        {stock.symbol?.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{stock.name}</p>
                      <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold">${(stock.price ?? 0).toLocaleString()}</p>
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
          {transactionFeed.map((tx) => {
            const isBuy = tx.type === 'buy';
            const status = (tx.status || 'filled').toLowerCase();
            const safeAmount = Number(tx.amount || 0);
            const safePrice = Number(tx.price || 0);
            const safeTotal = Number(tx.total || (safeAmount * safePrice) || 0);
            return (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                    {isBuy ? <ArrowDownRight className="w-5 h-5 text-green-500" /> : <ArrowUpRight className="w-5 h-5 text-red-500" />}
                  </div>
                  <div>
                    <p className="font-semibold">{isBuy ? 'Bought' : 'Sold'} {tx.assetName}</p>
                    <p className="text-sm text-muted-foreground">{safeAmount} {tx.asset} @ ${safePrice.toLocaleString()}</p>
                    <p className={`text-xs mt-0.5 ${status === 'queued' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {status.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${safeTotal.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
        </div>
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

      {selectedAsset && <AssetDetailsModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} onTrade={handleTrade} />}
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
