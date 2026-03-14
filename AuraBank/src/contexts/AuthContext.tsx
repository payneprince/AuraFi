'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { User, Account, Transaction, Card, Bill, Budget, Notification, RecurringTransaction } from '@/types';
import { getUser } from '@/lib/shared/mock-data';
import { persistScopedAppStorage, switchScopedAppStorage } from '../../../shared/browser-app-state';
import { AURABANK_STORAGE_KEYS } from '@/lib/bankStateKeys';
import { findBrowserRegisteredUserByEmail } from '../../../shared/browser-user-directory';
import {
  clearUnifiedAuthSession,
  readUnifiedAuthSession,
  subscribeUnifiedAuthSession,
  writeUnifiedAuthSession,
} from '../../../shared/unified-auth';
import { claimCrossAppTransfersForApp } from '../../../shared/cross-app-transfer-sync';
import { appendUnifiedLedgerEvent, getUnifiedLedgerEvents } from '../../../shared/unified-ledger';

interface AuthContextType {
  user: User | null;
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
  bills: Bill[];
  budgets: Budget[];
  notifications: Notification[];
  recurringTransactions: RecurringTransaction[];
  soundEnabled: boolean;
  theme: 'light' | 'dark';
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateAccounts: (accounts: Account[]) => void;
  updateBills: (bills: Bill[]) => void;
  addTransaction: (transaction: Transaction) => void;
  addRecurringTransaction: (transaction: RecurringTransaction) => void;
  processRecurringTransactions: () => void;
  updateCards: (cards: Card[]) => void;
  addNotification: (notification: Notification) => void;
  addCard: (card: Card) => void;
  replaceCard: (cardId: string, newCard: Card) => void;
  markNotificationRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  toggleSound: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isReady, setIsReady] = useState(false);
  const lastServerStateSnapshotRef = useRef('');

  const createBankUserProfile = useCallback((params: { id: string; name?: string; email?: string }): User => ({
    id: params.id,
    name: params.name || 'User',
    email: params.email || 'user@aurabank.com',
    avatar: '/profile.jpg',
  }), []);

  const buildBankStorageDefaults = useCallback((targetUser: User) => {
    const isDemoUser = String(targetUser.id) === '1' || String(targetUser.email).toLowerCase() === 'demo@aurafinance.com';
    const demoUser = getUser('user_123');

    const demoAccounts = isDemoUser ? (demoUser?.bank?.accounts || []) : [];
    const demoTransactions = isDemoUser
      ? (demoUser?.bank?.accounts?.flatMap((account: any) => (account.transactions || []).map((tx: any) => ({ ...tx, accountId: account.id }))) || [])
      : [];
    const demoCards = isDemoUser ? (demoUser?.bank?.cards || []) : [];
    const demoBills = isDemoUser ? (demoUser?.bank?.bills || []) : [];
    const demoBudgets = isDemoUser ? (demoUser?.bank?.budgets || []) : [];

    return {
      aurabank_user: JSON.stringify(targetUser),
      aurabank_accounts: JSON.stringify(demoAccounts),
      aurabank_transactions: JSON.stringify(demoTransactions),
      aurabank_cards: JSON.stringify(demoCards),
      aurabank_bills: JSON.stringify(demoBills),
      aurabank_budgets: JSON.stringify(demoBudgets),
      aurabank_notifications: JSON.stringify([]),
      aurabank_recurring: JSON.stringify([]),
      aurabank_sound: JSON.stringify(true),
      aurabank_theme: JSON.stringify('light'),
    };
  }, []);

  const resolveLedgerUserId = useCallback(() => String(user?.id || readUnifiedAuthSession()?.userId || '1'), [user?.id]);

  const applyBankStateForUser = useCallback((targetUser: User) => {
    switchScopedAppStorage({
      appName: 'aurabank',
      userId: String(targetUser.id),
      genericKeys: [...AURABANK_STORAGE_KEYS],
      defaults: buildBankStorageDefaults(targetUser),
    });
  }, [buildBankStorageDefaults]);

  const syncBankBalanceSnapshotCookie = (accountList: Account[]) => {
    if (typeof document === 'undefined' || !accountList || accountList.length === 0) return;

    const totalBalance = accountList.reduce((sum, account) => {
      if (account.type === 'credit') return sum;
      return sum + Number(account.balance || 0);
    }, 0);

    const snapshot = {
      totalBalance: Number(totalBalance.toFixed(2)),
      updatedAt: new Date().toISOString(),
    };

    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `aurabank_balance_snapshot=${encodeURIComponent(JSON.stringify(snapshot))}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const syncBankSourcesSnapshotCookie = (accountList: Account[], cardList: Card[]) => {
    if (typeof document === 'undefined') return;

    const compactAccounts = (accountList || []).map((account) => ({
      id: String(account.id),
      name: account.name,
      type: account.type,
      balance: Number(account.balance || 0),
      availableBalance: Number(account.availableBalance ?? account.balance ?? 0),
      accountNumber: String(account.accountNumber || ''),
      currency: account.currency || 'USD',
    }));

    const compactCards = (cardList || []).map((card) => ({
      id: String(card.id),
      accountId: String(card.accountId || ''),
      type: card.type,
      brand: card.brand,
      status: card.status,
      cardNumber: String(card.cardNumber || ''),
      cardHolder: card.cardHolder || '',
    }));

    const snapshot = {
      accounts: compactAccounts,
      cards: compactCards,
      updatedAt: new Date().toISOString(),
    };

    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `aurabank_sources_snapshot=${encodeURIComponent(JSON.stringify(snapshot))}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const syncBankActivitySnapshotCookie = (transactionList: Transaction[], accountList: Account[]) => {
    if (typeof document === 'undefined') return;

    const accountCurrency = new Map((accountList || []).map((account) => [String(account.id), account.currency || 'USD']));
    const normalizedEvents = (transactionList || [])
      .map((transaction) => {
        const accountId = String((transaction as any).accountId || '');
        const timestampRaw = String((transaction as any).date || new Date().toISOString());
        const timestamp = Number.isNaN(Date.parse(timestampRaw)) ? new Date().toISOString() : new Date(timestampRaw).toISOString();
        return {
          id: `aurabank-${String((transaction as any).id || Date.now())}`,
          app: 'AuraBank',
          type: String((transaction as any).type || ((transaction as any).amount >= 0 ? 'credit' : 'debit')),
          title: String((transaction as any).description || 'Bank transaction'),
          amount: Number((transaction as any).amount || 0),
          currency: accountCurrency.get(accountId) || 'USD',
          timestamp,
          status: String((transaction as any).status || 'completed'),
          meta: {
            accountId,
            category: String((transaction as any).category || ''),
          },
        };
      })
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 40);

    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `aurabank_activity_snapshot=${encodeURIComponent(JSON.stringify(normalizedEvents))}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const syncBankTransactionsToUnifiedLedger = useCallback(async (transactionList: Transaction[]) => {
    const events = await getUnifiedLedgerEvents(resolveLedgerUserId());
    const mappedTxIds = new Set(
      events
        .map((event: any) => String(event?.metadata?.sourceTxId || ''))
        .filter(Boolean),
    );

    for (const tx of transactionList || []) {
      const sourceTxId = String(tx?.id || '');
      if (!sourceTxId || mappedTxIds.has(sourceTxId)) continue;

      const txAmount = Number(tx?.amount || 0);
      const eventType = txAmount >= 0 ? 'funding.deposit' : 'funding.withdrawal';

      await appendUnifiedLedgerEvent({
        userId: resolveLedgerUserId(),
        app: 'bank',
        type: eventType,
        amount: Math.abs(txAmount),
        currency: 'USD',
        metadata: {
          sourceTxId,
          accountId: String(tx?.accountId || ''),
          category: String(tx?.category || ''),
          description: String(tx?.description || ''),
          status: String(tx?.status || 'completed'),
          timestamp: String(tx?.date || new Date().toISOString()),
        },
      });

      mappedTxIds.add(sourceTxId);
    }
  }, [resolveLedgerUserId]);

  const captureBankStateSnapshot = useCallback(() => {
    const snapshot: Record<string, string | null> = {};
    for (const key of AURABANK_STORAGE_KEYS) {
      snapshot[key] = localStorage.getItem(key);
    }
    return snapshot;
  }, []);

  const persistBankStateToServer = useCallback(async (targetUserId: string) => {
    const normalizedUserId = String(targetUserId || '').trim();
    if (!normalizedUserId) return;

    const state = captureBankStateSnapshot();
    const serialized = JSON.stringify(state);
    if (serialized === lastServerStateSnapshotRef.current) return;

    try {
      await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: normalizedUserId, state }),
        keepalive: true,
      });
      lastServerStateSnapshotRef.current = serialized;
    } catch {
      // Ignore transient network/server failures and retry on next state change.
    }
  }, [captureBankStateSnapshot]);

  useEffect(() => {
    const unifiedSession = readUnifiedAuthSession();
    const genericSavedUser = localStorage.getItem('aurabank_user');
    const parsedSavedUser = genericSavedUser ? (JSON.parse(genericSavedUser) as User) : null;

    const targetUser = unifiedSession
      ? createBankUserProfile({
          id: unifiedSession.userId,
          name: unifiedSession.name || 'User',
          email: unifiedSession.email || 'user@aurabank.com',
        })
      : (parsedSavedUser || createBankUserProfile({ id: '1', name: 'Demo User', email: 'demo@aurafinance.com' }));

    const bootstrap = async () => {
      try {
        const response = await fetch(`/api/state?userId=${encodeURIComponent(String(targetUser.id))}`);
        if (response.ok) {
          const payload = await response.json() as { state?: Record<string, string | null> | null };
          if (payload?.state) {
            localStorage.setItem(`aurasuite_aurabank_state_${String(targetUser.id)}`, JSON.stringify(payload.state));
          }
        }
      } catch {
        // Fallback to existing local state/default snapshot.
      }

      applyBankStateForUser(targetUser);

      const savedUser = localStorage.getItem('aurabank_user');
      const savedAccounts = localStorage.getItem('aurabank_accounts');
      const savedTransactions = localStorage.getItem('aurabank_transactions');
      const savedCards = localStorage.getItem('aurabank_cards');
      const savedBills = localStorage.getItem('aurabank_bills');
      const savedBudgets = localStorage.getItem('aurabank_budgets');
      const savedNotifications = localStorage.getItem('aurabank_notifications');
      const savedRecurring = localStorage.getItem('aurabank_recurring');
      const savedSound = localStorage.getItem('aurabank_sound');
      const savedTheme = localStorage.getItem('aurabank_theme');

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts));
      }

      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }

      if (savedCards) {
        const parsedCards = JSON.parse(savedCards);
        const updatedCards = parsedCards.map((card: Card) => ({
          ...card,
          cardHolder: card.cardHolder === 'PRINCE' ? 'DEMO USER' : card.cardHolder
        }));
        setCards(updatedCards);
      }

      if (savedBills) {
        setBills(JSON.parse(savedBills));
      }

      if (savedBudgets) {
        setBudgets(JSON.parse(savedBudgets));
      }

      if (!savedUser || (!savedAccounts && !savedTransactions && (!savedCards || JSON.parse(savedCards).length === 0) && !savedBills && !savedBudgets)) {
        const mockUser = getUser('user_123');
        if (mockUser && String(targetUser.id) === '1') {
          if (!savedUser) {
            const defaultUser: User = {
              id: 'user_123',
              name: mockUser.name || 'Prince',
              email: mockUser.email || 'prince@test.com',
              phone: mockUser.phone || '+233 55 827 9979',
              address: mockUser.address || 'Accra, Ghana',
            };
            setUser(defaultUser);
          }

          if (mockUser.bank) {
            if (!savedAccounts) {
              setAccounts(mockUser.bank.accounts || []);
            }

            if (!savedTransactions) {
              const allTransactions = mockUser.bank.accounts?.flatMap((acc: any) =>
                (acc.transactions || []).map((tx: any) => ({ ...tx, accountId: acc.id }))
              ) || [];
              setTransactions(allTransactions);
            }

            if (!savedCards || JSON.parse(savedCards).length === 0) {
              setCards(mockUser.bank.cards || []);
            }

            if (!savedBills) {
              setBills(mockUser.bank.bills || []);
            }

            if (!savedBudgets) {
              setBudgets(mockUser.bank.budgets || []);
            }
          }
        }
      }

      if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
      if (savedRecurring) setRecurringTransactions(JSON.parse(savedRecurring));
      if (savedSound) setSoundEnabled(JSON.parse(savedSound));
      if (savedTheme) setTheme(JSON.parse(savedTheme));

      await persistBankStateToServer(String(targetUser.id));
      setIsReady(true);
    };

    void bootstrap();
  }, [applyBankStateForUser, createBankUserProfile, persistBankStateToServer]);

  useEffect(() => {
    if (!user?.id || !isReady) return;
    persistScopedAppStorage('aurabank', String(user.id), [...AURABANK_STORAGE_KEYS]);
    void persistBankStateToServer(String(user.id));
  }, [user, accounts, transactions, cards, bills, budgets, notifications, recurringTransactions, soundEnabled, theme, isReady, persistBankStateToServer]);

  useEffect(() => {
    return subscribeUnifiedAuthSession((session) => {
      if (!session) {
        setUser(null);
        localStorage.removeItem('aurabank_user');
        return;
      }

      const syncedUser = createBankUserProfile({
        id: session.userId,
        name: session.name || 'User',
        email: session.email || 'user@aurabank.com',
      });

      applyBankStateForUser(syncedUser);

      setUser((prevUser) => {
        if (prevUser && String(prevUser.id) === String(session.userId)) {
          return prevUser;
        }

        localStorage.setItem('aurabank_user', JSON.stringify(syncedUser));
        return syncedUser;
      });
    });
  }, [applyBankStateForUser, createBankUserProfile]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('aura-ledger-sync');
    channel.onmessage = (event) => {
      if (event?.data?.type !== 'ledger.updated') return;

      try {
        const savedAccounts = localStorage.getItem('aurabank_accounts');
        const savedTransactions = localStorage.getItem('aurabank_transactions');
        if (savedAccounts) {
          setAccounts(JSON.parse(savedAccounts));
        }
        if (savedTransactions) {
          setTransactions(JSON.parse(savedTransactions));
        }
      } catch {
        // no-op
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  useEffect(() => {
    syncBankBalanceSnapshotCookie(accounts);
  }, [accounts]);

  useEffect(() => {
    syncBankSourcesSnapshotCookie(accounts, cards);
  }, [accounts, cards]);

  useEffect(() => {
    syncBankActivitySnapshotCookie(transactions, accounts);
  }, [transactions, accounts]);

  useEffect(() => {
    void syncBankTransactionsToUnifiedLedger(transactions);
  }, [transactions, syncBankTransactionsToUnifiedLedger]);

  useEffect(() => {
    if (!user?.id || !isReady) return;

    const applyQueuedTransfers = () => {
      const transferEvents = claimCrossAppTransfersForApp('bank', String(user.id));
      if (transferEvents.length === 0) return;

      const storedAccounts = localStorage.getItem('aurabank_accounts');
      const storedTransactions = localStorage.getItem('aurabank_transactions');

      const nextAccounts: Account[] = storedAccounts ? JSON.parse(storedAccounts) : [...accounts];
      const nextTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : [...transactions];

      let targetIndex = nextAccounts.findIndex((account) => account.type !== 'credit');
      if (targetIndex < 0) {
        nextAccounts.push({
          id: 'bank-primary',
          name: 'Primary Checking',
          type: 'checking',
          balance: 0,
          accountNumber: '****0001',
          currency: 'USD',
          availableBalance: 0,
        });
        targetIndex = nextAccounts.length - 1;
      }

      for (const event of transferEvents) {
        const amount = Number(event.amount || 0);
        const delta = event.fromApp === 'bank' ? -amount : amount;
        const targetAccount = nextAccounts[targetIndex];

        targetAccount.balance = Number((targetAccount.balance + delta).toFixed(2));
        if (targetAccount.availableBalance !== undefined) {
          targetAccount.availableBalance = Number((Number(targetAccount.availableBalance || targetAccount.balance) + delta).toFixed(2));
        }

        nextTransactions.unshift({
          id: `bank-transfer-${event.id}`,
          accountId: String(targetAccount.id),
          type: delta < 0 ? 'debit' : 'credit',
          category: 'Transfer',
          description: delta < 0 ? `Transfer to ${event.toApp}` : `Transfer from ${event.fromApp}`,
          amount: Number(delta.toFixed(2)),
          date: event.timestamp,
          status: 'completed',
          merchant: 'Aura Finance',
        });
      }

      setAccounts(nextAccounts);
      setTransactions(nextTransactions.slice(0, 500));
      localStorage.setItem('aurabank_accounts', JSON.stringify(nextAccounts));
      localStorage.setItem('aurabank_transactions', JSON.stringify(nextTransactions.slice(0, 500)));
    };

    applyQueuedTransfers();
    const intervalId = window.setInterval(applyQueuedTransfers, 1200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user?.id, isReady, accounts, transactions]);

  useEffect(() => {
    if (!user?.id || !isReady) return;

    const pullServerState = async () => {
      try {
        const response = await fetch(`/api/state?userId=${encodeURIComponent(String(user.id))}`);
        if (!response.ok) return;

        const payload = await response.json() as { state?: Record<string, string | null> | null };
        if (!payload?.state) return;

        localStorage.setItem(`aurasuite_aurabank_state_${String(user.id)}`, JSON.stringify(payload.state));
        applyBankStateForUser(user);

        const savedAccounts = localStorage.getItem('aurabank_accounts');
        const savedTransactions = localStorage.getItem('aurabank_transactions');
        const savedCards = localStorage.getItem('aurabank_cards');
        const savedBills = localStorage.getItem('aurabank_bills');
        const savedBudgets = localStorage.getItem('aurabank_budgets');
        const savedNotifications = localStorage.getItem('aurabank_notifications');
        const savedRecurring = localStorage.getItem('aurabank_recurring');
        const savedSound = localStorage.getItem('aurabank_sound');
        const savedTheme = localStorage.getItem('aurabank_theme');

        if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
        if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
        if (savedCards) setCards(JSON.parse(savedCards));
        if (savedBills) setBills(JSON.parse(savedBills));
        if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
        if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
        if (savedRecurring) setRecurringTransactions(JSON.parse(savedRecurring));
        if (savedSound) setSoundEnabled(JSON.parse(savedSound));
        if (savedTheme) setTheme(JSON.parse(savedTheme));
      } catch {
        // Ignore transient failures and retry on next poll.
      }
    };

    void pullServerState();
    const intervalId = window.setInterval(() => {
      void pullServerState();
    }, 1800);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user, isReady, applyBankStateForUser]);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const isDemoUser = normalizedEmail === 'demo@aurafinance.com' && password === 'demo123';
    const registeredUser = isDemoUser ? {
      id: '1',
      name: 'Demo User',
      email: normalizedEmail,
    } : findBrowserRegisteredUserByEmail(normalizedEmail);

    if (!isDemoUser && (!registeredUser || registeredUser.password !== password)) {
      throw new Error('Invalid email or password');
    }

    const authenticatedUser = createBankUserProfile({
      id: String(registeredUser?.id || '1'),
      name: registeredUser?.name || 'Demo User',
      email: registeredUser?.email || normalizedEmail,
    });

    applyBankStateForUser(authenticatedUser);

    setUser(authenticatedUser);
    localStorage.setItem('aurabank_user', JSON.stringify(authenticatedUser));
    writeUnifiedAuthSession({
      userId: String(authenticatedUser.id),
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      sourceApp: 'AuraBank',
    });
  };

  const signup = async (email: string, password: string, name: string) => {
    // Mock signup
    const mockUser: User = createBankUserProfile({ id: '1', name, email });

    applyBankStateForUser(mockUser);
    setUser(mockUser);
    localStorage.setItem('aurabank_user', JSON.stringify(mockUser));
    writeUnifiedAuthSession({
      userId: String(mockUser.id),
      email: mockUser.email,
      name: mockUser.name,
      sourceApp: 'AuraBank',
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aurabank_user');
    clearUnifiedAuthSession();
  };

  const updateAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts);
    localStorage.setItem('aurabank_accounts', JSON.stringify(newAccounts));
  };

  const updateBills = (newBills: Bill[]) => {
    setBills(newBills);
    localStorage.setItem('aurabank_bills', JSON.stringify(newBills));
  };

  const addTransaction = (transaction: Transaction) => {
    const newTransactions = [...transactions, transaction];
    setTransactions(newTransactions);
    localStorage.setItem('aurabank_transactions', JSON.stringify(newTransactions));
  };

  const addRecurringTransaction = (transaction: RecurringTransaction) => {
    const newRecurring = [...recurringTransactions, transaction];
    setRecurringTransactions(newRecurring);
    localStorage.setItem('aurabank_recurring', JSON.stringify(newRecurring));
  };

  const processRecurringTransactions = () => {
    // Mock implementation - in real app, this would process recurring transactions
    console.log('Processing recurring transactions...');
  };

  const updateCards = (newCards: Card[]) => {
    setCards(newCards);
    localStorage.setItem('aurabank_cards', JSON.stringify(newCards));
  };

  const addNotification = (notification: Notification) => {
    const newNotifications = [...notifications, notification];
    setNotifications(newNotifications);
    localStorage.setItem('aurabank_notifications', JSON.stringify(newNotifications));
  };

  const addCard = (card: Card) => {
    const newCards = [...cards, card];
    setCards(newCards);
    localStorage.setItem('aurabank_cards', JSON.stringify(newCards));
  };

  const replaceCard = (oldCardId: string, newCard: Card) => {
    const newCards = cards.map(card => card.id === oldCardId ? newCard : card);
    setCards(newCards);
    localStorage.setItem('aurabank_cards', JSON.stringify(newCards));
  };

  const markNotificationRead = (id: string) => {
    const newNotifications = notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(newNotifications);
    localStorage.setItem('aurabank_notifications', JSON.stringify(newNotifications));
  };

  const deleteNotification = (id: string) => {
    const newNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(newNotifications);
    localStorage.setItem('aurabank_notifications', JSON.stringify(newNotifications));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('aurabank_notifications', JSON.stringify([]));
  };

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    localStorage.setItem('aurabank_sound', JSON.stringify(newSoundEnabled));
  };

  const setThemeValue = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('aurabank_theme', JSON.stringify(newTheme));
  };

  const value = {
    user,
    accounts,
    transactions,
    cards,
    bills,
    budgets,
    notifications,
    recurringTransactions,
    soundEnabled,
    theme,
    login,
    signup,
    logout,
    updateAccounts,
    updateBills,
    addTransaction,
    addRecurringTransaction,
    processRecurringTransactions,
    updateCards,
    addNotification,
    addCard,
    replaceCard,
    markNotificationRead,
    deleteNotification,
    clearAllNotifications,
    toggleSound,
    setTheme: setThemeValue,
  };

  if (!isReady) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
