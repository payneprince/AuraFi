// src/app/api/ai/report/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'demo' } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400 }
      );
    }

    // 📧 In production, integrate with email service (SendGrid, Resend, etc.)
    console.log(`📧 Weekly report scheduled for user: ${userId}`);

    // Simulate scheduling
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + ((1 + 7 - scheduledFor.getDay()) % 7));
    scheduledFor.setHours(8, 0, 0, 0);

    return NextResponse.json({
      success: true,
      message: `Weekly report scheduled for ${scheduledFor.toDateString()} at 8:00 AM`,
      scheduledFor: scheduledFor.toISOString(),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Report Route Error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to schedule report. Try again later.',
      },
      { status: 500 }
    );
  }
}
