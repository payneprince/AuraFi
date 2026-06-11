import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 });

  const reference = req.nextUrl.searchParams.get('reference');
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  const data = await res.json() as {
    status: boolean;
    data?: { status: string; amount: number; currency: string; reference: string; customer: { email: string } };
  };

  if (!data.status || data.data?.status !== 'success') {
    return NextResponse.json({ success: false, status: data.data?.status ?? 'failed' });
  }

  return NextResponse.json({
    success: true,
    amount: data.data.amount / 100,
    currency: data.data.currency,
    reference: data.data.reference,
    email: data.data.customer.email,
  });
}
