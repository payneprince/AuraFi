import { findBrowserRegisteredUserById } from '../../../shared/browser-user-directory';
import { appendUnifiedLedgerEvent, getUnifiedLedgerEvents } from '../../../shared/unified-ledger';
import { readUnifiedAuthSession } from '../../../shared/unified-auth';
// @ts-ignore
import { users, walletData } from '@/lib/shared/mock-data';

type WalletTransaction = (typeof walletData.transactions)[number];

type WalletState = {
  balance: number;
  transactions: WalletTransaction[];
};

const walletStateKey = (userId: string) => `aurawallet_state_${userId}`;
const walletScopedKey = (userId: string, key: string) => `${key}_${userId}`;

const demoWalletState = (): WalletState => ({
  balance: 500,
  transactions: [
    { id: 1, amount: -20, description: 'Coffee Shop', date: '2024-01-15' },
    { id: 2, amount: 100, description: 'Transfer from Bank', date: '2024-01-14' },
  ] as WalletTransaction[],
});

const emptyWalletState = (): WalletState => ({
  balance: 0,
  transactions: [],
});

export const getActiveWalletUserId = () => {
  if (typeof window === 'undefined') return '1';
  return String(readUnifiedAuthSession()?.userId || sessionStorage.getItem('aurasuite_userId') || '1');
};

export const getWalletScopedStorageKey = (key: string) => {
  const userId = getActiveWalletUserId();
  return walletScopedKey(userId, key);
};

export const loadWalletStateForUser = (userId: string): WalletState => {
  if (typeof window === 'undefined') {
    return userId === '1' ? demoWalletState() : emptyWalletState();
  }

  try {
    const raw = window.localStorage.getItem(walletStateKey(userId));
    if (!raw) {
      return userId === '1' ? demoWalletState() : emptyWalletState();
    }

    const parsed = JSON.parse(raw) as Partial<WalletState>;
    return {
      balance: Number(parsed.balance || 0),
      transactions: Array.isArray(parsed.transactions) ? (parsed.transactions as WalletTransaction[]) : [],
    };
  } catch {
    return userId === '1' ? demoWalletState() : emptyWalletState();
  }
};

export const persistWalletStateForUser = (userId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(walletStateKey(userId), JSON.stringify({
    balance: Number(walletData.balance || 0),
    transactions: walletData.transactions || [],
  }));
};

export const appendWalletLedgerEvent = async (params: {
  type: 'funding.deposit' | 'funding.withdrawal';
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
}) => {
  const activeUserId = getActiveWalletUserId();
  const events = await getUnifiedLedgerEvents(activeUserId);
  const sourceActionId = String(params.metadata?.sourceActionId || '');

  if (sourceActionId) {
    const exists = events.some((event) => String(event.metadata?.sourceActionId || '') === sourceActionId);
    if (exists) {
      return null;
    }
  }

  return appendUnifiedLedgerEvent({
    userId: activeUserId,
    app: 'wallet',
    type: params.type,
    amount: Number(params.amount || 0),
    currency: 'USD',
    metadata: params.metadata,
  });
};

export const hydrateWalletRuntimeForUser = (params: { userId: string; name?: string; email?: string }) => {
  const userId = String(params.userId || '1');
  const state = loadWalletStateForUser(userId);
  walletData.balance = Number(state.balance || 0);
  walletData.transactions.length = 0;
  walletData.transactions.push(...state.transactions);

  const existingUser = users.find((user: { id: number }) => String(user.id) === userId);
  if (!existingUser) {
    const registeredUser = findBrowserRegisteredUserById(userId);
    users.push({
      id: Number.parseInt(userId, 10) || users.length + 1,
      email: params.email || registeredUser?.email || `user${userId}@aurafinance.com`,
      password: registeredUser?.password || 'demo123',
      name: params.name || registeredUser?.name || `User ${userId}`,
      avatar: '/images/avatar.jpg',
    });
  }

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('aurasuite_userId', userId);
  }

  return state;
};