import { NextRequest, NextResponse } from 'next/server';
import { getWalletStateForUser, setWalletStateForUser } from '@/lib/server/walletStateStore';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') || '';
  if (!userId.trim()) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const state = await getWalletStateForUser(userId);
  return NextResponse.json({ userId: String(userId), state });
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { userId?: string; state?: unknown };
    const userId = String(body?.userId || '').trim();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const state = await setWalletStateForUser(userId, body?.state || {});
    return NextResponse.json({ ok: true, userId, state });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}