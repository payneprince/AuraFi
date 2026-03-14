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
    try {
      const stored = localStorage.getItem('auravest_user');
      if (stored) {
        const parsed = JSON.parse(stored) as { id?: string | number };
        return String(parsed.id || '1');
      }
    } catch { /* ignore */ }
    return sessionStorage.getItem('paynesuite_userId') || '1';
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

  const apps: { key: string; label: string; value: number; href?: string; current?: boolean }[] = [
    { key: 'bank', label: 'AuraBank', value: balances.bank?.totalBalance ?? 0, href: 'http://localhost:3001' },
    { key: 'vest', label: 'AuraVest', value: balances.vest?.totalValue ?? 0, current: true },
    { key: 'wallet', label: 'AuraWallet', value: balances.wallet?.balance ?? 0, href: 'http://localhost:3003' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Aura Suite Overview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Live balances across all your Aura apps</p>
        </div>
        <button
          onClick={() => fetchBalances(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Refresh balances"
        >
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {apps.map((app) =>
          app.current ? (
            <div
              key={app.key}
              className="rounded-lg border border-primary/30 bg-primary/5 p-3"
            >
              <p className="text-xs text-muted-foreground mb-1">{app.label}</p>
              <p className="font-bold text-sm text-primary">{fmt(app.value)}</p>
            </div>
          ) : (
            <a
              key={app.key}
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-border hover:bg-accent p-3 transition group cursor-pointer"
            >
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                {app.label}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="font-bold text-sm">{fmt(app.value)}</p>
            </a>
          )
        )}
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total Net Worth</span>
        <span className="text-xl font-bold bg-gradient-to-r from-black to-crimson-600 bg-clip-text text-transparent dark:from-white dark:to-crimson-400">
          {fmt(netWorth)}
        </span>
      </div>
    </div>
  );
}
