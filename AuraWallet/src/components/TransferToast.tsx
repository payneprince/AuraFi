'use client';

import { useEffect } from 'react';

export interface TransferToastData {
  id: string;
  amount: number;
  fromApp: string;
  toApp: string;
  direction: 'incoming' | 'outgoing';
}

function appLabel(app: string) {
  if (app === 'bank') return 'AuraBank';
  if (app === 'wallet') return 'AuraWallet';
  if (app === 'vest') return 'AuraVest';
  return app;
}

function Toast({ toast, onDismiss }: { toast: TransferToastData; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4500);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const incoming = toast.direction === 'incoming';
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(toast.amount);

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl px-4 py-3 min-w-[280px] max-w-xs">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-lg ${incoming ? 'bg-emerald-500' : 'bg-slate-400'}`}>
        {incoming ? '↓' : '↑'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{incoming ? `${formatted} received` : `${formatted} sent`}</p>
        <p className="text-xs text-muted-foreground">{incoming ? `From ${appLabel(toast.fromApp)}` : `To ${appLabel(toast.toApp)}`}</p>
      </div>
      <button onClick={() => onDismiss(toast.id)} className="text-muted-foreground hover:text-foreground text-xl leading-none flex-shrink-0">×</button>
    </div>
  );
}

export function TransferToastContainer({ toasts, onDismiss }: { toasts: TransferToastData[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}
