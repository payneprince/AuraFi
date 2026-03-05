"use client";

import { useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { auraBankCards } from '@/components/CardManager';
import TransactionList from '@/components/TransactionList';

interface WalletsSectionProps {
  walletBalance: number;
}

export default function WalletsSection({ walletBalance }: WalletsSectionProps) {
  const parseCookies = () => {
    if (typeof document === 'undefined') return {} as Record<string, string>;
    return document.cookie
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .reduce((accumulator, item) => {
        const index = item.indexOf('=');
        if (index === -1) return accumulator;
        const key = item.slice(0, index);
        const value = item.slice(index + 1);
        accumulator[key] = value;
        return accumulator;
      }, {} as Record<string, string>);
  };

  const auraBankSnapshot = useMemo(() => {
    try {
      const cookies = parseCookies();
      const encoded = cookies.aurabank_sources_snapshot;
      if (!encoded) return null;
      return JSON.parse(decodeURIComponent(encoded));
    } catch {
      return null;
    }
  }, []);

  const bankCards = useMemo(() => {
    const snapshotCards = auraBankSnapshot?.cards;
    if (Array.isArray(snapshotCards) && snapshotCards.length > 0) {
      return snapshotCards
        .filter((card: any) => String(card.status || 'active').toLowerCase() === 'active')
        .map((card: any) => ({
          id: String(card.id),
          brand: String(card.brand || 'AuraBank').toUpperCase(),
          type: String(card.type || 'Debit'),
          last4: String(card.cardNumber || '').slice(-4),
        }));
    }
    return auraBankCards.map((card) => ({
      id: String(card.id),
      brand: card.brand,
      type: card.type,
      last4: card.last4,
    }));
  }, [auraBankSnapshot]);

  const [selectedWalletCardId, setSelectedWalletCardId] = useState<string>(String(bankCards[0]?.id || ''));
  const selectedWalletCard = bankCards.find((card) => String(card.id) === selectedWalletCardId) || bankCards[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl p-6 bg-[#0B1E39] border border-white/10">
        <h3 className="text-white font-bold text-xl mb-4">Wallet Balance</h3>
        <p className="text-white text-5xl font-extrabold mb-2">${walletBalance.toFixed(2)}</p>
        <p className="text-white/75 text-base font-medium">Main AuraWallet account available for transfers and card spending.</p>
      </div>
      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold text-xl">Saved Cards</h4>
            <CreditCard className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-white/75 text-sm font-medium mt-2">Ready for one-tap payments</p>

          {bankCards.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedWalletCard && (
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-white text-sm font-semibold">
                    {selectedWalletCard.brand} {String(selectedWalletCard.type).toUpperCase()} ••••{selectedWalletCard.last4}
                  </p>
                </div>
              )}

              {bankCards.length > 1 && (
                <>
                  <label className="text-white/80 text-xs font-medium">Choose another card</label>
                  <select
                    value={selectedWalletCardId}
                    onChange={(event) => setSelectedWalletCardId(event.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                  >
                    <option value={selectedWalletCardId} className="text-black">
                      Current: {selectedWalletCard?.brand} {String(selectedWalletCard?.type || '').toUpperCase()} ••••{selectedWalletCard?.last4}
                    </option>
                    {bankCards
                      .filter((card) => String(card.id) !== selectedWalletCardId)
                      .map((card) => (
                        <option key={card.id} value={String(card.id)} className="text-black">
                          {card.brand} {String(card.type).toUpperCase()} ••••{card.last4}
                        </option>
                      ))}
                  </select>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="lg:col-span-3 rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
        <TransactionList />
      </div>
    </div>
  );
}
