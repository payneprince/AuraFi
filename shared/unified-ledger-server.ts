import { promises as fs } from 'fs';
import path from 'path';
import type { UnifiedLedgerEvent } from './unified-ledger';

type StoredEvent = UnifiedLedgerEvent;

const STORE_DIR = path.resolve(process.cwd(), '..', '.data');
const STORE_FILE = path.join(STORE_DIR, 'aura-unified-ledger-events.json');

const normalizeTimestamp = (raw: unknown) => {
  const value = String(raw || '').trim();
  if (!value) return new Date().toISOString();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
};

const sanitizeEvent = (raw: unknown): StoredEvent | null => {
  if (!raw || typeof raw !== 'object') return null;

  const source = raw as Record<string, unknown>;
  const id = String(source.id || '').trim();
  const userId = String(source.userId || '').trim();
  const app = String(source.app || '').trim();
  const type = String(source.type || '').trim();
  const currency = String(source.currency || 'USD').trim() || 'USD';
  const amount = Number(source.amount || 0);

  if (!id || !userId || !app || !type || !Number.isFinite(amount)) {
    return null;
  }

  const normalized: StoredEvent = {
    id,
    timestamp: normalizeTimestamp(source.timestamp),
    userId,
    app: app as StoredEvent['app'],
    type,
    amount,
    currency,
  };

  if (source.asset !== undefined && source.asset !== null) {
    normalized.asset = String(source.asset);
  }

  if (source.metadata && typeof source.metadata === 'object') {
    normalized.metadata = source.metadata as Record<string, any>;
  }

  return normalized;
};

const ensureStoreFile = async () => {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, '[]', 'utf8');
  }
};

const readAllEvents = async (): Promise<StoredEvent[]> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const events = parsed
      .map((entry) => sanitizeEvent(entry))
      .filter((entry): entry is StoredEvent => Boolean(entry));

    events.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    return events;
  } catch {
    return [];
  }
};

const writeAllEvents = async (events: StoredEvent[]) => {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(events, null, 2), 'utf8');
};

export const getUnifiedLedgerEventsForUser = async (userId?: string): Promise<StoredEvent[]> => {
  const normalizedUserId = String(userId || '').trim();
  const events = await readAllEvents();
  if (!normalizedUserId) return events;
  return events.filter((event) => event.userId === normalizedUserId);
};

export const appendUnifiedLedgerEventForUser = async (
  userId: string,
  rawEvent: unknown,
): Promise<StoredEvent> => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    throw new Error('Invalid userId');
  }

  const source = (rawEvent && typeof rawEvent === 'object') ? (rawEvent as Record<string, unknown>) : {};
  const nextEvent: StoredEvent = {
    id: String(source.id || `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    timestamp: normalizeTimestamp(source.timestamp),
    userId: normalizedUserId,
    app: String(source.app || 'finance') as StoredEvent['app'],
    type: String(source.type || 'funding.deposit'),
    amount: Number(source.amount || 0),
    currency: String(source.currency || 'USD') || 'USD',
  };

  if (source.asset !== undefined && source.asset !== null) {
    nextEvent.asset = String(source.asset);
  }
  if (source.metadata && typeof source.metadata === 'object') {
    nextEvent.metadata = source.metadata as Record<string, any>;
  }

  if (!Number.isFinite(nextEvent.amount)) {
    throw new Error('Invalid amount');
  }

  const events = await readAllEvents();
  const existingIndex = events.findIndex((event) => event.id === nextEvent.id);

  if (existingIndex >= 0) {
    events[existingIndex] = nextEvent;
  } else {
    events.push(nextEvent);
  }

  events.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  await writeAllEvents(events);
  return nextEvent;
};
