import { getUnifiedLedgerEventsForUser } from './unified-ledger-server';
import type { UnifiedLedgerEvent } from './unified-ledger';

type BalanceSnapshot = {
  bank: number;
  vest: number;
  wallet: number;
  netWorth: number;
  eventCount: number;
};

function replayEventsToSnapshot(events: UnifiedLedgerEvent[]): BalanceSnapshot {
  const cash: Record<string, number> = { bank: 0, vest: 0, wallet: 0, finance: 0 };

  for (const event of events) {
    const amount = Number(event.amount || 0);
    if (!Number.isFinite(amount)) continue;

    if (event.type === 'funding.deposit') {
      cash[event.app] = (cash[event.app] || 0) + amount;
    } else if (event.type === 'funding.withdrawal') {
      cash[event.app] = (cash[event.app] || 0) - amount;
    } else if (event.type.startsWith('transfer.')) {
      const from = String(event.app || '');
      const to = String((event.metadata as Record<string, unknown>)?.toApp || '');
      if (from in cash) cash[from] -= amount;
      if (to in cash) cash[to] += amount;
    } else if (event.type === 'trade.buy') {
      cash[event.app] = (cash[event.app] || 0) - amount;
    } else if (event.type === 'trade.sell') {
      cash[event.app] = (cash[event.app] || 0) + amount;
    }
  }

  const bank = Number((cash.bank || 0).toFixed(2));
  const vest = Number((cash.vest || 0).toFixed(2));
  const wallet = Number((cash.wallet || 0).toFixed(2));

  return {
    bank,
    vest,
    wallet,
    netWorth: Number((bank + vest + wallet).toFixed(2)),
    eventCount: events.length,
  };
}

const APP_DESCRIPTIONS: Record<string, string> = {
  AuraBank: 'banking and savings management',
  AuraVest: 'investment portfolio management',
  AuraWallet: 'digital wallet and payments',
  AuraFinance: 'unified financial management',
};

function buildSystemPrompt(snapshot: BalanceSnapshot, appContext: string): string {
  const desc = APP_DESCRIPTIONS[appContext] ?? 'financial management';

  const dataSection =
    snapshot.eventCount > 0
      ? `Current financial snapshot (live from the user's unified ledger):
- AuraBank Balance: $${snapshot.bank.toFixed(2)}
- AuraVest Portfolio: $${snapshot.vest.toFixed(2)}
- AuraWallet Balance: $${snapshot.wallet.toFixed(2)}
- Total Net Worth: $${snapshot.netWorth.toFixed(2)}
- Recorded transactions: ${snapshot.eventCount}`
      : `The user's accounts have no transaction history yet. Encourage them to explore the platform and fund their accounts.`;

  return `You are AuraAI, a smart financial assistant built into ${appContext} — Aura Finance's ${desc} application.

${dataSection}

Guidelines:
- Be concise: 1-3 sentences unless the user asks for more detail.
- Ground every number in the data above. Never invent or estimate figures.
- Offer specific, actionable advice when possible.
- If the data is insufficient to answer accurately, say so honestly.
- Tone: professional, warm, and clear.`;
}

type Message = { role: 'user' | 'assistant'; content: string };
type ApiMessage = { role: 'user' | 'assistant' | 'system'; content: string };

// In-memory per-user conversation history (per process lifetime)
const conversationStore = new Map<string, Message[]>();

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export async function getAIInsight(params: {
  userId: string;
  userQuery: string;
  appContext: string;
}): Promise<string> {
  const events = await getUnifiedLedgerEventsForUser(params.userId);
  const snapshot = replayEventsToSnapshot(events);
  const systemPrompt = buildSystemPrompt(snapshot, params.appContext);

  const history = conversationStore.get(params.userId) ?? [];
  const messages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6),
    { role: 'user', content: params.userQuery },
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.4,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as OpenAIResponse;
    throw new Error(err.error?.message ?? `OpenAI error ${res.status}`);
  }

  const data = (await res.json()) as OpenAIResponse;
  const aiMessage = String(data.choices?.[0]?.message?.content ?? '').trim();

  const updated: Message[] = [
    ...history,
    { role: 'user' as const, content: params.userQuery },
    { role: 'assistant' as const, content: aiMessage },
  ].slice(-12);
  conversationStore.set(params.userId, updated);

  return aiMessage || "I'm having trouble right now. Please try again in a moment.";
}
