// src/components/dashboard/PortfolioPage.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  portfolioData,
  riskMetrics,
  dcaPlans,
  benchmarkIndices,
  enhancedHoldings,
  advancedRiskMetrics,
  performanceAttribution,
  monteCarloData,
  taxOptimization
} from '@/lib/mockData';
import { getPortfolio, exportTransactionsCSV, getWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/mockAPI';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  Shield,
  Sparkles,
  Zap,
  FileText,
  Calendar,
  BarChart3,
  Target,
  DollarSign,
  AlertTriangle,
  Settings,
  ChevronDown,
  Bell,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import PortfolioChart from '@/components/PortfolioChart';
import { chartData } from '@/lib/mockData';
import RebalancingWizard from '@/components/RebalancingWizard';
import TaxOptimizationModal from '@/components/TaxOptimizationModal';
import GoalsPlanningModal from '@/components/GoalsPlanningModal';
import TradeModal from '@/components/TradeModal';
import PriceAlertModal from '@/components/PriceAlertModal';

export default function PortfolioPage() {
  const getInitialPortfolio = () => {
    if (typeof window === 'undefined') return null;
    try {
      const storedPortfolio = JSON.parse(localStorage.getItem('auravest_portfolio') || '{}');
      if (storedPortfolio && Object.keys(storedPortfolio).length > 0) {
        return storedPortfolio;
      }
    } catch (error) {
      console.error('Failed to read initial portfolio from localStorage:', error);
    }
    return null;
  };

  const [portfolio, setPortfolio] = useState(getInitialPortfolio);
  const [localPositions, setLocalPositions] = useState<any[]>([]);
  const [tradeHoldings, setTradeHoldings] = useState<any[]>([]);
  const isPortfolioReady = portfolio && typeof portfolio.totalValue === 'number';
  const { totalValue = 0, change24h = 0, changeAmount = 0, assets = [] } = portfolio || {};
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRebalancingWizard, setShowRebalancingWizard] = useState(false);
  const [showTaxOptimization, setShowTaxOptimization] = useState(false);
  const [showGoalsPlanning, setShowGoalsPlanning] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<any | null>(null);
  const [holdingsFilter, setHoldingsFilter] = useState<'all' | 'stocks' | 'crypto' | 'gold' | 'nft' | 'local'>('all');
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [tradeModal, setTradeModal] = useState<any>(null);
  const [alertModal, setAlertModal] = useState<any>(null);

  const normalizeAssetClass = (assetClass?: string, fallbackHolding?: any) => {
    const normalized = (assetClass || '').toLowerCase();
    if (normalized === 'crypto') return 'Crypto';
    if (normalized === 'stocks' || normalized === 'stock') return 'Stocks';
    if (normalized === 'gold') return 'Gold';
    if (normalized === 'nfts' || normalized === 'nft') return 'NFT';
    if (normalized === 'local investments') return 'Local Investments';

    const symbol = (fallbackHolding?.symbol || '').toUpperCase();
    const knownCryptoSymbols = new Set([
      'BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'LINK', 'AVAX', 'MATIC', 'UNI',
      'ALGO', 'VET', 'ICP', 'FIL', 'TRX', 'ETC', 'XLM', 'THETA', 'FTM', 'HBAR',
      'NEAR', 'FLOW', 'MANA', 'SAND', 'AXS', 'CHZ', 'ATOM', 'XMR', 'EGLD', 'AAVE',
      'MKR', 'COMP', 'SUSHI', 'SNX', 'YFI', 'CRV', '1INCH', 'ZRX', 'REN', 'KNC',
      'ENJ', 'GALA', 'ILV', 'GRT', 'DYDX', 'LDO', 'RUNE', 'GMX', 'OP', 'ARB'
    ]);
    const knownNftSymbols = new Set([
      'BAYC', 'PUNK', 'MAYC', 'BAKC', 'AZUKI', 'DOODLE', 'WOW', 'WOWG', 'MEEBIT',
      'CLONEX', 'MOON', 'BEAN', 'INVISIBLE', 'OTHER', 'BLOCKS', 'PENGUIN', 'BEEPLE',
      'AXIE'
    ]);

    if (knownCryptoSymbols.has(symbol)) return 'Crypto';
    if (knownNftSymbols.has(symbol)) return 'NFT';

    if (fallbackHolding?.currency === 'GHS') return 'Stocks';
    if (fallbackHolding?.symbol === 'GOLD' || fallbackHolding?.symbol === 'XAU' || fallbackHolding?.symbol === 'DGOLD' || fallbackHolding?.symbol === 'DXAU') return 'Gold';
    if (fallbackHolding?.image?.startsWith('/nft/') || fallbackHolding?.collection) return 'NFT';
    if (fallbackHolding?.quantityType === 'shares') return 'Stocks';
    return fallbackHolding?.type || 'Stocks';
  };

  const refreshTradeHoldings = () => {
    const savedTradeHoldings = localStorage.getItem('auravest_trade_holdings');
    if (!savedTradeHoldings) {
      setTradeHoldings([]);
      return;
    }

    const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    const classBySymbol = new Map<string, string>();
    transactions.forEach((tx: any) => {
      if (tx?.asset && tx?.assetClass && !classBySymbol.has(tx.asset)) {
        classBySymbol.set(tx.asset, tx.assetClass);
      }
    });

    const parsedHoldings = JSON.parse(savedTradeHoldings);
    const normalizedHoldings = parsedHoldings.map((holding: any) => ({
      ...holding,
      type: normalizeAssetClass(classBySymbol.get(holding.symbol), holding),
    }));

    setTradeHoldings(normalizedHoldings);
  };

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const data = await getPortfolio();
        if (data && Object.keys(data).length > 0) {
          setPortfolio(data);
        }
      } catch (error) {
        console.error('Failed to load portfolio:', error);
      }
    };

    loadPortfolio();
    setWatchlist(getWatchlist());

    const savedLocalPositions = localStorage.getItem('auravest_local_positions');
    if (savedLocalPositions) {
      setLocalPositions(JSON.parse(savedLocalPositions));
    }

    const savedTradeHoldings = localStorage.getItem('auravest_trade_holdings');
    if (savedTradeHoldings) {
      const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
      const classBySymbol = new Map<string, string>();
      transactions.forEach((tx: any) => {
        if (tx?.asset && tx?.assetClass && !classBySymbol.has(tx.asset)) {
          classBySymbol.set(tx.asset, tx.assetClass);
        }
      });

      const parsedHoldings = JSON.parse(savedTradeHoldings);
      const normalizedHoldings = parsedHoldings.map((holding: any) => ({
        ...holding,
        type: normalizeAssetClass(classBySymbol.get(holding.symbol), holding),
      }));

      setTradeHoldings(normalizedHoldings);
      localStorage.setItem('auravest_trade_holdings', JSON.stringify(normalizedHoldings));
    } else {
      const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
      const reconstructedHoldingsMap = new Map<string, any>();

      [...transactions].reverse().forEach((tx: any) => {
        if (!tx?.asset || tx.asset === 'LOCAL') return;

        const existing = reconstructedHoldingsMap.get(tx.asset) || {
          id: `trade-holding-${tx.asset}`,
          name: tx.assetName || tx.asset,
          symbol: tx.asset,
          amount: 0,
          currentPrice: Number(tx.price || 0),
          currentValue: 0,
          change24h: 0,
          type: normalizeAssetClass(tx.assetClass),
          costBasis: 0,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          averagePrice: Number(tx.price || 0),
          currency: tx.currency || 'USD',
          quantityType: tx.quantityType || 'units',
          taxLots: [],
        };

        const txAmount = Number(tx.amount || 0);
        const txPrice = Number(tx.price || 0);

        if (tx.type === 'buy') {
          const nextAmount = existing.amount + txAmount;
          const nextCostBasis = existing.costBasis + (txAmount * txPrice);
          existing.amount = nextAmount;
          existing.costBasis = nextCostBasis;
          existing.averagePrice = nextAmount > 0 ? nextCostBasis / nextAmount : txPrice;
          existing.currentPrice = txPrice;
          existing.currentValue = nextAmount * txPrice;
          existing.type = normalizeAssetClass(tx.assetClass, existing);
          existing.currency = tx.currency || existing.currency;
          existing.quantityType = tx.quantityType || existing.quantityType;
          existing.taxLots = [
            ...(existing.taxLots || []),
            {
              date: tx.timestamp || new Date().toISOString(),
              amount: txAmount,
              price: txPrice,
              cost: txAmount * txPrice,
            },
          ];
        } else if (tx.type === 'sell') {
          const remainingAmount = Math.max(existing.amount - txAmount, 0);
          if (remainingAmount === 0) {
            existing.amount = 0;
            existing.costBasis = 0;
            existing.currentValue = 0;
          } else {
            const averagePrice = Number(existing.averagePrice || txPrice);
            existing.amount = remainingAmount;
            existing.costBasis = remainingAmount * averagePrice;
            existing.currentPrice = txPrice;
            existing.currentValue = remainingAmount * txPrice;
          }
        }

        const unrealizedPnL = existing.currentValue - existing.costBasis;
        existing.unrealizedPnL = unrealizedPnL;
        existing.unrealizedPnLPercent = existing.costBasis > 0 ? (unrealizedPnL / existing.costBasis) * 100 : 0;

        reconstructedHoldingsMap.set(tx.asset, existing);
      });

      const reconstructedHoldings = Array.from(reconstructedHoldingsMap.values()).filter((holding: any) => holding.amount > 0);

      if (reconstructedHoldings.length > 0) {
        setTradeHoldings(reconstructedHoldings);
        localStorage.setItem('auravest_trade_holdings', JSON.stringify(reconstructedHoldings));
      }
    }
  }, []);
  const isPositive = change24h >= 0;
  // Merge local investment positions into holdings display
  const localHoldings = localPositions.map((position: any) => ({
    id: position.id,
    name: position.name,
    symbol: 'LOCAL',
    currency: 'GHS',
    amount: 1,
    currentPrice: position.amount,
    currentValue: position.amount,
    change24h: 0.35,
    type: 'Local Investments',
    costBasis: position.amount,
    unrealizedPnL: 0,
    unrealizedPnLPercent: 0,
    taxLots: [
      {
        date: position.date,
        amount: 1,
        price: position.amount,
        cost: position.amount,
      },
    ],
  }));

  const tradedSymbols = new Set((tradeHoldings || []).map((holding: any) => holding.symbol));
  const baseHoldings = enhancedHoldings.filter((holding: any) => !tradedSymbols.has(holding.symbol));
  const holdings = [...localHoldings, ...tradeHoldings, ...baseHoldings];
  const filteredHoldings = holdings.filter((holding: any) => {
    if (holdingsFilter === 'all') return true;
    if (holdingsFilter === 'local') return holding.type === 'Local Investments' || holding.currency === 'GHS';
    if (holdingsFilter === 'nft') return (holding.type || '').toLowerCase() === 'nft';
    return (holding.type || '').toLowerCase() === holdingsFilter;
  });
  const formatHoldingCurrency = (holding: any, value: number) => {
    const isLocal = holding.type === 'Local Investments' || holding.currency === 'GHS';
    if (isLocal) {
      return `GHS ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatSignedHoldingCurrency = (holding: any, value: number) => {
    const absoluteValue = formatHoldingCurrency(holding, Math.abs(Number(value || 0)));
    return `${Number(value || 0) >= 0 ? '+' : '-'}${absoluteValue}`;
  };
  const holdingToTradeAsset = (holding: any) => ({
    id: holding.id || holding.symbol,
    name: holding.name,
    symbol: holding.symbol,
    price: Number(holding.currentPrice || 0),
    change24h: Number(holding.change24h || 0),
    currency: holding.currency || ((holding.type === 'Local Investments' || holding.currency === 'GHS') ? 'GHS' : 'USD'),
    exchange: holding.currency === 'GHS' ? 'GSE' : undefined,
    assetClass: holding.type,
    image: holding.currency === 'GHS' ? `/logos/gse/${holding.symbol}.png` : holding.image,
  });
  const resolveWatchlistType = (holding: any) => {
    const type = (holding?.type || '').toLowerCase();
    if (type === 'local investments' || holding?.currency === 'GHS') return 'stocks';
    if (type === 'nft') return 'nfts';
    return type || 'stocks';
  };
  const isHoldingInWatchlist = selectedHolding
    ? watchlist.some((item) => item.id === selectedHolding.symbol && item.type === resolveWatchlistType(selectedHolding))
    : false;
  const toggleHoldingWatchlist = () => {
    if (!selectedHolding) return;
    const watchlistType = resolveWatchlistType(selectedHolding);
    const watchlistId = selectedHolding.symbol;

    if (isHoldingInWatchlist) {
      removeFromWatchlist(watchlistId);
      setWatchlist((prev) => prev.filter((item) => !(item.id === watchlistId && item.type === watchlistType)));
    } else {
      addToWatchlist({ id: watchlistId, type: watchlistType });
      setWatchlist((prev) => [...prev, { id: watchlistId, type: watchlistType }]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Track and manage your investments</p>
      </div>

      <div className="gradient-primary rounded-xl p-6 text-white">
        <p className="text-sm opacity-90 mb-2">Total Portfolio Value</p>
        <div className="flex items-end gap-4 mb-2">
          <h2 className="text-4xl font-bold">{isPortfolioReady ? `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</h2>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4 text-green-300" /> : <TrendingDown className="w-4 h-4 text-red-300" />}
            <span className={`text-sm font-semibold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>{isPositive ? '+' : ''}{change24h}%</span>
          </div>
        </div>
        <p className={`text-sm font-medium ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
          {isPositive ? '+' : '-'}${Math.abs(changeAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} (24h)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Risk Assessment */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold">Risk Analysis</h3>
              </div>
              <button className="text-sm text-primary hover:underline">View Details</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold">{riskMetrics.score}/100</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    riskMetrics.level === 'High' ? 'bg-red-500/20 text-red-500' :
                    riskMetrics.level === 'Moderate' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {riskMetrics.level}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      riskMetrics.score > 70 ? 'bg-red-500' :
                      riskMetrics.score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${riskMetrics.score}%` }}
                  />
                </div>
              </div>
              <div className="text-right text-sm space-y-1">
                <div className="text-muted-foreground">Diversification</div>
                <div className="text-lg font-semibold">{riskMetrics.diversification}%</div>
              </div>
            </div>

            {/* Advanced Risk Metrics */}
            <div className="border-t border-border pt-4">
              <h4 className="font-medium mb-3">Advanced Metrics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">VaR (95%)</div>
                  <div className="font-semibold text-red-500">-${advancedRiskMetrics.valueAtRisk.daily.toFixed(2)} daily</div>
                  <div className="text-xs text-muted-foreground">-${advancedRiskMetrics.valueAtRisk.weekly.toFixed(2)} weekly</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Volatility</div>
                  <div className="font-semibold">{advancedRiskMetrics.volatility.portfolio.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Beta: {advancedRiskMetrics.volatility.beta.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Sharpe Ratio</div>
                  <div className="font-semibold">{advancedRiskMetrics.sharpeRatio.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Max Drawdown</div>
                  <div className="font-semibold text-red-500">-{advancedRiskMetrics.maxDrawdown.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Asset Allocation</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {assets.map((asset, idx) => {
                const colors = [
                  { bg: 'bg-purple-500', text: 'text-purple-500' },
                  { bg: 'bg-blue-500', text: 'text-blue-500' },
                  { bg: 'bg-yellow-500', text: 'text-yellow-500' },
                  { bg: 'bg-cyan-500', text: 'text-cyan-500' },
                ];
                return (
                  <div key={asset.type} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors[idx].bg}`} />
                      <span className="text-sm text-muted-foreground">{asset.type}</span>
                    </div>
                    <p className="text-xl font-bold">{asset.allocation}%</p>
                    <p className="text-sm text-muted-foreground">${(asset.value / 1000).toFixed(1)}K</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      {/* Portfolio Performance Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Portfolio Performance</h3>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-1">
              {['1M', '3M', '6M', '1Y', '3Y', '5Y', 'All'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    selectedPeriod === period
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showBenchmark}
                onChange={(e) => setShowBenchmark(e.target.checked)}
                className="rounded"
              />
              Compare to S&P 500
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{selectedPeriod} Performance</span>
          <span className="text-sm text-green-500 font-medium">+28.4% YTD</span>
        </div>
        <PortfolioChart data={chartData} />
      </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Holdings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Holdings</h3>
              <button className="text-sm text-primary hover:underline">View Details</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'all', label: 'All' },
                { id: 'stocks', label: 'Stocks' },
                { id: 'crypto', label: 'Crypto' },
                { id: 'gold', label: 'Gold' },
                { id: 'nft', label: 'NFT' },
                { id: 'local', label: 'Local' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setHoldingsFilter(item.id as any)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    holdingsFilter === item.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredHoldings.map((holding, idx) => {
                const isPositive = holding.change24h >= 0;
                const isPositivePnL = holding.unrealizedPnL >= 0;
                const isLocal = holding.type === 'Local Investments' || holding.currency === 'GHS';
                const quantityLabel = holding.quantityType === 'shares' ? 'shares' : 'units';
                const holdingStatus = (holding.status || 'filled').toLowerCase();
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-border bg-accent/30 p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setSelectedHolding(holding)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold">{holding.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{holding.symbol} • {holding.amount} {quantityLabel}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {holding.type}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${holdingStatus === 'queued' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20'}`}>
                            {holdingStatus.toUpperCase()}
                          </span>
                          {isLocal && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-magenta-500/10 text-magenta-600 border border-magenta-500/20">
                              Local Market
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {isLocal
                            ? `GHS ${holding.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                            : `$${(holding.currentValue / 1000).toFixed(1)}K`}
                        </p>
                        <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{holding.change24h.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md bg-background border border-border p-2">
                        <p className="text-muted-foreground">Cost Basis</p>
                        <p className="font-medium">
                          {isLocal
                            ? `GHS ${holding.costBasis.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                            : `$${(holding.costBasis / 1000).toFixed(1)}K`}
                        </p>
                      </div>
                      <div className="rounded-md bg-background border border-border p-2">
                        <p className="text-muted-foreground">Unrealized P&L</p>
                        <p className={`font-medium ${isPositivePnL ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositivePnL ? '+' : ''}
                          {isLocal
                            ? `GHS ${Math.abs(holding.unrealizedPnL).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                            : `$${(holding.unrealizedPnL / 1000).toFixed(1)}K`}
                        </p>
                      </div>
                      <div className="rounded-md bg-background border border-border p-2">
                        <p className="text-muted-foreground">P&L %</p>
                        <p className={`font-medium ${isPositivePnL ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositivePnL ? '+' : ''}{holding.unrealizedPnLPercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredHoldings.length === 0 && (
                <div className="col-span-full text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
                  No holdings in this category yet.
                </div>
              )}
            </div>
          </div>

          {/* Rebalancing */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Rebalancing Suggestions</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex justify-between text-sm">
                  <span>Crypto: 35.9%</span>
                  <span className="text-muted-foreground">30%</span>
                </div>
                <button className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 py-1 rounded w-full mt-1">
                  ↓ Sell $2,500
                </button>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex justify-between text-sm">
                  <span>Gold: 14.6%</span>
                  <span className="text-muted-foreground">15%</span>
                </div>
                <button className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-500 px-2 py-1 rounded w-full mt-1">
                  ↑ Buy $150
                </button>
              </div>
            <button
              onClick={() => setShowRebalancingWizard(true)}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium"
            >
              Apply Rebalancing
            </button>
            </div>
          </div>

          {/* DCA Plans */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Recurring Investments</h3>
            </div>
            <div className="space-y-2">
              {dcaPlans.map((plan, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-border">
                  <div className="flex justify-between">
                    <div className="text-sm">
                      <p className="font-medium">${plan.amount} in {plan.asset}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.frequency} • Next: {new Date(plan.nextExecution).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs">Active</span>
                  </div>
                </div>
              ))}
              <button className="w-full py-2 border border-dashed border-border rounded-lg text-muted-foreground text-sm">
                + Add Recurring Investment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Attribution & Goals Planning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Attribution */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Performance Attribution</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Total Return</span>
              <span className="font-semibold text-green-500">+{performanceAttribution.totalReturn}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Benchmark Return</span>
              <span className="text-muted-foreground">+{performanceAttribution.benchmarkReturn}%</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span>Excess Return</span>
              <span className="font-semibold text-green-500">+{performanceAttribution.excessReturn}%</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Asset Alloc: +{performanceAttribution.attribution.assetAllocation}% |
              Security Sel: +{performanceAttribution.attribution.securitySelection}%
            </div>
          </div>
        </div>

        {/* Goals Planning */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">Goals Planning</h3>
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{monteCarloData.results.successRate}%</div>
              <div className="text-xs text-muted-foreground">Chance of reaching ${monteCarloData.targetAmount.toLocaleString()}</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Median</span>
                <span>${monteCarloData.results.median.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>10th Percentile</span>
                <span>${monteCarloData.results.percentile10.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>90th Percentile</span>
                <span>${monteCarloData.results.percentile90.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => setShowGoalsPlanning(true)}
              className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg text-sm font-medium"
            >
              View Monte Carlo Analysis
            </button>
          </div>
        </div>

        {/* Tax Optimization */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Tax Optimization</h3>
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">${taxOptimization.potentialSavings.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Potential tax savings</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Harvestable Losses</span>
                <span className="text-red-500">-${taxOptimization.harvestableLosses.toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {taxOptimization.opportunities.length} tax-loss harvesting opportunities available
              </div>
            </div>
            <button
              onClick={() => setShowTaxOptimization(true)}
              className="w-full py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-sm font-medium"
            >
              Optimize Taxes
            </button>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Export Data</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            className="p-3 border border-border rounded-lg hover:bg-accent flex flex-col items-center"
            onClick={() => {
              const url = exportTransactionsCSV();
              if (url) {
                const link = document.createElement('a');
                link.href = url;
                link.download = `auravest-transactions-${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
              } else {
                alert('No transactions to export');
              }
            }}
          >
            <FileText className="w-5 h-5 mb-1" />
            <span className="text-sm text-center">Export CSV</span>
          </button>
          <button
            className="p-3 border border-border rounded-lg hover:bg-accent flex flex-col items-center"
            onClick={() => alert('Tax report PDF generated and emailed')}
          >
            <FileText className="w-5 h-5 mb-1" />
            <span className="text-sm text-center">Tax Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <RebalancingWizard
        isOpen={showRebalancingWizard}
        onClose={() => setShowRebalancingWizard(false)}
        currentAllocations={assets}
        targetAllocations={[
          { type: 'Crypto', target: 30 },
          { type: 'Stocks', target: 40 },
          { type: 'Gold', target: 20 },
          { type: 'NFTs', target: 10 }
        ]}
      />

      <TaxOptimizationModal
        isOpen={showTaxOptimization}
        onClose={() => setShowTaxOptimization(false)}
      />

      <GoalsPlanningModal
        isOpen={showGoalsPlanning}
        onClose={() => setShowGoalsPlanning(false)}
      />

      {selectedHolding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedHolding(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedHolding.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{selectedHolding.symbol}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {selectedHolding.type}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${((selectedHolding.status || 'filled').toLowerCase() === 'queued') ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20'}`}>
                    {(selectedHolding.status || 'filled').toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedHolding(null)} className="px-2 py-1 text-sm rounded-md border border-border hover:bg-accent">
                Close
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    setTradeModal({ asset: holdingToTradeAsset(selectedHolding), type: 'buy' });
                    setSelectedHolding(null);
                  }}
                  className="px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <ArrowDownRight className="w-4 h-4" /> Buy More
                </button>
                <button
                  onClick={() => {
                    setTradeModal({ asset: holdingToTradeAsset(selectedHolding), type: 'sell' });
                    setSelectedHolding(null);
                  }}
                  className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" /> Sell
                </button>
                <button
                  onClick={() => {
                    setAlertModal(holdingToTradeAsset(selectedHolding));
                    setSelectedHolding(null);
                  }}
                  className="px-3 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-accent flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" /> Set Alert
                </button>
                <button
                  onClick={toggleHoldingWatchlist}
                  className="px-3 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-accent flex items-center justify-center gap-2"
                >
                  <Star className={`w-4 h-4 ${isHoldingInWatchlist ? 'fill-current text-yellow-500' : ''}`} />
                  {isHoldingInWatchlist ? 'In Watchlist' : 'Add Watchlist'}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3 bg-background">
                  <p className="text-muted-foreground text-xs">Position Size</p>
                  <p className="font-semibold mt-1">{Number(selectedHolding.amount || 0).toLocaleString()} {selectedHolding.quantityType === 'shares' ? 'shares' : 'units'}</p>
                </div>
                <div className="rounded-lg border border-border p-3 bg-background">
                  <p className="text-muted-foreground text-xs">Avg Cost</p>
                  <p className="font-semibold mt-1">{formatHoldingCurrency(selectedHolding, Number(selectedHolding.costBasis || 0) / Math.max(Number(selectedHolding.amount || 1), 1))}</p>
                </div>
                <div className="rounded-lg border border-border p-3 bg-background">
                  <p className="text-muted-foreground text-xs">Current Price</p>
                  <p className="font-semibold mt-1">{formatHoldingCurrency(selectedHolding, Number(selectedHolding.currentPrice || 0))}</p>
                </div>
                <div className="rounded-lg border border-border p-3 bg-background">
                  <p className="text-muted-foreground text-xs">24h Change</p>
                  <p className={`font-semibold mt-1 ${Number(selectedHolding.change24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Number(selectedHolding.change24h || 0) >= 0 ? '+' : ''}{Number(selectedHolding.change24h || 0).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3 bg-background">
                  <p className="text-muted-foreground text-xs">Market Value</p>
                  <p className="text-lg font-bold mt-1">{formatHoldingCurrency(selectedHolding, Number(selectedHolding.currentValue || 0))}</p>
                </div>
                <div className="rounded-lg border border-border p-3 bg-background">
                  <p className="text-muted-foreground text-xs">Cost Basis</p>
                  <p className="text-lg font-bold mt-1">{formatHoldingCurrency(selectedHolding, Number(selectedHolding.costBasis || 0))}</p>
                </div>
                <div className="rounded-lg border border-border p-3 bg-background">
                  <p className="text-muted-foreground text-xs">Unrealized P&L</p>
                  <p className={`text-lg font-bold mt-1 ${Number(selectedHolding.unrealizedPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatSignedHoldingCurrency(selectedHolding, Number(selectedHolding.unrealizedPnL || 0))}
                  </p>
                  <p className={`text-xs mt-1 ${Number(selectedHolding.unrealizedPnLPercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Number(selectedHolding.unrealizedPnLPercent || 0) >= 0 ? '+' : ''}{Number(selectedHolding.unrealizedPnLPercent || 0).toFixed(2)}%
                  </p>
                </div>
              </div>

              {Array.isArray(selectedHolding.taxLots) && selectedHolding.taxLots.length > 0 && (
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold mb-3">Position Lots</h4>
                  <div className="space-y-2">
                    {selectedHolding.taxLots.slice(0, 5).map((lot: any, index: number) => (
                      <div key={index} className="grid grid-cols-4 gap-2 text-xs rounded-md border border-border p-2 bg-background">
                        <span className="text-muted-foreground">{new Date(lot.date).toLocaleDateString()}</span>
                        <span>{Number(lot.amount || 0).toLocaleString()} {selectedHolding.quantityType === 'shares' ? 'shares' : 'units'}</span>
                        <span>{formatHoldingCurrency(selectedHolding, Number(lot.price || 0))}</span>
                        <span className="font-medium">{formatHoldingCurrency(selectedHolding, Number(lot.cost || 0))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tradeModal && (
        <TradeModal
          asset={tradeModal.asset}
          initialType={tradeModal.type}
          onClose={() => {
            setTradeModal(null);
            refreshTradeHoldings();
          }}
        />
      )}

      {alertModal && (
        <PriceAlertModal
          asset={alertModal}
          onClose={() => setAlertModal(null)}
        />
      )}
    </div>
  );
}
