'use client';

import { CreditCard, PiggyBank, Gem, ArrowDown, ArrowUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MobileAppShowcase from '../MobileAppShowcase';

export default function DashboardHome({ userId }: { userId: number }) {
  const { accounts, transactions: allTransactions, bills } = useAuth();
  const transactions = allTransactions;

  const totalBalance = accounts.reduce((sum, acc) => {
    if (acc.type === 'credit') return sum;
    return sum + acc.balance;
  }, 0);

  const totalCredit = accounts
    .filter(acc => acc.type === 'credit')
    .reduce((sum, acc) => sum + (acc.availableBalance || 0), 0);

  const recentTransactions = transactions.slice(0, 5);
  const upcomingBills = bills.filter(b => b.status === 'pending').slice(0, 3);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-magenta-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Total Balance</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="text-sm opacity-80 mt-2">Across all accounts</p>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-lg border border-navy-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-dark">Available Credit</h3>
            <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-text-dark">{formatCurrency(totalCredit)}</p>
          <p className="text-sm text-slate-500 mt-2">Credit cards</p>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-lg border border-navy-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-dark">Accounts</h3>
            <svg className="w-8 h-8 text-magenta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-text-dark">{accounts.length}</p>
          <p className="text-sm text-slate-500 mt-2">Active accounts</p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-dark">My Accounts</h2>
          <button className="text-sm font-medium text-magenta-500 hover:text-magenta-600">
            View All
          </button>
        </div>

        <div className="space-y-4">
          {accounts.filter((account) => account.type !== 'credit').map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 rounded-xl bg-navy-50 hover:bg-navy-100 transition"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  account.type === 'checking' ? 'bg-magenta-100 text-magenta-600' :
                  account.type === 'savings' ? 'bg-teal-100 text-teal-600' :
                  'bg-mint-100 text-mint-600'
                }`}>
                  {account.type === 'checking' ? (
                    <CreditCard className="w-6 h-6" />
                  ) : account.type === 'savings' ? (
                    <PiggyBank className="w-6 h-6" />
                  ) : (
                    <Gem className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-text-dark">{account.name}</h3>
                  <p className="text-sm text-slate-500">{account.accountNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${account.balance >= 0 ? 'text-text-dark' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(account.balance))}
                </p>
                {account.type === 'credit' && (
                  <p className="text-xs text-slate-500">
                    Available: {formatCurrency(account.availableBalance || 0)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-dark">Recent Transactions</h2>
            <button className="text-sm font-medium text-magenta-500 hover:text-magenta-600">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-navy-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? (
                      <ArrowDown className="w-5 h-5" />
                    ) : (
                      <ArrowUp className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-text-dark">{transaction.description}</h4>
                    <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <p className={`font-semibold ${
                  transaction.type === 'credit' ? 'text-mint-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(Number.isFinite(Number(transaction.amount)) ? Number(transaction.amount) : 0))}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-dark">Upcoming Bills</h2>
            <button className="text-sm font-medium text-magenta-500 hover:text-magenta-600">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {upcomingBills.length > 0 ? (
              upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-navy-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                      {/* Inline SVG to avoid File constructor conflict */}
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-dark">{bill.name}</h4>
                      <p className="text-xs text-slate-500">Due {formatDate(bill.dueDate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-dark">{formatCurrency(bill.amount)}</p>
                    <button className="text-xs text-magenta-500 hover:text-magenta-600 font-medium mt-1">
                      Pay Now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No upcoming bills</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile App Showcase */}
      <MobileAppShowcase />
    </div>
  );
}