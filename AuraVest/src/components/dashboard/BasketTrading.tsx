'use client';

import { useState, useEffect, useMemo } from 'react';
import { loadCrypto, getStocksPage, getGoldList } from '@/lib/marketData';
import { executeBasketTrade, addNotification, getPortfolio } from '@/lib/mockAPI';
import { Plus, Minus, ShoppingCart, Percent, AlertTriangle, CheckCircle, Search, ShoppingBasket, Sparkles, ChevronDown } from 'lucide-react';

type AssetCategory = 'crypto' | 'stocks' | 'gold';

// Mirrors the GoldBod product lineup shown on the Markets tab — same names, images, and structure.
function buildGoldBodOptions(spotList: any[]) {
  const spotGram = spotList.find((g: any) => g?.id === 'gold-spot-gram');
  const spotOunce = spotList.find((g: any) => g?.id === 'gold-spot-ounce');
  const pricePerGram = Number(spotGram?.price) || 106;
  const pricePerOunce = Number(spotOunce?.price) || 3300;
  const change24h = Number(spotGram?.change24h) || 0;
  return [
    { id: 'gold-1g-tablet', name: '1g Gold Tablet', symbol: 'GOLD-1G', price: pricePerGram, change24h, image: '/goldbod/tablet-1g.jpg' },
    { id: 'gold-5g-tablet', name: '5g Gold Tablet', symbol: 'GOLD-5G', price: pricePerGram * 5, change24h, image: '/goldbod/bar-5g.jpg' },
    { id: 'gold-10g-tablet', name: '10g Gold Tablet', symbol: 'GOLD-10G', price: pricePerGram * 10, change24h, image: '/goldbod/bar-10g.jpg' },
    { id: 'gold-31g-tablet', name: '31g Gold Tablet', symbol: 'GOLD-31G', price: pricePerGram * 31, change24h, image: '/goldbod/tablet-1g.jpg' },
  ];
}

function AssetLogo({ asset, size = 32 }: { asset: any; size?: number }) {
  const image = asset?.image as string | undefined;
  const isSimpleIcon = !!image && (image.includes('simpleicons.org') || image.includes('/logos/stocks/'));
  const hasImage = !!image && (image.startsWith('http') || image.startsWith('/'));
  return (
    <div
      className={`flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${isSimpleIcon ? 'bg-white border border-slate-200' : 'bg-gradient-to-br from-purple-500 to-blue-500'}`}
      style={{ width: size, height: size }}
    >
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
  );
}

const CATEGORY_META: Record<AssetCategory, { label: string; dot: string }> = {
  crypto: { label: 'Crypto', dot: 'bg-orange-400' },
  stocks: { label: 'Stocks', dot: 'bg-blue-400' },
  gold: { label: 'Gold', dot: 'bg-yellow-400' },
};

