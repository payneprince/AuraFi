'use client';

import { useState } from 'react';
import { X, Bell } from 'lucide-react';

export default function PriceAlertModal({ asset, onClose }: any) {
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('above');

  const handleSet = () => {
    alert(`Price Alert Set! You'll be notified when ${asset.symbol} goes ${condition} $${targetPrice}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 animate-slideIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-yellow-500" />Set Price Alert</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">Get notified when {asset.name} reaches your target price</p>
          <p className="text-2xl font-bold mt-2">Current: ${asset.price.toLocaleString()}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full p-2.5 bg-background border border-border rounded-lg">
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Target Price</label>
            <input type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder={asset.price.toString()} className="w-full p-2.5 bg-background border border-border rounded-lg" />
          </div>
        </div>

        <button onClick={handleSet} disabled={!targetPrice} className="w-full py-2.5 mt-6 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50">Set Alert</button>
      </div>
    </div>
  );
}
