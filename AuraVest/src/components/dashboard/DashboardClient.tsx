'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Home,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  Menu,
  BookOpen,
} from 'lucide-react';
import DashboardHome from './DashboardHome';
import MarketsPage from './MarketsPage';
import PortfolioPage from './PortfolioPage';
import TradePage from './TradePage';
import MorePage from './MorePage';
import LearnPage from './LearnPage';
import AuraAIChat from '@/components/AuraAIChat';
import { getPortfolio } from '@/lib/mockAPI';
import { AURAVEST_STORAGE_KEYS } from '@/lib/vestStateKeys';
import { claimCrossAppTransfersForApp } from '../../../../shared/cross-app-transfer-sync';
import { readUnifiedAuthSession, subscribeUnifiedAuthSession } from '../../../../shared/unified-auth';
import { TransferToastContainer, TransferToastData } from '@/components/TransferToast';

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<'home' | 'markets' | 'portfolio' | 'trade' | 'more' | 'learn'>('home');
  const [syncVersion, setSyncVersion] = useState(0);
  const [transferToasts, setTransferToasts] = useState<TransferToastData[]>([]);
  const dismissTransferToast = (id: string) => setTransferToasts((p) => p.filter((t) => t.id !== id));

  // Redirect to login if no session exists on first load
  useEffect(() => {
    const unifiedSession = readUnifiedAuthSession();
    const sessionStorageId = sessionStorage.getItem('paynesuite_userId');
    const vestUser = (() => { try { return JSON.parse(localStorage.getItem('auravest_user') || '{}') as { id?: string }; } catch { return {}; } })();

    if (!unifiedSession?.userId && !sessionStorageId && !vestUser?.id) {
      const host = window.location.hostname || 'localhost';
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      window.location.href = `${protocol}//${host}:3000/login`;
    }
  }, []);

  // Allow nested components (e.g. trade analytics recommendations) to request a tab switch
  // without prop-drilling through every intermediate page component.
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: string }>).detail?.tab;
      if (tab && ['home', 'markets', 'portfolio', 'trade', 'more', 'learn'].includes(tab)) {
        setActiveTab(tab as typeof activeTab);
      }
    };
    window.addEventListener('auravest:navigate', handleNavigate);
    return () => window.removeEventListener('auravest:navigate', handleNavigate);
  }, []);

  useEffect(() => {
    const resolveActiveUserId = () => {
      try {
        const user = JSON.parse(localStorage.getItem('auravest_user') || '{}') as { id?: string };
        const scopedSessionUserId = sessionStorage.getItem('paynesuite_userId');
        const unifiedUserId = readUnifiedAuthSession()?.userId;
        return String(user?.id || scopedSessionUserId || unifiedUserId || '1');
      } catch {
        return String(sessionStorage.getItem('paynesuite_userId') || readUnifiedAuthSession()?.userId || '1');
      }
    };

    const applyQueuedTransfers = async () => {
      const activeUserId = resolveActiveUserId();
      const transferEvents = claimCrossAppTransfersForApp('vest', activeUserId);
      if (transferEvents.length === 0) return;

      const transactions = (() => {
        try {
          return JSON.parse(localStorage.getItem('auravest_transactions') || '[]') as Array<Record<string, unknown>>;
        } catch {
          return [];
        }
      })();

      for (const event of transferEvents) {
        const amount = Number(event.amount || 0);
        const delta = event.fromApp === 'vest' ? -amount : amount;
        const absAmount = Math.abs(Number(delta.toFixed(2)));

        transactions.unshift({
          id: `vest-transfer-${event.id}`,
          type: delta < 0 ? 'withdrawal' : 'deposit',
          asset: 'USD',
          assetName: delta < 0 ? `Transfer to ${event.toApp}` : `Transfer from ${event.fromApp}`,
          amount: absAmount,
          price: 1,
          gross: absAmount,
          fee: 0,
          total: absAmount,
          currency: 'USD',
          quantityType: 'units',
          orderType: 'market',
          sourceActionId: event.id,
          status: 'completed',
          timestamp: event.timestamp,
          note: event.description || '',
        });
      }

      localStorage.setItem('auravest_transactions', JSON.stringify(transactions.slice(0, 500)));

      // Rebuild portfolio/cash snapshots from the updated transaction ledger.
      await getPortfolio();

      // Show a toast for each claimed transfer
      for (const event of transferEvents) {
        setTransferToasts((prev) => [...prev.slice(-3), {
          id: event.id,
          amount: Number(event.amount || 0),
          fromApp: event.fromApp,
          toApp: event.toApp,
          direction: event.fromApp === 'vest' ? 'outgoing' : 'incoming',
        }]);
      }
      setSyncVersion((v) => v + 1);
    };

    void applyQueuedTransfers();
    const intervalId = window.setInterval(() => {
      void applyQueuedTransfers();
    }, 1200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const resolveActiveUserId = () => {
      try {
        const user = JSON.parse(localStorage.getItem('auravest_user') || '{}') as { id?: string };
        const scopedSessionUserId = sessionStorage.getItem('paynesuite_userId');
        const unifiedUserId = readUnifiedAuthSession()?.userId;
        return String(user?.id || scopedSessionUserId || unifiedUserId || '1');
      } catch {
        return String(sessionStorage.getItem('paynesuite_userId') || readUnifiedAuthSession()?.userId || '1');
      }
    };

    const applyServerState = async () => {
      const activeUserId = resolveActiveUserId();
      try {
        const response = await fetch(`/api/state?userId=${encodeURIComponent(activeUserId)}`);
        if (!response.ok) return;

        const payload = await response.json() as { state?: Record<string, string | null> | null };
        if (!payload?.state) return;

        let didChange = false;
        for (const key of AURAVEST_STORAGE_KEYS) {
          const nextValue = payload.state[key];
          const currentValue = localStorage.getItem(key);

          if (nextValue === null || nextValue === undefined) {
            if (currentValue !== null) {
              localStorage.removeItem(key);
              didChange = true;
            }
          } else if (currentValue !== nextValue) {
            localStorage.setItem(key, nextValue);
            didChange = true;
          }
        }

        if (didChange) {
          await getPortfolio();
          setSyncVersion((value) => value + 1);
        }
      } catch {
        // Ignore transient failures and retry on next poll.
      }
    };

    void applyServerState();
    const intervalId = window.setInterval(() => {
      void applyServerState();
    }, 1800);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const buildAppUrl = (port: number, path = '') => {
    if (typeof window === 'undefined') return `http://localhost:${port}${path}`;
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:${port}${path}`;
  };

  useEffect(() => {
    return subscribeUnifiedAuthSession((session) => {
      if (session) return;
      localStorage.removeItem('auravest_user');
      sessionStorage.removeItem('paynesuite_userId');
      window.location.href = buildAppUrl(3000, '/login');
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="grid grid-cols-5 gap-1 p-2">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'markets', label: 'Markets', icon: TrendingUp },
            { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
            { id: 'portfolio', label: 'Portfolio', icon: Wallet },
            { id: 'more', label: 'Settings', icon: Menu },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-black to-crimson-600 text-white'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Navigation Bar - Hidden on mobile */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-black border-b border-slate-800/40 sticky top-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
            <Image src="/logo.jpeg" alt="AuraVest" width={36} height={36} className="object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">AuraVest</h1>
            <p className="text-[10px] text-slate-400 leading-tight">Invest Smarter</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1.5">
          {[
            { id: 'home',      label: 'Home',      icon: Home },
            { id: 'markets',   label: 'Markets',   icon: TrendingUp },
            { id: 'portfolio', label: 'Portfolio', icon: Wallet },
            { id: 'trade',     label: 'Trade',     icon: ArrowLeftRight },
            { id: 'learn',     label: 'Learn',     icon: BookOpen },
            { id: 'more',      label: 'Settings',  icon: Menu },
          ].map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-left transition-all ${
                  active
                    ? 'bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg shadow-red-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {active && <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1.5 h-1.5 rounded-full bg-white/70" />}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">

        {activeTab === 'home' && <DashboardHome key={`home-${syncVersion}`} />}
        {activeTab === 'markets' && <MarketsPage key={`markets-${syncVersion}`} />}
        {activeTab === 'portfolio' && <PortfolioPage key={`portfolio-${syncVersion}`} />}
        {activeTab === 'trade' && <TradePage key={`trade-${syncVersion}`} />}

        {activeTab === 'more' && <MorePage key={`more-${syncVersion}`} />}
        {activeTab === 'learn' && <LearnPage key={`learn-${syncVersion}`} />}
      </main>

      <AuraAIChat />
      <TransferToastContainer toasts={transferToasts} onDismiss={dismissTransferToast} />
    </div>
  );
}