export default function BasketTrading({ onBasketSuccess }: { onBasketSuccess?: (transactions: any[]) => void }) {
  const [basket, setBasket] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState('');
  const [allocationMode, setAllocationMode] = useState<'equal' | 'custom'>('equal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);
  const [stockAssets, setStockAssets] = useState<any[]>([]);
  const [goldAssets, setGoldAssets] = useState<any[]>([]);
  const [pickerCategory, setPickerCategory] = useState<AssetCategory>('crypto');
  const [search, setSearch] = useState('');
  const [bounce, setBounce] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);

  useEffect(() => {
    // Load the same live asset lists (with real logos) that the Markets tab uses
    Promise.all([loadCrypto(), getStocksPage(1), getGoldList()]).then(([crypto, stocks, goldSpot]) => {
      setCryptoAssets(crypto);
      setStockAssets(stocks);
      setGoldAssets(buildGoldBodOptions(goldSpot));
    });
    // Load cash balance (triggers portfolio rebuild so the value is reconciled)
    getPortfolio().then(() => {
      const cash = Number(localStorage.getItem('auravest_cash_balance') || '0');
      setCashBalance(Number.isFinite(cash) ? cash : 0);
    });
  }, []);

  const assetsByCategory: Record<AssetCategory, any[]> = {
    crypto: cryptoAssets,
    stocks: stockAssets,
    gold: goldAssets,
  };

  const filteredPickerAssets = useMemo(() => {
    const list = assetsByCategory[pickerCategory] || [];
    const q = search.trim().toLowerCase();
    const matched = q
      ? list.filter((a: any) => a.symbol?.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q))
      : list;
    return matched.slice(0, 8);
  }, [pickerCategory, search, cryptoAssets, stockAssets, goldAssets]);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const addToBasket = (asset: any, category: AssetCategory) => {
    if (basket.find(item => item.asset.id === asset.id)) return;

    setBasket([...basket, {
      asset,
      category,
      amount: 0,
      percentage: 0,
    }]);
    setBounce((b) => b + 1);
  };

  const removeFromBasket = (assetId: string) => {
    setBasket(basket.filter(item => item.asset.id !== assetId));
  };

  const updateBasketItem = (assetId: string, field: 'amount' | 'percentage', value: number) => {
    setBasket(basket.map(item =>
      item.asset.id === assetId
        ? { ...item, [field]: value }
        : item
    ));
  };

  const applyAllocation = () => {
    if (allocationMode === 'equal') {
      const percentage = 100 / basket.length;
      setBasket(basket.map(item => ({ ...item, percentage })));
    }
  };

  const resolveItemAmount = (item: any) => {
    if (allocationMode === 'custom' && item.percentage > 0 && totalAmount) {
      return (parseFloat(totalAmount) * item.percentage / 100) / item.asset.price;
    }
    if (allocationMode === 'equal' && totalAmount && basket.length > 0) {
      return (parseFloat(totalAmount) / basket.length) / item.asset.price;
    }
    return item.amount;
  };

  const calculateTotalValue = () =>
    basket.reduce((total, item) => total + resolveItemAmount(item) * item.asset.price, 0);

  const handleExecuteBasket = async () => {
    if (basket.length === 0) {
      showError('Add assets to your basket first');
      return;
    }

    if ((allocationMode === 'custom' || allocationMode === 'equal') && !totalAmount) {
      const needsTotal = allocationMode === 'custom' || basket.some(item => item.amount <= 0);
      if (needsTotal) {
        showError('Enter a total investment amount');
        return;
      }
    }

    const totalCost = calculateTotalValue() * 1.001;
    if (totalCost > cashBalance) {
      showError(`Insufficient cash — need $${totalCost.toFixed(2)}, available $${cashBalance.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);

    const basketData = {
      assets: basket.map(item => ({ asset: item.asset, amount: resolveItemAmount(item) })),
      totalAmount: parseFloat(totalAmount) || calculateTotalValue(),
    };

    try {
      const results = await executeBasketTrade(basketData);

      addNotification({
        id: `notif-${Date.now()}`,
        type: 'basket',
        message: `Basket trade executed: ${results.length} assets purchased`,
        timestamp: new Date().toISOString(),
      });

      // Rebuild portfolio and refresh cash after execution
      getPortfolio().then(() => {
        const cash = Number(localStorage.getItem('auravest_cash_balance') || '0');
        setCashBalance(Number.isFinite(cash) ? cash : 0);
      });

      if (onBasketSuccess) {
        onBasketSuccess(results);
      }

      setBasket([]);
      setTotalAmount('');
    } catch {
      showError('Failed to execute basket trade');
    }

    setIsProcessing(false);
  };

  const totalValue = calculateTotalValue();
  const totalFee = totalValue * 0.001;
  const allocatedPct = allocationMode === 'custom' ? basket.reduce((s, i) => s + (Number(i.percentage) || 0), 0) : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="relative flex-shrink-0" style={{ width: 38, height: 38 }}>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400/80 border-r-blue-400/30 animate-spin" style={{ animationDuration: '2.5s' }} />
          <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <ShoppingBasket className="w-4 h-4 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Basket Trading</h2>
          <p className="text-sm text-muted-foreground">Build a basket and trade multiple assets in one go</p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Asset Finder */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="font-semibold text-sm flex items-center gap-1.5"><Search className="w-4 h-4 text-primary" />Find Assets</h3>

          <div className="flex gap-2">
            <div className="relative">
              <select
                value={pickerCategory}
                onChange={(e) => setPickerCategory(e.target.value as AssetCategory)}
                className="appearance-none pl-3 pr-8 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {(Object.keys(CATEGORY_META) as AssetCategory[]).map((id) => (
                  <option key={id} value={id}>{CATEGORY_META[id].label}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${CATEGORY_META[pickerCategory].label.toLowerCase()}...`}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow focus:shadow-md"
              />
            </div>
          </div>

          <div className="space-y-1.5 max-h-[26rem] overflow-y-auto pr-1">
            {filteredPickerAssets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No assets match "{search}"</p>
            )}
            {filteredPickerAssets.map((asset, idx) => {
              const inBasket = basket.find(item => item.asset.id === asset.id);
              return (
                <button
                  key={asset.id}
                  onClick={() => inBasket ? removeFromBasket(asset.id) : addToBasket(asset, pickerCategory)}
                  style={{ animationDelay: `${idx * 35}ms` }}
                  className={`group w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 ${
                    inBasket
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-accent/40 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="transition-transform duration-200 group-hover:scale-110">
                    <AssetLogo asset={asset} size={42} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.symbol} · ${asset.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${inBasket ? 'bg-red-500/15 group-hover:bg-red-500/25' : 'bg-green-500/15 group-hover:bg-green-500/25 group-hover:scale-110'}`}>
                    {inBasket ? <Minus className="w-4 h-4 text-red-500" /> : <Plus className="w-4 h-4 text-green-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* The Basket */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-purple-400 to-blue-400" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="relative inline-flex">
                    <ShoppingBasket key={bounce} className="w-5 h-5 text-purple-500 animate-in zoom-in-50 duration-300" />
                    {basket.length > 0 && (
                      <span key={`badge-${bounce}`} className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in-50 duration-300">
                        {basket.length}
                      </span>
                    )}
                  </span>
                  Your Basket
                </h3>
                {basket.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">{basket.length} asset{basket.length > 1 ? 's' : ''} selected</span>
                )}
              </div>

              {basket.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10 gap-2 animate-in fade-in zoom-in-95 duration-300">
                  <div className="relative w-16 h-16 mb-1">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-400/30 animate-spin" style={{ animationDuration: '8s' }} />
                    <div className="absolute inset-2 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <ShoppingBasket className="w-7 h-7 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">Your basket is empty</p>
                  <p className="text-xs text-muted-foreground max-w-[220px]">Search for assets on the left and tap <Plus className="w-3 h-3 inline -mt-0.5" /> to add them here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {basket.map((item, idx) => (
                    <div
                      key={item.asset.id}
                      className="group flex items-center gap-3 p-2.5 bg-muted/50 hover:bg-muted rounded-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 zoom-in-95"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <AssetLogo asset={item.asset} size={42} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.asset.symbol}</p>
                        <p className="text-xs text-muted-foreground">${item.asset.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>

                      {allocationMode === 'custom' ? (
                        <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 py-1">
                          <input
                            type="number"
                            value={item.percentage}
                            onChange={(e) => updateBasketItem(item.asset.id, 'percentage', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-12 text-xs bg-transparent focus:outline-none text-right"
                          />
                          <Percent className="w-3 h-3 text-muted-foreground" />
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateBasketItem(item.asset.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-20 p-1.5 text-xs text-right bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}

                      <button
                        onClick={() => removeFromBasket(item.asset.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {basket.length > 0 && (
            <>
              {/* Allocation */}
              <div className="bg-card border border-border rounded-2xl p-4 animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: '60ms' }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium">Allocation Mode</label>
                  {allocationMode === 'custom' && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${Math.round(allocatedPct) === 100 ? 'text-green-500' : 'text-amber-500'}`}>
                      {Math.round(allocatedPct) === 100 && <Sparkles className="w-3 h-3" />}
                      {allocatedPct.toFixed(0)}% allocated
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 bg-muted/40 rounded-xl p-1.5 mb-1">
                  <button
                    onClick={() => setAllocationMode('equal')}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      allocationMode === 'equal'
                        ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Equal Split
                  </button>
                  <button
                    onClick={() => setAllocationMode('custom')}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      allocationMode === 'custom'
                        ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Custom %
                  </button>
                </div>
                {allocationMode === 'custom' && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mt-2 mb-1">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ease-out ${Math.round(allocatedPct) === 100 ? 'bg-gradient-to-r from-green-600 to-emerald-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`}
                      style={{ width: `${Math.min(allocatedPct, 100)}%` }}
                    />
                  </div>
                )}

                <div className="animate-in fade-in slide-in-from-top-1 duration-200 mt-2">
                  <label className="text-xs font-medium mb-2 block">Total Investment Amount (USD)</label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow focus:shadow-md"
                  />
                  {allocationMode === 'equal' && totalAmount && basket.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      ~${(parseFloat(totalAmount) / basket.length).toFixed(2)} per asset
                    </p>
                  )}
                  {cashBalance > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Available cash: <span className="font-semibold text-foreground">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Summary + Execute */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: '110ms' }}>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-500" />
                    Basket Summary
                  </h3>
                  <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 px-3.5 py-2.5 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Value</span>
                      <span className="font-semibold">${totalValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fee (0.1%)</span>
                      <span className="font-semibold">${totalFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-border/60 font-bold text-sm">
                      <span>Total Cost</span>
                      <span className="text-purple-500">${(totalValue + totalFee).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteBasket}
                    disabled={isProcessing}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Execute Basket Trade
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
