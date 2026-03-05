import type { User, Account, Transaction, Card, Bill, Budget, Notification } from '@/types';

export const demoUsers: User[] = [
  {
    id: '1',
    name: 'Prince',
    email: 'prince@test.com',
    password: 'secure123',
    phone: '+233 24 123 4567',
    address: 'Accra, Ghana'
  }
];

export const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Primary Checking',
    type: 'checking',
    balance: 12458.5,
    accountNumber: '****4521',
    currency: 'USD',
    availableBalance: 12458.5
  },
  {
    id: 'acc-2',
    name: 'Savings Account',
    type: 'savings',
    balance: 45280.75,
    accountNumber: '****7832',
    currency: 'USD',
    availableBalance: 45280.75
  },
  {
    id: 'acc-3',
    name: 'Credit Card',
    type: 'credit',
    balance: -2340.2,
    accountNumber: '****9156',
    currency: 'USD',
    creditLimit: 10000,
    availableBalance: 7659.8
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    accountId: 'acc-1',
    type: 'debit',
    category: 'Shopping',
    description: 'Amazon Purchase',
    amount: -89.99,
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'completed',
    merchant: 'Amazon',
    location: 'Online'
  },
  {
    id: 'tx-2',
    accountId: 'acc-1',
    type: 'credit',
    category: 'Income',
    description: 'Salary Deposit',
    amount: 4500.0,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'completed',
    merchant: 'Tech Innovations Ltd'
  },
  {
    id: 'tx-3',
    accountId: 'acc-1',
    type: 'debit',
    category: 'Food & Dining',
    description: 'Starbucks',
    amount: -12.5,
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'completed',
    merchant: 'Starbucks',
    location: 'Accra, Ghana'
  },
  {
    id: 'tx-4',
    accountId: 'acc-2',
    type: 'credit',
    category: 'Transfer',
    description: 'Transfer from Checking',
    amount: 500.0,
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    status: 'completed'
  },
  {
    id: 'tx-5',
    accountId: 'acc-3',
    type: 'debit',
    category: 'Shopping',
    description: 'Best Buy',
    amount: -1299.99,
    date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    status: 'completed',
    merchant: 'Best Buy',
    location: 'Online'
  }
];

export const mockCards: Card[] = [
  {
    id: 'card-1',
    accountId: 'acc-1',
    cardNumber: '4532 **** **** 4521',
    cardHolder: 'PRINCE',
    expiryDate: '12/26',
    cvv: '***',
    type: 'debit',
    status: 'active',
    brand: 'visa'
  },
  {
    id: 'card-2',
    accountId: 'acc-3',
    cardNumber: '5412 **** **** 9156',
    cardHolder: 'PRINCE',
    expiryDate: '09/27',
    cvv: '***',
    type: 'credit',
    status: 'active',
    brand: 'mastercard'
  }
];

export const mockBills: Bill[] = [
  {
    id: 'bill-1',
    name: 'Electricity',
    category: 'Utilities',
    amount: 125.0,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: 'pending',
    recurring: true
  },
  {
    id: 'bill-2',
    name: 'Internet',
    category: 'Utilities',
    amount: 79.99,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    status: 'pending',
    recurring: true
  },
  {
    id: 'bill-3',
    name: 'Netflix',
    category: 'Entertainment',
    amount: 15.99,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18).toISOString(),
    status: 'pending',
    recurring: true
  }
];

export const mockBudgets: Budget[] = [
  {
    id: 'budget-1',
    category: 'Food & Dining',
    limit: 500,
    spent: 342.5,
    period: 'monthly'
  },
  {
    id: 'budget-2',
    category: 'Shopping',
    limit: 800,
    spent: 1389.98,
    period: 'monthly'
  },
  {
    id: 'budget-3',
    category: 'Transportation',
    limit: 200,
    spent: 128.5,
    period: 'monthly'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Payment Received',
    message: 'Your salary of $4,500.00 has been deposited',
    type: 'success',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: false
  },
  {
    id: 'notif-2',
    title: 'Low Balance Alert',
    message: 'Your checking account balance is below $500',
    type: 'warning',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: false
  },
  {
    id: 'notif-3',
    title: 'Bill Due Soon',
    message: 'Electricity bill of $125.00 due in 5 days',
    type: 'info',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    read: true
  }
];