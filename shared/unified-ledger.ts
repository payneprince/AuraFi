/**
 * UNIFIED LEDGER SYSTEM
 * Central source of truth for all user financial data across AuraBank, AuraVest, and AuraWallet
 */

export type AppSource = 'bank' | 'wallet' | 'vest';
export type TransactionType = 'credit' | 'debit' | 'transfer' | 'trade' | 'investment';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

// ===== CORE TYPES =====

export interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: string;
  accountNumber: string;
  availableBalance?: number;
  creditLimit?: number;
}

export interface WalletAccount {
  balance: number;
  currency: string;
}

export interface VestHolding {
  id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'crypto' | 'gold' | 'nft';
  quantity: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  unrealizedPnL: number;
}

export interface UnifiedTransaction {
  id: string;
  userId: string;
  source: AppSource;
  type: TransactionType;
  amount: number;
  currency: string;
  from?: { app: AppSource; accountId?: string; accountName?: string };
  to?: { app: AppSource; accountId?: string; accountName?: string };
  description: string;
  timestamp: string;
  status: TransactionStatus;
  category?: string;
  merchant?: string;
  metadata?: Record<string, any>;
}

export interface UnifiedLedger {
  userId: string;
  accounts: {
    bank: BankAccount[];
    wallet: WalletAccount;
    vestHoldings: VestHolding[];
  };
  transactions: UnifiedTransaction[];
  balances: {
    totalNetWorth: number;
    bankTotal: number;
    walletTotal: number;
    vestTotal: number;
  };
  lastSync: string;
  version: number; // For optimistic concurrency control
}

// ===== LEDGER SERVICE =====

const LEDGER_KEY = 'aura_unified_ledger';
const LEDGER_VERSION = 1;

export class LedgerService {
  private static instance: LedgerService;
  private ledger: UnifiedLedger | null = null;
  private listeners: Set<(ledger: UnifiedLedger) => void> = new Set();

  private constructor() {
    this.loadLedger();
    this.setupBroadcastChannel();
  }

  static getInstance(): LedgerService {
    if (!LedgerService.instance) {
      LedgerService.instance = new LedgerService();
    }
    return LedgerService.instance;
  }

  // ===== BROADCAST CHANNEL FOR CROSS-TAB SYNC =====
  private channel: BroadcastChannel | null = null;

  private setupBroadcastChannel() {
    if (typeof window === 'undefined') return;
    
    this.channel = new BroadcastChannel('aura_ledger_sync');
    this.channel.onmessage = (event) => {
      if (event.data.type === 'ledger_updated') {
        this.loadLedger();
        this.notifyListeners();
      }
    };
  }

  private broadcastUpdate() {
    this.channel?.postMessage({ type: 'ledger_updated', timestamp: Date.now() });
  }

  // ===== PERSISTENCE =====

