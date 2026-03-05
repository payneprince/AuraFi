'use client';

import React, { useState, useEffect } from 'react';
import { Settings, X, Eye, EyeOff, Lock, CreditCard, Smartphone } from 'lucide-react';
import type { Card } from '@/types';

interface CardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  onUpdateSettings: (cardId: string, settings: Partial<Card>) => void;
}

export function CardSettingsModal({ isOpen, onClose, card, onUpdateSettings }: CardSettingsModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [contactlessEnabled, setContactlessEnabled] = useState(true);
  const [digitalEnabled, setDigitalEnabled] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (card && isOpen) {
      setDailyLimit(card.dailyLimit?.toString() || '');
      setMonthlyLimit(card.monthlyLimit?.toString() || '');
      setContactlessEnabled(card.contactlessEnabled ?? true);
      setDigitalEnabled(card.digitalEnabled ?? false);
      setPin('');
      setConfirmPin('');
      setIsChangingPin(false);
      setPinError('');
    }
  }, [card, isOpen]);

  if (!isOpen || !card) return null;

  const handleSave = () => {
    if (isChangingPin) {
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        setPinError('PIN must be exactly 4 digits');
        return;
      }
      if (pin !== confirmPin) {
        setPinError('PINs do not match');
        return;
      }
    }

    const updates: Partial<Card> = {
      dailyLimit: dailyLimit ? parseFloat(dailyLimit) : undefined,
      monthlyLimit: monthlyLimit ? parseFloat(monthlyLimit) : undefined,
      contactlessEnabled,
      digitalEnabled,
    };

    if (isChangingPin && pin) {
      updates.pin = pin;
    }

    onUpdateSettings(card.id, updates);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Card Settings</h3>
              <p className="text-sm text-slate-600">Manage your card preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Card Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <CreditCard className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Card Details</span>
            </div>
            <p className="text-sm text-slate-600">
              {card.brand.toUpperCase()} •••• {card.cardNumber.slice(-4)} • {card.type}
            </p>
          </div>

          {/* PIN Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">PIN Management</h4>
              <button
                onClick={() => setIsChangingPin(!isChangingPin)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {isChangingPin ? 'Cancel' : 'Change PIN'}
              </button>
            </div>

            {isChangingPin && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New PIN</label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPin(value);
                        setPinError('');
                      }}
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 4-digit PIN"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm PIN</label>
                  <div className="relative">
                    <input
                      type={showConfirmPin ? 'text' : 'password'}
                      value={confirmPin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setConfirmPin(value);
                        setPinError('');
                      }}
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm 4-digit PIN"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500"
                    >
                      {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {pinError && (
                  <p className="text-sm text-red-600">{pinError}</p>
                )}
              </div>
            )}
          </div>

          {/* Spending Limits */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">Spending Limits</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Daily Limit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500"
                    min="0"
                    step="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Limit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5000"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">Payment Options</h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Lock className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Contactless Payments</p>
                    <p className="text-xs text-slate-600">Tap to pay with NFC</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactlessEnabled}
                    onChange={(e) => setContactlessEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Digital Wallet</p>
                    <p className="text-xs text-slate-600">Apple Pay & Google Pay</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={digitalEnabled}
                    onChange={(e) => setDigitalEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
