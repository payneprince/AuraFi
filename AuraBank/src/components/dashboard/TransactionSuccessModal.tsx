'use client';

import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { Currency } from '@/types';

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    fromAccount: string;
    toAccount: string;
    amount: number;
    convertedAmount?: number;
    fromCurrency: Currency;
    toCurrency: Currency;
    description?: string;
  } | null;
}

const CONFETTI = [
  { dx: '0px',   dy: '-88px', color: '#34d399', delay: '0s'    },
  { dx: '62px',  dy: '-62px', color: '#a78bfa', delay: '0.05s' },
  { dx: '88px',  dy: '0px',   color: '#f472b6', delay: '0.1s'  },
  { dx: '62px',  dy: '62px',  color: '#60a5fa', delay: '0.05s' },
  { dx: '0px',   dy: '88px',  color: '#34d399', delay: '0s'    },
  { dx: '-62px', dy: '62px',  color: '#fbbf24', delay: '0.1s'  },
  { dx: '-88px', dy: '0px',   color: '#34d399', delay: '0.05s' },
  { dx: '-62px', dy: '-62px', color: '#a78bfa', delay: '0s'    },
  { dx: '42px',  dy: '-76px', color: '#f472b6', delay: '0.12s' },
  { dx: '-42px', dy: '-76px', color: '#60a5fa', delay: '0.08s' },
  { dx: '76px',  dy: '-30px', color: '#34d399', delay: '0.15s' },
  { dx: '-76px', dy: '30px',  color: '#fbbf24', delay: '0.03s' },
];

export function TransactionSuccessModal({ isOpen, onClose, transaction }: TransactionSuccessModalProps) {
  if (!isOpen || !transaction) return null;

  const hasCurrencyConversion = transaction.fromCurrency !== transaction.toCurrency && transaction.convertedAmount;

  return (
    <>
      <style>{`
        @keyframes bankConfetti {
          0%   { transform: translate(0,0) scale(0); opacity:1; }
          60%  { opacity:1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.25); opacity:0; }
        }
        @keyframes bankCheckDraw {
          from { stroke-dashoffset: 48; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes bankCircleDraw {
          from { stroke-dashoffset: 166; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes bankModalPop {
          from { opacity:0; transform: scale(0.82) translateY(24px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#080d1a] border border-white/12 shadow-2xl"
          style={{ animation: 'bankModalPop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow blobs */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-52 h-52 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-violet-500/15 blur-3xl" />

          {/* Confetti burst */}
          <div className="absolute inset-0 flex items-start justify-center pt-12 pointer-events-none overflow-hidden">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: c.color,
                  '--dx': c.dx,
                  '--dy': c.dy,
                  animation: `bankConfetti 0.75s ease-out ${c.delay} forwards`,
                } as React.CSSProperties}
              />
            ))}
          </div>

          <div className="p-6">
            {/* Close button */}
            <div className="flex justify-end mb-1">
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center hover:rotate-90 transition-all duration-200"
              >
                <X className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>

            {/* Animated SVG checkmark */}
            <div className="flex justify-center mb-5">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.5s' }} />
                <svg viewBox="0 0 52 52" className="relative w-20 h-20" fill="none">
                  <defs>
                    <linearGradient id="bankCkGrad" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#34d399" />
                      <stop offset="1" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="26" cy="26" r="24"
                    stroke="url(#bankCkGrad)" strokeWidth="2"
                    style={{ strokeDasharray: 166, animation: 'bankCircleDraw 0.5s ease-out forwards' }}
                  />
                  <path
                    d="M14 27l8 8 16-16"
                    stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    style={{ strokeDasharray: 48, strokeDashoffset: 48, animation: 'bankCheckDraw 0.4s ease-out 0.45s forwards' }}
                  />
                </svg>
              </div>
            </div>

            {/* Amount + badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Transfer Successful
              </div>
              <p className="text-4xl font-black text-white mt-1">
                {formatCurrency(transaction.amount, transaction.fromCurrency)}
              </p>
              <p className="text-white/40 text-xs mt-1">transferred successfully</p>
            </div>

            {/* From → To */}
            <div className="flex items-center justify-center gap-4 mb-5 bg-white/5 border border-white/8 rounded-2xl py-3.5 px-5">
              <div className="text-center">
                <p className="text-[10px] text-white/30 mb-1">From</p>
                <p className="text-sm font-bold text-white/80">{transaction.fromAccount}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  -{formatCurrency(transaction.amount, transaction.fromCurrency)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-1 justify-center">
                <span className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-500/50" />
                <ArrowRight className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0" />
                <span className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/30 mb-1">To</p>
                <p className="text-sm font-bold text-white/80">{transaction.toAccount}</p>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                  +{formatCurrency(transaction.convertedAmount || transaction.amount, transaction.toCurrency)}
                </p>
              </div>
            </div>

            {/* Description */}
            {transaction.description && (
              <div className="mb-4 px-1">
                <p className="text-xs text-white/30">Description</p>
                <p className="text-sm text-white/70 mt-0.5">{transaction.description}</p>
              </div>
            )}

            {/* Currency conversion */}
            {hasCurrencyConversion && (
              <div className="mb-4 bg-white/5 border border-white/8 rounded-xl p-3">
                <p className="text-xs text-white/40">
                  Exchange rate applied: {formatCurrency(transaction.amount, transaction.fromCurrency)} = {formatCurrency(transaction.convertedAmount!, transaction.toCurrency)}
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="group/done relative w-full overflow-hidden rounded-xl py-3 font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-violet-600 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="absolute inset-0 -translate-x-full group-hover/done:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative">Done</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
