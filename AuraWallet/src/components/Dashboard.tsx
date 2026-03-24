"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutGrid } from 'lucide-react';
// @ts-ignore
import { walletData, users } from '@/lib/shared/mock-data';
// @ts-ignore
import { getWalletInsights } from '@/lib/shared/auraai-core';
import AuraChat from '@/components/AuraChat';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import OverviewSection from '@/components/dashboard/OverviewSection';
import SendSection from '@/components/dashboard/SendSection';
import PortfolioSection from '@/components/dashboard/PortfolioSection';
import SettingsSection from '@/components/dashboard/SettingsSection';
import { WalletSection } from '@/components/dashboard/types';
import { walletSectionTitles } from '@/components/dashboard/navigation';
import {
  readUnifiedAuthSession,
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
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);
  const appSwitcherRef = useRef<HTMLDivElement | null>(null);

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
      const id = parseInt(urlUserId || unifiedSession?.userId || sessionUserId || '1', 10);
      const normalizedUserId = String(id);

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

      const hydratedState = hydrateWalletRuntimeForUser({
        userId: normalizedUserId,
        name: unifiedSession?.name || undefined,
        email: unifiedSession?.email || undefined,
      });
      setUserId(id);
      setWalletBalance(Number(hydratedState.balance || 0));
      sessionStorage.setItem('aurasuite_userId', id.toString());
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
  }, [buildAppUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!appSwitcherRef.current) return;
      if (appSwitcherRef.current.contains(event.target as Node)) return;
      setAppSwitcherOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const user = users.find(u => u.id === userId) || users[0];
  const insights = getWalletInsights(userId);

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
    return null;
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
            insight={insights.insights[0]}
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
            <div className="flex items-center justify-end gap-2 mb-4">
              <div ref={appSwitcherRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAppSwitcherOpen((prev) => !prev)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors dark:border-white/20 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                  aria-label="Open app switcher"
                  aria-expanded={appSwitcherOpen}
                  title="App switcher"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>

                {appSwitcherOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden z-20 dark:border-white/20 dark:bg-[#0b1533]">
                    <button
                      type="button"
                      onClick={() => {
                        setAppSwitcherOpen(false);
                        window.open(buildAppUrl(3000, '/dashboard'), '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      AuraFinance
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAppSwitcherOpen(false);
                        window.open(buildAppUrl(3001), '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      AuraBank
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAppSwitcherOpen(false);
                        window.open(buildAppUrl(3002), '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      AuraVest
                    </button>
                  </div>
                )}
              </div>

              <ThemeToggle />
            </div>

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
    </div>
  );
}
