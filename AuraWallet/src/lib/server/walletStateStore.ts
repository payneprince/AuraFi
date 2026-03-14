import { promises as fs } from 'fs';
import path from 'path';
import { getAuraWalletStorageKeys } from '@/lib/walletStateKeys';

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

export const getWalletStateForUser = async (userId: string): Promise<StoredWalletState | null> => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) return null;

  const stateMap = await readAllStates();
  const storedState = stateMap[normalizedUserId];
  return storedState ? sanitizeState(normalizedUserId, storedState) : null;
};

export const setWalletStateForUser = async (userId: string, state: unknown): Promise<StoredWalletState> => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    throw new Error('Invalid userId');
  }

  const normalizedState = sanitizeState(normalizedUserId, state);
  const stateMap = await readAllStates();
  stateMap[normalizedUserId] = normalizedState;
  await writeAllStates(stateMap);
  return normalizedState;
};