'use client';

import { useState } from 'react';
import { formatCurrency as formatMoney } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';
import TransferForm from './TransferForm';

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

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Shopping': '🛍️',
      'Food & Dining': '🍔',
      'Transportation': '🚗',
      'Bills & Utilities': '⚡',
      'Entertainment': '🎬',
      'Income': '💵',
      'Transfer': '💸',
      'Healthcare': '🏥',
      'Education': '📚',
      'Music': '🎧',
    };
    return icons[category] || '💰';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Transactions & Transfer</h2>
        <p className="text-slate-600 mt-1">Manage transfer actions and transaction history in one place</p>
      </div>

      {/* Transfer Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Transfer Money</h3>
            <p className="text-sm text-slate-600">Move funds between your accounts</p>
          </div>
          <button
            onClick={() => {
              setShowTransfer((prev) => !prev);
              if (showTransfer) setSelectedFromAccount('');
            }}
            className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
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
                  {accounts.map((account: any) => (
                    <button
                      key={account.id}
                      onClick={() => setSelectedFromAccount(account.id)}
                      className="text-left border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition"
                    >
                      <p className="font-semibold text-slate-900">{account.name}</p>
                      <p className="text-sm text-slate-600">{account.accountNumber}</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">
                        {formatMoney(account.balance, account.currency)}
                      </p>
                    </button>
                  ))}
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
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('credit')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'credit'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setFilter('debit')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'debit'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
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
              {filteredTransactions.map((transaction: any) => {
                const amountValue = Number(transaction.amount);
                const normalizedAmount = Number.isFinite(amountValue) ? amountValue : 0;

                return (
                <tr key={transaction.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className="text-lg">{getCategoryIcon(transaction.category)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{transaction.description}</p>
                        {transaction.merchant && (
                          <p className="text-sm text-slate-500">{transaction.merchant}</p>
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
                    <span className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
  {transaction.type === 'credit' ? '+' : '-'}{formatMoney(Math.abs(normalizedAmount), accounts.find((acc: any) => acc.id === transaction.accountId)?.currency || 'USD')}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
