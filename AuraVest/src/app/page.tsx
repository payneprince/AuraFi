'use client';

import { useEffect, useState } from 'react';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { switchScopedAppStorage } from '../../../shared/browser-app-state';
import { readUnifiedAuthSession, writeUnifiedAuthSession } from '../../../shared/unified-auth';
import { AURAVEST_STORAGE_KEYS } from '@/lib/vestStateKeys';

export default function HomePage() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let activeUserId = '1';
    let lastPersistedSnapshot = '';

    const buildDefaults = (id: number, isDemoUser: boolean, unifiedSession: ReturnType<typeof readUnifiedAuthSession>) => ({
      auravest_user: JSON.stringify({
        id: String(id),
        email: unifiedSession?.email || (isDemoUser ? 'demo@aurafinance.com' : `user${id}@aurafinance.com`),
        name: unifiedSession?.name || (isDemoUser ? 'Demo User' : `User ${id}`),
      }),
      auravest_portfolio: JSON.stringify(isDemoUser ? {
        totalValue: 125847.32,
        change24h: 3.45,
        changeAmount: 4201.23,
        assets: [
          { type: 'Crypto', value: 45230.5, allocation: 35.9 },
          { type: 'Stocks', value: 52180.2, allocation: 41.4 },
          { type: 'Gold', value: 18436.62, allocation: 14.6 },
          { type: 'NFTs', value: 10000, allocation: 7.9 },
        ],
      } : {
        totalValue: 0,
        change24h: 0,
        changeAmount: 0,
        assets: [],
      }),
      auravest_transactions: JSON.stringify([]),
      auravest_trade_holdings: JSON.stringify([]),
      auravest_cash_balance: JSON.stringify(0),
      auravest_cash_starting_balance: JSON.stringify(0),
      auravest_local_positions: JSON.stringify([]),
      auravest_watchlist: JSON.stringify([]),
      auravest_dca: JSON.stringify([]),
      auravest_alerts: JSON.stringify([]),
      auravest_notifications: JSON.stringify([]),
      auravest_dark_mode: JSON.stringify(false),
    });

    const captureCurrentState = () => {
      const snapshot: Record<string, string | null> = {};
      for (const key of AURAVEST_STORAGE_KEYS) {
        snapshot[key] = localStorage.getItem(key);
      }
      return snapshot;
    };

    const persistStateToServer = async () => {
      if (!activeUserId) return;
      const state = captureCurrentState();
      const serialized = JSON.stringify(state);
      if (serialized === lastPersistedSnapshot) return;

      try {
        await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: activeUserId, state }),
          keepalive: true,
        });
        lastPersistedSnapshot = serialized;
      } catch {
        // Ignore transient network issues; next interval retry will pick up the change.
      }
    };

    const bootstrap = async () => {
      const urlUserId = new URLSearchParams(window.location.search).get('userId');
      const unifiedSession = readUnifiedAuthSession();
      const sessionUserId = sessionStorage.getItem('paynesuite_userId');

      if (!urlUserId && !unifiedSession?.userId && !sessionUserId) {
        const host = window.location.hostname || 'localhost';
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        window.location.href = `${protocol}//${host}:3000/login`;
        return;
      }

      const id = parseInt(urlUserId || unifiedSession?.userId || sessionUserId || '1', 10);
      const isDemoUser = String(id) === '1';
      activeUserId = String(id);

      try {
        const response = await fetch(`/api/state?userId=${encodeURIComponent(activeUserId)}`);
        if (response.ok) {
          const payload = await response.json() as { state?: Record<string, string | null> | null };
          if (payload?.state) {
            localStorage.setItem(`aurasuite_auravest_state_${activeUserId}`, JSON.stringify(payload.state));
          }
        }
      } catch {
        // Fallback to existing local snapshot/defaults when server state is unavailable.
      }

      const defaults = buildDefaults(id, isDemoUser, unifiedSession);

      switchScopedAppStorage({
        appName: 'auravest',
        userId: activeUserId,
        genericKeys: [...AURAVEST_STORAGE_KEYS],
        defaults,
      });

      // Self-heal: a stale/corrupted server snapshot (e.g. nulls from a prior bad sync)
      // makes switchScopedAppStorage apply blank values for the demo user instead of
      // defaults, and that blank state then gets persisted right back to the server —
      // a permanent zero-balance loop. Detect a blank demo portfolio and reseed
      // localStorage with defaults BEFORE the snapshot is captured and pushed to the server.
      if (isDemoUser) {
        let isBlank = true;
        try {
          const portfolioRaw = localStorage.getItem('auravest_portfolio');
          const portfolio = portfolioRaw ? JSON.parse(portfolioRaw) : null;
          isBlank = !portfolio || !portfolio.totalValue;
        } catch {
          isBlank = true;
        }

        if (isBlank) {
          for (const key of AURAVEST_STORAGE_KEYS) {
            localStorage.setItem(key, defaults[key]);
          }
        }
      }

      sessionStorage.setItem('paynesuite_userId', id.toString());
      // Write unified session AFTER state is loaded so BroadcastChannel callbacks read correct data
      if (urlUserId && !unifiedSession?.userId) {
        writeUnifiedAuthSession({ userId: activeUserId, sourceApp: 'AuraVest' });
      }
      await persistStateToServer();
      setIsReady(true);
    };

    void bootstrap();

    const persistIntervalId = window.setInterval(() => {
      void persistStateToServer();
    }, 1200);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void persistStateToServer();
      }
    };

    const onBeforeUnload = () => {
      void persistStateToServer();
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(persistIntervalId);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  if (!isReady) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-[#0f172a] to-black flex flex-col items-center justify-center gap-8 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/3 w-72 h-72 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-red-900/10 blur-3xl pointer-events-none" />

        <div className="relative" style={{ width: 130, height: 130 }}>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-500/70 border-r-red-800/30 animate-spin" style={{ animationDuration: '3.5s' }} />
          <div className="absolute inset-[9px] rounded-full border-2 border-transparent border-t-red-800/60 border-r-red-500/25 animate-spin" style={{ animationDuration: '2.2s', animationDirection: 'reverse' }} />
          <div className="absolute inset-[18px] rounded-full border border-transparent border-t-white/20 animate-spin" style={{ animationDuration: '1.4s' }} />
          <div className="absolute inset-0 rounded-full bg-red-600/8 animate-ping" style={{ animationDuration: '2.4s' }} />
          <div className="absolute inset-[24px] rounded-full overflow-hidden bg-white shadow-2xl ring-2 ring-white/10">
            <img src="/images/vest.jpeg" alt="AuraVest" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-500 via-white to-red-800 bg-clip-text text-transparent">AuraVest</h1>
          <p className="text-xs text-white/35 tracking-wide">Loading your portfolio…</p>
        </div>

        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-red-800 animate-bounce" style={{ animationDelay: `${i * 160}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return <DashboardClient />;
}
