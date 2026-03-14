'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import {
  startCryptoWebSocket,
  subscribeToCrypto,
  getCryptoPage,
  getStocksPage,
  getGoldList,
  getNFTList,
} from '@/lib/marketData';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/mockAPI';
import TradeModal from '@/components/TradeModal';
import AssetDetailsModal from '@/components/AssetDetailsModal';
import PriceAlertModal from '@/components/PriceAlertModal';
import TechnicalAnalysisChart from '@/components/TechnicalAnalysisChart';
import TransactionSuccessModal from '@/components/TransactionSuccessModal';

type AssetTab = 'crypto' | 'stocks' | 'gold' | 'nfts' | 'local' | 'analysis';

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<AssetTab>('crypto');
  const [stocksView, setStocksView] = useState<'local' | 'international'>('local');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Pagination
  const [cryptoPage, setCryptoPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreCrypto, setHasMoreCrypto] = useState(true);
  const [hasMoreStocks, setHasMoreStocks] = useState(true);

  // Live data
  const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);
  const [stockAssets, setStockAssets] = useState<any[]>([]);
  const [goldAssets, setGoldAssets] = useState<any[]>([]);
  const [nftAssets, setNftAssets] = useState<any[]>([]);
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

  // Subscribe to live crypto
  useEffect(() => {
    const unsub = subscribeToCrypto((livePrices) => {
      setCryptoAssets((prev) =>
        prev.map((asset) => ({
          ...asset,
          price: livePrices[asset.symbol]?.price ?? asset.price,
          change24h: livePrices[asset.symbol]?.change24h ?? asset.change24h,
        }))
      );
    });
    return unsub;
  }, []);

  // Load initial assets
  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [crypto, stocks, gold, nfts] = await Promise.all([
        getCryptoPage(1),
        getStocksPage(1),
        getGoldList(),
        getNFTList(),
      ]);

      setCryptoAssets(crypto);
      setStockAssets(stocks);
      setGoldAssets(gold);
      setNftAssets(nfts);
      setCryptoPage(2);
      setStockPage(2);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

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

  // Load more stocks
  const loadMoreStocks = useCallback(() => {
    if (!hasMoreStocks || isLoading) return;
    setIsLoading(true);
    getStocksPage(stockPage).then((newAssets) => {
      if (newAssets.length === 0) {
        setHasMoreStocks(false);
      } else {
        setStockAssets((prev) => [...prev, ...newAssets]);
        setStockPage((p) => p + 1);
      }
      setIsLoading(false);
    });
  }, [stockPage, hasMoreStocks, isLoading]);

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

  const filteredCrypto = cryptoAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredStocks = stockAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredGhanaStocks = ghanaStockAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCrypto.length > 0 ? (
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                        {crypto.image}
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
                          <p className="font-semibold">${crypto.price.toLocaleString()}</p>
                          <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {formatPercent(crypto.change24h)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No crypto assets found for "{searchQuery}"
              </div>
            )}
          </div>

          {!hasMoreCrypto && cryptoAssets.length > 0 && (
            <div className="text-center text-muted-foreground text-sm">All crypto assets loaded.</div>
          )}

          {hasMoreCrypto && (
            <button
              onClick={loadMoreCrypto}
              disabled={isLoading}
              className="w-full py-2 border border-dashed border-border rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
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
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center text-white">
                    🇬🇭
                  </div>
                  <h3 className="font-semibold text-sm">Ghana Stocks (GSE)</h3>
                </div>
                <p className="text-xs text-muted-foreground">Local Ghana equity listings priced in GHS.</p>
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
                          <p className="font-semibold">GHS {stock.price.toLocaleString()}</p>
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
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                            {stock.image}
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
                            <p className="font-semibold">${stock.price.toLocaleString()}</p>
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

              {!hasMoreStocks && stockAssets.length > 0 && (
                <div className="text-center text-muted-foreground text-sm">All stocks loaded.</div>
              )}

              {hasMoreStocks && (
                <button
                  onClick={loadMoreStocks}
                  disabled={isLoading}
                  className="w-full py-2 border border-dashed border-border rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'gold' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                🥇
              </div>
              <h3 className="font-semibold text-sm">Gold Investment Options</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose from physical gold, digital gold, and gold-backed ETFs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goldAssets.map((gold) => {
              const isPositive = typeof gold.change24h === 'number' && gold.change24h >= 0;
              return (
                <div
                  key={gold.id}
                  onClick={() => handleAssetClick(gold)}
                  className="bg-card border border-border rounded-lg p-4 hover:bg-accent transition-all hover:scale-105 cursor-pointer animate-fadeIn"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-lg">
                        {gold.image}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{gold.name}</p>
                        <p className="text-xs text-muted-foreground">{gold.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${gold.price.toLocaleString()}</p>
                      <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercent(gold.change24h)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{gold.type}</span>
                    <span>{gold.purity} • {gold.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'nfts' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                🎨
              </div>
              <h3 className="font-semibold text-sm">NFT Collections</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Explore top NFT collections with real-time floor prices and trading volumes
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {nftAssets.map((nft) => {
              const isPositive = typeof nft.change24h === 'number' && nft.change24h >= 0;
              return (
                <div
                  key={nft.id}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all hover:scale-105 cursor-pointer animate-fadeIn"
                >
                  <div className="h-32 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white font-bold text-4xl hidden">
                      {nft.symbol.slice(0, 2)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-1">{nft.name}</h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Floor Price</span>
                        <span className="font-medium">{nft.price} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">24h Volume</span>
                        <span className="font-medium">{(nft.volume24h / 1000000).toFixed(1)}M ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Change</span>
                        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                          {formatPercent(nft.change24h)}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssetClick(nft);
                      }}
                      className="mt-3 w-full py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-magenta-500 to-teal-500 flex items-center justify-center text-white">
                🇬🇭
              </div>
              <h3 className="font-semibold text-sm">Ghana Local Investment Products</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Treasury bills, government bonds, unit trusts, and money market options in GHS
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Amount to invest (GHS)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={localAmount}
                  onChange={(event) => setLocalAmount(event.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="Enter amount"
                />
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">My Local Positions</p>
                <p className="text-xl font-bold">{localPositions.length}</p>
              </div>
            </div>

            {localFeedback && <p className="text-xs text-green-600 mt-3">{localFeedback}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localInvestmentAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-card border border-border rounded-lg p-4 hover:bg-accent transition-all hover:scale-105 animate-fadeIn"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.provider} • {asset.category}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{asset.risk} Risk</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Minimum</p>
                    <p className="font-medium">{asset.minimum}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tenor</p>
                    <p className="font-medium">{asset.tenor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Indicative Return</p>
                    <p className="font-semibold text-green-500">{asset.returnRate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Liquidity</p>
                    <p className="font-medium">{asset.liquidity}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button
                    onClick={() => openLocalConfirm(asset.id, asset.minimumAmount)}
                    className="px-2 py-2 text-xs rounded-lg border border-border bg-background"
                  >
                    Min
                  </button>
                  <button
                    onClick={() => openLocalConfirm(asset.id, 500)}
                    className="px-2 py-2 text-xs rounded-lg border border-border bg-background"
                  >
                    GHS 500
                  </button>
                  <button
                    onClick={() => openLocalConfirm(asset.id, 1000)}
                    className="px-2 py-2 text-xs rounded-lg border border-border bg-background"
                  >
                    GHS 1000
                  </button>
                </div>

                <button
                  onClick={() => openLocalConfirm(asset.id, Number(localAmount) || 0)}
                  className="w-full mt-2 px-3 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold"
                >
                  Buy
                </button>
              </div>
            ))}
          </div>

          {localPositions.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-semibold mb-3">My Local Investments</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {localPositions.slice(0, 6).map((position) => (
                  <div key={position.id} className="p-3 rounded-lg bg-accent/50 border border-border text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{position.name}</span>
                      <span className="text-green-600 font-semibold">GHS {position.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{position.tenor}</span>
                      <span>{position.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">All rates are illustrative for demo use and not investment advice.</p>
        </div>
      )}

      {localConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setLocalConfirmModal({ isOpen: false, assetId: '', amount: '' })}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const selectedAsset = localInvestmentAssets.find((asset) => asset.id === localConfirmModal.assetId);
              if (!selectedAsset) return null;

              return (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Confirm Local Investment</h3>
                    <p className="text-sm text-muted-foreground">Review details before placing your order.</p>
                  </div>

                  <div className="rounded-lg border border-border bg-accent/40 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product</span>
                      <span className="font-medium">{selectedAsset.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum</span>
                      <span>GHS {selectedAsset.minimumAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Amount (GHS)</label>
                    <input
                      type="number"
                      min={selectedAsset.minimumAmount}
                      step="0.01"
                      value={localConfirmModal.amount}
                      onChange={(event) => setLocalConfirmModal((prev) => ({ ...prev, amount: event.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setLocalConfirmModal({ isOpen: false, assetId: '', amount: '' })}
                      className="flex-1 px-3 py-2 rounded-lg border border-border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmLocalInvestment}
                      className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
                    >
                      Confirm Buy
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {localSuccessModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 text-center relative">
            <button
              onClick={() => setLocalSuccessModal({ isOpen: false, name: '', amount: 0 })}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Investment Successful</h3>
            <p className="text-sm text-muted-foreground mt-1">GHS {localSuccessModal.amount.toLocaleString()} placed in {localSuccessModal.name}.</p>

            <button
              onClick={() => setLocalSuccessModal({ isOpen: false, name: '', amount: 0 })}
              className="mt-4 w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-4">
          {selectedAsset ? (
            <TechnicalAnalysisChart asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
          ) : (
            <>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-sm">Technical Analysis</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select an asset below to view detailed technical analysis with charts and indicators
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...filteredCrypto, ...filteredStocks].length > 0 ? (
                  [...filteredCrypto, ...filteredStocks].map((asset) => {
                    const isPositive = typeof asset.change24h === 'number' && asset.change24h >= 0;
                    const isInWatchlist = watchlist.some((w) => w.id === asset.id);
                    const isCrypto = filteredCrypto.includes(asset);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => handleAssetClick(asset)}
                        className="bg-card border border-border rounded-lg p-4 hover:bg-accent transition-all hover:scale-105 cursor-pointer animate-fadeIn"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                              isCrypto ? 'from-purple-500 to-blue-500' : 'from-blue-500 to-cyan-500'
                            } flex items-center justify-center text-white font-bold text-lg`}>
                              {asset.image}
                            </div>
                            <div>
                              <p className="font-semibold">{asset.name}</p>
                              <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatchlist(asset.id, isCrypto ? 'crypto' : 'stocks');
                              }}
                              className={`p-1 rounded cursor-pointer ${
                                isInWatchlist ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                            </span>
                            <div className="text-right">
                              <p className="font-semibold">${asset.price.toLocaleString()}</p>
                              <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {formatPercent(asset.change24h)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No assets found for "{searchQuery}"
                  </div>
                )}
              </div>
            </>
          )}
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