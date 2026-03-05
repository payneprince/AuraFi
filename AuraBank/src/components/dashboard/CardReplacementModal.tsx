'use client';

import React, { useState } from 'react';
import { RefreshCw, X, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import type { Card } from '@/types';

interface CardReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  onReplaceCard: (cardId: string, newCard: Card) => void;
}

const replacementReasons = [
  { value: 'lost', label: 'Card Lost', description: 'Card has been misplaced or lost' },
  { value: 'stolen', label: 'Card Stolen', description: 'Card has been stolen or compromised' },
  { value: 'damaged', label: 'Card Damaged', description: 'Card is physically damaged' },
  { value: 'upgrade', label: 'Upgrade Request', description: 'Request a newer card version' },
  { value: 'expired', label: 'Near Expiry', description: 'Card is about to expire' },
  { value: 'other', label: 'Other', description: 'Other reason not listed above' }
];

export function CardReplacementModal({ isOpen, onClose, card, onReplaceCard }: CardReplacementModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen || !card) return null;

  const handleReplace = () => {
    if (!selectedReason || !card) return;

    const reason = selectedReason === 'other' ? customReason : selectedReason;
    
    // Create a new card object with updated info
    const newCard: Card = {
      ...card,
      id: `${card.id}-replaced-${Date.now()}`,
      status: 'active',
    };
    
    onReplaceCard(card.id, newCard);
    onClose();
  };

  const getTimelineMessage = () => {
    switch (selectedReason) {
      case 'stolen':
        return 'Immediate blocking with replacement card in 1-2 business days';
      case 'lost':
        return 'Card blocked immediately, replacement in 3-5 business days';
      case 'damaged':
      case 'upgrade':
        return 'Replacement card issued within 3-5 business days';
      case 'expired':
        return 'New card will arrive before current expiry date';
      default:
        return 'Replacement timeline: 3-5 business days';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Replace Card</h3>
              <p className="text-sm text-slate-600">Request a replacement for your card</p>
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
              <AlertTriangle className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Card to Replace</span>
            </div>
            <p className="text-sm text-slate-600">
              {card.brand.toUpperCase()} •••• {card.cardNumber.slice(-4)} • {card.type}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Expires: {card.expiryDate} • Status: {card.status}
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Important Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your current card will be blocked immediately upon replacement request.
                  A new card will be issued and mailed to your registered address.
                </p>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Reason for Replacement *
            </label>
            <div className="space-y-2">
              {replacementReasons.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{reason.label}</p>
                    <p className="text-xs text-slate-600">{reason.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {selectedReason === 'other' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Please specify the reason
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe the reason for replacement..."
                />
              </div>
            )}
          </div>

          {/* Timeline */}
          {selectedReason && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Expected Timeline</h4>
                  <p className="text-sm text-blue-700 mt-1">{getTimelineMessage()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation */}
          {isConfirming && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-900">Confirm Replacement</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Are you sure you want to replace this card? This action cannot be undone.
                  </p>
                  <div className="flex space-x-3 mt-3">
                    <button
                      onClick={() => setIsConfirming(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReplace}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Confirm Replacement
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isConfirming && (
          <div className="flex space-x-3 p-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsConfirming(true)}
              disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim())}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request Replacement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
