'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface SuiteBalances {
  bank: { totalBalance: number };
  vest: { totalValue: number };
  wallet: { balance: number };
}

const FINANCE_ORIGIN = 'http://localhost:3000';

export default function SuiteBalanceWidget() {
  const [balances, setBalances] = useState<SuiteBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const getUserId = () => {
    if (typeof sessionStorage === 'undefined') return '1';
    return sessionStorage.getItem('userId') || '1';
  };

  const fetchBalances = async (manual = false) => {
    if (manual) setSpinning(true);
    try {
      const res = await fetch(`${FINANCE_ORIGIN}/api/suite-balances?userId=${getUserId()}`);
      if (res.ok) setBalances(await res.json());
    } catch {
      // AuraFinance hub not reachable — silently skip
    } finally {
      setLoading(false);
      if (manual) setTimeout(() => setSpinning(false), 600);
    }
  };

  useEffect(() => {
    fetchBalances();
    const id = setInterval(() => fetchBalances(), 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  if (loading || !balances) return null;

  const netWorth =
    (balances.bank?.totalBalance ?? 0) +
    (balances.vest?.totalValue ?? 0) +
    (balances.wallet?.balance ?? 0);

  const apps: { key: string; label: string; value: number; href: string; current?: boolean }[] = [
    { key: 'bank', label: 'AuraBank', value: balances.bank?.totalBalance ?? 0, href: '#', current: true },
    { key: 'vest', label: 'AuraVest', value: balances.vest?.totalValue ?? 0, href: 'http://localhost:3002/dashboard' },
    { key: 'wallet', label: 'AuraWallet', value: balances.wallet?.balance ?? 0, href: 'http://localhost:3003' },
  ];

  return (
    <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-text-dark">Aura Suite Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Live balances across all your Aura apps</p>
        </div>
        <button
          onClick={() => fetchBalances(true)}
          className="text-slate-400 hover:text-magenta-500 transition-colors"
          aria-label="Refresh balances"
        >
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {apps.map((app) => (
          app.current ? (
            <div
              key={app.key}
              className="block rounded-xl bg-gradient-to-br from-magenta-500/10 to-teal-500/10 border border-magenta-500/30 p-3"
            >
              <p className="text-xs text-slate-500 mb-1">{app.label}</p>
              <p className="font-bold text-sm text-magenta-500">{fmt(app.value)}</p>
            </div>
          ) : (
            <a
              key={app.key}
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-navy-50 hover:bg-navy-100 border border-navy-700 p-3 transition group"
            >
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                {app.label}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="font-bold text-sm text-text-dark">{fmt(app.value)}</p>
            </a>
          )
        ))}
      </div>

      <div className="pt-3 border-t border-navy-700 flex items-center justify-between">
        <span className="text-sm text-slate-500">Total Net Worth</span>
        <span className="text-xl font-bold bg-gradient-to-r from-magenta-500 to-teal-500 bg-clip-text text-transparent">
          {fmt(netWorth)}
        </span>
      </div>
    </div>
  );
}
