// lib/shared/mock-data.js
export const mockUsers = {
  user_123: {
    // ===== CORE USER PROFILE =====
    id: 'user_123',
    name: 'Prince',
    email: 'prince@test.com',
    phone: '+233 55 827 9979',
    address: 'Accra, Ghana',
    kycStatus: 'verified',
    createdAt: '2023-01-15T08:30:00Z',
    lastLogin: '2026-01-16T09:45:23Z',
    
    // ===== PAYNEBANK DATA =====
    bank: {
      accounts: [
        {
          id: 'acc-1',
          name: 'Primary Checking',
          type: 'checking',
          balance: 12458.50,
          accountNumber: '****4521',
          currency: 'USD',
          availableBalance: 12458.50,
          transactions: [
            {
              id: 'tx-1',
              type: 'debit',
              category: 'Shopping',
              description: 'Nike Purchase',
              amount: -89.99,
              date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
              status: 'completed',
              merchant: 'Nike',
              location: 'Online'
            },
            {
              id: 'tx-2',
              type: 'credit',
              category: 'Income',
              description: 'Salary Deposit',
              amount: 4500.00,
              date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
              status: 'completed',
              merchant: 'PayneTech'
            },
            {
              id: 'tx-6',
              type: 'debit',
              category: 'Transportation',
              description: 'Uber Ride',
              amount: -28.50,
              date: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
              status: 'completed',
              merchant: 'Uber',
              location: 'New York, NY'
            }
          ]
        },
        {
          id: 'acc-2',
          name: 'Savings Account',
          type: 'savings',
          balance: 72280.75,
          accountNumber: '****7832',
          currency: 'USD',
          availableBalance: 72280.75,
          transactions: []
        },
        {
          id: 'acc-3',
          name: 'Euro Account',
          type: 'savings',
          balance: 3200.00,
          accountNumber: '****6410',
          currency: 'EUR',
          availableBalance: 3200.00,
          transactions: [
            {
              id: 'tx-9',
              type: 'credit',
              category: 'Transfer',
              description: 'Fund Deposit',
              amount: 1500.00,
              date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
              status: 'completed'
            }
          ]
        },
        {
          id: 'acc-4',
          name: 'Cedi Account',
          type: 'checking',
          balance: 50500.00,
          accountNumber: '****2391',
          currency: 'GHS',
          availableBalance: 50500.00,
          transactions: [
            {
              id: 'tx-3',
              type: 'debit',
              category: 'Food & Dining',
              description: 'Chickenman Pizzaman',
              amount: -12.50,
              date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
              status: 'completed',
              merchant: 'Chickenman Pizzaman',
              location: 'Accra, Ghana'
            },
            {
              id: 'tx-5',
              type: 'debit',
              category: 'Bills & Utilities',
              description: 'Electricity Bill',
              amount: -320.00,
              date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
              status: 'completed',
              merchant: 'ECG Ghana',
              location: 'Accra, Ghana'
            },
            {
              id: 'tx-13',
              type: 'debit',
              category: 'Food & Dining',
              description: 'Local Restaurant',
              amount: -125.50,
              date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
              status: 'completed',
              merchant: "Mango's",
              location: 'Accra, Ghana'
            },
            {
              id: 'tx-17',
              type: 'credit',
              category: 'Income',
              description: 'Freelance Payment',
              amount: 2500.00,
              date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
              status: 'completed',
              merchant: 'Global Tech Solutions'
            }
          ]
        },
        {
          id: 'acc-5',
          name: 'Credit Card',
          type: 'credit',
          balance: -2340.20,
          accountNumber: '****9156',
          currency: 'USD',
          creditLimit: 10000,
          availableBalance: 7659.80,
          transactions: [
            {
              id: 'tx-4',
              type: 'debit',
              category: 'Shopping',
              description: 'Best Buy',
              amount: -1299.99,
              date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
              status: 'completed',
              merchant: 'Best Buy',
              location: 'Online'
            },
            {
              id: 'tx-7',
              type: 'debit',
              category: 'Entertainment',
              description: 'Spotify Premium',
              amount: -10.99,
              date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
              status: 'completed',
              merchant: 'Spotify'
            }
          ]
        }
      ],
      
      cards: [
        {
          id: 'card-1',
          accountId: 'acc-1',
          cardNumber: '4532123456784521',
          cardHolder: 'PRINCE',
          expiryDate: '12/26',
          cvv: '123',
          type: 'debit',
          status: 'active',
          brand: 'visa',
          pin: '1234',
          dailyLimit: 500,
          monthlyLimit: 5000,
          contactlessEnabled: true,
          digitalEnabled: true
        },
        {
          id: 'card-2',
          accountId: 'acc-5',
          cardNumber: '5412987654329156',
          cardHolder: 'PRINCE',
          expiryDate: '09/27',
          cvv: '456',
          type: 'credit',
          status: 'active',
          brand: 'mastercard',
          pin: '5678',
          dailyLimit: 1000,
          monthlyLimit: 10000,
          contactlessEnabled: true,
          digitalEnabled: false
        }
      ],
      
      bills: [
        {
          id: 'bill-1',
          name: 'Electricity',
          category: 'Utilities',
          amount: 125.00,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
          status: 'pending',
          recurring: true,
          currency: 'GHS'
        },
        {
          id: 'bill-2',
          name: 'Internet',
          category: 'Utilities',
          amount: 79.99,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
          status: 'pending',
          recurring: true,
          currency: 'USD'
        },
        {
          id: 'bill-3',
          name: 'Netflix',
          category: 'Entertainment',
          amount: 15.99,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18).toISOString(),
          status: 'pending',
          recurring: true,
          currency: 'USD'
        }
      ],
      
      budgets: [
        {
          id: 'budget-1',
          category: 'Food & Dining',
          limit: 500,
          spent: 342.50,
          period: 'monthly',
          currency: 'GHS'
        },
        {
          id: 'budget-2',
          category: 'Shopping',
          limit: 800,
          spent: 1389.98,
          period: 'monthly',
          currency: 'USD'
        }
      ],
      
      notifications: [
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
          message: 'Your checking account balance is below ₵500',
          type: 'warning',
          date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          read: false
        }
      ],
      
      recurringTransactions: [
        {
          id: 'recur-1',
          type: 'bill',
          fromAccountId: 'acc-4',
          amount: 320.00,
          description: 'ECG Electricity Bill',
          frequency: 'monthly',
          nextDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
          isActive: true,
          currency: 'GHS'
        },
        {
          id: 'recur-2',
          type: 'transfer',
          fromAccountId: 'acc-1',
          toAccountId: 'acc-2',
          amount: 500.00,
          description: 'Monthly Savings Transfer',
          frequency: 'monthly',
          nextDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
          isActive: true,
          currency: 'USD'
        }
      ]
    },
    
    // ===== AURAVEST DATA =====
    vest: {
      portfolio: {
        totalValue: 125847.32,
        change24h: 3.45,
        changeAmount: 4201.23,
        assets: [
          { 
            type: 'Crypto', 
            value: 45230.50, 
            allocation: 35.9,
            items: [
              {
                id: 'btc-1',
                name: 'Bitcoin',
                symbol: 'BTC',
                amount: 0.5,
                currentPrice: 43250.50,
                currentValue: 21625.25,
                change24h: 2.34,
                costBasis: 21000.00,
                unrealizedPnL: 625.25,
                unrealizedPnLPercent: 2.97
              },
              {
                id: 'eth-1',
                name: 'Ethereum',
                symbol: 'ETH',
                amount: 8.5,
                currentPrice: 2280.75,
                currentValue: 19386.37,
                change24h: -1.23,
                costBasis: 20000.00,
                unrealizedPnL: -613.63,
                unrealizedPnLPercent: -3.07
              }
            ]
          },
          { 
            type: 'Stocks', 
            value: 52180.20, 
            allocation: 41.4,
            items: [
              {
                id: 'aapl-1',
                name: 'Apple Inc.',
                symbol: 'AAPL',
                amount: 150,
                currentPrice: 178.25,
                currentValue: 26737.50,
                change24h: 1.45,
                costBasis: 26000.00,
                unrealizedPnL: 737.50,
                unrealizedPnLPercent: 2.84
              },
              {
                id: 'msft-1',
                name: 'Microsoft',
                symbol: 'MSFT',
                amount: 50,
                currentPrice: 374.80,
                currentValue: 18740.00,
                change24h: -0.82,
                costBasis: 18500.00,
                unrealizedPnL: 240.00,
                unrealizedPnLPercent: 1.30
              }
            ]
          },
          { 
            type: 'Gold', 
            value: 18436.62, 
            allocation: 14.6,
            items: [
              {
                id: 'gold-1',
                name: 'Gold',
                symbol: 'GOLD',
                amount: 295,
                currentPrice: 62.45,
                currentValue: 18423.75,
                change24h: 0.45,
                costBasis: 18000.00,
                unrealizedPnL: 423.75,
                unrealizedPnLPercent: 2.35
              }
            ]
          },
          { 
            type: 'NFTs', 
            value: 10000.00, 
            allocation: 7.9,
            items: [
              {
                id: 'bayc-1',
                name: 'Bored Ape #3421',
                symbol: 'BAYC',
                amount: 1,
                currentPrice: 10000.00,
                currentValue: 10000.00,
                change24h: -2.3,
                costBasis: 8500.00,
                unrealizedPnL: 1500.00,
                unrealizedPnLPercent: 17.65
              }
            ]
          }
        ]
      },
      
      holdings: [
        {
          id: 'btc-1',
          name: 'Bitcoin',
          symbol: 'BTC',
          amount: 0.5,
          currentPrice: 43250.50,
          currentValue: 21625.25,
          change24h: 2.34,
          type: 'Crypto',
          costBasis: 21000.00,
          unrealizedPnL: 625.25,
          unrealizedPnLPercent: 2.97
        },
        {
          id: 'aapl-1',
          name: 'Apple Inc.',
          symbol: 'AAPL',
          amount: 150,
          currentPrice: 178.25,
          currentValue: 26737.50,
          change24h: 1.45,
          type: 'Stocks',
          costBasis: 26000.00,
          unrealizedPnL: 737.50,
          unrealizedPnLPercent: 2.84
        },
        {
          id: 'eth-1',
          name: 'Ethereum',
          symbol: 'ETH',
          amount: 8.5,
          currentPrice: 2280.75,
          currentValue: 19386.37,
          change24h: -1.23,
          type: 'Crypto',
          costBasis: 20000.00,
          unrealizedPnL: -613.63,
          unrealizedPnLPercent: -3.07
        },
        {
          id: 'msft-1',
          name: 'Microsoft',
          symbol: 'MSFT',
          amount: 50,
          currentPrice: 374.80,
          currentValue: 18740.00,
          change24h: -0.82,
          type: 'Stocks',
          costBasis: 18500.00,
          unrealizedPnL: 240.00,
          unrealizedPnLPercent: 1.30
        },
        {
          id: 'gold-1',
          name: 'Gold',
          symbol: 'GOLD',
          amount: 295,
          currentPrice: 62.45,
          currentValue: 18423.75,
          change24h: 0.45,
          type: 'Gold',
          costBasis: 18000.00,
          unrealizedPnL: 423.75,
          unrealizedPnLPercent: 2.35
        },
        {
          id: 'bayc-1',
          name: 'Bored Ape #3421',
          symbol: 'BAYC',
          amount: 1,
          currentPrice: 10000.00,
          currentValue: 10000.00,
          change24h: -2.3,
          type: 'NFTs',
          costBasis: 8500.00,
          unrealizedPnL: 1500.00,
          unrealizedPnLPercent: 17.65
        }
      ],
      
      watchlist: [
        {
          id: 'DOT',
          name: 'Polkadot',
          symbol: 'DOT',
          price: 7.85,
          change24h: -0.95,
          type: 'Crypto'
        },
        {
          id: 'NFLX',
          name: 'Netflix Inc.',
          symbol: 'NFLX',
          price: 485.20,
          change24h: -0.34,
          type: 'Stocks'
        },
        {
          id: 'MANA',
          name: 'Decentraland',
          symbol: 'MANA',
          price: 0.42,
          change24h: -0.89,
          type: 'Crypto'
        }
      ],
      
      recentTransactions: [
        {
          id: '1',
          type: 'buy',
          asset: 'BTC',
          assetName: 'Bitcoin',
          amount: 0.5,
          price: 43250.50,
          total: 21625.25,
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          id: '2',
          type: 'sell',
          asset: 'AAPL',
          assetName: 'Apple Inc.',
          amount: 25,
          price: 178.25,
          total: 4456.25,
          date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          id: '3',
          type: 'buy',
          asset: 'GOLD',
          assetName: 'Gold',
          amount: 50,
          price: 62.45,
          total: 3122.50,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        }
      ],
      
      chartData: [
        { date: 'Jan', value: 98000 },
        { date: 'Feb', value: 102000 },
        { date: 'Mar', value: 97500 },
        { date: 'Apr', value: 105000 },
        { date: 'May', value: 110000 },
        { date: 'Jun', value: 108500 },
        { date: 'Jul', value: 115000 },
        { date: 'Aug', value: 112000 },
        { date: 'Sep', value: 118000 },
        { date: 'Oct', value: 121000 },
        { date: 'Nov', value: 125847 },
      ],
      
      marketData: {
        crypto: [
          {
            id: 'BTC',
            name: 'Bitcoin',
            symbol: 'BTC',
            price: 43250.50,
            change24h: 2.34,
            marketCap: 845000000000,
            volume24h: 28000000000
          },
          {
            id: 'ETH',
            name: 'Ethereum',
            symbol: 'ETH',
            price: 2280.75,
            change24h: -1.23,
            marketCap: 274000000000,
            volume24h: 15000000000
          }
        ],
        stocks: [
          {
            id: 'AAPL',
            name: 'Apple Inc.',
            symbol: 'AAPL',
            price: 178.25,
            change24h: 1.45,
            marketCap: 2800000000000,
            pe: 28.5,
            dividend: 0.57
          },
          {
            id: 'MSFT',
            name: 'Microsoft Corporation',
            symbol: 'MSFT',
            price: 374.80,
            change24h: -0.82,
            marketCap: 2780000000000,
            pe: 35.2,
            dividend: 0.68
          }
        ],
        gold: {
          pricePerGram: 62.45,
          change24h: 0.45,
          pricePerOunce: 1943.20,
          purity: '24K',
          minimumPurchase: 0.01
        },
        nfts: [
          {
            id: 'bayc',
            name: 'Bored Ape Yacht Club',
            floorPrice: 32.5,
            volume24h: 1250.8,
            change24h: -2.3,
            items: 10000,
            owners: 6432
          },
          {
            id: 'cryptopunks',
            name: 'CryptoPunks',
            floorPrice: 48.2,
            volume24h: 890.5,
            change24h: 1.8,
            items: 10000,
            owners: 3544
          }
        ]
      },
      
      riskMetrics: {
        score: 68,
        level: 'Moderate',
        diversification: 72,
        volatilityExposure: 'Medium',
        recommendations: [
          'Reduce crypto allocation by 5%',
          'Add defensive stocks (utilities, consumer staples)',
          'Consider gold as hedge'
        ]
      }
    },
    
    // ===== PAYNEWALLET DATA =====
    wallet: {
      balance: 420.50,
      currency: 'USD',
      recentTransactions: [
        {
          id: 'wtx-1',
          type: 'send',
          amount: 20.00,
          to: 'Kwame',
          description: 'Lunch payment',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          status: 'completed'
        },
        {
          id: 'wtx-2',
          type: 'receive',
          amount: 150.00,
          from: 'Ama',
          description: 'Reimbursement',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          status: 'completed'
        }
      ],
      contacts: [
        { id: 'contact-1', name: 'Kwame', phone: '+233 55 123 4567', email: 'kwame@example.com' },
        { id: 'contact-2', name: 'Ama', phone: '+233 55 765 4321', email: 'ama@example.com' }
      ],
      savedPayments: [
        { id: 'saved-1', name: 'ECG Utilities', amount: 320.00, frequency: 'monthly' },
        { id: 'saved-2', name: 'Netflix Subscription', amount: 15.99, frequency: 'monthly' }
      ]
    },
    
    // ===== AURAAI PROFILE DATA =====
    aiProfile: {
      spendingHabits: {
        level: 'moderate',
        categories: {
          'Food & Dining': 142.00,
          'Shopping': 1389.98,
          'Transportation': 73.50,
          'Entertainment': 90.98,
          'Bills & Utilities': 320.00
        },
        trend: 'increasing',
        lastAnalyzed: new Date().toISOString()
      },
      investmentBehavior: {
        riskTolerance: 'moderate',
        investmentStyle: 'growth',
        diversificationScore: 72,
        lastAnalysis: new Date().toISOString()
      },
      financialGoals: [
        {
          id: 'goal-1',
          name: 'Emergency Fund',
          targetAmount: 15000.00,
          currentAmount: 12458.50,
          currency: 'USD',
          deadline: '2026-06-30'
        },
        {
          id: 'goal-2',
          name: 'Investment Growth',
          targetAmount: 150000.00,
          currentAmount: 125847.32,
          currency: 'USD',
          deadline: '2027-12-31'
        }
      ],
      notifications: [
        { id: 'ai-notif-1', message: 'Your spending on Shopping is 74% above budget', read: false, date: new Date().toISOString() },
        { id: 'ai-notif-2', message: 'Crypto allocation is 5% higher than recommended', read: false, date: new Date().toISOString() }
      ]
    }
  }
};

