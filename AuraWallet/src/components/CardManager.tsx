import React from 'react';

const mockCards = [
  { id: 1, brand: 'AuraBank', last4: '1234', type: 'Debit' },
  { id: 2, brand: 'AuraBank', last4: '5678', type: 'Credit' },
];

export default function CardManager() {
  return (
    <div className="bg-gradient-to-br from-[#071229] to-[#071029] rounded-2xl p-4 border border-white/6">
      <h4 className="text-white font-semibold mb-3">Saved Cards</h4>
      <div className="space-y-2">
        {mockCards.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-white/3 rounded p-3">
            <div>
              <div className="text-white font-medium">{c.brand} •••• {c.last4}</div>
              <div className="text-white/60 text-xs">{c.type}</div>
            </div>
            <button className="px-3 py-1 rounded bg-white/5 text-white">Use</button>
          </div>
        ))}
      </div>
    </div>
  );
}
