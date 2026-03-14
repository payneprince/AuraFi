import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Sparkles, Wallet, PlusCircle, HandCoins, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import TransactionList from '@/components/TransactionList';
import TransferForm from '@/components/TransferForm';
import { auraBankCards } from '@/components/CardManager';
import MobileAppShowcase from '@/components/MobileAppShowcase';
import SuiteBalanceWidget from './SuiteBalanceWidget';
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

  const mobileNetworks = [
    { id: 'mtn', name: 'MTN Mobile Money', eta: 'Instant', feeText: '0.5%' },
    { id: 'telecel', name: 'Telecel Cash', eta: '1-2 min', feeText: '0.6%' },
    { id: 'airteltigo', name: 'AirtelTigo Money', eta: 'Instant', feeText: '0.5%' },
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
        <div className="md:col-span-2 rounded-2xl p-6 bg-gradient-to-r from-black via-white/15 to-green-500 text-white shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-base font-semibold opacity-95">Total Balance</p>
              <p className="font-extrabold text-5xl mt-1">${walletBalance.toFixed(2)}</p>
              <p className="text-base font-medium opacity-95 mt-2">Available to send instantly</p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-base font-semibold">
              <Sparkles className="w-4 h-4" />
              Live
            </div>
          </div>

          <p className="text-base font-medium opacity-95">{insight}</p>
        </div>

        <div className="rounded-2xl p-6 bg-[#0B1E39] border border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-white/80 text-base font-semibold">Saved Cards</p>
            <CreditCard className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-white/75 text-sm font-medium mt-2">Ready for one-tap payments</p>
          {bankCards.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedOverviewCard && (
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
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
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
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

      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
        <h3 className="text-white font-bold text-xl mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <button
            onClick={() => setShowAddFundsModal(true)}
            className="rounded-xl p-3 bg-white/5 border border-white/10 hover:border-green-400/50 transition-colors text-left"
          >
            <PlusCircle className="w-4 h-4 text-green-300 mb-2" />
            <p className="text-white font-semibold text-sm">Add Funds</p>
          </button>

          <button
            onClick={() => setShowRequestMoneyModal(true)}
            className="rounded-xl p-3 bg-white/5 border border-white/10 hover:border-green-400/50 transition-colors text-left"
          >
            <HandCoins className="w-4 h-4 text-green-300 mb-2" />
            <p className="text-white font-semibold text-sm">Request Money</p>
          </button>

          <button
            onClick={() => setSelectedTransaction(walletData.transactions[0] || null)}
            className="rounded-xl p-3 bg-white/5 border border-white/10 hover:border-green-400/50 transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-green-300 mb-2" />
            <p className="text-white font-semibold text-sm">Last Transaction</p>
          </button>

          <div className="rounded-xl p-3 bg-white/5 border border-white/10">
            <p className="text-white/75 text-xs font-medium">Wallet Health</p>
            <p className="text-white font-bold text-lg mt-1">Excellent</p>
            <p className="text-green-300 text-xs mt-0.5">No security flags</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
        <h3 className="text-white font-bold text-xl mb-4">Send Money</h3>
        <TransferForm onComplete={onTransferComplete} />
      </div>

      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-xl">Recent Transactions</h3>
          <Wallet className="w-4 h-4 text-green-400" />
        </div>
        <TransactionList onTransactionClick={(transaction) => setSelectedTransaction(transaction)} />
      </div>

      {/* Aura Suite Overview */}
      <SuiteBalanceWidget />

      {/* Cross-App Transfer */}
      <div className="bg-[#0B1E39] border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">Cross-App Transfer</h3>
          <p className="text-sm text-white/50 mt-0.5">Move funds between AuraWallet, AuraBank &amp; AuraVest instantly</p>
        </div>
        <InterAppTransfer sourceApp="wallet" />
      </div>

      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
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
                  className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-medium">Source</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(['bank', 'card', 'mobile'] as const).map((source) => (
                    <button
                      key={source}
                      onClick={() => handleSelectSource(source)}
                      className={`px-2 py-2 rounded-lg text-sm font-semibold ${addSource === source ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/80'}`}
                    >
                      {source === 'bank' ? 'Bank' : source === 'card' ? 'Card' : 'Mobile'}
                    </button>
                  ))}
                </div>
              </div>

              {addSource === 'bank' && (
                <div>
                  <label className="text-white/80 text-sm font-medium">AuraBank Account</label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(event) => setSelectedBankAccountId(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
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
                <div>
                  <label className="text-white/80 text-sm font-medium">AuraBank Card</label>
                  <select
                    value={selectedCardId}
                    onChange={(event) => setSelectedCardId(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
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
                <div>
                  <label className="text-white/80 text-sm font-medium">Mobile Money Network</label>
                  <select
                    value={selectedNetworkId}
                    onChange={(event) => setSelectedNetworkId(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
                  >
                    {mobileNetworks.map((network) => (
                      <option key={network.id} value={network.id} className="text-black">
                        {network.name} — {network.feeText} • {network.eta}
                      </option>
                    ))}
                  </select>

                  <div className="mt-3">
                    <label className="text-white/80 text-sm font-medium">Wallet Number</label>
                    <input
                      value={mobileWalletNumber}
                      onChange={(event) => setMobileWalletNumber(event.target.value)}
                      placeholder="+233xxxxxxxxx"
                      className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {formError && <p className="text-red-300 text-sm">{formError}</p>}

              <button
                onClick={handleAddFunds}
                className="w-full rounded-lg px-4 py-2 bg-gradient-to-r from-black via-white/15 to-green-500 text-white font-bold"
              >
                Confirm Add Funds
              </button>
            </div>
        </WalletModal>
      )}

      {showRequestMoneyModal && (
        <WalletModal title="Request Money" onClose={closeRequestModal}>
            <div className="space-y-4">
              <div>
                <label className="text-white/80 text-sm font-medium">Amount</label>
                <input
                  value={requestAmount}
                  onChange={(event) => setRequestAmount(event.target.value)}
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-medium">Note</label>
                <input
                  value={requestNote}
                  onChange={(event) => setRequestNote(event.target.value)}
                  placeholder="What is this request for?"
                  className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
                />
              </div>

              {formError && <p className="text-red-300 text-sm">{formError}</p>}

              <button
                onClick={handleRequestMoney}
                className="w-full rounded-lg px-4 py-2 bg-gradient-to-r from-black via-white/15 to-green-500 text-white font-bold"
              >
                Generate Request Link
              </button>

              {requestLink && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-white/80 text-sm font-medium mb-2">Request Link</p>
                  <p className="text-green-300 text-sm break-all">{requestLink}</p>
                </div>
              )}
            </div>
        </WalletModal>
      )}

      {selectedTransaction && (
        <WalletModal title="Transaction Details" onClose={() => setSelectedTransaction(null)}>
            <div className="space-y-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-white/70 text-xs mb-1">Description</p>
                <p className="text-white font-semibold">{selectedTransaction.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-white/70 text-xs mb-1">Amount</p>
                  <div className={`flex items-center gap-1 font-bold ${selectedTransaction.amount >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {selectedTransaction.amount >= 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    ${Math.abs(Number(selectedTransaction.amount || 0)).toFixed(2)}
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-white/70 text-xs mb-1">Status</p>
                  <p className="text-white font-semibold">{String(selectedTransaction.status || 'completed').toUpperCase()}</p>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-white/70 text-xs mb-1">Date</p>
                <p className="text-white font-semibold">{new Date(selectedTransaction.date).toLocaleString()}</p>
              </div>

              {selectedTransaction.scheduledFor && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-white/70 text-xs mb-1">Scheduled For</p>
                  <p className="text-white font-semibold">{new Date(selectedTransaction.scheduledFor).toLocaleString()}</p>
                </div>
              )}
            </div>
        </WalletModal>
      )}
    </>
  );
}
