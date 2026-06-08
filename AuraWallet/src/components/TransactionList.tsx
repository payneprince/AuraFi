import React, { useState } from 'react';
import {
  ShoppingBag, Coffee, Banknote, ArrowLeftRight, Smartphone, HandCoins,
  PlusCircle, Receipt, ArrowDownLeft, ArrowUpRight, type LucideIcon,
} from 'lucide-react';
// @ts-ignore
import { walletData } from '@/lib/shared/mock-data';

type TxStyle = { Icon: LucideIcon; bg: string; text: string; spin: string };

const KEYWORD_STYLES: Array<{ match: RegExp; bg: string; text: string; spin: string; Icon: LucideIcon }> = [
  { match: /salary|deposit|income|payment received|freelance/i, bg: 'bg-green-500/15', text: 'text-green-300', spin: 'border-t-green-400/80 border-r-green-400/30', Icon: Banknote },
  { match: /grocery|store|shop|market|nike|best buy/i, bg: 'bg-purple-500/15', text: 'text-purple-300', spin: 'border-t-purple-400/80 border-r-purple-400/30', Icon: ShoppingBag },
  { match: /coffee|restaurant|food|dining|pizza|cafe/i, bg: 'bg-amber-500/15', text: 'text-amber-300', spin: 'border-t-amber-400/80 border-r-amber-400/30', Icon: Coffee },
  { match: /transfer|send|wallet/i, bg: 'bg-sky-500/15', text: 'text-sky-300', spin: 'border-t-sky-400/80 border-r-sky-400/30', Icon: ArrowLeftRight },
  { match: /mobile|momo|airtel|telecel|mtn/i, bg: 'bg-indigo-500/15', text: 'text-indigo-300', spin: 'border-t-indigo-400/80 border-r-indigo-400/30', Icon: Smartphone },
  { match: /request/i, bg: 'bg-pink-500/15', text: 'text-pink-300', spin: 'border-t-pink-400/80 border-r-pink-400/30', Icon: HandCoins },
  { match: /top ?up|add fund/i, bg: 'bg-emerald-500/15', text: 'text-emerald-300', spin: 'border-t-emerald-400/80 border-r-emerald-400/30', Icon: PlusCircle },
];

export const getWalletTxStyle = (description: string, amount: number): TxStyle => {
  const found = KEYWORD_STYLES.find((entry) => entry.match.test(description || ''));
  if (found) return found;
  return amount >= 0
    ? { Icon: ArrowDownLeft, bg: 'bg-green-500/15', text: 'text-green-300', spin: 'border-t-green-400/80 border-r-green-400/30' }
    : { Icon: ArrowUpRight, bg: 'bg-red-500/15', text: 'text-red-300', spin: 'border-t-red-400/80 border-r-red-400/30' };
};

export default function TransactionList({
  onTransactionClick,
}: {
  onTransactionClick?: (transaction: any) => void;
}) {
  const [filter, setFilter] = useState<'all'|'credit'|'debit'>('all');
  const [query, setQuery] = useState('');
  const filtered = walletData.transactions
    .filter((t: any) => filter === 'all' ? true : (filter === 'credit' ? t.amount > 0 : t.amount < 0))
    .filter((t: any) => t.description.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex gap-2">
          {(['all', 'credit', 'debit'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-base font-semibold capitalize transition-all duration-200 ${
                filter === key
                  ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white shadow-md shadow-green-500/20'
                  : 'bg-white/5 text-white/80 hover:bg-white/10 hover:-translate-y-0.5'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="bg-transparent border border-white/15 rounded-lg px-3 py-1.5 text-white text-base w-32 md:w-44 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent placeholder-white/40"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((t: any, idx: number) => {
          const isCredit = Number(t.amount) > 0;
          const { Icon, bg, text, spin } = getWalletTxStyle(t.description || '', Number(t.amount || 0));
          return (
            <div
              key={t.id}
              className={`group flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-all duration-200 border border-white/10 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 animate-in fade-in slide-in-from-bottom-1 fill-mode-both ${onTransactionClick ? 'cursor-pointer' : ''}`}
              style={{ animationDelay: `${idx * 40}ms` }}
              onClick={() => onTransactionClick?.(t)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ width: 40, height: 40 }}>
                  <div className={`absolute inset-0 rounded-full border-2 border-transparent ${spin} group-hover:animate-spin`} style={{ animationDuration: '2.5s' }} />
                  <div className={`absolute inset-[3px] rounded-full ${bg} ${text} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-base truncate">{t.description}</p>
                    {t.status && (
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'queued' ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'}`}>
                        {String(t.status).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-white/75 text-sm truncate">
                    {new Date(t.date).toLocaleDateString()}
                    {t.scheduledFor ? ` • Scheduled: ${new Date(t.scheduledFor).toLocaleString()}` : ''}
                  </p>
                </div>
              </div>
              <div className={`font-extrabold text-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.03] origin-right ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                {isCredit ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center text-white/75 text-base font-medium py-6 bg-white/5 rounded-xl border border-white/10 animate-in fade-in duration-300">No transactions found</div>
        )}
      </div>
    </div>
  );
}
