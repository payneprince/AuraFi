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
  const [formError, setFormError] = useState<string | null>(null);

  const isPositive = asset.change24h >= 0;
  const isBuy = tradeType === 'buy';
  const isLocalGhanaStock = asset?.exchange === 'GSE' || asset?.currency === 'GHS';
  const isStockIcon = typeof asset?.image === 'string' && (asset.image.includes('simpleicons.org') || asset.image.includes('/logos/stocks/'));
  const isExternalImage = typeof asset?.image === 'string' && asset.image.startsWith('http');
  const hasImage = isExternalImage || asset.image?.startsWith('/nft/') || asset.image?.startsWith('/logos/');
  const currencyPrefix = isLocalGhanaStock ? 'GH¢ ' : '$';

  const resolveAssetClass = () => {
    const explicit = asset?.assetClass || asset?.assetType || asset?.category;
    if (typeof explicit === 'string') {
      const n = explicit.toLowerCase();
      if (n === 'crypto') return 'Crypto';
      if (n === 'stocks' || n === 'stock') return 'Stocks';
      if (n === 'gold') return 'Gold';
      if (n === 'nfts' || n === 'nft') return 'NFT';
    }
    if (isLocalGhanaStock) return 'Stocks';
    if (asset?.image?.startsWith('/nft/') || asset?.floorPrice) return 'NFT';
    if (asset?.symbol === 'GOLD' || asset?.purity || asset?.unit === 'gram') return 'Gold';
    if (asset?.peRatio !== undefined || asset?.exchange) return 'Stocks';
    return 'Crypto';
  };
  const resolvedAssetClass = resolveAssetClass();
  const currentPrice = asset.price || asset.pricePerGram || 0;
  const normalizedAmount = isLocalGhanaStock ? Math.floor(Number(amount || 0)) : Number(amount || 0);
  const estimatedTotal = amount && !isNaN(normalizedAmount) ? normalizedAmount * currentPrice : 0;
  const fee = estimatedTotal * 0.001;
  const settlementTotal = isBuy ? estimatedTotal + fee : Math.max(estimatedTotal - fee, 0);

  // ring color per asset class
  const ringColors: Record<string, string> = {
    Crypto: 'border-t-orange-400/80 border-r-yellow-400/30',
    Stocks: 'border-t-blue-400/80 border-r-cyan-400/30',
    NFT: 'border-t-purple-400/80 border-r-pink-400/30',
    Gold: 'border-t-amber-400/80 border-r-yellow-300/30',
  };
  const ringClass = ringColors[resolvedAssetClass] ?? 'border-t-primary/80 border-r-primary/20';

  const calculateNetCashDelta = (transactions: any[]) =>
    (transactions || []).reduce((sum: number, tx: any) => {
      const status = String(tx?.status || '').toLowerCase();
      if (status && status !== 'filled' && status !== 'completed') return sum;
      const type = String(tx?.type || '').toLowerCase();
      const gross = Number.isFinite(Number(tx?.gross)) ? Number(tx.gross) : Number(tx?.amount || 0) * Number(tx?.price || 0);
      const txFee = Number.isFinite(Number(tx?.fee)) ? Number(tx.fee) : gross * 0.001;
      if (type === 'deposit') return sum + Number(tx?.amount || 0);
      if (type === 'withdrawal') return sum - Number(tx?.amount || 0);
      if (type === 'sell') return sum + Math.max(gross - txFee, 0);
      if (type === 'buy') return sum - (gross + txFee);
      return sum;
    }, 0);

  const getAvailableCash = () => {
    const existing = Number(localStorage.getItem(CASH_STARTING_BALANCE_KEY) || '');
    const starting = Number.isFinite(existing) && existing > 0 ? existing : DEFAULT_STARTING_CASH;
    if (!(Number.isFinite(existing) && existing > 0)) localStorage.setItem(CASH_STARTING_BALANCE_KEY, String(starting));
    const txs = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    const cash = Number((starting + calculateNetCashDelta(txs)).toFixed(2));
    localStorage.setItem(CASH_BALANCE_KEY, String(cash));
    return cash;
  };

  const getAvailableHolding = () => {
    const holdings = JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
    return Number(holdings.find((h: any) => h?.symbol === asset?.symbol)?.amount || 0);
  };

  const isWithinGseHours = () => {
    const now = new Date();
    const day = now.getUTCDay();
    const min = now.getUTCHours() * 60 + now.getUTCMinutes();
    return day >= 1 && day <= 5 && min >= 600 && min < 900;
  };

  const syncPortfolio = (portfolio: any) => {
    if (typeof document === 'undefined' || !portfolio) return;
    const holdings = JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
    const top = holdings.filter((h: any) => Number.isFinite(Number(h?.currentValue || 0))).map((h: any) => ({ id: String(h.id || ''), symbol: String(h.symbol || ''), shares: Number(h.amount || 0), value: Number(h.currentValue || 0) })).sort((a: any, b: any) => b.value - a.value).slice(0, 5);
    const snap = { totalValue: Number(portfolio.totalValue || 0), change24h: Number(portfolio.change24h || 0), changeAmount: Number(portfolio.changeAmount || 0), topHoldings: top, updatedAt: new Date().toISOString() };
    const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `auravest_portfolio_snapshot=${encodeURIComponent(JSON.stringify(snap))}; expires=${exp}; path=/; SameSite=Lax`;
  };

  const syncActivity = (txList: any[]) => {
    if (typeof document === 'undefined') return;
    const events = (txList || []).map((tx) => {
      const raw = String(tx?.timestamp || tx?.date || new Date().toISOString());
      const timestamp = Number.isNaN(Date.parse(raw)) ? new Date().toISOString() : new Date(raw).toISOString();
      return { id: `auravest-${String(tx?.id || Date.now())}`, app: 'AuraVest', type: String(tx?.type || 'trade'), title: `${String(tx?.type || 'Trade').toUpperCase()} ${String(tx?.asset || '')}`, amount: Number.isFinite(Number(tx?.total || 0)) ? Number(tx.total) : 0, currency: String(tx?.currency || 'USD'), timestamp, status: String(tx?.status || 'completed'), meta: { asset: String(tx?.asset || ''), orderType: String(tx?.orderType || '') } };
    }).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 40);
    const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `auravest_activity_snapshot=${encodeURIComponent(JSON.stringify(events))}; expires=${exp}; path=/; SameSite=Lax`;
  };

  const recalcPortfolio = (updatedHoldings?: any[]) => {
    const holdings = updatedHoldings || JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
    const localPos = JSON.parse(localStorage.getItem('auravest_local_positions') || '[]');
    const cash = Number(localStorage.getItem(CASH_BALANCE_KEY) || '0');
    const map = new Map<string, number>();
    holdings.forEach((h: any) => { const t = h?.type || 'Stocks'; map.set(t, (map.get(t) || 0) + Number(h?.currentValue || 0)); });
    localPos.forEach((p: any) => { map.set('Local Investments', (map.get('Local Investments') || 0) + Number(p?.amount || 0)); });
    if (Number.isFinite(cash) && Math.abs(cash) > 0) map.set('Cash', (map.get('Cash') || 0) + cash);
    const assets = Array.from(map.entries()).map(([type, value]) => ({ type, value, allocation: 0 }));
    const total = assets.reduce((s, a) => s + a.value, 0);
    const chgAmt = holdings.reduce((s: number, h: any) => s + (Number(h?.currentValue || 0) * Number(h?.change24h || 0) / 100), 0);
    const portfolio = { totalValue: total, change24h: total > 0 ? Number(((chgAmt / total) * 100).toFixed(2)) : 0, changeAmount: Number(chgAmt.toFixed(2)), assets: assets.map((a) => ({ ...a, allocation: total > 0 ? Number(((a.value / total) * 100).toFixed(1)) : 0 })) };
    localStorage.setItem('auravest_portfolio', JSON.stringify(portfolio));
    syncPortfolio(portfolio);
  };

  const updateHoldings = (trade: { type: 'buy' | 'sell'; amount: number; price: number; assetClass: string }) => {
    const stored = JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
    const idx = stored.findIndex((h: any) => h.symbol === asset.symbol);
    if (idx >= 0) {
      const ex = stored[idx];
      const prev = Number(ex.amount || 0);
      if (trade.type === 'buy') {
        const next = prev + trade.amount;
        const cost = Number(ex.costBasis || 0) + trade.amount * trade.price;
        stored[idx] = { ...ex, amount: next, currentPrice: trade.price, currentValue: next * trade.price, costBasis: cost, unrealizedPnL: next * trade.price - cost, unrealizedPnLPercent: cost > 0 ? ((next * trade.price - cost) / cost) * 100 : 0, averagePrice: next > 0 ? ((prev * Number(ex.currentPrice || 0)) + (trade.amount * trade.price)) / next : trade.price, currency: isLocalGhanaStock ? 'GHS' : 'USD', type: trade.assetClass, quantityType: isLocalGhanaStock ? 'shares' : 'units', change24h: Number(asset.change24h || 0) };
      } else {
        const next = Math.max(prev - trade.amount, 0);
        if (next === 0) { stored.splice(idx, 1); }
        else {
          const avg = Number(ex.averagePrice || ex.currentPrice || trade.price);
          const cost = next * avg;
          stored[idx] = { ...ex, amount: next, currentPrice: trade.price, currentValue: next * trade.price, costBasis: cost, unrealizedPnL: next * trade.price - cost, unrealizedPnLPercent: cost > 0 ? ((next * trade.price - cost) / cost) * 100 : 0, currency: isLocalGhanaStock ? 'GHS' : 'USD', type: trade.assetClass, quantityType: isLocalGhanaStock ? 'shares' : 'units', change24h: Number(asset.change24h || 0) };
        }
      }
    } else if (trade.type === 'buy') {
      const cost = trade.amount * trade.price;
      stored.unshift({ id: `trade-holding-${asset.symbol}-${Date.now()}`, name: asset.name, symbol: asset.symbol, amount: trade.amount, currentPrice: trade.price, currentValue: cost, change24h: Number(asset.change24h || 0), type: trade.assetClass, costBasis: cost, unrealizedPnL: 0, unrealizedPnLPercent: 0, averagePrice: trade.price, currency: isLocalGhanaStock ? 'GHS' : 'USD', quantityType: isLocalGhanaStock ? 'shares' : 'units', taxLots: [{ date: new Date().toISOString(), amount: trade.amount, price: trade.price, cost }] });
    }
    localStorage.setItem('auravest_trade_holdings', JSON.stringify(stored));
    return stored;
  };

  const handleTrade = async () => {
    setFormError(null);
    if (!amount || Number(amount) <= 0) { setFormError('Please enter a valid amount'); return; }
    if (isLocalGhanaStock && !Number.isInteger(Number(amount))) { setFormError('Ghana stocks trade in whole shares only'); return; }
    if (tradeType === 'sell') {
      const avail = getAvailableHolding();
      if (avail <= 0) { setFormError(`No ${asset.symbol} position to sell`); return; }
      if (normalizedAmount > avail) { setFormError(`Insufficient holdings. Available: ${avail}`); return; }
    } else {
      const cash = getAvailableCash();
      if (settlementTotal > cash) { setFormError(`Insufficient cash. Available: ${currencyPrefix}${cash.toFixed(2)}`); return; }
    }
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1400));
    const status = isLocalGhanaStock && !isWithinGseHours() ? 'queued' : 'filled';
    const execPrice = orderType === 'limit' && limitPrice ? Number(limitPrice) : currentPrice;
    const tradeData = { type: tradeType, asset: asset.symbol, assetName: asset.name, assetClass: resolvedAssetClass, currency: isLocalGhanaStock ? 'GHS' : 'USD', amount: normalizedAmount, price: execPrice, gross: estimatedTotal, fee, netSettlement: isBuy ? -(estimatedTotal + fee) : Math.max(estimatedTotal - fee, 0), total: settlementTotal, quantityType: isLocalGhanaStock ? 'shares' : 'units', orderType, status };
    const txs = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    txs.unshift({ ...tradeData, id: `tx-${Date.now()}`, timestamp: new Date().toISOString() });
    localStorage.setItem('auravest_transactions', JSON.stringify(txs));
    syncActivity(txs);
    if (status === 'filled') {
      getAvailableCash();
      const updated = updateHoldings({ type: tradeType, amount: normalizedAmount, price: execPrice, assetClass: resolvedAssetClass });
      recalcPortfolio(updated);
    }
    setIsProcessing(false);
    setSuccessTransaction({ type: tradeType, asset: asset.symbol, assetName: asset.name, assetClass: resolvedAssetClass, currency: isLocalGhanaStock ? 'GHS' : 'USD', amount: normalizedAmount, price: execPrice, total: settlementTotal, quantityType: isLocalGhanaStock ? 'shares' : 'units', status });
    setShowSuccessModal(true);
  };

  const availableCash = getAvailableCash();
  const availableHolding = getAvailableHolding();

  const quickAmounts = isBuy
    ? [0.25, 0.5, 0.75, 1].map((pct) => ({ label: pct === 1 ? 'Max' : `${pct * 100}%`, value: isLocalGhanaStock ? Math.floor((availableCash * pct) / currentPrice) : Number(((availableCash * pct) / currentPrice).toFixed(4)) }))
    : [0.25, 0.5, 0.75, 1].map((pct) => ({ label: pct === 1 ? 'Max' : `${pct * 100}%`, value: isLocalGhanaStock ? Math.floor(availableHolding * pct) : Number((availableHolding * pct).toFixed(4)) }));

  // compact price stats for the header card
  const statItems = [
    { label: '24h Chg', value: `${isPositive ? '+' : ''}${asset.change24h?.toFixed(2)}%`, color: isPositive ? 'text-green-400' : 'text-red-400' },
    asset.marketCap ? { label: 'Mkt Cap', value: asset.marketCap > 1e9 ? `$${(asset.marketCap / 1e9).toFixed(1)}B` : `$${(asset.marketCap / 1e6).toFixed(0)}M`, color: 'text-foreground' } : null,
    asset.volume24h ? { label: 'Vol 24h', value: asset.volume24h > 1e9 ? `$${(asset.volume24h / 1e9).toFixed(1)}B` : `$${(asset.volume24h / 1e6).toFixed(0)}M`, color: 'text-foreground' } : null,
    asset.peRatio ? { label: 'P/E', value: asset.peRatio.toFixed(1), color: 'text-foreground' } : null,
    asset.dividend ? { label: 'Div Yield', value: `${asset.dividend}%`, color: 'text-blue-400' } : null,
  ].filter(Boolean).slice(0, 3) as { label: string; value: string; color: string }[];

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className={`h-1 w-full ${isBuy ? 'bg-gradient-to-r from-green-600 via-green-400 to-emerald-400' : 'bg-gradient-to-r from-red-600 via-red-400 to-rose-400'}`} />

        {/* Header: logo + name + price */}
        <div className={`px-4 pt-3.5 pb-3 border-b border-border/60 ${isBuy ? 'bg-green-500/4' : 'bg-red-500/4'}`}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-3">
              {/* Spinning ring logo */}
              <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                <div className={`absolute inset-0 rounded-full border-2 border-transparent ${ringClass} animate-spin`} style={{ animationDuration: '2.5s' }} />
                <div className="absolute inset-[3px] rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {hasImage ? (
                    <img src={asset.image} alt={asset.symbol} className={isStockIcon ? 'w-5 h-5 object-contain' : 'w-full h-full object-cover'} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <span className="text-xs font-black text-foreground">{asset.symbol?.slice(0, 2)}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">{asset.name}</p>
                <p className="text-[10px] text-muted-foreground">{asset.symbol} · {resolvedAssetClass}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-6 h-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Price row */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight">{currencyPrefix}{currentPrice.toLocaleString('en-US', { minimumFractionDigits: currentPrice < 1 ? 4 : 2, maximumFractionDigits: currentPrice < 1 ? 6 : 2 })}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${isPositive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{asset.change24h?.toFixed(2)}%
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />Live</span>
          </div>

          {/* Stats row */}
          {statItems.length > 0 && (
            <div className="flex gap-3 mt-2">
              {statItems.map((s) => (
                <div key={s.label}>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                  <p className={`text-[11px] font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trade form */}
        <div className="px-4 py-3.5 space-y-3">
          {/* Buy / Sell toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl">
            {(['buy', 'sell'] as const).map((t) => (
              <button key={t} onClick={() => { setTradeType(t); setFormError(null); }}
                className={`py-2 rounded-lg font-bold text-sm transition-all duration-200 ${tradeType === t ? (t === 'buy' ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 scale-[1.02]' : 'bg-red-500 text-white shadow-lg shadow-red-500/25 scale-[1.02]') : 'text-muted-foreground hover:text-foreground'}`}>
                {t === 'buy' ? '▲ Buy' : '▼ Sell'}
              </button>
            ))}
          </div>

          {/* Order type */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Order:</span>
            {(['market', 'limit'] as const).map((o) => (
              <button key={o} onClick={() => setOrderType(o)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${orderType === o ? 'bg-foreground text-background border-transparent' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </button>
            ))}
          </div>

          {/* Limit price */}
          {orderType === 'limit' && (
            <input type="number" step="any" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={`Limit price (${currencyPrefix.trim()}${currentPrice.toFixed(2)})`}
              className="w-full px-3 py-2 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all animate-in slide-in-from-top-2 fade-in duration-200" />
          )}

          {/* Amount */}
          <div>
            <input type="number" min={isLocalGhanaStock ? 1 : undefined} step={isLocalGhanaStock ? 1 : 'any'} value={amount}
              onChange={(e) => { setAmount(e.target.value); setFormError(null); }}
              placeholder={isLocalGhanaStock ? 'Number of shares' : `Amount (${asset.symbol})`}
              className={`w-full px-3 py-2 border rounded-xl bg-background text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${formError ? 'border-red-500/60 focus:ring-red-500/30' : 'border-border focus:ring-primary/30'}`} />
            {/* Quick chips */}
            <div className="flex gap-1 mt-1.5">
              {quickAmounts.map(({ label, value }) => (
                <button key={label} onClick={() => { setAmount(String(value)); setFormError(null); }}
                  className={`flex-1 py-1 text-[9px] rounded-lg border font-semibold transition-all ${String(amount) === String(value) ? (isBuy ? 'bg-green-500/20 border-green-400/50 text-green-400' : 'bg-red-500/20 border-red-400/50 text-red-400') : 'border-border bg-background hover:bg-accent'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Order summary */}
          {estimatedTotal > 0 && (
            <div className={`rounded-xl border px-3.5 py-2.5 space-y-1.5 animate-in fade-in duration-150 ${isBuy ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{currencyPrefix}{estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Fee (0.1%)</span>
                <span>{currencyPrefix}{fee.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between items-center pt-1.5 border-t ${isBuy ? 'border-green-500/20' : 'border-red-500/20'}`}>
                <span className="text-xs font-semibold">{isBuy ? 'Total Cost' : 'You Receive'}</span>
                <span className={`text-base font-black ${isBuy ? 'text-green-400' : 'text-red-400'}`}>{currencyPrefix}{settlementTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {/* Available hint */}
          <p className="text-[9px] text-muted-foreground text-right -mt-1">
            {isBuy ? `Cash: ${currencyPrefix}${availableCash.toFixed(2)}` : `Holding: ${availableHolding} ${asset.symbol}`}
          </p>

          {/* Inline validation error */}
          {formError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {formError}
            </div>
          )}

          {/* Confirm button */}
          <button onClick={handleTrade} disabled={!amount || isProcessing}
            className={`w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${isBuy ? 'bg-green-500 hover:bg-green-400 shadow-green-500/25' : 'bg-red-500 hover:bg-red-400 shadow-red-500/25'}`}>
            {isProcessing
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</>
              : <>{isBuy ? '▲ Buy' : '▼ Sell'} {asset.symbol}</>}
          </button>
        </div>
      </div>

      <TransactionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => { setShowSuccessModal(false); setSuccessTransaction(null); onClose(); }}
        transaction={successTransaction}
      />
    </div>
  );
}
