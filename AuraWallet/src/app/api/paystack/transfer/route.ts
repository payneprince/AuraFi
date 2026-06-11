import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 });

  const { amount, currency = 'GHS', recipientType, accountNumber, bankCode, name, reason } = await req.json() as {
    amount: number;
    currency?: string;
    recipientType: 'mobile_money' | 'nuban' | 'ghipss';
    accountNumber: string;
    bankCode: string;
    name: string;
    reason?: string;
  };

  if (!amount || amount <= 0 || !accountNumber || !bankCode || !name) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Step 1: create transfer recipient
  const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: recipientType,
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency,
    }),
  });

  const recipientData = await recipientRes.json() as { status: boolean; data?: { recipient_code: string } };
  if (!recipientData.status) return NextResponse.json({ error: 'Failed to create recipient' }, { status: 502 });

  const recipientCode = recipientData.data!.recipient_code;
  const reference = `wallet-out-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Step 2: initiate transfer
  const transferRes = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(amount * 100),
      recipient: recipientCode,
      reason: reason ?? 'AuraWallet withdrawal',
      reference,
      currency,
    }),
  });

  const transferData = await transferRes.json() as {
    status: boolean;
    message?: string;
    code?: string;
    data?: { status: string; transfer_code: string; reference: string };
  };

  if (!transferData.status) {
    return NextResponse.json({ error: transferData.message ?? 'Transfer failed', code: transferData.code ?? 'transfer_failed' }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    status: transferData.data!.status,
    transferCode: transferData.data!.transfer_code,
    reference: transferData.data!.reference,
  });
}
