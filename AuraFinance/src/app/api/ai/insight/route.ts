// src/app/api/ai/insight/route.ts
import { NextRequest, NextResponse } from 'next/server';

// 🔒 In-memory store (replace with Redis in production)
const userConversations: Record<string, { role: 'user' | 'assistant'; content: string }[]> = {};

export async function POST(req: NextRequest) {
  try {
    // 🔍 Debug: verify env is loaded
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY is missing in .env.local');
      return NextResponse.json(
        { success: false, message: 'AI service is temporarily unavailable.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { userQuery, userId = 'demo' } = body;

    if (!userQuery?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Please ask a question.' },
        { status: 400 }
      );
    }

    // 🧠 Get conversation history
    let history = userConversations[userId] || [];

    // 📊 Inject real portfolio context
    const systemPrompt = `You are AuraAI, a financial advisor for Aura Finance users.

User's Financial Summary:
- Total Net Worth: $125,430
- AuraBank Balance: $15,000
- AuraVest Portfolio: $95,430
- AuraWallet Balance: $15,000
- Monthly Income: $8,500
- Monthly Expenses: $4,200

Rules:
1. Be concise (1–2 sentences max).
2. Use only facts from the context above — never hallucinate numbers.
3. Offer actionable, non-promotional advice.
4. Use professional but friendly tone.
5. If unsure, say "I don't have enough data to answer that."`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6), // last 3 exchanges
      { role: 'user', content: userQuery },
    ];

    // 🚀 Call OpenAI (or any OpenAI-compatible API)
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: 250,
        timeout: 10000,
      }),
    });

    // 📝 Log API errors for debugging
    if (!openaiRes.ok) {
      const errorData = await openaiRes.json().catch(() => ({}));
      console.error('🔴 OpenAI API Error:', {
        status: openaiRes.status,
        statusText: openaiRes.statusText,
        error: errorData.error?.message || 'Unknown error',
      });

      // Friendly fallback
      const fallbackResponses = [
        `Your net worth is $125,430 across banking, investments, and wallet. Consider increasing your AuraVest portfolio for long-term growth.`,
        `You're saving $4,300 per month ($8,500 income - $4,200 expenses). Great opportunity to invest more or build emergency reserves.`,
        `Your portfolio is well-distributed across AuraBank, AuraVest, and AuraWallet. Maintain this balance for stability.`,
        `With a monthly surplus of $4,300, consider allocating 50% to investments, 30% to savings, and 20% to goals.`,
        `Your current cash position ($30,000) covers 7+ months of expenses. Consider moving some to AuraVest for higher returns.`,
      ];
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

      return NextResponse.json({
        success: true,
        message: fallback,
        source: 'fallback',
      });
    }

    // ✅ Parse successful response
    const data = await openaiRes.json();
    const aiMessage = data.choices[0].message.content.trim();

    // 💾 Save to memory (max 10 messages)
    history = [
      ...history,
      { role: 'user', content: userQuery },
      { role: 'assistant', content: aiMessage },
    ].slice(-10);
    userConversations[userId] = history;

    return NextResponse.json({
      success: true,
      message: aiMessage,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ AI Route Fatal Error:', error.message || error);

    return NextResponse.json(
      {
        success: false,
        message:
          'AuraAI is busy analyzing financial data. Try again in a few seconds.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
