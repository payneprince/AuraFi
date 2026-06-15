import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Sparkles, Wallet, PlusCircle, HandCoins, FileText, ArrowUpRight, ArrowDownLeft, Link2, Send, X } from 'lucide-react';
import SpendAnalytics from './SpendAnalytics';
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

  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showRequestMoneyModal, setShowRequestMoneyModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [addSource, setAddSource] = useState<'bank' | 'paystack'>('bank');
  const [auraSourceType, setAuraSourceType] = useState<'account' | 'card'>('account');
  const [walletFundingAction, setWalletFundingAction] = useState<'deposit' | 'withdrawal'>('deposit');
  const [walletFundingStep, setWalletFundingStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [walletFundingRef, setWalletFundingRef] = useState('');
  const [walletFundingNote, setWalletFundingNote] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [momoName, setMomoName] = useState('');
  const [selectedOverviewCardId, setSelectedOverviewCardId] = useState<string>('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  const [selectedAuraBankCardId, setSelectedAuraBankCardId] = useState<string>('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [requestLink, setRequestLink] = useState('');
  const [formError, setFormError] = useState('');
  const [isAddingFunds, setIsAddingFunds] = useState(false);

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
    if (!hasSelection) setSelectedBankAccountId(String(bankAccounts[0].id));
  }, [bankAccounts, selectedBankAccountId]);

  useEffect(() => {
    if (bankCards.length === 0) return;
    const hasSelection = bankCards.some((c) => String(c.id) === selectedAuraBankCardId);
    if (!hasSelection) setSelectedAuraBankCardId(String(bankCards[0].id));
  }, [bankCards, selectedAuraBankCardId]);

  const loadPaystackScript = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('SSR'));
      if ((window as any).PaystackPop) return resolve();
      const s = document.createElement('script');
      s.src = 'https://js.paystack.co/v2/inline.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Paystack script'));
      document.head.appendChild(s);
    });

  const detectMomoCode = (phone: string): string => {
    const digits = phone.replace(/\D/g, '').replace(/^233/, '0');
    if (/^0(24|54|55|59|57)/.test(digits)) return 'MTN';
    if (/^0(20|50)/.test(digits)) return 'VOD';
    if (/^0(27|56|26)/.test(digits)) return 'ATL';
    return 'MTN';
  };

  const getWalletUserEmail = () => {
    try {
      const u = JSON.parse(localStorage.getItem('aurawallet_user') || localStorage.getItem('auravest_user') || '{}') as { email?: string };
      return u.email || 'demo@aurawallet.com';
    } catch { return 'demo@aurawallet.com'; }
  };

  const commitWalletTopUp = async (amount: number, sourceLabel: string) => {
    walletData.balance = Number(walletData.balance || 0) + amount;
    walletData.transactions.unshift({ id: Date.now(), amount, description: `Top up via ${sourceLabel}`, date: new Date().toISOString().split('T')[0] });
    persistWalletStateForUser(getActiveWalletUserId());
    await appendWalletLedgerEvent({ type: 'funding.deposit', amount, description: `Wallet top up via ${sourceLabel}`, metadata: { source: addSource, sourceLabel } });
  };

  const commitWalletWithdrawal = async (amount: number, methodLabel: string) => {
    walletData.balance = Math.max(0, Number(walletData.balance || 0) - amount);
    walletData.transactions.unshift({ id: Date.now(), amount: -amount, description: `Withdrawal via ${methodLabel}`, date: new Date().toISOString().split('T')[0] });
    persistWalletStateForUser(getActiveWalletUserId());
    await appendWalletLedgerEvent({ type: 'funding.withdrawal', amount, description: `Wallet withdrawal via ${methodLabel}`, metadata: { source: addSource, sourceLabel: methodLabel } });
  };

  const handleWalletFundingContinue = () => {
    const parsed = Number.parseFloat(addAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) { setFormError('Enter a valid amount greater than 0.'); return; }
    if (walletFundingAction === 'withdrawal' && parsed > walletBalance) { setFormError('Amount exceeds your wallet balance.'); return; }
    if (addSource === 'bank' && auraSourceType === 'account') {
      const acct = bankAccounts.find((a: any) => String(a.id) === selectedBankAccountId);
      if (!acct) { setFormError('Select an AuraBank account.'); return; }
      if (walletFundingAction === 'deposit' && Number(acct.availableBalance ?? acct.balance ?? 0) < parsed) {
        setFormError('Insufficient AuraBank balance.'); return;
      }
    }
    if (addSource === 'paystack' && walletFundingAction === 'withdrawal') {
      if (!momoPhone.trim()) { setFormError('Enter your account/wallet number.'); return; }
      if (!momoName.trim()) { setFormError('Enter the account holder name.'); return; }
    }
    setFormError('');
    setWalletFundingStep('confirm');
  };

  const handleWalletFundingConfirm = async () => {
    const parsed = Number.parseFloat(addAmount);
    if (addSource === 'bank') {
      const acct = bankAccounts.find((a: any) => String(a.id) === selectedBankAccountId);
      const card = bankCards.find(c => String(c.id) === selectedAuraBankCardId);
      const lbl = auraSourceType === 'account'
        ? `${acct?.name || 'AuraBank'} ••••${String(acct?.accountNumber || '').slice(-4)}`
        : `${card?.brand || 'AuraBank'} ••••${card?.last4 || ''}`;
      if (walletFundingAction === 'deposit') await commitWalletTopUp(parsed, lbl);
      else await commitWalletWithdrawal(parsed, 'AuraBank');
      setWalletFundingRef(`wallet-bank-${Date.now()}`);
      setWalletFundingStep('success');
      onTransferComplete();
      return;
    }

    setIsAddingFunds(true);
    setFormError('');

    if (walletFundingAction === 'deposit') {
      try {
        const res = await fetch('/api/paystack/initialize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: getWalletUserEmail(), amount: parsed, currency: 'GHS', channels: ['mobile_money', 'card', 'bank_transfer'] }),
        });
        const { accessCode, reference, error } = await res.json() as { accessCode?: string; reference?: string; error?: string };
        if (!accessCode || !reference) throw new Error(error ?? 'Init failed');
        await loadPaystackScript();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const popup = new (window as any).PaystackPop();
        popup.resumeTransaction(accessCode, {
          onSuccess: async () => {
            try {
              const vData = await (await fetch(`/api/paystack/verify?reference=${reference}`)).json() as { success: boolean };
              if (!vData.success) throw new Error('Verification failed');
              await commitWalletTopUp(parsed, 'Paystack');
              setWalletFundingRef(reference);
              setWalletFundingStep('success');
              onTransferComplete();
            } catch { setFormError('Payment received but balance update failed. Please refresh.'); }
            finally { setIsAddingFunds(false); }
          },
          onCancel: () => { setIsAddingFunds(false); setFormError('Payment cancelled.'); },
        });
      } catch { setIsAddingFunds(false); setFormError('Could not launch Paystack. Try again.'); }
      return;
    }

    // Paystack withdrawal
    try {
      const res = await fetch('/api/paystack/transfer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, currency: 'GHS', recipientType: 'mobile_money', accountNumber: momoPhone.trim().replace(/\s+/g, ''), bankCode: detectMomoCode(momoPhone), name: momoName.trim() || 'Customer' }),
      });
      const data = await res.json() as { success?: boolean; error?: string; code?: string; reference?: string; transferCode?: string };
      const isPending = !data.success && data.code === 'transfer_unavailable';
      if (!data.success && !isPending) throw new Error(data.error ?? 'Transfer failed');
      await commitWalletWithdrawal(parsed, isPending ? 'Paystack (pending)' : 'Paystack');
      setWalletFundingRef(data.reference || data.transferCode || '');
      setWalletFundingStep('success');
      onTransferComplete();
    } catch (err: unknown) {
      setFormError((err as Error)?.message ?? 'Transfer failed. Try again.');
    } finally { setIsAddingFunds(false); }
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
    setWalletFundingStep('form');
    setWalletFundingAction('deposit');
    setWalletFundingRef('');
    setWalletFundingNote('');
    setMomoPhone('');
    setMomoName('');
    setFormError('');
    setAddSource('bank');
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
            { icon: PlusCircle, label: 'Add Funds', onClick: () => { setShowAddFundsModal(true); loadPaystackScript().catch(() => {}); }, spin: 'border-t-green-400/80 border-r-green-400/30', bg: 'bg-green-500/15', text: 'text-green-300' },
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

          {(() => {
            const health = walletBalance < 20
              ? { label: 'Critical', sub: 'Add funds soon', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' }
              : walletBalance < 100
              ? { label: 'Low', sub: 'Consider topping up', color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5' }
              : walletBalance < 500
              ? { label: 'Good', sub: `${bankAccounts.length} account${bankAccounts.length !== 1 ? 's' : ''} linked`, color: 'text-yellow-300', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5' }
              : { label: 'Excellent', sub: 'No security flags', color: 'text-green-300', border: 'border-white/10', bg: 'bg-white/5' };
            return (
              <div className={`rounded-xl p-3 ${health.bg} border ${health.border} hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-1 fill-mode-both`} style={{ animationDelay: '150ms' }}>
                <p className="text-white/75 text-xs font-medium">Wallet Health</p>
                <p className={`font-bold text-lg mt-1 ${health.color}`}>{health.label}</p>
                <p className={`text-xs mt-0.5 ${health.color} opacity-80`}>{health.sub}</p>
              </div>
            );
          })()}
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

      <SpendAnalytics />

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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => { if (walletFundingStep !== 'success') closeAddFundsModal(); }}>
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#0B1E39] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}>
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
              <div>
                <h3 className="text-white font-bold text-lg">
                  {walletFundingStep === 'success' ? (walletFundingAction === 'deposit' ? 'Deposit Confirmed' : 'Withdrawal Submitted') : 'Manage Funds'}
                </h3>
                <p className="text-white/40 text-xs mt-0.5">Available: ${walletBalance.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                {walletFundingStep === 'form' && (
                  <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                    {(['deposit', 'withdrawal'] as const).map(a => (
                      <button key={a} onClick={() => { setWalletFundingAction(a); setFormError(''); }}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${walletFundingAction === a ? (a === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400') : 'text-white/40 hover:text-white/70'}`}>
                        {a === 'deposit' ? 'In' : 'Out'}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={closeAddFundsModal} className="text-white/40 hover:text-white hover:rotate-90 transition-all duration-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── FORM STEP ── */}
            {walletFundingStep === 'form' && (
              <div className="relative px-5 pb-5 pt-4 space-y-3 max-h-[70vh] overflow-y-auto">
                {/* Rail selector */}
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5">Payment Method</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'bank' as const, label: 'AuraBank', logo: '/app-logos/bank.jpg', depositSub: 'Instant · Internal', withdrawSub: 'Instant · Internal' },
                      { id: 'paystack' as const, label: 'Paystack', logo: '/app-logos/paystack.png', depositSub: 'Card · MoMo · Bank', withdrawSub: 'Transfer · Pending' },
                    ]).map(rail => (
                      <button key={rail.id} onClick={() => { setAddSource(rail.id); setFormError(''); }}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 ${addSource === rail.id ? (walletFundingAction === 'deposit' ? 'border-green-500/40 bg-green-500/8' : 'border-red-500/40 bg-red-500/8') : 'border-white/10 bg-white/5 opacity-60 hover:opacity-100'}`}>
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
                          <img src={rail.logo} alt={rail.label} className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <p className={`text-xs font-bold ${addSource === rail.id ? (walletFundingAction === 'deposit' ? 'text-green-400' : 'text-red-400') : 'text-white/50'}`}>{rail.label}</p>
                        <p className="text-[9px] text-white/30 leading-tight text-center">{walletFundingAction === 'deposit' ? rail.depositSub : rail.withdrawSub}</p>
                        {addSource === rail.id && <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse ${walletFundingAction === 'deposit' ? 'bg-green-400' : 'bg-red-400'}`} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AuraBank info + account/card selector */}
                {addSource === 'bank' && (
                  <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/20 px-3 py-2.5 text-xs space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400">⚡</span>
                      <span className="text-indigo-200/80">AuraBank transfers settle <span className="font-semibold text-indigo-100">instantly</span> with no fees.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-200/40 text-[11px]">Accepted:</span>
                      <div className="flex items-center -space-x-1">
                        {['/app-logos/visa.svg', '/app-logos/mastercard.svg', '/app-logos/amex.svg'].map(src => (
                          <img key={src} src={src} alt="" className="w-8 h-5 rounded object-contain bg-white ring-1 ring-black/20 p-0.5" />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {(['account', 'card'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setAuraSourceType(t)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${auraSourceType === t ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-white/5 text-white/30 border border-white/10 hover:bg-white/10'}`}>
                          {t === 'account' ? 'Account' : 'Card'}
                        </button>
                      ))}
                    </div>
                    {auraSourceType === 'account' && (bankAccounts.length > 0
                      ? <select value={selectedBankAccountId} onChange={e => setSelectedBankAccountId(e.target.value)}
                          className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                          {bankAccounts.map((a: any) => <option key={a.id} value={String(a.id)} className="text-black">{a.name || a.type} ••••{String(a.accountNumber || '').slice(-4)} — {a.currency || 'USD'} {Number(a.availableBalance ?? a.balance ?? 0).toFixed(2)}</option>)}
                        </select>
                      : <p className="text-white/30 text-[11px]">No AuraBank accounts linked.</p>
                    )}
                    {auraSourceType === 'card' && (bankCards.length > 0
                      ? <select value={selectedAuraBankCardId} onChange={e => setSelectedAuraBankCardId(e.target.value)}
                          className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                          {bankCards.map(c => <option key={c.id} value={String(c.id)} className="text-black">{c.brand} {c.type.toUpperCase()} ••••{c.last4}</option>)}
                        </select>
                      : <p className="text-white/30 text-[11px]">No AuraBank cards linked.</p>
                    )}
                  </div>
                )}

                {/* Paystack deposit info */}
                {addSource === 'paystack' && walletFundingAction === 'deposit' && (
                  <div className="rounded-xl bg-teal-500/8 border border-teal-500/20 px-3 py-2.5 text-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5">
                      <span className="text-teal-400">🔒</span>
                      <p className="font-semibold text-white/90">Secure checkout via Paystack</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/40 text-[11px]">Pay via:</span>
                      <div className="flex items-center -space-x-1.5">
                        {['/app-logos/mtnmomo.png', '/app-logos/telecelcash.jpg', '/app-logos/atmoney.jpg', '/logos/banks/gh/ecobank.png', '/logos/banks/gh/gcb.png', '/logos/banks/gh/absa.png'].map(src => (
                          <img key={src} src={src} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-black/30 bg-white" />
                        ))}
                      </div>
                      <span className="text-white/40 text-[11px]">MTN, Telecel, AirtelTigo, Ecobank + more</span>
                    </div>
                  </div>
                )}

                {/* Paystack withdrawal info + fields */}
                {addSource === 'paystack' && walletFundingAction === 'withdrawal' && (
                  <div className="rounded-xl bg-yellow-500/8 border border-yellow-500/20 px-3 py-2.5 text-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">⏳</span>
                      <p className="text-white/60">Withdrawals reflected within <span className="font-semibold text-white">1–3 business days</span>.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/40 text-[11px]">Withdraw to:</span>
                      <div className="flex items-center -space-x-1.5">
                        {['/app-logos/mtnmomo.png', '/app-logos/telecelcash.jpg', '/app-logos/atmoney.jpg', '/logos/banks/gh/ecobank.png', '/logos/banks/gh/gcb.png', '/logos/banks/gh/access.png'].map(src => (
                          <img key={src} src={src} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-black/30 bg-white" />
                        ))}
                      </div>
                      <span className="text-white/40 text-[11px]">MTN MoMo, Telecel, banks + more</span>
                    </div>
                    <input type="tel" value={momoPhone} onChange={e => setMomoPhone(e.target.value)} placeholder="MoMo or bank account number"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-yellow-500/20" />
                    <input type="text" value={momoName} onChange={e => setMomoName(e.target.value)} placeholder="Account holder name"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-yellow-500/20" />
                  </div>
                )}

                {/* Quick amounts */}
                <div className="flex gap-1.5">
                  {[50, 100, 500, 1000].map(a => (
                    <button key={a} onClick={() => setAddAmount(String(a))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${addAmount === String(a) ? (walletFundingAction === 'deposit' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400') : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}>
                      ${a}
                    </button>
                  ))}
                </div>

                {/* Amount input */}
                <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-500/30 transition-all">
                  <span className="flex items-center px-3 text-white/40 text-sm font-bold border-r border-white/10">$</span>
                  <input type="number" min="0" step="0.01" value={addAmount} onChange={e => setAddAmount(e.target.value)} placeholder="0.00"
                    className="flex-1 bg-transparent px-3 py-2.5 text-white font-semibold text-sm placeholder:text-white/25 focus:outline-none" />
                </div>

                {/* Note */}
                <input type="text" value={walletFundingNote} onChange={e => setWalletFundingNote(e.target.value)} placeholder="Note (optional)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-green-500/20" />

                {formError && <p className="text-red-400 text-xs animate-in fade-in duration-200">{formError}</p>}

                <button onClick={handleWalletFundingContinue}
                  className={`group relative w-full overflow-hidden rounded-xl px-4 py-2.5 text-white font-bold text-sm transition-all hover:-translate-y-0.5 ${walletFundingAction === 'deposit' ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30' : 'bg-gradient-to-r from-red-600 to-rose-500 hover:shadow-lg hover:shadow-red-500/30'}`}>
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative">Continue to {walletFundingAction === 'deposit' ? 'Deposit' : 'Withdraw'} →</span>
                </button>
              </div>
            )}

            {/* ── CONFIRM STEP ── */}
            {walletFundingStep === 'confirm' && (
              <div className="relative px-5 pb-5 pt-4 space-y-1">
                {[
                  { label: 'Action', value: walletFundingAction === 'deposit' ? '↓ Deposit' : '↑ Withdrawal' },
                  { label: 'Amount', value: `$${Number(addAmount).toFixed(2)}` },
                  { label: 'Method', value: addSource === 'bank' ? 'AuraBank' : 'Paystack' },
                  { label: 'Settlement', value: addSource === 'bank' ? 'Instant' : walletFundingAction === 'deposit' ? 'Via Paystack' : 'Pending (1–3 days)' },
                  ...(addSource === 'paystack' && walletFundingAction === 'withdrawal' ? [{ label: 'Recipient', value: `${momoName.trim()} · ${momoPhone.trim()}` }] : []),
                  ...(walletFundingNote ? [{ label: 'Note', value: walletFundingNote }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5">
                    <span className="text-white/40 text-xs">{label}</span>
                    <span className={`text-sm font-semibold ${label === 'Amount' ? (walletFundingAction === 'deposit' ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>{value}</span>
                  </div>
                ))}

                {formError && <p className="text-red-400 text-xs pt-1 animate-in fade-in duration-200">{formError}</p>}

                <div className="flex gap-2 pt-3">
                  <button onClick={() => { setWalletFundingStep('form'); setFormError(''); }}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white/60 text-sm font-semibold hover:bg-white/10 transition-all">
                    ← Back
                  </button>
                  <button onClick={handleWalletFundingConfirm} disabled={isAddingFunds}
                    className={`flex-1 relative overflow-hidden rounded-xl px-4 py-2.5 text-white font-bold text-sm transition-all disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-lg ${walletFundingAction === 'deposit' ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-green-500/30' : 'bg-gradient-to-r from-red-600 to-rose-500 hover:shadow-red-500/30'}`}>
                    {isAddingFunds
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{addSource === 'bank' ? 'Processing…' : 'Launching Paystack…'}</span>
                      : `Confirm ${walletFundingAction === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
                  </button>
                </div>
              </div>
            )}

            {/* ── SUCCESS STEP ── */}
            {walletFundingStep === 'success' && (
              <div className="relative px-5 pb-6 pt-4 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center animate-in zoom-in-50 duration-500">
                  <span className="text-3xl">{walletFundingAction === 'deposit' ? '✅' : '⏳'}</span>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{walletFundingAction === 'deposit' ? 'Funds Added!' : 'Withdrawal Submitted'}</p>
                  <p className="text-white/50 text-sm mt-1">
                    {walletFundingAction === 'deposit'
                      ? `$${Number(addAmount).toFixed(2)} added to your wallet`
                      : `$${Number(addAmount).toFixed(2)} withdrawal is being processed`}
                  </p>
                </div>
                {walletFundingRef && <p className="text-white/20 text-[11px] font-mono">Ref: {walletFundingRef.slice(0, 24)}</p>}
                <button onClick={closeAddFundsModal}
                  className="w-full rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 font-semibold text-sm py-2.5 hover:bg-green-500/30 transition-all">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
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
