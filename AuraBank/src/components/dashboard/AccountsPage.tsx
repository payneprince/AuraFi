'use client';

import { useState } from 'react';
import TransferForm from './TransferForm';
import { formatCurrency as formatMoney } from '@/lib/currency';
import type { Currency } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

type AccountType = 'checking' | 'savings' | 'credit';

export default function AccountsPage({ userId }: { userId: number }) {
  const { accounts, transactions } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewDetailsAccountId, setViewDetailsAccountId] = useState<string | null>(null);
  const [transferFromAccountId, setTransferFromAccountId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'checking' | 'savings' | 'credit'>('checking');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getAccountIcon = (type: string, currencyCode?: string) => {
    if (currencyCode === 'GHS') return '₵';
    if (currencyCode === 'USD') return '$';
    if (currencyCode === 'EUR') return '€';
    switch (type) {
      case 'checking': return '💳';
      case 'savings': return '💰';
      case 'credit': return '💳';
      default: return '🏦';
    }
  };

  const getAccountColor = (type: string) => {
      switch (type) {
        case 'checking': return 'from-magenta-500 to-teal-500';
        case 'savings': return 'from-magenta-600 to-teal-600';
        case 'credit': return 'from-magenta-400 to-teal-400';
        default: return 'from-magenta-500 to-teal-500';
      }
  };

  const generateAccountNumber = () => {
    const prefix = Math.floor(100000 + Math.random() * 900000).toString();
    const suffix = Math.floor(100000 + Math.random() * 900000).toString();
    return `${prefix}${suffix}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      setError('Please enter a valid balance.');
      return;
    }

    let newCreditLimit: number | undefined;
    if (type === 'credit') {
      const limitNum = parseFloat(creditLimit);
      if (isNaN(limitNum) || limitNum <= 0) {
        setError('Please enter a valid credit limit.');
        return;
      }
      newCreditLimit = limitNum;
    }

    const newAccount = {
      id: `acc-${Date.now()}`,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Account`,
      type,
      balance: type === 'credit' ? -balanceNum : balanceNum,
      accountNumber: generateAccountNumber(),
      currency,
      availableBalance: type === 'credit' ? (newCreditLimit! - balanceNum) : balanceNum,
      ...(type === 'credit' && { creditLimit: newCreditLimit }),
    };

    const updatedAccounts = [...accounts, newAccount];
    // updateAccounts(updatedAccounts); // Removed - not needed
    setSuccess(true);

    setName('');
    setType('checking');
    setBalance('');
    setCreditLimit('');
    setCurrency('USD');
    setTimeout(() => {
      setIsModalOpen(false);
      setSuccess(false);
    }, 1500);
  };

  const displayAccounts = accounts
    .filter((account: any) => account.type !== 'credit')
    .map((account: any) => {
      if (typeof account.accountNumber === 'string' && account.accountNumber.startsWith('****')) {
        return {
          ...account,
          accountNumber: account.accountNumber.replace(/^\*{4}/, '10') + Math.floor(100000 + Math.random() * 900000).toString(),
        };
      }
      return account;
    })
    .sort((a: any, b: any) => {
      const order = ['acc-1', 'acc-4', 'acc-2', 'acc-3'];
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-semibold rounded-lg hover:from-magenta-600 hover:to-teal-600 transition shadow-lg"
        >
          + Add Account
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Add New Account</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                Account created successfully!
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-magenta-500 focus:border-transparent text-slate-900"
                  placeholder="e.g., Vacation Fund"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-magenta-500 focus:border-transparent text-slate-900"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Initial Balance
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-magenta-500 focus:border-transparent text-slate-900"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-magenta-500 focus:border-transparent text-slate-900"
                >
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GHS">Ghana Cedi (GHS)</option>
                </select>
              </div>



              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium rounded-lg"
                  disabled={success}
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewDetailsAccountId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Account Details</h3>
                <p className="text-xs text-slate-500 mt-1">Overview and recent activity</p>
              </div>
              <button
                onClick={() => setViewDetailsAccountId(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {(() => {
              const acc = accounts.find((a: any) => a.id === viewDetailsAccountId);
              if (!acc) return <p className="text-slate-900">Account not found.</p>;

              return (
                <div className="space-y-5">
                  <div className={`rounded-xl p-4 text-white bg-gradient-to-br ${getAccountColor(acc.type)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">{acc.name}</p>
                        <p className="text-xs opacity-80 font-mono mt-1">{acc.accountNumber}</p>
                      </div>
                      <span className="text-sm font-semibold bg-white/20 px-2 py-1 rounded-full">
                        {acc.currency}
                      </span>
                    </div>
                    <p className="text-2xl font-bold mt-3">
                      {formatMoney(acc.balance, acc.currency)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-500">Account Type</p>
                      <p className="text-sm font-semibold text-slate-900 capitalize mt-1">{acc.type}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-500">Available</p>
                      <p className="text-sm font-semibold text-emerald-600 mt-1">
                        {formatMoney(acc.availableBalance || acc.balance, acc.currency)}
                      </p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-slate-900">Recent Transactions</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto hide-scrollbar">
                    {transactions
                      .filter((tx: any) => tx.accountId === acc.id)
                      .slice(0, 5)
                      .map((tx: any) => (
                        <div key={tx.id} className="flex justify-between items-center text-sm bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-slate-900 truncate">{tx.description}</span>
                          <span className={tx.type === 'credit' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {tx.type === 'credit' ? '+' : '-'}{formatMoney(Math.abs(tx.amount), acc.currency)}
                          </span>
                        </div>
                      ))}
                    {transactions.filter((tx: any) => tx.accountId === acc.id).length === 0 && (
                      <p className="text-slate-500 text-sm">No transactions</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {transferFromAccountId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Transfer Money</h3>
              <button
                onClick={() => setTransferFromAccountId(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <TransferForm
              defaultFromAccountId={transferFromAccountId}
              onTransferComplete={() => setTransferFromAccountId(null)}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayAccounts.map((account: any) => (
          <div
            key={account.id}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition"
          >
            <div className={`bg-gradient-to-br ${getAccountColor(account.type)} p-6 text-white`}>
              <div className="flex items-center justify-between mb-8">
                <span className="text-3xl">{getAccountIcon(account.type, account.currency)}</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
                  {account.currency}
                </span>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-2">{account.name}</p>
                <p className="text-3xl font-bold">
                  {formatMoney(account.balance, account.currency)}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Account Type</p>
                  <p className="text-sm font-semibold text-slate-900 capitalize mt-1">{account.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Account Number</p>
                  <p className="text-sm font-mono font-semibold text-slate-900 mt-1">{account.accountNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gradient-to-br from-magenta-50 to-teal-50 rounded-xl">
                  <p className="text-xs text-slate-600 mb-1">Current Balance</p>
                  <p className="text-lg font-bold text-slate-900">{formatMoney(account.balance, account.currency)}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                  <p className="text-xs text-slate-600 mb-1">Available</p>
                  <p className="text-lg font-bold text-emerald-600">{formatMoney(account.availableBalance || account.balance, account.currency)}</p>
                </div>
              </div>

              {account.type === 'credit' && (
                <>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-600 mb-2">Credit Limit</p>
                    <p className="text-lg font-bold text-slate-900">{formatMoney(account.creditLimit || 0, account.currency)}</p>
                  </div>
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                      <span>Credit Used</span>
                      <span>
                        {((Math.abs(account.balance) / (account.creditLimit || 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-magenta-500 to-teal-500 h-2.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            (Math.abs(account.balance) / (account.creditLimit || 1)) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setViewDetailsAccountId(account.id)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => setTransferFromAccountId(account.id)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-magenta-500 to-teal-500 hover:from-magenta-600 hover:to-teal-600 text-white font-medium rounded-lg transition-all hover:shadow-lg"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}