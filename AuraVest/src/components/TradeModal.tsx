'use client';

import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Zap, AlertCircle } from 'lucide-react';
import TransactionSuccessModal from '@/components/TransactionSuccessModal';

interface TradeModalProps {
  asset: any;
  onClose: () => void;
  initialType?: 'buy' | 'sell';
}

export default function TradeModal({ asset, onClose, initialType = 'buy' }: TradeModalProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>(initialType);
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTransaction, setSuccessTransaction] = useState<any>(null);

  const isPositive = asset.change24h >= 0;
  const isLocalGhanaStock = asset?.exchange === 'GSE' || asset?.currency === 'GHS';
  const isLogoImage = typeof asset?.image === 'string' && asset.image.startsWith('/logos/');
  const currencyPrefix = isLocalGhanaStock ? 'GHS ' : '$';
  const resolveAssetClass = () => {
    const explicitAssetClass = asset?.assetClass || asset?.assetType || asset?.category;
    if (typeof explicitAssetClass === 'string') {
      const normalized = explicitAssetClass.toLowerCase();
      if (normalized === 'crypto') return 'Crypto';
      if (normalized === 'stocks' || normalized === 'stock') return 'Stocks';
      if (normalized === 'gold') return 'Gold';
      if (normalized === 'nfts' || normalized === 'nft') return 'NFT';
      if (normalized === 'local investments') return 'Local Investments';
    }

    if (isLocalGhanaStock) return 'Stocks';
    if (asset?.image?.startsWith('/nft/') || asset?.floorPrice || asset?.collection) return 'NFT';
    if (asset?.symbol === 'GOLD' || asset?.symbol === 'XAU' || asset?.symbol === 'DGOLD' || asset?.symbol === 'DXAU' || asset?.purity || asset?.unit === 'gram' || asset?.unit === 'ounce') return 'Gold';
    if (asset?.peRatio !== undefined || asset?.dividend !== undefined || asset?.exchange) return 'Stocks';
    if (asset?.marketCap !== undefined || asset?.volume24h !== undefined) return 'Crypto';
    return 'Stocks';
  };
  const resolvedAssetClass = resolveAssetClass();
  const currentPrice = asset.price || asset.pricePerGram || 0;
  const normalizedAmount = isLocalGhanaStock ? Math.floor(Number(amount || 0)) : Number(amount || 0);
  const estimatedTotal = amount && !isNaN(normalizedAmount) ? normalizedAmount * currentPrice : 0;
  const fee = estimatedTotal * 0.001;

  const updateTradeHoldings = (trade: {
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    assetClass: string;
  }) => {
    const storedHoldings = JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
    const existingIndex = storedHoldings.findIndex((holding: any) => holding.symbol === asset.symbol);
    const holdingType = trade.assetClass;

    if (existingIndex >= 0) {
      const existing = storedHoldings[existingIndex];
      const previousAmount = Number(existing.amount || 0);
      const tradeAmount = Number(trade.amount || 0);

      if (trade.type === 'buy') {
        const newAmount = previousAmount + tradeAmount;
        const weightedPrice = newAmount > 0
          ? ((previousAmount * Number(existing.currentPrice || 0)) + (tradeAmount * trade.price)) / newAmount
          : trade.price;
        const currentValue = newAmount * trade.price;
        const costBasis = Number(existing.costBasis || 0) + (tradeAmount * trade.price);
        const unrealizedPnL = currentValue - costBasis;

        storedHoldings[existingIndex] = {
          ...existing,
          amount: newAmount,
          currentPrice: trade.price,
          currentValue,
          costBasis,
          unrealizedPnL,
          unrealizedPnLPercent: costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0,
          averagePrice: weightedPrice,
          currency: isLocalGhanaStock ? 'GHS' : 'USD',
          type: holdingType,
          quantityType: isLocalGhanaStock ? 'shares' : 'units',
          change24h: Number(asset.change24h || 0),
        };
      } else {
        const newAmount = Math.max(previousAmount - tradeAmount, 0);

        if (newAmount === 0) {
          storedHoldings.splice(existingIndex, 1);
        } else {
          const averagePrice = Number(existing.averagePrice || existing.currentPrice || trade.price);
          const newCostBasis = newAmount * averagePrice;
          const currentValue = newAmount * trade.price;
          const unrealizedPnL = currentValue - newCostBasis;

          storedHoldings[existingIndex] = {
            ...existing,
            amount: newAmount,
            currentPrice: trade.price,
            currentValue,
            costBasis: newCostBasis,
            unrealizedPnL,
            unrealizedPnLPercent: newCostBasis > 0 ? (unrealizedPnL / newCostBasis) * 100 : 0,
            currency: isLocalGhanaStock ? 'GHS' : 'USD',
            type: holdingType,
            quantityType: isLocalGhanaStock ? 'shares' : 'units',
            change24h: Number(asset.change24h || 0),
          };
        }
      }
    } else if (trade.type === 'buy') {
      const costBasis = trade.amount * trade.price;
      storedHoldings.unshift({
        id: `trade-holding-${asset.symbol}-${Date.now()}`,
        name: asset.name,
        symbol: asset.symbol,
        amount: trade.amount,
        currentPrice: trade.price,
        currentValue: trade.amount * trade.price,
        change24h: Number(asset.change24h || 0),
        type: holdingType,
        costBasis,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        averagePrice: trade.price,
        currency: isLocalGhanaStock ? 'GHS' : 'USD',
        quantityType: isLocalGhanaStock ? 'shares' : 'units',
        taxLots: [
          {
            date: new Date().toISOString(),
            amount: trade.amount,
            price: trade.price,
            cost: trade.amount * trade.price,
          },
        ],
      });
    }

    localStorage.setItem('auravest_trade_holdings', JSON.stringify(storedHoldings));
  };

  const handleTrade = async () => {
    if (!amount || Number(amount) <= 0) {
      alert('Invalid Amount: Please enter a valid amount');
      return;
    }

    if (isLocalGhanaStock && !Number.isInteger(Number(amount))) {
      alert('Invalid Shares: Ghana stocks are traded in whole shares only');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const tradeData = {
      type: tradeType,
      asset: asset.symbol,
      assetName: asset.name,
      assetClass: resolvedAssetClass,
      currency: isLocalGhanaStock ? 'GHS' : 'USD',
      amount: normalizedAmount,
      price: orderType === 'limit' && limitPrice ? Number(limitPrice) : currentPrice,
      total: estimatedTotal + fee,
      quantityType: isLocalGhanaStock ? 'shares' : 'units',
      orderType,
    };

    const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    transactions.unshift({
      ...tradeData,
      id: `tx-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
    });
    localStorage.setItem('auravest_transactions', JSON.stringify(transactions));

    updateTradeHoldings({
      type: tradeType,
      amount: normalizedAmount,
      price: orderType === 'limit' && limitPrice ? Number(limitPrice) : currentPrice,
      assetClass: resolvedAssetClass,
    });

    setIsProcessing(false);

    // Show success modal instead of alert
    setSuccessTransaction({
      type: tradeType,
      asset: asset.symbol,
      assetName: asset.name,
      assetClass: resolvedAssetClass,
      currency: isLocalGhanaStock ? 'GHS' : 'USD',
      amount: normalizedAmount,
      price: orderType === 'limit' && limitPrice ? Number(limitPrice) : currentPrice,
      total: estimatedTotal + fee,
      quantityType: isLocalGhanaStock ? 'shares' : 'units',
    });
    setShowSuccessModal(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto animate-slideIn shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ${isLogoImage ? 'bg-transparent' : 'bg-gradient-to-br from-purple-500 to-blue-500'}`}>
              {asset.image?.startsWith('/nft/') || asset.image?.startsWith('/logos/') ? (
                <img
                  src={asset.image}
                  alt={asset.symbol}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : (
                asset.image || asset.symbol?.slice(0, 2)
              )}
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold hidden">
                {asset.symbol?.slice(0, 2)}
              </div>
            </div>
            <div>
              <h2 className="font-bold text-lg">{asset.name}</h2>
              <p className="text-sm text-muted-foreground">{asset.symbol}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-border bg-gradient-to-br from-primary/5 to-blue-500/5">
          <div className="flex items-end gap-3 mb-3">
            <h3 className="text-3xl font-bold">{currencyPrefix}{currentPrice.toLocaleString()}</h3>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? '+' : ''}{asset.change24h}%
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-muted rounded-lg p-2 flex gap-2">
            <button onClick={() => setTradeType('buy')} className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-all ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-lg scale-105' : 'text-muted-foreground'}`}>Buy</button>
            <button onClick={() => setTradeType('sell')} className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-all ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-lg scale-105' : 'text-muted-foreground'}`}>Sell</button>
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block">{isLocalGhanaStock ? `Shares (${asset.symbol})` : `Amount (${asset.symbol})`}</label>
            <input type="number" min={isLocalGhanaStock ? 1 : undefined} step={isLocalGhanaStock ? 1 : 'any'} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={isLocalGhanaStock ? 'e.g. 100 shares' : '0.00'} className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
            {isLocalGhanaStock && <p className="text-xs text-muted-foreground mt-1">Whole shares only (1, 2, 3...)</p>}
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-lg">{currencyPrefix}{(estimatedTotal + fee).toFixed(2)}</span>
            </div>
          </div>

          <button onClick={handleTrade} disabled={!amount || isProcessing} className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${tradeType === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-50 flex items-center justify-center gap-2`}>
            {isProcessing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</> : <>{tradeType === 'buy' ? 'Buy' : 'Sell'} {asset.symbol}</>}
          </button>
        </div>
      </div>

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setSuccessTransaction(null);
          onClose();
        }}
        transaction={successTransaction}
      />
    </div>
  );
}
