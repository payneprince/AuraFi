"use client";
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, Smartphone } from 'lucide-react';
import { auraBankCards } from '@/components/CardManager';
// @ts-ignore
import { walletData } from '@/lib/shared/mock-data';
import { appendWalletLedgerEvent, getActiveWalletUserId, getWalletScopedStorageKey, persistWalletStateForUser } from '@/lib/wallet-state';

export default function TransferForm({ onComplete }: { onComplete?: () => void }) {
  const [auraBankSnapshot, setAuraBankSnapshot] = useState<any | null>(null);

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

  const syncWalletActivitySnapshotCookie = (transactionList: any[]) => {
    if (typeof document === 'undefined') return;
    const activeUserId = getActiveWalletUserId();

    const normalizedEvents = (transactionList || [])
      .map((transaction) => {
        const rawTimestamp = String(transaction?.createdAt || transaction?.date || new Date().toISOString());
        const timestamp = Number.isNaN(Date.parse(rawTimestamp)) ? new Date().toISOString() : new Date(rawTimestamp).toISOString();
        const amount = Number(transaction?.amount || 0);
        return {
          id: `aurawallet-${String(transaction?.id || Date.now())}`,
          app: 'AuraWallet',
          type: String(transaction?.method === 'card' ? 'card_transfer' : 'mobile_transfer'),
          title: String(transaction?.description || 'Wallet transfer'),
          amount: Number.isFinite(amount) ? amount : 0,
          currency: 'USD',
          userId: activeUserId,
          timestamp,
          status: String(transaction?.status || 'completed'),
          meta: {
            method: String(transaction?.method || ''),
            recipient: String(transaction?.recipient || ''),
          },
        };
      })
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 40);

    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `aurawallet_activity_snapshot=${encodeURIComponent(JSON.stringify(normalizedEvents))}; expires=${expires}; path=/; SameSite=Lax`;
  };

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

  const bankCards = useMemo(() => {
    const snapshotCards = auraBankSnapshot?.cards;
    if (Array.isArray(snapshotCards) && snapshotCards.length > 0) {
      return snapshotCards
        .filter((card: any) => String(card.status || 'active').toLowerCase() === 'active')
        .map((card: any, index: number) => ({
          id: String(card?.id ?? card?.cardNumber ?? `snapshot-card-${index}`),
          brand: String(card?.brand || 'AuraBank').toUpperCase(),
          type: String(card?.type || 'Debit'),
          last4: String(card?.last4 ?? String(card?.cardNumber || '').slice(-4)),
        }));
    }
    return auraBankCards.map((card, index) => ({
      id: String(card.id ?? `fallback-card-${index}`),
      brand: card.brand,
      type: card.type,
      last4: card.last4,
    }));
  }, [auraBankSnapshot]);

  const mobileNetworks = [
    { id: 'mtn', name: 'MTN Mobile Money', logo: '/app-logos/mtnmomo.png', ring: 'ring-yellow-400/40', glow: 'bg-yellow-400/30' },
    { id: 'telecel', name: 'Telecel Cash', logo: '/app-logos/telecelcash.jpg', ring: 'ring-red-400/40', glow: 'bg-red-500/30' },
    { id: 'airteltigo', name: 'AirtelTigo Money', logo: '/app-logos/atmoney.jpg', ring: 'ring-blue-400/40', glow: 'bg-blue-500/30' },
  ];

  const methodOptions: Array<{ id: 'mobile' | 'card'; label: string; logo?: string; icon?: typeof Smartphone; ring: string; glow: string }> = [
    { id: 'mobile', label: 'Mobile Money', logo: '/app-logos/mobilemoney.jpg', ring: 'ring-emerald-400/40', glow: 'bg-emerald-500/30' },
    { id: 'card', label: 'AuraBank Card', logo: '/app-logos/bank.jpg', ring: 'ring-indigo-400/40', glow: 'bg-indigo-500/30' },
  ];

  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'mobile'|'card'>('mobile');
  const [mobileRecipient, setMobileRecipient] = useState('');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(mobileNetworks[0].id);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [status, setStatus] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledFor, setScheduledFor] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [riskConfirmed, setRiskConfirmed] = useState(false);
  const [savedRecipients, setSavedRecipients] = useState<Array<{
    value: string;
    method: 'mobile' | 'card';
    lastUsed: string;
    usageCount: number;
  }>>([]);
  const [successModal, setSuccessModal] = useState<null | {
    amount: number;
    recipient: string;
    method: 'mobile' | 'card';
    fee: number;
    netAmount: number;
    status: 'completed' | 'queued';
    scheduledFor?: string;
  }>(null);

  const HIGH_RISK_AMOUNT = 1000;
  const MAX_TRANSFER = 10000;
  const MIN_TRANSFER = 1;

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(getWalletScopedStorageKey('aurawallet_saved_recipients')) || '[]');
      if (Array.isArray(stored)) {
        setSavedRecipients(stored);
      }
    } catch {
      setSavedRecipients([]);
    }

    syncWalletActivitySnapshotCookie(walletData.transactions || []);
  }, []);

  useEffect(() => {
    if (bankCards.length === 0) return;
    const hasSelection = bankCards.some((card) => String(card.id) === selectedCardId);
    if (!hasSelection) {
      setSelectedCardId(String(bankCards[0].id));
    }
  }, [bankCards, selectedCardId]);

  const numericAmount = Number(amount || 0);

  const transferFee = useMemo(() => {
    if (!numericAmount || numericAmount <= 0) return 0;
    if (method === 'mobile') {
      const fee = numericAmount * 0.008;
      return Math.min(Math.max(fee, 0.5), 20);
    }
    const cardFee = numericAmount * 0.012;
    return Math.min(Math.max(cardFee, 1), 25);
  }, [numericAmount, method]);

  const netAmount = Math.max(numericAmount - transferFee, 0);
  const isHighRisk = numericAmount >= HIGH_RISK_AMOUNT;

  const matchingRecipients = useMemo(() => (
    savedRecipients
      .filter((item) => item.method === method)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 4)
  ), [savedRecipients, method]);

  const formatRecipient = (input: string) => input.trim();

  const validate = () => {
    const nextErrors: string[] = [];
    const value = numericAmount;
    let normalizedRecipient = '';

    if (!value || Number.isNaN(value)) {
      nextErrors.push('Enter a valid amount.');
    }

    if (value < MIN_TRANSFER) {
      nextErrors.push(`Minimum transfer is $${MIN_TRANSFER.toFixed(2)}.`);
    }

    if (value > MAX_TRANSFER) {
      nextErrors.push(`Maximum transfer is $${MAX_TRANSFER.toFixed(2)} per transaction.`);
    }

    if (value + transferFee > Number(walletData.balance || 0)) {
      nextErrors.push('Insufficient wallet balance including transfer fee.');
    }

    if (method === 'mobile') {
      normalizedRecipient = formatRecipient(mobileRecipient);
      if (!normalizedRecipient) {
        nextErrors.push('Enter a mobile money recipient number.');
      }
      const mobileOk = /^\+?[0-9]{10,15}$/.test(normalizedRecipient.replace(/\s+/g, ''));
      if (!mobileOk) {
        nextErrors.push('Mobile number must be 10-15 digits (optional + prefix).');
      }
      const networkExists = mobileNetworks.some((network) => network.id === selectedNetworkId);
      if (!networkExists) {
        nextErrors.push('Select a mobile money network.');
      }
    } else {
      const selectedCard = bankCards.find((card) => String(card.id) === selectedCardId);
      if (!selectedCard) {
        nextErrors.push('Select an AuraBank card recipient.');
      } else {
        normalizedRecipient = selectedCard.last4;
      }
    }

    if (scheduleMode === 'later') {
      if (!scheduledFor) {
        nextErrors.push('Select a scheduled date and time.');
      } else if (new Date(scheduledFor).getTime() <= Date.now()) {
        nextErrors.push('Scheduled time must be in the future.');
      }
    }

    if (isHighRisk && !riskConfirmed) {
      nextErrors.push('Confirm high-value transfer acknowledgement to continue.');
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const persistRecipient = (value: string) => {
    const cleanValue = formatRecipient(value);
    if (!cleanValue) return;

    const nowIso = new Date().toISOString();
    const existingIndex = savedRecipients.findIndex((item) => item.value === cleanValue && item.method === method);
    let updatedRecipients = [...savedRecipients];

    if (existingIndex >= 0) {
      const current = updatedRecipients[existingIndex];
      updatedRecipients[existingIndex] = {
        ...current,
        usageCount: (current.usageCount || 0) + 1,
        lastUsed: nowIso,
      };
    } else {
      updatedRecipients.push({
        value: cleanValue,
        method,
        lastUsed: nowIso,
        usageCount: 1,
      });
    }

    updatedRecipients = updatedRecipients
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 12);

    setSavedRecipients(updatedRecipients);
    localStorage.setItem(getWalletScopedStorageKey('aurawallet_saved_recipients'), JSON.stringify(updatedRecipients));
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validate()) {
      setStatus('Please resolve the highlighted issues.');
      return;
    }
    setSubmitting(true);

    const val = numericAmount;
    const selectedNetwork = mobileNetworks.find((network) => network.id === selectedNetworkId);
    const selectedCard = bankCards.find((card) => String(card.id) === selectedCardId);
    const recipientValue = method === 'mobile'
      ? formatRecipient(mobileRecipient)
      : (selectedCard?.last4 || '');
    const transactionStatus = scheduleMode === 'later' ? 'queued' : 'completed';
    const scheduledTimestamp = scheduleMode === 'later' ? new Date(scheduledFor).toISOString() : null;

    const actionId = `wallet-send-${Date.now()}`;

    walletData.balance = Math.max(0, walletData.balance - (val + transferFee));
    walletData.transactions.unshift({
      id: Date.now(),
      amount: -val,
      description: method === 'mobile'
        ? `${selectedNetwork?.name || 'Mobile Money'}: ${recipientValue}`
        : `Card: ••••${recipientValue}`,
      date: (scheduledTimestamp || new Date().toISOString()).split('T')[0],
      method,
      recipient: recipientValue,
      fee: Number(transferFee.toFixed(2)),
      netAmount: Number(netAmount.toFixed(2)),
      status: transactionStatus,
      scheduledFor: scheduledTimestamp,
      createdAt: new Date().toISOString(),
    } as unknown as (typeof walletData.transactions)[number]);
    syncWalletActivitySnapshotCookie(walletData.transactions);
    persistWalletStateForUser(getActiveWalletUserId());

    if (transactionStatus === 'completed') {
      await appendWalletLedgerEvent({
        type: 'funding.withdrawal',
        amount: Number((val + transferFee).toFixed(2)),
        description: method === 'mobile'
          ? `Wallet transfer to ${selectedNetwork?.name || 'Mobile Money'} ${recipientValue}`
          : `Wallet transfer to linked card ••••${recipientValue}`,
        metadata: {
          method,
          recipient: recipientValue,
          transferAmount: Number(val.toFixed(2)),
          fee: Number(transferFee.toFixed(2)),
          netAmount: Number(netAmount.toFixed(2)),
          sourceActionId: actionId,
        },
      });
    }

    if (scheduleMode === 'later' && scheduledTimestamp) {
      const queuedTransfers = JSON.parse(localStorage.getItem(getWalletScopedStorageKey('aurawallet_scheduled_transfers')) || '[]');
      queuedTransfers.unshift({
        id: `scheduled-${Date.now()}`,
        amount: val,
        method,
        recipient: recipientValue,
        fee: Number(transferFee.toFixed(2)),
        netAmount: Number(netAmount.toFixed(2)),
        status: 'queued',
        scheduledFor: scheduledTimestamp,
      });
      localStorage.setItem(getWalletScopedStorageKey('aurawallet_scheduled_transfers'), JSON.stringify(queuedTransfers));
    }

    persistRecipient(recipientValue);

    const snapshot = {
      userId: getActiveWalletUserId(),
      balance: Number(walletData.balance || 0),
      updatedAt: new Date().toISOString(),
    };
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `aurawallet_balance_snapshot=${encodeURIComponent(JSON.stringify(snapshot))}; expires=${expires}; path=/; SameSite=Lax`;

    setStatus(scheduleMode === 'later' ? 'Transfer queued successfully' : 'Transfer sent');
    setAmount('');
    setMobileRecipient('');
    setScheduleMode('now');
    setScheduledFor('');
    setRiskConfirmed(false);
    setErrors([]);
    setSuccessModal({
      amount: val,
      recipient: method === 'mobile' ? recipientValue : `••••${recipientValue}`,
      method,
      fee: Number(transferFee.toFixed(2)),
      netAmount: Number(netAmount.toFixed(2)),
      status: transactionStatus,
      scheduledFor: scheduledTimestamp || undefined,
    });
    if (onComplete) {
      onComplete();
    }
    setTimeout(() => setStatus(''), 2500);
    setSubmitting(false);
  }

  return (
    <form onSubmit={submit} className="rounded-xl">
      <div className="mb-3">
        <label className="text-white/80 text-base font-semibold">Amount</label>
        <input
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white caret-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent" style={{ colorScheme: 'dark' }}
        />
      </div>

      <div className="mb-3">
        <label className="text-white/80 text-base font-semibold">Method</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {methodOptions.map((option) => {
            const active = method === option.id;
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setMethod(option.id)}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'border-green-400/40 bg-green-500/10 text-white shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:-translate-y-0.5'
                }`}
              >
                <span className={`relative flex items-center justify-center w-9 h-9 rounded-full bg-white overflow-hidden ring-2 ${option.ring} flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
                  {active && <span className={`absolute inset-0 ${option.glow} blur-lg animate-pulse`} />}
                  {option.logo ? (
                    <img src={option.logo} alt={option.label} className="relative w-full h-full object-cover" />
                  ) : Icon ? (
                    <Icon className="relative w-4 h-4 text-emerald-600" />
                  ) : null}
                </span>
                {option.label}
                {active && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-2">
        <label className="text-white/80 text-base font-semibold">Send Time</label>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setScheduleMode('now')}
            className={`px-3 py-1.5 rounded-lg text-base font-semibold transition-all duration-200 ${scheduleMode === 'now' ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}
          >
            Now
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode('later')}
            className={`px-3 py-1.5 rounded-lg text-base font-semibold transition-all duration-200 ${scheduleMode === 'later' ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}
          >
            Later
          </button>
        </div>
      </div>

      {scheduleMode === 'later' && (
        <div className="mb-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <label className="text-white/80 text-base font-semibold">Schedule For</label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white caret-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent" style={{ colorScheme: 'dark' }}
          />
        </div>
      )}

      {method === 'mobile' ? (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="mb-3">
            <label className="text-white/80 text-base font-semibold">Mobile Money Network</label>
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
          </div>

          <div className="mb-3">
            <label className="text-white/80 text-base font-semibold">Recipient (phone number)</label>
            <input
              value={mobileRecipient}
              onChange={(e)=>setMobileRecipient(e.target.value)}
              placeholder="+233..."
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white caret-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent" style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <label className="text-white/80 text-base font-semibold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white overflow-hidden ring-1 ring-indigo-400/40">
              <img src="/app-logos/bank.jpg" alt="AuraBank" className="w-full h-full object-cover" />
            </span>
            AuraBank Card Recipient
          </label>
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white caret-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-transparent" style={{ colorScheme: 'dark' }}
          >
            {bankCards.map((card) => (
              <option key={card.id} value={String(card.id)} className="text-black">
                {card.brand} {String(card.type).toUpperCase()} ••••{card.last4}
              </option>
            ))}
          </select>
        </div>
      )}

      {method === 'mobile' && matchingRecipients.length > 0 && (
        <div className="mb-3">
          <p className="text-white/75 text-sm font-medium mb-2">Saved Recipients</p>
          <div className="flex flex-wrap gap-2">
            {matchingRecipients.map((item) => (
              <button
                key={`${item.method}-${item.value}`}
                type="button"
                onClick={() => setMobileRecipient(item.value)}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
              >
                {item.value}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 rounded-lg border border-white/15 bg-white/5 p-3">
        <div className="flex items-center justify-between text-sm text-white/80">
          <span>Transfer Amount</span>
          <span className="font-semibold">${numericAmount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-white/80 mt-1">
          <span>Fee</span>
          <span className="font-semibold">${transferFee.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-white mt-2 pt-2 border-t border-white/10">
          <span className="font-semibold">Recipient Gets</span>
          <span className="font-bold">${netAmount.toFixed(2)}</span>
        </div>
      </div>

      {isHighRisk && (
        <div className="mb-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
          <p className="text-amber-200 text-sm font-semibold mb-2">High-value transfer warning</p>
          <label className="flex items-start gap-2 text-amber-100 text-sm">
            <input
              type="checkbox"
              checked={riskConfirmed}
              onChange={(e) => setRiskConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            <span>I confirm this high-value transfer and recipient details are correct.</span>
          </label>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mb-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3">
          <ul className="space-y-1 text-red-200 text-sm">
            {errors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={submitting}
          className="group relative overflow-hidden bg-gradient-to-r from-black via-white/15 to-green-500 text-white px-5 py-2.5 rounded-xl text-base font-bold hover:opacity-90 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          {submitting ? (
            <span className="relative flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending…
            </span>
          ) : (
            <span className="relative flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Send
            </span>
          )}
        </button>
        <div className="text-white/80 text-base font-medium">{status}</div>
      </div>

      {successModal && (() => {
        const isQueued = successModal.status === 'queued';
        const confettiColors = isQueued
          ? ['#fbbf24','#f59e0b','#fcd34d','#fb923c','#fdba74','#fef08a']
          : ['#34d399','#4ade80','#a3e635','#86efac','#6ee7b7','#d9f99d'];
        const svgStroke = isQueued ? '#fbbf24' : '#34d399';
        const pingBg   = isQueued ? 'bg-yellow-500/10' : 'bg-emerald-500/10';
        const badge    = isQueued ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
        const dot      = isQueued ? 'bg-yellow-400' : 'bg-emerald-400';
        const glow1    = isQueued ? 'bg-yellow-500/20' : 'bg-emerald-500/20';
        const glow2    = isQueued ? 'bg-amber-500/15' : 'bg-green-500/15';
        const btnGrad  = isQueued ? 'from-yellow-500 to-amber-400 shadow-yellow-500/20' : 'from-emerald-600 to-green-500 shadow-emerald-500/20';
        const angles   = [0,45,90,135,180,225,270,315,22,67,112,247];
        return (
          <>
            <style>{`
              @keyframes wSendConfetti { 0%{transform:translate(0,0) scale(0);opacity:1} 60%{opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(0.25);opacity:0} }
              @keyframes wSendCheck   { from{stroke-dashoffset:48}  to{stroke-dashoffset:0}   }
              @keyframes wSendCircle  { from{stroke-dashoffset:166} to{stroke-dashoffset:0}   }
              @keyframes wSendPop     { from{opacity:0;transform:scale(0.82) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
            `}</style>
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
              onClick={() => setSuccessModal(null)}
            >
              <div
                className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#080d1a] border border-white/12 shadow-2xl"
                style={{ animation: 'wSendPop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-25 ${glow1}`} />
                <div className={`pointer-events-none absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-15 ${glow2}`} />

                {/* Confetti */}
                <div className="absolute inset-0 flex items-start justify-center pt-12 pointer-events-none overflow-hidden">
                  {angles.map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const dist = 72 + (i % 3) * 12;
                    return (
                      <span
                        key={i}
                        className="absolute w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: confettiColors[i % confettiColors.length],
                          '--dx': `${Math.round(Math.sin(rad) * dist)}px`,
                          '--dy': `${Math.round(-Math.cos(rad) * dist)}px`,
                          animation: `wSendConfetti 0.75s ease-out ${(i * 0.03).toFixed(2)}s forwards`,
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>

                <div className="p-6">
                  {/* Close */}
                  <div className="flex justify-end mb-1">
                    <button onClick={() => setSuccessModal(null)} className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center hover:rotate-90 transition-all duration-200">
                      <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>

                  {/* Animated checkmark */}
                  <div className="flex justify-center mb-5">
                    <div className="relative w-20 h-20">
                      <div className={`absolute inset-0 rounded-full ${pingBg} animate-ping`} style={{ animationDuration: '1.6s', animationDelay: '0.5s' }} />
                      <svg viewBox="0 0 52 52" className="relative w-20 h-20" fill="none">
                        <defs>
                          <linearGradient id="wSendGrad" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                            <stop stopColor={svgStroke} /><stop offset="1" stopColor={isQueued ? '#fb923c' : '#a3e635'} />
                          </linearGradient>
                        </defs>
                        <circle cx="26" cy="26" r="24" stroke="url(#wSendGrad)" strokeWidth="2"
                          style={{ strokeDasharray: 166, animation: 'wSendCircle 0.5s ease-out forwards' }} />
                        {isQueued ? (
                          <text x="26" y="31" textAnchor="middle" fontSize="16" fill={svgStroke}>⏱</text>
                        ) : (
                          <path d="M14 27l8 8 16-16" stroke={svgStroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                            style={{ strokeDasharray: 48, strokeDashoffset: 48, animation: 'wSendCheck 0.4s ease-out 0.45s forwards' }} />
                        )}
                      </svg>
                    </div>
                  </div>

                  {/* Amount + badge */}
                  <div className="text-center mb-5">
                    <div className={`inline-flex items-center gap-1.5 rounded-full border ${badge} px-3 py-1 text-xs font-semibold mb-2`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
                      {isQueued ? 'Transfer Queued' : 'Transfer Successful'}
                    </div>
                    <p className="text-4xl font-black text-white mt-1">${successModal.amount.toFixed(2)}</p>
                    <p className="text-white/40 text-xs mt-1">{isQueued ? 'scheduled to send' : 'sent successfully'}</p>
                  </div>

                  {/* Method + recipient row */}
                  <div className="flex items-center justify-center gap-4 mb-5 bg-white/5 border border-white/8 rounded-2xl py-3.5 px-5">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-emerald-400/40 block">
                        <img src={successModal.method === 'mobile' ? '/app-logos/mobilemoney.jpg' : '/app-logos/bank.jpg'} alt="method" className="w-full h-full object-cover" />
                      </span>
                      <span className="text-[10px] text-white/50">{successModal.method === 'mobile' ? 'Mobile Money' : 'AuraBank Card'}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-1 justify-center">
                      <span className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-500/50" />
                      <ArrowRight className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0" />
                      <span className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{successModal.recipient.slice(0, 4)}</span>
                      </div>
                      <span className="text-[10px] text-white/50 max-w-[70px] truncate text-center">{successModal.recipient}</span>
                    </div>
                  </div>

                  {/* Receipt */}
                  <div className="space-y-1.5 rounded-2xl bg-white/5 border border-white/8 p-4 mb-5 text-xs">
                    <div className="flex justify-between"><span className="text-white/40">Fee</span><span className="text-white/70 font-medium">${successModal.fee.toFixed(2)}</span></div>
                    <div className="flex justify-between border-t border-white/8 pt-1.5 mt-1"><span className="text-white/40">Recipient gets</span><span className="text-white font-bold">${successModal.netAmount.toFixed(2)}</span></div>
                    {successModal.scheduledFor && (
                      <div className="flex justify-between border-t border-white/8 pt-1.5 mt-1">
                        <span className="text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> Scheduled</span>
                        <span className="text-white/70 font-medium">{new Date(successModal.scheduledFor).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSuccessModal(null)}
                    className={`group/done relative w-full overflow-hidden rounded-xl py-3 font-bold text-sm text-white bg-gradient-to-r ${btnGrad} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover/done:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <span className="relative">Done</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </form>
  );
}
