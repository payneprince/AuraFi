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
  const CASH_BALANCE_KEY = 'auravest_cash_balance';
  const CASH_STARTING_BALANCE_KEY = 'auravest_cash_starting_balance';
  const DEFAULT_STARTING_CASH = 125847.32;
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
  const settlementTotal = tradeType === 'buy' ? estimatedTotal + fee : Math.max(estimatedTotal - fee, 0);

  const calculateNetCashDeltaFromTransactions = (transactions: any[]) => {
    return (transactions || []).reduce((sum: number, tx: any) => {
      const status = String(tx?.status || '').toLowerCase();
      if (status && status !== 'filled' && status !== 'completed') return sum;

      const type = String(tx?.type || '').toLowerCase();
      const txAmount = Number(tx?.amount || 0);
      const txPrice = Number(tx?.price || 0);
      const inferredGross = txAmount * txPrice;
      const gross = Number.isFinite(Number(tx?.gross)) ? Number(tx.gross) : inferredGross;
      const txFee = Number.isFinite(Number(tx?.fee)) ? Number(tx.fee) : gross * 0.001;

      if (type === 'deposit') return sum + txAmount;
      if (type === 'withdrawal') return sum - txAmount;

      if (type === 'sell') return sum + Math.max(gross - txFee, 0);
      if (type === 'buy') return sum - (gross + txFee);
      return sum;
    }, 0);
  };

  const ensureStartingCashBalance = () => {
    const existingStartingCash = Number(localStorage.getItem(CASH_STARTING_BALANCE_KEY) || '');
    if (Number.isFinite(existingStartingCash) && existingStartingCash > 0) return Number(existingStartingCash.toFixed(2));

    const normalizedStartingCash = Number(DEFAULT_STARTING_CASH.toFixed(2));
    localStorage.setItem(CASH_STARTING_BALANCE_KEY, String(normalizedStartingCash));
    return normalizedStartingCash;
  };

  const getAvailableCashBalance = () => {
    const startingCash = ensureStartingCashBalance();
    const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    const netDelta = calculateNetCashDeltaFromTransactions(transactions);
    const availableCash = Number((startingCash + netDelta).toFixed(2));
    localStorage.setItem(CASH_BALANCE_KEY, String(availableCash));
    return availableCash;
  };
  const isWithinGseMarketHours = () => {
    const now = new Date();
    const day = now.getUTCDay();
    const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const openMinutes = 10 * 60;
    const closeMinutes = 15 * 60;
    return day >= 1 && day <= 5 && minutes >= openMinutes && minutes < closeMinutes;
  };

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

  const syncVestActivitySnapshotCookie = (transactionList: any[]) => {
    if (typeof document === 'undefined') return;

    const normalizedEvents = (transactionList || [])
      .map((transaction) => {
        const rawTimestamp = String(transaction?.timestamp || transaction?.date || new Date().toISOString());
        const timestamp = Number.isNaN(Date.parse(rawTimestamp)) ? new Date().toISOString() : new Date(rawTimestamp).toISOString();
        const amount = Number(transaction?.total || 0);
        return {
          id: `auravest-${String(transaction?.id || Date.now())}`,
          app: 'AuraVest',
          type: String(transaction?.type || 'trade'),
          title: `${String(transaction?.type || 'Trade').toUpperCase()} ${String(transaction?.asset || transaction?.assetName || 'Asset')}`,
          amount: Number.isFinite(amount) ? amount : 0,
          currency: String(transaction?.currency || 'USD'),
          timestamp,
          status: String(transaction?.status || 'completed'),
          meta: {
            asset: String(transaction?.asset || ''),
            orderType: String(transaction?.orderType || ''),
          },
        };
      })
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 40);

    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `auravest_activity_snapshot=${encodeURIComponent(JSON.stringify(normalizedEvents))}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const recalculatePortfolioFromHoldings = (updatedHoldings?: any[]) => {
    const holdings = updatedHoldings || JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
    const localPositions = JSON.parse(localStorage.getItem('auravest_local_positions') || '[]');
    const cashBalance = Number(localStorage.getItem(CASH_BALANCE_KEY) || '0');
    const groupedValues = new Map<string, number>();

    holdings.forEach((holding: any) => {
      const type = holding?.type || 'Stocks';
      const currentValue = Number(holding?.currentValue || 0);
      groupedValues.set(type, (groupedValues.get(type) || 0) + currentValue);
    });

    localPositions.forEach((position: any) => {
      const amount = Number(position?.amount || 0);
      groupedValues.set('Local Investments', (groupedValues.get('Local Investments') || 0) + amount);
    });

    if (Number.isFinite(cashBalance) && Math.abs(cashBalance) > 0) {
      groupedValues.set('Cash', (groupedValues.get('Cash') || 0) + cashBalance);
    }

    const assets = Array.from(groupedValues.entries()).map(([type, value]) => ({ type, value, allocation: 0 }));
    const totalValue = assets.reduce((sum, assetItem) => sum + assetItem.value, 0);
    const changeAmount = holdings.reduce((sum: number, holding: any) => {
      const value = Number(holding?.currentValue || 0);
      const change = Number(holding?.change24h || 0);
      return sum + (value * change / 100);
    }, 0);
    const change24h = totalValue > 0 ? (changeAmount / totalValue) * 100 : 0;

    const normalizedAssets = assets.map((assetItem) => ({
      ...assetItem,
      allocation: totalValue > 0 ? Number(((assetItem.value / totalValue) * 100).toFixed(1)) : 0,
    }));

    const portfolioSnapshot = {
      totalValue,
      change24h: Number(change24h.toFixed(2)),
      changeAmount: Number(changeAmount.toFixed(2)),
      assets: normalizedAssets,
    };
    localStorage.setItem('auravest_portfolio', JSON.stringify(portfolioSnapshot));
    syncPortfolioSnapshotCookie(portfolioSnapshot);
  };

  const getAvailableHoldingAmount = () => {
    const holdings = JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
    const currentHolding = holdings.find((holding: any) => String(holding?.symbol || '') === String(asset?.symbol || ''));
    return Number(currentHolding?.amount || 0);
  };

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
    return storedHoldings;
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

    if (tradeType === 'sell') {
      const availableAmount = getAvailableHoldingAmount();
      if (availableAmount <= 0) {
        alert(`No ${asset.symbol} position available to sell`);
        return;
      }
      if (normalizedAmount > availableAmount) {
        alert(`Insufficient ${asset.symbol} holdings. Available: ${availableAmount}`);
        return;
      }
    } else {
      const availableCash = getAvailableCashBalance();
      if (settlementTotal > availableCash) {
        alert(`Insufficient cash. Available cash: ${currencyPrefix}${availableCash.toFixed(2)}`);
        return;
      }
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const tradeStatus = isLocalGhanaStock && !isWithinGseMarketHours() ? 'queued' : 'filled';

    const tradeData = {
      type: tradeType,
      asset: asset.symbol,
      assetName: asset.name,
      assetClass: resolvedAssetClass,
      currency: isLocalGhanaStock ? 'GHS' : 'USD',
      amount: normalizedAmount,
      price: orderType === 'limit' && limitPrice ? Number(limitPrice) : currentPrice,
      gross: estimatedTotal,
      fee,
      netSettlement: tradeType === 'sell' ? Math.max(estimatedTotal - fee, 0) : -(estimatedTotal + fee),
      total: settlementTotal,
      quantityType: isLocalGhanaStock ? 'shares' : 'units',
      orderType,
      status: tradeStatus,
    };

    const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    transactions.unshift({
      ...tradeData,
      id: `tx-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('auravest_transactions', JSON.stringify(transactions));
    syncVestActivitySnapshotCookie(transactions);

    if (tradeStatus === 'filled') {
      getAvailableCashBalance();
      const updatedHoldings = updateTradeHoldings({
        type: tradeType,
        amount: normalizedAmount,
        price: orderType === 'limit' && limitPrice ? Number(limitPrice) : currentPrice,
        assetClass: resolvedAssetClass,
      });
      recalculatePortfolioFromHoldings(updatedHoldings);
    }

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
      total: settlementTotal,
      quantityType: isLocalGhanaStock ? 'shares' : 'units',
      status: tradeStatus,
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
              <span className="text-muted-foreground">{tradeType === 'buy' ? 'Estimated Cost' : 'Estimated Proceeds'}</span>
              <span className="font-bold text-lg">{currencyPrefix}{settlementTotal.toFixed(2)}</span>
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
