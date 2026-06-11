"use client";
import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { auraBankCards } from '@/components/CardManager';
// @ts-ignore
import { walletData, bankData } from '@/lib/shared/mock-data';
import { appendWalletLedgerEvent, getActiveWalletUserId, getWalletScopedStorageKey, persistWalletStateForUser } from '@/lib/wallet-state';

// Auto-detect Ghana MoMo network from phone prefix
function detectMomoCode(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^233/, '0');
  if (/^0(24|54|55|59|57)/.test(digits)) return 'MTN';
  if (/^0(20|50)/.test(digits)) return 'VOD';
  if (/^0(27|56|26)/.test(digits)) return 'ATL';
  return 'MTN'; // default
}

const LOGO_ROW_SRCS = [
  '/app-logos/mtnmomo.png', '/app-logos/telecelcash.jpg', '/app-logos/atmoney.jpg',
  '/logos/banks/gh/ecobank.png', '/logos/banks/gh/gcb.png', '/logos/banks/gh/absa.png',
];
const CARD_LOGO_SRCS = ['/app-logos/visa.svg', '/app-logos/mastercard.svg', '/app-logos/amex.svg'];

const RAILS = [
  { id: 'bank'     as const, label: 'AuraBank', logo: '/app-logos/bank.jpg',      sub: 'Instant · Internal' },
  { id: 'paystack' as const, label: 'Paystack',  logo: '/app-logos/paystack.png', sub: 'MoMo · Card · Bank'  },
];

const QUICK_AMOUNTS = [20, 50, 100, 200];
const HIGH_RISK = 1000;

function parseCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  return document.cookie.split(';').map(s => s.trim()).filter(Boolean).reduce((acc, s) => {
    const i = s.indexOf('='); if (i === -1) return acc;
    acc[s.slice(0, i)] = s.slice(i + 1); return acc;
  }, {} as Record<string, string>);
}

function syncActivityCookie(txs: any[]) {
  if (typeof document === 'undefined') return;
  const uid = getActiveWalletUserId();
  const events = (txs || []).map((t: any) => {
    const raw = String(t?.createdAt || t?.date || new Date().toISOString());
    const ts = Number.isNaN(Date.parse(raw)) ? new Date().toISOString() : new Date(raw).toISOString();
    return { id: `aurawallet-${String(t?.id || Date.now())}`, app: 'AuraWallet', type: 'wallet_transfer', title: String(t?.description || 'Transfer'), amount: Number(t?.amount || 0), currency: 'USD', userId: uid, timestamp: ts, status: String(t?.status || 'completed'), meta: {} };
  }).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 40);
  const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `aurawallet_activity_snapshot=${encodeURIComponent(JSON.stringify(events))}; expires=${exp}; path=/; SameSite=Lax`;
}

