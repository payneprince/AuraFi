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
import { getPortfolio, exportTransactionsCSV, getWatchlist, addToWatchlist, removeFromWatchlist, getDCAPlans, createDCAPlan } from '@/lib/mockAPI';
import { loadCrypto, loadStocks, getGoldList } from '@/lib/marketData';
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
  X,
  CheckCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import PortfolioChart from '@/components/PortfolioChart';
import { chartData } from '@/lib/mockData';
import RebalancingWizard from '@/components/RebalancingWizard';
import TaxOptimizationModal from '@/components/TaxOptimizationModal';
import GoalsPlanningModal from '@/components/GoalsPlanningModal';
import TradeModal from '@/components/TradeModal';
import PriceAlertModal from '@/components/PriceAlertModal';

type FundingEntry = {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  note?: string;
  method?: string;
  status?: string;
  timestamp?: string;
};

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
  const [activeTab, setActiveTab] = useState('overview');
  const [exportNotice, setExportNotice] = useState<{ message: string; tone: 'success' | 'info' } | null>(null);
  const [showRebalancingWizard, setShowRebalancingWizard] = useState(false);
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [showTaxOptimization, setShowTaxOptimization] = useState(false);
  const [showGoalsPlanning, setShowGoalsPlanning] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<any | null>(null);
  const [holdingsFilter, setHoldingsFilter] = useState<'all' | 'stocks' | 'crypto' | 'gold' | 'nft' | 'local' | 'cash'>('all');
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [tradeModal, setTradeModal] = useState<any>(null);
  const [alertModal, setAlertModal] = useState<any>(null);
  const [cashBalance, setCashBalance] = useState(0);
  const [netTradeCashflow, setNetTradeCashflow] = useState(0);
  const [fundingAction, setFundingAction] = useState<'deposit' | 'withdrawal'>('deposit');
  const [fundingAmount, setFundingAmount] = useState('');
  const [fundingNote, setFundingNote] = useState('');
  const [fundingRail, setFundingRail] = useState('AuraBank');
  const [isFunding, setIsFunding] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [fundingSuccess, setFundingSuccess] = useState<string | null>(null);
  const [recentFundingEntries, setRecentFundingEntries] = useState<FundingEntry[]>([]);
  const [fundingNet30d, setFundingNet30d] = useState(0);
  const [lastFundingEntry, setLastFundingEntry] = useState<FundingEntry | null>(null);
  const [dcaPlansList, setDcaPlansList] = useState<any[]>(dcaPlans);
  const [showDCAModal, setShowDCAModal] = useState(false);
  const [dcaSuccess, setDcaSuccess] = useState(false);
  const [dcaAmount, setDcaAmount] = useState('100');
  const [dcaFrequency, setDcaFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dcaAssetOptions, setDcaAssetOptions] = useState<any[]>([]);
  const [dcaSelectedAsset, setDcaSelectedAsset] = useState<any>(null);
  const holdingsValue = Number(Math.max(totalValue - cashBalance, 0).toFixed(2));

  const refreshCapitalMetrics = () => {
    const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    const cash = Number(localStorage.getItem('auravest_cash_balance') || '0');

    const netCashflow = (transactions || []).reduce((sum: number, tx: any) => {
      const status = String(tx?.status || '').toLowerCase();
      if (status && status !== 'filled' && status !== 'completed') return sum;

      const type = String(tx?.type || '').toLowerCase();
      const amount = Number(tx?.amount || 0);
      const price = Number(tx?.price || 0);
      const inferredGross = amount * price;
      const gross = Number.isFinite(Number(tx?.gross)) ? Number(tx.gross) : inferredGross;
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

    const fundingEntries = (transactions || [])
      .filter((tx: any) => {
        const type = String(tx?.type || '').toLowerCase();
        const status = String(tx?.status || '').toLowerCase();
        const isFundingType = type === 'deposit' || type === 'withdrawal';
        return isFundingType && (!status || status === 'filled' || status === 'completed');
      })
      .map((tx: any) => ({
        id: String(tx?.id || Date.now()),
        type: String(tx?.type || 'deposit') as 'deposit' | 'withdrawal',
        amount: Number(tx?.amount || tx?.total || 0),
        note: String(tx?.note || ''),
        method: String(tx?.method || 'AuraBank'),
        status: String(tx?.status || 'completed'),
        timestamp: String(tx?.timestamp || tx?.date || new Date().toISOString()),
      }))
      .sort((a: FundingEntry, b: FundingEntry) => Date.parse(b.timestamp || '') - Date.parse(a.timestamp || ''));

    setRecentFundingEntries(fundingEntries.slice(0, 5));
    setLastFundingEntry(fundingEntries.length > 0 ? fundingEntries[0] : null);

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const net30 = fundingEntries.reduce((sum: number, entry: FundingEntry) => {
      const timestamp = Date.parse(String(entry.timestamp || ''));
      if (Number.isNaN(timestamp) || timestamp < thirtyDaysAgo) return sum;
      return sum + (entry.type === 'deposit' ? entry.amount : -entry.amount);
    }, 0);
    setFundingNet30d(Number(net30.toFixed(2)));
  };

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

  const buildRepresentativeHoldingsFromAssets = (portfolioAssets: any[]) => {
    const actualTemplates = enhancedHoldings;
    const templateIdsByAssetType: Record<string, string[]> = {
      Crypto: ['btc-1', 'eth-1'],
      Stocks: ['aapl-1', 'msft-1'],
      Gold: ['gold-1'],
      NFTs: ['bayc-1'],
      'Local Investments': ['local-tbill-seed-1'],
    };

    return portfolioAssets.flatMap((asset: any) => {
      const assetType = String(asset?.type || 'Asset');
      const assetValue = Number(asset?.value || 0);
      if (!Number.isFinite(assetValue) || assetValue <= 0 || assetType.toLowerCase() === 'cash') {
        return [];
      }

      const matchingTemplateIds = templateIdsByAssetType[assetType] || [];
      const matchingTemplates = matchingTemplateIds.length > 0
        ? actualTemplates.filter((holding: any) => matchingTemplateIds.includes(String(holding?.id || '')))
        : actualTemplates.filter((holding: any) => String(holding?.type || '') === assetType);
      if (matchingTemplates.length === 0) {
        return [{
          id: `portfolio-asset-${assetType.toLowerCase()}`,
          name: assetType,
          symbol: assetType.toUpperCase(),
          amount: 1,
          currentPrice: assetValue,
          currentValue: assetValue,
          change24h: 0,
          type: assetType,
          costBasis: assetValue,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          quantityType: 'units',
          status: 'completed',
          taxLots: [],
        }];
      }

      const templateTotal = matchingTemplates.reduce((sum: number, holding: any) => sum + Number(holding?.currentValue || 0), 0) || 1;

      return matchingTemplates.map((holding: any, index: number) => {
        const isLast = index === matchingTemplates.length - 1;
        const allocatedBefore = matchingTemplates
          .slice(0, index)
          .reduce((sum: number, entry: any) => sum + Number(((Number(entry?.currentValue || 0) / templateTotal) * assetValue).toFixed(2)), 0);
        const currentValue = isLast
          ? Number((assetValue - allocatedBefore).toFixed(2))
          : Number((((Number(holding?.currentValue || 0) / templateTotal) * assetValue)).toFixed(2));
        const templateCurrentValue = Number(holding?.currentValue || 1) || 1;
        const scale = currentValue / templateCurrentValue;
        const currentPrice = Number(holding?.currentPrice || currentValue || 1);
        const amount = Number(((Number(holding?.amount || 1) * scale) || 1).toFixed(4));
        const costBasis = Number(((Number(holding?.costBasis || templateCurrentValue) * scale)).toFixed(2));
        const unrealizedPnL = Number((currentValue - costBasis).toFixed(2));
        const unrealizedPnLPercent = costBasis > 0 ? Number(((unrealizedPnL / costBasis) * 100).toFixed(2)) : 0;

        return {
          ...holding,
          id: `portfolio-template-${holding.id}-${assetType.toLowerCase()}`,
          amount,
          currentPrice,
          currentValue,
          costBasis,
          unrealizedPnL,
          unrealizedPnLPercent,
          quantityType: holding?.quantityType || (assetType === 'Stocks' ? 'shares' : 'units'),
          status: 'completed',
        };
      });
    });
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
    setDcaPlansList(getDCAPlans());

    Promise.all([loadCrypto(), loadStocks(), getGoldList()]).then(([crypto, stocks, gold]) => {
      const goldAsset = Array.isArray(gold) ? gold[0] : gold;
      const options = [...crypto.slice(0, 12), ...stocks.slice(0, 12), ...(goldAsset ? [goldAsset] : [])];
      setDcaAssetOptions(options);
      setDcaSelectedAsset((prev: any) => prev ?? options[0] ?? null);
    }).catch(() => {});

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

    refreshCapitalMetrics();

    const metricsInterval = setInterval(() => {
      refreshCapitalMetrics();
    }, 2000);

    return () => clearInterval(metricsInterval);
  }, []);
  const isPositive = change24h >= 0;
  const allocationAssets: any[] = Array.isArray(assets) ? assets : [];
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
  const hasUserPortfolioActivity = (() => {
    try {
      const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
      return Array.isArray(transactions) && transactions.length > 0;
    } catch {
      return false;
    }
  })();
  const isDemoUser = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('auravest_user') || '{}');
      return String(u?.id || '1') === '1';
    } catch { return true; }
  })();
  const synthesizedPortfolioHoldings = buildRepresentativeHoldingsFromAssets(Array.isArray(assets) ? assets : []);
  const holdings = hasUserPortfolioActivity
    ? [...localHoldings, ...tradeHoldings, ...(tradeHoldings.length === 0 && localHoldings.length === 0 ? synthesizedPortfolioHoldings : [])]
    : isDemoUser
      ? [...localHoldings, ...tradeHoldings, ...baseHoldings]
      : [...localHoldings, ...tradeHoldings];
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

  const handleFundingSubmit = async () => {
    setFundingError(null);
    setFundingSuccess(null);
    const normalizedAmount = Number(fundingAmount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      setFundingError('Enter a valid amount greater than 0.');
      return;
    }

    if (fundingAction === 'withdrawal' && normalizedAmount > cashBalance) {
      setFundingError(`Insufficient cash for withdrawal. Available: $${cashBalance.toFixed(2)}.`);
      return;
    }

    setIsFunding(true);
    try {
      const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
      transactions.unshift({
        id: `fund-${Date.now()}`,
        type: fundingAction,
        asset: 'CASH',
        assetName: fundingAction === 'deposit' ? 'Cash Deposit' : 'Cash Withdrawal',
        amount: Number(normalizedAmount.toFixed(2)),
        price: 1,
        gross: Number(normalizedAmount.toFixed(2)),
        fee: 0,
        total: Number(normalizedAmount.toFixed(2)),
        currency: 'USD',
        quantityType: 'units',
        method: fundingRail,
        note: fundingNote.trim(),
        status: 'completed',
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('auravest_transactions', JSON.stringify(transactions));

      const latestPortfolio = await getPortfolio();
      if (latestPortfolio && Object.keys(latestPortfolio).length > 0) {
        setPortfolio(latestPortfolio);
      }
      refreshTradeHoldings();
      refreshCapitalMetrics();
      setFundingSuccess(`${fundingAction === 'deposit' ? 'Deposit' : 'Withdrawal'} of $${normalizedAmount.toFixed(2)} completed.`);
      setFundingAmount('');
      setFundingNote('');
    } catch (error) {
      console.error('Failed to apply funding action:', error);
      setFundingError('Funding action failed. Please try again.');
    } finally {
      setIsFunding(false);
    }
  };

  // Target allocations for rebalancing — kept in sync with RebalancingWizard's targetAllocations below
  const REBALANCE_TARGETS: Record<string, number> = { Crypto: 30, Stocks: 40, Gold: 20, NFTs: 10 };
  const ASSET_VISUALS: Record<string, { imgSrc: string; color: string }> = {
    Crypto: { imgSrc: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/btc.svg', color: '#f97316' },
    Stocks: { imgSrc: '/logos/markets/nasdaq.png', color: '#3b82f6' },
    Gold: { imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Gold_nugget_%28placer_gold%29_%28295095076%29.jpg/320px-Gold_nugget_%28placer_gold%29_%28295095076%29.jpg', color: '#eab308' },
    NFTs: { imgSrc: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/eth.svg', color: '#8b5cf6' },
  };
  const REBALANCE_REASON_THRESHOLD = 2; // percentage points of deviation worth flagging

  const rebalanceSuggestions = (Array.isArray(assets) ? assets : [])
    .filter((a: any) => REBALANCE_TARGETS[a.type] !== undefined)
    .map((a: any) => {
      const target = REBALANCE_TARGETS[a.type];
      const current = Number(a.allocation || 0);
      const diff = Number((current - target).toFixed(1));
      const dollarAmount = Math.abs(diff) / 100 * totalValue;
      return {
        type: a.type as string,
        current,
        target,
        diff,
        action: diff > 0 ? 'sell' as const : 'buy' as const,
        amount: dollarAmount,
        visual: ASSET_VISUALS[a.type] || { imgSrc: '', color: '#888' },
      };
    })
    .filter((s) => Math.abs(s.diff) >= REBALANCE_REASON_THRESHOLD && s.amount >= 1)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3);

  const findHoldingForType = (type: string) => {
    const matches = (Array.isArray(holdings) ? holdings : []).filter((h: any) => h?.type === type);
    if (matches.length === 0) return null;
    return matches.reduce((best: any, h: any) => (Number(h?.currentValue || 0) > Number(best?.currentValue || 0) ? h : best), matches[0]);
  };

  const handleRebalanceAction = (suggestion: { type: string; action: 'buy' | 'sell' }) => {
    const holding = findHoldingForType(suggestion.type);
    if (holding) {
      setTradeModal({ asset: holdingToTradeAsset(holding), type: suggestion.action });
    } else {
      setShowRebalancingWizard(true);
    }
  };

  const handleCreateDcaPlan = () => {
    if (!dcaSelectedAsset) return;
    createDCAPlan({
      asset: dcaSelectedAsset.symbol,
      assetName: dcaSelectedAsset.name,
      amount: Number(dcaAmount) || 0,
      frequency: dcaFrequency,
      nextExecution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    setDcaPlansList(getDCAPlans());
    setDcaSuccess(true);
  };

  const closeDcaModal = () => {
    setShowDCAModal(false);
    setDcaSuccess(false);
    setDcaAmount('100');
    setDcaFrequency('weekly');
  };

  const showExportNotice = (message: string, tone: 'success' | 'info') => {
    setExportNotice({ message, tone });
    setTimeout(() => setExportNotice(null), 3000);
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
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2">
            <p className="opacity-80">Holdings Value</p>
            <p className="font-semibold">${holdingsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2">
            <p className="opacity-80">Cash Balance</p>
            <p className="font-semibold">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2">
            <p className="opacity-80">Net Trade Cashflow</p>
            <p className={`font-semibold ${netTradeCashflow >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {netTradeCashflow >= 0 ? '+' : '-'}${Math.abs(netTradeCashflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/80">Total Portfolio = Holdings Value + Cash Balance</p>
      </div>

      {/* ── Funding Ledger — compact redesign ─────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Top accent bar that shifts green/red */}
        <div
          className={`h-0.5 w-full transition-all duration-500 ${
            fundingAction === 'deposit'
              ? 'bg-gradient-to-r from-green-500/80 via-emerald-400/60 to-transparent'
              : 'bg-gradient-to-r from-red-500/80 via-rose-400/60 to-transparent'
          }`}
        />

        <div className="p-4">
          {/* Header row: title + toggle */}
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm">Funding Ledger</p>

            {/* Pill toggle */}
            <div className="relative flex items-center bg-muted rounded-full p-0.5 text-xs font-semibold">
              <div
                className={`absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ${
                  fundingAction === 'deposit'
                    ? 'left-0.5 right-[calc(50%+1px)] bg-green-500 shadow-md shadow-green-500/30'
                    : 'left-[calc(50%+1px)] right-0.5 bg-red-500 shadow-md shadow-red-500/30'
                }`}
              />
              <button onClick={() => setFundingAction('deposit')} className={`relative z-10 px-3.5 py-1 rounded-full transition-colors ${fundingAction === 'deposit' ? 'text-white' : 'text-muted-foreground'}`}>
                Deposit
              </button>
              <button onClick={() => setFundingAction('withdrawal')} className={`relative z-10 px-3.5 py-1 rounded-full transition-colors ${fundingAction === 'withdrawal' ? 'text-white' : 'text-muted-foreground'}`}>
                Withdraw
              </button>
            </div>
          </div>

          {/* Stat pills row */}
          <div className="flex gap-2 mb-3">
            {[
              { label: 'Available', value: `$${cashBalance.toFixed(2)}`, color: 'text-foreground' },
              { label: 'Net 30D', value: `${fundingNet30d >= 0 ? '+' : '-'}$${Math.abs(fundingNet30d).toFixed(2)}`, color: fundingNet30d >= 0 ? 'text-green-500' : 'text-red-500' },
              { label: 'Last', value: lastFundingEntry ? `${lastFundingEntry.type === 'deposit' ? '+' : '-'}$${Number(lastFundingEntry.amount || 0).toFixed(2)}` : '—', color: lastFundingEntry ? (lastFundingEntry.type === 'deposit' ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground' },
            ].map((m) => (
              <div key={m.label} className="flex-1 bg-muted/60 rounded-lg px-2.5 py-1.5 min-w-0">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">{m.label}</p>
                <p className={`text-xs font-bold truncate ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Input + controls row — all inline */}
          <div className="flex gap-2 mb-2.5">
            {/* Amount */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm pointer-events-none">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-7 pr-3 py-2 text-sm font-semibold rounded-xl border bg-background focus:outline-none transition-all duration-200 placeholder:text-muted-foreground/30 ${
                  fundingAction === 'deposit'
                    ? 'border-border focus:border-green-500/50 focus:ring-2 focus:ring-green-500/15'
                    : 'border-border focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15'
                }`}
              />
            </div>
            {/* Rail */}
            <select
              value={fundingRail}
              onChange={(e) => setFundingRail(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-0 w-32"
            >
              {(fundingAction === 'deposit'
                ? ['AuraBank', 'Mobile Money', 'External Bank']
                : ['AuraBank', 'Mobile Money']
              ).map((rail) => <option key={rail} value={rail}>{rail}</option>)}
            </select>
          </div>

          {/* Note + submit row */}
          <div className="flex gap-2 mb-2.5">
            <input
              type="text"
              value={fundingNote}
              onChange={(e) => setFundingNote(e.target.value)}
              placeholder="Note (optional)"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleFundingSubmit}
              disabled={isFunding}
              className={`px-5 py-2 rounded-xl font-bold text-xs text-white transition-all duration-200 active:scale-95 disabled:opacity-60 flex-shrink-0 ${
                fundingAction === 'deposit'
                  ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/25'
                  : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25'
              }`}
            >
              {isFunding
                ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Wait</span>
                : fundingAction === 'deposit' ? '+ Fund' : '− Pull'
              }
            </button>
          </div>

          {/* Feedback */}
          {(fundingError || fundingSuccess) && (
            <div className={`rounded-xl px-3 py-1.5 text-xs mb-2 flex items-center gap-2 transition-all ${
              fundingError
                ? 'bg-red-500/10 border border-red-500/20 text-red-600'
                : 'bg-green-500/10 border border-green-500/20 text-green-600'
            }`}>
              <span>{fundingError ? '✗' : '✓'}</span>
              {fundingError || fundingSuccess}
            </div>
          )}
        </div>

        {/* Recent activity — borderless inner table */}
        {recentFundingEntries.length > 0 && (
          <div className="border-t border-border/60 px-4 pb-3">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest py-2">Recent</p>
            <div className="space-y-0.5 max-h-28 overflow-y-auto">
              {recentFundingEntries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors duration-100 cursor-default"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.type === 'deposit' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-muted-foreground truncate">
                      {entry.type === 'deposit' ? 'Deposit' : 'Withdraw'} · {entry.method || 'AuraBank'}
                      {entry.note ? ` · ${entry.note}` : ''}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold flex-shrink-0 ml-3 ${entry.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                    {entry.type === 'deposit' ? '+' : '-'}${Number(entry.amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Allocation + Holdings — unified section ─────────────────── */}
      {(() => {
        const ALLOC_CONFIG = [
          {
            key: 'crypto' as const,
            label: 'Crypto',
            imgSrc: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/btc.svg',
            gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
            activeBg: 'from-orange-500/30 via-amber-500/15 to-transparent',
            border: 'border-orange-500/25',
            activeBorder: 'border-orange-500/70',
            glow: '0 8px 32px rgba(249,115,22,0.25)',
            textColor: '#f97316',
            barHex: '#f97316',
            ringColor: 'ring-orange-500/40',
          },
          {
            key: 'stocks' as const,
            label: 'Stocks',
            imgSrc: '/logos/markets/nasdaq.png',
            gradient: 'from-blue-500/20 via-sky-500/10 to-transparent',
            activeBg: 'from-blue-500/30 via-sky-500/15 to-transparent',
            border: 'border-blue-500/25',
            activeBorder: 'border-blue-500/70',
            glow: '0 8px 32px rgba(59,130,246,0.25)',
            textColor: '#3b82f6',
            barHex: '#3b82f6',
            ringColor: 'ring-blue-500/40',
          },
          {
            key: 'gold' as const,
            label: 'Gold',
            imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Gold_nugget_%28placer_gold%29_%28295095076%29.jpg/320px-Gold_nugget_%28placer_gold%29_%28295095076%29.jpg',
            gradient: 'from-yellow-500/20 via-amber-400/10 to-transparent',
            activeBg: 'from-yellow-500/30 via-amber-400/15 to-transparent',
            border: 'border-yellow-500/25',
            activeBorder: 'border-yellow-500/70',
            glow: '0 8px 32px rgba(234,179,8,0.25)',
            textColor: '#eab308',
            barHex: '#eab308',
            ringColor: 'ring-yellow-500/40',
          },
          {
            key: 'nft' as const,
            label: 'NFTs',
            imgSrc: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/eth.svg',
            gradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
            activeBg: 'from-purple-500/30 via-violet-500/15 to-transparent',
            border: 'border-purple-500/25',
            activeBorder: 'border-purple-500/70',
            glow: '0 8px 32px rgba(139,92,246,0.25)',
            textColor: '#8b5cf6',
            barHex: '#8b5cf6',
            ringColor: 'ring-purple-500/40',
          },
          {
            key: 'cash' as const,
            label: 'Cash',
            imgSrc: '/logos/cash/usd.svg',
            gradient: 'from-green-500/20 via-emerald-500/10 to-transparent',
            activeBg: 'from-green-500/30 via-emerald-500/15 to-transparent',
            border: 'border-green-500/25',
            activeBorder: 'border-green-500/70',
            glow: '0 8px 32px rgba(34,197,94,0.25)',
            textColor: '#22c55e',
            barHex: '#22c55e',
            ringColor: 'ring-green-500/40',
          },
          {
            key: 'local' as const,
            label: 'Local Investments',
            imgSrc: '/logos/gse/gse.png',
            gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
            activeBg: 'from-rose-500/30 via-pink-500/15 to-transparent',
            border: 'border-rose-500/25',
            activeBorder: 'border-rose-500/70',
            glow: '0 8px 32px rgba(244,63,94,0.25)',
            textColor: '#f43f5e',
            barHex: '#f43f5e',
            ringColor: 'ring-rose-500/40',
          },
        ];

        const ASSET_TYPE_TO_ALLOC_KEY: Record<string, string> = {
          Crypto: 'crypto',
          Stocks: 'stocks',
          Gold: 'gold',
          NFTs: 'nft',
          NFT: 'nft',
          Cash: 'cash',
          'Local Investments': 'local',
        };

        const getAllocConfig = (assetType: string) =>
          ALLOC_CONFIG.find((c) => c.key === ASSET_TYPE_TO_ALLOC_KEY[assetType]) ?? ALLOC_CONFIG[0];

        return (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">

            {/* ── Allocation header ── */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Asset Allocation</h3>
                  <span className="text-xs text-muted-foreground ml-1">· click a card to drill into holdings</span>
                </div>
                {holdingsFilter !== 'all' && (
                  <button
                    onClick={() => setHoldingsFilter('all')}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              {/* Animated stacked bar */}
              <div className="flex h-2.5 rounded-full overflow-hidden mb-6">
                {allocationAssets.map((asset: any, idx: number) => {
                  const cfg = getAllocConfig(asset.type);
                  const isActive = holdingsFilter === cfg.key || holdingsFilter === 'all';
                  return (
                    <div
                      key={asset.type}
                      className="transition-all duration-500 cursor-pointer hover:brightness-125"
                      style={{
                        width: `${asset.allocation}%`,
                        background: cfg.barHex,
                        opacity: isActive ? 1 : 0.3,
                      }}
                      title={`${asset.type}: ${asset.allocation}%`}
                      onClick={() => setHoldingsFilter(holdingsFilter === cfg.key ? 'all' : cfg.key)}
                    />
                  );
                })}
              </div>

              {/* 4 Allocation cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pb-6">
                {allocationAssets.map((asset: any, idx: number) => {
                  const cfg = getAllocConfig(asset.type);
                  const isSelected = holdingsFilter === cfg.key;
                  const isDimmed = holdingsFilter !== 'all' && !isSelected;

                  return (
                    <button
                      key={asset.type}
                      type="button"
                      onClick={() => setHoldingsFilter(isSelected ? 'all' : cfg.key)}
                      className={`relative overflow-hidden rounded-xl border text-left transition-all duration-300 group ${
                        isSelected
                          ? `${cfg.activeBorder} ring-2 ${cfg.ringColor}`
                          : `${cfg.border} hover:border-opacity-60`
                      } ${isDimmed ? 'opacity-40 scale-[0.97]' : 'opacity-100 scale-100'}`}
                      style={{
                        boxShadow: isSelected ? cfg.glow : undefined,
                        transitionDelay: `${idx * 60}ms`,
                      }}
                    >
                      {/* Gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${isSelected ? cfg.activeBg : cfg.gradient} transition-all duration-300`} />

                      {/* Asset image — large watermark in bottom-right */}
                      <div className="absolute bottom-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity duration-300 translate-x-4 translate-y-4">
                        <img
                          src={cfg.imgSrc}
                          alt={cfg.label}
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>

                      {/* Content */}
                      <div className="relative p-4">
                        {/* Label row */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.barHex }} />
                          <span className="text-xs font-medium text-muted-foreground">{asset.type}</span>
                          {isSelected && (
                            <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: cfg.barHex }}>
                              ✓
                            </span>
                          )}
                        </div>

                        {/* Big % */}
                        <p
                          className="text-3xl font-black leading-none mb-1 transition-all duration-300 group-hover:scale-105 origin-left"
                          style={{ color: cfg.textColor }}
                        >
                          {asset.allocation}%
                        </p>

                        {/* Value */}
                        <p className="text-sm font-medium text-muted-foreground">
                          ${(asset.value / 1000).toFixed(1)}K
                        </p>

                        {/* Mini bar */}
                        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${asset.allocation}%`, background: cfg.barHex }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Holdings divider ── */}
            <div className="border-t border-border" />

            {/* ── Holdings section ── */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Holdings</h3>
                  {holdingsFilter !== 'all' && (
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-semibold text-white"
                      style={{ background: ALLOC_CONFIG.find(c => c.key === holdingsFilter)?.barHex ?? '#888' }}
                    >
                      {ALLOC_CONFIG.find(c => c.key === holdingsFilter)?.label}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {(['all', 'stocks', 'crypto', 'gold', 'nft', 'local'] as const).map((id) => {
                    const cfg = ALLOC_CONFIG.find(c => c.key === id);
                    return (
                      <button
                        key={id}
                        onClick={() => setHoldingsFilter(id)}
                        className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                          holdingsFilter === id
                            ? 'text-white border-transparent'
                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                        style={holdingsFilter === id ? { background: cfg?.barHex ?? 'hsl(var(--primary))', borderColor: 'transparent' } : undefined}
                      >
                        {id === 'all' ? 'All' : id.charAt(0).toUpperCase() + id.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHoldings.map((holding, idx) => {
                  const isPositive = holding.change24h >= 0;
                  const isPositivePnL = holding.unrealizedPnL >= 0;
                  const isLocal = holding.type === 'Local Investments' || holding.currency === 'GHS';
                  const quantityLabel = holding.quantityType === 'shares' ? 'shares' : 'units';
                  const holdingStatus = (holding.status || 'filled').toLowerCase();
                  const hCfg = ALLOC_CONFIG.find(c => {
                    const t = (holding.type || '').toLowerCase();
                    if (c.key === 'crypto') return t === 'crypto';
                    if (c.key === 'nft') return t === 'nft';
                    if (c.key === 'gold') return t === 'gold';
                    if (c.key === 'stocks') return t === 'stocks' || t === 'stock';
                    return false;
                  });
                  return (
                    <div
                      key={idx}
                      className="group rounded-xl border border-border bg-accent/20 p-4 cursor-pointer hover:bg-accent/40 hover:border-border/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                      onClick={() => setSelectedHolding(holding)}
                      style={{ animationDelay: `${idx * 60}ms`, animationDuration: '400ms' }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {/* Color-coded asset type dot */}
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0 transition-transform duration-300 group-hover:scale-150"
                              style={{ background: hCfg?.barHex ?? '#888', boxShadow: `0 0 0 0 ${hCfg?.barHex ?? '#888'}` }}
                            />
                            <p className="font-semibold truncate transition-colors duration-200 group-hover:text-foreground">{holding.name}</p>
                          </div>
                          <div className="flex items-center flex-wrap gap-1.5 mt-1">
                            <span className="text-xs text-muted-foreground">{holding.symbol} · {holding.amount} {quantityLabel}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${holdingStatus === 'queued' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20'}`}>
                              {holdingStatus.toUpperCase()}
                            </span>
                            {isLocal && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
                                Local
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold">
                            {isLocal
                              ? `GHS ${holding.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                              : `$${(holding.currentValue / 1000).toFixed(1)}K`}
                          </p>
                          <p className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{holding.change24h.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {[
                          {
                            label: 'Cost Basis',
                            value: isLocal
                              ? `GHS ${holding.costBasis.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                              : `$${(holding.costBasis / 1000).toFixed(1)}K`,
                            color: '',
                          },
                          {
                            label: 'Unrealized P&L',
                            value: isPositivePnL
                              ? `+${isLocal ? `GHS ${Math.abs(holding.unrealizedPnL).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${(holding.unrealizedPnL / 1000).toFixed(1)}K`}`
                              : `-${isLocal ? `GHS ${Math.abs(holding.unrealizedPnL).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${(Math.abs(holding.unrealizedPnL) / 1000).toFixed(1)}K`}`,
                            color: isPositivePnL ? 'text-green-500' : 'text-red-500',
                          },
                          {
                            label: 'P&L %',
                            value: `${isPositivePnL ? '+' : ''}${holding.unrealizedPnLPercent.toFixed(1)}%`,
                            color: isPositivePnL ? 'text-green-500' : 'text-red-500',
                          },
                        ].map((stat, sIdx) => (
                          <div
                            key={stat.label}
                            className="rounded-lg bg-background border border-border/60 p-2 transition-all duration-200 group-hover:border-border group-hover:bg-background/80"
                            style={{ transitionDelay: `${sIdx * 30}ms` }}
                          >
                            <p className="text-muted-foreground mb-0.5">{stat.label}</p>
                            <p className={`font-semibold ${stat.color}`}>{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {filteredHoldings.length === 0 && (
                  <div className="col-span-full py-14 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <p className="font-semibold text-foreground mb-1">No holdings yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {holdingsFilter === 'all'
                        ? 'Make your first trade to start building your portfolio.'
                        : `No ${holdingsFilter} holdings yet. Try a different category.`}
                    </p>
                    {holdingsFilter === 'all' && (
                      <button
                        onClick={() => {
                          const host = window.location.hostname || 'localhost';
                          const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
                          window.location.href = `${protocol}//${host}:3002`;
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-black to-red-700 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        Go to Trade
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="space-y-6">
          {/* Rebalancing */}
          <div className="relative overflow-hidden bg-card border border-border rounded-lg p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-2 mb-4">
              <div className="relative flex-shrink-0" style={{ width: 32, height: 32 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/80 border-r-primary/30 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-[2px] rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold leading-tight">Rebalancing Suggestions</h3>
                <p className="text-[11px] text-muted-foreground">Based on your target allocation mix</p>
              </div>
            </div>

            {rebalanceSuggestions.length > 0 ? (
              <div className="relative space-y-3">
                {rebalanceSuggestions.map((s, idx) => (
                  <div
                    key={s.type}
                    className="group relative overflow-hidden p-3 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                    style={{ animationDelay: `${idx * 80}ms`, animationDuration: '350ms' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex-shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110"
                        style={{ width: 32, height: 32 }}
                      >
                        {s.visual.imgSrc ? (
                          <img
                            src={s.visual.imgSrc}
                            alt={s.type}
                            className="w-5 h-5 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-xs font-bold" style={{ color: s.visual.color }}>{s.type.slice(0, 2)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{s.type}: <span style={{ color: s.visual.color }}>{s.current.toFixed(1)}%</span></span>
                          <span className="text-muted-foreground text-xs">target {s.target}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(s.current, 100)}%`, background: s.visual.color }} />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRebalanceAction(s)}
                      className={`text-xs px-2 py-1.5 rounded-lg w-full mt-2.5 font-medium transition-all duration-200 active:scale-[0.98] ${
                        s.action === 'sell'
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                          : 'bg-green-500/10 hover:bg-green-500/20 text-green-500'
                      }`}
                    >
                      {s.action === 'sell' ? '↓ Sell' : '↑ Buy'} ${s.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} of {s.type}
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowRebalancingWizard(true)}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                >
                  Apply Rebalancing
                </button>
              </div>
            ) : (
              <div className="relative flex flex-col items-center text-center py-8 px-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="relative w-12 h-12 mb-3">
                  <div className="absolute inset-0 rounded-full bg-green-500/15 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-0 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                <p className="font-medium text-sm">Your portfolio is well balanced</p>
                <p className="text-xs text-muted-foreground mt-1">No allocation drifts beyond target right now — check back as the market moves.</p>
              </div>
            )}
          </div>

          {/* DCA Plans */}
          <div className="bg-card border border-border rounded-lg p-6 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-shrink-0" style={{ width: 32, height: 32 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400/80 border-r-blue-400/30 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-[2px] rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold leading-tight">Recurring Investments</h3>
                <p className="text-[11px] text-muted-foreground">Automate your buys to smooth out timing risk</p>
              </div>
            </div>
            <div className="space-y-2">
              {dcaPlansList.map((plan, idx) => (
                <div
                  key={plan.id || idx}
                  className="group p-3 rounded-lg border border-border hover:border-purple-400/40 hover:bg-purple-500/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${idx * 60}ms`, animationDuration: '350ms' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex-shrink-0 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ width: 30, height: 30 }}>
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="text-sm min-w-0">
                        <p className="font-medium truncate">${plan.amount} in {plan.asset}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.frequency} • Next: {new Date(plan.nextExecution).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="flex-shrink-0 px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-medium">Active</span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowDCAModal(true)}
                className="w-full py-2 border border-dashed border-border rounded-lg text-muted-foreground text-sm transition-all duration-200 hover:border-purple-400/50 hover:text-purple-400 hover:bg-purple-500/5 active:scale-[0.99]"
              >
                + Add Recurring Investment
              </button>
            </div>
          </div>
        </div>

      {/* Performance Chart + Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Portfolio Performance</h3>
          <PortfolioChart data={chartData} />
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">Risk Analysis</h3>
            </div>
            <button onClick={() => setShowRiskDetails(true)} className="text-sm text-primary hover:underline transition-colors">View Details</button>
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
                  className={`h-2 rounded-full transition-all duration-700 ${
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
            className="p-3 border border-border rounded-lg hover:bg-accent flex flex-col items-center transition-all active:scale-[0.98]"
            onClick={() => {
              const url = exportTransactionsCSV();
              if (url) {
                const link = document.createElement('a');
                link.href = url;
                link.download = `auravest-transactions-${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                showExportNotice('Transactions exported as CSV', 'success');
              } else {
                showExportNotice('No transactions to export yet', 'info');
              }
            }}
          >
            <FileText className="w-5 h-5 mb-1" />
            <span className="text-sm text-center">Export CSV</span>
          </button>
          <button
            className="p-3 border border-border rounded-lg hover:bg-accent flex flex-col items-center transition-all active:scale-[0.98]"
            onClick={() => showExportNotice('Tax report exports are coming soon', 'info')}
          >
            <FileText className="w-5 h-5 mb-1" />
            <span className="text-sm text-center">Tax Report (PDF)</span>
          </button>
        </div>
        {exportNotice && (
          <div
            className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border animate-in fade-in slide-in-from-bottom-1 duration-200 ${
              exportNotice.tone === 'success'
                ? 'bg-green-500/10 border-green-500/25 text-green-500'
                : 'bg-blue-500/10 border-blue-500/25 text-blue-400'
            }`}
          >
            {exportNotice.tone === 'success' ? (
              <span className="relative w-4 h-4 flex-shrink-0">
                <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '1.4s' }} />
                <CheckCircle2 className="relative w-4 h-4" />
              </span>
            ) : (
              <Info className="w-4 h-4 flex-shrink-0" />
            )}
            {exportNotice.message}
          </div>
        )}
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

      {showDCAModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={closeDcaModal}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {dcaSuccess ? (
              <div className="px-6 py-10 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-purple-500/15 animate-ping" style={{ animationDuration: '1.6s' }} />
                  <div className="absolute inset-0 rounded-full bg-purple-500/15 animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.35s' }} />
                  <div className="absolute inset-2 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-base">Recurring Investment Created</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    ${dcaAmount} in {dcaSelectedAsset?.symbol} · {dcaFrequency}
                  </p>
                </div>
                <button
                  onClick={closeDcaModal}
                  className="mt-2 px-6 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-sm font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-purple-400 to-blue-400" />

                <div className="relative flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border/60">
                  <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400/80 border-r-blue-400/30 animate-spin" style={{ animationDuration: '2.5s' }} />
                    <div className="absolute inset-[3px] rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
                      <Zap className="w-4.5 h-4.5 text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight">Recurring Investment</h3>
                    <p className="text-[11px] text-muted-foreground">Invest automatically to reduce timing risk</p>
                  </div>
                  <button
                    onClick={closeDcaModal}
                    className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-purple-400">$</span>
                      <input
                        type="number"
                        value={dcaAmount}
                        onChange={(e) => setDcaAmount(e.target.value)}
                        className="w-full pl-7 pr-4 py-2.5 border border-border rounded-xl bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                      />
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {['50', '100', '250', '500'].map((v) => (
                        <button
                          key={v}
                          onClick={() => setDcaAmount(v)}
                          className={`flex-1 py-1 text-[11px] rounded-lg border transition-all font-medium ${dcaAmount === v ? 'bg-purple-500/20 border-purple-400/50 text-purple-400' : 'border-border bg-background hover:bg-accent'}`}
                        >
                          ${v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Asset</label>
                    <select
                      value={dcaSelectedAsset?.id || ''}
                      onChange={(e) => {
                        const asset = dcaAssetOptions.find((a) => a.id === e.target.value);
                        if (asset) setDcaSelectedAsset(asset);
                      }}
                      className="w-full p-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                    >
                      {dcaAssetOptions.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({asset.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Frequency</label>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setDcaFrequency(f)}
                          className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${dcaFrequency === f ? 'border-purple-400/50 bg-purple-500/10 text-purple-400' : 'border-border hover:border-purple-400/30'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={closeDcaModal}
                      className="flex-1 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateDcaPlan}
                      disabled={!dcaSelectedAsset || !dcaAmount || Number(dcaAmount) <= 0}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm Plan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showRiskDetails && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowRiskDetails(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 overflow-hidden max-h-[85vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400" />
            <div className="relative flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border/60">
              <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400/80 border-r-amber-400/30 animate-spin" style={{ animationDuration: '2.5s' }} />
                <div className="absolute inset-[3px] rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                  <Shield className="w-4.5 h-4.5 text-orange-400" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Risk Analysis — Details</h3>
                <p className="text-[11px] text-muted-foreground">Deeper view into your portfolio's risk profile</p>
              </div>
              <button
                onClick={() => setShowRiskDetails(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Value at Risk */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Value at Risk ({advancedRiskMetrics.valueAtRisk.confidence}% confidence)</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Daily', value: advancedRiskMetrics.valueAtRisk.daily },
                    { label: 'Weekly', value: advancedRiskMetrics.valueAtRisk.weekly },
                    { label: 'Monthly', value: advancedRiskMetrics.valueAtRisk.monthly },
                  ].map((item, idx) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-red-500/5 border border-red-500/15 p-2.5 text-center animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                      style={{ animationDelay: `${idx * 60}ms`, animationDuration: '300ms' }}
                    >
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-bold text-red-500">${item.value.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volatility comparison */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Volatility vs. Benchmark</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Your Portfolio', value: advancedRiskMetrics.volatility.portfolio, color: '#f97316' },
                    { label: 'Benchmark', value: advancedRiskMetrics.volatility.benchmark, color: '#94a3b8' },
                  ].map((item, idx) => (
                    <div key={item.label} className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: `${idx * 60}ms`, animationDuration: '300ms' }}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold">{item.value.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(item.value * 3, 100)}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Beta: <span className="font-semibold text-foreground">{advancedRiskMetrics.volatility.beta.toFixed(2)}</span> — moves {advancedRiskMetrics.volatility.beta > 1 ? 'more' : 'less'} than the market</p>
              </div>

              {/* Stress tests */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Stress Test Scenarios</h4>
                <div className="space-y-2">
                  {advancedRiskMetrics.stressTests.map((test, idx) => (
                    <div
                      key={test.scenario}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                      style={{ animationDelay: `${idx * 70}ms`, animationDuration: '300ms' }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${test.probability === 'High' ? 'text-red-500' : test.probability === 'Medium' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{test.scenario}</p>
                          <p className="text-[11px] text-muted-foreground">Probability: {test.probability}</p>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 text-sm font-bold ${test.impact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {test.impact >= 0 ? '+' : ''}{test.impact.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-sm">
                  <span className="text-muted-foreground">Sharpe Ratio: </span>
                  <span className="font-semibold">{advancedRiskMetrics.sharpeRatio.toFixed(2)}</span>
                  <span className="text-muted-foreground"> · Max Drawdown: </span>
                  <span className="font-semibold text-red-500">{advancedRiskMetrics.maxDrawdown.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
