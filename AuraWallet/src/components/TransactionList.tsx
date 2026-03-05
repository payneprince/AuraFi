import React, { useState } from 'react';
// @ts-ignore
import { walletData } from '@/lib/shared/mock-data';

export default function TransactionList() {
  const [filter, setFilter] = useState<'all'|'credit'|'debit'>('all');
  const [query, setQuery] = useState('');

  const filtered = walletData.transactions
    .filter((t: any) => filter === 'all' ? true : (filter === 'credit' ? t.amount > 0 : t.amount < 0))
    .filter((t: any) => t.description.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="bg-gradient-to-br from-[#0f2945] to-[#071529] rounded-2xl p-4 border border-white/6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded ${filter==='all' ? 'bg-[#29C7D9]' : 'bg-white/5'}`}>All</button>
          <button onClick={() => setFilter('credit')} className={`px-3 py-1 rounded ${filter==='credit' ? 'bg-[#29C7D9]' : 'bg-white/5'}`}>Credit</button>
          <button onClick={() => setFilter('debit')} className={`px-3 py-1 rounded ${filter==='debit' ? 'bg-[#29C7D9]' : 'bg-white/5'}`}>Debit</button>
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="bg-transparent border border-white/10 rounded px-2 py-1 text-white text-sm" />
      </div>

      <div className="space-y-3">
        {filtered.map((t: any) => (
          <div key={t.id} className="flex items-center justify-between bg-white/3 rounded p-3">
            <div>
              <p className="text-white font-medium">{t.description}</p>
              <p className="text-white/60 text-xs">{new Date(t.date).toLocaleDateString()}</p>
            </div>
            <div className={`font-bold ${t.amount>0 ? 'text-green-400' : 'text-red-400'}`}>{t.amount>0?'+':'-'}${Math.abs(t.amount).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
