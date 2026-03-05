// src/app/api/ai/insight/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { portfolioData, riskMetrics } from '@/lib/mockData';

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
    const systemPrompt = `You are AuraAI, a financial advisor for AuraVest users.

User's Portfolio Summary:
- Total Value: $${portfolioData.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- 24h Change: ${portfolioData.change24h >= 0 ? '+' : ''}${portfolioData.change24h}%
- Risk Score: ${riskMetrics.score}/100 (${riskMetrics.level})
- Allocation: 
  • Crypto: ${portfolioData.assets[0].allocation}%
  • Stocks: ${portfolioData.assets[1].allocation}%
  • Gold: ${portfolioData.assets[2].allocation}%
  • NFTs: ${portfolioData.assets[3].allocation}%

Rules:
1. Be concise (1–2 sentences max).
2. Use only facts from the context above — never hallucinate numbers.
3. Offer actionable, non-promotional advice.
4. Use professional but friendly tone.
5. If unsure, say "I don’t have enough data to answer that."`;

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
        `Based on your portfolio, your risk level is **${riskMetrics.level}** (${riskMetrics.score}/100). Consider adding defensive assets like gold or utilities stocks.`,
        `Your portfolio gained $${portfolioData.changeAmount.toLocaleString()} last 24h. Strong momentum — consider reviewing your allocation.`,
        `You're well-diversified across 4 asset classes. AuraAI recommends maintaining this balance.`,
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
          'AuraAI is busy analyzing market data. Try again in a few seconds.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}