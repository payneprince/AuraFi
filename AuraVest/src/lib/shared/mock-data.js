// Centralized mock user & financial data for PayneSuite ecosystem

export const users = [
  {
    id: 1,
    email: 'demo@paynesuite.com',
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
      balance: 2500.00,
      accountNumber: '****1234'
    },
    {
      id: 2,
      userId: 1,
      type: 'savings',
      balance: 15000.00,
      accountNumber: '****5678'
    }
  ],
  transactions: [
    { id: 1, accountId: 1, amount: -50.00, description: 'Grocery Store', date: '2024-01-15' },
    { id: 2, accountId: 1, amount: 2000.00, description: 'Salary Deposit', date: '2024-01-14' }
  ]
};

export const vestData = {
  portfolio: [
    { id: 1, userId: 1, symbol: 'AAPL', shares: 10, price: 150.00, value: 1500.00 },
    { id: 2, userId: 1, symbol: 'BTC', shares: 0.5, price: 30000.00, value: 15000.00 }
  ],
  investments: [
    { id: 1, userId: 1, type: 'stock', symbol: 'AAPL', amount: 1500.00, date: '2024-01-10' }
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
