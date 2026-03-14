'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ArrowLeftRight, TrendingUp, Wallet, Building2 } from 'lucide-react';
import { getActiveWalletUserId } from '@/lib/wallet-state';

interface LedgerEvent {
  id?: string;
  type?: string;
  description?: string;
  amount?: number;
  timestamp?: string;
  app?: string;
}

const FINANCE_ORIGIN = 'http://localhost:3000';

const APP_ICON: Record<string, React.ReactNode> = {
  bank: <Building2 className="w-4 h-4" />,
  vest: <TrendingUp className="w-4 h-4" />,
  wallet: <Wallet className="w-4 h-4" />,
};

const APP_LABEL: Record<string, string> = {
  bank: 'AuraBank',
  vest: 'AuraVest',
  wallet: 'AuraWallet',
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UnifiedActivityFeed() {
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const fetchEvents = async (manual = false) => {
    if (manual) setSpinning(true);
    const userId = String(getActiveWalletUserId() || 1);
    try {
      const res = await fetch(`${FINANCE_ORIGIN}/api/unified-ledger?userId=${userId}`);
      if (res.ok) {
        const data = await res.json() as { events?: LedgerEvent[] };
        const sorted = (data.events || [])
          .slice()
          .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime())
          .slice(0, 15);
        setEvents(sorted);
      }
    } catch { /* hub not reachable */ }
    finally {
      setLoading(false);
      if (manual) setTimeout(() => setSpinning(false), 600);
    }
  };

  useEffect(() => {
    fetchEvents();
    const id = setInterval(() => fetchEvents(), 12_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || events.length === 0) return null;

  return (
    <div className="bg-[#0B1E39] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-semibold text-white">Aura Activity</h3>
            <p className="text-xs text-white/50 mt-0.5">Recent cross-app events</p>
          </div>
        </div>
        <button
          onClick={() => fetchEvents(true)}
          className="text-white/40 hover:text-white/80 transition-colors"
          aria-label="Refresh activity"
        >
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-1">
        {events.map((ev, idx) => {
          const type = String(ev.type || 'event').toLowerCase();
          const app = String(ev.app || '').toLowerCase();
          const amount = typeof ev.amount === 'number' ? ev.amount : null;

          return (
            <div
              key={ev.id ?? idx}
              className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-blue-300">
                  {APP_ICON[app] ?? <ArrowLeftRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-tight">
                    {ev.description ?? `${type.charAt(0).toUpperCase() + type.slice(1)} · ${APP_LABEL[app] ?? app}`}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {app ? `${APP_LABEL[app] ?? app} · ` : ''}{ev.timestamp ? formatRelative(ev.timestamp) : ''}
                  </p>
                </div>
              </div>
              {amount !== null && (
                <span className={`text-sm font-semibold ${amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {amount >= 0 ? '+' : ''}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
