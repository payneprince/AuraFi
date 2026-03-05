// Reusable AI insight engine for Aura Finance

import { bankData, vestData, walletData } from './mock-data.js';

// AI-powered insights based on user data
export function getBankInsights(userId) {
  const accounts = bankData.accounts.filter(a => a.userId === userId);
  const transactions = bankData.transactions.filter(t => accounts.some(a => a.id === t.accountId));

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const monthlySpending = transactions.filter(t => t.amount < 0 && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    totalBalance,
    monthlySpending,
    insights: [
      `Your total balance is $${totalBalance.toFixed(2)}. Consider moving excess to high-yield savings.`,
      `You've spent $${monthlySpending.toFixed(2)} this month. Your biggest expense was groceries.`,
      `Based on your spending, you could save $200/month by reducing dining out.`
    ]
  };
}

export function getVestInsights(userId) {
  const portfolio = vestData.portfolio.filter(p => p.userId === userId);
  const totalValue = portfolio.reduce((sum, p) => sum + p.value, 0);

  return {
    totalValue,
    insights: [
      `Your portfolio value is $${totalValue.toFixed(2)}. It's up 5% this month.`,
      `AAPL is your top performer. Consider diversifying into bonds.`,
      `AI suggests investing in tech stocks for long-term growth.`
    ]
  };
}

export function getWalletInsights(userId) {
  const balance = walletData.balance;
  const recentTransactions = walletData.transactions.slice(-5);

  return {
    balance,
    insights: [
      `Wallet balance: $${balance.toFixed(2)}. You have enough for 25 days of average spending.`,
      `Recent transaction: ${recentTransactions[0]?.description || 'None'}.`,
      `Tip: Set up auto-transfers from bank to maintain minimum balance.`
    ]
  };
}

export function getOverallInsights(userId) {
  const bank = getBankInsights(userId);
  const vest = getVestInsights(userId);
  const wallet = getWalletInsights(userId);

  return {
    netWorth: bank.totalBalance + vest.totalValue + wallet.balance,
    insights: [
      `Your net worth is $${(bank.totalBalance + vest.totalValue + wallet.balance).toFixed(2)}.`,
      `AI recommends transferring $${Math.min(500, bank.totalBalance * 0.1)} from bank to investments.`,
      `You're on track to reach your savings goal in 6 months.`
    ]
  };
}
