'use client';

import { useState } from 'react';
import {
  Search, Inbox, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  Landmark, PiggyBank, Vault, ShoppingBag, Utensils, Car, Zap,
  Film, Banknote, HeartPulse, BookOpen, Music, Receipt,
} from 'lucide-react';
import { formatCurrency as formatMoney } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';
import TransferForm from './TransferForm';

const getAccountStyle = (type: string) => {
  switch (type) {
    case 'checking':
      return { spin: 'border-t-magenta-500/80 border-r-magenta-500/30', bg: 'bg-magenta-500/10', text: 'text-magenta-600', Icon: Landmark };
    case 'savings':
      return { spin: 'border-t-teal-400/80 border-r-teal-400/30', bg: 'bg-teal-100', text: 'text-teal-600', Icon: PiggyBank };
    default:
      return { spin: 'border-t-mint-500/80 border-r-mint-500/30', bg: 'bg-mint-500/10', text: 'text-mint-600', Icon: Vault };
  }
};

const categoryStyles: Record<string, { Icon: any; bg: string; text: string }> = {
  'Shopping': { Icon: ShoppingBag, bg: 'bg-magenta-500/10', text: 'text-magenta-600' },
  'Food & Dining': { Icon: Utensils, bg: 'bg-mint-500/10', text: 'text-mint-600' },
  'Transportation': { Icon: Car, bg: 'bg-teal-100', text: 'text-teal-600' },
  'Bills & Utilities': { Icon: Zap, bg: 'bg-amber-100', text: 'text-amber-600' },
  'Entertainment': { Icon: Film, bg: 'bg-magenta-500/10', text: 'text-magenta-600' },
  'Income': { Icon: Banknote, bg: 'bg-green-100', text: 'text-green-600' },
  'Transfer': { Icon: ArrowLeftRight, bg: 'bg-teal-100', text: 'text-teal-600' },
  'Healthcare': { Icon: HeartPulse, bg: 'bg-red-100', text: 'text-red-600' },
  'Education': { Icon: BookOpen, bg: 'bg-mint-500/10', text: 'text-mint-600' },
  'Music': { Icon: Music, bg: 'bg-magenta-500/10', text: 'text-magenta-600' },
};

const getCategoryStyle = (category: string) => categoryStyles[category] || { Icon: Receipt, bg: 'bg-slate-100', text: 'text-slate-500' };

export default function TransactionsPage({ userId }: { userId: number }) {
  const { accounts, transactions: allTransactions } = useAuth();
  const transactions = allTransactions;
  const [filter, setFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFromAccount, setSelectedFromAccount] = useState<string>('');
  const [showTransfer, setShowTransfer] = useState(false);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAccountName = (accountId: string) => {
    return accounts.find((acc: any) => acc.id === accountId)?.name || 'Unknown';
  };

  const filteredTransactions = transactions
    .filter((tx: any) => filter === 'all' || tx.type === filter)
    .filter((tx: any) =>
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {/* Transfer Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-magenta-500 to-teal-500 text-white flex items-center justify-center shadow-sm">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Transfer Money</h3>
              <p className="text-sm text-slate-600">Move funds between your accounts</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowTransfer((prev) => !prev);
              if (showTransfer) setSelectedFromAccount('');
            }}
            className="px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-magenta-500 to-teal-500 hover:from-magenta-600 hover:to-teal-600 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            {showTransfer ? 'Hide Transfer' : 'New Transfer'}
          </button>
        </div>

        {showTransfer && (
          <div className="space-y-4">
            {!selectedFromAccount ? (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Select account to transfer from</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accounts.map((account: any, idx: number) => {
                    const style = getAccountStyle(account.type);
                    const Icon = style.Icon;
                    return (
                      <button
                        key={account.id}
                        onClick={() => setSelectedFromAccount(account.id)}
                        className="group flex items-center gap-3 text-left border border-slate-200 rounded-xl p-4 hover:bg-slate-50 hover:border-magenta-500/40 hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
                          <div className={`absolute inset-0 rounded-full border-2 border-transparent ${style.spin} group-hover:animate-spin`} style={{ animationDuration: '2.5s' }} />
                          <div className={`absolute inset-[3px] rounded-full ${style.bg} ${style.text} flex items-center justify-center`}>
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-magenta-600 transition-colors truncate">{account.name}</p>
                          <p className="text-sm text-slate-500 truncate">{account.accountNumber}</p>
                          <p className="text-sm font-medium text-slate-900 mt-0.5 tabular-nums">
                            {formatMoney(account.balance, account.currency)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <TransferForm
                defaultFromAccountId={selectedFromAccount}
                onTransferComplete={() => {
                  setSelectedFromAccount('');
                  setShowTransfer(false);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none transition-shadow"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-magenta-500 to-teal-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              All
            </button>
            <button
              onClick={() => setFilter('credit')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'credit'
                  ? 'bg-gradient-to-r from-magenta-500 to-teal-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Income
            </button>
            <button
              onClick={() => setFilter('debit')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'debit'
                  ? 'bg-gradient-to-r from-magenta-500 to-teal-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Expenses
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.map((transaction: any, idx: number) => {
                const amountValue = Number(transaction.amount);
                const normalizedAmount = Number.isFinite(amountValue) ? amountValue : 0;
                const isCredit = transaction.type === 'credit';
                const ring = isCredit
                  ? { spin: 'border-t-green-500/80 border-r-green-500/30', bg: 'bg-green-100', text: 'text-green-600' }
                  : { spin: 'border-t-red-500/80 border-r-red-500/30', bg: 'bg-red-100', text: 'text-red-600' };
                const { Icon: CategoryIcon } = getCategoryStyle(transaction.category);

                return (
                <tr
                  key={transaction.id}
                  className="group hover:bg-slate-50 transition-colors duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
                        <div className={`absolute inset-0 rounded-full border-2 border-transparent ${ring.spin} group-hover:animate-spin`} style={{ animationDuration: '2.5s' }} />
                        <div className={`absolute inset-[3px] rounded-full ${ring.bg} ${ring.text} flex items-center justify-center`}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{transaction.description}</p>
                        {transaction.merchant && (
                          <p className="text-sm text-slate-500 truncate">{transaction.merchant}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{getAccountName(transaction.accountId)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{formatDate(transaction.date)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold tabular-nums ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit ? '+' : '-'}{formatMoney(Math.abs(normalizedAmount), accounts.find((acc: any) => acc.id === transaction.accountId)?.currency || 'USD')}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-slate-500 font-medium">No transactions found</p>
            <p className="text-sm text-slate-400 mt-0.5">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