  private loadLedger(): UnifiedLedger | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(LEDGER_KEY);
      if (stored) {
        this.ledger = JSON.parse(stored);
        return this.ledger;
      }
    } catch (error) {
      console.error('Failed to load ledger:', error);
    }
    return null;
  }

  private saveLedger(): boolean {
    if (typeof window === 'undefined' || !this.ledger) return false;

    try {
      this.ledger.lastSync = new Date().toISOString();
      this.ledger.version += 1;
      localStorage.setItem(LEDGER_KEY, JSON.stringify(this.ledger));
      this.broadcastUpdate();
      return true;
    } catch (error) {
      console.error('Failed to save ledger:', error);
      return false;
    }
  }

  // ===== INITIALIZATION =====

  initializeLedger(userId: string, initialData?: Partial<UnifiedLedger>): UnifiedLedger {
    this.ledger = {
      userId,
      accounts: initialData?.accounts || {
        bank: [],
        wallet: { balance: 0, currency: 'USD' },
        vestHoldings: [],
      },
      transactions: initialData?.transactions || [],
      balances: {
        totalNetWorth: 0,
        bankTotal: 0,
        walletTotal: 0,
        vestTotal: 0,
      },
      lastSync: new Date().toISOString(),
      version: LEDGER_VERSION,
    };

    this.recalculateBalances();
    this.saveLedger();
    return this.ledger;
  }

  // ===== BALANCE CALCULATIONS =====

  private recalculateBalances() {
    if (!this.ledger) return;

    const bankTotal = this.ledger.accounts.bank.reduce((sum, acc) => sum + acc.balance, 0);
    const walletTotal = this.ledger.accounts.wallet.balance;
    const vestTotal = this.ledger.accounts.vestHoldings.reduce((sum, holding) => sum + holding.currentValue, 0);

    this.ledger.balances = {
      bankTotal,
      walletTotal,
      vestTotal,
      totalNetWorth: bankTotal + walletTotal + vestTotal,
    };
  }

  // ===== GETTERS =====

  getLedger(): UnifiedLedger | null {
    return this.ledger;
  }

  getBalances() {
    return this.ledger?.balances || null;
  }

  getTransactions(filter?: { source?: AppSource; limit?: number }): UnifiedTransaction[] {
    if (!this.ledger) return [];

    let txns = [...this.ledger.transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (filter?.source) {
      txns = txns.filter(t => t.source === filter.source);
    }

    if (filter?.limit) {
      txns = txns.slice(0, filter.limit);
    }

    return txns;
  }

  // ===== ACCOUNT MANAGEMENT =====

  updateBankAccounts(accounts: BankAccount[]) {
    if (!this.ledger) return false;
    this.ledger.accounts.bank = accounts;
    this.recalculateBalances();
    this.saveLedger();
    this.notifyListeners();
    return true;
  }

  updateWalletBalance(balance: number) {
    if (!this.ledger) return false;
    this.ledger.accounts.wallet.balance = balance;
    this.recalculateBalances();
    this.saveLedger();
    this.notifyListeners();
    return true;
  }

  updateVestHoldings(holdings: VestHolding[]) {
    if (!this.ledger) return false;
    this.ledger.accounts.vestHoldings = holdings;
    this.recalculateBalances();
    this.saveLedger();
    this.notifyListeners();
    return true;
  }

  // ===== TRANSACTION MANAGEMENT =====

  addTransaction(transaction: Omit<UnifiedTransaction, 'id' | 'timestamp'>): string | null {
    if (!this.ledger) return null;

    const newTransaction: UnifiedTransaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.ledger.transactions.unshift(newTransaction);
    this.saveLedger();
    this.notifyListeners();

    return newTransaction.id;
  }

  // ===== TRANSFER OPERATIONS =====

  transferBetweenApps(params: {
    fromApp: AppSource;
    toApp: AppSource;
    amount: number;
    currency: string;
    fromAccountId?: string;
    toAccountId?: string;
    description?: string;
  }): { success: boolean; transactionId?: string; error?: string } {
    if (!this.ledger) {
      return { success: false, error: 'Ledger not initialized' };
    }

    const { fromApp, toApp, amount, currency, fromAccountId, toAccountId, description } = params;

    // Validate amount
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // Deduct from source
    let sourceBalance = 0;
    let sourceName = '';

    if (fromApp === 'bank') {
      const account = this.ledger.accounts.bank.find(a => a.id === fromAccountId);
      if (!account) {
        return { success: false, error: 'Source bank account not found' };
      }
      if (account.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }
      account.balance -= amount;
      if (account.availableBalance !== undefined) {
        account.availableBalance -= amount;
      }
      sourceName = account.name;
      sourceBalance = account.balance;
    } else if (fromApp === 'wallet') {
      if (this.ledger.accounts.wallet.balance < amount) {
        return { success: false, error: 'Insufficient wallet balance' };
      }
      this.ledger.accounts.wallet.balance -= amount;
      sourceName = 'Wallet';
      sourceBalance = this.ledger.accounts.wallet.balance;
    } else {
      return { success: false, error: 'Vest transfers not yet implemented' };
    }

    // Add to destination
    let destName = '';

    if (toApp === 'bank') {
      const account = this.ledger.accounts.bank.find(a => a.id === toAccountId);
      if (!account) {
        return { success: false, error: 'Destination bank account not found' };
      }
      account.balance += amount;
      if (account.availableBalance !== undefined) {
        account.availableBalance += amount;
      }
      destName = account.name;
    } else if (toApp === 'wallet') {
      this.ledger.accounts.wallet.balance += amount;
      destName = 'Wallet';
    } else if (toApp === 'vest') {
      // In real implementation, this would buy assets
      destName = 'Investment Account';
    }

    // Create transaction record
    const transactionId = this.addTransaction({
      userId: this.ledger.userId,
      source: fromApp,
      type: 'transfer',
      amount,
      currency,
      from: { app: fromApp, accountId: fromAccountId, accountName: sourceName },
      to: { app: toApp, accountId: toAccountId, accountName: destName },
      description: description || `Transfer from ${fromApp} to ${toApp}`,
      status: 'completed',
      category: 'Transfer',
    });

    this.recalculateBalances();
    this.saveLedger();
    this.notifyListeners();

    return { success: true, transactionId: transactionId || undefined };
  }

  // ===== EVENT LISTENERS =====

  subscribe(callback: (ledger: UnifiedLedger) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    if (!this.ledger) return;
    this.listeners.forEach(callback => callback(this.ledger!));
  }

  // ===== UTILITY =====

  exportToJSON(): string | null {
    if (!this.ledger) return null;
    return JSON.stringify(this.ledger, null, 2);
  }

  importFromJSON(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      this.ledger = imported;
      this.saveLedger();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to import ledger:', error);
      return false;
    }
  }

  clearLedger() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LEDGER_KEY);
    this.ledger = null;
  }
}

