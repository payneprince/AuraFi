// src/components/dashboard/TradePage.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { loadCrypto, getStocksPage, getGoldList, subscribeToCrypto } from '@/lib/marketData';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Zap,
  Star,
  AlertTriangle,
  FileText,
  BarChart3,
  ShoppingCart,
  Bell,
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import { getWatchlist, addToWatchlist, removeFromWatchlist, exportTransactionsCSV, getNotifications, addNotification, clearNotification, getPortfolio, createDCAPlan } from '@/lib/mockAPI';
import TradeHistoryAnalytics from './TradeHistoryAnalytics';
import BasketTrading from './BasketTrading';
import TransactionSuccessModal from '@/components/TransactionSuccessModal';

type TradeType = 'buy' | 'sell';
type OrderType = 'market' | 'limit';
type AssetCategory = 'crypto' | 'stocks' | 'gold';

const FALLBACK_ASSET = { id: '', name: 'Loading…', symbol: '—', price: 0, change24h: 0, image: '' };

// Mirrors the GoldBod product lineup shown on the Markets tab — same names, images, and structure.
function buildGoldBodOptions(spotList: any[]) {
  const spotGram = spotList.find((g: any) => g?.id === 'gold-spot-gram');
  const spotOunce = spotList.find((g: any) => g?.id === 'gold-spot-ounce');
  const pricePerGram = Number(spotGram?.price) || 106;
  const pricePerOunce = Number(spotOunce?.price) || 3300;
  const change24h = Number(spotGram?.change24h) || 0;
  return [
    { id: 'gold-1g-tablet', name: '1g Gold Tablet', symbol: 'GOLD-1G', price: pricePerGram, change24h, image: '/goldbod/tablet-1g.jpg' },
    { id: 'gold-5g-bar', name: '5g Gold Bar', symbol: 'GOLD-5G', price: pricePerGram * 5, change24h, image: '/goldbod/bar-5g.jpg' },
    { id: 'gold-10g-bar', name: '10g Gold Bar', symbol: 'GOLD-10G', price: pricePerGram * 10, change24h, image: '/goldbod/bar-10g.jpg' },
    { id: 'gold-etf', name: 'NewGold ETF (GLD.GH)', symbol: 'GLD.GH', price: pricePerOunce / 1.1, change24h, image: '/goldbod/newgold-etf.png' },
  ];
}

