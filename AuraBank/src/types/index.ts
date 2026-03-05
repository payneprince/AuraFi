export type AccountType = 'checking' | 'savings' | 'credit';
export type Currency = 'USD' | 'EUR' | 'GHS';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  accountNumber: string;
  currency: Currency;
  availableBalance?: number;
  creditLimit?: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'debit' | 'credit';
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  merchant?: string;
  location?: string;
}

export interface Card {
  id: string;
  accountId: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  type: 'debit' | 'credit';
  status: 'active' | 'blocked' | 'expired';
  brand: 'visa' | 'mastercard' | 'amex';
  pin?: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  contactlessEnabled?: boolean;
  digitalEnabled?: boolean;
  isVirtual?: boolean;
  singleUse?: boolean;
  merchantLock?: string;
  mobileWallet?: 'apple' | 'google' | 'samsung';
  enhancedSecurity?: boolean;
  name?: string;
  createdAt?: string;
  expiresAt?: string;
}

export interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  recurring: boolean;
  accountId?: string;
  currency?: Currency;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  currency?: Currency;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: string;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  phone?: string;
  address?: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId?: string;
  recipientName?: string;
  recipientAccount?: string;
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

// ✅ NEW: Recurring Transaction
export interface RecurringTransaction {
  id: string;
  type: 'transfer' | 'bill';
  fromAccountId: string;
  toAccountId?: string;
  recipientName?: string;
  amount: number;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextDate: string;
  isActive: boolean;
  currency: Currency;
}