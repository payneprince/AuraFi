"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
// @ts-ignore
import { walletData, users } from '@/lib/shared/mock-data';
// @ts-ignore
import { getWalletInsights } from '@/lib/shared/auraai-core';
import AuraChat from '@/components/AuraChat';
import TransactionList from '@/components/TransactionList';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import TransferForm from '@/components/TransferForm';
import MobileAppShowcase from '@/components/MobileAppShowcase';
import CardManager from '@/components/CardManager';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<number>(1);

  useEffect(() => {
    const urlUserId = searchParams.get('userId');
    const sessionUserId = sessionStorage.getItem('aurasuite_userId');
    const id = parseInt(urlUserId || sessionUserId || '1');
    setUserId(id);
    sessionStorage.setItem('aurasuite_userId', id.toString());
  }, [searchParams]);

  const user = users.find(u => u.id === userId) || users[0];
  const insights = getWalletInsights(userId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071029] via-[#0B1E39] to-[#0d2545]">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          {/* Top header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 bg-[#071029]/40">
            <div>
              <h2 className="text-white font-bold text-2xl">Overview</h2>
              <p className="text-white/60 text-sm">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>

          <main className="p-6">
            {/* Metrics + Transfer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-[#0f2945] to-[#0B1E39] rounded-2xl p-6 border border-white/6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/60 text-sm">Total Balance</p>
                    <p className="text-white font-bold text-3xl mt-1">${walletData.balance.toFixed(2)}</p>
                    <p className="text-white/60 text-sm mt-1">Available to send</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-sm">AuraAI</p>
                    <p className="text-[#29C7D9] text-sm">{insights.insights[0]}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <TransactionList />
                  </div>
                  <div>
                    <TransferForm onComplete={() => {}} />
                  </div>
                </div>
              </div>

              <aside>
                <CardManager />
              </aside>
            </div>

            {/* Right column: mobile showcase + other tools */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-[#071229] to-[#071029] rounded-2xl p-6 border border-white/6">
                  <h4 className="text-white font-semibold mb-3">Activity</h4>
                  <TransactionList />
                </div>
              </div>
              <aside>
                <MobileAppShowcase />
              </aside>
            </div>
          </main>
        </div>
      </div>
      <AuraChat userId={user.id} />
    </div>
  );
}
