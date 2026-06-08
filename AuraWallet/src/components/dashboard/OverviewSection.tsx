import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Sparkles, Wallet, PlusCircle, HandCoins, FileText, ArrowUpRight, ArrowDownLeft, Smartphone, Link2, Send } from 'lucide-react';
import TransactionList, { getWalletTxStyle } from '@/components/TransactionList';
import TransferForm from '@/components/TransferForm';
import { auraBankCards } from '@/components/CardManager';
import MobileAppShowcase from '@/components/MobileAppShowcase';
import InterAppTransfer from './InterAppTransfer';
import WalletModal from '@/components/WalletModal';
// @ts-ignore
import { walletData, bankData } from '@/lib/shared/mock-data';
import { appendWalletLedgerEvent, getActiveWalletUserId, persistWalletStateForUser } from '@/lib/wallet-state';

interface OverviewSectionProps {
  walletBalance: number;
  insight: string;
  onTransferComplete: () => void;
}

export default function OverviewSection({ walletBalance, insight, onTransferComplete }: OverviewSectionProps) {
  const [auraBankSnapshot, setAuraBankSnapshot] = useState<any | null>(null);

  const makeUniqueId = (prefix: string, primary: unknown, secondary: unknown, index: number) => {
    const rawPrimary = String(primary ?? '').trim();
    const rawSecondary = String(secondary ?? '').trim();
    const base = rawPrimary || rawSecondary || `${prefix}`;
    return `${prefix}-${base}-${index}`;
  };

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

  const fallbackAccounts = useMemo(
    () => (bankData?.accounts || []).map((account: any, index: number) => ({
      id: makeUniqueId('fallback-account', account?.id, account?.accountNumber, index),
      name: String(account.type || 'Account').toUpperCase(),
      type: account.type,
      balance: Number(account.balance || 0),
      availableBalance: Number(account.balance || 0),
      accountNumber: String(account.accountNumber || ''),
      currency: 'USD',
    })),
    [],
  );

  useEffect(() => {
    try {
      const cookies = parseCookies();
      const encoded = cookies.aurabank_sources_snapshot;
      if (!encoded) {
        setAuraBankSnapshot(null);
        return;
      }
      setAuraBankSnapshot(JSON.parse(decodeURIComponent(encoded)));
    } catch {
      setAuraBankSnapshot(null);
    }
  }, []);

  const bankAccounts = useMemo(() => {
    const snapshotAccounts = auraBankSnapshot?.accounts;
    if (Array.isArray(snapshotAccounts) && snapshotAccounts.length > 0) {
      return snapshotAccounts.map((account: any, index: number) => ({
        id: makeUniqueId('snapshot-account', account?.id, account?.accountNumber, index),
        name: String(account?.name ?? account?.type ?? 'Account').toUpperCase(),
        type: String(account?.type ?? 'Account'),
        balance: Number(account?.balance ?? 0),
        availableBalance: Number(account?.availableBalance ?? account?.balance ?? 0),
        accountNumber: String(account?.accountNumber ?? ''),
        currency: String(account?.currency ?? 'USD'),
      }));
    }
    return fallbackAccounts;
  }, [auraBankSnapshot, fallbackAccounts]);

  const bankCards = useMemo(() => {
    const snapshotCards = auraBankSnapshot?.cards;
    if (Array.isArray(snapshotCards) && snapshotCards.length > 0) {
      return snapshotCards
        .filter((card: any) => String(card.status || 'active').toLowerCase() === 'active')
        .map((card: any, index: number) => ({
          id: makeUniqueId('snapshot-card', card?.id, card?.cardNumber, index),
          brand: String(card?.brand || 'AuraBank').toUpperCase(),
          type: String(card?.type || 'Debit'),
          last4: String(card?.last4 ?? String(card?.cardNumber || '').slice(-4)),
        }));
    }
    return auraBankCards.map((card, index) => ({
      id: makeUniqueId('fallback-card', card?.id, card?.last4, index),
      brand: card.brand,
      type: card.type,
      last4: card.last4,
    }));
  }, [auraBankSnapshot]);

  const fundSources: Array<{ id: 'bank' | 'card' | 'mobile'; label: string; logo?: string; icon?: typeof Smartphone; ring: string; glow: string }> = [
    { id: 'bank', label: 'AuraBank', logo: '/app-logos/bank.jpg', ring: 'ring-indigo-400/40', glow: 'bg-indigo-500/30' },
    { id: 'card', label: 'Bank Card', logo: '/app-logos/bank.jpg', ring: 'ring-teal-400/40', glow: 'bg-teal-500/30' },
    { id: 'mobile', label: 'Mobile Money', logo: '/app-logos/mobilemoney.jpg', ring: 'ring-emerald-400/40', glow: 'bg-emerald-500/30' },
  ];

  const mobileNetworks = [
    { id: 'mtn', name: 'MTN Mobile Money', eta: 'Instant', feeText: '0.5%', logo: '/app-logos/mtnmomo.png', ring: 'ring-yellow-400/40', glow: 'bg-yellow-400/30' },
    { id: 'telecel', name: 'Telecel Cash', eta: '1-2 min', feeText: '0.6%', logo: '/app-logos/telecelcash.jpg', ring: 'ring-red-400/40', glow: 'bg-red-500/30' },
    { id: 'airteltigo', name: 'AirtelTigo Money', eta: 'Instant', feeText: '0.5%', logo: '/app-logos/atmoney.jpg', ring: 'ring-blue-400/40', glow: 'bg-blue-500/30' },
  ];
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showRequestMoneyModal, setShowRequestMoneyModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [addSource, setAddSource] = useState<'bank' | 'card' | 'mobile'>('bank');
  const [selectedOverviewCardId, setSelectedOverviewCardId] = useState<string>('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(mobileNetworks[0].id);
  const [mobileWalletNumber, setMobileWalletNumber] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [requestLink, setRequestLink] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (bankCards.length === 0) return;
    const hasSelection = bankCards.some((card) => String(card.id) === selectedOverviewCardId);
    if (!hasSelection) {
      setSelectedOverviewCardId(String(bankCards[0].id));
    }
  }, [bankCards, selectedOverviewCardId]);

  useEffect(() => {
    if (bankAccounts.length === 0) return;
    const hasSelection = bankAccounts.some((account: any) => String(account.id) === selectedBankAccountId);
    if (!hasSelection) {
      setSelectedBankAccountId(String(bankAccounts[0].id));
    }
  }, [bankAccounts, selectedBankAccountId]);

  useEffect(() => {
    if (bankCards.length === 0) return;
    const hasSelection = bankCards.some((card) => String(card.id) === selectedCardId);
    if (!hasSelection) {
      setSelectedCardId(String(bankCards[0].id));
    }
  }, [bankCards, selectedCardId]);

  const handleAddFunds = async () => {
    const parsedAmount = Number.parseFloat(addAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Enter a valid amount greater than 0.');
      return;
    }

    let sourceLabel = 'Mobile Money';

    if (addSource === 'bank') {
      const selectedAccount = bankAccounts.find((account: any) => String(account.id) === selectedBankAccountId);
      if (!selectedAccount) {
        setFormError('Select an AuraBank account to continue.');
        return;
      }
      if (Number(selectedAccount.availableBalance ?? selectedAccount.balance ?? 0) < parsedAmount) {
        setFormError('Selected AuraBank account has insufficient balance.');
        return;
      }

      sourceLabel = `${selectedAccount.name || String(selectedAccount.type || 'Account').toUpperCase()} ••••${String(selectedAccount.accountNumber || '').slice(-4)} (${selectedAccount.currency || 'USD'})`;
    }

    if (addSource === 'card') {
      const selectedCard = bankCards.find((card) => String(card.id) === selectedCardId);
      if (!selectedCard) {
        setFormError('Select an AuraBank card to continue.');
        return;
      }
      sourceLabel = `${selectedCard.brand} ${selectedCard.type.toUpperCase()} ••••${selectedCard.last4}`;
    }

    if (addSource === 'mobile') {
      const selectedNetwork = mobileNetworks.find((network) => network.id === selectedNetworkId);
      if (!selectedNetwork) {
        setFormError('Select a mobile money network.');
        return;
      }
      const normalizedWallet = mobileWalletNumber.replace(/\s+/g, '');
      if (!/^\+?[0-9]{10,15}$/.test(normalizedWallet)) {
        setFormError('Enter a valid mobile wallet number (10-15 digits, optional +).');
        return;
      }
      sourceLabel = `${selectedNetwork.name} (${normalizedWallet})`;
    }

    walletData.balance = Number(walletData.balance || 0) + parsedAmount;
    const actionId = `wallet-topup-${Date.now()}`;

    walletData.transactions.unshift({
      id: Date.now(),
      amount: parsedAmount,
      description: `Top up via ${sourceLabel}`,
      date: new Date().toISOString().split('T')[0],
    });
    persistWalletStateForUser(getActiveWalletUserId());
    await appendWalletLedgerEvent({
      type: 'funding.deposit',
      amount: parsedAmount,
      description: `Wallet top up via ${sourceLabel}`,
      metadata: {
        source: addSource,
        sourceLabel,
        sourceActionId: actionId,
      },
    });

    setFormError('');
    setAddAmount('');
    setShowAddFundsModal(false);
    onTransferComplete();
  };

  const handleRequestMoney = () => {
    const parsedAmount = Number.parseFloat(requestAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Enter a valid request amount greater than 0.');
      return;
    }

    const encodedNote = encodeURIComponent(requestNote || 'Wallet request');
    const generatedLink = `aurawallet://request?amount=${parsedAmount.toFixed(2)}&note=${encodedNote}`;
    setRequestLink(generatedLink);
    setFormError('');
  };

  const closeRequestModal = () => {
    setShowRequestMoneyModal(false);
    setRequestAmount('');
    setRequestNote('');
    setRequestLink('');
    setFormError('');
  };

  const closeAddFundsModal = () => {
    setShowAddFundsModal(false);
    setAddAmount('');
    setMobileWalletNumber('');
    setFormError('');
  };

  const handleSelectSource = (source: 'bank' | 'card' | 'mobile') => {
    setAddSource(source);
    setFormError('');
  };

  const selectedOverviewCard = bankCards.find((card) => String(card.id) === selectedOverviewCardId) || bankCards[0];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative md:col-span-2 overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-black via-white/15 to-green-500 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '0ms' }}>
          <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-white/10 blur-3xl pointer-events-none group-hover:bg-white/15 transition-colors duration-500" />
          <div className="relative flex items-center justify-between mb-3">
            <div>
              <p className="text-base font-semibold opacity-95">Total Balance</p>
              <p className="font-extrabold text-5xl mt-1 tabular-nums transition-transform duration-300 group-hover:scale-[1.02] origin-left">${walletBalance.toFixed(2)}</p>
              <p className="text-base font-medium opacity-95 mt-2">Available to send instantly</p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-base font-semibold">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Live
            </div>
          </div>

          <p className="relative text-base font-medium opacity-95">{insight}</p>
        </div>

        <div className="group rounded-2xl p-6 bg-[#0B1E39] border border-white/10 hover:border-green-400/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center justify-between">
            <p className="text-white/80 text-base font-semibold">Saved Cards</p>
            <div className="relative flex-shrink-0" style={{ width: 32, height: 32 }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-400/80 border-r-green-400/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
              <div className="absolute inset-[2.5px] rounded-full bg-green-500/15 text-green-300 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <p className="text-white/75 text-sm font-medium mt-2">Ready for one-tap payments</p>
          {bankCards.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedOverviewCard && (
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 transition-all duration-200 group-hover:border-white/20">
                  <p className="text-white text-sm font-semibold">
                    {selectedOverviewCard.brand} {String(selectedOverviewCard.type).toUpperCase()} ••••{selectedOverviewCard.last4}
                  </p>
                </div>
              )}
              {bankCards.length > 1 && (
                <>
                  <label className="text-white/80 text-xs font-medium">Choose another card</label>
                  <select
                    value={selectedOverviewCardId}
                    onChange={(event) => setSelectedOverviewCardId(event.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent"
                  >
                    <option value={selectedOverviewCardId} className="text-black">
                      Current: {selectedOverviewCard?.brand} {String(selectedOverviewCard?.type || '').toUpperCase()} ••••{selectedOverviewCard?.last4}
                    </option>
                    {bankCards
                      .filter((card) => String(card.id) !== selectedOverviewCardId)
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

      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '140ms' }}>
        <h3 className="text-white font-bold text-xl mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { icon: PlusCircle, label: 'Add Funds', onClick: () => setShowAddFundsModal(true), spin: 'border-t-green-400/80 border-r-green-400/30', bg: 'bg-green-500/15', text: 'text-green-300' },
            { icon: HandCoins, label: 'Request Money', onClick: () => setShowRequestMoneyModal(true), spin: 'border-t-pink-400/80 border-r-pink-400/30', bg: 'bg-pink-500/15', text: 'text-pink-300' },
            { icon: FileText, label: 'Last Transaction', onClick: () => setSelectedTransaction(walletData.transactions[0] || null), spin: 'border-t-sky-400/80 border-r-sky-400/30', bg: 'bg-sky-500/15', text: 'text-sky-300' },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="group relative rounded-xl p-3 bg-white/5 border border-white/10 hover:border-green-400/40 hover:bg-white/[0.07] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 text-left animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative flex-shrink-0 mb-2 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ width: 36, height: 36 }}>
                  <div className={`absolute inset-0 rounded-full border-2 border-transparent ${action.spin} group-hover:animate-spin`} style={{ animationDuration: '2.5s' }} />
                  <div className={`absolute inset-[2.5px] rounded-full ${action.bg} ${action.text} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-white font-semibold text-sm">{action.label}</p>
              </button>
            );
          })}

          <div className="rounded-xl p-3 bg-white/5 border border-white/10 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '150ms' }}>
            <p className="text-white/75 text-xs font-medium">Wallet Health</p>
            <p className="text-white font-bold text-lg mt-1">Excellent</p>
            <p className="text-green-300 text-xs mt-0.5">No security flags</p>
          </div>
        </div>
      </div>

      <div className="group rounded-2xl p-5 bg-[#0B1E39] border border-white/10 hover:border-green-400/30 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-400/80 border-r-green-400/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-[3px] rounded-full bg-green-500/15 text-green-300 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-white font-bold text-xl">Send Money</h3>
        </div>
        <TransferForm onComplete={onTransferComplete} />
      </div>

      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '260ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-xl">Recent Transactions</h3>
          <div className="relative flex-shrink-0" style={{ width: 32, height: 32 }}>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-400/80 border-r-green-400/30 animate-spin" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-[2.5px] rounded-full bg-green-500/15 text-green-300 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
        <TransactionList onTransactionClick={(transaction) => setSelectedTransaction(transaction)} />
      </div>

      {/* Cross-App Transfer */}
      <div className="group bg-[#0B1E39] border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-green-400/30 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '380ms' }}>
        <div>
          <h3 className="font-semibold text-white">Cross-App Transfer</h3>
          <p className="text-sm text-white/50 mt-0.5">Move funds between AuraWallet, AuraBank &amp; AuraVest instantly</p>
        </div>
        <InterAppTransfer sourceApp="wallet" />
      </div>

      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '440ms' }}>
        <MobileAppShowcase />
      </div>

      {showAddFundsModal && (
        <WalletModal title="Add Funds" onClose={closeAddFundsModal}>
            <div className="space-y-4">
              <div>
                <label className="text-white/80 text-sm font-medium">Amount</label>
                <input
                  value={addAmount}
                  onChange={(event) => setAddAmount(event.target.value)}
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-medium">Source</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {fundSources.map((source) => {
                    const active = addSource === source.id;
                    const Icon = source.icon;
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => handleSelectSource(source.id)}
                        className={`group relative flex flex-col items-center gap-2 px-2 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                          active
                            ? 'border-green-400/40 bg-green-500/10 text-white shadow-sm'
                            : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:-translate-y-0.5'
                        }`}
                      >
                        <span className={`relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white overflow-hidden ring-2 ${source.ring} transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
                          {active && <span className={`absolute inset-0 ${source.glow} blur-lg animate-pulse`} />}
                          {source.logo ? (
                            <img src={source.logo} alt={source.label} className="relative w-full h-full object-cover" />
                          ) : Icon ? (
                            <Icon className="relative w-5 h-5 text-emerald-600" />
                          ) : null}
                        </span>
                        {source.label}
                        {active && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {addSource === 'bank' && (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white overflow-hidden ring-1 ring-indigo-400/40">
                      <img src="/app-logos/bank.jpg" alt="AuraBank" className="w-full h-full object-cover" />
                    </span>
                    AuraBank Account
                  </label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(event) => setSelectedBankAccountId(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent"
                  >
                    {bankAccounts.map((account: any) => (
                      <option key={account.id} value={String(account.id)} className="text-black">
                        {(account.name || String(account.type || 'Account').toUpperCase())} ••••{String(account.accountNumber || '').slice(-4)} — {account.currency || 'USD'} {Number(account.availableBalance ?? account.balance ?? 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {addSource === 'card' && (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white overflow-hidden ring-1 ring-teal-400/40">
                      <img src="/app-logos/bank.jpg" alt="AuraBank" className="w-full h-full object-cover" />
                    </span>
                    AuraBank Card
                  </label>
                  <select
                    value={selectedCardId}
                    onChange={(event) => setSelectedCardId(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent"
                  >
                    {bankCards.map((card) => (
                      <option key={card.id} value={String(card.id)} className="text-black">
                        {card.brand} {String(card.type).toUpperCase()} ••••{card.last4}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {addSource === 'mobile' && (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white overflow-hidden ring-1 ring-emerald-400/40">
                      <img src="/app-logos/mobilemoney.jpg" alt="Mobile Money" className="w-full h-full object-cover" />
                    </span>
                    Mobile Money Network
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {mobileNetworks.map((network) => {
                      const active = selectedNetworkId === network.id;
                      return (
                        <button
                          key={network.id}
                          type="button"
                          onClick={() => setSelectedNetworkId(network.id)}
                          className={`group relative flex flex-col items-center gap-2 px-2 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                            active
                              ? 'border-green-400/40 bg-green-500/10 text-white shadow-sm'
                              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:-translate-y-0.5'
                          }`}
                        >
                          <span className={`relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white overflow-hidden ring-2 ${network.ring} transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
                            {active && <span className={`absolute inset-0 ${network.glow} blur-lg animate-pulse`} />}
                            <img src={network.logo} alt={network.name} className="relative w-full h-full object-cover" />
                          </span>
                          <span className="text-center leading-tight">{network.name}</span>
                          {active && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-white/50 text-xs">
                    {(() => {
                      const net = mobileNetworks.find((n) => n.id === selectedNetworkId);
                      return net ? `Fee ${net.feeText} • ETA ${net.eta}` : '';
                    })()}
                  </p>

                  <div className="mt-3">
                    <label className="text-white/80 text-sm font-medium">Wallet Number</label>
                    <input
                      value={mobileWalletNumber}
                      onChange={(event) => setMobileWalletNumber(event.target.value)}
                      placeholder="+233xxxxxxxxx"
                      className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {formError && (
                <p className="text-red-300 text-sm animate-in fade-in slide-in-from-top-1 duration-200">{formError}</p>
              )}

              <button
                onClick={handleAddFunds}
                className="group relative w-full overflow-hidden rounded-lg px-4 py-2.5 bg-gradient-to-r from-black via-white/15 to-green-500 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative">Confirm Add Funds</span>
              </button>
            </div>
        </WalletModal>
      )}

      {showRequestMoneyModal && (
        <WalletModal title="Request Money" onClose={closeRequestModal}>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white overflow-hidden ring-2 ring-green-400/40 shadow-lg flex-shrink-0">
                  <span className="absolute inset-0 bg-green-500/30 blur-lg animate-pulse" />
                  <img src="/app-logos/wallet.jpeg" alt="AuraWallet" className="relative w-full h-full object-cover" />
                </span>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm">AuraWallet Request</p>
                  <p className="text-white/60 text-xs">Generate a shareable payment link instantly</p>
                </div>
              </div>

              <div>
                <label className="text-white/80 text-sm font-medium">Amount</label>
                <input
                  value={requestAmount}
                  onChange={(event) => setRequestAmount(event.target.value)}
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-medium">Note</label>
                <input
                  value={requestNote}
                  onChange={(event) => setRequestNote(event.target.value)}
                  placeholder="What is this request for?"
                  className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent"
                />
              </div>

              {formError && (
                <p className="text-red-300 text-sm animate-in fade-in slide-in-from-top-1 duration-200">{formError}</p>
              )}

              <button
                onClick={handleRequestMoney}
                className="group relative w-full overflow-hidden rounded-lg px-4 py-2.5 bg-gradient-to-r from-black via-white/15 to-green-500 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative">Generate Request Link</span>
              </button>

              {requestLink && (
                <div className="flex items-start gap-2.5 rounded-lg bg-white/5 border border-white/10 p-3 animate-in fade-in zoom-in-95 duration-300">
                  <Link2 className="w-4 h-4 text-green-300 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white/80 text-sm font-medium mb-1">Request Link</p>
                    <p className="text-green-300 text-sm break-all">{requestLink}</p>
                  </div>
                </div>
              )}
            </div>
        </WalletModal>
      )}

      {selectedTransaction && (() => {
        const txStyle = getWalletTxStyle(selectedTransaction.description || '', Number(selectedTransaction.amount || 0));
        const TxIcon = txStyle.Icon;
        const isCredit = Number(selectedTransaction.amount) >= 0;
        return (
          <WalletModal title="Transaction Details" onClose={() => setSelectedTransaction(null)}>
            <div className="space-y-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1 fill-mode-both">
                <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                  <div className={`absolute inset-0 rounded-full border-2 border-transparent ${txStyle.spin} animate-spin`} style={{ animationDuration: '2.5s' }} />
                  <div className={`absolute inset-[3px] rounded-full ${txStyle.bg} ${txStyle.text} flex items-center justify-center`}>
                    <TxIcon className="w-5 h-5" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs mb-0.5">Description</p>
                  <p className="text-white font-semibold truncate">{selectedTransaction.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '40ms' }}>
                  <p className="text-white/70 text-xs mb-1">Amount</p>
                  <div className={`flex items-center gap-1 font-bold ${isCredit ? 'text-green-300' : 'text-red-300'}`}>
                    {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    ${Math.abs(Number(selectedTransaction.amount || 0)).toFixed(2)}
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 border border-white/10 p-3 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '80ms' }}>
                  <p className="text-white/70 text-xs mb-1">Status</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${selectedTransaction.status === 'queued' ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'}`}>
                    {String(selectedTransaction.status || 'completed').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 border border-white/10 p-3 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '120ms' }}>
                <p className="text-white/70 text-xs mb-1">Date</p>
                <p className="text-white font-semibold">{new Date(selectedTransaction.date).toLocaleString()}</p>
              </div>

              {selectedTransaction.scheduledFor && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '160ms' }}>
                  <p className="text-white/70 text-xs mb-1">Scheduled For</p>
                  <p className="text-white font-semibold">{new Date(selectedTransaction.scheduledFor).toLocaleString()}</p>
                </div>
              )}
            </div>
          </WalletModal>
        );
      })()}
    </>
  );
}