// ===== HELPER FUNCTIONS =====
export const getUser = (userId) => mockUsers[userId] || mockUsers.user_123;

export const updateUser = (userId, updates) => {
  const user = getUser(userId);
  if (user) {
    // Deep merge updates
    Object.assign(user, updates);
    return user;
  }
  return null;
};

// ===== CROSS-PRODUCT TRANSFER FUNCTIONS =====
export const transferFromWalletToBank = (userId, amount, fromWallet = 'default', toAccount = 'acc-1') => {
  const user = getUser(userId);
  if (!user) return false;
  
  if (user.wallet.balance >= amount) {
    // Update wallet balance
    user.wallet.balance -= amount;
    
    // Update bank account balance
    const account = user.bank.accounts.find(acc => acc.id === toAccount);
    if (account) {
      account.balance += amount;
      account.availableBalance += amount;
      
      // Add transaction to bank account
      account.transactions.push({
        id: `tx-w2b-${Date.now()}`,
        type: 'credit',
        category: 'Transfer',
        description: 'Transfer from Wallet',
        amount: amount,
        date: new Date().toISOString(),
        status: 'completed',
        merchant: 'PayneWallet'
      });
      
      // Add transaction to wallet
      user.wallet.recentTransactions.push({
        id: `wtx-out-${Date.now()}`,
        type: 'send',
        amount: amount,
        to: 'PayneBank',
        description: 'Transfer to Bank Account',
        date: new Date().toISOString(),
        status: 'completed'
      });
      
      return true;
    }
  }
  return false;
};