// ===== SINGLETON INSTANCE =====

export const ledgerService = typeof window !== 'undefined' ? LedgerService.getInstance() : null;

// ===== UNIFIED EVENT LEDGER MVP =====

export type UnifiedLedgerEventType =
  | 'trade.buy'
  | 'trade.sell'
  | 'funding.deposit'
  | 'funding.withdrawal'
  | 'transfer.bank_to_vest'
  | 'transfer.bank_to_wallet'
  | 'transfer.vest_to_wallet'
  | 'transfer.wallet_to_bank'
  | 'transfer.wallet_to_vest'
  | string;

export interface UnifiedLedgerEvent {
  id: string;
  timestamp: string;
  userId: string;
  app: AppSource | 'finance';
  type: UnifiedLedgerEventType;
  amount: number;
  asset?: string;
  currency: string;
  metadata?: Record<string, any>;
}

export interface UnifiedReplayState {
  cashByApp: Record<string, number>;
  holdingsBySymbol: Record<string, { quantity: number; costBasis: number; lastPrice: number }>;
  totalNetWorthEstimate: number;
}

const EVENT_LEDGER_KEY = 'aura_unified_ledger_events';
const EVENT_LEDGER_CHANNEL = 'aura-ledger-sync';
const EVENT_DB_NAME = 'auraUnifiedLedgerDB';
const EVENT_STORE_NAME = 'events';
const EVENT_API_ENDPOINT = '/api/unified-ledger';

const isBrowser = () => typeof window !== 'undefined';

const openEventDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(EVENT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EVENT_STORE_NAME)) {
        const store = db.createObjectStore(EVENT_STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const readEventFallback = (): UnifiedLedgerEvent[] => {
  if (!isBrowser()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(EVENT_LEDGER_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeEventFallback = (events: UnifiedLedgerEvent[]) => {
  if (!isBrowser()) return;
  localStorage.setItem(EVENT_LEDGER_KEY, JSON.stringify(events));
};

const broadcastEventLedgerUpdate = () => {
  if (!isBrowser() || typeof BroadcastChannel === 'undefined') return;
  try {
    const channel = new BroadcastChannel(EVENT_LEDGER_CHANNEL);
    channel.postMessage({ type: 'ledger.updated', timestamp: new Date().toISOString() });
    channel.close();
  } catch {
    // no-op
  }
};

const fetchEventsFromServer = async (userId?: string): Promise<UnifiedLedgerEvent[] | null> => {
  if (!isBrowser()) return null;

  try {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${EVENT_API_ENDPOINT}${query}`, { cache: 'no-store' });
    if (!response.ok) return null;

    const payload = await response.json() as { events?: UnifiedLedgerEvent[] };
    if (!Array.isArray(payload?.events)) return [];

    return payload.events
      .filter((event) => event && typeof event === 'object')
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  } catch {
    return null;
  }
};

const appendEventToServer = async (event: UnifiedLedgerEvent): Promise<UnifiedLedgerEvent | null> => {
  if (!isBrowser()) return null;

  try {
    const response = await fetch(EVENT_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: event.userId, event }),
      keepalive: true,
    });

    if (!response.ok) return null;

    const payload = await response.json() as { event?: UnifiedLedgerEvent };
    if (!payload?.event) return event;
    return payload.event;
  } catch {
    return null;
  }
};

export async function getUnifiedLedgerEvents(userId?: string): Promise<UnifiedLedgerEvent[]> {
  if (!isBrowser()) return [];

  const serverEvents = await fetchEventsFromServer(userId);
  if (serverEvents) {
    return serverEvents;
  }

  try {
    const db = await openEventDb();
    const tx = db.transaction(EVENT_STORE_NAME, 'readonly');
    const store = tx.objectStore(EVENT_STORE_NAME);
    const request = store.getAll();

    const events: UnifiedLedgerEvent[] = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve((request.result || []) as UnifiedLedgerEvent[]);
      request.onerror = () => reject(request.error);
    });

    const filtered = userId ? events.filter((event) => event.userId === userId) : events;
    return filtered.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  } catch {
    const fallback = readEventFallback();
    const filtered = userId ? fallback.filter((event) => event.userId === userId) : fallback;
    return filtered.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }
}

export async function appendUnifiedLedgerEvent(
  event: Omit<UnifiedLedgerEvent, 'id' | 'timestamp'>,
): Promise<UnifiedLedgerEvent> {
  const newEvent: UnifiedLedgerEvent = {
    ...event,
    id: `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  if (!isBrowser()) return newEvent;

  const persistedEvent = await appendEventToServer(newEvent);
  if (persistedEvent) {
    broadcastEventLedgerUpdate();
    return persistedEvent;
  }

  try {
    const db = await openEventDb();
    const tx = db.transaction(EVENT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(EVENT_STORE_NAME);
    store.put(newEvent);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch {
    const events = readEventFallback();
    events.push(newEvent);
    writeEventFallback(events);
  }

  broadcastEventLedgerUpdate();
  return newEvent;
}

export async function replayUnifiedLedger(userId: string): Promise<UnifiedReplayState> {
  const events = await getUnifiedLedgerEvents(userId);

  const state: UnifiedReplayState = {
    cashByApp: { bank: 0, vest: 0, wallet: 0, finance: 0 },
    holdingsBySymbol: {},
    totalNetWorthEstimate: 0,
  };

  for (const event of events) {
    const amount = Number(event.amount || 0);

    if (event.type === 'funding.deposit') {
      state.cashByApp[event.app] = (state.cashByApp[event.app] || 0) + amount;
      continue;
    }

    if (event.type === 'funding.withdrawal') {
      state.cashByApp[event.app] = (state.cashByApp[event.app] || 0) - amount;
      continue;
    }

    if (event.type.startsWith('transfer.')) {
      const fromApp = String(event.app || '');
      const toApp = String(event.metadata?.toApp || '');
      if (fromApp && Object.prototype.hasOwnProperty.call(state.cashByApp, fromApp)) {
        state.cashByApp[fromApp] = (state.cashByApp[fromApp] || 0) - amount;
      }
      if (toApp && Object.prototype.hasOwnProperty.call(state.cashByApp, toApp)) {
        state.cashByApp[toApp] = (state.cashByApp[toApp] || 0) + amount;
      }
      continue;
    }

    if (event.type === 'trade.buy' || event.type === 'trade.sell') {
      const symbol = String(event.asset || event.metadata?.asset || '').toUpperCase();
      const qty = Number(event.metadata?.amount || 0);
      const price = Number(event.metadata?.price || 0);
      const fee = Number(event.metadata?.fee || 0);

      if (!symbol || !Number.isFinite(qty) || qty <= 0) continue;

      const current = state.holdingsBySymbol[symbol] || {
        quantity: 0,
        costBasis: 0,
        lastPrice: price,
      };

      if (event.type === 'trade.buy') {
        current.quantity += qty;
        current.costBasis += qty * price + fee;
        state.cashByApp[event.app] = (state.cashByApp[event.app] || 0) - amount;
      } else {
        const average = current.quantity > 0 ? current.costBasis / current.quantity : 0;
        const sellQty = Math.min(current.quantity, qty);
        current.quantity -= sellQty;
        current.costBasis = Math.max(0, current.costBasis - sellQty * average);
        state.cashByApp[event.app] = (state.cashByApp[event.app] || 0) + amount;
      }

      current.lastPrice = price || current.lastPrice;
      if (current.quantity > 0) {
        state.holdingsBySymbol[symbol] = current;
      } else {
        delete state.holdingsBySymbol[symbol];
      }
      continue;
    }
  }

  const cashTotal = Object.values(state.cashByApp).reduce((sum, value) => sum + Number(value || 0), 0);
  const holdingsValue = Object.values(state.holdingsBySymbol).reduce(
    (sum, holding) => sum + (holding.quantity * holding.lastPrice),
    0,
  );
  state.totalNetWorthEstimate = Number((cashTotal + holdingsValue).toFixed(2));

  return state;
}

export function subscribeToUnifiedLedgerUpdates(onUpdate: () => void): () => void {
  if (!isBrowser() || typeof BroadcastChannel === 'undefined') return () => undefined;

  const channel = new BroadcastChannel(EVENT_LEDGER_CHANNEL);
  channel.onmessage = (event) => {
    if (event?.data?.type === 'ledger.updated') {
      onUpdate();
    }
  };

  return () => {
    channel.close();
  };
}
