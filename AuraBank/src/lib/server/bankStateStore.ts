import { promises as fs } from 'fs';
import path from 'path';
import { AURABANK_STORAGE_KEYS } from '@/lib/bankStateKeys';

type StoredBankState = Record<string, string | null>;
type BankStateFileShape = Record<string, StoredBankState>;

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'aurabank-state.json');

const sanitizeState = (raw: unknown): StoredBankState => {
  const source = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  const result: StoredBankState = {};

  for (const key of AURABANK_STORAGE_KEYS) {
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

const readAllStates = async (): Promise<BankStateFileShape> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};

    const normalized: BankStateFileShape = {};
    for (const [userId, state] of Object.entries(parsed as Record<string, unknown>)) {
      normalized[String(userId)] = sanitizeState(state);
    }
    return normalized;
  } catch {
    return {};
  }
};

const writeAllStates = async (stateMap: BankStateFileShape) => {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(stateMap, null, 2), 'utf8');
};

export const getBankStateForUser = async (userId: string): Promise<StoredBankState | null> => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) return null;

  const stateMap = await readAllStates();
  const storedState = stateMap[normalizedUserId];
  return storedState ? sanitizeState(storedState) : null;
};

export const setBankStateForUser = async (userId: string, state: unknown): Promise<StoredBankState> => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    throw new Error('Invalid userId');
  }

  const normalizedState = sanitizeState(state);
  const stateMap = await readAllStates();
  stateMap[normalizedUserId] = normalizedState;
  await writeAllStates(stateMap);
  return normalizedState;
};