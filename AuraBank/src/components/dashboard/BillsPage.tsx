'use client';

import { useAuth } from '@/contexts/AuthContext';
import { File, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';

export default function BillsPage() {
  const { bills, accounts, updateBills, addTransaction, updateAccounts, addRecurringTransaction, processRecurringTransactions } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [fromAccount, setFromAccount] = useState('');
  const [error, setError] = useState('');
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; billName: string; amount: number }>({
    isOpen: false,
    billName: '',
    amount: 0,
  });

  const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    'Utilities': '⚡',
    'Entertainment': '🎬',
    'Education': '📚',
    'Shopping': '🛍️',
    'Healthcare': '🏥',
    'Food & Dining': '🍔',
    'Transportation': '🚗',
    'Bills & Utilities': '⚡', // fallback
    'Travel': '✈️',
    'Music': '🎧',
  };
  return icons[category] || '📄'; // default
};

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

  const getDaysUntilDue = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handlePayBill = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    const primaryAccount = accounts.find(acc => acc.type === 'checking');
    if (!primaryAccount || primaryAccount.balance < bill.amount) {
      alert('Insufficient funds');
      return;
    }

    // Update bill status
    const updatedBills = bills.map(b =>
      b.id === billId ? { ...b, status: 'paid' as const, accountId: primaryAccount.id } : b
    );
    updateBills(updatedBills);

    // Add transaction
    const transaction = {
      id: `tx-${Date.now()}`,
      accountId: primaryAccount.id,
      type: 'debit' as const,
      category: bill.category,
      description: bill.name,
      amount: -bill.amount,
      date: new Date().toISOString(),
      status: 'completed' as const,
      merchant: bill.name,
    };
    addTransaction(transaction);

    // Update account balance
    const updatedAccounts = accounts.map(acc =>
      acc.id === primaryAccount.id
        ? { ...acc, balance: acc.balance - bill.amount }
        : acc
    );
    updateAccounts(updatedAccounts);

    // Show success modal
    setSuccessModal({
      isOpen: true,
      billName: bill.name,
      amount: bill.amount,
    });
  };

  const handleCreateRecurring = (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    setError('Please enter a valid amount.');
    return;
  }

  const fromAcc = accounts.find(acc => acc.id === fromAccount);
  if (!fromAcc) {
    setError('Please select an account.');
    return;
  }

  const nextDate = new Date();
  if (frequency === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (frequency === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === 'daily') {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  // ✅ 1. Create recurring rule
  const newRecurring = {
    id: `recur-${Date.now()}`,
    type: 'bill' as const,
    fromAccountId: fromAccount,
    amount: numAmount,
    description: name,
    frequency,
    nextDate: nextDate.toISOString(),
    isActive: true,
    currency: fromAcc.currency,
  };
  addRecurringTransaction(newRecurring);

  // ✅ 2. ALSO create a matching Bill (so it appears in the list)
  const newBill = {
    id: `bill-auto-${Date.now()}`,
    name,
    category,
    amount: numAmount,
    dueDate: nextDate.toISOString(),
    status: 'pending' as const,
    recurring: true,
    accountId: fromAccount,
    currency: fromAcc.currency,
  };

  // Add to bills list
  const updatedBills = [...bills, newBill];
  updateBills(updatedBills);

  // Reset form
  setIsModalOpen(false);
  setName('');
  setAmount('');
  setCategory('Utilities');
  setFrequency('monthly');
  setFromAccount('');

  // Process immediately for testing
  processRecurringTransactions();
};

  const pendingBills = bills.filter(b => b.status === 'pending');
  const paidBills = bills.filter(b => b.status === 'paid');
  const overdueBills = bills.filter(b => b.status === 'overdue');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium rounded-lg hover:from-magenta-600 hover:to-teal-600 transition"
        >
          + Auto-Pay
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl shadow-lg border border-navy-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-dark/70 mb-1">Pending Bills</p>
              <p className="text-3xl font-bold text-text-dark">{pendingBills.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <File className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-lg border border-navy-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-dark/70 mb-1">Total Due</p>
              <p className="text-3xl font-bold text-text-dark">
                {formatCurrency(pendingBills.reduce((sum, b) => sum + b.amount, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-lg border border-navy-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-dark/70 mb-1">Paid This Month</p>
              <p className="text-3xl font-bold text-text-dark">{paidBills.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Bills */}
      {pendingBills.length > 0 && (
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
          <h3 className="font-semibold text-text-dark mb-4">Pending Bills</h3>
          <div className="space-y-3">
            {pendingBills.map((bill) => {
              const daysUntil = getDaysUntilDue(bill.dueDate);
              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-navy-50 hover:bg-navy-100 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
  daysUntil < 0 ? 'bg-red-100' : daysUntil <= 5 ? 'bg-orange-100' : 'bg-blue-100'
}`}>
  <span className="text-xl">{getCategoryIcon(bill.category)}</span>
</div>
                    <div>
                      <h4 className="font-semibold text-text-dark">{bill.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-700">
                          {bill.category}
                        </span>
                        {bill.recurring && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-4">
                    <div>
                      <p className="font-semibold text-text-dark">{formatCurrency(bill.amount)}</p>
                      <p className={`text-sm ${
                        daysUntil < 0 ? 'text-red-600' : daysUntil <= 5 ? 'text-orange-600' : 'text-slate-500'
                      }`}>
                        {daysUntil < 0
                          ? `Overdue by ${Math.abs(daysUntil)} days`
                          : daysUntil === 0
                          ? 'Due today'
                          : `Due in ${daysUntil} days`}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePayBill(bill.id)}
                      className="px-4 py-2 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium rounded-lg hover:from-magenta-600 hover:to-teal-600 transition"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paid Bills */}
      {paidBills.length > 0 && (
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
          <h3 className="font-semibold text-text-dark mb-4">Recently Paid</h3>
          <div className="space-y-3">
            {paidBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 rounded-xl bg-navy-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-dark">{bill.name}</h4>
                    <p className="text-sm text-slate-500">Paid on {formatDate(bill.dueDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-text-dark">{formatCurrency(bill.amount)}</p>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bills.length === 0 && (
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-12 text-center">
          <p className="text-slate-500">No bills to display</p>
        </div>
      )}

      {/* ✅ Recurring Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-dark">Set Up Auto-Pay</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRecurring} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Bill Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                  placeholder="Electricity, Netflix, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                >
                  <option value="Utilities">Utilities</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Education">Education</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Travel">Travel</option>
                  <option value="Music">Music</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  From Account
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none text-slate-900"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium rounded-lg"
                >
                  Create Auto-Pay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Payment Successful</h3>
              <button
                onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
              </div>

              <p className="text-base font-semibold text-slate-700 mb-1">Payment Confirmed</p>
              <p className="text-xs text-slate-600 mb-4">
                Your bill payment has been processed successfully.
              </p>

              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-slate-600">Bill:</span>
                  <span className="text-sm font-semibold text-slate-900">{successModal.billName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Amount Paid:</span>
                  <span className="text-sm font-bold text-green-600">
                    ${successModal.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
                className="w-full px-3 py-2.5 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium text-sm rounded-lg hover:from-magenta-600 hover:to-teal-600 transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}