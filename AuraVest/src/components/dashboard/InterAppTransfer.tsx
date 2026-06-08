'use client';

import { useState } from 'react';
import { ArrowLeftRight, ArrowRight, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

type App = 'bank' | 'wallet' | 'vest';

const APP_LABELS: Record<App, string> = {
  bank: 'AuraBank',
  wallet: 'AuraWallet',
  vest: 'AuraVest',
};

const APP_LOGOS: Record<App, string> = {
  bank: '/app-logos/bank.jpg',
  vest: '/app-logos/vest.jpeg',
  wallet: '/app-logos/wallet.jpeg',
};

const APP_META: Record<App, { ring: string; glow: string; text: string }> = {
  bank: { ring: 'ring-indigo-500/30', glow: 'bg-indigo-500/40', text: 'text-indigo-500' },
  vest: { ring: 'ring-red-500/30', glow: 'bg-red-500/40', text: 'text-red-500' },
  wallet: { ring: 'ring-emerald-500/30', glow: 'bg-emerald-500/40', text: 'text-emerald-500' },
};

const FINANCE_ORIGIN = 'http://localhost:3000';

function AppBadge({ app, size = 'lg', pulse = false }: { app: App; size?: 'lg' | 'sm'; pulse?: boolean }) {
  const meta = APP_META[app];
  const dims = size === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-9 h-9 rounded-xl';
  return (
    <div className={`relative ${dims} flex items-center justify-center bg-white shadow-lg ring-2 ${meta.ring} overflow-hidden transition-transform duration-300`}>
      {pulse && <span className={`absolute inset-0 rounded-2xl ${meta.glow} blur-xl animate-pulse`} />}
      <img src={APP_LOGOS[app]} alt={APP_LABELS[app]} className="relative w-full h-full object-cover" />
    </div>
  );
}

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
        className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-black to-crimson-600 text-white font-semibold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300"
      >
        <ArrowLeftRight className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
        Transfer to Aura App
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />

            <div className="relative flex items-center justify-between mb-5">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                Transfer to Aura App
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:rotate-90 transition-all duration-300"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {status === 'success' ? (
              <div className="relative text-center py-8 animate-in zoom-in-95 fade-in duration-300">
                <div className="flex items-center justify-center gap-4 mb-5">
                  <AppBadge app={sourceApp} pulse />
                  <ArrowRight className="w-5 h-5 text-green-500 animate-pulse" />
                  <AppBadge app={to} pulse />
                </div>
                <div className="relative inline-flex mb-3">
                  <span className="absolute inset-0 rounded-full bg-green-500/30 blur-xl animate-ping [animation-duration:1.5s]" />
                  <CheckCircle2 className="relative w-12 h-12 text-green-500" />
                </div>
                <p className="font-bold text-base">{message}</p>
                <p className="text-sm text-muted-foreground mt-1">The receiving app will reflect the balance shortly.</p>
              </div>
            ) : (
              <div className="relative space-y-4">
                {/* Animated transfer flow visualization */}
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <AppBadge app={sourceApp} />
                    <span className="text-[11px] font-medium text-muted-foreground">{APP_LABELS[sourceApp]}</span>
                  </div>

                  <div className="relative flex-1 h-8 max-w-[88px] flex items-center">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"
                        style={{ animation: `flow-right 1.8s ease-in-out infinite`, animationDelay: `${i * 0.55}s` }}
                      />
                    ))}
                    <ArrowRight className="absolute right-0 w-4 h-4 text-red-500/60" />
                  </div>

                  <div className="flex flex-col items-center gap-1.5 transition-all duration-300">
                    <AppBadge app={to} />
                    <span className="text-[11px] font-medium text-foreground">{APP_LABELS[to]}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">From</label>
                  <div className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm opacity-70">
                    {APP_LABELS[sourceApp]}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">To</label>
                  <div className="grid grid-cols-2 gap-2">
                    {destinations.map((d) => {
                      const active = to === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setTo(d)}
                          className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'border-red-500/40 bg-red-500/10 shadow-sm'
                              : 'border-border bg-muted hover:bg-muted/70 hover:-translate-y-0.5'
                          }`}
                        >
                          <span className={`flex items-center justify-center w-7 h-7 rounded-lg bg-white overflow-hidden flex-shrink-0 ring-1 ring-border transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
                            <img src={APP_LOGOS[d]} alt={APP_LABELS[d]} className="w-full h-full object-cover" />
                          </span>
                          {APP_LABELS[d]}
                          {active && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                        </button>
                      );
                    })}
                  </div>
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
                    className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-muted-foreground transition-all duration-200"
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-500">{message}</p>
                  </div>
                )}

                <button
                  onClick={handleTransfer}
                  disabled={!amount || parseFloat(amount) <= 0 || status === 'loading'}
                  className="group relative w-full py-3 rounded-lg bg-gradient-to-r from-black to-crimson-600 text-white font-semibold text-sm overflow-hidden hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative flex items-center justify-center gap-2">
                    {status === 'loading' && (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    )}
                    {status === 'loading' ? 'Transferring…' : `Send to ${APP_LABELS[to]}`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
