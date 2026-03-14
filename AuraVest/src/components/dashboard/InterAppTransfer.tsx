'use client';

import { useState } from 'react';
import { ArrowLeftRight, X, CheckCircle2, AlertCircle } from 'lucide-react';

type App = 'bank' | 'wallet' | 'vest';

const APP_LABELS: Record<App, string> = {
  bank: 'AuraBank',
  wallet: 'AuraWallet',
  vest: 'AuraVest',
};

const FINANCE_ORIGIN = 'http://localhost:3000';

export default function InterAppTransfer({ sourceApp = 'vest' as App }: { sourceApp?: App }) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState<App>(sourceApp === 'vest' ? 'bank' : 'vest');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const destinations = (Object.keys(APP_LABELS) as App[]).filter((a) => a !== sourceApp);

  const getUserId = () => {
    try {
      const stored = localStorage.getItem('auravest_user');
      if (stored) {
        const parsed = JSON.parse(stored) as { id?: string | number };
        return String(parsed.id || '1');
      }
    } catch { /* ignore */ }
    return sessionStorage.getItem('paynesuite_userId') || '1';
  };

  const handleOpen = () => {
    setOpen(true);
    setStatus('idle');
    setMessage('');
    setAmount('');
    setTo(sourceApp === 'vest' ? 'bank' : 'vest');
  };

  const handleTransfer = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    setStatus('loading');
    try {
      const res = await fetch(`${FINANCE_ORIGIN}/api/quick-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: sourceApp, to, amount: num, userId: getUserId() }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        setStatus('success');
        setMessage(`$${num.toFixed(2)} transferred to ${APP_LABELS[to]}`);
        setAmount('');
        setTimeout(() => { setOpen(false); setStatus('idle'); setMessage(''); }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Transfer failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Could not reach AuraFinance hub (port 3000). Ensure it is running.');
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-black to-crimson-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        <ArrowLeftRight className="w-4 h-4" />
        Transfer to Aura App
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold">Transfer to Aura App</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {status === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-base">{message}</p>
                <p className="text-sm text-muted-foreground mt-1">The receiving app will reflect the balance shortly.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">From</label>
                  <div className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm opacity-70">
                    {APP_LABELS[sourceApp]}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">To</label>
                  <select
                    value={to}
                    onChange={(e) => setTo(e.target.value as App)}
                    className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {destinations.map((d) => (
                      <option key={d} value={d}>{APP_LABELS[d]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Amount (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder-muted-foreground"
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-500">{message}</p>
                  </div>
                )}

                <button
                  onClick={handleTransfer}
                  disabled={!amount || parseFloat(amount) <= 0 || status === 'loading'}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-black to-crimson-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'Transferring…' : `Send to ${APP_LABELS[to]}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
