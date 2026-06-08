'use client';

import { useEffect, useMemo, useState } from 'react';
import { Send, Clock, Gauge, Wallet2, ShieldCheck } from 'lucide-react';
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

  const insights = [
    { icon: Wallet2, label: 'Available Balance', value: `$${availableBalance.toFixed(2)}`, bg: 'bg-green-500/15', text: 'text-green-300', spin: 'border-t-green-400/80 border-r-green-400/30' },
    { icon: Clock, label: 'Queued Count', value: String(queuedTransfers.length), bg: 'bg-amber-500/15', text: 'text-amber-300', spin: 'border-t-amber-400/80 border-r-amber-400/30' },
    { icon: Gauge, label: 'Queued Total', value: `$${queuedTotal.toFixed(2)}`, bg: 'bg-sky-500/15', text: 'text-sky-300', spin: 'border-t-sky-400/80 border-r-sky-400/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="group lg:col-span-2 rounded-2xl p-5 bg-[#0B1E39] border border-white/10 hover:border-green-400/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-400/80 border-r-green-400/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
              <div className="absolute inset-[3px] rounded-full bg-green-500/15 text-green-300 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-white font-bold text-xl">Send Money</h3>
          </div>
          <p className="text-white/75 text-sm mb-4">Transfer funds instantly or schedule secure payouts.</p>
          <TransferForm onComplete={handleTransferComplete} />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10 hover:border-amber-400/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '80ms' }}>
            <h3 className="text-white font-bold text-lg mb-3">Queued Transfers</h3>

            {queuedTransfers.length === 0 ? (
              <p className="text-white/70 text-sm">No queued transfers yet.</p>
            ) : (
              <div className="space-y-2">
                {queuedTransfers.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.id}
                    className="group/item rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-white font-semibold text-sm">${Number(item.amount || 0).toFixed(2)}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 group-hover/item:bg-amber-500/30 transition-colors duration-200">
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

          <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10 hover:border-sky-400/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '140ms' }}>
            <h3 className="text-white font-bold text-lg mb-3">Send Insights</h3>
            <div className="space-y-2">
              {insights.map((insight, idx) => {
                const Icon = insight.icon;
                return (
                  <div key={insight.label} className="group/row flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex-shrink-0" style={{ width: 30, height: 30 }}>
                        <div className={`absolute inset-0 rounded-full border-2 border-transparent ${insight.spin} group-hover/row:animate-spin`} style={{ animationDuration: '2.5s' }} />
                        <div className={`absolute inset-[2.5px] rounded-full ${insight.bg} ${insight.text} flex items-center justify-center`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-white/80 text-sm">{insight.label}</span>
                    </div>
                    <span className="text-white font-semibold text-sm tabular-nums">{insight.value}</span>
                  </div>
                );
              })}
              <div className="flex items-start gap-2 pt-2 mt-2 border-t border-white/10 text-white/70 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                Daily transfer safety checks are active for high-value and scheduled payouts.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '200ms' }}>
        <h3 className="text-white font-bold text-xl mb-4">Recent Transactions</h3>
        <TransactionList />
      </div>
    </div>
  );
}
