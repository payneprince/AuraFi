"use client";

import { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { walletData, users } from '@/lib/shared/mock-data';
import AuraChat from '@/components/AuraChat';
import Sidebar from '@/components/Sidebar';
import OverviewSection from '@/components/dashboard/OverviewSection';
import SendSection from '@/components/dashboard/SendSection';
import PortfolioSection from '@/components/dashboard/PortfolioSection';
import SettingsSection from '@/components/dashboard/SettingsSection';
import { WalletSection } from '@/components/dashboard/types';
import { walletSectionTitles } from '@/components/dashboard/navigation';
import { TransferToastContainer, TransferToastData } from './TransferToast';
import {
  readUnifiedAuthSession,
  writeUnifiedAuthSession,
  subscribeUnifiedAuthSession,
} from '../../../shared/unified-auth';
import { claimCrossAppTransfersForApp } from '../../../shared/cross-app-transfer-sync';
import { hydrateWalletRuntimeForUser, persistWalletStateForUser } from '@/lib/wallet-state';
import { getAuraWalletStorageKeys } from '@/lib/walletStateKeys';

export default function Dashboard() {
  const [userId, setUserId] = useState<number>(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSection, setCurrentSection] = useState<WalletSection>('overview');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [transferToasts, setTransferToasts] = useState<TransferToastData[]>([]);
  const dismissTransferToast = (id: string) => setTransferToasts((p) => p.filter((t) => t.id !== id));

  const buildAppUrl = useCallback((port: number, path = '') => {
    if (typeof window === 'undefined') return `http://localhost:${port}${path}`;
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:${port}${path}`;
  }, []);

  const captureWalletStateSnapshot = useCallback((activeUserId: string) => {
    const snapshot: Record<string, string | null> = {};
    const keys = getAuraWalletStorageKeys(activeUserId);
    for (const key of keys) {
      snapshot[key] = localStorage.getItem(key);
    }
    return snapshot;
  }, []);

  const persistWalletStateToServer = useCallback(async (activeUserId: string) => {
    const normalizedUserId = String(activeUserId || '').trim();
    if (!normalizedUserId) return;
    const state = captureWalletStateSnapshot(normalizedUserId);
    try {
      await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: normalizedUserId, state }),
        keepalive: true,
      });
    } catch {
      // Retry naturally on next sync tick.
    }
  }, [captureWalletStateSnapshot]);

  useEffect(() => {
    const bootstrap = async () => {
      const urlUserId = new URLSearchParams(window.location.search).get('userId');
      const unifiedSession = readUnifiedAuthSession();
      const sessionUserId = sessionStorage.getItem('aurasuite_userId');

      if (!urlUserId && !unifiedSession?.userId && !sessionUserId) {
        const host = window.location.hostname || 'localhost';
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        window.location.href = `${protocol}//${host}:3000/login`;
        return;
      }

      const id = parseInt(urlUserId || unifiedSession?.userId || sessionUserId || '1', 10);
      const normalizedUserId = String(id);

      // Pre-clear stale localStorage for non-demo users so a failed fetch yields $0, not stale data
      if (normalizedUserId !== '1') {
        for (const key of getAuraWalletStorageKeys(normalizedUserId)) {
          localStorage.removeItem(key);
        }
      }

      // Load server state into localStorage FIRST — before any BroadcastChannel can race
      try {
        const response = await fetch(`/api/state?userId=${encodeURIComponent(normalizedUserId)}`);
        if (response.ok) {
          const payload = await response.json() as { state?: Record<string, string | null> | null };
          if (payload?.state) {
            for (const key of getAuraWalletStorageKeys(normalizedUserId)) {
              const value = payload.state[key];
              if (value === null || value === undefined) {
                localStorage.removeItem(key);
              } else {
                localStorage.setItem(key, value);
              }
            }
          }
        }
      } catch {
        // Fall back to local snapshot/default runtime values.
      }

      // Hydrate from now-correct localStorage
      const hydratedState = hydrateWalletRuntimeForUser({
        userId: normalizedUserId,
        name: unifiedSession?.name || undefined,
        email: unifiedSession?.email || undefined,
      });
      setUserId(id);
      setWalletBalance(Number(hydratedState.balance || 0));
      sessionStorage.setItem('aurasuite_userId', id.toString());

      // Write the hydrated/seeded state into localStorage BEFORE syncing to the server —
      // otherwise a fresh demo session snapshots an empty localStorage and pushes a blank
      // record that permanently overwrites the $500 seed (the recurring "$0 balance" bug).
      persistWalletStateForUser(normalizedUserId);

      // Write unified session AFTER localStorage is correct so BroadcastChannel callbacks read good data
      if (urlUserId && !unifiedSession?.userId) {
        writeUnifiedAuthSession({ userId: normalizedUserId, sourceApp: 'AuraWallet' });
      }

      await persistWalletStateToServer(normalizedUserId);
      setIsReady(true);
    };

    void bootstrap();
  }, [persistWalletStateToServer]);

  useEffect(() => {
    return subscribeUnifiedAuthSession((session) => {
      if (!session?.userId) {
        sessionStorage.removeItem('aurasuite_userId');
        setUserId(1);
        window.location.href = buildAppUrl(3000, '/login');
        return;
      }

      // Only re-hydrate after bootstrap is complete — prevents race with initial load
      if (!isReady) return;

      const nextUserId = Number.parseInt(session.userId, 10);
      const normalizedUserId = Number.isNaN(nextUserId) ? 1 : nextUserId;
      const hydratedState = hydrateWalletRuntimeForUser({
        userId: String(normalizedUserId),
        name: session.name || undefined,
        email: session.email || undefined,
      });
      sessionStorage.setItem('aurasuite_userId', String(normalizedUserId));
      setUserId(normalizedUserId);
      setWalletBalance(Number(hydratedState.balance || 0));
    });
  }, [buildAppUrl, isReady]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('aura-ledger-sync');
    channel.onmessage = (event) => {
      if (event?.data?.type !== 'ledger.updated') return;

      const activeUserId = readUnifiedAuthSession()?.userId || sessionStorage.getItem('aurasuite_userId') || String(userId);
      const hydrated = hydrateWalletRuntimeForUser({
        userId: String(activeUserId),
      });
      setWalletBalance(Number(hydrated.balance || 0));
    };

    return () => {
      channel.close();
    };
  }, [userId]);

  useEffect(() => {
    if (!isReady) return;
    persistWalletStateForUser(String(userId));
    void persistWalletStateToServer(String(userId));
  }, [userId, walletBalance, isReady, persistWalletStateToServer]);

  const mockUser = users.find(u => u.id === userId);
  const authSession = readUnifiedAuthSession();
  const user = mockUser || {
    ...users[0],
    id: userId,
    name: authSession?.name || sessionStorage.getItem('aurasuite_userId') ? `User ${userId}` : users[0].name,
    email: authSession?.email || users[0].email,
  };

  const writeWalletSnapshotCookie = useCallback((balance: number) => {
    const snapshot = {
      userId: String(userId),
      balance: Number(balance || 0),
      updatedAt: new Date().toISOString(),
    };
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `aurawallet_balance_snapshot=${encodeURIComponent(JSON.stringify(snapshot))}; expires=${expires}; path=/; SameSite=Lax`;
  }, [userId]);

  useEffect(() => {
    writeWalletSnapshotCookie(walletBalance);
  }, [walletBalance, writeWalletSnapshotCookie]);

  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(() => {
      const nextBalance = Number(walletData.balance || 0);
      setWalletBalance(nextBalance);
    }, 1500);

    return () => clearInterval(interval);
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;

    const applyQueuedTransfers = () => {
      const activeUserId = String(readUnifiedAuthSession()?.userId || sessionStorage.getItem('aurasuite_userId') || userId);
      const transferEvents = claimCrossAppTransfersForApp('wallet', activeUserId);
      if (transferEvents.length === 0) return;

      const stateKey = `aurawallet_state_${activeUserId}`;
      const storedState = (() => {
        try {
          return JSON.parse(localStorage.getItem(stateKey) || '{}') as { balance?: number; transactions?: Array<Record<string, unknown>> };
        } catch {
          return { balance: Number(walletData.balance || 0), transactions: walletData.transactions as Array<Record<string, unknown>> };
        }
      })();

      const nextTransactions = Array.isArray(storedState.transactions) ? [...storedState.transactions] : [];
      let nextBalance = Number(storedState.balance || 0);

      for (const event of transferEvents) {
        const amount = Number(event.amount || 0);
        const delta = event.fromApp === 'wallet' ? -amount : amount;
        nextBalance = Number((nextBalance + delta).toFixed(2));
        nextTransactions.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000),
          amount: Number(delta.toFixed(2)),
          description: delta < 0 ? `Transfer to ${event.toApp}` : `Transfer from ${event.fromApp}`,
          date: new Date(event.timestamp).toISOString().split('T')[0],
          createdAt: event.timestamp,
          method: 'bank_transfer',
          status: 'completed',
        });
      }

      localStorage.setItem(stateKey, JSON.stringify({
        balance: nextBalance,
        transactions: nextTransactions.slice(0, 500),
      }));

      const hydrated = hydrateWalletRuntimeForUser({ userId: activeUserId });
      setWalletBalance(Number(hydrated.balance || 0));
      persistWalletStateForUser(activeUserId);
      void persistWalletStateToServer(activeUserId);

      // Show a toast for each claimed transfer
      for (const event of transferEvents) {
        setTransferToasts((prev) => [...prev.slice(-3), {
          id: event.id,
          amount: Number(event.amount || 0),
          fromApp: event.fromApp,
          toApp: event.toApp,
          direction: event.fromApp === 'wallet' ? 'outgoing' : 'incoming',
        }]);
      }
    };

    applyQueuedTransfers();
    const intervalId = window.setInterval(applyQueuedTransfers, 1200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReady, userId, persistWalletStateToServer]);

  useEffect(() => {
    if (!isReady) return;

    const pullServerState = async () => {
      const activeUserId = String(readUnifiedAuthSession()?.userId || sessionStorage.getItem('aurasuite_userId') || userId);
      try {
        const response = await fetch(`/api/state?userId=${encodeURIComponent(activeUserId)}`);
        if (!response.ok) return;

        const payload = await response.json() as { state?: Record<string, string | null> | null };
        if (!payload?.state) return;

        for (const key of getAuraWalletStorageKeys(activeUserId)) {
          const value = payload.state[key];
          if (value === null || value === undefined) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, value);
          }
        }

        const hydrated = hydrateWalletRuntimeForUser({ userId: activeUserId });
        setWalletBalance(Number(hydrated.balance || 0));
      } catch {
        // Ignore transient failures and retry on next poll.
      }
    };

    void pullServerState();
    const intervalId = window.setInterval(() => {
      void pullServerState();
    }, 1800);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReady, userId]);

  const handleTransferComplete = () => {
    const nextBalance = Number(walletData.balance || 0);
    setWalletBalance(nextBalance);
    persistWalletStateForUser(String(userId));
    void persistWalletStateToServer(String(userId));
    writeWalletSnapshotCookie(nextBalance);
  };

  if (!isReady) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-[#0B1E39] to-black flex flex-col items-center justify-center gap-8 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/3 w-72 h-72 rounded-full bg-green-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-emerald-900/10 blur-3xl pointer-events-none" />

        <div className="relative" style={{ width: 130, height: 130 }}>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-500/70 border-r-emerald-800/30 animate-spin" style={{ animationDuration: '3.5s' }} />
          <div className="absolute inset-[9px] rounded-full border-2 border-transparent border-t-emerald-800/60 border-r-green-500/25 animate-spin" style={{ animationDuration: '2.2s', animationDirection: 'reverse' }} />
          <div className="absolute inset-[18px] rounded-full border border-transparent border-t-white/20 animate-spin" style={{ animationDuration: '1.4s' }} />
          <div className="absolute inset-0 rounded-full bg-green-500/8 animate-ping" style={{ animationDuration: '2.4s' }} />
          <div className="absolute inset-[24px] rounded-full overflow-hidden bg-white shadow-2xl ring-2 ring-white/10">
            <img src="/images/wallet.jpg" alt="AuraWallet" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-green-400 via-white to-emerald-600 bg-clip-text text-transparent">AuraWallet</h1>
          <p className="text-xs text-white/35 tracking-wide">Loading your wallet…</p>
        </div>

        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 animate-bounce" style={{ animationDelay: `${i * 160}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'send':
        return <SendSection onTransferComplete={handleTransferComplete} />;
      case 'portfolio':
        return <PortfolioSection walletBalance={walletBalance} transactions={walletData.transactions} />;
      case 'settings':
        return <SettingsSection />;
      case 'overview':
      default:
        return (
          <OverviewSection
            walletBalance={walletBalance}
            insight="Chat with AuraAI below for personalized wallet insights."
            onTransferComplete={handleTransferComplete}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071029] dark:text-white">
      <div className="flex min-h-screen">
        <Sidebar
          current={currentSection}
          onNavigate={(id: WalletSection) => setCurrentSection(id)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        />

        <div className="flex-1 flex flex-col">
          <div className="px-8 py-5 bg-white/70 backdrop-blur-sm dark:bg-[#071126]/70 dark:backdrop-blur-sm">
            <div>
              <h1 className="text-slate-900 dark:text-white font-extrabold text-3xl">{walletSectionTitles[currentSection]}</h1>
              {currentSection === 'overview' && (
                <p className="text-slate-600 dark:text-white/75 text-base mt-1 font-medium">Welcome back, {user.name}</p>
              )}
            </div>
          </div>

          <main className="flex-1 overflow-y-auto p-8 space-y-6">
            {renderSection()}
          </main>
        </div>
      </div>
      <AuraChat userId={user.id} />
      <TransferToastContainer toasts={transferToasts} onDismiss={dismissTransferToast} />
    </div>
  );
}
