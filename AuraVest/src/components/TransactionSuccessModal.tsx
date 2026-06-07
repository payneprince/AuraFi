'use client';

import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, CheckCircle, Clock } from 'lucide-react';

interface Transaction {
  type: 'buy' | 'sell';
  asset: string;
  assetName: string;
  currency?: string;
  quantityType?: 'shares' | 'units';
  status?: string;
  amount: number;
  price: number;
  total: number;
}

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  basketTransactions?: Array<{
    asset: string;
    assetName: string;
    currency?: string;
    quantityType?: 'shares' | 'units';
    amount: number;
    price: number;
    total: number;
  }>;
}

const AUTO_CLOSE_MS = 6000;

export default function TransactionSuccessModal({
  isOpen,
  onClose,
  transaction,
  basketTransactions,
}: TransactionSuccessModalProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) { setProgress(100); return; }
    setProgress(100);
    const step = 100 / (AUTO_CLOSE_MS / 50);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) { clearInterval(interval); return 0; }
        return p - step;
      });
    }, 50);
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBasket = basketTransactions && basketTransactions.length > 0;
  const isBuy = transaction?.type === 'buy';
  const isQueued = transaction?.status === 'queued';
  const cp = (currency?: string) => currency === 'GHS' ? 'GH¢ ' : '$';
  const fmt = (amount: number, qt?: 'shares' | 'units') =>
    qt === 'shares' ? `${Math.floor(amount)} shares` : amount < 1 ? amount.toFixed(6) : amount.toFixed(4);

  const accentGrad = isQueued
    ? 'from-yellow-500 via-amber-400 to-yellow-400'
    : isBuy
    ? 'from-green-600 via-green-400 to-emerald-400'
    : 'from-red-600 via-red-400 to-rose-400';

  const ringColor = isQueued ? 'bg-yellow-500/10' : isBuy ? 'bg-green-500/10' : 'bg-red-500/10';
  const iconColor = isQueued ? 'text-yellow-400' : isBuy ? 'text-green-400' : 'text-red-400';
  const iconGrad = isQueued
    ? 'from-yellow-500 to-amber-400'
    : isBuy
    ? 'from-green-500 to-emerald-400'
    : 'from-red-500 to-rose-400';
  const shadowColor = isQueued ? 'shadow-yellow-500/30' : isBuy ? 'shadow-green-500/30' : 'shadow-red-500/30';
  const borderColor = isQueued ? 'border-yellow-500/20' : isBuy ? 'border-green-500/20' : 'border-red-500/20';
  const bgCard = isQueued ? 'bg-yellow-500/5' : isBuy ? 'bg-green-500/5' : 'bg-red-500/5';
  const totalColor = isQueued ? 'text-yellow-400' : isBuy ? 'text-green-400' : 'text-red-400';

  const txPrefix = cp(transaction?.currency);

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-90 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated progress bar (auto-close timer) */}
        <div className="h-1 bg-muted w-full">
          <div
            className={`h-full bg-gradient-to-r ${accentGrad} transition-none`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5">
          {/* Icon + title row */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* Pulsing rings */}
              <div className="relative w-14 h-14 flex-shrink-0">
                <span className={`absolute inset-0 rounded-full ${ringColor} animate-ping`} style={{ animationDuration: '1.6s' }} />
                <span className={`absolute inset-1.5 rounded-full ${ringColor} animate-ping`} style={{ animationDuration: '1.6s', animationDelay: '0.35s' }} />
                <div className={`absolute inset-0 rounded-full ${ringColor} border ${borderColor} flex items-center justify-center`}>
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${iconGrad} flex items-center justify-center shadow-lg ${shadowColor}`}>
                    {isQueued
                      ? <Clock className="w-5 h-5 text-white" />
                      : isBuy
                      ? <TrendingUp className="w-5 h-5 text-white" />
                      : <TrendingDown className="w-5 h-5 text-white" />
                    }
                  </div>
                </div>
              </div>
              <div>
                <h2 className={`text-base font-black leading-tight ${isQueued ? 'text-yellow-400' : isBuy ? 'text-green-400' : 'text-red-400'}`}>
                  {isQueued ? 'Order Queued' : isBasket ? 'Basket Filled!' : isBuy ? 'Buy Order Filled!' : 'Sell Order Filled!'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isQueued ? 'Will execute on next market open' : isBasket ? `${basketTransactions!.length} positions updated` : 'Portfolio updated'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-6 h-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors flex-shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Basket view */}
          {isBasket ? (
            <div className="space-y-3">
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-0.5">
                {basketTransactions!.map((tx, i) => (
                  <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border ${borderColor} ${bgCard}`}>
                    <div>
                      <p className="font-semibold text-xs">{tx.assetName} <span className="text-muted-foreground">({tx.asset})</span></p>
                      <p className="text-[10px] text-muted-foreground">{fmt(tx.amount, tx.quantityType)} @ {cp(tx.currency)}{tx.price.toFixed(2)}</p>
                    </div>
                    <p className="font-bold text-xs">{cp(tx.currency)}{tx.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className={`flex justify-between items-center pt-3 border-t ${borderColor}`}>
                <span className="text-sm font-semibold">Total</span>
                <span className={`text-xl font-black ${totalColor}`}>{txPrefix}{basketTransactions!.reduce((s, tx) => s + tx.total, 0).toFixed(2)}</span>
              </div>
            </div>
          ) : transaction ? (
            <>
              {/* Receipt card */}
              <div className={`rounded-xl border ${borderColor} ${bgCard} p-4 space-y-2.5 mb-4`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm">{transaction.assetName}</p>
                    <p className="text-[10px] text-muted-foreground">{transaction.asset}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${isQueued ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20'}`}>
                    {(transaction.status || 'filled').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: 'Amount', value: fmt(transaction.amount, transaction.quantityType) },
                    { label: 'Price', value: `${txPrefix}${transaction.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: transaction.price < 1 ? 6 : 2 })}` },
                    { label: 'Fee', value: `${txPrefix}${(transaction.total * 0.001).toFixed(2)}` },
                  ].map((row) => (
                    <div key={row.label} className="text-center">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">{row.label}</p>
                      <p className="text-xs font-bold truncate">{row.value}</p>
                    </div>
                  ))}
                </div>

                <div className={`flex justify-between items-center pt-2.5 border-t ${borderColor}`}>
                  <span className="text-xs text-muted-foreground">{isBuy ? 'Total Paid' : 'You Received'}</span>
                  <span className={`text-2xl font-black ${totalColor}`}>{txPrefix}{transaction.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Confirm / done */}
              <button onClick={onClose}
                className={`w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] shadow-lg bg-gradient-to-r ${isBuy ? 'from-green-500 to-emerald-400 shadow-green-500/20 hover:from-green-400 hover:to-emerald-300' : 'from-red-500 to-rose-400 shadow-red-500/20 hover:from-red-400 hover:to-rose-300'}`}>
                {isQueued ? 'Got it' : 'Done'}
              </button>
            </>
          ) : null}

          <p className="text-[9px] text-muted-foreground/50 text-center mt-2">Closes automatically</p>
        </div>
      </div>
    </div>
  );
}
