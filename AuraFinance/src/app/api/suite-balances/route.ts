import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

type StoredMap = Record<string, Record<string, string | null>>;

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

const readStateMap = async (filePath: string): Promise<StoredMap> => {
  await ensureFile(filePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as StoredMap;
  } catch {
    return {};
  }
};

const parseJson = <T,>(raw: string | null | undefined, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export async function GET(request: NextRequest) {
  const userId = String(request.nextUrl.searchParams.get('userId') || '').trim();
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const [bankMap, walletMap, vestMap] = await Promise.all([
    readStateMap(BANK_STATE_FILE),
    readStateMap(WALLET_STATE_FILE),
    readStateMap(VEST_STATE_FILE),
  ]);

  const bankState = bankMap[userId] || {};
  const walletState = walletMap[userId] || {};
  const vestState = vestMap[userId] || {};

  const bankAccounts = parseJson<Array<Record<string, unknown>>>(bankState.aurabank_accounts, []);
  const bankBalance = bankAccounts.reduce((sum, account) => {
    if (String(account?.type || '').toLowerCase() === 'credit') return sum;
    return sum + Number(account?.balance || 0);
  }, 0);

  const walletKey = `aurawallet_state_${userId}`;
  const wallet = parseJson<{ balance?: number }>(walletState[walletKey], { balance: 0 });

  const vestPortfolio = parseJson<{ totalValue?: number }>(vestState.auravest_portfolio, { totalValue: 0 });
  const vestHoldings = parseJson<Array<Record<string, unknown>>>(vestState.auravest_trade_holdings, [])
    .map((holding, index) => ({
      id: String(holding?.id || `holding-${index}`),
      symbol: String(holding?.symbol || 'N/A'),
      shares: Number(holding?.amount || holding?.shares || 0),
      value: Number(holding?.currentValue || holding?.value || 0),
    }))
    .filter((holding) => Number.isFinite(holding.value) && holding.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return NextResponse.json({
    userId,
    bankBalance: Number(bankBalance.toFixed(2)),
    walletBalance: Number(Number(wallet.balance || 0).toFixed(2)),
    vestPortfolioValue: Number(Number(vestPortfolio.totalValue || 0).toFixed(2)),
    vestTopHoldings: vestHoldings,
  });
}