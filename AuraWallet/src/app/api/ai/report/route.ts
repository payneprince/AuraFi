import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { userId?: string };
    const userId = String(body?.userId || 'demo').trim();

    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + ((1 + 7 - scheduledFor.getDay()) % 7 || 7));
    scheduledFor.setHours(8, 0, 0, 0);

    console.log(`[AuraWallet] Weekly report scheduled for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Weekly wallet digest scheduled for ${scheduledFor.toDateString()} at 8:00 AM`,
      scheduledFor: scheduledFor.toISOString(),
    });
  } catch (error) {
    console.error('[AuraWallet] Report route error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to schedule report. Try again later.' },
      { status: 500 }
    );
  }
}
