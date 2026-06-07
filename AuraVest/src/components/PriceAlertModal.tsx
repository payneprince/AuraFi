'use client';

import { useState } from 'react';
import { X, Bell, CheckCircle } from 'lucide-react';

export default function PriceAlertModal({ asset, onClose }: any) {
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('above');
  const [success, setSuccess] = useState(false);

  const handleSet = () => {
    setSuccess(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 animate-slideIn" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="text-center space-y-3 py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-yellow-500/15 animate-ping" style={{ animationDuration: '1.6s' }} />
              <div className="absolute inset-0 rounded-full bg-yellow-500/15 animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.35s' }} />
              <div className="absolute inset-2 rounded-full bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-yellow-500" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base">Price Alert Set</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;ll notify you when {asset.symbol} goes {condition} ${Number(targetPrice).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-white text-sm font-bold transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
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

            <button onClick={handleSet} disabled={!targetPrice} className="w-full py-2.5 mt-6 bg-primary text-primary-foreground rounded-lg font-semibold transition-all active:scale-[0.98] disabled:opacity-50">Set Alert</button>
          </>
        )}
      </div>
    </div>
  );
}
