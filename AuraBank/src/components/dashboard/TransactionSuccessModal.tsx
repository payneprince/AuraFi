'use client';

import React from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { Currency } from '@/types';

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    fromAccount: string;
    toAccount: string;
    amount: number;
    convertedAmount?: number;
    fromCurrency: Currency;
    toCurrency: Currency;
    description?: string;
  } | null;
}

export function TransactionSuccessModal({ isOpen, onClose, transaction }: TransactionSuccessModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Transfer Successful</h3>
              <p className="text-sm text-slate-600">Your money has been transferred</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="p-6 space-y-4">
          {/* From Account */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">From</p>
              <p className="font-semibold text-slate-900">{transaction.fromAccount}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Amount</p>
              <p className="font-semibold text-slate-900">
                -{formatCurrency(transaction.amount, transaction.fromCurrency)}
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-green-600" />
            </div>
          </div>

          {/* To Account */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">To</p>
              <p className="font-semibold text-slate-900">{transaction.toAccount}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Received</p>
              <p className="font-semibold text-slate-900">
                +{formatCurrency(
                  transaction.convertedAmount || transaction.amount,
                  transaction.toCurrency
                )}
              </p>
            </div>
          </div>

          {/* Description */}
          {transaction.description && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">Description</p>
              <p className="text-slate-900">{transaction.description}</p>
            </div>
          )}

          {/* Currency Conversion Note */}
          {transaction.fromCurrency !== transaction.toCurrency && transaction.convertedAmount && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-600">
                Exchange rate applied: {formatCurrency(transaction.amount, transaction.fromCurrency)} = {formatCurrency(transaction.convertedAmount, transaction.toCurrency)}
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
