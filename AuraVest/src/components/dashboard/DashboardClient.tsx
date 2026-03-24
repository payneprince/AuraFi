'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Home,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  Menu,
  Sun,
  Moon,
  BookOpen,
  LayoutGrid,
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

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<'home' | 'markets' | 'portfolio' | 'trade' | 'more' | 'learn'>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);
  const appSwitcherRef = useRef<HTMLDivElement | null>(null);

  // Dark mode setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('auravest_dark_mode') === 'true';
      setDarkMode(savedDarkMode);
      if (savedDarkMode) document.documentElement.classList.add('dark');
    }
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

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('auravest_dark_mode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!appSwitcherRef.current) return;
      if (appSwitcherRef.current.contains(event.target as Node)) return;
      setAppSwitcherOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex">
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

      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10">
              <Image
                src="/logo.jpeg"
                alt="AuraVest Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AuraVest</h1>
              <p className="text-xs text-muted-foreground">Invest Smarter, Grow Stronger</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'markets', label: 'Markets', icon: TrendingUp },
            { id: 'portfolio', label: 'Portfolio', icon: Wallet },
            { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
            
            { id: 'more', label: 'Settings', icon: Menu },
            { id: 'learn', label: 'Learn', icon: BookOpen },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-black to-crimson-600 text-white'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
        <div className="hidden md:flex items-center justify-end gap-2 mb-4">
          <div ref={appSwitcherRef} className="relative">
            <button
              type="button"
              onClick={() => setAppSwitcherOpen((prev) => !prev)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors"
              aria-label="Open app switcher"
              aria-expanded={appSwitcherOpen}
              title="App switcher"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            {appSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-card shadow-xl overflow-hidden z-20">
                <button
                  type="button"
                  onClick={() => {
                    setAppSwitcherOpen(false);
                    window.open(buildAppUrl(3000, '/dashboard'), '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                >
                  AuraFinance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppSwitcherOpen(false);
                    window.open(buildAppUrl(3001), '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                >
                  AuraBank
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppSwitcherOpen(false);
                    window.open(buildAppUrl(3003), '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                >
                  AuraWallet
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {activeTab === 'home' && <DashboardHome key={`home-${syncVersion}`} />}
        {activeTab === 'markets' && <MarketsPage key={`markets-${syncVersion}`} />}
        {activeTab === 'portfolio' && <PortfolioPage key={`portfolio-${syncVersion}`} />}
        {activeTab === 'trade' && <TradePage key={`trade-${syncVersion}`} />}
        
        {activeTab === 'more' && <MorePage key={`more-${syncVersion}`} />}
        {activeTab === 'learn' && <LearnPage key={`learn-${syncVersion}`} />}
      </main>

      <AuraAIChat />
    </div>
  );
}
