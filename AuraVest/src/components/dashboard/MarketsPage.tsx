'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  X,
  Landmark,
  Clock,
  ShieldCheck,
  Lightbulb,
  Package,
  ClipboardList,
  BadgeCheck,
  Building2,
  Bell,
  ShoppingCart,
  Scale,
  Link2,
  BarChart3,
} from 'lucide-react';
import {
  startCryptoWebSocket,
  subscribeToCrypto,
  getCryptoPage,
  loadCrypto,
  loadStocks,
  getGoldList,
  getNFTList,
} from '@/lib/marketData';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/mockAPI';
import TradeModal from '@/components/TradeModal';
import AssetDetailsModal from '@/components/AssetDetailsModal';
import PriceAlertModal from '@/components/PriceAlertModal';
import { lazy, Suspense } from 'react';
const TradingChart = lazy(() => import('./TradingChart'));
import TransactionSuccessModal from '@/components/TransactionSuccessModal';

type AssetTab = 'crypto' | 'stocks' | 'gold' | 'nfts' | 'local' | 'analysis';

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<AssetTab>('crypto');
  const [stocksView, setStocksView] = useState<'local' | 'international'>('local');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price_desc' | 'price_asc' | 'change_desc' | 'change_asc'>('default');
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [tradeModal, setTradeModal] = useState<any>(null);

  const syncPortfolioSnapshotCookie = (portfolio: any) => {
    if (typeof document === 'undefined' || !portfolio) return;
    const holdings = JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
    const normalizedTradeHoldings = holdings
      .filter((holding: any) => holding && Number.isFinite(Number(holding.currentValue || 0)))
      .map((holding: any) => ({
        id: String(holding.id || `holding-${holding.symbol || Date.now()}`),
        symbol: String(holding.symbol || 'N/A'),
        shares: Number(holding.amount || 0),
        value: Number(holding.currentValue || 0),
      }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5);

    const allocationHoldings = Array.isArray(portfolio.assets)
      ? portfolio.assets
          .filter((asset: any) => asset && Number.isFinite(Number(asset.value || 0)))
          .map((asset: any, index: number) => ({
            id: `asset-${index}-${String(asset.type || 'asset').toLowerCase()}`,
            symbol: String(asset.type || 'Asset'),
            shares: Number(asset.allocation || 0),
            value: Number(asset.value || 0),
          }))
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 5)
      : [];

    const topHoldings = normalizedTradeHoldings.length > 0 ? normalizedTradeHoldings : allocationHoldings;

    const snapshot = {
      totalValue: Number(portfolio.totalValue || 0),
      change24h: Number(portfolio.change24h || 0),
      changeAmount: Number(portfolio.changeAmount || 0),
      topHoldings,
      updatedAt: new Date().toISOString(),
    };
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `auravest_portfolio_snapshot=${encodeURIComponent(JSON.stringify(snapshot))}; expires=${expires}; path=/; SameSite=Lax`;
  };
  const [alertModal, setAlertModal] = useState<any>(null);

  const [successModal, setSuccessModal] = useState<any>(null);
  const [localAmount, setLocalAmount] = useState('500');
  const [localFeedback, setLocalFeedback] = useState('');
  const [localPositions, setLocalPositions] = useState<any[]>([]);
  const [localConfirmModal, setLocalConfirmModal] = useState<{
    isOpen: boolean;
    assetId: string;
    amount: string;
  }>({ isOpen: false, assetId: '', amount: '' });
  const [localSuccessModal, setLocalSuccessModal] = useState<{
    isOpen: boolean;
    name: string;
    amount: number;
  }>({ isOpen: false, name: '', amount: 0 });
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down'>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  // Pagination
  const [cryptoPage, setCryptoPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreCrypto, setHasMoreCrypto] = useState(true);
  const [hasMoreStocks, setHasMoreStocks] = useState(true);

  // Live data
  const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);
  const [stockAssets, setStockAssets] = useState<any[]>([]);
  const [goldAssets, setGoldAssets] = useState<any[]>([]);
  const [nftAssets, setNftAssets] = useState<any[]>([]);
  const [ghsRate, setGhsRate] = useState<number>(17.5);
  const [ghsRateUpdated, setGhsRateUpdated] = useState<string>('');
  const ghanaStockAssets = [
    {
      id: 'gse-scb',
      name: 'Standard Chartered Bank Ghana',
      symbol: 'SCB',
      price: 24.8,
      change24h: 1.2,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-gcb',
      name: 'GCB Bank PLC',
      symbol: 'GCB',
      price: 6.45,
      change24h: 0.9,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-gbfoods',
      name: 'GOIL PLC',
      symbol: 'GOIL',
      price: 2.95,
      change24h: -0.8,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-eti',
      name: 'Ecobank Transnational Incorporated',
      symbol: 'ETI',
      price: 0.21,
      change24h: 0.4,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-mtn',
      name: 'MTN Ghana',
      symbol: 'MTNGH',
      price: 2.31,
      change24h: 1.4,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-sogeg',
      name: 'Société Générale Ghana',
      symbol: 'SOGEGH',
      price: 1.22,
      change24h: 0.6,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-total',
      name: 'TotalEnergies Marketing Ghana',
      symbol: 'TOTAL',
      price: 24.1,
      change24h: -0.2,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-fml',
      name: 'Fan Milk PLC',
      symbol: 'FML',
      price: 4.1,
      change24h: 0.4,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-cmlt',
      name: 'Camelot Ghana',
      symbol: 'CMLT',
      price: 0.3,
      change24h: 0.0,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-sic',
      name: 'SIC Insurance Company',
      symbol: 'SIC',
      price: 0.29,
      change24h: -0.4,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-cal',
      name: 'CAL Bank PLC',
      symbol: 'CAL',
      price: 0.79,
      change24h: 0.5,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-egl',
      name: 'Enterprise Group PLC',
      symbol: 'EGL',
      price: 2.4,
      change24h: 1.1,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-unilever',
      name: 'Unilever Ghana',
      symbol: 'UNIL',
      price: 14.7,
      change24h: 0.3,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-guiness',
      name: 'Guinness Ghana Breweries',
      symbol: 'GGBL',
      price: 3.15,
      change24h: -0.1,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-trustbank',
      name: 'Ecobank Ghana',
      symbol: 'EGH',
      price: 7.9,
      change24h: 0.7,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-cocoa',
      name: 'Cocoa Processing Company',
      symbol: 'CPC',
      price: 0.06,
      change24h: 0.0,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-access',
      name: 'Access Bank Ghana',
      symbol: 'ACCESS',
      price: 5.2,
      change24h: 0.9,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-rbg',
      name: 'Republic Bank Ghana',
      symbol: 'RBGH',
      price: 0.62,
      change24h: 0.4,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
    {
      id: 'gse-tullow',
      name: 'Tullow Oil PLC',
      symbol: 'TLW',
      price: 6.85,
      change24h: 0.7,
      exchange: 'GSE',
      currency: 'GHS',
      image: '🇬🇭',
    },
  ].map((stock) => {
    const customLogoPathBySymbol: Record<string, string> = {
      GOIL: '/logos/gse/GOIL.jpg',
      RBGH: '/logos/gse/RBGH.jpg',
      MTNGH: '/logos/gse/MTNGH.svg',
    };

    return {
      ...stock,
      image: customLogoPathBySymbol[stock.symbol] || `/logos/gse/${stock.symbol}.png`,
    };
  });
  const localInvestmentAssets = [
    {
      id: 'local-tbill-91',
      name: 'Treasury Bill (91-Day)',
      provider: 'Primary Dealer Network',
      minimum: 'GHS 100',
      minimumAmount: 100,
      tenor: '91 days',
      returnRate: '17.8% p.a.',
      risk: 'Low',
      liquidity: 'Locked',
      category: 'Government Security',
    },
    {
      id: 'local-bond-2y',
      name: 'Government Bond (2-Year)',
      provider: 'Public Debt Market',
      minimum: 'GHS 500',
      minimumAmount: 500,
      tenor: '2 years',
      returnRate: '19.1% p.a.',
      risk: 'Low',
      liquidity: 'Locked',
      category: 'Fixed Income',
    },
    {
      id: 'local-unit-trust',
      name: 'Balanced Unit Trust',
      provider: 'Licensed Asset Manager',
      minimum: 'GHS 200',
      minimumAmount: 200,
      tenor: '12+ months',
      returnRate: '15.0% p.a.',
      risk: 'Medium',
      liquidity: 'Flexible',
      category: 'Collective Investment',
    },
    {
      id: 'local-mmf',
      name: 'Money Market Fund',
      provider: 'Licensed Asset Manager',
      minimum: 'GHS 50',
      minimumAmount: 50,
      tenor: 'Open-ended',
      returnRate: '14.2% p.a.',
      risk: 'Low',
      liquidity: 'Flexible',
      category: 'Cash Management',
    },
  ];



  // Initialize
  useEffect(() => {
    setWatchlist(getWatchlist());
    startCryptoWebSocket();

    const savedPositions = localStorage.getItem('auravest_local_positions');
    if (savedPositions) {
      setLocalPositions(JSON.parse(savedPositions));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('auravest_local_positions', JSON.stringify(localPositions));
  }, [localPositions]);

  // Subscribe to live crypto with price-tick flash
  useEffect(() => {
    const unsub = subscribeToCrypto((livePrices) => {
      const flashes: Record<string, 'up' | 'down'> = {};
      Object.entries(livePrices).forEach(([symbol, data]) => {
        const prev = prevPricesRef.current[symbol];
        if (prev !== undefined && data.price !== prev) {
          flashes[symbol] = data.price > prev ? 'up' : 'down';
        }
        prevPricesRef.current[symbol] = data.price;
      });
      setCryptoAssets((prev) =>
        prev.map((asset) => ({
          ...asset,
          price: livePrices[asset.symbol]?.price ?? asset.price,
          change24h: livePrices[asset.symbol]?.change24h ?? asset.change24h,
        }))
      );
      if (Object.keys(flashes).length > 0) {
        setPriceFlash((p) => ({ ...p, ...flashes }));
        setTimeout(() => setPriceFlash((p) => {
          const cleared = { ...p };
          Object.keys(flashes).forEach((k) => { delete cleared[k]; });
          return cleared;
        }), 600);
      }
    });
    return unsub;
  }, []);

  // Load initial assets
  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [crypto, stocks, gold, nfts] = await Promise.all([
        loadCrypto(),
        loadStocks(),
        getGoldList(),
        getNFTList(),
      ]);

      setCryptoAssets(crypto);
      setHasMoreCrypto(false);
      setStockAssets(stocks);
      setHasMoreStocks(false);
      setGoldAssets(gold);
      setNftAssets(nfts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Live GHS/USD rate from Frankfurter API
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=GHS');
        const json = await res.json() as { rates?: { GHS?: number }; date?: string };
        if (json?.rates?.GHS) {
          setGhsRate(json.rates.GHS);
          setGhsRateUpdated(json.date ?? '');
        }
      } catch {
        // keep default 17.5 if fetch fails
      }
    };
    void fetchRate();
    const id = window.setInterval(() => void fetchRate(), 5 * 60 * 1000); // refresh every 5 min
    return () => window.clearInterval(id);
  }, []);

  // Load more crypto
  const loadMoreCrypto = useCallback(() => {
    if (!hasMoreCrypto || isLoading) return;
    setIsLoading(true);
    getCryptoPage(cryptoPage).then((newAssets) => {
      if (newAssets.length === 0) {
        setHasMoreCrypto(false);
      } else {
        setCryptoAssets((prev) => [...prev, ...newAssets]);
        setCryptoPage((p) => p + 1);
      }
      setIsLoading(false);
    });
  }, [cryptoPage, hasMoreCrypto, isLoading]);

  const toggleWatchlist = (id: string, type: string) => {
    const exists = watchlist.some((item) => item.id === id);
    if (exists) {
      removeFromWatchlist(id);
      setWatchlist(watchlist.filter((item) => item.id !== id));
    } else {
      addToWatchlist({ id, type });
      setWatchlist([...watchlist, { id, type }]);
    }
  };

  const handleAssetClick = (asset: any) => setSelectedAsset(asset);
  const handleTrade = (asset: any, type: 'buy' | 'sell') => {
    setSelectedAsset(null);
    setTradeModal({ asset, type });
  };

  // Safe format helper
  const formatPercent = (value: number | null | undefined): string => {
    if (typeof value !== 'number' || isNaN(value)) return '—';
    return (value >= 0 ? '+' : '') + value.toFixed(2);
  };

  const applySortAndFilter = (assets: any[]) => {
    const filtered = assets.filter(
      (a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortBy === 'price_desc') return [...filtered].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    if (sortBy === 'price_asc') return [...filtered].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sortBy === 'change_desc') return [...filtered].sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0));
    if (sortBy === 'change_asc') return [...filtered].sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0));
    return filtered;
  };

  const filteredCrypto = applySortAndFilter(cryptoAssets);
  const filteredStocks = applySortAndFilter(stockAssets);
  const filteredGhanaStocks = applySortAndFilter(ghanaStockAssets);

  const openLocalConfirm = (assetId: string, amount: number) => {
    setLocalConfirmModal({ isOpen: true, assetId, amount: String(amount) });
  };

  const confirmLocalInvestment = () => {
    const selectedAsset = localInvestmentAssets.find((asset) => asset.id === localConfirmModal.assetId);
    const amount = Number(localConfirmModal.amount) || 0;

    if (!selectedAsset) {
      setLocalFeedback('Select a valid local investment product.');
      return;
    }

    if (amount <= 0) {
      setLocalFeedback('Enter a valid amount to invest.');
      return;
    }

    if (amount < selectedAsset.minimumAmount) {
      setLocalFeedback(`Minimum for ${selectedAsset.name} is GHS ${selectedAsset.minimumAmount.toLocaleString()}.`);
      return;
    }

    const now = new Date();
    const newPosition = {
      id: `local-pos-${Date.now()}`,
      assetId: selectedAsset.id,
      name: selectedAsset.name,
      amount,
      rate: selectedAsset.returnRate,
      tenor: selectedAsset.tenor,
      date: now.toISOString(),
    };

    setLocalPositions((prev) => [newPosition, ...prev]);

    const defaultPortfolio = {
      totalValue: 125847.32,
      change24h: 3.45,
      changeAmount: 4201.23,
      assets: [
        { type: 'Crypto', value: 45230.50, allocation: 35.9 },
        { type: 'Stocks', value: 52180.20, allocation: 41.4 },
        { type: 'Gold', value: 18436.62, allocation: 14.6 },
        { type: 'NFTs', value: 10000.00, allocation: 7.9 },
      ],
    };

    const storedPortfolio = JSON.parse(localStorage.getItem('auravest_portfolio') || '{}');
    const portfolio = !storedPortfolio || Object.keys(storedPortfolio).length === 0
      ? defaultPortfolio
      : storedPortfolio;

    const existingLocalIndex = (portfolio.assets || []).findIndex((asset: any) => asset.type === 'Local Investments');
    if (existingLocalIndex >= 0) {
      portfolio.assets[existingLocalIndex].value += amount;
    } else {
      portfolio.assets = [...(portfolio.assets || []), { type: 'Local Investments', value: amount, allocation: 0 }];
    }

    portfolio.totalValue = (portfolio.assets || []).reduce((sum: number, asset: any) => sum + Number(asset.value || 0), 0);
    portfolio.assets = (portfolio.assets || []).map((asset: any) => ({
      ...asset,
      allocation: portfolio.totalValue > 0 ? Number(((asset.value / portfolio.totalValue) * 100).toFixed(1)) : 0,
    }));

    localStorage.setItem('auravest_portfolio', JSON.stringify(portfolio));
    syncPortfolioSnapshotCookie(portfolio);

    const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    transactions.unshift({
      id: `tx-local-${Date.now()}`,
      type: 'buy',
      asset: 'LOCAL',
      assetName: selectedAsset.name,
      amount: 1,
      price: amount,
      total: amount,
      timestamp: now.toISOString(),
      status: 'completed',
    });
    localStorage.setItem('auravest_transactions', JSON.stringify(transactions));

    setLocalFeedback(`Order placed: GHS ${amount.toLocaleString()} in ${selectedAsset.name}.`);
    setLocalConfirmModal({ isOpen: false, assetId: '', amount: '' });
    setLocalSuccessModal({ isOpen: true, name: selectedAsset.name, amount });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {/* Sort pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { value: 'default',     label: 'Default' },
            { value: 'price_desc',  label: 'Price ↓' },
            { value: 'price_asc',   label: 'Price ↑' },
            { value: 'change_desc', label: '% Change ↓' },
            { value: 'change_asc',  label: '% Change ↑' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                sortBy === opt.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b border-border overflow-x-auto pb-1">
        {([
          { id: 'crypto', label: 'Crypto' },
          { id: 'stocks', label: 'Stocks' },
          { id: 'gold', label: 'Gold' },
          { id: 'nfts', label: 'NFTs' },
          { id: 'local', label: 'Local Investments' },
          { id: 'analysis', label: 'Analysis' },
        ] as { id: AssetTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-colors relative ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'crypto' && (
        <div className="space-y-4">

          {/* ── Crypto Markets Banner ──────────────────────────────── */}
          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#140800] via-[#1f0e00] to-[#0a0400] border border-orange-500/25 hover:border-orange-400/55 transition-all duration-500 cursor-default hover:shadow-xl hover:shadow-orange-500/10 hover:scale-[1.004]">

            {/* Radial glows */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.12),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.28),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(234,179,8,0.07),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(234,179,8,0.16),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Shine sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/4 to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4 p-4 md:p-5">

              {/* Left: logo + title */}
              <div className="flex items-center gap-3.5">
                <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400/70 border-r-yellow-400/30 group-hover:animate-spin" />
                  <div className="absolute inset-1 rounded-full ring-1 ring-orange-500/20 group-hover:ring-orange-400/50 transition-all duration-300" />
                  <div className="absolute inset-1 rounded-full overflow-hidden bg-orange-950/60 group-hover:scale-105 transition-transform duration-300">
                    <img
                      src="https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/btc.svg"
                      alt="Crypto"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:22px;display:flex;align-items:center;justify-content:center;height:100%">₿</span>';
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-base text-orange-400 tracking-tight group-hover:text-orange-300 transition-colors duration-300">Crypto Markets</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold group-hover:bg-orange-500/35 transition-all duration-300">BTC · ETH · ALTs</span>
                  </div>
                  <p className="text-xs text-orange-200/50 group-hover:text-orange-200/80 transition-colors duration-300">
                    {cryptoAssets.length} assets · Prices in USD · 24h global
                  </p>
                </div>
              </div>

              {/* Right: live indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                <span className="text-xs font-semibold text-orange-400/80">Live · USD</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading && cryptoAssets.length === 0 ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1.5 items-end flex flex-col">
                    <div className="h-3.5 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-10 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))
            ) : filteredCrypto.length > 0 ? (
              filteredCrypto.map((crypto) => {
                const isPositive = typeof crypto.change24h === 'number' && crypto.change24h >= 0;
                const isInWatchlist = watchlist.some((w) => w.id === crypto.id);
                return (
                  <div
                    key={crypto.id}
                    onClick={() => handleAssetClick(crypto)}
                    className="bg-card border border-border rounded-lg p-4 hover:bg-accent transition-all hover:scale-105 cursor-pointer animate-fadeIn"
                  >
                    <div className="flex items-center justify-between">
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
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(crypto.id, 'crypto');
                          }}
                          className={`p-1 rounded cursor-pointer ${
                            isInWatchlist ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                        </span>
                        <div className="text-right">
                          <p className={`font-semibold transition-colors duration-300 ${
                            priceFlash[crypto.symbol] === 'up' ? 'text-green-400' :
                            priceFlash[crypto.symbol] === 'down' ? 'text-red-400' : ''
                          }`}>${(crypto.price ?? 0).toLocaleString()}</p>
                          <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {formatPercent(crypto.change24h)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : searchQuery ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No crypto assets found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : null}
          </div>

        </div>
      )}

      {activeTab === 'stocks' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold text-sm">Stocks Markets</h3>
                <p className="text-xs text-muted-foreground">Switch between local Ghana and international equities</p>
              </div>
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setStocksView('local')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    stocksView === 'local' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Local Stocks
                </button>
                <button
                  onClick={() => setStocksView('international')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    stocksView === 'international' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  International Stocks
                </button>
              </div>
            </div>
          </div>

          {stocksView === 'local' && (
            <>
              {/* ── GSE Banner ─────────────────────────────────────────── */}
              <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#00150a] via-[#001a0e] to-[#000d06] border border-emerald-500/25 hover:border-emerald-400/55 transition-all duration-500 cursor-default hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.004]">

                {/* Radial glows */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.28),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(220,38,38,0.07),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(220,38,38,0.16),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Shine sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/4 to-transparent pointer-events-none" />

                <div className="relative flex items-center justify-between gap-4 p-4 md:p-5">

                  {/* Left: logo + title */}
                  <div className="flex items-center gap-3.5">
                    {/* Logo with spinning ring */}
                    <div className="relative flex-shrink-0 w-13 h-13" style={{ width: 52, height: 52 }}>
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400/70 border-r-emerald-400/30 group-hover:animate-spin" />
                      <div className="absolute inset-1 rounded-full ring-1 ring-emerald-500/20 group-hover:ring-emerald-400/50 transition-all duration-300" />
                      <div className="absolute inset-1 rounded-full overflow-hidden bg-emerald-950/60 group-hover:scale-105 transition-transform duration-300">
                        <img
                          src="/logos/gse/gse.png"
                          alt="GSE"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:22px;display:flex;align-items:center;justify-content:center;height:100%">🇬🇭</span>';
                          }}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-base text-emerald-400 tracking-tight group-hover:text-emerald-300 transition-colors duration-300">Ghana Stock Exchange</span>
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/1/19/Flag_of_Ghana.svg"
                          alt="Ghana"
                          className="w-5 h-4 rounded-sm object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold group-hover:bg-emerald-500/35 transition-all duration-300">GSE</span>
                      </div>
                      <p className="text-xs text-emerald-200/50 group-hover:text-emerald-200/80 transition-colors duration-300">
                        {filteredGhanaStocks.length} listings · Prices in GHS · Accra, Ghana
                      </p>
                    </div>
                  </div>

                  {/* Right: live indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-semibold text-emerald-400/80">Live · GHS</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGhanaStocks.map((stock) => {
                  const isPositive = typeof stock.change24h === 'number' && stock.change24h >= 0;
                  return (
                    <div
                      key={stock.id}
                      onClick={() => handleAssetClick(stock)}
                      className="bg-card border border-border rounded-lg p-4 hover:bg-accent transition-all hover:scale-105 cursor-pointer animate-fadeIn"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-transparent flex items-center justify-center text-white font-bold text-lg">
                            {typeof stock.image === 'string' && stock.image.startsWith('/') ? (
                              <img
                                src={stock.image}
                                alt={stock.symbol}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="w-full h-full items-center justify-center hidden text-white font-bold text-xs bg-gradient-to-br from-red-500 to-yellow-500">
                              {stock.symbol?.slice(0, 2)}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold">{stock.name}</p>
                            <p className="text-sm text-muted-foreground">{stock.symbol} • {stock.exchange}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">GHS {(stock.price ?? 0).toLocaleString()}</p>
                          <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {formatPercent(stock.change24h)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {stocksView === 'international' && (
            <>
              {/* ── International Markets Banner ───────────────────────── */}
              <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#00051a] via-[#000d2e] to-[#000308] border border-blue-500/25 hover:border-blue-400/55 transition-all duration-500 cursor-default hover:shadow-xl hover:shadow-blue-500/10 hover:scale-[1.004]">

                {/* Radial glows */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.28),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.07),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.18),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Shine sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/4 to-transparent pointer-events-none" />

                <div className="relative flex items-center justify-between gap-4 p-4 md:p-5">

                  {/* Left: logos + title */}
                  <div className="flex items-center gap-3.5">
                    {/* NYSE logo with spinning ring */}
                    <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400/70 border-r-blue-400/30 group-hover:animate-spin" />
                      <div className="absolute inset-1 rounded-full ring-1 ring-blue-500/20 group-hover:ring-blue-400/50 transition-all duration-300" />
                      <div className="absolute inset-1 rounded-full overflow-hidden bg-white flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <img
                          src="/logos/markets/nasdaq.png"
                          alt="NASDAQ"
                          className="w-3/4 h-3/4 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:22px;display:flex;align-items:center;justify-content:center;height:100%">🏛️</span>';
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-base text-blue-400 tracking-tight group-hover:text-blue-300 transition-colors duration-300">International Markets</span>
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg"
                          alt="US"
                          className="w-5 h-4 rounded-sm object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold group-hover:bg-blue-500/35 transition-all duration-300">NYSE · NASDAQ</span>
                      </div>
                      <p className="text-xs text-blue-200/50 group-hover:text-blue-200/80 transition-colors duration-300">
                        {filteredStocks.length} listings · Prices in USD · New York
                      </p>
                    </div>
                  </div>

                  {/* Right: live indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                    <span className="text-xs font-semibold text-blue-400/80">Live · USD</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStocks.map((stock) => {
                  const isPositive = typeof stock.change24h === 'number' && stock.change24h >= 0;
                  const isInWatchlist = watchlist.some((w) => w.id === stock.id);
                  return (
                    <div
                      key={stock.id}
                      onClick={() => handleAssetClick(stock)}
                      className="bg-card border border-border rounded-lg p-4 hover:bg-accent transition-all hover:scale-105 cursor-pointer animate-fadeIn"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {(stock.image?.startsWith('http') || stock.image?.startsWith('/')) ? (
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
                              style={{ display: (stock.image?.startsWith('http') || stock.image?.startsWith('/')) ? 'none' : 'flex' }}
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
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(stock.id, 'stocks');
                            }}
                            className={`p-1 rounded cursor-pointer ${
                              isInWatchlist ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                          </span>
                          <div className="text-right">
                            <p className="font-semibold">${(stock.price ?? 0).toLocaleString()}</p>
                            <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {formatPercent(stock.change24h)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </>
          )}
        </div>
      )}

      {activeTab === 'gold' && (() => {
        const spotPerGram = (goldAssets.find((a: any) => a.id === 'gold-spot-gram') as any)?.price ?? 106;
        const spotChange = (goldAssets.find((a: any) => a.id === 'gold-spot-gram') as any)?.change24h ?? 0;
        const spotPerOunce = (goldAssets.find((a: any) => a.id === 'gold-spot-ounce') as any)?.price ?? 3300;
        const GHS = ghsRate; // live rate from Frankfurter API

        const GOLDBOD_PRODUCTS = [
          {
            grams: 1,
            label: '1g Gold Tablet',
            desc: 'Entry-level 24K investment tablet',
            img: '/goldbod/tablet-1g.jpg',
            badge: 'Popular',
            badgeColor: 'bg-amber-500',
            fixedGhsPrice: 1846.52,
          },
          {
            grams: 5,
            label: '5g Gold Tablet',
            desc: 'Mid-tier 24K investment tablet',
            img: '/goldbod/bar-5g.jpg',
            badge: null,
            badgeColor: '',
            fixedGhsPrice: 9232.59,
          },
          {
            grams: 10,
            label: '10g Gold Tablet',
            desc: 'Premium 24K store of value',
            img: '/goldbod/bar-10g.jpg',
            badge: 'Best Value',
            badgeColor: 'bg-emerald-600',
            fixedGhsPrice: 18311.30,
          },
          {
            grams: 31,
            label: '31g Gold Tablet',
            desc: 'Large 24K investment tablet · GoldBod certified',
            img: '/goldbod/tablet-1g.jpg',
            badge: 'Premium',
            badgeColor: 'bg-amber-700',
            fixedGhsPrice: 55811.00,
          },
        ];

        const TRUST_PILLARS = [
          { icon: <Building2 className="w-5 h-5 text-amber-400" />, title: 'Government-Backed', desc: 'Established under Act 1140 (2025) — sole authority for gold trading in Ghana' },
          { icon: <BarChart3 className="w-5 h-5 text-amber-400" />, title: 'Transparent Pricing', desc: 'Based on Bank of Ghana reference rate — no broker markups or hidden fees' },
          { icon: <Scale className="w-5 h-5 text-amber-400" />, title: '98% Market Rate', desc: 'Producers receive up to 98% of world market price, the highest in Africa' },
          { icon: <Link2 className="w-5 h-5 text-amber-400" />, title: 'Blockchain Traceable', desc: 'Every gram tracked from mine to buyer via immutable blockchain ledger' },
        ];

        return (
          <div className="space-y-5">

            {/* ── GoldBod Hero Banner ──────────────────────────────────── */}
            <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1000] via-[#2d1f00] to-[#0f0a00] border border-amber-500/30 hover:border-amber-400/60 transition-all duration-500 cursor-default hover:shadow-2xl hover:shadow-amber-500/15 hover:scale-[1.005]">

              {/* Radial glow layers — intensify on hover */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.15),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.32),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(251,146,60,0.10),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(251,146,60,0.22),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Shine sweep on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />


              <div className="relative p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  {/* Left: logo + title */}
                  <div className="flex items-center gap-4">
                    {/* Logo: spinning ring on hover, scale on hover */}
                    <div className="relative flex-shrink-0 w-16 h-16">
                      {/* Outer spinning ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400/70 border-r-amber-400/30 group-hover:animate-spin" />
                      {/* Inner ring glow */}
                      <div className="absolute inset-1 rounded-full ring-1 ring-amber-500/20 group-hover:ring-amber-400/50 transition-all duration-300" />
                      {/* Logo circle */}
                      <div className="absolute inset-1 rounded-full overflow-hidden bg-amber-950/60 group-hover:scale-105 transition-transform duration-300">
                        <img
                          src="/goldbod/goldbod-logo.png"
                          alt="GoldBod"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:26px;display:flex;align-items:center;justify-content:center;height:100%">🥇</span>';
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-black text-amber-400 tracking-tight group-hover:text-amber-300 transition-colors duration-300">GoldBod</span>
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/1/19/Flag_of_Ghana.svg"
                          alt="Ghana"
                          className="w-5 h-4 rounded-sm object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold group-hover:bg-amber-500/35 group-hover:border-amber-400/50 transition-all duration-300">OFFICIAL</span>
                      </div>
                      <p className="text-xs text-amber-200/60 group-hover:text-amber-200/90 transition-colors duration-300">Ghana Gold Board · Government of Ghana · Act 1140 (2025)</p>
                    </div>
                  </div>

                  {/* Right: live spot price */}
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <div className="flex items-end gap-3">
                      <div className="md:text-right">
                        <p className="text-[10px] text-amber-400/60 uppercase tracking-widest mb-0.5">XAU Spot · per gram</p>
                        <p className="text-3xl font-black text-amber-300 group-hover:text-amber-200 transition-colors duration-300 group-hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                          GH¢{(spotPerGram * GHS).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-amber-400/60 mt-0.5">≈ ${spotPerGram.toFixed(2)} USD</p>
                      </div>
                      <div className={`animate-bounce px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0 transition-all duration-300 ${spotChange >= 0 ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500/35 group-hover:shadow-md group-hover:shadow-green-500/20' : 'bg-red-500/20 text-red-400 group-hover:bg-red-500/35 group-hover:shadow-md group-hover:shadow-red-500/20'}`} style={{ animationDuration: '2s' }}>
                        {spotChange >= 0 ? '▲' : '▼'} {Math.abs(spotChange).toFixed(2)}%
                      </div>
                    </div>
                    {/* Live rate badge + alert button */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-amber-500/60 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        1 USD = GH¢{GHS.toFixed(2)} {ghsRateUpdated ? `· ${ghsRateUpdated}` : '· live'}
                      </span>
                      <button
                        onClick={() => setAlertModal({
                          name: 'Gold (per gram)',
                          symbol: 'XAU/g',
                          price: spotPerGram,
                          change24h: spotChange,
                        })}
                        className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/35 active:scale-95 text-amber-400 border border-amber-500/30 font-semibold transition-all duration-150 flex items-center gap-1 hover:shadow-md hover:shadow-amber-500/20"
                      >
                        <Bell className="w-3 h-3" /> Set Alert
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-tagline — fades up on hover */}
                <p className="mt-4 text-xs text-amber-200/40 group-hover:text-amber-200/70 transition-colors duration-300 max-w-xl leading-relaxed">
                  The sole authority for buying, selling and exporting gold from artisanal & small-scale miners in Ghana — offering transparent, government-certified investment gold to retail investors.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <a
                    href="https://goldbodjewellery.gov.gh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black text-xs font-bold transition-all duration-150 hover:shadow-lg hover:shadow-amber-500/30"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Shop on GoldBod
                  </a>
                  <a
                    href="https://goldbod.gov.gh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-amber-300 text-xs font-semibold border border-amber-500/20 hover:border-amber-400/40 transition-all duration-150"
                  >
                    Learn More ↗
                  </a>
                </div>
              </div>
            </div>

            {/* ── GoldBod Products ─────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-sm">GoldBod Investment Products</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">24K Certified</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {GOLDBOD_PRODUCTS.map((product, idx) => {
                  const usdPrice = spotPerGram * product.grams;
                  const ghsPrice = product.fixedGhsPrice ?? (usdPrice * GHS);
                  return (
                    <div
                      key={idx}
                      className="relative bg-gradient-to-b from-amber-950/40 to-card border border-amber-500/20 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 group cursor-pointer"
                      onClick={() => !product.etf && handleAssetClick(goldAssets.find((a: any) => a.id === 'gold-spot-gram'))}
                    >
                      {product.badge && (
                        <span className={`absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${product.badgeColor}`}>
                          {product.badge}
                        </span>
                      )}

                      {/* Product image */}
                      <div className="h-28 overflow-hidden bg-gradient-to-b from-amber-900/30 to-transparent flex items-center justify-center">
                        <img
                          src={product.img}
                          alt={product.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>

                      <div className="p-3">
                        <p className="font-bold text-xs text-amber-300 mb-0.5">{product.label}</p>
                        <p className="text-[10px] text-muted-foreground mb-2 leading-tight">{product.desc}</p>
                        <p className="text-base font-black text-foreground">GH¢{ghsPrice.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-amber-500/60 font-semibold">≈ ${usdPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD</p>

                        <a
                          href="https://goldbodjewellery.gov.gh"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2.5 w-full block text-center py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/20 transition-colors"
                        >
                          Buy on GoldBod →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Trust Pillars ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TRUST_PILLARS.map((p, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-3.5 hover:border-amber-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2.5">{p.icon}</div>
                  <p className="font-semibold text-xs mb-1">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            {/* ── How to Buy ───────────────────────────────────────────── */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-400" /> How to Buy GoldBod Gold
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {[
                  { step: '1', title: 'Visit the platform', desc: 'Go to goldbodjewellery.gov.gh or a physical showroom in Accra or Kumasi' },
                  { step: '2', title: 'Pick your product', desc: 'Choose from 1g tablets up to 12.5kg Good Delivery bars — all 24K certified' },
                  { step: '3', title: 'Pay at official rate', desc: 'Price is pegged to the Bank of Ghana reference rate — no hidden fees' },
                  { step: '4', title: 'Take delivery', desc: 'Physical collection or secure vault storage with full blockchain traceability' },
                ].map((s) => (
                  <div key={s.step} className="flex-1 flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
                    <div>
                      <p className="text-xs font-semibold">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        );
      })()}

      {activeTab === 'nfts' && (
        <div className="space-y-4">
          {/* ── NFT Collections Banner ─────────────────────────────── */}
          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0d0014] via-[#130020] to-[#05000f] border border-purple-500/25 hover:border-purple-400/55 transition-all duration-500 cursor-default hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.004]">

            {/* Radial glows */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.12),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.28),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.07),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.18),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Shine sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/4 to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4 p-4 md:p-5">

              {/* Left: logo + title */}
              <div className="flex items-center gap-3.5">
                {/* OpenSea logo with spinning ring */}
                <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400/70 border-r-pink-400/30 group-hover:animate-spin" />
                  <div className="absolute inset-1 rounded-full ring-1 ring-purple-500/20 group-hover:ring-purple-400/50 transition-all duration-300" />
                  <div className="absolute inset-1 rounded-full overflow-hidden bg-purple-950/60 group-hover:scale-105 transition-transform duration-300">
                    <img
                      src="/nft/nftlogo.JPG"
                      alt="NFT"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:22px;display:flex;align-items:center;justify-content:center;height:100%">🎨</span>';
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-base text-purple-400 tracking-tight group-hover:text-purple-300 transition-colors duration-300">NFT Collections</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold group-hover:bg-purple-500/35 transition-all duration-300">Floor Prices</span>
                  </div>
                  <p className="text-xs text-purple-200/50 group-hover:text-purple-200/80 transition-colors duration-300">
                    {nftAssets.length} collections · ETH · Real-time volumes
                  </p>
                </div>
              </div>

              {/* Right: live indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                </span>
                <span className="text-xs font-semibold text-purple-400/80">Live · ETH</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {nftAssets.map((nft, idx) => {
              const isPositive = typeof nft.change24h === 'number' && nft.change24h >= 0;
              return (
                <div
                  key={nft.id}
                  onClick={() => handleAssetClick(nft)}
                  className="group relative rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-400/50 bg-gradient-to-b from-[#110018] to-[#07000f] cursor-pointer transition-[border-color,box-shadow,transform] duration-300 hover:shadow-xl hover:shadow-purple-500/15 hover:-translate-y-1 will-change-transform"
                >
                  {/* Shine sweep on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none z-10" />

                  {/* Image area */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fb = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    {/* Image fallback */}
                    <div className="hidden absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 items-center justify-center text-white font-black text-4xl">
                      {nft.symbol?.slice(0, 2) ?? '??'}
                    </div>

                    {/* Rank badge */}
                    <span className="absolute top-2.5 left-2.5 z-10 text-[10px] font-black px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-purple-300 border border-purple-500/40">
                      #{idx + 1}
                    </span>

                    {/* 24h change pill */}
                    <span className={`absolute top-2.5 right-2.5 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm border ${isPositive ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                      {isPositive ? '▲' : '▼'} {Math.abs(nft.change24h ?? 0).toFixed(1)}%
                    </span>

                    {/* Bottom gradient overlay */}
                    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#07000f] to-transparent" />
                  </div>

                  {/* Card body */}
                  <div className="px-3.5 pt-2.5 pb-3.5">
                    {/* Name */}
                    <h3 className="font-bold text-sm text-white/90 line-clamp-1 mb-2.5 group-hover:text-purple-200 transition-colors duration-200">
                      {nft.name}
                    </h3>

                    {/* Floor price — hero stat */}
                    <div className="mb-2.5">
                      <p className="text-[9px] text-purple-400/60 uppercase tracking-widest font-semibold mb-0.5">Floor Price</p>
                      <p className="text-lg font-black text-white tabular-nums leading-tight">
                        {nft.price} <span className="text-sm font-semibold text-purple-400/70">ETH</span>
                      </p>
                    </div>

                    {/* Volume sub-stat */}
                    <div className="flex items-center justify-between text-[10px] mb-3 border-t border-white/[0.06] pt-2.5">
                      <span className="text-white/35 font-medium">24h Vol</span>
                      <span className="text-white/60 font-semibold tabular-nums">
                        {(nft.volume24h / 1_000_000).toFixed(1)}M ETH
                      </span>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAssetClick(nft); }}
                      className="w-full py-2 rounded-xl text-xs font-bold text-purple-300 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-400/50 hover:text-purple-200 transition-[background-color,border-color,color] duration-200"
                    >
                      View Collection
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'local' && (
        <div className="space-y-4">

          {/* ── Local Investments Banner ────────────────────────────── */}
          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#00100d] via-[#001a14] to-[#000806] border border-teal-500/25 hover:border-teal-400/55 transition-all duration-500 cursor-default hover:shadow-xl hover:shadow-teal-500/10 hover:scale-[1.004]">

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.12),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.28),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(234,179,8,0.07),transparent_60%)] group-hover:opacity-0 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(234,179,8,0.16),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/4 to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4 p-4 md:p-5">
              <div className="flex items-center gap-3.5">
                <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-400/70 border-r-yellow-400/30 group-hover:animate-spin" />
                  <div className="absolute inset-1 rounded-full ring-1 ring-teal-500/20 group-hover:ring-teal-400/50 transition-all duration-300" />
                  <div className="absolute inset-1 rounded-full overflow-hidden bg-teal-950/60 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/1/19/Flag_of_Ghana.svg"
                      alt="Ghana"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:22px;display:flex;align-items:center;justify-content:center;height:100%">🇬🇭</span>';
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-base text-teal-400 tracking-tight group-hover:text-teal-300 transition-colors duration-300">Local Investments</span>
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/1/19/Flag_of_Ghana.svg"
                      alt="Ghana"
                      className="w-5 h-4 rounded-sm object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 font-semibold group-hover:bg-teal-500/35 transition-all duration-300">GHS</span>
                  </div>
                  <p className="text-xs text-teal-200/50 group-hover:text-teal-200/80 transition-colors duration-300">
                    T-Bills · Bonds · Unit Trusts · Money Market · GHS
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                </span>
                <span className="text-xs font-semibold text-teal-400/80">Live · GHS</span>
              </div>
            </div>
          </div>

          {/* ── BOG Policy Rate + Auction Countdown ────────────────── */}
          {(() => {
            const now = new Date();
            const day = now.getDay();
            const daysUntilFriday = day === 5 ? 7 : (5 - day + 7) % 7 || 7;
            const nextFriday = new Date(now);
            nextFriday.setDate(now.getDate() + daysUntilFriday);
            const diffMs = nextFriday.getTime() - now.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            return (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Landmark className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">BOG Policy Rate</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-black text-foreground">14.0%</p>
                      <span className="text-[10px] text-muted-foreground">May 2026 · Held</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-card border border-teal-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Next T-Bill Auction</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-black text-teal-400">{diffDays}d {diffHrs}h</p>
                      <span className="text-[10px] text-muted-foreground">Every Friday · BOG</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-card border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">T-Bills &amp; Funds Tax</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-black text-green-400">0%</p>
                      <span className="text-[10px] text-muted-foreground">Exempt · Bank FD = 8% WHT</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Live T-Bill Rates ───────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <img src="/logos/banks/bog.png" alt="Bank of Ghana" className="w-5 h-5 rounded-full object-cover" />
                Treasury Bill Rates
                <span className="text-[10px] font-normal text-muted-foreground">Bank of Ghana · updated weekly</span>
              </h3>
              <a href="https://www.bog.gov.gh/treasury-and-the-markets/treasury-bill-rates/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-400 hover:underline">View on BOG ↗</a>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { tenor: '91-Day', days: '3 months', rate: 4.83, min: 'GHS 5', via: 'TBill4ALL', color: 'text-teal-400', hoverBorder: 'hover:border-teal-400/60', glow: 'hover:shadow-teal-500/20', bar: 'bg-teal-500', border: 'border-teal-500/25', bg: 'bg-teal-500/5', radial: 'rgba(20,184,166,0.18)' },
                { tenor: '182-Day', days: '6 months', rate: 6.30, min: 'GHS 100', via: 'Any bank', color: 'text-emerald-400', hoverBorder: 'hover:border-emerald-400/60', glow: 'hover:shadow-emerald-500/20', bar: 'bg-emerald-500', border: 'border-emerald-500/25', bg: 'bg-emerald-500/5', radial: 'rgba(16,185,129,0.18)' },
                { tenor: '364-Day', days: '12 months', rate: 9.35, min: 'GHS 100', via: 'Any bank', color: 'text-green-400', hoverBorder: 'hover:border-green-400/60', glow: 'hover:shadow-green-500/20', bar: 'bg-green-500', border: 'border-green-500/25', bg: 'bg-green-500/5', radial: 'rgba(34,197,94,0.18)' },
              ].map((t, i) => (
                <div key={t.tenor}
                  className={`group relative rounded-xl border ${t.border} ${t.bg} ${t.hoverBorder} p-3.5 hover:scale-[1.03] hover:shadow-lg ${t.glow} transition-all duration-300 overflow-hidden cursor-default`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* radial glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-xl"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${t.radial}, transparent 70%)` }} />
                  {/* shine sweep */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-600 ease-in-out bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                  <div className="relative flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">{t.tenor}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> 0% TAX
                    </span>
                  </div>
                  <p className={`relative text-2xl font-black ${t.color} leading-none mb-1 group-hover:drop-shadow-[0_0_8px_currentColor] transition-all duration-300`}>{t.rate}%</p>
                  <p className="relative text-[10px] text-muted-foreground mb-2.5">{t.days} · annualised</p>
                  {/* animated rate bar */}
                  <div className="relative h-1 bg-muted/60 rounded-full mb-2.5 overflow-hidden">
                    <div className={`h-full ${t.bar} rounded-full transition-all duration-700 group-hover:opacity-100 opacity-60`}
                      style={{ width: `${(t.rate / 9.35) * 100}%` }} />
                    <div className={`absolute inset-0 ${t.bar} rounded-full opacity-0 group-hover:opacity-40 blur-sm transition-opacity duration-300`}
                      style={{ width: `${(t.rate / 9.35) * 100}%` }} />
                  </div>
                  <div className="relative border-t border-border/50 pt-2 space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">Min: <span className="text-foreground font-medium">{t.min}</span></p>
                    <p className="text-[10px] text-muted-foreground">Via: <span className="text-foreground font-medium">{t.via}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tax Comparison Callout ──────────────────────────────── */}
          <div className="bg-gradient-to-r from-green-500/10 via-teal-500/5 to-transparent border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-400 mb-1">Why T-Bills beat bank Fixed Deposits</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A 364-day T-Bill earns <strong className="text-foreground">9.35% — fully tax-free</strong>. A bank FD at ~6% loses 8% withholding tax, leaving you with just <strong className="text-foreground">~5.52% effective</strong>. T-Bills earn <span className="text-green-400 font-bold">+3.83% more</span> after tax on equal capital.
              </p>
            </div>
          </div>

          {/* ── Investment Products ─────────────────────────────────── */}
          {(() => {
            const BUY_VIA: Record<string, { name: string; logo: string }[]> = {
              'local-tbill-91':  [{ name: 'Ecobank', logo: '/logos/banks/ecobank.png' }, { name: 'GCB Bank', logo: '/logos/banks/gcb.png' }, { name: 'Bank of Ghana', logo: '/logos/banks/bog.png' }],
              'local-bond-2y':   [{ name: 'Databank', logo: '/logos/banks/databank.png' }, { name: 'GCB Bank', logo: '/logos/banks/gcb.png' }],
              'local-unit-trust':[{ name: 'Databank', logo: '/logos/banks/databank.png' }, { name: 'Ecobank', logo: '/logos/banks/ecobank.png' }],
              'local-mmf':       [{ name: 'Databank', logo: '/logos/banks/databank.png' }, { name: 'GCB Bank', logo: '/logos/banks/gcb.png' }],
            };
            return (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-400" />
                    Available Products
                    <span className="text-[10px] font-normal text-muted-foreground flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3 text-green-500" /> SEC Ghana regulated
                    </span>
                  </h3>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Invest amount (GHS):</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={localAmount}
                    onChange={(event) => setLocalAmount(event.target.value)}
                    className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Enter amount"
                  />
                  {localPositions.length > 0 && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2.5 py-1.5 rounded-lg">{localPositions.length} position{localPositions.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                {localFeedback && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />{localFeedback}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {localInvestmentAssets.map((asset: any) => {
                    const taxFree = asset.category !== 'Fixed Deposit';
                    const riskColor = asset.risk === 'Low' ? 'text-green-500 bg-green-500/10 border-green-500/20'
                      : asset.risk === 'Medium' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                      : 'text-red-500 bg-red-500/10 border-red-500/20';
                    const providers = BUY_VIA[asset.id] ?? [];
                    return (
                      <div key={asset.id} className="bg-card border border-border rounded-xl p-4 hover:border-teal-500/30 hover:shadow-md transition-all duration-200 group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-sm leading-tight">{asset.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{asset.provider} · {asset.category}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${riskColor}`}>{asset.risk} Risk</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold flex items-center gap-0.5 ${taxFree ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-orange-400 bg-orange-500/10 border-orange-500/20'}`}>
                              <ShieldCheck className="w-2.5 h-2.5" />{taxFree ? '0% Tax' : '8% WHT'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                          <div className="col-span-2 bg-muted/40 rounded-lg p-2">
                            <p className="text-muted-foreground text-[10px]">Return</p>
                            <p className="font-bold text-green-500">{asset.returnRate}</p>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-2">
                            <p className="text-muted-foreground text-[10px]">Min</p>
                            <p className="font-semibold text-[11px]">{asset.minimum}</p>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-2">
                            <p className="text-muted-foreground text-[10px]">Tenor</p>
                            <p className="font-semibold text-[11px]">{asset.tenor}</p>
                          </div>
                        </div>

                        {providers.length > 0 && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-[10px] text-muted-foreground">Buy via:</span>
                            <div className="flex items-center gap-1">
                              {providers.map((p) => (
                                <div key={p.name} title={p.name} className="w-5 h-5 rounded-full overflow-hidden bg-muted border border-border/60 flex-shrink-0">
                                  <img src={p.logo} alt={p.name} className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                </div>
                              ))}
                              <span className="text-[10px] text-muted-foreground ml-1">{providers.map(p => p.name).join(', ')}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <div className="flex gap-1.5 flex-1">
                            {Array.from(new Set([asset.minimumAmount, 500, 1000])).map((amt: number) => (
                              <button key={amt} onClick={() => openLocalConfirm(asset.id, amt)}
                                className="flex-1 py-1.5 text-[10px] rounded-lg border border-border bg-background hover:bg-accent hover:border-teal-500/40 transition-all font-medium">
                                {amt === asset.minimumAmount ? 'Min' : `GHS ${amt}`}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => openLocalConfirm(asset.id, Number(localAmount) || 0)}
                            className="px-4 py-1.5 text-xs rounded-lg bg-teal-500 hover:bg-teal-400 active:scale-95 text-white font-bold transition-all shadow-md shadow-teal-500/20"
                          >
                            Invest
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── Trusted Providers ───────────────────────────────────── */}
          <div>
            <h3 className="font-semibold text-sm mb-2.5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-400" />
              Trusted Providers
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'Databank', url: '/logos/banks/databank.png', link: 'https://www.databankgroup.com' },
                { name: 'Ecobank', url: '/logos/banks/ecobank.png', link: 'https://ecobank.com' },
                { name: 'GCB Bank', url: '/logos/banks/gcb.png', link: 'https://www.gcbbank.com.gh' },
                { name: 'Bank of Ghana', url: '/logos/banks/bog.png', link: 'https://www.bog.gov.gh' },
              ].map((p) => (
                <a key={p.name} href={p.link} target="_blank" rel="noopener noreferrer"
                  className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 hover:border-teal-500/30 hover:shadow-sm transition-all group">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{p.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* ── My Positions ────────────────────────────────────────── */}
          {localPositions.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-400" />
                My Local Investments
                <span className="text-xs text-muted-foreground font-normal">{localPositions.length} active</span>
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {localPositions.slice(0, 6).map((position: any) => (
                  <div key={position.id} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/40 border border-border/60 text-sm hover:bg-accent/60 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate">{position.name}</p>
                      <p className="text-[10px] text-muted-foreground">{position.tenor} · {position.rate}</p>
                    </div>
                    <span className="text-green-500 font-bold text-xs flex-shrink-0 ml-3">GHS {Number(position.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground/60 text-center">Rates sourced from Bank of Ghana · Updated weekly · Not investment advice</p>
        </div>
      )}

      {localConfirmModal.isOpen && (() => {
        const selectedAsset = localInvestmentAssets.find((a) => a.id === localConfirmModal.assetId);
        if (!selectedAsset) return null;
        const amt = Number(localConfirmModal.amount) || 0;
        const taxFree = selectedAsset.category !== 'Fixed Deposit';
        const BUY_VIA_MODAL: Record<string, { name: string; logo: string }[]> = {
          'local-tbill-91':  [{ name: 'Ecobank', logo: '/logos/banks/ecobank.png' }, { name: 'GCB Bank', logo: '/logos/banks/gcb.png' }],
          'local-bond-2y':   [{ name: 'Databank', logo: '/logos/banks/databank.png' }, { name: 'GCB Bank', logo: '/logos/banks/gcb.png' }],
          'local-unit-trust':[{ name: 'Databank', logo: '/logos/banks/databank.png' }, { name: 'Ecobank', logo: '/logos/banks/ecobank.png' }],
          'local-mmf':       [{ name: 'Databank', logo: '/logos/banks/databank.png' }, { name: 'GCB Bank', logo: '/logos/banks/gcb.png' }],
        };
        const providers = BUY_VIA_MODAL[selectedAsset.id] ?? [];
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-teal-500/20 rounded-2xl w-full max-w-md shadow-2xl shadow-black/40 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">

              {/* Header bar */}
              <div className="relative flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border/60">
                <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-400/80 border-r-yellow-400/30 animate-spin" style={{ animationDuration: '2.5s' }} />
                  <div className="absolute inset-[3px] rounded-full bg-teal-500/15 border border-teal-500/25 flex items-center justify-center">
                    <Landmark className="w-4.5 h-4.5 text-teal-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Confirm Investment</h3>
                  <p className="text-[11px] text-muted-foreground">Review details before placing your order</p>
                </div>
                <button
                  onClick={() => setLocalConfirmModal({ isOpen: false, assetId: '', amount: '' })}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">

                {/* Product summary card */}
                <div className="rounded-xl bg-gradient-to-br from-teal-500/8 to-transparent border border-teal-500/20 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm">{selectedAsset.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{selectedAsset.provider} · {selectedAsset.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${taxFree ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-orange-400 bg-orange-500/10 border-orange-500/20'}`}>
                      <ShieldCheck className="w-2.5 h-2.5" />{taxFree ? '0% Tax' : '8% WHT'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-background/60 rounded-lg py-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Return</p>
                      <p className="text-sm font-black text-green-400">{selectedAsset.returnRate}</p>
                    </div>
                    <div className="bg-background/60 rounded-lg py-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Tenor</p>
                      <p className="text-sm font-bold">{selectedAsset.tenor}</p>
                    </div>
                    <div className="bg-background/60 rounded-lg py-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Min</p>
                      <p className="text-sm font-bold">{selectedAsset.minimum}</p>
                    </div>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Amount (GHS)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-teal-400">GH¢</span>
                    <input
                      type="number"
                      min={selectedAsset.minimumAmount}
                      step="0.01"
                      value={localConfirmModal.amount}
                      onChange={(e) => setLocalConfirmModal((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  {/* Quick chips */}
                  <div className="flex gap-1.5 mt-2">
                    {[selectedAsset.minimumAmount, 500, 1000, 5000].map((v) => (
                      <button key={v}
                        onClick={() => setLocalConfirmModal((prev) => ({ ...prev, amount: String(v) }))}
                        className={`flex-1 py-1 text-[10px] rounded-lg border transition-all font-medium ${Number(localConfirmModal.amount) === v ? 'bg-teal-500/20 border-teal-400/50 text-teal-400' : 'border-border bg-background hover:bg-accent'}`}>
                        {v === selectedAsset.minimumAmount ? 'Min' : v >= 1000 ? `${v/1000}K` : v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Projected return */}
                {amt >= selectedAsset.minimumAmount && (
                  <div className="rounded-xl bg-green-500/8 border border-green-500/20 px-4 py-3 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Projected return at maturity</p>
                      <p className="text-sm font-black text-green-400">
                        GH¢ {(amt * (1 + parseFloat(selectedAsset.returnRate) / 100)).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0" />
                  </div>
                )}

                {/* Buy via */}
                {providers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Buy via:</span>
                    {providers.map((p) => (
                      <div key={p.name} title={p.name} className="flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5">
                        <div className="w-4 h-4 rounded-full overflow-hidden bg-background">
                          <img src={p.logo} alt={p.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <span className="text-[10px] font-medium">{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => setLocalConfirmModal({ isOpen: false, assetId: '', amount: '' })}
                    className="flex-1 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLocalInvestment}
                    className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-white text-sm font-bold transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm Invest
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {localSuccessModal.isOpen && (
        <>
          <style>{`
            @keyframes lsmPop { from{opacity:0;transform:scale(0.82) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
            @keyframes lsmConfetti {
              0%   { transform:translate(0,0) scale(0); opacity:1; }
              60%  { opacity:1; }
              100% { transform:translate(var(--dx),var(--dy)) scale(0.25); opacity:0; }
            }
            @keyframes lsmCircleDraw { from{stroke-dashoffset:166} to{stroke-dashoffset:0} }
            @keyframes lsmCheckDraw  { from{stroke-dashoffset:48}  to{stroke-dashoffset:0}  }
          `}</style>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={() => setLocalSuccessModal({ isOpen: false, name: '', amount: 0 })}
          >
            <div
              className="relative bg-[#080d1a] border border-white/12 rounded-2xl w-full max-w-sm shadow-2xl shadow-black/60 overflow-hidden"
              style={{ animation: 'lsmPop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow blobs */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-green-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-teal-500/15 blur-3xl" />

              {/* Confetti burst */}
              {(() => {
                const ANGLES = [0,45,90,135,180,225,270,315,22,67,112,247];
                const COLORS = ['#34d399','#2dd4bf','#4ade80','#86efac','#6ee7b7','#a3e635'];
                return (
                  <div className="absolute inset-0 flex items-start justify-center pt-10 pointer-events-none overflow-hidden">
                    {ANGLES.map((angle, i) => {
                      const rad = (angle * Math.PI) / 180;
                      const dist = 72 + (i % 3) * 12;
                      return (
                        <span
                          key={i}
                          className="absolute w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: COLORS[i % COLORS.length],
                            '--dx': `${Math.round(Math.sin(rad) * dist)}px`,
                            '--dy': `${Math.round(-Math.cos(rad) * dist)}px`,
                            animation: `lsmConfetti 0.7s ease-out ${(i * 0.03).toFixed(2)}s forwards`,
                          } as React.CSSProperties}
                        />
                      );
                    })}
                  </div>
                );
              })()}

              {/* Green top accent */}
              <div className="h-1.5 bg-gradient-to-r from-teal-500 via-green-400 to-emerald-500" />

              <div className="px-6 pt-6 pb-5 text-center">
                {/* Animated SVG checkmark */}
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <span className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" style={{ animationDuration: '1.8s' }} />
                  <span className="absolute inset-2 rounded-full bg-green-500/15 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.3s' }} />
                  <svg viewBox="0 0 52 52" className="relative w-20 h-20" fill="none">
                    <defs>
                      <linearGradient id="lsmGrad" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#34d399" />
                        <stop offset="1" stopColor="#2dd4bf" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="26" cy="26" r="24"
                      stroke="url(#lsmGrad)" strokeWidth="2"
                      style={{ strokeDasharray: 166, animation: 'lsmCircleDraw 0.5s ease-out forwards' }}
                    />
                    <path
                      d="M14 27l8 8 16-16"
                      stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                      style={{ strokeDasharray: 48, strokeDashoffset: 48, animation: 'lsmCheckDraw 0.4s ease-out 0.45s forwards' }}
                    />
                  </svg>
                </div>

                <h3 className="text-xl font-black mb-1 text-white">Investment Placed!</h3>
                <p className="text-white/40 text-sm mb-4">{localSuccessModal.name}</p>

                {/* Amount highlight */}
                <div className="bg-gradient-to-br from-green-500/10 to-teal-500/5 border border-green-500/20 rounded-xl px-5 py-3.5 mb-4">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Amount Invested</p>
                  <p className="text-3xl font-black text-green-400">GH¢ {localSuccessModal.amount.toLocaleString()}</p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-5 text-center">
                  {[
                    { label: 'Status', value: 'Active', color: 'text-green-400' },
                    { label: 'Tax', value: '0%', color: 'text-teal-400' },
                    { label: 'Portfolio', value: 'Updated', color: 'text-blue-400' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 border border-white/8 rounded-lg py-2">
                      <p className="text-[10px] text-white/30">{s.label}</p>
                      <p className={`text-xs font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setLocalSuccessModal({ isOpen: false, name: '', amount: 0 })}
                  className="group/cont relative w-full overflow-hidden py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-green-500 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-teal-500/20 hover:-translate-y-0.5 hover:shadow-teal-500/30"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover/cont:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                  <span className="relative">Continue</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'analysis' && (
        <div className="flex flex-col gap-3">

          {/* ── Live Market Analysis banner ─────────────────────────────────── */}
          <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#00080f] via-[#000f1f] to-[#000408] border border-cyan-500/25 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-xl hover:shadow-cyan-500/10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.14),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_60%)]" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/4 to-transparent pointer-events-none" />
            <div className="relative flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0 w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400/70 border-r-indigo-400/30 animate-spin" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-[3px] rounded-full bg-cyan-950/70 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-cyan-400 tracking-tight">Live Market Analysis</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 font-semibold">Real-time · Charts · Indicators</span>
                  </div>
                  <p className="text-xs text-cyan-200/45 mt-0.5">Click any asset in the ticker below to switch the chart instantly</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                <span className="text-xs font-semibold text-cyan-400/70 hidden sm:inline">Live</span>
              </div>
            </div>
          </div>

          {/* ── Live chart ─────────────────────────────────────────────────── */}
          <div style={{ height: 580 }}>
            <Suspense fallback={
              <div className="flex items-center justify-center h-full bg-[#080d1a] rounded-2xl border border-white/8">
                <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
              </div>
            }>
              <TradingChart initialSymbol={selectedAsset?.symbol} />
            </Suspense>
          </div>

          {/* ── Auto-scrolling asset ticker ─────────────────────────────────── */}
          {filteredCrypto.length > 0 && (() => {
            const chips = filteredCrypto.slice(0, 24);
            return (
              <div className="relative overflow-hidden rounded-xl border border-border bg-card/50">
                {/* fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card/80 to-transparent z-10 pointer-events-none" />

                <style>{`
                  @keyframes assetTicker {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                  .asset-ticker-track {
                    animation: assetTicker 35s linear infinite;
                    display: flex;
                    width: max-content;
                  }
                  .asset-ticker-track:hover { animation-play-state: paused; }
                `}</style>

                <div className="py-2 px-2">
                  <div className="asset-ticker-track gap-1.5" style={{ gap: '6px' }}>
                    {[...chips, ...chips].map((asset, i) => {
                      const isActive = selectedAsset?.id === asset.id;
                      const isPos    = (asset.change24h ?? 0) >= 0;
                      const isBrand  = asset.image?.includes('simpleicons.org') || asset.image?.includes('/logos/stocks/');
                      return (
                        <button
                          key={`${asset.id}-${i}`}
                          onClick={() => handleAssetClick(asset)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex-shrink-0 transition-all active:scale-95 ${
                            isActive
                              ? 'bg-primary/15 border-primary/40 text-primary'
                              : 'bg-background/60 border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border'
                          }`}
                          style={{ marginRight: 6 }}
                        >
                          <span className={`w-5 h-5 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${isBrand ? 'bg-white' : 'bg-gradient-to-br from-purple-500 to-blue-500'}`}>
                            {(asset.image?.startsWith('http') || asset.image?.startsWith('/')) ? (
                              <img src={asset.image} alt={asset.symbol} className={isBrand ? 'w-3.5 h-3.5 object-contain' : 'w-5 h-5 object-cover'} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : <span className="text-white text-[8px] font-bold">{asset.symbol?.slice(0, 2)}</span>}
                          </span>
                          <span>{asset.symbol}</span>
                          <span className={`text-[10px] ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                            {isPos ? '+' : ''}{formatPercent(asset.change24h)}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}


      {selectedAsset && activeTab !== 'analysis' && <AssetDetailsModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} onTrade={handleTrade} />}
      {tradeModal && <TradeModal asset={tradeModal.asset} onClose={() => setTradeModal(null)} initialType={tradeModal.type} />}
      {alertModal && <PriceAlertModal asset={alertModal} onClose={() => setAlertModal(null)} />}
      {successModal && (
        <TransactionSuccessModal
          isOpen={true}
          onClose={() => setSuccessModal(null)}
          transaction={successModal}
        />
      )}
    </div>
  );
}