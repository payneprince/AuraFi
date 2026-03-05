'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Account, Transaction, Card, Bill, Budget, Notification, RecurringTransaction } from '@/types';
import { getUser } from '@/lib/shared/mock-data';

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

  useEffect(() => {
    // Load data from localStorage on mount, or initialize with mock data
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
    
    // Load from localStorage or initialize with mock data
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
    
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    
    if (savedCards) {
      const parsedCards = JSON.parse(savedCards);
      // Update old cardholders from PRINCE to DEMO USER
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
    
    // If no data in localStorage, load from mock data
    if (!savedUser || (!savedAccounts && !savedTransactions && (!savedCards || JSON.parse(savedCards).length === 0) && !savedBills && !savedBudgets)) {
      const mockUser = getUser('user_123');
      if (mockUser) {
        // Set default user if not in localStorage
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
          
          // Flatten all transactions from accounts
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
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in real app, this would call an API
    const mockUser: User = {
      id: '1',
      name: 'Prince Payne',
      email: email,
      avatar: '/profile.jpg',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, City, State 12345',
    };

    setUser(mockUser);
    localStorage.setItem('aurabank_user', JSON.stringify(mockUser));
  };

  const signup = async (email: string, password: string, name: string) => {
    // Mock signup
    const mockUser: User = {
      id: '1',
      name: name,
      email: email,
      avatar: '/profile.jpg',
    };

    setUser(mockUser);
    localStorage.setItem('aurabank_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aurabank_user');
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
