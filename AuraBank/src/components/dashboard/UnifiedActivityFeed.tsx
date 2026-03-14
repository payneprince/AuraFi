'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ArrowLeftRight, TrendingUp, Wallet, Building2 } from 'lucide-react';

interface LedgerEvent {
  id?: string;
  type?: string;
  description?: string;
  amount?: number;
  timestamp?: string;
  app?: string;
  direction?: string;
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

const TYPE_COLOR: Record<string, string> = {
  transfer: 'text-magenta-500 bg-magenta-500/10',
  deposit: 'text-teal-500 bg-teal-500/10',
  withdrawal: 'text-orange-500 bg-orange-500/10',
  trade: 'text-blue-500 bg-blue-500/10',
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

  const getUserId = () => {
    if (typeof sessionStorage === 'undefined') return '1';
    return sessionStorage.getItem('userId') || '1';
  };

  const fetchEvents = async (manual = false) => {
    if (manual) setSpinning(true);
    try {
      const res = await fetch(`${FINANCE_ORIGIN}/api/unified-ledger?userId=${getUserId()}`);
      if (res.ok) {
        const data = await res.json() as { events?: LedgerEvent[] };
        const raw = (data.events || []) as LedgerEvent[];
        const sorted = raw
          .slice()
          .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime())
          .slice(0, 15);
        setEvents(sorted);
      }
    } catch {
      // AuraFinance hub not reachable — silently skip
    } finally {
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

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-magenta-500" />
          <div>
            <h2 className="text-xl font-bold text-text-dark">Aura Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">Recent cross-app events</p>
          </div>
        </div>
        <button
          onClick={() => fetchEvents(true)}
          className="text-slate-400 hover:text-magenta-500 transition-colors"
          aria-label="Refresh activity"
        >
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        {events.map((ev, idx) => {
          const type = String(ev.type || 'transfer').toLowerCase();
          const app = String(ev.app || '').toLowerCase();
          const colorCls = TYPE_COLOR[type] ?? 'text-slate-500 bg-slate-100';
          const amount = typeof ev.amount === 'number' ? ev.amount : null;

          return (
            <div
              key={ev.id ?? idx}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-navy-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                  {APP_ICON[app] ?? <ArrowLeftRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-dark leading-tight">
                    {ev.description ?? `${type.charAt(0).toUpperCase() + type.slice(1)} · ${APP_LABEL[app] ?? app}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {app ? `${APP_LABEL[app] ?? app} · ` : ''}{ev.timestamp ? formatRelative(ev.timestamp) : ''}
                  </p>
                </div>
              </div>
              {amount !== null && (
                <span className={`text-sm font-semibold ${amount >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
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
