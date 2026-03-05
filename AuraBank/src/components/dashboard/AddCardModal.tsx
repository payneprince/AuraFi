'use client';

import React, { useState } from 'react';
import { CreditCard, X, Plus } from 'lucide-react';
import type { Card } from '@/types';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (cardData: Omit<Card, 'id'>) => void;
  accounts: { id: string; name: string; type: string }[];
}

export function AddCardModal({ isOpen, onClose, onAddCard, accounts }: AddCardModalProps) {
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'amex'>('visa');

  if (!isOpen) return null;

  const availableAccounts = accounts.filter(acc => acc.type === (cardType === 'credit' ? 'credit' : 'checking') || acc.type === 'savings');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) return;

    // Generate new card data
    const newCard: Omit<Card, 'id'> = {
      accountId: selectedAccount,
      cardNumber: generateCardNumber(cardBrand),
      cardHolder: 'DEMO USER',
      expiryDate: generateExpiryDate(),
      cvv: generateCVV(),
      type: cardType,
      status: 'active',
      brand: cardBrand,
      pin: '1234', // Default PIN
      dailyLimit: cardType === 'debit' ? 500 : 1000,
      monthlyLimit: cardType === 'debit' ? 5000 : 10000,
      contactlessEnabled: true,
      digitalEnabled: false
    };

    onAddCard(newCard);
    onClose();

    // Reset form
    setCardType('debit');
    setSelectedAccount('');
    setCardBrand('visa');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Add New Card</h3>
              <p className="text-sm text-slate-600">Request a new debit or credit card</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Card Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Card Type</label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setCardType('debit')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  cardType === 'debit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Debit Card
              </button>
              <button
                type="button"
                onClick={() => setCardType('credit')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  cardType === 'credit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Credit Card
              </button>
            </div>
          </div>

          {/* Linked Account */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Linked Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select an account</option>
              {availableAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>

          {/* Card Brand */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Card Brand</label>
            <div className="grid grid-cols-3 gap-3">
              {(['visa', 'mastercard', 'amex'] as const).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setCardBrand(brand)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors capitalize ${
                    cardBrand === brand
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <CreditCard className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Card Preview</span>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-4 text-white">
              <div className="flex justify-between items-start mb-8">
                <span className="text-lg font-bold capitalize">{cardBrand}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  cardType === 'debit' ? 'bg-blue-500/20' : 'bg-red-500/20'
                }`}>
                  {cardType.toUpperCase()}
                </span>
              </div>
              <div className="text-xl font-mono tracking-wider mb-4">
                **** **** **** ****
              </div>
              <div className="flex justify-between text-sm">
                <span>DEMO USER</span>
                <span>**/**</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedAccount}
            className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request New Card
          </button>
        </form>
      </div>
    </div>
  );
}

// Helper functions
function generateCardNumber(brand: string): string {
  const prefixes = {
    visa: '4',
    mastercard: '5',
    amex: '3'
  };

  const prefix = prefixes[brand as keyof typeof prefixes];
  const length = brand === 'amex' ? 15 : 16;
  let number = prefix;

  for (let i = 0; i < length - 1; i++) {
    number += Math.floor(Math.random() * 10);
  }

  return number;
}

function generateExpiryDate(): string {
  const now = new Date();
  const future = new Date(now.getFullYear() + 3, now.getMonth(), 1);
  return `${String(future.getMonth() + 1).padStart(2, '0')}/${String(future.getFullYear()).slice(-2)}`;
}

function generateCVV(): string {
  return String(Math.floor(Math.random() * 900) + 100);
}
