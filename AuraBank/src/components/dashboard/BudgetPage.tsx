'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Wallet, TrendingDown, PiggyBank, Info, CheckCircle2, AlertTriangle, Receipt } from 'lucide-react';
import { getCategoryStyle } from './TransactionsPage';

export default function BudgetPage() {
  const { budgets, transactions } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return 'from-red-500 to-red-600';
    if (percentage >= 80) return 'from-amber-400 to-amber-500';
    return 'from-magenta-500 to-cyan-500'; // ✅ Brand gradient
  };

  const getProgressBgColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return 'bg-red-100';
    if (percentage >= 80) return 'bg-amber-100';
    return 'bg-magenta-500/10'; // Soft magenta background
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  // Calculate spending by category
  const categorySpending = transactions
    .filter(tx => tx.type === 'debit')
    .reduce((acc, tx) => {
      const category = tx.category;
      acc[category] = (acc[category] || 0) + Math.abs(tx.amount);
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden bg-gradient-to-br from-magenta-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300">
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none transition-transform duration-500 group-hover:scale-110" />
          <div className="relative flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Total Budget</h3>
            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="relative text-4xl font-bold">{formatCurrency(totalBudget)}</p>
          <p className="relative text-sm opacity-80 mt-2">Monthly budget limit</p>
        </div>

        <div className="group bg-surface rounded-2xl p-6 shadow-lg border border-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300" style={{ animationDelay: '70ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-dark">Total Spent</h3>
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-dark">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-slate-500 mt-2">
            {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(0)}% of budget` : 'No budget set'}
          </p>
        </div>

        <div className="group bg-surface rounded-2xl p-6 shadow-lg border border-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300" style={{ animationDelay: '140ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-dark">Remaining</h3>
            <div className="w-10 h-10 rounded-full bg-mint-500/20 text-mint-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${totalRemaining >= 0 ? 'text-text-dark' : 'text-red-600'}`}>
            {formatCurrency(totalRemaining)}
          </p>
          <p className="text-sm text-slate-500 mt-2">Available to spend</p>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="bg-surface text-text-dark rounded-2xl shadow-lg border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300" style={{ animationDelay: '210ms' }}>
        <h3 className="font-semibold text-text-dark mb-6">Budget by Category</h3>
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center text-center py-10 px-6">
            <div className="w-14 h-14 rounded-full bg-magenta-500/10 text-magenta-600 flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h4 className="font-medium text-text-dark mb-1">No budgets set up yet</h4>
            <p className="text-sm text-slate-500 max-w-xs">
              Create category budgets to track your spending and stay on top of your monthly goals.
            </p>
          </div>
        ) : (
        <div className="space-y-6">
          {budgets.map((budget, idx) => {
            const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
            const isOverBudget = budget.spent > budget.limit;
            const { Icon: CategoryIcon, bg: iconBg, text: iconText } = getCategoryStyle(budget.category);

            return (
              <div
                key={budget.id}
                className="group space-y-3 p-3 -m-3 rounded-xl hover:bg-slate-50 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`relative w-10 h-10 rounded-full ${iconBg} ${iconText} flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                      {isOverBudget && <span className="absolute inset-0 rounded-full bg-red-400/40 animate-ping" />}
                      <CategoryIcon className="relative w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-text-dark truncate">{budget.category}</h4>
                      <p className="text-sm text-slate-500">{budget.period}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-text-dark'}`}>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </p>
                    <p className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-slate-500'}`}>
                      {isOverBudget ? `Over by ${formatCurrency(budget.spent - budget.limit)}` : `${formatCurrency(budget.limit - budget.spent)} left`}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className={`w-full ${getProgressBgColor(budget.spent, budget.limit)} rounded-full h-3 overflow-hidden`}>
                    <div
                      className={`relative overflow-hidden bg-gradient-to-r ${getProgressColor(budget.spent, budget.limit)} h-3 rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </div>
                  </div>
                  <span className="absolute right-0 -top-6 text-xs font-semibold text-slate-600 transition-colors duration-300 group-hover:text-slate-900">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Spending by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface text-text-dark rounded-2xl shadow-lg border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300" style={{ animationDelay: '280ms' }}>
          <h3 className="font-semibold text-text-dark mb-6">Top Spending Categories</h3>
          {topCategories.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 px-6">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-text-dark mb-1">No spending yet</h4>
              <p className="text-sm text-slate-500 max-w-xs">
                Once you start spending, your top categories will show up here.
              </p>
            </div>
          ) : (
          <div className="space-y-4">
            {topCategories.map(([category, amount], index) => {
              const maxAmount = topCategories[0][1];
              const percentage = (amount / maxAmount) * 100;
              const { Icon: CategoryIcon, bg: iconBg, text: iconText } = getCategoryStyle(category);
              const rankBg = ['bg-gradient-to-br from-magenta-500 to-cyan-500', 'bg-gradient-to-br from-cyan-500 to-mint-500', 'bg-slate-200'][Math.min(index, 2)];
              const rankText = index < 2 ? 'text-white' : 'text-slate-600';

              return (
                <div
                  key={category}
                  className="group space-y-2 p-2 -m-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full ${rankBg} ${rankText} text-xs font-bold flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                        {index + 1}
                      </span>
                      <div className={`w-9 h-9 rounded-full ${iconBg} ${iconText} flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-text-dark truncate">{category}</span>
                    </div>
                    <span className="font-semibold text-text-dark flex-shrink-0">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-magenta-500 to-cyan-500 h-2 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Spending Insights */}
        <div className="bg-surface text-text-dark rounded-2xl shadow-lg border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300" style={{ animationDelay: '350ms' }}>
          <h3 className="font-semibold text-text-dark mb-6">Spending Insights</h3>
          {budgets.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 px-6">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <Info className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-text-dark mb-1">Nothing to analyze yet</h4>
              <p className="text-sm text-slate-500 max-w-xs">
                Set up budgets to get personalized insights about your spending habits.
              </p>
            </div>
          ) : (
          <div className="space-y-4">
            <div className="group p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '0ms' }}>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                  <Info className="w-[18px] h-[18px] text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-cyan-600 mb-1">Budget Status</h4>
                  <p className="text-sm text-slate-700">
                    {totalRemaining >= 0
                      ? `You're on track! ${formatCurrency(totalRemaining)} left to spend this month.`
                      : `You're over budget by ${formatCurrency(Math.abs(totalRemaining))}. Consider reducing spending.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="group p-4 bg-mint-500/10 border border-mint-500/25 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '70ms' }}>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-mint-600 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                  <CheckCircle2 className="w-[18px] h-[18px] text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-mint-600 mb-1">Best Category</h4>
                  <p className="text-sm text-text-dark/80">
                    {[...budgets].sort((a, b) => (a.limit - a.spent) - (b.limit - b.spent))[budgets.length - 1]?.category} has the most budget remaining.
                  </p>
                </div>
              </div>
            </div>

            {budgets.some(b => b.spent > b.limit) && (
              <div className="group p-4 bg-red-50 border border-red-200 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '140ms' }}>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <AlertTriangle className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 mb-1">Over Budget Alert</h4>
                    <p className="text-sm text-red-800">
                      You've exceeded your budget in {budgets.filter(b => b.spent > b.limit).length} {budgets.filter(b => b.spent > b.limit).length === 1 ? 'category' : 'categories'}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}