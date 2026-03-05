'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';

export default function DCAModal({ assets, onClose }: any) {
  const [amount, setAmount] = useState('100');
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [frequency, setFrequency] = useState('weekly');

  const handleCreate = () => {
    alert(`DCA Plan Created! $${amount} in ${selectedAsset.symbol} ${frequency}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 animate-slideIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500" />Recurring Investment</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Amount (USD)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2.5 bg-background border border-border rounded-lg" />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Asset</label>
            <select value={selectedAsset.id} onChange={(e) => setSelectedAsset(assets.find((a: any) => a.id === e.target.value))} className="w-full p-2.5 bg-background border border-border rounded-lg">
              {assets.map((asset: any) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.symbol})</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Frequency</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full p-2.5 bg-background border border-border rounded-lg">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-muted rounded-lg">Cancel</button>
          <button onClick={handleCreate} className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold">Confirm</button>
        </div>
      </div>
    </div>
  );
}
