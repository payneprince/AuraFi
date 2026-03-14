import { NextRequest, NextResponse } from 'next/server';
import {
  appendUnifiedLedgerEventForUser,
  getUnifiedLedgerEventsForUser,
} from '../../../../../shared/unified-ledger-server';

export async function GET(request: NextRequest) {
  const userId = String(request.nextUrl.searchParams.get('userId') || '').trim();
  const events = await getUnifiedLedgerEventsForUser(userId || undefined);
  return NextResponse.json({ userId: userId || null, events });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { userId?: string; event?: unknown };
    const userId = String(body?.userId || (body?.event as { userId?: string } | undefined)?.userId || '').trim();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const event = await appendUnifiedLedgerEventForUser(userId, body?.event || {});
    return NextResponse.json({ ok: true, event });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
