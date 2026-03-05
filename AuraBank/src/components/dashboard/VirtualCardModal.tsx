'use client';

import React, { useState } from 'react';
import { X, CreditCard, Clock, Lock, Globe, Plus } from 'lucide-react';
import type { Account, Card } from '@/types';

interface VirtualCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateVirtualCard: (cardData: Card) => void;
  accounts: Account[];
}

export function VirtualCardModal({ isOpen, onClose, onCreateVirtualCard, accounts }: VirtualCardModalProps) {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [spendingLimit, setSpendingLimit] = useState('');
  const [expiryHours, setExpiryHours] = useState('24');
  const [singleUse, setSingleUse] = useState(false);
  const [merchantLock, setMerchantLock] = useState('');
  const [cardName, setCardName] = useState('');
  const [mobileWallet, setMobileWallet] = useState<'apple' | 'google' | 'samsung' | ''>('');
  const [enhancedSecurity, setEnhancedSecurity] = useState(false);

  if (!isOpen) return null;

  const availableAccounts = accounts.filter(acc => acc.type === 'checking' || acc.type === 'savings');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount || !spendingLimit) return;

    // Generate virtual card data
    const virtualCardData = {
      accountId: selectedAccount,
      cardNumber: generateVirtualCardNumber(),
      cardHolder: 'DEMO USER',
      expiryDate: generateExpiryDate(parseInt(expiryHours)),
      cvv: generateCVV(),
      type: 'debit' as const,
      status: 'active' as const,
      brand: 'visa' as const,
      pin: '1234',
      dailyLimit: parseFloat(spendingLimit),
      monthlyLimit: parseFloat(spendingLimit),
      contactlessEnabled: false,
      digitalEnabled: true,
      isVirtual: true,
      singleUse,
      merchantLock: merchantLock.trim() || undefined,
      mobileWallet: mobileWallet || undefined,
      enhancedSecurity,
      name: cardName.trim() || `Virtual Card ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + parseInt(expiryHours) * 60 * 60 * 1000).toISOString()
    };

    onCreateVirtualCard(virtualCardData);
    onClose();

    // Reset form
    setSelectedAccount('');
    setSpendingLimit('');
    setExpiryHours('24');
    setSingleUse(false);
    setMerchantLock('');
    setCardName('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Create Virtual Card</h3>
              <p className="text-sm text-slate-600">Secure online payments with temporary cards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Linked Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            >
              <option value="">Select an account</option>
              {availableAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatCurrency(account.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Card Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Card Name (Optional)</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="e.g., Amazon Shopping"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Spending Limit */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Spending Limit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                value={spendingLimit}
                onChange={(e) => setSpendingLimit(e.target.value)}
                placeholder="500.00"
                min="1"
                step="0.01"
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
          </div>

          {/* Expiry Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Card Expiry</label>
            <select
              value={expiryHours}
              onChange={(e) => setExpiryHours(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="1">1 Hour</option>
              <option value="24">24 Hours</option>
              <option value="168">1 Week</option>
              <option value="720">30 Days</option>
            </select>
          </div>

          {/* Single Use Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Single Use Card</p>
                <p className="text-xs text-slate-600">Card becomes invalid after first transaction</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={singleUse}
                onChange={(e) => setSingleUse(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Merchant Lock */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Merchant Lock (Optional)</span>
              </div>
            </label>
            <input
              type="text"
              value={merchantLock}
              onChange={(e) => setMerchantLock(e.target.value)}
              placeholder="e.g., amazon.com, netflix.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-slate-500 mt-1">Restrict card usage to specific merchants</p>
          </div>

          {/* Mobile Wallet Integration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Wallet (Optional)</label>
            <div className="grid grid-cols-3 gap-3">
              {(['apple', 'google', 'samsung'] as const).map((wallet) => (
                <button
                  key={wallet}
                  type="button"
                  onClick={() => setMobileWallet(mobileWallet === wallet ? '' : wallet)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors capitalize ${
                    mobileWallet === wallet
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {wallet}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">Add card to your mobile wallet for easy payments</p>
          </div>

          {/* Enhanced Security Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Enhanced Security</p>
                <p className="text-xs text-slate-600">Enable additional fraud protection features</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enhancedSecurity}
                onChange={(e) => setEnhancedSecurity(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <CreditCard className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Virtual Card Preview</span>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-4 text-white">
              <div className="flex justify-between items-start mb-8">
                <span className="text-lg font-bold">VIRTUAL</span>
                <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/20">
                  VIRTUAL
                </span>
              </div>
              <div className="text-xl font-mono tracking-wider mb-4">
                **** **** **** ****
              </div>
              <div className="flex justify-between text-sm">
                <span>DEMO USER</span>
                <span>**/**</span>
              </div>
              {cardName && (
                <div className="mt-2 text-xs opacity-80">
                  {cardName}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedAccount || !spendingLimit}
            className="w-full bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Virtual Card</span>
          </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function generateVirtualCardNumber(): string {
  const prefix = '4'; // Visa prefix
  let number = prefix;

  for (let i = 0; i < 15; i++) {
    number += Math.floor(Math.random() * 10);
  }

  return number;
}

function generateExpiryDate(hoursFromNow: number): string {
  const future = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  return `${String(future.getMonth() + 1).padStart(2, '0')}/${String(future.getFullYear()).slice(-2)}`;
}

function generateCVV(): string {
  return String(Math.floor(Math.random() * 900) + 100);
}
