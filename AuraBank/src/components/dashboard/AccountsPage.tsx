'use client';

import { useState } from 'react';
import { AlertCircle, Landmark, PiggyBank, Vault, CreditCard, X } from 'lucide-react';
import TransferForm from './TransferForm';
import { formatCurrency as formatMoney } from '@/lib/currency';
import type { Currency } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

type AccountType = 'checking' | 'savings' | 'credit';

export default function AccountsPage({ userId }: { userId: number }) {
  const { accounts, transactions, updateAccounts } = useAuth();
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

  const getCurrencyCoin = (currencyCode?: string) => {
    switch (currencyCode) {
      case 'GHS': return '/cedi-coin.svg';
      case 'EUR': return '/euro-coin.svg';
      default: return '/usd-coin.svg';
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'checking': return Landmark;
      case 'savings': return PiggyBank;
      case 'credit': return CreditCard;
      default: return Vault;
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

  // Deterministic 6-digit suffix derived from a stable seed (e.g. account id),
  // so unmasked account numbers stay constant across renders/reloads.
  const stableDigits = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return (100000 + (hash % 900000)).toString();
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
    updateAccounts(updatedAccounts);
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
          accountNumber: account.accountNumber.replace(/^\*{4}/, '10') + stableDigits(String(account.id || account.accountNumber)),
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
          className="px-6 py-3 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-semibold rounded-lg hover:from-magenta-600 hover:to-teal-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 shadow-lg"
        >
          + Add Account
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Add New Account</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                Account created successfully!
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto hide-scrollbar animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Account Details</h3>
                <p className="text-xs text-slate-500 mt-1">Overview and recent activity</p>
              </div>
              <button
                onClick={() => setViewDetailsAccountId(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const acc = accounts.find((a: any) => a.id === viewDetailsAccountId);
              if (!acc) return <p className="text-slate-900">Account not found.</p>;

              return (
                <div className="space-y-5">
                  <div className={`relative overflow-hidden rounded-xl p-4 text-white bg-gradient-to-br ${getAccountColor(acc.type)}`}>
                    {/* Watermark illustration — currency-matched coin */}
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 opacity-15 pointer-events-none">
                      <img
                        src={getCurrencyCoin(acc.currency)}
                        alt=""
                        className="w-full h-full object-contain drop-shadow-lg"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">{acc.name}</p>
                        <p className="text-xs opacity-80 font-mono mt-1">{acc.accountNumber}</p>
                      </div>
                      <span className="text-sm font-semibold bg-white/20 px-2 py-1 rounded-full">
                        {acc.currency}
                      </span>
                    </div>
                    <p className="relative text-2xl font-bold mt-3 tabular-nums">
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Transfer Money</h3>
              <button
                onClick={() => setTransferFromAccountId(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
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
        {displayAccounts.map((account: any, idx: number) => {
          const TypeIcon = getAccountTypeIcon(account.type);
          return (
          <div
            key={account.id}
            className="group bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
            style={{ animationDelay: `${idx * 70}ms` }}
          >
            <div className={`relative overflow-hidden bg-gradient-to-br ${getAccountColor(account.type)} p-6 text-white`}>
              {/* Watermark illustration — fades up, brightens and drifts on hover */}
              <div className="absolute -bottom-8 -right-8 w-36 h-36 opacity-10 group-hover:opacity-20 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500 pointer-events-none">
                <img
                  src={getCurrencyCoin(account.currency)}
                  alt=""
                  className="w-full h-full object-contain drop-shadow-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>

              <div className="relative flex items-center justify-between mb-8">
                <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ width: 48, height: 48 }}>
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/70 border-r-white/25 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
                  <div className="absolute inset-[3px] rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <TypeIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
                  {account.currency}
                </span>
              </div>
              <div className="relative">
                <p className="text-sm opacity-90 mb-2">{account.name}</p>
                <p className="text-3xl font-bold tabular-nums transition-transform duration-300 group-hover:scale-[1.03] origin-left">
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
                <div className="p-3 bg-gradient-to-br from-magenta-600 to-teal-600 rounded-xl text-white shadow-sm">
                  <p className="text-xs text-white/80 mb-1">Current Balance</p>
                  <p className="text-lg font-bold text-white">{formatMoney(account.balance, account.currency)}</p>
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
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 hover:-translate-y-0.5 active:scale-95 text-slate-700 font-medium rounded-lg transition-all duration-200"
                >
                  View Details
                </button>
                <button
                  onClick={() => setTransferFromAccountId(account.id)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-magenta-500 to-teal-500 hover:from-magenta-600 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}