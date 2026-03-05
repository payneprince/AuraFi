'use client';

const STORAGE_KEYS = {
  USER: 'banking_user',
  ACCOUNTS: 'banking_accounts',
  TRANSACTIONS: 'banking_transactions',
  CARDS: 'banking_cards',
  BILLS: 'banking_bills',
  BUDGETS: 'banking_budgets',
  NOTIFICATIONS: 'banking_notifications',
  RECURRING: 'banking_recurring', // ✅ NEW
  SOUND_ENABLED: 'banking_sound_enabled', // ✅ NEW
  THEME: 'banking_theme',
};

export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

export { STORAGE_KEYS };