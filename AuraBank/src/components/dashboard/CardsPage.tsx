'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Unlock, Settings, Wallet, X, Plus, Wifi, RefreshCw } from 'lucide-react';
import { CardSettingsModal } from './CardSettingsModal';
import { CardReplacementModal } from './CardReplacementModal';
import { AddCardModal } from './AddCardModal';
import { VirtualCardModal } from './VirtualCardModal';
import { getCategoryStyle } from './TransactionsPage';
import type { Card } from '@/types';

const formatCardNumber = (number: string): string => {
  return number.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
};

const maskCardNumber = (number: string): string => {
  const formatted = formatCardNumber(number);
  return formatted.replace(/\d(?=\d{4})/g, '*');
};

export default function CardsPage() {
  const { cards, accounts, transactions, updateCards, addNotification, addCard, replaceCard } = useAuth();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showLostCardModal, setShowLostCardModal] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const toggleFlip = (cardId: string) =>
    setFlippedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  const [hiddenInitialCardIds, setHiddenInitialCardIds] = useState<string[]>([]);
  const [hasInitializedVisibleCards, setHasInitializedVisibleCards] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showVirtualCardModal, setShowVirtualCardModal] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState<any>(null);

  useEffect(() => {
    if (hasInitializedVisibleCards || cards.length === 0) return;

    const preExistingExtraCardIds = cards
      .filter(card => card.isVirtual || card.brand === 'amex')
      .map(card => card.id);

    setHiddenInitialCardIds(preExistingExtraCardIds);
    setHasInitializedVisibleCards(true);
  }, [cards, hasInitializedVisibleCards]);

  const displayCards = cards.filter(card => !hiddenInitialCardIds.includes(card.id));

  // Wrapper matches the AuthContext replaceCard signature
  const handleReplaceCard = (cardId: string, newCard: Card) => {
    replaceCard(cardId, newCard);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCardGradient = (brand: string, isVirtual?: boolean) => {
    if (isVirtual) {
      return 'from-purple-300 to-purple-800';
    }
    switch (brand) {
      case 'visa':
        return 'from-blue-400 to-blue-800';
      case 'mastercard':
        return 'from-zinc-800 to-black';
      case 'amex':
        return 'from-emerald-700 to-emerald-950';
      default:
        return 'from-slate-600 to-slate-800';
    }
  };

  const renderBrandWatermark = (brand: string) => {
    // Fully inside the card bounds so nothing gets clipped.
    const base = 'absolute bottom-4 right-4 sm:bottom-5 sm:right-5 w-24 h-24 sm:w-28 sm:h-28 group-hover:scale-105 transition-all duration-500 pointer-events-none origin-bottom-right';
    if (brand === 'visa') {
      return (
        <div className="absolute bottom-1 right-3 sm:bottom-2 sm:right-4 w-32 h-32 sm:w-36 sm:h-36 group-hover:scale-105 transition-all duration-500 pointer-events-none origin-bottom-right opacity-[0.24] group-hover:opacity-[0.4] [filter:brightness(0)_invert(1)]">
          <img src="/visa.svg" alt="" className="w-full h-full object-contain object-bottom" />
        </div>
      );
    }
    if (brand === 'mastercard') {
      return (
        <div className={`${base} opacity-[0.45] group-hover:opacity-[0.65] [mix-blend-mode:screen]`}>
          <img src="/mastercard.svg" alt="" className="w-full h-full object-contain" />
        </div>
      );
    }
    return (
      <div className={`${base} opacity-[0.24] group-hover:opacity-[0.4] flex items-end justify-end`}>
        <span className="text-4xl italic font-black tracking-widest text-white">AMEX</span>
      </div>
    );
  };

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.balance : 0;
  };

  const getCardTransactions = (accountId: string) => {
    return transactions
      .filter(tx => tx.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  };

  const handleLockCard = (cardId: string, lock: boolean) => {
    const updatedCards = cards.map(card =>
      card.id === cardId ? { ...card, status: (lock ? 'blocked' : 'active') as 'active' | 'blocked' | 'expired' } : card
    );
    updateCards(updatedCards);

    addNotification({
      id: `notif-${Date.now()}`,
      title: lock ? 'Card Locked' : 'Card Unlocked',
      message: `Your ${lock ? 'card has been locked' : 'card is now active'}.`,
      type: lock ? 'warning' : 'success',
      date: new Date().toISOString(),
      read: false,
    });
  };

  const handleReportLostCard = (cardId: string) => {
    handleLockCard(cardId, true);
    setShowLostCardModal(null);

    addNotification({
      id: `notif-${Date.now()}`,
      title: 'Card Reported Lost',
      message: 'A replacement card will be issued shortly.',
      type: 'info',
      date: new Date().toISOString(),
      read: false,
    });
  };

  const handleCardSettingsUpdate = (cardId: string, settings: Partial<Card>) => {
    const updatedCards = cards.map(card =>
      card.id === cardId ? { ...card, ...settings } : card
    );
    updateCards(updatedCards);
  };

  const handleOpenCardSettings = (card: Card) => {
    setSelectedCardForModal(card);
    setShowSettingsModal(true);
  };

  const handleOpenReplacement = (card: Card) => {
    setSelectedCardForModal(card);
    setShowReplacementModal(true);
  };

  const handleAddCard = (cardData: any) => {
    addCard(cardData);
    setShowAddCardModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => setShowVirtualCardModal(true)}
            className="px-4 py-2.5 bg-white border border-magenta-500/30 text-magenta-600 font-medium rounded-lg hover:bg-magenta-500/5 hover:border-magenta-500/50 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center space-x-2 shadow-sm"
          >
            <Plus className="w-[18px] h-[18px]" />
            <span>Virtual Card</span>
          </button>
          <button
            onClick={() => setShowAddCardModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-magenta-600 to-magenta-500 text-white font-medium rounded-lg hover:brightness-110 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center space-x-2 shadow-md shadow-magenta-500/25"
          >
            <Plus className="w-[18px] h-[18px]" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {displayCards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 px-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="relative w-20 h-14 mb-5">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-magenta-500 via-magenta-400 to-mint-400 shadow-lg rotate-[-8deg]" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-navy-800 via-navy-700 to-slate-700 shadow-lg rotate-[6deg] flex items-center justify-center">
              <Wifi className="w-4 h-4 rotate-90 text-white/60" strokeWidth={2.25} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1.5">No cards yet</h3>
          <p className="text-sm text-slate-500 max-w-xs mb-6">
            Get a virtual card for online spending or order a physical card to start using your account anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowVirtualCardModal(true)}
              className="px-4 py-2.5 bg-white border border-magenta-500/30 text-magenta-600 font-medium rounded-lg hover:bg-magenta-500/5 hover:border-magenta-500/50 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-[18px] h-[18px]" />
              <span>Create Virtual Card</span>
            </button>
            <button
              onClick={() => setShowAddCardModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-magenta-600 to-magenta-500 text-white font-medium rounded-lg hover:brightness-110 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-md shadow-magenta-500/25"
            >
              <Plus className="w-[18px] h-[18px]" />
              <span>Add a Card</span>
            </button>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayCards.map((card, idx) => (
          <div
            key={card.id}
            className="space-y-4 group animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
            style={{ animationDelay: `${idx * 70}ms` }}
          >
            {/* Card Display — realistic 3D flip */}
            <div
              className="relative [perspective:1800px] cursor-pointer"
              onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
            >
              <div
                className={`relative aspect-[1.586/1] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.45,0.05,0.15,1)] [transform-style:preserve-3d] group-hover:-translate-y-1 ${
                  flippedCards[card.id] ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                {/* ───────── Front face ───────── */}
                <div className={`absolute inset-0 [backface-visibility:hidden] overflow-hidden bg-gradient-to-br ${getCardGradient(card.brand, card.isVirtual)} rounded-2xl text-white shadow-2xl transition-shadow duration-300 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.55)]`}>
                  {/* engraved diagonal texture */}
                  <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(125deg, #fff 0px, #fff 1px, transparent 1px, transparent 11px)' }} />
                  {/* soft gloss highlight */}
                  <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-white/15 blur-3xl pointer-events-none" />
                  {/* hover shine sweep */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                  {/* Network brand watermark — big, blended-in illustration like the Overview tab's brand marks */}
                  {renderBrandWatermark(card.brand)}

                  <div className="relative h-full flex flex-col justify-between p-6 sm:p-7">
                    {/* Top row — issuer + contactless + status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/25 shadow-sm">
                          <img src="/dblogo.jpg" alt="AuraBank" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold tracking-[0.3em] text-white/55 uppercase">
                            {card.isVirtual ? 'Virtual · ' : ''}{card.type}
                          </p>
                          <p className="text-lg font-bold tracking-wide leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                            AuraBank
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Wifi className="w-7 h-7 rotate-90 text-white/55" strokeWidth={2.25} />
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border ${
                          card.status === 'active' ? 'bg-green-500/10 border-green-200/30 text-green-50' :
                          card.status === 'blocked' ? 'bg-red-500/10 border-red-200/30 text-red-50' :
                          'bg-yellow-500/10 border-yellow-200/30 text-yellow-50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            card.status === 'active' ? 'bg-green-300' :
                            card.status === 'blocked' ? 'bg-red-300' : 'bg-yellow-300'
                          }`} />
                          {card.status}
                        </span>
                      </div>
                    </div>

                    {/* Chip + card number */}
                    <div className="space-y-4">
                      {/* EMV chip — ISO/IEC 7816 6-contact layout */}
                      <div
                        className="relative w-[52px] h-[40px] rounded-[5px] overflow-hidden transition-transform duration-300 group-hover:scale-105 flex-shrink-0"
                        style={{
                          background: 'linear-gradient(150deg,#f7e98e 0%,#c8920c 22%,#f0d060 42%,#b07808 60%,#e4c030 78%,#a86e04 100%)',
                          boxShadow: 'inset 0 1.5px 2px rgba(255,245,180,0.75), inset 0 -2px 4px rgba(90,50,0,0.55), 0 3px 8px rgba(0,0,0,0.45)',
                        }}
                      >
                        {/* diagonal metallic sheen */}
                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(140deg,rgba(255,255,255,0.28) 0%,transparent 48%,rgba(0,0,0,0.12) 100%)' }} />
                        {/* horizontal centre groove */}
                        <div className="absolute left-[4px] right-[4px] top-1/2 -translate-y-px h-px" style={{ background: 'rgba(100,55,0,0.28)' }} />
                        {/* vertical column grooves */}
                        <div className="absolute top-[4px] bottom-[4px] w-px" style={{ left: 'calc(33.3% - 0.5px)', background: 'rgba(100,55,0,0.22)' }} />
                        <div className="absolute top-[4px] bottom-[4px] w-px" style={{ left: 'calc(66.6% - 0.5px)', background: 'rgba(100,55,0,0.22)' }} />
                        {/* 6 contact pads — 2 rows × 3 cols */}
                        <div className="absolute inset-[5px] grid grid-cols-3 grid-rows-2 gap-[3px]">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div
                              key={i}
                              className="rounded-[2px]"
                              style={{
                                background: 'linear-gradient(150deg,rgba(255,235,110,0.4) 0%,rgba(160,100,8,0.38) 100%)',
                                border: '0.75px solid rgba(120,72,4,0.32)',
                                boxShadow: 'inset 0 1px 0 rgba(255,248,190,0.35), 0 1px 1.5px rgba(0,0,0,0.18)',
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <p
                        className="text-[1.4rem] sm:text-[1.6rem] font-mono tracking-[0.16em]"
                        style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3), 0 -1px 0 rgba(255,255,255,0.12)' }}
                      >
                        {maskCardNumber(card.cardNumber)}
                      </p>
                    </div>

                    {/* Bottom row — holder / expiry */}
                    <div className="relative flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-[0.25em] text-white/45 mb-1">Card Holder</p>
                        <p className="font-semibold tracking-wide text-sm truncate" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}>
                          {card.cardHolder}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-[8px] uppercase tracking-[0.25em] text-white/45 mb-1">Valid Thru</p>
                        <p className="font-semibold tracking-wide text-sm" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}>
                          {card.expiryDate}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFlip(card.id); }}
                        className="flex-shrink-0 self-end translate-y-2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all duration-300 hover:rotate-180"
                        title="Flip card"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ───────── Back face ───────── */}
                <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden bg-gradient-to-br ${getCardGradient(card.brand, card.isVirtual)} rounded-2xl text-white shadow-2xl`}>
                  {/* diagonal texture */}
                  <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(125deg, #fff 0px, #fff 1px, transparent 1px, transparent 11px)' }} />
                  {/* top-right gloss */}
                  <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

                  {/* Top bar — issuer + flip button */}
                  <div className="relative flex items-center justify-between px-6 sm:px-7 pt-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-white/20 opacity-80">
                        <img src="/dblogo.jpg" alt="AuraBank" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <span className="text-sm font-bold tracking-wide opacity-50" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>AuraBank</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFlip(card.id); }}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all duration-300 hover:rotate-180"
                      title="Flip card"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Magnetic stripe */}
                  <div className="relative mt-4 h-12 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-slate-950/90" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-white/[0.07] to-white/[0.03]" />
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white/[0.05] to-transparent" />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/[0.05] to-transparent" />
                  </div>

                  {/* Signature panel + CVV */}
                  <div className="px-6 sm:px-7 mt-4">
                    <p className="text-[8px] uppercase tracking-[0.25em] text-white/35 mb-1.5">Authorized Signature</p>
                    <div className="flex items-stretch gap-3">
                      <div className="flex-1 relative rounded-sm overflow-hidden" style={{ height: 42 }}>
                        <div className="absolute inset-0 bg-white/95" />
                        <div className="absolute inset-0 opacity-75" style={{ backgroundImage: 'repeating-linear-gradient(125deg, #d4d4d4 0 1.5px, transparent 1.5px 8px)' }} />
                        <div className="relative h-full flex items-center px-3">
                          <p className="italic text-slate-500 text-sm truncate">{card.cardHolder}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 bg-white rounded-sm shadow-sm flex flex-col items-center justify-center px-3 min-w-[64px]" style={{ height: 42 }}>
                        <p className="text-[7px] uppercase tracking-[0.2em] text-slate-400 leading-none">CVV</p>
                        <p className="font-mono text-slate-900 font-bold tracking-[0.3em] text-base leading-tight mt-0.5">{card.cvv}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row — hologram + card info */}
                  <div className="absolute bottom-5 left-6 right-6 sm:left-7 sm:right-7 flex items-end justify-between gap-3">
                    <div className="flex items-end gap-3">
                      {/* hologram sticker */}
                      <div
                        className="relative flex-shrink-0 w-10 h-7 rounded-[4px] overflow-hidden shadow-md opacity-80"
                        style={{ background: 'conic-gradient(from 0deg,#f0abfc,#818cf8,#67e8f9,#86efac,#fde68a,#fca5a5,#f0abfc)' }}
                      >
                        <div className="absolute inset-0 bg-white/15" />
                        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.35) 0 1px,transparent 1px 5px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.35) 0 1px,transparent 1px 5px)' }} />
                      </div>
                      <div className="min-w-0 mb-0.5">
                        <p className="text-[9px] text-white/40 font-mono tracking-wider">{maskCardNumber(card.cardNumber)}</p>
                        <p className="text-[8px] text-white/28 mt-0.5 leading-snug">Lost or stolen? Contact support 24/7</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Controls (only when selected) */}
            {selectedCard === card.id && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-magenta-500/10 text-magenta-600 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Card Controls</h3>
                </div>

                <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/70 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Linked Account Balance</p>
                    <p className="text-2xl font-bold text-slate-900 truncate">
                      {formatCurrency(getAccountBalance(card.accountId))}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200/70 flex items-center justify-center text-slate-400 flex-shrink-0 ml-3">
                    <Wallet className="w-[18px] h-[18px]" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleLockCard(card.id, card.status !== 'blocked')}
                    className={`group/tile flex flex-col items-center gap-2 px-2 py-4 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                      card.status === 'blocked'
                        ? 'border-green-200 bg-green-50/60 hover:bg-green-100/70'
                        : 'border-red-200 bg-red-50/60 hover:bg-red-100/70'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover/tile:scale-110 ${
                      card.status === 'blocked' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {card.status === 'blocked' ? <Unlock className="w-[18px] h-[18px]" /> : <Lock className="w-[18px] h-[18px]" />}
                    </div>
                    <span className={`text-xs font-medium ${card.status === 'blocked' ? 'text-green-700' : 'text-red-700'}`}>
                      {card.status === 'blocked' ? 'Unlock Card' : 'Lock Card'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleOpenCardSettings(card)}
                    className="group/tile flex flex-col items-center gap-2 px-2 py-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200/80 text-slate-600 flex items-center justify-center transition-transform duration-300 group-hover/tile:scale-110 group-hover/tile:rotate-45">
                      <Settings className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-xs font-medium text-slate-700">Settings</span>
                  </button>

                  <button
                    onClick={() => handleOpenReplacement(card)}
                    className="group/tile flex flex-col items-center gap-2 px-2 py-4 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center transition-transform duration-300 group-hover/tile:scale-110">
                      <X className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-xs font-medium text-red-700">Lost Card</span>
                  </button>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-slate-900 mb-3">Recent Transactions</h4>
                  <div className="space-y-2">
                    {getCardTransactions(card.accountId).length > 0 ? (
                      getCardTransactions(card.accountId).map((tx, txIdx) => {
                        const isCredit = tx.type === 'credit';
                        const ring = isCredit
                          ? { spin: 'border-t-green-500/80 border-r-green-500/30', bg: 'bg-green-100', text: 'text-green-600' }
                          : { spin: 'border-t-red-500/80 border-r-red-500/30', bg: 'bg-red-100', text: 'text-red-600' };
                        const { Icon: CategoryIcon } = getCategoryStyle(tx.category);
                        return (
                          <div
                            key={tx.id}
                            className="group/tx flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg transition-colors duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                            style={{ animationDelay: `${Math.min(txIdx, 8) * 40}ms` }}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
                                <div className={`absolute inset-0 rounded-full border-2 border-transparent ${ring.spin} group-hover/tx:animate-spin`} style={{ animationDuration: '2.5s' }} />
                                <div className={`absolute inset-[3px] rounded-full ${ring.bg} ${ring.text} flex items-center justify-center`}>
                                  <CategoryIcon className="w-4 h-4" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{tx.merchant || tx.description}</p>
                                <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <p className={`font-semibold flex-shrink-0 ml-3 ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                              {isCredit ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-2">No recent transactions</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Lost Card Modal */}
      {showLostCardModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowLostCardModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Report Lost Card?</h3>
              <p className="text-slate-600 mb-6">
                This will immediately block your card and prevent further transactions.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLostCardModal(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReportLostCard(showLostCardModal)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Settings Modal */}
      <CardSettingsModal
        isOpen={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          setSelectedCardForModal(null);
        }}
        card={selectedCardForModal}
        onUpdateSettings={handleCardSettingsUpdate}
      />

      {/* Card Replacement Modal */}
      <CardReplacementModal
        isOpen={showReplacementModal}
        onClose={() => {
          setShowReplacementModal(false);
          setSelectedCardForModal(null);
        }}
        card={selectedCardForModal}
        onReplaceCard={handleReplaceCard}
      />

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onAddCard={handleAddCard}
        accounts={accounts}
      />

      {/* Virtual Card Modal */}
      <VirtualCardModal
        isOpen={showVirtualCardModal}
        onClose={() => setShowVirtualCardModal(false)}
        onCreateVirtualCard={addCard}
        accounts={accounts}
      />
    </div>
  );
}
