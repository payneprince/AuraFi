import { NextRequest, NextResponse } from 'next/server';
import { getFinanceStateForUser, setFinanceStateForUser } from '@/lib/server/financeStateStore';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') || '';
  if (!userId.trim()) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400, headers: corsHeaders });
  }

  const state = await getFinanceStateForUser(userId);
  return NextResponse.json({ userId: String(userId), state }, { headers: corsHeaders });
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { userId?: string; state?: unknown };
    const userId = String(body?.userId || '').trim();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400, headers: corsHeaders });
    }

    const state = await setFinanceStateForUser(userId, body?.state || {});
    return NextResponse.json({ ok: true, userId, state }, { headers: corsHeaders });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}