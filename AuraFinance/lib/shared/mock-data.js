// Centralized mock user & financial data for Aura Finance ecosystem

export const users = [
  {
    id: 1,
    email: 'demo@aurafinance.com',
    password: 'demo123', // In real app, hash this
    name: 'Demo User',
    avatar: '/images/avatar.jpg'
  }
];

export const bankData = {
  accounts: [
    {
      id: 1,
      userId: 1,
      type: 'checking',
      balance: 12458.50,
      accountNumber: '****4521'
    },
    {
      id: 2,
      userId: 1,
      type: 'savings',
      balance: 72280.75,
      accountNumber: '****7832'
    },
    {
      id: 3,
      userId: 1,
      type: 'savings',
      balance: 3200.00,
      accountNumber: '****6410'
    },
    {
      id: 4,
      userId: 1,
      type: 'checking',
      balance: 50500.00,
      accountNumber: '****2391'
    }
  ],
  transactions: [
    { id: 1, accountId: 1, amount: -89.99, description: 'Nike Purchase', date: '2026-02-27' },
    { id: 2, accountId: 1, amount: 4500.00, description: 'Salary Deposit', date: '2026-02-26' },
    { id: 3, accountId: 4, amount: -320.00, description: 'Electricity Bill', date: '2026-02-24' },
    { id: 4, accountId: 4, amount: 2500.00, description: 'Freelance Payment', date: '2026-02-25' }
  ]
};

export const vestData = {
  portfolio: [
    { id: 1, userId: 1, symbol: 'BTC', shares: 1.0, price: 43250.50, value: 43250.50 },
    { id: 2, userId: 1, symbol: 'AAPL', shares: 292.68, price: 178.25, value: 52180.20 },
    { id: 3, userId: 1, symbol: 'GOLD', shares: 295.22, price: 62.45, value: 18436.62 },
    { id: 4, userId: 1, symbol: 'ETH', shares: 5.25, price: 2281.90, value: 11980.00 }
  ],
  investments: [
    { id: 1, userId: 1, type: 'stock', symbol: 'AAPL', amount: 12000.00, date: '2026-01-10' },
    { id: 2, userId: 1, type: 'crypto', symbol: 'BTC', amount: 8000.00, date: '2026-01-22' }
  ]
};

export const walletData = {
  balance: 500.00,
  transactions: [
    { id: 1, amount: -20.00, description: 'Coffee Shop', date: '2024-01-15' },
    { id: 2, amount: 100.00, description: 'Transfer from Bank', date: '2024-01-14' }
  ]
};

// Simulated transfer function
export function simulateTransfer(from, to, amount) {
  if (from === 'bank' && to === 'wallet') {
    if (bankData.accounts[0].balance >= amount) {
      bankData.accounts[0].balance -= amount;
      walletData.balance += amount;
      walletData.transactions.push({
        id: Date.now(),
        amount: amount,
        description: `Transfer from Bank`,
        date: new Date().toISOString().split('T')[0]
      });
      bankData.transactions.push({
        id: Date.now(),
        accountId: 1,
        amount: -amount,
        description: `Transfer to Wallet`,
        date: new Date().toISOString().split('T')[0]
      });
      return true;
    }
  }
  // Add more transfer types as needed
  return false;
}

export function getUser(userId) {
  const normalizedUserId = parseInt(userId);
  const user = users.find(u => u.id === normalizedUserId);
  if (!user) {
    return {
      id: normalizedUserId,
      name: 'New User',
      email: `user${normalizedUserId}@aurafinance.com`,
      bank: {
        accounts: [],
        transactions: []
      },
      vest: {
        portfolio: [],
        investments: []
      },
      wallet: {
        balance: 0,
        transactions: []
      }
    };
  }
  return {
    ...user,
    bank: {
      accounts: bankData.accounts.filter(a => a.userId === parseInt(userId)),
      transactions: bankData.transactions.filter(t => bankData.accounts.find(a => a.id === t.accountId)?.userId === parseInt(userId))
    },
    vest: {
      portfolio: vestData.portfolio.filter(p => p.userId === parseInt(userId)),
      investments: vestData.investments.filter(i => i.userId === parseInt(userId))
    },
    wallet: {
      balance: walletData.balance,
      transactions: walletData.transactions
    }
  };
}

export function transferFromBankToVest(userId, amount, accountId, symbol) {
  const account = bankData.accounts.find(a => a.id === accountId && a.userId === parseInt(userId));
  if (!account || account.balance < amount) return false;
  account.balance -= amount;
  vestData.investments.push({
    id: Date.now(),
    userId: parseInt(userId),
    type: 'crypto', // assuming for BTC
    symbol,
    amount,
    date: new Date().toISOString().split('T')[0]
  });
  return true;
}
