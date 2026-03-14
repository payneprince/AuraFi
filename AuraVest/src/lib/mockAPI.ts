import { dcaPlans } from './mockData';
import { appendUnifiedLedgerEvent, getUnifiedLedgerEvents } from '../../../shared/unified-ledger';

// Simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const CASH_BALANCE_KEY = 'auravest_cash_balance';
const CASH_STARTING_BALANCE_KEY = 'auravest_cash_starting_balance';
const DEFAULT_STARTING_CASH = 0;
const DEFAULT_DEMO_PORTFOLIO = {
  totalValue: 125847.32,
  change24h: 3.45,
  changeAmount: 4201.23,
  assets: [
    { type: 'Crypto', value: 45230.5, allocation: 35.9 },
    { type: 'Stocks', value: 52180.2, allocation: 41.4 },
    { type: 'Gold', value: 18436.62, allocation: 14.6 },
    { type: 'NFTs', value: 10000, allocation: 7.9 },
  ],
};

const parseStoredJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const getDefaultPortfolioForActiveUser = () => (
  getActiveVestUserId() === '1'
    ? { ...DEFAULT_DEMO_PORTFOLIO, assets: DEFAULT_DEMO_PORTFOLIO.assets.map((asset) => ({ ...asset })) }
    : { totalValue: 0, change24h: 0, changeAmount: 0, assets: [] as Array<{ type: string; value: number; allocation: number }> }
);

const getStoredNonCashAssets = () => {
  const storedPortfolio = parseStoredJson<{ assets?: Array<{ type?: string; value?: number; allocation?: number }> }>('auravest_portfolio', {});
  const existingAssets = Array.isArray(storedPortfolio.assets) ? storedPortfolio.assets : [];
  const nonCashAssets = existingAssets
    .filter((asset) => String(asset?.type || '').toLowerCase() !== 'cash' && Number(asset?.value || 0) > 0)
    .map((asset) => ({
      type: String(asset?.type || 'Asset'),
      value: Number(asset?.value || 0),
      allocation: Number(asset?.allocation || 0),
    }));

  if (nonCashAssets.length > 0) return nonCashAssets;

  const defaultPortfolio = getDefaultPortfolioForActiveUser();
  return defaultPortfolio.assets.map((asset) => ({ ...asset }));
};
const getActiveVestUserId = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('auravest_user') || 'null');
    return String(storedUser?.id || '1');
  } catch {
    return '1';
  }
};
const syncAuraVestTransactionsToUnifiedLedger = async (transactions: any[]) => {
  const activeUserId = getActiveVestUserId();
  const ledgerEvents = await getUnifiedLedgerEvents(activeUserId);
  const mappedSourceIds = new Set(
    ledgerEvents
      .map((event) => String(event?.metadata?.sourceTxId || ''))
      .filter(Boolean),
  );

  for (const tx of transactions || []) {
    const txId = String(tx?.id || '');
    if (!txId || mappedSourceIds.has(txId)) continue;

    const normalizedType = String(tx?.type || '').toLowerCase();
    let eventType: 'trade.buy' | 'trade.sell' | 'funding.deposit' | 'funding.withdrawal' | null = null;
    if (normalizedType === 'buy') eventType = 'trade.buy';
    if (normalizedType === 'sell') eventType = 'trade.sell';
    if (normalizedType === 'deposit') eventType = 'funding.deposit';
    if (normalizedType === 'withdrawal') eventType = 'funding.withdrawal';
    if (!eventType) continue;

    await appendUnifiedLedgerEvent({
      userId: activeUserId,
      app: 'vest',
      type: eventType,
      amount: Number(tx?.total ?? tx?.amount ?? 0),
      asset: String(tx?.asset || ''),
      currency: String(tx?.currency || 'USD'),
      metadata: {
        sourceTxId: txId,
        amount: Number(tx?.amount || 0),
        price: Number(tx?.price || 0),
        fee: Number(tx?.fee || 0),
        gross: Number(tx?.gross || 0),
        netSettlement: Number(tx?.netSettlement || 0),
        status: String(tx?.status || 'completed'),
        timestamp: String(tx?.timestamp || tx?.date || ''),
        assetName: String(tx?.assetName || ''),
        assetClass: String(tx?.assetClass || ''),
      },
    });
    mappedSourceIds.add(txId);
  }
};

