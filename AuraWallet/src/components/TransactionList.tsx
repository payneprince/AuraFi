import React, { useState } from 'react';
// @ts-ignore
import { walletData } from '@/lib/shared/mock-data';

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
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-base font-semibold ${filter==='all' ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>All</button>
          <button onClick={() => setFilter('credit')} className={`px-3 py-1.5 rounded-lg text-base font-semibold ${filter==='credit' ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>Credit</button>
          <button onClick={() => setFilter('debit')} className={`px-3 py-1.5 rounded-lg text-base font-semibold ${filter==='debit' ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>Debit</button>
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="bg-transparent border border-white/15 rounded-lg px-3 py-1.5 text-white text-base w-32 md:w-44" />
      </div>

      <div className="space-y-2">
        {filtered.map((t: any) => (
          <div
            key={t.id}
            className={`flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors border border-white/10 ${onTransactionClick ? 'cursor-pointer' : ''}`}
            onClick={() => onTransactionClick?.(t)}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold text-base">{t.description}</p>
                {t.status && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'queued' ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'}`}>
                    {String(t.status).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-white/75 text-sm">
                {new Date(t.date).toLocaleDateString()}
                {t.scheduledFor ? ` • Scheduled: ${new Date(t.scheduledFor).toLocaleString()}` : ''}
              </p>
            </div>
            <div className={`font-extrabold text-lg ${t.amount>0 ? 'text-green-400' : 'text-red-400'}`}>{t.amount>0?'+':'-'}${Math.abs(t.amount).toFixed(2)}</div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-white/75 text-base font-medium py-6 bg-white/5 rounded-xl border border-white/10">No transactions found</div>
        )}
      </div>
    </div>
  );
}