export default function TransferForm({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [rail, setRail] = useState<'bank' | 'paystack'>('bank');

  // AuraBank fields
  const [auraBankSnapshot, setAuraBankSnapshot] = useState<any | null>(null);
  const [auraSourceType, setAuraSourceType] = useState<'account' | 'card'>('account');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');

  // Paystack fields
  const [momoPhone, setMomoPhone] = useState('');
  const [momoName, setMomoName] = useState('');

  // Common
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledFor, setScheduledFor] = useState('');
  const [riskConfirmed, setRiskConfirmed] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [savedRecipients, setSavedRecipients] = useState<Array<{ value: string; network: string; lastUsed: string; usageCount: number }>>([]);
  const [successData, setSuccessData] = useState<null | { amount: number; recipient: string; method: string; fee: number; net: number; status: 'completed' | 'queued' | 'pending'; scheduledFor?: string; reference?: string }>(null);

  // fallback accounts from mock bankData
  const fallbackAccounts = useMemo(() => (bankData?.accounts || []).map((a: any, i: number) => ({
    id: `fb-acct-${i}`, name: String(a.type || 'Account').toUpperCase(), type: a.type,
    balance: Number(a.balance || 0), accountNumber: String(a.accountNumber || ''), currency: 'USD',
  })), []);

  useEffect(() => {
    try {
      const enc = parseCookies().aurabank_sources_snapshot;
      setAuraBankSnapshot(enc ? JSON.parse(decodeURIComponent(enc)) : null);
    } catch { setAuraBankSnapshot(null); }
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(getWalletScopedStorageKey('aurawallet_saved_recipients')) || '[]');
      if (Array.isArray(stored)) setSavedRecipients(stored);
    } catch { setSavedRecipients([]); }
    syncActivityCookie(walletData.transactions || []);
  }, []);

  const bankAccounts = useMemo(() => {
    const snap = auraBankSnapshot?.accounts;
    if (Array.isArray(snap) && snap.length > 0) {
      return snap.map((a: any, i: number) => ({
        id: `snap-acct-${i}`, name: String(a?.name ?? a?.type ?? 'Account').toUpperCase(),
        type: String(a?.type ?? 'Account'), balance: Number(a?.balance ?? 0),
        accountNumber: String(a?.accountNumber ?? ''), currency: String(a?.currency ?? 'USD'),
      }));
    }
    return fallbackAccounts;
  }, [auraBankSnapshot, fallbackAccounts]);

  const bankCards = useMemo(() => {
    const snap = auraBankSnapshot?.cards;
    if (Array.isArray(snap) && snap.length > 0) {
      return snap.filter((c: any) => String(c.status || 'active').toLowerCase() === 'active')
        .map((c: any, i: number) => ({
          id: `snap-card-${i}`, brand: String(c?.brand || 'AuraBank').toUpperCase(),
          type: String(c?.type || 'Debit'), last4: String(c?.last4 ?? String(c?.cardNumber || '').slice(-4)),
        }));
    }
    return auraBankCards.map((c, i) => ({ id: `fb-card-${i}`, brand: c.brand, type: c.type, last4: c.last4 }));
  }, [auraBankSnapshot]);

  useEffect(() => {
    if (bankAccounts.length && !bankAccounts.some((a: any) => a.id === selectedAccountId)) setSelectedAccountId(String(bankAccounts[0].id));
  }, [bankAccounts, selectedAccountId]);

  useEffect(() => {
    if (bankCards.length && !bankCards.some(c => c.id === selectedCardId)) setSelectedCardId(String(bankCards[0].id));
  }, [bankCards, selectedCardId]);

  const numAmt = Number(amount || 0);
  const fee = useMemo(() => {
    if (!numAmt || numAmt <= 0) return 0;
    return rail === 'bank' ? 0 : Math.min(Math.max(numAmt * 0.008, 0.5), 20);
  }, [numAmt, rail]);
  const netAmt = Math.max(numAmt - fee, 0);
  const isHighRisk = numAmt >= HIGH_RISK;

  const recentRecipients = useMemo(() =>
    savedRecipients.sort((a, b) => b.usageCount - a.usageCount).slice(0, 4),
  [savedRecipients]);

  function validate() {
    if (!numAmt || Number.isNaN(numAmt) || numAmt <= 0) { setFormError('Enter a valid amount greater than 0.'); return false; }
    if (numAmt > 10000) { setFormError('Maximum transfer is $10,000.'); return false; }
    if (numAmt + fee > Number(walletData.balance || 0)) { setFormError('Insufficient wallet balance.'); return false; }
    if (rail === 'paystack') {
      if (!momoPhone.trim()) { setFormError('Enter recipient phone or account number.'); return false; }
      if (!momoName.trim()) { setFormError('Enter the account holder name.'); return false; }
    } else {
      if (auraSourceType === 'account' && !bankAccounts.some((a: any) => a.id === selectedAccountId)) { setFormError('Select an AuraBank account.'); return false; }
      if (auraSourceType === 'card' && !bankCards.some(c => c.id === selectedCardId)) { setFormError('Select an AuraBank card.'); return false; }
    }
    if (scheduleMode === 'later') {
      if (!scheduledFor) { setFormError('Select a scheduled date and time.'); return false; }
      if (new Date(scheduledFor).getTime() <= Date.now()) { setFormError('Scheduled time must be in the future.'); return false; }
    }
    if (isHighRisk && !riskConfirmed) { setFormError('Confirm the high-value transfer to continue.'); return false; }
    setFormError('');
    return true;
  }

  function handleContinue() { if (validate()) setStep('confirm'); }

  function persistRecipient(phone: string) {
    if (!phone.trim()) return;
    const now = new Date().toISOString();
    const idx = savedRecipients.findIndex(r => r.value === phone.trim());
    let updated = [...savedRecipients];
    if (idx >= 0) updated[idx] = { ...updated[idx], usageCount: (updated[idx].usageCount || 0) + 1, lastUsed: now };
    else updated.push({ value: phone.trim(), network: '', lastUsed: now, usageCount: 1 });
    updated = updated.sort((a, b) => b.usageCount - a.usageCount).slice(0, 12);
    setSavedRecipients(updated);
    localStorage.setItem(getWalletScopedStorageKey('aurawallet_saved_recipients'), JSON.stringify(updated));
  }

  function commitLocal(status: 'completed' | 'queued' | 'pending', recipientLabel: string, methodLabel: string, scheduledTs: string | null) {
    walletData.balance = Math.max(0, walletData.balance - (numAmt + fee));
    walletData.transactions.unshift({
      id: Date.now(), amount: -numAmt, description: `Transfer to ${recipientLabel}`,
      date: (scheduledTs || new Date().toISOString()).split('T')[0],
      method: rail, recipient: recipientLabel, fee: Number(fee.toFixed(2)),
      netAmount: Number(netAmt.toFixed(2)), status, scheduledFor: scheduledTs,
      createdAt: new Date().toISOString(),
    } as any);
    syncActivityCookie(walletData.transactions);
    persistWalletStateForUser(getActiveWalletUserId());
    const snap = { userId: getActiveWalletUserId(), balance: Number(walletData.balance || 0), updatedAt: new Date().toISOString() };
    const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `aurawallet_balance_snapshot=${encodeURIComponent(JSON.stringify(snap))}; expires=${exp}; path=/; SameSite=Lax`;
    if (status === 'completed') {
      appendWalletLedgerEvent({ type: 'funding.withdrawal', amount: Number((numAmt + fee).toFixed(2)), description: `Wallet transfer to ${recipientLabel}`, metadata: { method: rail, recipient: recipientLabel, fee: Number(fee.toFixed(2)) } });
    }
    if (scheduleMode === 'later' && scheduledTs) {
      const q = JSON.parse(localStorage.getItem(getWalletScopedStorageKey('aurawallet_scheduled_transfers')) || '[]');
      q.unshift({ id: `sched-${Date.now()}`, amount: numAmt, method: rail, recipient: recipientLabel, status: 'queued', scheduledFor: scheduledTs });
      localStorage.setItem(getWalletScopedStorageKey('aurawallet_scheduled_transfers'), JSON.stringify(q));
    }
  }

  async function handleConfirm() {
    setSubmitting(true);
    setFormError('');
    const scheduledTs = scheduleMode === 'later' ? new Date(scheduledFor).toISOString() : null;

    if (rail === 'paystack' && scheduleMode === 'now') {
      try {
        const res = await fetch('/api/paystack/transfer', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: numAmt, currency: 'GHS', recipientType: 'mobile_money', accountNumber: momoPhone.trim().replace(/\s+/g, ''), bankCode: detectMomoCode(momoPhone), name: momoName.trim(), reason: note || 'AuraWallet transfer' }),
        });
        const data = await res.json() as any;
        const isPending = !data.success && data.code === 'transfer_unavailable';
        if (!data.success && !isPending) { setFormError(data.error || 'Transfer failed. Try again.'); setSubmitting(false); return; }
        const finalStatus = isPending ? 'pending' : 'completed';
        commitLocal(finalStatus, momoPhone.trim(), 'Paystack', null);
        persistRecipient(momoPhone.trim());
        setSuccessData({ amount: numAmt, recipient: momoPhone.trim(), method: 'Paystack', fee: Number(fee.toFixed(2)), net: Number(netAmt.toFixed(2)), status: finalStatus, reference: data.reference });
      } catch { setFormError('Network error. Check your connection.'); setSubmitting(false); return; }
    } else {
      const acct = bankAccounts.find((a: any) => a.id === selectedAccountId) as any;
      const card = bankCards.find(c => c.id === selectedCardId);
      const recipientLabel = rail === 'bank'
        ? (auraSourceType === 'account' ? `${acct?.name || 'AuraBank'} ••••${String(acct?.accountNumber || '').slice(-4)}` : `${card?.brand || 'AuraBank'} ••••${card?.last4}`)
        : momoPhone.trim();
      const status = scheduleMode === 'later' ? 'queued' : 'completed';
      commitLocal(status, recipientLabel, rail === 'bank' ? 'AuraBank' : 'Paystack', scheduledTs);
      setSuccessData({ amount: numAmt, recipient: recipientLabel, method: rail === 'bank' ? 'AuraBank' : 'Paystack', fee: Number(fee.toFixed(2)), net: Number(netAmt.toFixed(2)), status, scheduledFor: scheduledTs || undefined });
    }

    setStep('success');
    setSubmitting(false);
    if (onComplete) onComplete();
  }

  function reset() {
    setStep('form'); setAmount(''); setNote(''); setMomoPhone(''); setMomoName('');
    setScheduleMode('now'); setScheduledFor(''); setRiskConfirmed(false);
    setFormError(''); setSuccessData(null);
  }

  // ── FORM ───────────────────────────────────────────────────────────────────
  if (step === 'form') return (
    <div className="space-y-3">
      {/* Rail picker */}
      <div>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5">Payment Method</p>
        <div className="grid grid-cols-2 gap-2">
          {RAILS.map(r => (
            <button key={r.id} type="button" onClick={() => { setRail(r.id); setFormError(''); }}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 ${rail === r.id ? 'border-green-500/40 bg-green-500/8' : 'border-white/10 bg-white/5 opacity-60 hover:opacity-100'}`}>
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
                <img src={r.logo} alt={r.label} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              </div>
              <p className={`text-xs font-bold ${rail === r.id ? 'text-green-400' : 'text-white/50'}`}>{r.label}</p>
              <p className="text-[9px] text-white/30 leading-tight text-center">{r.sub}</p>
              {rail === r.id && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
            </button>
          ))}
        </div>
      </div>

      {/* AuraBank info box */}
      {rail === 'bank' && (
        <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/20 px-3 py-2.5 text-xs space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400">⚡</span>
            <span className="text-indigo-200/80">AuraBank transfers settle <span className="font-semibold text-indigo-100">instantly</span> with no fees.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-indigo-200/40 text-[11px]">Accepted:</span>
            <div className="flex items-center -space-x-1">
              {CARD_LOGO_SRCS.map(src => (
                <img key={src} src={src} alt="" className="w-8 h-5 rounded object-contain bg-white ring-1 ring-black/20 p-0.5"
                  onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
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
            ? <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} style={{ colorScheme: 'dark' }}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                {(bankAccounts as any[]).map((a: any) => <option key={a.id} value={String(a.id)} className="text-black">{a.name || a.type} ••••{String(a.accountNumber || '').slice(-4)}</option>)}
              </select>
            : <p className="text-white/30 text-[11px]">No AuraBank accounts linked.</p>
          )}
          {auraSourceType === 'card' && (bankCards.length > 0
            ? <select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} style={{ colorScheme: 'dark' }}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                {bankCards.map(c => <option key={c.id} value={String(c.id)} className="text-black">{c.brand} {c.type.toUpperCase()} ••••{c.last4}</option>)}
              </select>
            : <p className="text-white/30 text-[11px]">No AuraBank cards linked.</p>
          )}
        </div>
      )}

      {/* Paystack info box */}
      {rail === 'paystack' && (
        <div className="rounded-xl bg-yellow-500/8 border border-yellow-500/20 px-3 py-2.5 text-xs space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 mt-0.5">⏳</span>
            <p className="text-white/60">Transfers reflected within <span className="font-semibold text-white">1–3 business days</span>.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/40 text-[11px]">Send to:</span>
            <div className="flex items-center -space-x-1.5">
              {LOGO_ROW_SRCS.map(src => (
                <img key={src} src={src} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-black/30 bg-white"
                  onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              ))}
            </div>
            <span className="text-white/30 text-[10px]">MTN, Telecel, AirtelTigo, banks + more</span>
          </div>
          <input type="tel" value={momoPhone} onChange={e => setMomoPhone(e.target.value)} placeholder="MoMo or bank account number"
            style={{ colorScheme: 'dark' }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-yellow-500/20" />
          <input type="text" value={momoName} onChange={e => setMomoName(e.target.value)} placeholder="Account holder name"
            style={{ colorScheme: 'dark' }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-yellow-500/20" />
          {/* Saved recipients */}
          {recentRecipients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {recentRecipients.map(r => (
                <button key={r.value} type="button" onClick={() => setMomoPhone(r.value)}
                  className="px-2 py-0.5 rounded-full bg-white/8 hover:bg-white/15 text-white/50 hover:text-white text-[10px] font-medium transition-all border border-white/10">
                  {r.value}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick amounts */}
      <div className="flex gap-1.5">
        {QUICK_AMOUNTS.map(q => (
          <button key={q} type="button" onClick={() => setAmount(String(q))}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${numAmt === q ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}>
            ${q}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-500/30 transition-all">
        <span className="flex items-center px-3 text-white/40 text-sm font-bold border-r border-white/10">$</span>
        <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
          style={{ colorScheme: 'dark' }}
          className="flex-1 bg-transparent px-3 py-2.5 text-white font-semibold text-sm placeholder:text-white/25 focus:outline-none" />
      </div>

      {/* Fee (Paystack only) */}
      {rail === 'paystack' && numAmt > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 space-y-1.5 text-xs animate-in fade-in duration-200">
          <div className="flex justify-between text-white/50"><span>Transfer Amount</span><span className="font-medium text-white/70">${numAmt.toFixed(2)}</span></div>
          <div className="flex justify-between text-white/50"><span>Fee (0.8%)</span><span className="font-medium text-white/70">${fee.toFixed(2)}</span></div>
          <div className="flex justify-between text-white pt-1.5 border-t border-white/10"><span className="font-semibold">Recipient Gets</span><span className="font-bold">${netAmt.toFixed(2)}</span></div>
        </div>
      )}

      {/* Note */}
      <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" maxLength={80}
        style={{ colorScheme: 'dark' }}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-green-500/20" />

      {/* Schedule */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {(['now', 'later'] as const).map(m => (
            <button key={m} type="button" onClick={() => setScheduleMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${scheduleMode === m ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
              {m === 'now' ? 'Send Now' : 'Schedule'}
            </button>
          ))}
        </div>
        {scheduleMode === 'later' && (
          <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} style={{ colorScheme: 'dark' }}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-green-500/30 animate-in fade-in duration-200" />
        )}
      </div>

      {/* High-risk warning */}
      {isHighRisk && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs animate-in fade-in duration-200">
          <p className="text-amber-300 font-semibold mb-2">High-value transfer</p>
          <label className="flex items-start gap-2 text-amber-100 cursor-pointer">
            <input type="checkbox" checked={riskConfirmed} onChange={e => setRiskConfirmed(e.target.checked)} className="mt-0.5 accent-amber-400" />
            <span>I confirm this transfer and recipient details are correct.</span>
          </label>
        </div>
      )}

      {formError && <p className="text-red-400 text-xs animate-in fade-in duration-200">{formError}</p>}

      <button type="button" onClick={handleContinue}
        className="group relative w-full overflow-hidden rounded-xl px-4 py-2.5 text-white font-bold text-sm transition-all hover:-translate-y-0.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30">
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <span className="relative">Continue to Send →</span>
      </button>
    </div>
  );

  // ── CONFIRM ────────────────────────────────────────────────────────────────
  if (step === 'confirm') {
    const acct = (bankAccounts as any[]).find((a: any) => a.id === selectedAccountId);
    const card = bankCards.find(c => c.id === selectedCardId);
    const recipientLabel = rail === 'bank'
      ? (auraSourceType === 'account' ? `${acct?.name || 'AuraBank'} ••••${String(acct?.accountNumber || '').slice(-4)}` : `${card?.brand || 'AuraBank'} ••••${card?.last4}`)
      : momoPhone.trim();
    const rows = [
      { label: 'Action',     value: 'Send Money' },
      { label: 'Amount',     value: `$${numAmt.toFixed(2)}` },
      { label: 'Method',     value: rail === 'bank' ? 'AuraBank' : 'Paystack' },
      ...(rail === 'paystack' ? [{ label: 'Fee', value: `$${fee.toFixed(2)}` }] : []),
      ...(rail === 'paystack' ? [{ label: 'Recipient Gets', value: `$${netAmt.toFixed(2)}` }] : []),
      { label: 'Recipient',  value: recipientLabel },
      { label: 'Settlement', value: rail === 'bank' ? 'Instant' : '1–3 business days' },
      ...(scheduleMode === 'later' && scheduledFor ? [{ label: 'Scheduled', value: new Date(scheduledFor).toLocaleString() }] : []),
      ...(note ? [{ label: 'Note', value: note }] : []),
    ];
    return (
      <div className="space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5">
            <span className="text-white/40 text-xs">{label}</span>
            <span className={`text-sm font-semibold ${label === 'Amount' ? 'text-green-400' : 'text-white'}`}>{value}</span>
          </div>
        ))}
        {formError && <p className="text-red-400 text-xs pt-1 animate-in fade-in duration-200">{formError}</p>}
        <div className="flex gap-2 pt-3">
          <button type="button" onClick={() => { setStep('form'); setFormError(''); }}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white/60 text-sm font-semibold hover:bg-white/10 transition-all">
            ← Back
          </button>
          <button type="button" onClick={handleConfirm} disabled={submitting}
            className="flex-1 relative overflow-hidden rounded-xl px-4 py-2.5 text-white font-bold text-sm transition-all disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-green-500/30">
            {submitting
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{rail === 'paystack' ? 'Sending…' : 'Processing…'}</span>
              : 'Confirm & Send'}
          </button>
        </div>
      </div>
    );
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (step === 'success' && successData) {
    const isOk = successData.status === 'completed';
    const isQ  = successData.status === 'queued';
    const confetti = isOk ? ['#34d399','#4ade80','#a3e635','#86efac','#6ee7b7','#d9f99d'] : ['#fbbf24','#f59e0b','#fcd34d','#fb923c','#fdba74','#fef08a'];
    const stroke = isOk ? '#34d399' : '#fbbf24';
    const pingBg  = isOk ? 'bg-emerald-500/10' : 'bg-yellow-500/10';
    const badge   = isOk ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
    const dot     = isOk ? 'bg-emerald-400' : 'bg-yellow-400';
    const glow1   = isOk ? 'bg-emerald-500/20' : 'bg-yellow-500/20';
    const glow2   = isOk ? 'bg-green-500/15'   : 'bg-amber-500/15';
    const btn     = isOk ? 'from-emerald-600 to-green-500 shadow-emerald-500/20' : 'from-yellow-500 to-amber-400 shadow-yellow-500/20';
    const label   = isOk ? 'Transfer Sent' : isQ ? 'Transfer Queued' : 'Transfer Pending';
    const sub     = isOk ? 'sent successfully' : isQ ? 'scheduled to send' : 'pending · processing shortly';
    const angles  = [0,45,90,135,180,225,270,315,22,67,112,247];
    return (
      <>
        <style>{`
          @keyframes tfC { 0%{transform:translate(0,0) scale(0);opacity:1} 60%{opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(0.25);opacity:0} }
          @keyframes tfK { from{stroke-dashoffset:48} to{stroke-dashoffset:0} }
          @keyframes tfO { from{stroke-dashoffset:166} to{stroke-dashoffset:0} }
          @keyframes tfP { from{opacity:0;transform:scale(0.82) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        `}</style>
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4" onClick={reset}>
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#080d1a] border border-white/12 shadow-2xl"
            style={{ animation: 'tfP 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }} onClick={e => e.stopPropagation()}>
            <div className={`pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-25 ${glow1}`} />
            <div className={`pointer-events-none absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-15 ${glow2}`} />
            <div className="absolute inset-0 flex items-start justify-center pt-12 pointer-events-none overflow-hidden">
              {angles.map((a, i) => {
                const r = (a * Math.PI) / 180; const d = 72 + (i % 3) * 12;
                return <span key={i} className="absolute w-2.5 h-2.5 rounded-full" style={{ backgroundColor: confetti[i % confetti.length], '--dx': `${Math.round(Math.sin(r)*d)}px`, '--dy': `${Math.round(-Math.cos(r)*d)}px`, animation: `tfC 0.75s ease-out ${(i*0.03).toFixed(2)}s forwards` } as React.CSSProperties} />;
              })}
            </div>
            <div className="p-6">
              <div className="flex justify-end mb-1">
                <button onClick={reset} className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center hover:rotate-90 transition-all duration-200">
                  <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="flex justify-center mb-5">
                <div className="relative w-20 h-20">
                  <div className={`absolute inset-0 rounded-full ${pingBg} animate-ping`} style={{ animationDuration:'1.6s', animationDelay:'0.5s' }} />
                  <svg viewBox="0 0 52 52" className="relative w-20 h-20" fill="none">
                    <defs><linearGradient id="tfGrad" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse"><stop stopColor={stroke}/><stop offset="1" stopColor={isOk?'#a3e635':'#fb923c'}/></linearGradient></defs>
                    <circle cx="26" cy="26" r="24" stroke="url(#tfGrad)" strokeWidth="2" style={{ strokeDasharray:166, animation:'tfO 0.5s ease-out forwards' }} />
                    {isOk ? <path d="M14 27l8 8 16-16" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray:48, strokeDashoffset:48, animation:'tfK 0.4s ease-out 0.45s forwards' }} /> : <text x="26" y="31" textAnchor="middle" fontSize="16" fill={stroke}>⏱</text>}
                  </svg>
                </div>
              </div>
              <div className="text-center mb-5">
                <div className={`inline-flex items-center gap-1.5 rounded-full border ${badge} px-3 py-1 text-xs font-semibold mb-2`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />{label}
                </div>
                <p className="text-4xl font-black text-white mt-1">${successData.amount.toFixed(2)}</p>
                <p className="text-white/40 text-xs mt-1">{sub}</p>
              </div>
              <div className="space-y-1.5 rounded-2xl bg-white/5 border border-white/8 p-4 mb-5 text-xs">
                <div className="flex justify-between"><span className="text-white/40">Method</span><span className="text-white/70 font-medium">{successData.method}</span></div>
                <div className="flex justify-between border-t border-white/8 pt-1.5 mt-1"><span className="text-white/40">Recipient</span><span className="text-white/70 font-medium truncate max-w-[140px]">{successData.recipient}</span></div>
                {successData.fee > 0 && <div className="flex justify-between border-t border-white/8 pt-1.5 mt-1"><span className="text-white/40">Fee</span><span className="text-white/70 font-medium">${successData.fee.toFixed(2)}</span></div>}
                {successData.fee > 0 && <div className="flex justify-between border-t border-white/8 pt-1.5 mt-1"><span className="text-white/40">Recipient gets</span><span className="text-white font-bold">${successData.net.toFixed(2)}</span></div>}
                {successData.reference && <div className="flex justify-between border-t border-white/8 pt-1.5 mt-1"><span className="text-white/40">Ref</span><span className="text-white/60 font-mono text-[10px] truncate max-w-[140px]">{successData.reference}</span></div>}
                {successData.scheduledFor && <div className="flex justify-between border-t border-white/8 pt-1.5 mt-1"><span className="text-white/40 flex items-center gap-1"><Clock className="w-3 h-3"/>Scheduled</span><span className="text-white/70 font-medium">{new Date(successData.scheduledFor).toLocaleString()}</span></div>}
              </div>
              <button type="button" onClick={reset}
                className={`group/d relative w-full overflow-hidden rounded-xl py-3 font-bold text-sm text-white bg-gradient-to-r ${btn} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
                <span className="absolute inset-0 -translate-x-full group-hover/d:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative">Done</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  return null;
}
