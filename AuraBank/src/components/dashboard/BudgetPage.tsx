'use client';

import { useAuth } from '@/contexts/AuthContext';

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
    if (percentage >= 80) return 'from-yellow-500 to-yellow-600';
    return 'from-magenta-500 to-cyan-500'; // ✅ Brand gradient
  };

  const getProgressBgColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return 'bg-red-100';
    if (percentage >= 80) return 'bg-yellow-100';
    return 'bg-magenta-50'; // Soft magenta background
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-light">Budget & Analytics</h2>
          <p className="text-text-light/80 mt-1">Track your spending and manage budgets</p>
        </div>
        {/* Removed "+ Create Budget" button for now */}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-magenta-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Total Budget</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">{formatCurrency(totalBudget)}</p>
          <p className="text-sm opacity-80 mt-2">Monthly budget limit</p>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-lg border border-navy-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-dark">Total Spent</h3>
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-text-dark">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-slate-500 mt-2">
            {((totalSpent / totalBudget) * 100).toFixed(0)}% of budget
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-lg border border-navy-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-dark">Remaining</h3>
            <svg className="w-8 h-8 text-mint-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className={`text-3xl font-bold ${totalRemaining >= 0 ? 'text-text-dark' : 'text-red-600'}`}>
            {formatCurrency(totalRemaining)}
          </p>
          <p className="text-sm text-slate-500 mt-2">Available to spend</p>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="bg-surface text-text-dark rounded-2xl shadow-lg border border-navy-700 p-6">
        <h3 className="font-semibold text-text-dark mb-6">Budget by Category</h3>
        <div className="space-y-6">
          {budgets.map((budget) => {
            const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
            const isOverBudget = budget.spent > budget.limit;

            return (
              <div key={budget.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-dark">{budget.category}</h4>
                    <p className="text-sm text-slate-500">{budget.period}</p>
                  </div>
                  <div className="text-right">
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
                  <div className={`w-full ${getProgressBgColor(budget.spent, budget.limit)} rounded-full h-3`}>
                    <div
                      className={`bg-gradient-to-r ${getProgressColor(budget.spent, budget.limit)} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="absolute right-0 -top-6 text-xs font-semibold text-slate-600">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spending by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface text-text-dark rounded-2xl shadow-lg border border-navy-700 p-6">
          <h3 className="font-semibold text-text-dark mb-6">Top Spending Categories</h3>
          <div className="space-y-4">
            {topCategories.map(([category, amount], index) => {
              const maxAmount = topCategories[0][1];
              const percentage = (amount / maxAmount) * 100;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{index + 1}</span>
                      <span className="font-medium text-text-dark">{category}</span>
                    </div>
                    <span className="font-semibold text-text-dark">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-magenta-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spending Insights */}
        <div className="bg-surface text-text-dark rounded-2xl shadow-lg border border-navy-700 p-6">
          <h3 className="font-semibold text-text-dark mb-6">Spending Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">Budget Status</h4>
                  <p className="text-sm text-blue-800">
                    {totalRemaining >= 0
                      ? `You're on track! ${formatCurrency(totalRemaining)} left to spend this month.`
                      : `You're over budget by ${formatCurrency(Math.abs(totalRemaining))}. Consider reducing spending.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-mint-50 border border-mint-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-mint-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-mint-900 mb-1">Best Category</h4>
                  <p className="text-sm text-mint-800">
                    {budgets.sort((a, b) => (a.limit - a.spent) - (b.limit - b.spent))[budgets.length - 1]?.category} has the most budget remaining.
                  </p>
                </div>
              </div>
            </div>

            {budgets.some(b => b.spent > b.limit) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
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
        </div>
      </div>
    </div>
  );
}