export const transferFromBankToVest = (userId, amount, fromAccount = 'acc-1', asset = 'BTC') => {
  const user = getUser(userId);
  if (!user) return false;
  
  const account = user.bank.accounts.find(acc => acc.id === fromAccount);
  if (account && account.balance >= amount) {
    // Deduct from bank account
    account.balance -= amount;
    account.availableBalance -= amount;
    
    // Add transaction to bank account
    account.transactions.push({
      id: `tx-b2v-${Date.now()}`,
      type: 'debit',
      category: 'Investment',
      description: `Invest in ${asset}`,
      amount: -amount,
      date: new Date().toISOString(),
      status: 'completed',
      merchant: 'AuraVest'
    });
    
    // Add to vest portfolio (simplified)
    const assetData = user.vest.marketData.crypto.find(a => a.symbol === asset) || 
                     user.vest.marketData.stocks.find(a => a.symbol === asset);
    
    if (assetData) {
      const existingHolding = user.vest.holdings.find(h => h.symbol === asset);
      if (existingHolding) {
        const newAmount = amount / assetData.price;
        existingHolding.amount += newAmount;
        existingHolding.currentValue = existingHolding.amount * assetData.price;
      } else {
        // Add new holding
        user.vest.holdings.push({
          id: `new-${asset.toLowerCase()}`,
          name: assetData.name,
          symbol: asset,
          amount: amount / assetData.price,
          currentPrice: assetData.price,
          currentValue: amount,
          change24h: assetData.change24h,
          type: assetData.marketCap ? 'Crypto' : 'Stocks',
          costBasis: amount,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0
        });
      }
      
      // Update portfolio total
      user.vest.portfolio.totalValue += amount;
      
      // Add transaction record
      user.vest.recentTransactions.push({
        id: `rt-${Date.now()}`,
        type: 'buy',
        asset: asset,
        assetName: assetData.name,
        amount: amount / assetData.price,
        price: assetData.price,
        total: amount,
        date: new Date().toISOString(),
        status: 'completed'
      });
      
      return true;
    }
  }
  return false;
};

