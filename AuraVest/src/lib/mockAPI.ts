import { dcaPlans } from './mockData';

// Simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const syncPortfolioSnapshotCookie = (portfolio: any) => {
  if (typeof document === 'undefined' || !portfolio) return;
  const snapshot = {
    totalValue: Number(portfolio.totalValue || 0),
    change24h: Number(portfolio.change24h || 0),
    changeAmount: Number(portfolio.changeAmount || 0),
    updatedAt: new Date().toISOString(),
  };
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `auravest_portfolio_snapshot=${encodeURIComponent(JSON.stringify(snapshot))}; expires=${expires}; path=/; SameSite=Lax`;
};

// Get user data
export const getUser = async () => {
  await delay(300);
  return JSON.parse(localStorage.getItem('auravest_user') || 'null');
};

// Get portfolio
export const getPortfolio = async () => {
  await delay(300);
  const data = JSON.parse(localStorage.getItem('auravest_portfolio') || '{}');

  // If no portfolio data exists, return default
  if (!data || Object.keys(data).length === 0) {
    const defaultPortfolio = {
      totalValue: 125847.32,
      change24h: 3.45,
      changeAmount: 4201.23,
      assets: [
        { type: 'Crypto', value: 45230.50, allocation: 35.9 },
        { type: 'Stocks', value: 52180.20, allocation: 41.4 },
        { type: 'Gold', value: 18436.62, allocation: 14.6 },
        { type: 'NFTs', value: 10000.00, allocation: 7.9 },
      ]
    };
    syncPortfolioSnapshotCookie(defaultPortfolio);
    return defaultPortfolio;
  }

  // Simulate 24h change
  const change = (Math.random() - 0.4) * 3; // -1.2% to +1.8%
  data.change24h = parseFloat((data.change24h + change).toFixed(2));
  data.changeAmount = parseFloat((data.totalValue * change / 100).toFixed(2));
  syncPortfolioSnapshotCookie(data);
  return data;
};

// Execute trade
export const executeTrade = async (trade: any) => {
  await delay(500);

  // Add to transaction history
  const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
  const newTx = {
    id: `tx-${Date.now()}`,
    ...trade,
    timestamp: new Date().toISOString(),
    status: 'completed'
  };
  transactions.unshift(newTx);
  localStorage.setItem('auravest_transactions', JSON.stringify(transactions));

  // Update portfolio (simplified)
  const portfolio = JSON.parse(localStorage.getItem('auravest_portfolio') || '{}');

  // Initialize portfolio if it doesn't exist
  if (!portfolio.totalValue) {
    portfolio.totalValue = 125847.32;
    portfolio.change24h = 3.45;
    portfolio.changeAmount = 4201.23;
    portfolio.assets = [
      { type: 'Crypto', value: 45230.50, allocation: 35.9 },
      { type: 'Stocks', value: 52180.20, allocation: 41.4 },
      { type: 'Gold', value: 18436.62, allocation: 14.6 },
      { type: 'NFTs', value: 10000.00, allocation: 7.9 },
    ];
  }

  portfolio.totalValue += trade.type === 'buy' ? -trade.total : trade.total;
  localStorage.setItem('auravest_portfolio', JSON.stringify(portfolio));
  syncPortfolioSnapshotCookie(portfolio);

  return newTx;
};

// Get watchlist
export const getWatchlist = () => {
  return JSON.parse(localStorage.getItem('auravest_watchlist') || '[]');
};

// Add to watchlist
export const addToWatchlist = (item: { id: string; type: string }) => {
  const list = getWatchlist();
  if (!list.find((i: any) => i.id === item.id && i.type === item.type)) {
    list.push(item);
    localStorage.setItem('auravest_watchlist', JSON.stringify(list));
  }
};

// Remove from watchlist
export const removeFromWatchlist = (id: string) => {
  const list = getWatchlist().filter((i: any) => i.id !== id);
  localStorage.setItem('auravest_watchlist', JSON.stringify(list));
};

// Get DCA plans
export const getDCAPlans = () => {
  return JSON.parse(localStorage.getItem('auravest_dca') || JSON.stringify(dcaPlans));
};

// Create DCA plan
export const createDCAPlan = (plan: any) => {
  const plans = getDCAPlans();
  plans.push({ ...plan, id: `dca-${Date.now()}` });
  localStorage.setItem('auravest_dca', JSON.stringify(plans));
};

