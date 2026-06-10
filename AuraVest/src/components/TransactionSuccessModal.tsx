'use client';

import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Clock } from 'lucide-react';

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

const CONFETTI_COLORS = {
  buy:    ['#34d399','#a3e635','#4ade80','#86efac','#6ee7b7','#d9f99d'],
  sell:   ['#f87171','#fb7185','#f43f5e','#fca5a5','#fda4af','#ff6b6b'],
  queued: ['#fbbf24','#f59e0b','#fcd34d','#fb923c','#fdba74','#fef08a'],
};

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315, 22, 67, 112, 247];

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

  const isBasket  = basketTransactions && basketTransactions.length > 0;
  const isBuy     = transaction?.type === 'buy';
  const isQueued  = transaction?.status === 'queued';
  const mode      = isQueued ? 'queued' : isBuy ? 'buy' : 'sell';

  const cp  = (currency?: string) => currency === 'GHS' ? 'GH¢ ' : '$';
  const fmt = (amount: number, qt?: 'shares' | 'units') =>
    qt === 'shares' ? `${Math.floor(amount)} shares` : amount < 1 ? amount.toFixed(6) : amount.toFixed(4);

  const palette = {
    buy:    { grad: 'from-green-600 to-emerald-400',  ring: 'bg-green-500/10',  border: 'border-green-500/20',  bg: 'bg-green-500/5',  total: 'text-green-400',  btn: 'from-green-500 to-emerald-400 shadow-green-500/25',  bar: 'from-green-500 to-emerald-400',   badge: 'border-green-500/30 bg-green-500/10 text-green-400',  dot: 'bg-green-400',  svgStroke: '#34d399', pingBg: 'bg-green-500/10' },
    sell:   { grad: 'from-red-600 to-rose-400',       ring: 'bg-red-500/10',    border: 'border-red-500/20',    bg: 'bg-red-500/5',    total: 'text-red-400',    btn: 'from-red-500 to-rose-400 shadow-red-500/25',         bar: 'from-red-500 to-rose-400',        badge: 'border-red-500/30 bg-red-500/10 text-red-400',        dot: 'bg-red-400',    svgStroke: '#f87171', pingBg: 'bg-red-500/10'   },
    queued: { grad: 'from-yellow-500 to-amber-400',   ring: 'bg-yellow-500/10', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5', total: 'text-yellow-400', btn: 'from-yellow-500 to-amber-400 shadow-yellow-500/25',   bar: 'from-yellow-500 to-amber-400',    badge: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400', dot: 'bg-yellow-400', svgStroke: '#fbbf24', pingBg: 'bg-yellow-500/10' },
  }[mode];

  const confettiColors = CONFETTI_COLORS[mode];
  const txPrefix = cp(transaction?.currency);

  const heading = isQueued ? 'Order Queued' : isBasket ? 'Basket Filled!' : isBuy ? 'Buy Filled!' : 'Sell Filled!';
  const subheading = isQueued ? 'Executes on next market open' : isBasket ? `${basketTransactions!.length} positions updated` : 'Portfolio updated instantly';

  const HeadIcon = isQueued ? Clock : isBuy ? TrendingUp : TrendingDown;

  return (
    <>
      <style>{`
        @keyframes vestConfetti {
          0%   { transform: translate(0,0) scale(0); opacity:1; }
          60%  { opacity:1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.25); opacity:0; }
        }
        @keyframes vestCheckDraw {
          from { stroke-dashoffset: 48; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes vestCircleDraw {
          from { stroke-dashoffset: 166; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes vestModalPop {
          from { opacity:0; transform: scale(0.82) translateY(20px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#080d1a] border border-white/12 shadow-2xl"
          style={{ animation: 'vestModalPop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Auto-close progress bar */}
          <div className="h-0.5 w-full bg-white/5">
            <div
              className={`h-full bg-gradient-to-r ${palette.bar} transition-none`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Glow blobs */}
          <div className={`pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-25`}
            style={{ background: palette.svgStroke }} />
          <div className={`pointer-events-none absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-15`}
            style={{ background: palette.svgStroke }} />

          {/* Confetti burst */}
          <div className="absolute inset-0 flex items-start justify-center pt-12 pointer-events-none overflow-hidden">
            {ANGLES.map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const dist = 75 + (i % 3) * 12;
              const dx = `${Math.round(Math.sin(rad) * dist)}px`;
              const dy = `${Math.round(-Math.cos(rad) * dist)}px`;
              const delay = `${(i * 0.03).toFixed(2)}s`;
              return (
                <span
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: confettiColors[i % confettiColors.length],
                    '--dx': dx,
                    '--dy': dy,
                    animation: `vestConfetti 0.7s ease-out ${delay} forwards`,
                  } as React.CSSProperties}
                />
              );
            })}
          </div>

          <div className="p-5">
            {/* Icon + title row */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                {/* Animated SVG ring */}
                <div className="relative flex-shrink-0 w-14 h-14">
                  <div className={`absolute inset-0 rounded-full ${palette.pingBg} animate-ping`} style={{ animationDuration: '1.6s' }} />
                  <svg viewBox="0 0 52 52" className="relative w-14 h-14" fill="none">
                    <circle
                      cx="26" cy="26" r="24"
                      stroke={palette.svgStroke} strokeWidth="2"
                      style={{ strokeDasharray: 166, animation: 'vestCircleDraw 0.5s ease-out forwards' }}
                    />
                    {isQueued ? (
                      <text x="26" y="31" textAnchor="middle" fontSize="16" fill={palette.svgStroke}>⏱</text>
                    ) : (
                      <path
                        d={isBuy ? 'M14 27l8 8 16-16' : 'M14 25l8-8 16 16'}
                        stroke={palette.svgStroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        style={{ strokeDasharray: 48, strokeDashoffset: 48, animation: 'vestCheckDraw 0.4s ease-out 0.45s forwards' }}
                      />
                    )}
                  </svg>
                </div>
                <div>
                  <h2 className={`text-base font-black leading-tight ${palette.total}`}>{heading}</h2>
                  <p className="text-xs text-white/40 mt-0.5">{subheading}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors flex-shrink-0 hover:rotate-90 transition-all duration-200"
              >
                <X className="w-3.5 h-3.5 text-white/60" />
              </button>
            </div>

            {/* Status badge */}
            <div className={`inline-flex items-center gap-1.5 rounded-full border ${palette.badge} px-3 py-1 text-xs font-semibold mb-4`}>
              <span className={`w-1.5 h-1.5 rounded-full ${palette.dot} animate-pulse`} />
              {isQueued ? 'Queued for next open' : isBasket ? 'All positions executed' : isBuy ? 'Order executed' : 'Order executed'}
            </div>

            {/* Basket view */}
            {isBasket ? (
              <div className="space-y-3">
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
                  {basketTransactions!.map((tx, i) => (
                    <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border ${palette.border} ${palette.bg}`}>
                      <div>
                        <p className="font-semibold text-xs text-white/90">{tx.assetName} <span className="text-white/40">({tx.asset})</span></p>
                        <p className="text-[10px] text-white/40">{fmt(tx.amount, tx.quantityType)} @ {cp(tx.currency)}{tx.price.toFixed(2)}</p>
                      </div>
                      <p className={`font-bold text-xs ${palette.total}`}>{cp(tx.currency)}{tx.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className={`flex justify-between items-center pt-3 border-t ${palette.border}`}>
                  <span className="text-sm font-semibold text-white/70">Total</span>
                  <span className={`text-xl font-black ${palette.total}`}>
                    {cp(basketTransactions![0]?.currency)}{basketTransactions!.reduce((s, tx) => s + tx.total, 0).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className={`group/btn relative w-full overflow-hidden py-2.5 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] shadow-lg bg-gradient-to-r ${palette.btn} hover:-translate-y-0.5`}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative">Done</span>
                </button>
              </div>
            ) : transaction ? (
              <>
                {/* Receipt card */}
                <div className={`rounded-2xl border ${palette.border} ${palette.bg} p-4 space-y-3 mb-4`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-white/90">{transaction.assetName}</p>
                      <p className="text-[10px] text-white/40">{transaction.asset}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${palette.badge}`}>
                      {(transaction.status || 'filled').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { label: 'Amount', value: fmt(transaction.amount, transaction.quantityType) },
                      { label: 'Price',  value: `${txPrefix}${transaction.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: transaction.price < 1 ? 6 : 2 })}` },
                      { label: 'Fee',    value: `${txPrefix}${(transaction.total * 0.001).toFixed(2)}` },
                    ].map((row) => (
                      <div key={row.label} className="text-center">
                        <p className="text-[9px] text-white/30 uppercase tracking-wide mb-0.5">{row.label}</p>
                        <p className="text-xs font-bold text-white/80 truncate">{row.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className={`flex justify-between items-center pt-2.5 border-t ${palette.border}`}>
                    <span className="text-xs text-white/40">{isBuy ? 'Total Paid' : 'You Received'}</span>
                    <span className={`text-2xl font-black ${palette.total}`}>
                      {txPrefix}{transaction.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className={`group/btn relative w-full overflow-hidden py-2.5 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] shadow-lg bg-gradient-to-r ${palette.btn} hover:-translate-y-0.5`}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative">{isQueued ? 'Got it' : 'Done'}</span>
                </button>
              </>
            ) : null}

            <p className="text-[9px] text-white/20 text-center mt-3">Closes automatically</p>
          </div>
        </div>
      </div>
    </>
  );
}
