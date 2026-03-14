'use client';

import { useEffect, useMemo, useState } from 'react';
import TransferForm from '@/components/TransferForm';
import TransactionList from '@/components/TransactionList';
// @ts-ignore
import { walletData } from '@/lib/shared/mock-data';
import { getWalletScopedStorageKey } from '@/lib/wallet-state';

interface SendSectionProps {
  onTransferComplete: () => void;
}

interface ScheduledTransfer {
  id: string;
  amount: number;
  method: 'mobile' | 'card';
  recipient: string;
  fee: number;
  netAmount: number;
  status: 'queued' | 'completed';
  scheduledFor: string;
}

export default function SendSection({ onTransferComplete }: SendSectionProps) {
  const [queuedTransfers, setQueuedTransfers] = useState<ScheduledTransfer[]>([]);

  const loadQueuedTransfers = () => {
    try {
      const queued = JSON.parse(localStorage.getItem(getWalletScopedStorageKey('aurawallet_scheduled_transfers')) || '[]');
      if (Array.isArray(queued)) {
        setQueuedTransfers(queued.filter((item) => item?.status === 'queued'));
      } else {
        setQueuedTransfers([]);
      }
    } catch {
      setQueuedTransfers([]);
    }
  };

  useEffect(() => {
    loadQueuedTransfers();
  }, []);

  const queuedTotal = useMemo(
    () => queuedTransfers.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [queuedTransfers]
  );

  const availableBalance = Number(walletData.balance || 0);

  const handleTransferComplete = () => {
    onTransferComplete();
    loadQueuedTransfers();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
          <h3 className="text-white font-bold text-xl mb-1">Send Money</h3>
          <p className="text-white/75 text-sm mb-4">Transfer funds instantly or schedule secure payouts.</p>
          <TransferForm onComplete={handleTransferComplete} />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
            <h3 className="text-white font-bold text-lg mb-3">Queued Transfers</h3>

            {queuedTransfers.length === 0 ? (
              <p className="text-white/70 text-sm">No queued transfers yet.</p>
            ) : (
              <div className="space-y-2">
                {queuedTransfers.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-semibold text-sm">${Number(item.amount || 0).toFixed(2)}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300">
                        QUEUED
                      </span>
                    </div>
                    <p className="text-white/75 text-xs mt-1">{item.method === 'mobile' ? 'Mobile' : 'Card'}: {item.recipient}</p>
                    <p className="text-white/65 text-xs">{new Date(item.scheduledFor).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
            <h3 className="text-white font-bold text-lg mb-3">Send Insights</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-white/80">
                <span>Available Balance</span>
                <span className="text-white font-semibold">${availableBalance.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Queued Count</span>
                <span className="text-white font-semibold">{queuedTransfers.length}</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Queued Total</span>
                <span className="text-white font-semibold">${queuedTotal.toFixed(2)}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-white/10 text-white/70 text-xs">
                Daily transfer safety checks are active for high-value and scheduled payouts.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
        <h3 className="text-white font-bold text-xl mb-4">Recent Transactions</h3>
        <TransactionList />
      </div>
    </div>
  );
}
