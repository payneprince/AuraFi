import React from 'react';

export const auraBankCards = [
  { id: 1, brand: 'AuraBank', last4: '1234', type: 'Debit' },
  { id: 2, brand: 'AuraBank', last4: '5678', type: 'Credit' },
];

export default function CardManager() {
  return (
    <div>
      <h4 className="text-white font-bold text-xl mb-3">Saved Cards</h4>
      <div className="space-y-2">
        {auraBankCards.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10">
            <div>
              <div className="text-white font-semibold text-base">{c.brand} •••• {c.last4}</div>
              <div className="text-white/75 text-sm">{c.type}</div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-black via-white/15 to-green-500 text-white text-base font-semibold hover:opacity-90">Use</button>
          </div>
        ))}
      </div>
    </div>
  );
}
