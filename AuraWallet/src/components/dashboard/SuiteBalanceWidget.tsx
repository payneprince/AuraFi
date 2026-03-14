'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { getActiveWalletUserId } from '@/lib/wallet-state';

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

  const fetchBalances = async (manual = false) => {
    if (manual) setSpinning(true);
    const userId = String(getActiveWalletUserId() || 1);
    try {
      const res = await fetch(`${FINANCE_ORIGIN}/api/suite-balances?userId=${userId}`);
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
    { key: 'vest', label: 'AuraVest', value: balances.vest?.totalValue ?? 0, href: 'http://localhost:3002/dashboard' },
    { key: 'wallet', label: 'AuraWallet', value: balances.wallet?.balance ?? 0, current: true },
  ];

  return (
    <div className="bg-[#0B1E39] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">Aura Suite Overview</h3>
          <p className="text-xs text-white/50 mt-0.5">Live balances across all your Aura apps</p>
        </div>
        <button
          onClick={() => fetchBalances(true)}
          className="text-white/40 hover:text-white/80 transition-colors"
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
              className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-3"
            >
              <p className="text-xs text-white/50 mb-1">{app.label}</p>
              <p className="font-bold text-sm text-blue-400">{fmt(app.value)}</p>
            </div>
          ) : (
            <a
              key={app.key}
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 p-3 transition group cursor-pointer"
            >
              <p className="text-xs text-white/50 mb-1 flex items-center gap-1">
                {app.label}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="font-bold text-sm text-white">{fmt(app.value)}</p>
            </a>
          )
        )}
      </div>

      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-sm text-white/50">Total Net Worth</span>
        <span className="text-xl font-bold text-white">{fmt(netWorth)}</span>
      </div>
    </div>
  );
}
