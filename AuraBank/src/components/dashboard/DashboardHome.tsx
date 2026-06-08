'use client';

import { Landmark, PiggyBank, Vault } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MobileAppShowcase from '../MobileAppShowcase';
import InterAppTransfer from './InterAppTransfer';
import { getCategoryStyle } from './TransactionsPage';
import { getBillCategoryStyle } from './BillsPage';

type NavTarget = 'accounts' | 'transactions' | 'bills';

export default function DashboardHome({ userId, onNavigate }: { userId: number; onNavigate?: (page: NavTarget) => void }) {
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
        <div
          className="group relative overflow-hidden bg-gradient-to-br from-magenta-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
          style={{ animationDelay: '0ms' }}
        >
          {/* Watermark illustration — fades up and brightens on hover */}
          <div className="absolute -bottom-6 -right-6 w-28 h-28 opacity-20 group-hover:opacity-35 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500">
            <img src="/usd-coin.svg" alt="" className="w-full h-full object-contain drop-shadow-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="relative flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Total Balance</h3>
          </div>
          <p className="relative text-4xl font-bold tabular-nums transition-transform duration-300 group-hover:scale-[1.03] origin-left">{formatCurrency(totalBalance)}</p>
          <p className="relative text-sm opacity-80 mt-2">Across all accounts</p>
        </div>

        <div
          className="group relative overflow-hidden bg-surface rounded-2xl p-6 shadow-lg border border-navy-700 hover:shadow-xl hover:-translate-y-1 hover:border-teal-500/40 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
          style={{ animationDelay: '80ms' }}
        >
          {/* Watermark illustration — Visa mark, large and faint, brightens on hover */}
          <div className="absolute -bottom-6 -right-6 w-28 h-28 opacity-[0.07] group-hover:opacity-[0.14] group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500">
            <img src="/visa.svg" alt="" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="relative flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-dark">Available Credit</h3>
          </div>
          <p className="relative text-3xl font-bold text-text-dark tabular-nums transition-transform duration-300 group-hover:scale-[1.03] origin-left">{formatCurrency(totalCredit)}</p>
          <p className="relative text-sm text-slate-500 mt-2">Credit cards</p>
        </div>

        <div
          className="group relative overflow-hidden bg-surface rounded-2xl p-6 shadow-lg border border-navy-700 hover:shadow-xl hover:-translate-y-1 hover:border-magenta-500/40 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
          style={{ animationDelay: '160ms' }}
        >
          {/* Watermark illustration — AuraBank brand mark, large and faint, brightens on hover */}
          <div className="absolute -bottom-6 -right-6 w-28 h-28 opacity-10 group-hover:opacity-20 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500">
            <img src="/dblogo.jpg" alt="" className="w-full h-full object-contain rounded-2xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="relative flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-dark">Accounts</h3>
          </div>
          <p className="relative text-3xl font-bold text-text-dark tabular-nums transition-transform duration-300 group-hover:scale-[1.03] origin-left">{accounts.length}</p>
          <p className="relative text-sm text-slate-500 mt-2">Active accounts</p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-dark">My Accounts</h2>
          <button
            onClick={() => onNavigate?.('accounts')}
            className="text-sm font-medium text-magenta-500 hover:text-magenta-600 transition-colors"
          >
            View All
          </button>
        </div>

        <div className="space-y-4">
          {accounts.filter((account) => account.type !== 'credit').map((account, idx) => {
            const style = account.type === 'checking'
              ? {
                  spin: 'border-t-magenta-500/80 border-r-magenta-500/30',
                  bg: 'bg-magenta-500/10', text: 'text-magenta-600',
                  bar: 'from-magenta-500 to-magenta-600',
                  border: 'hover:border-magenta-500/30', label: 'bg-magenta-500/10 text-magenta-600',
                  Icon: Landmark, name: 'Checking',
                }
              : account.type === 'savings'
              ? {
                  spin: 'border-t-teal-400/80 border-r-teal-400/30',
                  bg: 'bg-teal-100', text: 'text-teal-600',
                  bar: 'from-teal-500 to-teal-400',
                  border: 'hover:border-teal-500/30', label: 'bg-teal-100 text-teal-600',
                  Icon: PiggyBank, name: 'Savings',
                }
              : {
                  spin: 'border-t-mint-500/80 border-r-mint-500/30',
                  bg: 'bg-mint-500/10', text: 'text-mint-600',
                  bar: 'from-mint-500 to-mint-600',
                  border: 'hover:border-mint-500/30', label: 'bg-mint-500/10 text-mint-600',
                  Icon: Vault, name: 'Other',
                };
            const share = totalBalance > 0 ? Math.min(Math.max(account.balance, 0) / totalBalance * 100, 100) : 0;
            const Icon = style.Icon;

            return (
            <div
              key={account.id}
              className={`group p-4 rounded-xl bg-navy-50 hover:bg-navy-100 border border-transparent ${style.border} hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-1 fill-mode-both`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ width: 48, height: 48 }}>
                    <div className={`absolute inset-0 rounded-full border-2 border-transparent ${style.spin} animate-spin`} style={{ animationDuration: '2.5s' }} />
                    <div className={`absolute inset-[3px] rounded-full ${style.bg} ${style.text} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-dark">{account.name}</h3>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${style.label}`}>
                        {style.name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{account.accountNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold tabular-nums transition-transform duration-300 group-hover:scale-[1.03] origin-right ${account.balance >= 0 ? 'text-text-dark' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(account.balance))}
                  </p>
                  {account.type === 'credit' && (
                    <p className="text-xs text-slate-500">
                      Available: {formatCurrency(account.availableBalance || 0)}
                    </p>
                  )}
                </div>
              </div>

              {/* Share of total balance */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-navy-200/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${style.bar} h-1.5 rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${share}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-400 tabular-nums w-10 text-right">{share.toFixed(0)}%</span>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-dark">Recent Transactions</h2>
            <button
              onClick={() => onNavigate?.('transactions')}
              className="text-sm font-medium text-magenta-500 hover:text-magenta-600 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((transaction, idx) => {
              const isCredit = transaction.type === 'credit';
              const { Icon: CategoryIcon, bg, text } = getCategoryStyle(transaction.category);
              const spin = isCredit
                ? 'border-t-green-400/80 border-r-green-400/30'
                : 'border-t-red-400/80 border-r-red-400/30';

              return (
              <div
                key={transaction.id}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-navy-50 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ width: 40, height: 40 }}>
                    <div className={`absolute inset-0 rounded-full border-2 border-transparent ${spin} group-hover:animate-spin`} style={{ animationDuration: '2.5s' }} />
                    <div className={`absolute inset-[3px] rounded-full ${bg} ${text} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-text-dark">{transaction.description}</h4>
                    <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <p className={`font-semibold ${
                  isCredit ? 'text-mint-600' : 'text-red-600'
                }`}>
                  {isCredit ? '+' : '-'}{formatCurrency(Math.abs(Number.isFinite(Number(transaction.amount)) ? Number(transaction.amount) : 0))}
                </p>
              </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-dark">Upcoming Bills</h2>
            <button
              onClick={() => onNavigate?.('bills')}
              className="text-sm font-medium text-magenta-500 hover:text-magenta-600 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {upcomingBills.length > 0 ? (
              upcomingBills.map((bill, idx) => {
                const { Icon: CategoryIcon, bg, text } = getBillCategoryStyle(bill.category);
                return (
                <div
                  key={bill.id}
                  className="group flex items-center justify-between p-4 rounded-lg bg-navy-50 hover:bg-navy-100 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ width: 40, height: 40 }}>
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400/80 border-r-orange-400/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
                      <div className={`absolute inset-[3px] rounded-full ${bg} ${text} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
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
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No upcoming bills</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-App Transfer */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-text-dark">Cross-App Transfer</h3>
          <p className="text-sm text-slate-500 mt-0.5">Move funds between AuraBank, AuraVest &amp; AuraWallet instantly</p>
        </div>
        <InterAppTransfer sourceApp="bank" />
      </div>

      {/* Mobile App Showcase */}
      <MobileAppShowcase />
    </div>
  );
}