import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing userId' },
        { status: 400 }
      );
    }

    // Mock scheduling weekly report
    console.log(`Weekly report scheduled for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: '✅ Weekly report scheduled! You\'ll receive it every Monday at 8 AM.',
    });
  } catch (error) {
    console.error('Report Scheduling Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to schedule report. Try again!' },
      { status: 500 }
    );
  }
}
