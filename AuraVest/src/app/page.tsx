'use client';

import { useEffect, useState } from 'react';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { switchScopedAppStorage } from '../../../shared/browser-app-state';
import { readUnifiedAuthSession } from '../../../shared/unified-auth';
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

      switchScopedAppStorage({
        appName: 'auravest',
        userId: activeUserId,
        genericKeys: [...AURAVEST_STORAGE_KEYS],
        defaults: buildDefaults(id, isDemoUser, unifiedSession),
      });

      sessionStorage.setItem('paynesuite_userId', id.toString());
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
    return null;
  }

  return <DashboardClient />;
}
