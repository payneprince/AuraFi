import { promises as fs } from 'fs';
import path from 'path';
import { AURAVEST_STORAGE_KEYS } from '@/lib/vestStateKeys';
import { getUnifiedLedgerEventsForUser } from '../../../../shared/unified-ledger-server';

const DEMO_USER_ID = '1';

const hasLedgerActivity = async (userId: string): Promise<boolean> => {
  if (userId === DEMO_USER_ID) return true;
  try {
    const events = await getUnifiedLedgerEventsForUser(userId);
    return events.length > 0;
  } catch { return false; }
};

const enforceEmptyForNewUser = async (userId: string, state: Record<string, string | null>): Promise<Record<string, string | null>> => {
  if (userId === DEMO_USER_ID) return state;
  const active = await hasLedgerActivity(userId);
  if (active) return state;
  // New real user — reset portfolio and holdings to empty
  return {
    ...state,
    auravest_portfolio: JSON.stringify({ totalValue: 0, change24h: 0, changeAmount: 0, assets: [] }),
    auravest_trade_holdings: JSON.stringify([]),
    auravest_transactions: JSON.stringify([]),
    auravest_cash_balance: '0',
  };
};

type StoredVestState = Record<string, string | null>;
type VestStateFileShape = Record<string, StoredVestState>;

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'auravest-state.json');

const sanitizeState = (raw: unknown): StoredVestState => {
  const source = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  const result: StoredVestState = {};

  for (const key of AURAVEST_STORAGE_KEYS) {
    const value = source[key];
    if (value === null || value === undefined) {
      result[key] = null;
    } else if (typeof value === 'string') {
      result[key] = value;
    } else {
      result[key] = String(value);
    }
  }

  return result;
};

const ensureStoreFile = async () => {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, '{}', 'utf8');
  }
};

const readAllStates = async (): Promise<VestStateFileShape> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};

    const normalized: VestStateFileShape = {};
    for (const [userId, state] of Object.entries(parsed as Record<string, unknown>)) {
      normalized[String(userId)] = sanitizeState(state);
    }
    return normalized;
  } catch {
    return {};
  }
};

const writeAllStates = async (stateMap: VestStateFileShape) => {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(stateMap, null, 2), 'utf8');
};

export const getVestStateForUser = async (userId: string): Promise<StoredVestState | null> => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) return null;

  const stateMap = await readAllStates();
  const storedState = stateMap[normalizedUserId];
  if (!storedState) return null;

  const sanitized = sanitizeState(storedState);
  return enforceEmptyForNewUser(normalizedUserId, sanitized);
};

export const setVestStateForUser = async (userId: string, state: unknown): Promise<StoredVestState> => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) throw new Error('Invalid userId');

  const normalized = sanitizeState(state);
  const safe = await enforceEmptyForNewUser(normalizedUserId, normalized);

  const stateMap = await readAllStates();
  stateMap[normalizedUserId] = safe;
  await writeAllStates(stateMap);
  return safe;
};