// ===== AI INSIGHT GENERATORS =====
export const generateSpendingInsights = (userId) => {
  const user = getUser(userId);
  if (!user) return [];
  
  const insights = [];
  const spending = user.aiProfile.spendingHabits;
  
  // Check budget overruns
  if (spending.categories['Shopping'] > 800) {
    insights.push({
      id: 'spend-1',
      title: 'Budget Alert',
      message: 'Your shopping spending is 74% above your $800 monthly budget',
      severity: 'warning',
      action: 'Review recent purchases'
    });
  }
  
  // Check positive trends
  if (spending.trend === 'increasing' && spending.level === 'moderate') {
    insights.push({
      id: 'spend-2',
      title: 'Spending Trend',
      message: 'Your discretionary spending has increased 15% this month',
      severity: 'info',
      action: 'Set a spending limit'
    });
  }
  
  return insights;
};

export const generateInvestmentInsights = (userId) => {
  const user = getUser(userId);
  if (!user) return [];
  
  const insights = [];
  const risk = user.vest.riskMetrics;
  
  // Risk assessment
  if (risk.score > 65) {
    insights.push({
      id: 'inv-1',
      title: 'Portfolio Risk',
      message: 'Your portfolio risk score is 68 (Moderate). Consider diversifying further.',
      severity: 'info',
      action: 'Review asset allocation'
    });
  }
  
  // Crypto allocation
  const cryptoAllocation = user.vest.portfolio.assets.find(a => a.type === 'Crypto')?.allocation || 0;
  if (cryptoAllocation > 30) {
    insights.push({
      id: 'inv-2',
      title: 'Crypto Exposure',
      message: `Your crypto allocation is ${cryptoAllocation}%, which is 5% higher than recommended`,
      severity: 'warning',
      action: 'Rebalance portfolio'
    });
  }
  
  return insights;
};