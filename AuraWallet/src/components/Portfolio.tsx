import React from 'react';
// @ts-ignore
import { vestData } from '@/lib/shared/mock-data';
import Sparkline from './Sparkline';

export default function Portfolio({ userId = 1 }: { userId?: number }) {
  const portfolio = vestData.portfolio.filter((p: any) => p.userId === userId);
  const total = portfolio.reduce((s: number, p: any) => s + p.value, 0);
  const miniSeries = portfolio.map((p: any) => p.value / (p.shares || 1));

  return (
    <div className="bg-gradient-to-br from-[#0f2a47] to-[#0B1E39] rounded-2xl p-4 border border-white/6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white/70 text-sm">Portfolio</p>
          <p className="text-white font-bold text-lg">${total.toFixed(2)}</p>
        </div>
        <div>
          <Sparkline data={miniSeries.length ? miniSeries : [1,2,3,2,4]} />
        </div>
      </div>

      <div className="space-y-2">
        {portfolio.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{p.symbol}</p>
              <p className="text-white/60 text-xs">{p.shares} shares • ${p.price.toFixed(2)}</p>
            </div>
            <div className="text-white font-semibold">${p.value.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
