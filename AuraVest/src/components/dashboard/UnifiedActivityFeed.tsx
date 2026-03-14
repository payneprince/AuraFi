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

  const fetchEvents = async (manual = false) => {
    if (manual) setSpinning(true);
    try {
      const res = await fetch(`${FINANCE_ORIGIN}/api/unified-ledger?userId=${getUserId()}`);
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
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">Aura Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Recent cross-app events</p>
          </div>
        </div>
        <button
          onClick={() => fetchEvents(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
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
              className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                  {APP_ICON[app] ?? <ArrowLeftRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {ev.description ?? `${type.charAt(0).toUpperCase() + type.slice(1)} · ${APP_LABEL[app] ?? app}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {app ? `${APP_LABEL[app] ?? app} · ` : ''}{ev.timestamp ? formatRelative(ev.timestamp) : ''}
                  </p>
                </div>
              </div>
              {amount !== null && (
                <span className={`text-sm font-semibold ${amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
