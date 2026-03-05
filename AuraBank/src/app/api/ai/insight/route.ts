import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userQuery, userId } = await req.json();

    if (!userQuery || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing userQuery or userId' },
        { status: 400 }
      );
    }

    // Simple mock responses for demo
    const responses: Record<string, string> = {
      'balance': "Your total balance across all accounts is $138,698.25. That's a 5.2% increase from last month!",
      'spending': "You've spent $4,240 this month. Your biggest expense category is groceries at $1,250.",
      'save': "💡 Based on your spending patterns, you could save an extra $450/month by reducing dining out and subscriptions.",
      'transfer': "You can transfer money instantly between your accounts. Go to the Transfer page to get started!",
      'credit': "Your available credit is $7,659.80. You're using 23% of your total credit limit. Good job!",
      'bill': "You have 3 upcoming bills totaling $890. Would you like me to set up auto-pay?",
    };

    // Find matching response
    const lowerQuery = userQuery.toLowerCase();
    let response = '';

    for (const [key, value] of Object.entries(responses)) {
      if (lowerQuery.includes(key)) {
        response = value;
        break;
      }
    }

    if (!response) {
      response = `I can help you with your banking needs! Try asking about:\n\n• Your balance\n• Spending analysis\n• Savings tips\n• Transfer money\n• Credit cards\n• Upcoming bills`;
    }

    return NextResponse.json({
      success: true,
      message: response,
    });
  } catch (error) {
    console.error('AI Insight Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process your request. Try again!' },
      { status: 500 }
    );
  }
}