function AssetLogo({ asset, size = 32, ring }: { asset: any; size?: number; ring?: 'buy' | 'sell' | null }) {
  const image = asset?.image as string | undefined;
  const isSimpleIcon = !!image && (image.includes('simpleicons.org') || image.includes('/logos/stocks/'));
  const hasImage = !!image && (image.startsWith('http') || image.startsWith('/'));
  const ringClass = ring === 'sell'
    ? 'border-t-red-400/80 border-r-rose-400/30'
    : 'border-t-green-400/80 border-r-emerald-400/30';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {ring && (
        <div className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin ${ringClass}`} style={{ animationDuration: '2.5s' }} />
      )}
      <div className={`absolute ${ring ? 'inset-[2px]' : 'inset-0'} rounded-full flex items-center justify-center overflow-hidden ${isSimpleIcon ? 'bg-white border border-slate-200' : 'bg-gradient-to-br from-purple-500 to-blue-500'}`}>
        {hasImage ? (
          <img
            src={image}
            alt={asset?.symbol}
            className={isSimpleIcon ? 'w-2/3 h-2/3 object-contain' : 'w-full h-full object-cover'}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-white font-bold" style={{ fontSize: Math.max(size * 0.32, 9) }}>{asset?.symbol?.slice(0, 2) || '??'}</span>
        )}
      </div>
    </div>
  );
}

export default function TradePage() {
  const [activeTab, setActiveTab] = useState<'trade' | 'analytics' | 'basket'>('trade');
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('crypto');
  const [selectedAsset, setSelectedAsset] = useState<any>(FALLBACK_ASSET);
  const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);
  const [stockAssets, setStockAssets] = useState<any[]>([]);
  const [goldAssets, setGoldAssets] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [priceAlert, setPriceAlert] = useState('');
  const [alertSet, setAlertSet] = useState<string | null>(null);
  const [showDCA, setShowDCA] = useState(false);
  const [dcaAmount, setDcaAmount] = useState('100');
  const [dcaFrequency, setDcaFrequency] = useState('weekly');
  const [dcaSuccess, setDcaSuccess] = useState(false);
  const [watchlist, setWatchlist] = useState<any[]>(getWatchlist());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTransaction, setSuccessTransaction] = useState<any>(null);
  const [successBasketTransactions, setSuccessBasketTransactions] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const [holdingsValue, setHoldingsValue] = useState(0);
  const [holdingAmount, setHoldingAmount] = useState(0);
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down'>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    setNotifications(getNotifications());
    // Load the same live asset lists (with real logos) that the Markets tab uses
    Promise.all([loadCrypto(), getStocksPage(1), getGoldList()]).then(([crypto, stocks, goldSpot]) => {
      setCryptoAssets(crypto);
      setStockAssets(stocks);
      setGoldAssets(buildGoldBodOptions(goldSpot));
      setSelectedAsset((prev: any) => (prev?.id ? prev : crypto[0]));
    });
  }, []);

  // Keep crypto prices ticking live, same as the Markets tab
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
      setSelectedAsset((prev: any) =>
        prev?.symbol && livePrices[prev.symbol]
          ? { ...prev, price: livePrices[prev.symbol].price, change24h: livePrices[prev.symbol].change24h }
          : prev
      );
    });
    return unsub;
  }, []);

  const refreshBalances = () =>
    getPortfolio().then((p: any) => {
      // Read cash AFTER getPortfolio triggers reconcile so the value is accurate
      const cash = Number(localStorage.getItem('auravest_cash_balance') || '0');
      const safeCash = Number.isFinite(cash) ? cash : 0;
      setCashBalance(safeCash);
      const total = Number(p?.totalValue || 0);
      setHoldingsValue(Number(Math.max(total - safeCash, 0).toFixed(2)));
    });

  useEffect(() => {
    refreshBalances();
    window.addEventListener('storage', refreshBalances);
    const id = setInterval(refreshBalances, 15000);
    return () => { window.removeEventListener('storage', refreshBalances); clearInterval(id); };
  }, []);

  useEffect(() => {
    const holdings = JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
    setHoldingAmount(Number(holdings.find((h: any) => h?.symbol === selectedAsset?.symbol)?.amount || 0));
  }, [selectedAsset?.symbol]);

  const categories = [
    { id: 'crypto' as AssetCategory, label: 'Crypto' },
    { id: 'stocks' as AssetCategory, label: 'Stocks' },
    { id: 'gold' as AssetCategory, label: 'Gold' },
  ];

  const tabs = [
    { id: 'trade' as const, label: 'Trade', icon: Zap },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'basket' as const, label: 'Basket', icon: ShoppingCart },
  ];

  const fmtAssetPrice = (v: number) => {
    const n = Number(v) || 0;
    if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${n.toFixed(4)}`;
  };

  const getAssets = () => {
    switch (assetCategory) {
      case 'crypto':
        return cryptoAssets;
      case 'stocks':
        return stockAssets;
      case 'gold':
        return goldAssets;
      default:
        return cryptoAssets;
    }
  };

  const currentPrice = selectedAsset.price;
  const estimatedTotal = amount && !isNaN(Number(amount)) ? Number(amount) * currentPrice : 0;
  const estimatedCost = estimatedTotal * 1.001; // includes 0.1% fee
  const buyOverdraft = tradeType === 'buy' && estimatedTotal > 0 && estimatedCost > cashBalance;
  const sellOvershoot = tradeType === 'sell' && Number(amount) > 0 && Number(amount) > holdingAmount;
  const tradeInvalid = !amount || Number(amount) <= 0 || buyOverdraft || sellOvershoot;

  const toggleWatchlist = (id: string) => {
    const exists = watchlist.some(item => item.id === id);
    if (exists) {
      removeFromWatchlist(id);
      setWatchlist(watchlist.filter(item => item.id !== id));
    } else {
      addToWatchlist({ id, type: assetCategory });
      setWatchlist([...watchlist, { id, type: assetCategory }]);
    }
  };

  const executeTrade = async () => {
    setShowConfirmModal(false);
    if (!amount || Number(amount) <= 0) return;

    const tradeData = {
      type: tradeType,
      asset: selectedAsset.symbol,
      assetName: selectedAsset.name,
      amount: Number(amount),
      price: currentPrice,
      total: estimatedTotal,
    };

    const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    transactions.unshift({
      ...tradeData,
      id: `tx-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
    });
    localStorage.setItem('auravest_transactions', JSON.stringify(transactions));

    // Add notification
    addNotification({
      id: `notif-${Date.now()}`,
      type: 'trade',
      message: `${tradeType === 'buy' ? 'Bought' : 'Sold'} ${amount} ${selectedAsset.symbol} for $${estimatedTotal.toFixed(2)}`,
      timestamp: new Date().toISOString(),
    });
    setNotifications(getNotifications());

    setSuccessTransaction({
      type: tradeType,
      asset: selectedAsset.symbol,
      assetName: selectedAsset.name,
      amount: Number(amount),
      price: currentPrice,
      total: estimatedTotal,
    });
    setShowSuccessModal(true);

    const symbol = selectedAsset.symbol;
    refreshBalances().then(() => {
      // Re-read holding amount after portfolio rebuild has written fresh holdings
      const holdings = JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
      setHoldingAmount(Number(holdings.find((h: any) => h?.symbol === symbol)?.amount || 0));
    });

    setAmount('');
    setPrice('');
  };

  const clearAllNotifications = () => {
    notifications.forEach(n => clearNotification(n.id));
    setNotifications([]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trade</h1>
          <p className="text-muted-foreground">Buy and sell assets instantly</p>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-muted/30">
                <h3 className="font-bold text-sm flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-primary" />Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <Bell className="w-6 h-6 text-muted-foreground/40" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif: any) => (
                    <div key={notif.id} className="px-4 py-3 border-b border-border/60 last:border-b-0 hover:bg-muted/40 transition-colors flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{notif.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border border-border rounded-lg p-1 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'trade' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main: Asset Browser */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Browse Markets
                </h3>
                <div className="flex gap-1.5 bg-muted/50 rounded-xl p-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setAssetCategory(cat.id);
                        const assets = getAssets();
                        if (assets.length > 0) setSelectedAsset(assets[0]);
                      }}
                      className={`px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                        assetCategory === cat.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${(assetCategory === 'crypto' || assetCategory === 'stocks' || assetCategory === 'gold') ? 'max-h-[30rem] overflow-y-auto pr-1' : ''}`}>
                {getAssets().map((asset, idx) => {
                  const isSelected = selectedAsset.id === asset.id;
                  const isPositive = (asset as any).change24h >= 0;
                  const isInWatchlist = watchlist.some(w => w.id === asset.id);
                  return (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      className={`group relative p-3.5 rounded-xl border text-left transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
                        isSelected
                          ? `border-primary bg-primary/5 shadow-md ${tradeType === 'buy' ? 'ring-1 ring-green-500/30' : 'ring-1 ring-red-500/30'}`
                          : 'border-border hover:border-primary/40 hover:bg-accent/40 hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <AssetLogo asset={asset} size={36} ring={isSelected ? tradeType : null} />
                          <div>
                            <p className="font-semibold text-sm">{asset.symbol}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[100px]">{asset.name}</p>
                          </div>
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); toggleWatchlist(asset.id); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWatchlist(asset.id);
                            }
                          }}
                          className={`p-1 rounded-md cursor-pointer transition-colors focus:outline-none ${
                            isInWatchlist ? 'text-yellow-500' : 'text-muted-foreground/50 hover:text-yellow-500'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isInWatchlist ? 'fill-current' : ''}`} />
                        </span>
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <p className={`font-bold text-lg transition-colors duration-300 ${
                          priceFlash[asset.symbol] === 'up' ? 'text-green-400' :
                          priceFlash[asset.symbol] === 'down' ? 'text-red-400' : ''
                        }`}>{fmtAssetPrice(asset.price)}</p>
                        <p className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPositive ? '+' : ''}{Number((asset as any).change24h ?? 0).toFixed(2)}%
                        </p>
                      </div>
                      {isSelected && (
                        <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full ${tradeType === 'buy' ? 'bg-green-500' : 'bg-red-500'} ring-2 ring-card animate-in zoom-in-50 duration-200`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Alerts */}
            <div className="bg-card border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '80ms' }}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-yellow-500" />Price Alerts</h3>
              {alertSet ? (
                <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Alert set — we'll notify you when {selectedAsset.symbol} hits ${Number(alertSet).toLocaleString()}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={`Alert when ${selectedAsset.symbol} hits...`}
                    value={priceAlert}
                    onChange={(e) => setPriceAlert(e.target.value)}
                    className="flex-1 p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    className="px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    onClick={() => {
                      if (priceAlert) {
                        setAlertSet(priceAlert);
                        setPriceAlert('');
                        setTimeout(() => setAlertSet(null), 4500);
                      }
                    }}
                    disabled={!priceAlert}
                  >
                    Set
                  </button>
                </div>
              )}
            </div>

            {/* Account Balance */}
            <div className="bg-card border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '120ms' }}>
              <h3 className="font-semibold text-sm mb-3">Account Balance</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded-xl py-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Cash</p>
                  <p className="text-sm font-bold">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-muted/50 rounded-xl py-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Holdings</p>
                  <p className="text-sm font-bold">${holdingsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-primary/10 rounded-xl py-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Total</p>
                  <p className="text-sm font-bold text-primary">${(cashBalance + holdingsValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">Manage deposits & withdrawals from the Portfolio tab</p>
            </div>
          </div>

          {/* Sidebar: Order Ticket (sticky) */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6 self-start">
            <div className="bg-[#080d1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className={`h-1 w-full bg-gradient-to-r ${tradeType === 'buy' ? 'from-green-600 via-green-400 to-emerald-400' : 'from-red-600 via-red-400 to-rose-400'} transition-all duration-300`} />
              <div className="p-4 space-y-4">
                {/* Selected asset summary */}
                <div className="flex items-center gap-3">
                  <AssetLogo asset={selectedAsset} size={42} ring={tradeType} />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{selectedAsset.name}</p>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-muted-foreground">{fmtAssetPrice(currentPrice)}</span>
                      <span className={`flex items-center gap-0.5 font-semibold ${selectedAsset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {selectedAsset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {selectedAsset.change24h >= 0 ? '+' : ''}{Number(selectedAsset.change24h ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {holdingAmount > 0 && (
                    <div className="ml-auto text-right">
                      <p className="text-[9px] text-muted-foreground">Holding</p>
                      <p className="text-xs font-semibold">{holdingAmount.toLocaleString('en-US', { maximumFractionDigits: 4 })}</p>
                    </div>
                  )}
                </div>

                {/* Buy/Sell toggle */}
                <div className="grid grid-cols-2 gap-2 bg-black/30 rounded-xl p-1.5 border border-white/8">
                  <button
                    onClick={() => setTradeType('buy')}
                    className={`relative overflow-hidden py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
                      tradeType === 'buy'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/40 scale-[1.02]'
                        : 'text-white/40 hover:text-white/70 hover:bg-green-500/10'
                    }`}
                  >
                    {tradeType === 'buy' && <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />}
                    <span className="relative flex items-center justify-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />Buy
                    </span>
                  </button>
                  <button
                    onClick={() => setTradeType('sell')}
                    className={`relative overflow-hidden py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
                      tradeType === 'sell'
                        ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/40 scale-[1.02]'
                        : 'text-white/40 hover:text-white/70 hover:bg-red-500/10'
                    }`}
                  >
                    {tradeType === 'sell' && <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />}
                    <span className="relative flex items-center justify-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5" />Sell
                    </span>
                  </button>
                </div>

                {/* Order Type */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrderType('market')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      orderType === 'market' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> Market
                  </button>
                  <button
                    onClick={() => setOrderType('limit')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      orderType === 'limit' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Limit
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Amount ({selectedAsset.symbol})</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow focus:shadow-md"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[0.25, 0.5, 0.75, 1].map((pct) => {
                      const base = tradeType === 'buy' ? (currentPrice > 0 ? cashBalance / currentPrice : 0) : holdingAmount;
                      const value = Number((base * pct).toFixed(currentPrice >= 1 ? 4 : 6));
                      const label = pct === 1 ? 'Max' : `${pct * 100}%`;
                      return (
                        <button
                          key={label}
                          onClick={() => setAmount(value > 0 ? String(value) : '')}
                          disabled={base <= 0}
                          className={`flex-1 py-1.5 text-[10px] rounded-lg border font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                            amount && Number(amount) === value
                              ? (tradeType === 'buy'
                                  ? 'bg-green-500/20 border-green-400/60 text-green-400 shadow-sm shadow-green-500/20 scale-[1.06]'
                                  : 'bg-red-500/20 border-red-400/60 text-red-400 shadow-sm shadow-red-500/20 scale-[1.06]')
                              : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 hover:-translate-y-0.5'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {tradeType === 'buy'
                      ? `Available: $${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `Holding: ${holdingAmount.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${selectedAsset.symbol}`}
                  </p>
                </div>

                {orderType === 'limit' && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-xs font-medium mb-1 block">Limit Price (USD)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={currentPrice.toString()}
                      className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                {assetCategory === 'crypto' && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-xs font-medium mb-1 block">Slippage Tolerance (%)</label>
                    <div className="flex gap-2">
                      {['0.1', '0.5', '1.0'].map(val => (
                        <button
                          key={val}
                          onClick={() => setSlippage(val)}
                          className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                            slippage === val
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border hover:bg-accent'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {estimatedTotal > 0 && (
                  <div className={`rounded-xl border px-3.5 py-2.5 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200 ${tradeType === 'buy' ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Estimated Total</span>
                      <span className="font-semibold text-sm">${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Fee (0.1%)</span>
                      <span className="font-semibold text-sm">${(estimatedTotal * 0.001).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-border/60 font-bold text-sm">
                      <span>You {tradeType === 'buy' ? 'Pay' : 'Receive'}</span>
                      <span className={tradeType === 'buy' ? 'text-red-500' : 'text-green-500'}>
                        {tradeType === 'buy' ? '-' : '+'}${(estimatedTotal + estimatedTotal * 0.001).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {buyOverdraft && (
                  <p className="text-[11px] text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    Insufficient cash — available: ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                {sellOvershoot && (
                  <p className="text-[11px] text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    Exceeds holding — available: {holdingAmount.toLocaleString('en-US', { maximumFractionDigits: 6 })} {selectedAsset.symbol}
                  </p>
                )}
                <button
                  onClick={() => { if (!tradeInvalid) setShowConfirmModal(true); }}
                  disabled={tradeInvalid}
                  className={`group/rev relative w-full overflow-hidden py-3 rounded-xl font-bold text-sm text-white transition-all hover:shadow-lg active:scale-[0.98] hover:-translate-y-0.5 ${
                    tradeType === 'buy'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-green-500/35 disabled:from-green-600/50 disabled:to-emerald-500/50'
                      : 'bg-gradient-to-r from-red-600 to-rose-500 hover:shadow-red-500/35 disabled:from-red-600/50 disabled:to-rose-500/50'
                  } disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0`}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover/rev:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                  <span className="relative flex items-center justify-center gap-2">
                    {tradeType === 'buy' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    Review {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2 animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: '60ms' }}>
              <h3 className="font-semibold text-sm mb-1">Quick Actions</h3>
              <button
                className="w-full py-2 text-sm bg-purple-500/10 text-purple-500 font-medium rounded-lg hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1.5"
                onClick={() => setShowDCA(true)}
              >
                <Zap className="w-3.5 h-3.5" />
                Set Up DCA
              </button>
              <button
                className="w-full py-2 text-sm bg-muted text-muted-foreground font-medium rounded-lg hover:bg-muted/70 transition-colors flex items-center justify-center gap-1.5"
                onClick={() => {
                  const url = exportTransactionsCSV();
                  if (url) {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `auravest-transactions.csv`;
                    link.click();
                  }
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                Export History
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <TradeHistoryAnalytics />}

      {activeTab === 'basket' && (
        <BasketTrading
          onBasketSuccess={(transactions) => {
            setSuccessBasketTransactions(transactions);
            setShowSuccessModal(true);
          }}
        />
      )}

      {/* Trade Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setShowConfirmModal(false)}>
          <style>{`
            @keyframes tradeModalPop { from{opacity:0;transform:scale(0.82) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
          `}</style>
          <div
            className="bg-[#080d1a] border border-white/12 rounded-2xl w-full max-w-sm shadow-2xl shadow-black/60 overflow-hidden"
            style={{ animation: 'tradeModalPop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent */}
            <div className={`h-1 w-full ${tradeType === 'buy' ? 'bg-gradient-to-r from-green-600 via-green-400 to-emerald-400' : 'bg-gradient-to-r from-red-600 via-red-400 to-rose-400'}`} />

            {/* Header */}
            <div className="relative flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/8">
              <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full blur-2xl opacity-20" style={{ background: tradeType === 'buy' ? '#22c55e' : '#ef4444' }} />
              <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                <div className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin ${tradeType === 'buy' ? 'border-t-green-400/80 border-r-emerald-400/30' : 'border-t-red-400/80 border-r-rose-400/30'}`} style={{ animationDuration: '2.5s' }} />
                <div className={`absolute inset-[3px] rounded-full flex items-center justify-center ${tradeType === 'buy' ? 'bg-green-500/15 border border-green-500/25' : 'bg-red-500/15 border border-red-500/25'}`}>
                  {tradeType === 'buy' ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                </div>
              </div>
              <div className="relative">
                <h3 className="font-bold text-base leading-tight text-white">Confirm {tradeType === 'buy' ? 'Buy' : 'Sell'} Order</h3>
                <p className="text-[11px] text-white/40">Review details before submitting</p>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all hover:rotate-90 duration-200"
              >
                <X className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">

              {/* Asset summary card */}
              <div className={`rounded-xl p-4 border ${tradeType === 'buy' ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <AssetLogo asset={selectedAsset} size={36} />
                  <div>
                    <p className="font-bold text-sm text-white">{selectedAsset.name}</p>
                    <p className="text-[11px] text-white/40">{selectedAsset.symbol} · {orderType === 'market' ? 'Market' : 'Limit'} order</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white/5 rounded-lg py-2">
                    <p className="text-[10px] text-white/30 mb-0.5">Amount</p>
                    <p className="text-sm font-black text-white">{Number(amount).toLocaleString()} {selectedAsset.symbol}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg py-2">
                    <p className="text-[10px] text-white/30 mb-0.5">Price</p>
                    <p className="text-sm font-bold text-white">${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>

              {/* Order breakdown */}
              <div className="space-y-2 bg-white/5 border border-white/8 rounded-xl p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Est. Total</span>
                  <span className="font-semibold text-white/80">${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Fee (0.1%)</span>
                  <span className="font-semibold text-white/80">${(estimatedTotal * 0.001).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/8 font-bold">
                  <span className="text-white">You {tradeType === 'buy' ? 'Pay' : 'Receive'}</span>
                  <span className={tradeType === 'buy' ? 'text-red-400' : 'text-green-400'}>
                    {tradeType === 'buy' ? '-' : '+'}${(estimatedTotal + estimatedTotal * 0.001).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={executeTrade}
                  disabled={tradeInvalid}
                  className={`group/confirm relative flex-1 overflow-hidden py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
                    tradeType === 'buy'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-500 shadow-green-500/30'
                      : 'bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/30'
                  }`}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover/confirm:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                  <CheckCircle className="relative w-4 h-4" />
                  <span className="relative">Confirm {tradeType === 'buy' ? 'Buy' : 'Sell'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setSuccessTransaction(null);
          setSuccessBasketTransactions([]);
        }}
        transaction={successTransaction}
        basketTransactions={successBasketTransactions}
      />

      {/* DCA Modal */}
      {showDCA && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => { setShowDCA(false); setDcaSuccess(false); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
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
                  <h3 className="font-bold text-base">DCA Plan Created</h3>
                  <p className="text-sm text-muted-foreground mt-1">${dcaAmount} in {selectedAsset.symbol} · {dcaFrequency}</p>
                </div>
                <button
                  onClick={() => { setShowDCA(false); setDcaSuccess(false); }}
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
                    onClick={() => setShowDCA(false)}
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
                          key={`dca-amt-${v}`}
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
                      value={selectedAsset.id}
                      onChange={(e) => {
                        const asset = getAssets().find(a => a.id === e.target.value);
                        if (asset) setSelectedAsset(asset);
                      }}
                      className="w-full p-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                    >
                      {getAssets().map(asset => (
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
                      onClick={() => setShowDCA(false)}
                      className="flex-1 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        createDCAPlan({
                          asset: selectedAsset.symbol,
                          assetName: selectedAsset.name,
                          amount: Number(dcaAmount),
                          frequency: dcaFrequency,
                          startDate: new Date().toISOString(),
                          active: true,
                        });
                        setDcaSuccess(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 active:scale-95 text-white text-sm font-bold transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
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
    </div>
  );
}
