import { promises as fs } from 'fs';
import path from 'path';
import { getAuraWalletStorageKeys } from '@/lib/walletStateKeys';
import { getUnifiedLedgerEventsForUser } from '../../../../shared/unified-ledger-server';

const DEMO_USER_ID = '1';
const EMPTY_WALLET = JSON.stringify({ balance: 0, transactions: [] });
const DEMO_WALLET = JSON.stringify({
  balance: 500,
  transactions: [
    { id: 1, amount: -20, description: 'Coffee Shop', date: '2024-01-15' },
    { id: 2, amount: 100, description: 'Transfer from Bank', date: '2024-01-14' },
  ],
});

type StoredWalletState = Record<string, string | null>;
type WalletStateFileShape = Record<string, StoredWalletState>;

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'aurawallet-state.json');

const sanitizeState = (userId: string, raw: unknown): StoredWalletState => {
  const keys = getAuraWalletStorageKeys(userId);
  const source = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  const result: StoredWalletState = {};

  for (const key of keys) {
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

const readAllStates = async (): Promise<WalletStateFileShape> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as WalletStateFileShape;
  } catch {
    return {};
  }
};

const writeAllStates = async (stateMap: WalletStateFileShape) => {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(stateMap, null, 2), 'utf8');
};

// Returns true if this userId has made real financial activity in the ledger
const hasLedgerActivity = async (userId: string): Promise<boolean> => {
  if (userId === DEMO_USER_ID) return true; // demo always trusted
  try {
    const events = await getUnifiedLedgerEventsForUser(userId);
    return events.length > 0;
  } catch {
    return false;
  }
};

// Restore the demo user's seeded wallet if a client-side race ever persists a blank/zero state for it
const guardDemoWallet = async (state: StoredWalletState): Promise<StoredWalletState> => {
  const walletKey = `aurawallet_state_${DEMO_USER_ID}`;
  const raw = state[walletKey];
  if (!raw) return state;

  try {
    const parsed = JSON.parse(raw);
    const looksBlank = Number(parsed?.balance || 0) === 0 && (parsed?.transactions?.length ?? 0) === 0;
    if (!looksBlank) return state;

    // Only WALLET-app events justify a drained wallet — the demo user racks up
    // plenty of bank/vest ledger events that have nothing to do with this balance.
    const events = await getUnifiedLedgerEventsForUser(DEMO_USER_ID);
    const walletEvents = events.filter((event) => event?.app === 'wallet');
    if (walletEvents.length > 0) return state; // genuinely drained by real wallet activity — trust it

    return { ...state, [walletKey]: DEMO_WALLET };
  } catch {
    return state;
  }
};

// Zero out wallet state for non-demo users who have no ledger events
const enforceZeroForNewUser = async (userId: string, state: StoredWalletState): Promise<StoredWalletState> => {
  if (userId === DEMO_USER_ID) return state;
  const active = await hasLedgerActivity(userId);
  if (active) return state; // real user with real transactions — trust their state

  // New real user: force wallet balance to $0, clear any contaminated transactions
  const walletKey = `aurawallet_state_${userId}`;
  if (state[walletKey]) {
    try {
      const parsed = JSON.parse(state[walletKey] as string);
      if (Number(parsed?.balance || 0) !== 0 || (parsed?.transactions?.length ?? 0) > 0) {
        return { ...state, [walletKey]: EMPTY_WALLET };
      }
    } catch { /* leave as-is */ }
  }
  return state;
};

export const getWalletStateForUser = async (userId: string): Promise<StoredWalletState | null> => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) return null;

  const stateMap = await readAllStates();
  const storedState = stateMap[normalizedUserId];
  if (!storedState) return null;

  const sanitized = sanitizeState(normalizedUserId, storedState);
  if (normalizedUserId === DEMO_USER_ID) return guardDemoWallet(sanitized);
  return enforceZeroForNewUser(normalizedUserId, sanitized);
};

export const setWalletStateForUser = async (userId: string, state: unknown): Promise<StoredWalletState> => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) throw new Error('Invalid userId');

  const normalized = sanitizeState(normalizedUserId, state);
  // Prevent contaminated writes: zero out non-demo users with no ledger activity,
  // and restore the demo user's seeded wallet if a client race tries to persist it blank
  const safe = normalizedUserId === DEMO_USER_ID
    ? await guardDemoWallet(normalized)
    : await enforceZeroForNewUser(normalizedUserId, normalized);

  const stateMap = await readAllStates();
  stateMap[normalizedUserId] = safe;
  await writeAllStates(stateMap);
  return safe;
};