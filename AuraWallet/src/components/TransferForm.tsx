"use client";
import { useState } from 'react';
// @ts-ignore
import { walletData } from '@/lib/shared/mock-data';

export default function TransferForm({ onComplete }: { onComplete?: () => void }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'mobile'|'card'>('mobile');
  const [recipient, setRecipient] = useState('');
  const [status, setStatus] = useState('');

  function submit(e: any) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setStatus('Enter a valid amount');
      return;
    }
    if (!recipient) {
      setStatus('Enter recipient');
      return;
    }

    // Simulate transfer: deduct from wallet and add transaction
    walletData.balance = Math.max(0, walletData.balance - val);
    walletData.transactions.unshift({ id: Date.now(), amount: -val, description: method === 'mobile' ? `Mobile: ${recipient}` : `Card: ${recipient}`, date: new Date().toISOString().split('T')[0] });

    setStatus('Transfer sent');
    setAmount('');
    setRecipient('');
    onComplete && onComplete();
    setTimeout(() => setStatus(''), 2500);
  }

  return (
    <form onSubmit={submit} className="bg-gradient-to-br from-[#071A2B] to-[#071029] rounded-xl p-4 border border-white/6">
      <h4 className="text-white font-semibold mb-3">Send Money</h4>
      <div className="mb-2">
        <label className="text-white/70 text-sm">Amount</label>
        <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0.00" className="w-full mt-1 px-3 py-2 rounded bg-transparent border border-white/10 text-white" />
      </div>

      <div className="mb-2">
        <label className="text-white/70 text-sm">Method</label>
        <div className="flex gap-2 mt-1">
          <button type="button" onClick={()=>setMethod('mobile')} className={`px-3 py-1 rounded ${method==='mobile' ? 'bg-[#29C7D9] text-black' : 'bg-white/5 text-white'}`}>Mobile Money</button>
          <button type="button" onClick={()=>setMethod('card')} className={`px-3 py-1 rounded ${method==='card' ? 'bg-[#29C7D9] text-black' : 'bg-white/5 text-white'}`}>AuraBank Card</button>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-white/70 text-sm">Recipient {method === 'mobile' ? '(phone number)' : '(card last 4)'}</label>
        <input value={recipient} onChange={(e)=>setRecipient(e.target.value)} placeholder={method==='mobile' ? '+233...' : '1234'} className="w-full mt-1 px-3 py-2 rounded bg-transparent border border-white/10 text-white" />
      </div>

      <div className="flex items-center justify-between">
        <button type="submit" className="bg-[#29C7D9] text-black px-4 py-2 rounded">Send</button>
        <div className="text-white/70 text-sm">{status}</div>
      </div>
    </form>
  );
}