// Export transactions (CSV)
export const exportTransactionsCSV = () => {
  const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
  if (transactions.length === 0) return '';

  const headers = ['Date', 'Type', 'Asset', 'Amount', 'Price', 'Total', 'Status'];
  const rows = transactions.map((tx: any) => [
    new Date(tx.timestamp).toLocaleString(),
    tx.type,
    tx.asset,
    tx.amount,
    tx.price,
    tx.total,
    tx.status
  ]);

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += headers.join(',') + '\n';
  csvContent += rows.map((row: any) => row.map((field: any) => `"${field}"`).join(',')).join('\n');

  return encodeURI(csvContent);
};

// Get trade analytics
export const getTradeAnalytics = () => {
  const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
  if (transactions.length === 0) {
    return {
      totalTrades: 0,
      winLossRatio: 0,
      averageReturn: 0,
      totalPnL: 0,
      winningTrades: 0,
      losingTrades: 0,
    };
  }

  let totalPnL = 0;
  let winningTrades = 0;
  let losingTrades = 0;

  // Simple P&L calculation (assuming current price for unrealized, but for demo we'll use historical)
  transactions.forEach((tx: any) => {
    // For simplicity, assume buy trades have potential profit/loss based on current market
    // In real app, this would track entry/exit prices
    if (tx.type === 'buy') {
      totalPnL += (Math.random() - 0.5) * tx.total * 0.1; // Simulate +/- 10% return
    } else {
      totalPnL -= tx.total;
    }
  });

  winningTrades = Math.floor(transactions.length * 0.6); // Simulate 60% win rate
  losingTrades = transactions.length - winningTrades;

  return {
    totalTrades: transactions.length,
    winLossRatio: winningTrades / Math.max(losingTrades, 1),
    averageReturn: totalPnL / transactions.length,
    totalPnL,
    winningTrades,
    losingTrades,
  };
};

// Execute basket trade
export const executeBasketTrade = async (basket: { assets: any[], totalAmount: number }) => {
  await delay(1000);

  const results = [];
  for (const item of basket.assets) {
    const tradeData = {
      type: 'buy', // Assume basket is for buying
      asset: item.asset.symbol,
      assetName: item.asset.name,
      amount: item.amount,
      price: item.asset.price,
      total: item.amount * item.asset.price,
    };

    const newTx = {
      id: `tx-${Date.now()}-${Math.random()}`,
      ...tradeData,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    results.push(newTx);

    // Update transactions
    const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
    transactions.unshift(newTx);
    localStorage.setItem('auravest_transactions', JSON.stringify(transactions));

    // Update portfolio for basket trades
    const portfolio = JSON.parse(localStorage.getItem('auravest_portfolio') || '{}');

    // Initialize portfolio if it doesn't exist
    if (!portfolio.totalValue) {
      portfolio.totalValue = 125847.32;
      portfolio.change24h = 3.45;
      portfolio.changeAmount = 4201.23;
      portfolio.assets = [
        { type: 'Crypto', value: 45230.50, allocation: 35.9 },
        { type: 'Stocks', value: 52180.20, allocation: 41.4 },
        { type: 'Gold', value: 18436.62, allocation: 14.6 },
        { type: 'NFTs', value: 10000.00, allocation: 7.9 },
      ];
    }

    // For basket trades, assume all are buys and subtract total
    const totalBasketValue = results.reduce((sum, tx) => sum + tx.total, 0);
    portfolio.totalValue -= totalBasketValue;
    localStorage.setItem('auravest_portfolio', JSON.stringify(portfolio));
    syncPortfolioSnapshotCookie(portfolio);
  }

  return results;
};

// Notification management
export const getNotifications = () => {
  return JSON.parse(localStorage.getItem('auravest_notifications') || '[]');
};

export const addNotification = (notification: { id: string, type: string, message: string, timestamp: string }) => {
  const notifications = getNotifications();
  notifications.unshift(notification);
  localStorage.setItem('auravest_notifications', JSON.stringify(notifications));
};

export const clearNotification = (id: string) => {
  const notifications = getNotifications().filter((n: any) => n.id !== id);
  localStorage.setItem('auravest_notifications', JSON.stringify(notifications));
};
