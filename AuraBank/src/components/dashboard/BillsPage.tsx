'use client';

import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle, X, AlertCircle, Zap, Film, BookOpen, ShoppingBag,
  HeartPulse, Utensils, Car, Plane, Music, Receipt, FileText, Repeat,
  Wallet, Inbox,
} from 'lucide-react';
import { useState } from 'react';

const billCategoryStyles: Record<string, { Icon: any; bg: string; text: string }> = {
  'Utilities': { Icon: Zap, bg: 'bg-amber-100', text: 'text-amber-600' },
  'Entertainment': { Icon: Film, bg: 'bg-magenta-500/10', text: 'text-magenta-600' },
  'Education': { Icon: BookOpen, bg: 'bg-mint-500/10', text: 'text-mint-600' },
  'Shopping': { Icon: ShoppingBag, bg: 'bg-magenta-500/10', text: 'text-magenta-600' },
  'Healthcare': { Icon: HeartPulse, bg: 'bg-red-100', text: 'text-red-600' },
  'Food & Dining': { Icon: Utensils, bg: 'bg-mint-500/10', text: 'text-mint-600' },
  'Transportation': { Icon: Car, bg: 'bg-teal-100', text: 'text-teal-600' },
  'Bills & Utilities': { Icon: Zap, bg: 'bg-amber-100', text: 'text-amber-600' },
  'Travel': { Icon: Plane, bg: 'bg-teal-100', text: 'text-teal-600' },
  'Music': { Icon: Music, bg: 'bg-magenta-500/10', text: 'text-magenta-600' },
};

const getBillCategoryStyle = (category: string) => billCategoryStyles[category] || { Icon: Receipt, bg: 'bg-slate-100', text: 'text-slate-500' };

