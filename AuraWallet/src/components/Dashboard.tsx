"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
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

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<number>(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSection, setCurrentSection] = useState<WalletSection>('overview');
  const [walletBalance, setWalletBalance] = useState<number>(Number(walletData.balance || 0));

  useEffect(() => {
    const urlUserId = searchParams.get('userId');
    const sessionUserId = sessionStorage.getItem('aurasuite_userId');
    const id = parseInt(urlUserId || sessionUserId || '1');
    setUserId(id);
    sessionStorage.setItem('aurasuite_userId', id.toString());
  }, [searchParams]);

  const user = users.find(u => u.id === userId) || users[0];
  const insights = getWalletInsights(userId);

  const writeWalletSnapshotCookie = (balance: number) => {
    const snapshot = {
      balance: Number(balance || 0),
      updatedAt: new Date().toISOString(),
    };
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `aurawallet_balance_snapshot=${encodeURIComponent(JSON.stringify(snapshot))}; expires=${expires}; path=/; SameSite=Lax`;
  };

  useEffect(() => {
    writeWalletSnapshotCookie(walletBalance);
  }, [walletBalance]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextBalance = Number(walletData.balance || 0);
      setWalletBalance(nextBalance);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleTransferComplete = () => {
    const nextBalance = Number(walletData.balance || 0);
    setWalletBalance(nextBalance);
    writeWalletSnapshotCookie(nextBalance);
  };

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
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#071126]">
            <div>
              <h1 className="text-slate-900 dark:text-white font-extrabold text-3xl">{walletSectionTitles[currentSection]}</h1>
              {currentSection === 'overview' && (
                <p className="text-slate-600 dark:text-white/75 text-base mt-1 font-medium">Welcome back, {user.name}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-slate-600 dark:text-white/80 text-base font-medium">
                <CalendarDays className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <ThemeToggle />
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
