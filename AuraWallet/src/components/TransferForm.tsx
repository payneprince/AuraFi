"use client";
import { useEffect, useMemo, useState } from 'react';
import { CircleCheckBig } from 'lucide-react';
import WalletModal from '@/components/WalletModal';
import { auraBankCards } from '@/components/CardManager';
// @ts-ignore
import { walletData } from '@/lib/shared/mock-data';

export default function TransferForm({ onComplete }: { onComplete?: () => void }) {
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

  const mobileNetworks = [
    { id: 'mtn', name: 'MTN Mobile Money' },
    { id: 'telecel', name: 'Telecel Cash' },
    { id: 'airteltigo', name: 'AirtelTigo Money' },
  ];

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'mobile'|'card'>('mobile');
  const [mobileRecipient, setMobileRecipient] = useState('');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(mobileNetworks[0].id);
  const [selectedCardId, setSelectedCardId] = useState<string>(String(bankCards[0]?.id || ''));
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
      const stored = JSON.parse(localStorage.getItem('aurawallet_saved_recipients') || '[]');
      if (Array.isArray(stored)) {
        setSavedRecipients(stored);
      }
    } catch {
      setSavedRecipients([]);
    }
  }, []);

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
    localStorage.setItem('aurawallet_saved_recipients', JSON.stringify(updatedRecipients));
  };

  function submit(e: any) {
    e.preventDefault();

    if (!validate()) {
      setStatus('Please resolve the highlighted issues.');
      return;
    }

    const val = numericAmount;
    const selectedNetwork = mobileNetworks.find((network) => network.id === selectedNetworkId);
    const selectedCard = bankCards.find((card) => String(card.id) === selectedCardId);
    const recipientValue = method === 'mobile'
      ? formatRecipient(mobileRecipient)
      : (selectedCard?.last4 || '');
    const transactionStatus = scheduleMode === 'later' ? 'queued' : 'completed';
    const scheduledTimestamp = scheduleMode === 'later' ? new Date(scheduledFor).toISOString() : null;

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
    });

    if (scheduleMode === 'later' && scheduledTimestamp) {
      const queuedTransfers = JSON.parse(localStorage.getItem('aurawallet_scheduled_transfers') || '[]');
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
      localStorage.setItem('aurawallet_scheduled_transfers', JSON.stringify(queuedTransfers));
    }

    persistRecipient(recipientValue);

    const snapshot = {
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
    onComplete && onComplete();
    setTimeout(() => setStatus(''), 2500);
  }

  return (
    <form onSubmit={submit} className="rounded-xl">
      <div className="mb-2">
        <label className="text-white/80 text-base font-semibold">Amount</label>
        <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0.00" className="w-full mt-1 px-3 py-2 rounded-lg bg-transparent border border-white/15 text-white" />
      </div>

      <div className="mb-2">
        <label className="text-white/80 text-base font-semibold">Method</label>
        <div className="flex gap-2 mt-1">
          <button type="button" onClick={()=>setMethod('mobile')} className={`px-3 py-1.5 rounded-lg text-base font-semibold ${method==='mobile' ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>Mobile Money</button>
          <button type="button" onClick={()=>setMethod('card')} className={`px-3 py-1.5 rounded-lg text-base font-semibold ${method==='card' ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>AuraBank Card</button>
        </div>
      </div>

      <div className="mb-2">
        <label className="text-white/80 text-base font-semibold">Send Time</label>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setScheduleMode('now')}
            className={`px-3 py-1.5 rounded-lg text-base font-semibold ${scheduleMode === 'now' ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}
          >
            Now
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode('later')}
            className={`px-3 py-1.5 rounded-lg text-base font-semibold ${scheduleMode === 'later' ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}
          >
            Later
          </button>
        </div>
      </div>

      {scheduleMode === 'later' && (
        <div className="mb-3">
          <label className="text-white/80 text-base font-semibold">Schedule For</label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-transparent border border-white/15 text-white"
          />
        </div>
      )}

      {method === 'mobile' ? (
        <>
          <div className="mb-3">
            <label className="text-white/80 text-base font-semibold">Mobile Money Network</label>
            <select
              value={selectedNetworkId}
              onChange={(e) => setSelectedNetworkId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-transparent border border-white/15 text-white"
            >
              {mobileNetworks.map((network) => (
                <option key={network.id} value={network.id} className="text-black">
                  {network.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="text-white/80 text-base font-semibold">Recipient (phone number)</label>
            <input
              value={mobileRecipient}
              onChange={(e)=>setMobileRecipient(e.target.value)}
              placeholder="+233..."
              className="w-full mt-1 px-3 py-2 rounded-lg bg-transparent border border-white/15 text-white"
            />
          </div>
        </>
      ) : (
        <div className="mb-3">
          <label className="text-white/80 text-base font-semibold">AuraBank Card Recipient</label>
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-transparent border border-white/15 text-white"
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
        <button type="submit" className="bg-gradient-to-r from-black via-white/15 to-green-500 text-white px-4 py-2 rounded-lg text-base font-bold hover:opacity-90">Send</button>
        <div className="text-white/80 text-base font-medium">{status}</div>
      </div>

      {successModal && (
        <WalletModal
          title={successModal.status === 'queued' ? 'Transfer Queued' : 'Transaction Successful'}
          onClose={() => setSuccessModal(null)}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-green-400/30 bg-green-500/10 p-3 text-green-200">
              <CircleCheckBig className="w-5 h-5" />
              <span className="font-semibold">
                {successModal.status === 'queued' ? 'Your transfer is scheduled.' : 'Your transfer was completed.'}
              </span>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-white/80">
                <span>Method</span>
                <span className="text-white font-semibold">{successModal.method === 'mobile' ? 'Mobile Money' : 'AuraBank Card'}</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Recipient</span>
                <span className="text-white font-semibold">{successModal.recipient}</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Amount</span>
                <span className="text-white font-semibold">${successModal.amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Fee</span>
                <span className="text-white font-semibold">${successModal.fee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-white border-t border-white/10 pt-2 mt-2">
                <span className="font-semibold">Recipient Gets</span>
                <span className="font-bold">${successModal.netAmount.toFixed(2)}</span>
              </div>
              {successModal.scheduledFor && (
                <div className="flex items-center justify-between text-white/80 border-t border-white/10 pt-2 mt-2">
                  <span>Scheduled For</span>
                  <span className="text-white font-semibold">{new Date(successModal.scheduledFor).toLocaleString()}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSuccessModal(null)}
              className="w-full rounded-lg px-4 py-2 bg-gradient-to-r from-black via-white/15 to-green-500 text-white font-bold"
            >
              Done
            </button>
          </div>
        </WalletModal>
      )}
    </form>
  );
}
