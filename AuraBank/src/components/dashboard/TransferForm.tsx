'use client';

import { useState, useEffect } from 'react';
import { formatCurrency as formatMoney, convertCurrency } from '@/lib/currency';
import { TransactionSuccessModal } from './TransactionSuccessModal';
import type { Currency } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function TransferForm({
  defaultFromAccountId,
  onTransferComplete,
}: {
  defaultFromAccountId: string;
  onTransferComplete: () => void;
}) {
  const { accounts, addTransaction, updateAccounts } = useAuth();
  const [fromAccount, setFromAccount] = useState(defaultFromAccountId);
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionData, setTransactionData] = useState<{
    fromAccount: string;
    toAccount: string;
    amount: number;
    convertedAmount?: number;
    fromCurrency: Currency;
    toCurrency: Currency;
    description?: string;
  } | null>(null);

  useEffect(() => {
    setFromAccount(defaultFromAccountId);
  }, [defaultFromAccountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    const fromAcc = accounts.find((a: any) => a.id === fromAccount);
    const toAcc = accounts.find((a: any) => a.id === toAccount);

    if (!fromAcc || !toAcc) {
      setError('Select valid accounts');
      return;
    }

    if (fromAcc.balance < numAmount) {
      setError('Insufficient funds');
      return;
    }

    // Convert amount to toAccount's currency if different
    const convertedAmount = convertCurrency(numAmount, fromAcc.currency, toAcc.currency);

    // Debit from source account
    addTransaction({
      id: `tx-${Date.now()}-1`,
      accountId: fromAccount,
      type: 'debit',
      category: 'Transfer',
      description: `Transfer to ${toAcc.name}${fromAcc.currency !== toAcc.currency ? ` (${formatMoney(numAmount, fromAcc.currency)} → ${formatMoney(convertedAmount, toAcc.currency)})` : ''}`,
      amount: -numAmount,
      date: new Date().toISOString(),
      status: 'completed',
    });

    // Credit to destination account
    addTransaction({
      id: `tx-${Date.now()}-2`,
      accountId: toAccount,
      type: 'credit',
      category: 'Transfer',
      description: `Transfer from ${fromAcc.name}${fromAcc.currency !== toAcc.currency ? ` (${formatMoney(numAmount, fromAcc.currency)} → ${formatMoney(convertedAmount, toAcc.currency)})` : ''}`,
      amount: convertedAmount,
      date: new Date().toISOString(),
      status: 'completed',
    });

    const updated = accounts.map((acc: any) => {
      if (acc.id === fromAccount) return { ...acc, balance: acc.balance - numAmount };
      if (acc.id === toAccount) return { ...acc, balance: acc.balance + convertedAmount };
      return acc;
    });
    updateAccounts(updated);

    // Set transaction data for the success modal
    setTransactionData({
      fromAccount: fromAcc.name,
      toAccount: toAcc.name,
      amount: numAmount,
      convertedAmount: convertedAmount,
      fromCurrency: fromAcc.currency,
      toCurrency: toAcc.currency,
      description: description || undefined,
    });

    setShowSuccessModal(true);
    setAmount('');
    setDescription('');
    setToAccount('');
  };

  const fromAcc = accounts.find((a: any) => a.id === fromAccount);
  const toAcc = accounts.find((a: any) => a.id === toAccount);

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="p-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
          Transfer completed successfully!
        </div>
      )}
      {error && <div className="p-2 bg-red-100 text-red-700 text-sm rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
        <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-900">
          {fromAcc ? `${fromAcc.name} (${formatMoney(fromAcc.balance, fromAcc.currency)})` : '—'}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">To Account</label>
        <select
          value={toAccount}
          onChange={e => setToAccount(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
          required
        >
          <option value="">Select account</option>
          {accounts
            .filter((a: any) => a.id !== fromAccount)
            .map((acc: any) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({formatMoney(acc.balance, acc.currency)})
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
          placeholder="0.00"
          required
        />
        {amount && fromAcc && toAcc && fromAcc.currency !== toAcc.currency && (
          <p className="text-xs text-slate-600 mt-1">
            Will receive: {formatMoney(convertCurrency(parseFloat(amount) || 0, fromAcc.currency, toAcc.currency), toAcc.currency)}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
          placeholder="Optional note"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => onTransferComplete()}
          className="flex-1 px-3 py-2 bg-black text-white rounded-lg transition-all duration-200 hover:bg-gray-800 hover:scale-105 active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={success}
          className={`flex-1 px-3 py-2 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            success
              ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/30 scale-105'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:scale-105 active:scale-95'
          }`}
        >
          {success ? (
            <span className="flex items-center justify-center space-x-2 animate-pulse">
              <span className="animate-spin text-lg">✓</span>
              <span>Done</span>
            </span>
          ) : (
            <span>Confirm Transfer</span>
          )}
        </button>
      </div>
    </form>

    <TransactionSuccessModal
      isOpen={showSuccessModal}
      onClose={() => {
        setShowSuccessModal(false);
        setTransactionData(null);
        onTransferComplete();
      }}
      transaction={transactionData}
    />
  </>
  );
}
