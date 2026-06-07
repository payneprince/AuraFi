'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, ArrowRightLeft, Landmark, PiggyBank, Vault, MessageSquare, Send } from 'lucide-react';
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

  const fromStyle = fromAcc ? getAccountStyle(fromAcc.type) : null;
  const FromIcon = fromStyle?.Icon;
  const toStyle = toAcc ? getAccountStyle(toAcc.type) : null;
  const ToIcon = toStyle?.Icon;
  const showConversion = !!(amount && fromAcc && toAcc && fromAcc.currency !== toAcc.currency);
  const numAmount = parseFloat(amount) || 0;
  const insufficientFunds = !!(fromAcc && numAmount > 0 && numAmount > fromAcc.balance);
  const quickAmounts = fromAcc ? [0.25, 0.5, 1].map((pct) => ({ pct, value: Math.floor(fromAcc.balance * pct * 100) / 100 })) : [];

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* From account preview card */}
      <div className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '0ms' }}>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">From</label>
        {fromAcc && fromStyle && FromIcon ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
              <div className={`absolute inset-0 rounded-full border-2 border-transparent ${fromStyle.spin} animate-spin`} style={{ animationDuration: '2.5s' }} />
              <div className={`absolute inset-[3px] rounded-full ${fromStyle.bg} ${fromStyle.text} flex items-center justify-center`}>
                <FromIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{fromAcc.name}</p>
              <p className="text-xs text-slate-500 tabular-nums">{formatMoney(fromAcc.balance, fromAcc.currency)} available</p>
            </div>
          </div>
        ) : (
          <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-900">—</div>
        )}
      </div>

      {/* Direction indicator */}
      <div className="flex items-center justify-center -my-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-magenta-500 to-teal-500 flex items-center justify-center text-white shadow-sm animate-in zoom-in-50 fade-in duration-300" style={{ animationDelay: '60ms' }}>
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '90ms' }}>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">To Account</label>
        <select
          value={toAccount}
          onChange={e => setToAccount(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none transition-shadow"
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

        {toAcc && toStyle && ToIcon && (
          <div className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="relative flex-shrink-0" style={{ width: 32, height: 32 }}>
              <div className={`absolute inset-0 rounded-full border-2 border-transparent ${toStyle.spin} animate-spin`} style={{ animationDuration: '2.5s' }} />
              <div className={`absolute inset-[3px] rounded-full ${toStyle.bg} ${toStyle.text} flex items-center justify-center`}>
                <ToIcon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{toAcc.name}</p>
              <p className="text-xs text-slate-500 tabular-nums">{formatMoney(toAcc.balance, toAcc.currency)} available</p>
            </div>
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-slate-700">Amount</label>
          {quickAmounts.length > 0 && (
            <div className="flex items-center gap-1.5">
              {quickAmounts.map(({ pct, value }) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmount(value > 0 ? value.toString() : '')}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 hover:bg-magenta-500/10 hover:text-magenta-600 transition-colors"
                >
                  {pct === 1 ? 'Max' : `${pct * 100}%`}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
            {fromAcc?.currency || ''}
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className={`w-full pl-14 pr-3 py-2.5 border rounded-lg text-slate-900 focus:ring-2 focus:border-transparent outline-none transition-shadow tabular-nums ${
              insufficientFunds ? 'border-red-300 focus:ring-red-400' : 'border-slate-300 focus:ring-magenta-500'
            }`}
            placeholder="0.00"
            required
          />
        </div>
        {insufficientFunds && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            Amount exceeds available balance of {formatMoney(fromAcc!.balance, fromAcc!.currency)}
          </div>
        )}
        {!insufficientFunds && showConversion && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-magenta-500/5 to-teal-500/5 border border-teal-500/20 text-xs text-slate-600 animate-in fade-in slide-in-from-top-1 duration-200">
            <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <span>
              <span className="font-semibold text-slate-900 tabular-nums">{formatMoney(parseFloat(amount) || 0, fromAcc!.currency)}</span>
              {' converts to '}
              <span className="font-semibold text-teal-700 tabular-nums">{formatMoney(convertCurrency(parseFloat(amount) || 0, fromAcc!.currency, toAcc!.currency), toAcc!.currency)}</span>
            </span>
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '150ms' }}>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none transition-shadow"
            placeholder="Optional note"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '180ms' }}>
        <button
          type="button"
          onClick={() => onTransferComplete()}
          className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={insufficientFunds}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg transition-all duration-300 bg-gradient-to-r from-magenta-500 to-teal-500 hover:from-magenta-600 hover:to-teal-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <Send className="w-4 h-4" />
          <span>Confirm Transfer</span>
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
