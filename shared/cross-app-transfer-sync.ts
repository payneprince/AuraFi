type TransferApp = 'bank' | 'wallet' | 'vest';

type AppliedBy = Partial<Record<TransferApp, boolean>>;

export interface CrossAppTransferEvent {
  id: string;
  userId: string;
  fromApp: TransferApp;
  toApp: TransferApp;
  amount: number;
  timestamp: string;
  description?: string;
  appliedBy?: AppliedBy;
}

const TRANSFER_QUEUE_COOKIE = 'aurasuite_transfer_queue';
const MAX_EVENTS = 25;

const hasBrowser = () => typeof document !== 'undefined';

const parseCookies = (): Record<string, string> => {
  if (!hasBrowser()) return {};
  return document.cookie
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const index = item.indexOf('=');
      if (index === -1) return acc;
      const key = item.slice(0, index);
      const value = item.slice(index + 1);
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
};

const readQueue = (): CrossAppTransferEvent[] => {
  if (!hasBrowser()) return [];
  try {
    const raw = parseCookies()[TRANSFER_QUEUE_COOKIE];
    if (!raw) return [];
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? (parsed as CrossAppTransferEvent[]) : [];
  } catch {
    return [];
  }
};

const writeQueue = (events: CrossAppTransferEvent[]) => {
  if (!hasBrowser()) return;
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  const trimmed = events
    .slice(-MAX_EVENTS)
    .map((event) => ({ ...event, amount: Number(event.amount || 0) }));
  document.cookie = `${TRANSFER_QUEUE_COOKIE}=${encodeURIComponent(JSON.stringify(trimmed))}; expires=${expires}; path=/; SameSite=Lax`;
};

export const enqueueCrossAppTransfer = (event: Omit<CrossAppTransferEvent, 'timestamp' | 'appliedBy'>) => {
  if (!hasBrowser()) return;
  const queue = readQueue();
  const exists = queue.some((item) => item.id === event.id);
  if (exists) return;

  queue.push({
    ...event,
    amount: Number(event.amount || 0),
    timestamp: new Date().toISOString(),
    appliedBy: {},
  });

  writeQueue(queue);
};

export const claimCrossAppTransfersForApp = (app: TransferApp, userId: string): CrossAppTransferEvent[] => {
  if (!hasBrowser()) return [];

  const normalizedUserId = String(userId || '');
  if (!normalizedUserId) return [];

  const queue = readQueue();
  const claimed: CrossAppTransferEvent[] = [];

  for (const item of queue) {
    if (String(item.userId) !== normalizedUserId) continue;
    if (item.fromApp !== app && item.toApp !== app) continue;

    const appliedBy: AppliedBy = item.appliedBy || {};
    if (appliedBy[app]) continue;

    claimed.push(item);
    appliedBy[app] = true;
    item.appliedBy = appliedBy;
  }

  if (claimed.length > 0) {
    writeQueue(queue);
  }

  return claimed;
};
