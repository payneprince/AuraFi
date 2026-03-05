'use client';

import { useState } from 'react';
import { cryptoAssets, stockAssets, goldData } from '@/lib/mockData';
import { executeBasketTrade, addNotification } from '@/lib/mockAPI';
import { Plus, Minus, ShoppingCart, DollarSign, Percent } from 'lucide-react';

type AssetCategory = 'crypto' | 'stocks' | 'gold';

export default function BasketTrading({ onBasketSuccess }: { onBasketSuccess?: (transactions: any[]) => void }) {
  const [basket, setBasket] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState('');
  const [allocationMode, setAllocationMode] = useState<'equal' | 'custom'>('equal');
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = [
    { id: 'crypto' as AssetCategory, label: 'Crypto', assets: cryptoAssets },
    { id: 'stocks' as AssetCategory, label: 'Stocks', assets: stockAssets },
    { id: 'gold' as AssetCategory, label: 'Gold', assets: [{ ...goldData, name: 'Gold', symbol: 'GOLD', id: 'gold', price: goldData.pricePerGram }] },
  ];

  const addToBasket = (asset: any, category: AssetCategory) => {
    if (basket.find(item => item.asset.id === asset.id)) return;

    setBasket([...basket, {
      asset,
      category,
      amount: 0,
      percentage: 0,
    }]);
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

  const calculateTotalValue = () => {
    return basket.reduce((total, item) => {
      const amount = allocationMode === 'custom' && item.percentage > 0 && totalAmount
        ? (parseFloat(totalAmount) * item.percentage / 100) / item.asset.price
        : item.amount;
      return total + (amount * item.asset.price);
    }, 0);
  };

  const handleExecuteBasket = async () => {
    if (basket.length === 0) {
      alert('Add assets to your basket first');
      return;
    }

    if (allocationMode === 'custom' && !totalAmount) {
      alert('Enter total investment amount');
      return;
    }

    setIsProcessing(true);

    const basketData = {
      assets: basket.map(item => ({
        asset: item.asset,
        amount: allocationMode === 'custom' && item.percentage > 0 && totalAmount
          ? (parseFloat(totalAmount) * item.percentage / 100) / item.asset.price
          : item.amount,
      })),
      totalAmount: parseFloat(totalAmount) || calculateTotalValue(),
    };

    try {
      const results = await executeBasketTrade(basketData);

      // Add notification
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'basket',
        message: `Basket trade executed: ${results.length} assets purchased`,
        timestamp: new Date().toISOString(),
      });

      // Call success callback to show modal
      if (onBasketSuccess) {
        onBasketSuccess(results);
      }

      setBasket([]);
      setTotalAmount('');
    } catch (error) {
      alert('Failed to execute basket trade');
    }

    setIsProcessing(false);
  };

  const totalValue = calculateTotalValue();
  const totalFee = totalValue * 0.001;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Basket Trading</h2>
        <p className="text-muted-foreground">Trade multiple assets simultaneously</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold">Add Assets to Basket</h3>
          {categories.map((cat) => (
            <div key={cat.id} className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-medium mb-3">{cat.label}</h4>
              <div className="grid grid-cols-2 gap-2">
                {cat.assets.map((asset) => {
                  const inBasket = basket.find(item => item.asset.id === asset.id);
                  return (
                    <button
                      key={asset.id}
                      onClick={() => inBasket ? removeFromBasket(asset.id) : addToBasket(asset, cat.id)}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        inBasket
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{asset.symbol}</span>
                        {inBasket ? (
                          <Minus className="w-4 h-4 text-red-500" />
                        ) : (
                          <Plus className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">${asset.price?.toLocaleString()}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Basket Configuration */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Basket Configuration</h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Allocation Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAllocationMode('equal')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      allocationMode === 'equal'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    Equal Split
                  </button>
                  <button
                    onClick={() => setAllocationMode('custom')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      allocationMode === 'custom'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    Custom %
                  </button>
                </div>
              </div>

              {allocationMode === 'custom' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Total Investment Amount (USD)</label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {allocationMode === 'equal' && basket.length > 0 && (
                <button
                  onClick={applyAllocation}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  Apply Equal Allocation
                </button>
              )}
            </div>
          </div>

          {/* Basket Items */}
          {basket.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Basket Items ({basket.length})</h3>
              <div className="space-y-3">
                {basket.map((item) => (
                  <div key={item.asset.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.asset.symbol}</p>
                      <p className="text-xs text-muted-foreground">${item.asset.price?.toLocaleString()}</p>
                    </div>

                    {allocationMode === 'custom' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.percentage}
                          onChange={(e) => updateBasketItem(item.asset.id, 'percentage', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-16 p-1 text-xs bg-background border border-border rounded"
                        />
                        <Percent className="w-3 h-3 text-muted-foreground" />
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateBasketItem(item.asset.id, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-20 p-1 text-xs bg-background border border-border rounded"
                      />
                    )}

                    <button
                      onClick={() => removeFromBasket(item.asset.id)}
                      className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Basket Summary */}
          {basket.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Basket Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-medium">${totalValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee (0.1%)</span>
                  <span className="font-medium">${totalFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between text-sm font-medium">
                  <span>Total Cost</span>
                  <span>${(totalValue + totalFee).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleExecuteBasket}
                disabled={isProcessing}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
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
          )}
        </div>
      </div>
    </div>
  );
}
