import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 });

  const { email, amount, currency = 'GHS', channels, metadata } = await req.json() as {
    email: string;
    amount: number;
    currency?: string;
    channels?: string[];
    metadata?: Record<string, unknown>;
  };

  if (!email || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const reference = `wallet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      currency,
      reference,
      channels: channels ?? ['mobile_money', 'card', 'bank', 'bank_transfer'],
      metadata: { ...(metadata ?? {}), app: 'aurawallet' },
    }),
  });

  const data = await res.json() as { status: boolean; data?: { access_code: string; authorization_url: string; reference: string } };
  if (!data.status) return NextResponse.json({ error: 'Paystack error' }, { status: 502 });

  return NextResponse.json({ accessCode: data.data!.access_code, reference: data.data!.reference });
}