export default function BillsPage() {
  const { bills, accounts, updateBills, addTransaction, updateAccounts, addRecurringTransaction, processRecurringTransactions } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [fromAccount, setFromAccount] = useState('');
  const [error, setError] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; billName: string; amount: number }>({
    isOpen: false,
    billName: '',
    amount: 0,
  });

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
      setPayError('Insufficient funds in your checking account to pay this bill.');
      setTimeout(() => setPayError(null), 4000);
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium rounded-lg hover:from-magenta-600 hover:to-teal-600 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
        >
          <Repeat className="w-4 h-4" />
          Auto-Pay
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden bg-surface rounded-xl shadow-lg border border-navy-700 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-orange-400/40 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '0ms' }}>
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-orange-300 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-text-dark/70 mb-1">Pending Bills</p>
              <p className="text-3xl font-bold text-text-dark tabular-nums">{pendingBills.length}</p>
            </div>
            <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ width: 48, height: 48 }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400/80 border-r-orange-400/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
              <div className="absolute inset-[3px] rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-surface rounded-xl shadow-lg border border-navy-700 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-red-400/40 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '70ms' }}>
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-red-300 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-text-dark/70 mb-1">Total Due</p>
              <p className="text-3xl font-bold text-text-dark tabular-nums">
                {formatCurrency(pendingBills.reduce((sum, b) => sum + b.amount, 0))}
              </p>
            </div>
            <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ width: 48, height: 48 }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-400/80 border-r-red-400/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
              <div className="absolute inset-[3px] rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-surface rounded-xl shadow-lg border border-navy-700 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-green-400/40 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '140ms' }}>
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-green-300 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-text-dark/70 mb-1">Paid This Month</p>
              <p className="text-3xl font-bold text-text-dark tabular-nums">{paidBills.length}</p>
            </div>
            <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ width: 48, height: 48 }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-400/80 border-r-green-400/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
              <div className="absolute inset-[3px] rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {payError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {payError}
        </div>
      )}

      {/* Pending Bills */}
      {pendingBills.length > 0 && (
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
          <h3 className="font-semibold text-text-dark mb-4">Pending Bills</h3>
          <div className="space-y-3">
            {pendingBills.map((bill, idx) => {
              const daysUntil = getDaysUntilDue(bill.dueDate);
              const urgency = daysUntil < 0
                ? { ring: 'border-t-red-500/80 border-r-red-500/30', bg: 'bg-red-100', text: 'text-red-600', glow: 'bg-red-400', border: 'hover:border-red-400/40' }
                : daysUntil <= 5
                ? { ring: 'border-t-orange-400/80 border-r-orange-400/30', bg: 'bg-orange-100', text: 'text-orange-600', glow: 'bg-orange-300', border: 'hover:border-orange-400/40' }
                : { ring: 'border-t-teal-400/80 border-r-teal-400/30', bg: 'bg-teal-100', text: 'text-teal-600', glow: 'bg-teal-300', border: 'hover:border-teal-400/40' };
              const { Icon: CategoryIcon } = getBillCategoryStyle(bill.category);
              return (
                <div
                  key={bill.id}
                  className={`group relative overflow-hidden flex items-center justify-between p-4 rounded-xl bg-navy-50 border border-transparent ${urgency.border} hover:bg-navy-100 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-1 fill-mode-both`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${urgency.glow} blur-3xl opacity-0 group-hover:opacity-25 transition-opacity duration-500`} />
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                  <div className="relative flex items-center space-x-4 min-w-0">
                    <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ width: 48, height: 48 }}>
                      <div className={`absolute inset-0 rounded-full border-2 border-transparent ${urgency.ring} group-hover:animate-spin`} style={{ animationDuration: '2.5s' }} />
                      <div className={`absolute inset-[3px] rounded-full ${urgency.bg} ${urgency.text} flex items-center justify-center`}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-text-dark truncate transition-colors duration-200 group-hover:text-magenta-600">{bill.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-700">
                          {bill.category}
                        </span>
                        {bill.recurring && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full">
                            <Repeat className="w-3 h-3" />
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative text-right flex items-center space-x-4 flex-shrink-0">
                    <div>
                      <p className="font-semibold text-text-dark tabular-nums">{formatCurrency(bill.amount)}</p>
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
                      className="px-4 py-2 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium rounded-lg hover:from-magenta-600 hover:to-teal-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
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
            {paidBills.map((bill, idx) => (
              <div
                key={bill.id}
                className="group relative overflow-hidden flex items-center justify-between p-4 rounded-xl bg-navy-50 border border-transparent hover:border-green-400/40 hover:bg-navy-100 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-300"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-green-300 blur-3xl opacity-0 group-hover:opacity-25 transition-opacity duration-500" />
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                <div className="relative flex items-center space-x-4 min-w-0">
                  <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ width: 48, height: 48 }}>
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-500/80 border-r-green-500/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
                    <div className="absolute inset-[3px] rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-text-dark truncate transition-colors duration-200 group-hover:text-teal-600">{bill.name}</h4>
                    <p className="text-sm text-slate-500">Paid on {formatDate(bill.dueDate)}</p>
                  </div>
                </div>
                <div className="relative text-right flex-shrink-0">
                  <p className="font-semibold text-text-dark tabular-nums">{formatCurrency(bill.amount)}</p>
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
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-12 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-slate-500 font-medium">No bills to display</p>
          <p className="text-sm text-slate-400 mt-0.5">Set up Auto-Pay to start tracking recurring bills</p>
        </div>
      )}

      {/* Recurring Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-dark">Set Up Auto-Pay</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 text-center">
              <div className="relative w-14 h-14 mx-auto mb-3">
                <div className="absolute inset-0 rounded-full bg-green-500/15 animate-ping" style={{ animationDuration: '1.6s' }} />
                <div className="absolute inset-0 rounded-full bg-green-500/15 animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.35s' }} />
                <div className="absolute inset-2 rounded-full bg-green-100 border border-green-500/25 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>

              <p className="text-base font-semibold text-slate-900 mb-1">Payment Confirmed</p>
              <p className="text-xs text-slate-500 mb-4">
                Your bill payment has been processed successfully.
              </p>

              <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-1.5">
                <div className="flex justify-between animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-300" style={{ animationDelay: '80ms' }}>
                  <span className="text-xs text-slate-500">Bill</span>
                  <span className="text-sm font-semibold text-slate-900">{successModal.billName}</span>
                </div>
                <div className="flex justify-between animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-300" style={{ animationDelay: '140ms' }}>
                  <span className="text-xs text-slate-500">Amount Paid</span>
                  <span className="text-sm font-bold text-green-600 tabular-nums">
                    ${successModal.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
                className="w-full px-3 py-2.5 bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium text-sm rounded-lg hover:from-magenta-600 hover:to-teal-600 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
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