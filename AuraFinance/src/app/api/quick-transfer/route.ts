import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

type TransferApp = 'bank' | 'wallet' | 'vest';

type BankAccount = {
  id?: string;
  name?: string;
  type?: string;
  balance?: number;
  availableBalance?: number;
  accountNumber?: string;
  currency?: string;
};

const suiteRoot = path.resolve(process.cwd(), '..');

const BANK_STATE_FILE = path.join(suiteRoot, 'AuraBank', '.data', 'aurabank-state.json');
const WALLET_STATE_FILE = path.join(suiteRoot, 'AuraWallet', '.data', 'aurawallet-state.json');
const VEST_STATE_FILE = path.join(suiteRoot, 'AuraVest', '.data', 'auravest-state.json');

const ensureFile = async (filePath: string) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '{}', 'utf8');
  }
};

const readStateMap = async (filePath: string): Promise<Record<string, Record<string, string | null>>> => {
  await ensureFile(filePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, Record<string, string | null>>;
  } catch {
    return {};
  }
};

const writeStateMap = async (filePath: string, stateMap: Record<string, Record<string, string | null>>) => {
  await ensureFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(stateMap, null, 2), 'utf8');
};

const parseJson = <T,>(raw: string | null | undefined, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const getAppLabel = (app: TransferApp) => {
  if (app === 'bank') return 'AuraBank';
  if (app === 'wallet') return 'AuraWallet';
  return 'AuraVest';
};

const updateBankState = (params: {
  userId: string;
  stateMap: Record<string, Record<string, string | null>>;
  delta: number;
  counterparty: string;
  nowIso: string;
}) => {
  const userState = { ...(params.stateMap[params.userId] || {}) };
  const accounts = parseJson<BankAccount[]>(userState.aurabank_accounts, []);
  const transactions = parseJson<Array<Record<string, unknown>>>(userState.aurabank_transactions, []);

  if (accounts.length === 0) {
    accounts.push({
      id: 'bank-primary',
      name: 'Primary Checking',
      type: 'checking',
      balance: 0,
      availableBalance: 0,
      accountNumber: '****0001',
      currency: 'USD',
    });
  }

  const index = accounts.findIndex((account) => String(account.type || '').toLowerCase() !== 'credit');
  const safeIndex = index >= 0 ? index : 0;
  const target = accounts[safeIndex];
  const current = Number(target.balance || 0);

  if (params.delta < 0 && current < Math.abs(params.delta)) {
    return { ok: false, error: 'Insufficient AuraBank balance.' as const };
  }

  target.balance = Number((current + params.delta).toFixed(2));
  if (target.availableBalance !== undefined) {
    target.availableBalance = Number((Number(target.availableBalance || current) + params.delta).toFixed(2));
  }

  const amount = Number(params.delta.toFixed(2));
  const tx = {
    id: `bank-transfer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    accountId: String(target.id || 'bank-primary'),
    type: amount < 0 ? 'debit' : 'credit',
    category: 'Transfer',
    description: amount < 0 ? `Transfer to ${params.counterparty}` : `Transfer from ${params.counterparty}`,
    amount,
    date: params.nowIso,
    status: 'completed',
    merchant: 'Aura Finance',
  };

  const nextTransactions = [tx, ...transactions].slice(0, 500);
  userState.aurabank_accounts = JSON.stringify(accounts);
  userState.aurabank_transactions = JSON.stringify(nextTransactions);
  params.stateMap[params.userId] = userState;

  const totalBalance = accounts.reduce((sum, account) => {
    if (String(account.type || '').toLowerCase() === 'credit') return sum;
    return sum + Number(account.balance || 0);
  }, 0);

  return { ok: true as const, balance: Number(totalBalance.toFixed(2)) };
};

const updateWalletState = (params: {
  userId: string;
  stateMap: Record<string, Record<string, string | null>>;
  delta: number;
  counterparty: string;
  nowIso: string;
}) => {
  const userState = { ...(params.stateMap[params.userId] || {}) };
  const walletKey = `aurawallet_state_${params.userId}`;
  const state = parseJson<{ balance?: number; transactions?: Array<Record<string, unknown>> }>(userState[walletKey], {
    balance: 0,
    transactions: [],
  });

  const current = Number(state.balance || 0);
  if (params.delta < 0 && current < Math.abs(params.delta)) {
    return { ok: false, error: 'Insufficient AuraWallet balance.' as const };
  }

  const nextBalance = Number((current + params.delta).toFixed(2));
  const tx = {
    id: Date.now(),
    amount: Number(params.delta.toFixed(2)),
    description: params.delta < 0 ? `Transfer to ${params.counterparty}` : `Transfer from ${params.counterparty}`,
    date: params.nowIso.split('T')[0],
    createdAt: params.nowIso,
    method: 'bank_transfer',
    status: 'completed',
  };

  userState[walletKey] = JSON.stringify({
    balance: nextBalance,
    transactions: [tx, ...(state.transactions || [])].slice(0, 500),
  });
  params.stateMap[params.userId] = userState;

  return { ok: true as const, balance: nextBalance };
};

const updateVestState = (params: {
  userId: string;
  stateMap: Record<string, Record<string, string | null>>;
  delta: number;
  counterparty: string;
  nowIso: string;
}) => {
  const userState = { ...(params.stateMap[params.userId] || {}) };
  const currentCash = Number(userState.auravest_cash_balance || 0);
  if (params.delta < 0 && currentCash < Math.abs(params.delta)) {
    return { ok: false, error: 'Insufficient AuraVest cash balance.' as const };
  }

  const nextCash = Number((currentCash + params.delta).toFixed(2));
  const transactions = parseJson<Array<Record<string, unknown>>>(userState.auravest_transactions, []);
  const portfolio = parseJson<Record<string, unknown>>(userState.auravest_portfolio, {
    totalValue: currentCash,
    change24h: 0,
    changeAmount: 0,
    assets: [],
  });

  const amountAbs = Math.abs(Number(params.delta.toFixed(2)));
  const tx = {
    id: `vest-transfer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: params.delta < 0 ? 'withdrawal' : 'deposit',
    asset: 'USD',
    assetName: params.delta < 0 ? `Transfer to ${params.counterparty}` : `Transfer from ${params.counterparty}`,
    amount: amountAbs,
    total: amountAbs,
    currency: 'USD',
    status: 'completed',
    timestamp: params.nowIso,
    date: params.nowIso,
    orderType: 'market',
    fee: 0,
    price: 1,
  };

  const nextTransactions = [tx, ...transactions].slice(0, 500);
  const nextTotalValue = Number((Number(portfolio.totalValue || 0) + params.delta).toFixed(2));
  const nextPortfolio = {
    ...portfolio,
    totalValue: nextTotalValue,
  };

  userState.auravest_cash_balance = String(nextCash);
  userState.auravest_transactions = JSON.stringify(nextTransactions);
  userState.auravest_portfolio = JSON.stringify(nextPortfolio);
  params.stateMap[params.userId] = userState;

  return { ok: true as const, balance: nextTotalValue };
};

const applyDelta = (params: {
  app: TransferApp;
  userId: string;
  delta: number;
  counterparty: string;
  nowIso: string;
  bankMap: Record<string, Record<string, string | null>>;
  walletMap: Record<string, Record<string, string | null>>;
  vestMap: Record<string, Record<string, string | null>>;
}) => {
  if (params.app === 'bank') {
    return updateBankState({
      userId: params.userId,
      stateMap: params.bankMap,
      delta: params.delta,
      counterparty: params.counterparty,
      nowIso: params.nowIso,
    });
  }

  if (params.app === 'wallet') {
    return updateWalletState({
      userId: params.userId,
      stateMap: params.walletMap,
      delta: params.delta,
      counterparty: params.counterparty,
      nowIso: params.nowIso,
    });
  }

  return updateVestState({
    userId: params.userId,
    stateMap: params.vestMap,
    delta: params.delta,
    counterparty: params.counterparty,
    nowIso: params.nowIso,
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      from?: TransferApp;
      to?: TransferApp;
      amount?: number;
      actionId?: string;
    };

    const userId = String(body?.userId || '').trim();
    const from = body?.from;
    const to = body?.to;
    const amount = Number(body?.amount || 0);

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }
    if (!from || !to || from === to) {
      return NextResponse.json({ error: 'Invalid source/destination apps' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const bankMap = await readStateMap(BANK_STATE_FILE);
    const walletMap = await readStateMap(WALLET_STATE_FILE);
    const vestMap = await readStateMap(VEST_STATE_FILE);

    const source = applyDelta({
      app: from,
      userId,
      delta: -amount,
      counterparty: getAppLabel(to),
      nowIso,
      bankMap,
      walletMap,
      vestMap,
    });
    if (!source.ok) {
      return NextResponse.json({ error: source.error }, { status: 400 });
    }

    const destination = applyDelta({
      app: to,
      userId,
      delta: amount,
      counterparty: getAppLabel(from),
      nowIso,
      bankMap,
      walletMap,
      vestMap,
    });
    if (!destination.ok) {
      return NextResponse.json({ error: destination.error }, { status: 400 });
    }

    await Promise.all([
      writeStateMap(BANK_STATE_FILE, bankMap),
      writeStateMap(WALLET_STATE_FILE, walletMap),
      writeStateMap(VEST_STATE_FILE, vestMap),
    ]);

    return NextResponse.json({
      ok: true,
      actionId: String(body?.actionId || ''),
      deltas: {
        bank: from === 'bank' ? -amount : to === 'bank' ? amount : 0,
        wallet: from === 'wallet' ? -amount : to === 'wallet' ? amount : 0,
        vest: from === 'vest' ? -amount : to === 'vest' ? amount : 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}