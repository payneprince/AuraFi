// src/components/dashboard/TradePage.tsx
'use client';

import { useState, useEffect } from 'react';
import { cryptoAssets, stockAssets, goldData } from '@/lib/mockData';
import { getGoldList } from '@/lib/marketData';
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
  X
} from 'lucide-react';
import { getWatchlist, addToWatchlist, removeFromWatchlist, exportTransactionsCSV, getNotifications, addNotification, clearNotification } from '@/lib/mockAPI';
import DCAModal from '@/components/DCAModal';
import PriceAlertModal from '@/components/PriceAlertModal';
import TradeHistoryAnalytics from './TradeHistoryAnalytics';
import BasketTrading from './BasketTrading';
import TransactionSuccessModal from '@/components/TransactionSuccessModal';

type TradeType = 'buy' | 'sell';
type OrderType = 'market' | 'limit';
type AssetCategory = 'crypto' | 'stocks' | 'gold';

export default function TradePage() {
  const [activeTab, setActiveTab] = useState<'trade' | 'analytics' | 'basket'>('trade');
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('crypto');
  const [selectedAsset, setSelectedAsset] = useState<any>(cryptoAssets[0]);
  const [goldAssets, setGoldAssets] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [priceAlert, setPriceAlert] = useState('');
  const [showDCA, setShowDCA] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [dcaAmount, setDcaAmount] = useState('100');
  const [dcaFrequency, setDcaFrequency] = useState('weekly');
  const [watchlist, setWatchlist] = useState<any[]>(getWatchlist());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTransaction, setSuccessTransaction] = useState<any>(null);
  const [successBasketTransactions, setSuccessBasketTransactions] = useState<any[]>([]);

  useEffect(() => {
    setNotifications(getNotifications());
    // Load gold assets
    getGoldList().then(setGoldAssets);
  }, []);

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

  const handleTrade = async () => {
    if (!amount || Number(amount) <= 0) {
      alert('Invalid Amount: Please enter a valid amount');
      return;
    }

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

    // Show success modal instead of alert
    setSuccessTransaction({
      type: tradeType,
      asset: selectedAsset.symbol,
      assetName: selectedAsset.name,
      amount: Number(amount),
      price: currentPrice,
      total: estimatedTotal,
    });
    setShowSuccessModal(true);

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
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif: any) => (
                    <div key={notif.id} className="p-3 border-b border-border last:border-b-0 hover:bg-muted/50">
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trading Form */}
          <div className="space-y-6">
          {/* Trade Type Toggle */}
          <div className="bg-card border border-border rounded-lg p-2 flex gap-2">
            <button
              onClick={() => setTradeType('buy')}
              className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-colors ${
                tradeType === 'buy'
                  ? 'bg-green-500 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTradeType('sell')}
              className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-colors ${
                tradeType === 'sell'
                  ? 'bg-red-500 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Asset Category */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-3">Asset Category</h3>
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setAssetCategory(cat.id);
                    const assets = getAssets();
                    if (assets.length > 0) {
                      setSelectedAsset(assets[0]);
                    }
                  }}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    assetCategory === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Order Type */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-3">Order Type</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderType('market')}
                className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                  orderType === 'market'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium text-sm">Market</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Current price</p>
              </button>
              <button
                onClick={() => setOrderType('limit')}
                className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                  orderType === 'limit'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium text-sm">Limit</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Set price</p>
              </button>
            </div>
          </div>

          {/* Trade Inputs */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Amount ({selectedAsset.symbol})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {orderType === 'limit' && (
              <div>
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
              <div>
                <label className="text-xs font-medium mb-1 block">Slippage Tolerance (%)</label>
                <div className="flex gap-2">
                  {['0.1', '0.5', '1.0'].map(val => (
                    <button
                      key={val}
                      onClick={() => setSlippage(val)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg ${
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

            <div className="bg-muted rounded-lg p-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Estimated Total</span>
                <span className="font-medium text-sm">${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Fee (0.1%)</span>
                <span className="font-medium text-sm">${(estimatedTotal * 0.001).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              onClick={handleTrade}
              disabled={!amount}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-colors ${
                tradeType === 'buy'
                  ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-500/50'
                  : 'bg-red-500 hover:bg-red-600 disabled:bg-red-500/50'
              } disabled:cursor-not-allowed`}
            >
              {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.symbol}
            </button>
          </div>

          {/* Asset Selection */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-3">Select Asset</h3>
            <div className={`grid grid-cols-2 gap-3 ${(assetCategory === 'crypto' || assetCategory === 'stocks' || assetCategory === 'gold') ? 'max-h-64 overflow-y-auto' : ''}`}>
              {getAssets().map((asset) => {
                const isSelected = selectedAsset.id === asset.id || (assetCategory === 'gold' && asset.id === 'gold');
                const isPositive = (asset as any).change24h >= 0;
                const isInWatchlist = watchlist.some(w => w.id === asset.id);
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{asset.image}</span>
                        <div>
                          <p className="font-medium text-sm">{asset.symbol}</p>
                          <p className="text-xs text-muted-foreground">{asset.name}</p>
                        </div>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(asset.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWatchlist(asset.id);
                          }
                        }}
                        className={`p-0.5 rounded cursor-pointer focus:outline-none ${
                          isInWatchlist ? 'text-yellow-500' : 'text-muted-foreground'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${isInWatchlist ? 'fill-current' : ''}`} />
                      </span>
                    </div>
                    <p className="font-bold text-lg mt-1">${(asset.price || (asset as any).pricePerGram)?.toLocaleString()}</p>
                    <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{(asset as any).change24h}%
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Alert */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-3">Price Alerts</h3>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={`Alert when ${selectedAsset.symbol} hits...`}
                value={priceAlert}
                onChange={(e) => setPriceAlert(e.target.value)}
                className="flex-1 p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                className="px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                onClick={() => {
                  if (priceAlert) {
                    alert(`🔔 Alert set: ${selectedAsset.symbol} @ $${priceAlert}`);
                    setPriceAlert('');
                  }
                }}
                disabled={!priceAlert}
              >
                Set
              </button>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="space-y-6">
          {/* Current Selection */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-3">Current Selection</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Asset</p>
                <p className="font-semibold">{selectedAsset.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                <p className="text-xl font-bold">${currentPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">24h Change</p>
                <p className={`font-semibold ${selectedAsset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h}%
                </p>
              </div>
            </div>
          </div>

          {/* Account Balance */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-3">Account Balance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Available USD</span>
                <span className="font-medium">$45,230.50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reserved</span>
                <span className="font-medium">$5,420.00</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between">
                <span className="text-sm font-medium">Total Balance</span>
                <span className="font-bold">$50,650.50</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <button className="w-full py-2 text-sm bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20">
              Fund from PayneBank
            </button>
            <button
              className="w-full py-2 text-sm bg-purple-500/10 text-purple-500 font-medium rounded-lg hover:bg-purple-500/20"
              onClick={() => setShowDCA(true)}
            >
              <Zap className="w-3 h-3 inline mr-1" />
              Set Up DCA
            </button>
            <button
              className="w-full py-2 text-sm bg-muted text-muted-foreground font-medium rounded-lg hover:bg-muted/70"
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
              <FileText className="w-3 h-3 inline mr-1" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md">
            <div className="p-4">
              <h3 className="text-lg font-bold mb-3">Recurring Investment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Invest automatically to reduce timing risk
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Amount (USD)</label>
                  <input
                    type="number"
                    value={dcaAmount}
                    onChange={(e) => setDcaAmount(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Asset</label>
                  <select
                    value={selectedAsset.id}
                    onChange={(e) => {
                      const asset = getAssets().find(a => a.id === e.target.value);
                      if (asset) setSelectedAsset(asset);
                    }}
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {getAssets().map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Frequency</label>
                  <select
                    value={dcaFrequency}
                    onChange={(e) => setDcaFrequency(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 py-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/70"
                  onClick={() => setShowDCA(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90"
                  onClick={() => {
                    alert(`✅ DCA set: $${dcaAmount} in ${selectedAsset.symbol} ${dcaFrequency}`);
                    setShowDCA(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
