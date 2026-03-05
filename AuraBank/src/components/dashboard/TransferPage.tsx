'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TransferForm from './TransferForm';
import { formatCurrency as formatMoney } from '@/lib/currency';

export default function TransferPage() {
  const { accounts } = useAuth();
  const [selectedFromAccount, setSelectedFromAccount] = useState<string>('');

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return '💳';
      case 'savings': return '💰';
      case 'credit': return '💳';
      default: return '🏦';
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'checking': return 'from-emerald-500 to-teal-600';
      case 'savings': return 'from-blue-500 to-cyan-600';
      case 'credit': return 'from-purple-500 to-pink-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Transfer Money</h2>
        <p className="text-slate-600 mt-1">Transfer funds between your accounts</p>
      </div>

      {!selectedFromAccount ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Account to Transfer From</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedFromAccount(account.id)}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition p-6 text-left"
                >
                  <div className={`bg-gradient-to-br ${getAccountColor(account.type)} p-4 text-white rounded-lg mb-4`}>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{getAccountIcon(account.type)}</span>
                      <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
                        {account.currency}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm opacity-90">{account.name}</p>
                      <p className="text-xl font-bold">
                        {formatMoney(account.balance, account.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Account: {account.accountNumber}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Transfer Details</h3>
            <button
              onClick={() => setSelectedFromAccount('')}
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              Change Account
            </button>
          </div>
          <TransferForm
            defaultFromAccountId={selectedFromAccount}
            onTransferComplete={() => setSelectedFromAccount('')}
          />
        </div>
      )}
    </div>
  );
}