const syncPortfolioSnapshotCookie = (portfolio: any) => {
  if (typeof document === 'undefined' || !portfolio) return;
  const holdings = JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
  const normalizedTradeHoldings = holdings
    .filter((holding: any) => holding && Number.isFinite(Number(holding.currentValue || 0)))
    .map((holding: any) => ({
      id: String(holding.id || `holding-${holding.symbol || Date.now()}`),
      symbol: String(holding.symbol || 'N/A'),
      shares: Number(holding.amount || 0),
      value: Number(holding.currentValue || 0),
    }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  const allocationHoldings = Array.isArray(portfolio.assets)
    ? portfolio.assets
        .filter((asset: any) => asset && Number.isFinite(Number(asset.value || 0)))
        .map((asset: any, index: number) => ({
          id: `asset-${index}-${String(asset.type || 'asset').toLowerCase()}`,
          symbol: String(asset.type || 'Asset'),
          shares: Number(asset.allocation || 0),
          value: Number(asset.value || 0),
        }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 5)
    : [];

  const topHoldings = normalizedTradeHoldings.length > 0 ? normalizedTradeHoldings : allocationHoldings;

  const snapshot = {
    userId: getActiveVestUserId(),
    totalValue: Number(portfolio.totalValue || 0),
    change24h: Number(portfolio.change24h || 0),
    changeAmount: Number(portfolio.changeAmount || 0),
    topHoldings,
    updatedAt: new Date().toISOString(),
  };
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `auravest_portfolio_snapshot=${encodeURIComponent(JSON.stringify(snapshot))}; expires=${expires}; path=/; SameSite=Lax`;
};

const syncVestActivitySnapshotCookie = (transactionList: any[]) => {
  if (typeof document === 'undefined') return;

  const normalizedEvents = (transactionList || [])
    .map((transaction) => {
      const rawTimestamp = String(transaction?.timestamp || transaction?.date || new Date().toISOString());
      const timestamp = Number.isNaN(Date.parse(rawTimestamp)) ? new Date().toISOString() : new Date(rawTimestamp).toISOString();
      const amount = Number(transaction?.total || 0);
      return {
        id: `auravest-${String(transaction?.id || Date.now())}`,
        app: 'AuraVest',
        type: String(transaction?.type || 'trade'),
        title: `${String(transaction?.type || 'Trade').toUpperCase()} ${String(transaction?.asset || transaction?.assetName || 'Asset')}`,
        amount: Number.isFinite(amount) ? amount : 0,
        currency: String(transaction?.currency || 'USD'),
        userId: getActiveVestUserId(),
        timestamp,
        status: String(transaction?.status || 'completed'),
        meta: {
          asset: String(transaction?.asset || ''),
          orderType: String(transaction?.orderType || ''),
        },
      };
    })
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 40);

  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `auravest_activity_snapshot=${encodeURIComponent(JSON.stringify(normalizedEvents))}; expires=${expires}; path=/; SameSite=Lax`;
};

const getStartingCashBalance = () => {
  const existingStarting = Number(localStorage.getItem(CASH_STARTING_BALANCE_KEY) || '');
  const transactions = parseStoredJson<Array<Record<string, unknown>>>('auravest_transactions', []);
  const hasTradeTransactions = transactions.some((tx) => {
    const type = String(tx?.type || '').toLowerCase();
    return type === 'buy' || type === 'sell';
  });
  const storedNonCashTotal = getStoredNonCashAssets().reduce((sum, asset) => sum + Number(asset.value || 0), 0);
  const isLegacyDuplicatedCash = Number.isFinite(existingStarting)
    && existingStarting > 0
    && !hasTradeTransactions
    && Math.abs(existingStarting - storedNonCashTotal) < 0.01;

  if (isLegacyDuplicatedCash) {
    localStorage.setItem(CASH_STARTING_BALANCE_KEY, String(DEFAULT_STARTING_CASH));
    return DEFAULT_STARTING_CASH;
  }

  if (Number.isFinite(existingStarting) && existingStarting >= 0) {
    return Number(existingStarting.toFixed(2));
  }

  const normalizedDefault = Number(DEFAULT_STARTING_CASH.toFixed(2));
  localStorage.setItem(CASH_STARTING_BALANCE_KEY, String(normalizedDefault));
  return normalizedDefault;
};

const resolveTradeAmounts = (tx: any) => {
  const amount = Number(tx?.amount || 0);
  const price = Number(tx?.price || 0);
  const inferredGross = amount * price;
  const gross = Number.isFinite(Number(tx?.gross)) ? Number(tx.gross) : inferredGross;
  const fee = Number.isFinite(Number(tx?.fee)) ? Number(tx.fee) : gross * 0.001;
  return {
    gross: Number.isFinite(gross) ? gross : 0,
    fee: Number.isFinite(fee) ? fee : 0,
  };
};

const reconcileCashBalanceFromTransactions = () => {
  const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
  const startingCash = getStartingCashBalance();

  const reconciledCash = (transactions || []).reduce((sum: number, tx: any) => {
    const status = String(tx?.status || '').toLowerCase();
    if (status && status !== 'filled' && status !== 'completed') return sum;

    const type = String(tx?.type || '').toLowerCase();
    const { gross, fee } = resolveTradeAmounts(tx);

    if (type === 'deposit') return sum + Number(tx?.amount || 0);
    if (type === 'withdrawal') return sum - Number(tx?.amount || 0);

    if (type === 'sell') return sum + Math.max(gross - fee, 0);
    if (type === 'buy') return sum - (gross + fee);
    return sum;
  }, 0);

  const normalizedCash = Number((startingCash + reconciledCash).toFixed(2));

  localStorage.setItem(CASH_BALANCE_KEY, String(normalizedCash));
  return normalizedCash;
};

const rebuildTradeHoldingsFromTransactions = (transactions: any[]) => {
  const holdingMap = new Map<string, any>();

  for (const tx of transactions || []) {
    const status = String(tx?.status || '').toLowerCase();
    if (status && status !== 'filled' && status !== 'completed') continue;

    const type = String(tx?.type || '').toLowerCase();
    if (type !== 'buy' && type !== 'sell') continue;

    const symbol = String(tx?.asset || tx?.symbol || '').toUpperCase();
    if (!symbol) continue;

    const amount = Number(tx?.amount || 0);
    const price = Number(tx?.price || 0);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(price) || price <= 0) continue;

    const existing = holdingMap.get(symbol) || {
      id: `trade-holding-${symbol}`,
      name: String(tx?.assetName || symbol),
      symbol,
      amount: 0,
      currentPrice: price,
      currentValue: 0,
      change24h: 0,
      type: String(tx?.assetClass || 'Stocks'),
      costBasis: 0,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      averagePrice: 0,
      currency: String(tx?.currency || 'USD'),
      quantityType: String(tx?.quantityType || 'units'),
    };

    if (type === 'buy') {
      const newAmount = existing.amount + amount;
      const newCostBasis = existing.costBasis + (amount * price);
      existing.amount = newAmount;
      existing.costBasis = newCostBasis;
      existing.averagePrice = newAmount > 0 ? newCostBasis / newAmount : price;
      existing.currentPrice = price;
      existing.change24h = Number(tx?.change24h || existing.change24h || 0);
      existing.type = String(tx?.assetClass || existing.type || 'Stocks');
      existing.currency = String(tx?.currency || existing.currency || 'USD');
      existing.quantityType = String(tx?.quantityType || existing.quantityType || 'units');
      existing.name = String(tx?.assetName || existing.name || symbol);
      holdingMap.set(symbol, existing);
      continue;
    }

    const newAmount = Math.max(existing.amount - amount, 0);
    const averagePrice = existing.amount > 0 ? existing.costBasis / existing.amount : existing.averagePrice;
    existing.amount = newAmount;
    existing.costBasis = newAmount * (Number.isFinite(averagePrice) ? averagePrice : 0);
    existing.currentPrice = price;
    existing.change24h = Number(tx?.change24h || existing.change24h || 0);
    existing.type = String(tx?.assetClass || existing.type || 'Stocks');
    existing.currency = String(tx?.currency || existing.currency || 'USD');
    existing.quantityType = String(tx?.quantityType || existing.quantityType || 'units');
    existing.name = String(tx?.assetName || existing.name || symbol);

    if (existing.amount > 0) {
      holdingMap.set(symbol, existing);
    } else {
      holdingMap.delete(symbol);
    }
  }

  const holdings = Array.from(holdingMap.values()).map((holding: any) => {
    const currentValue = Number((holding.amount * holding.currentPrice).toFixed(2));
    const unrealizedPnL = Number((currentValue - holding.costBasis).toFixed(2));
    const unrealizedPnLPercent = holding.costBasis > 0 ? Number(((unrealizedPnL / holding.costBasis) * 100).toFixed(2)) : 0;
    return {
      ...holding,
      amount: Number(holding.amount.toFixed(8)),
      averagePrice: Number((holding.averagePrice || holding.currentPrice || 0).toFixed(8)),
      costBasis: Number(holding.costBasis.toFixed(2)),
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercent,
    };
  });

  localStorage.setItem('auravest_trade_holdings', JSON.stringify(holdings));
  return holdings;
};

const rebuildPortfolioSnapshot = () => {
  const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
  const holdings = rebuildTradeHoldingsFromTransactions(transactions);
  const localPositions = JSON.parse(localStorage.getItem('auravest_local_positions') || '[]');
  const hasTradeData = (holdings || []).length > 0 || (localPositions || []).length > 0 || (transactions || []).length > 0;
  if (!hasTradeData) {
    return null;
  }

  const cashBalance = reconcileCashBalanceFromTransactions();
  const groupedValues = new Map<string, number>();
  const preservedNonCashAssets = getStoredNonCashAssets();
  const hasDetailedHoldings = (holdings || []).length > 0 || (localPositions || []).length > 0;

  if (hasDetailedHoldings) {
    (holdings || []).forEach((holding: any) => {
      const type = holding?.type || 'Stocks';
      const currentValue = Number(holding?.currentValue || 0);
      groupedValues.set(type, (groupedValues.get(type) || 0) + currentValue);
    });

    (localPositions || []).forEach((position: any) => {
      const amount = Number(position?.amount || 0);
      groupedValues.set('Local Investments', (groupedValues.get('Local Investments') || 0) + amount);
    });
  } else {
    preservedNonCashAssets.forEach((asset) => {
      groupedValues.set(asset.type, (groupedValues.get(asset.type) || 0) + Number(asset.value || 0));
    });
  }

  if (Number.isFinite(cashBalance) && Math.abs(cashBalance) > 0) {
    groupedValues.set('Cash', (groupedValues.get('Cash') || 0) + cashBalance);
  }

  const assets = Array.from(groupedValues.entries()).map(([type, value]) => ({ type, value, allocation: 0 }));
  const totalValue = assets.reduce((sum, assetItem) => sum + Number(assetItem.value || 0), 0);
  const existingPortfolio = parseStoredJson<{ changeAmount?: number }>('auravest_portfolio', {});
  const changeAmount = hasDetailedHoldings
    ? (holdings || []).reduce((sum: number, holding: any) => {
        const value = Number(holding?.currentValue || 0);
        const change = Number(holding?.change24h || 0);
        return sum + (value * change / 100);
      }, 0)
    : Number(existingPortfolio.changeAmount || getDefaultPortfolioForActiveUser().changeAmount || 0);
  const change24h = totalValue > 0 ? (changeAmount / totalValue) * 100 : 0;

  const normalizedAssets = assets.map((assetItem) => ({
    ...assetItem,
    allocation: totalValue > 0 ? Number(((Number(assetItem.value || 0) / totalValue) * 100).toFixed(1)) : 0,
  }));

  const snapshot = {
    totalValue: Number(totalValue.toFixed(2)),
    change24h: Number(change24h.toFixed(2)),
    changeAmount: Number(changeAmount.toFixed(2)),
    assets: normalizedAssets,
  };

  localStorage.setItem('auravest_portfolio', JSON.stringify(snapshot));
  return snapshot;
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
  const transactions = JSON.parse(localStorage.getItem('auravest_transactions') || '[]');
  await syncAuraVestTransactionsToUnifiedLedger(transactions);
  syncVestActivitySnapshotCookie(transactions);

  const rebuiltPortfolio = rebuildPortfolioSnapshot();
  if (rebuiltPortfolio && Array.isArray(rebuiltPortfolio.assets) && rebuiltPortfolio.assets.length > 0) {
    syncPortfolioSnapshotCookie(rebuiltPortfolio);
    return rebuiltPortfolio;
  }

  // If no portfolio data exists, return default
  if (!data || Object.keys(data).length === 0) {
    const defaultPortfolio = getDefaultPortfolioForActiveUser();
    syncPortfolioSnapshotCookie(defaultPortfolio);
    return defaultPortfolio;
  }

  // Keep persisted values stable across refreshes.
  data.change24h = Number(data.change24h || 0);
  data.changeAmount = Number(data.changeAmount || 0);
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
  await syncAuraVestTransactionsToUnifiedLedger(transactions);
  syncVestActivitySnapshotCookie(transactions);

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
      currency: String(item.asset.currency || 'USD'),
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
    await syncAuraVestTransactionsToUnifiedLedger(transactions);

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
