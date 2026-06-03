import { NextRequest, NextResponse } from 'next/server';
import { getAIInsight } from '../../../../../../shared/ai-insights-service';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { userQuery?: string; userId?: string };
    const userQuery = String(body.userQuery || '').trim();
    const userId = String(body.userId || 'demo').trim();

    if (!userQuery) {
      return NextResponse.json({ success: false, message: 'Please ask a question.' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'AI service is not configured. Add GROQ_API_KEY to .env.local.' },
        { status: 503 }
      );
    }

    const message = await getAIInsight({ userId, userQuery, appContext: 'AuraWallet' });
    return NextResponse.json({ success: true, message, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[AuraWallet] AI insight error:', error);
    return NextResponse.json(
      { success: false, message: 'AuraAI is temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
