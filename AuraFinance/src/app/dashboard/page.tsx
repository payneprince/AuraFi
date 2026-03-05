'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getBankInsights, getOverallInsights, getVestInsights, getWalletInsights } from 'lib/shared/auraai-core';
import { getUser } from 'lib/shared/mock-data';
import Image from 'next/image';
import AuraAIChat from '@/components/AuraAIChat';
import UserProfileMenu from '@/components/UserProfileMenu';
import { AlertTriangle, BellRing, Info, Moon, Sun } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('aurafinance_dark_mode') === 'true';
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('aurafinance_dark_mode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return null;

  const userId = session?.user?.id ? parseInt(session.user.id as string, 10) : 1;
  const user = getUser(userId);
  const insights = getOverallInsights(userId);
  const bankInsights = getBankInsights(userId);
  const vestInsights = getVestInsights(userId);
  const walletInsights = getWalletInsights(userId);

  const recentTransactions = user?.bank?.transactions?.slice(-5).reverse() ?? [];
  const topHoldings = user?.vest?.portfolio?.slice(0, 3) ?? [];

  // Spending by category (mock data)
  const spendingCategories = [
    { name: 'Groceries', amount: 450, color: 'bg-accent' },
    { name: 'Dining', amount: 320, color: 'bg-magenta' },
    { name: 'Transport', amount: 180, color: 'bg-primary' },
    { name: 'Entertainment', amount: 120, color: 'bg-purple' },
    { name: 'Other', amount: 230, color: 'bg-lightGray' }
  ];
  const totalSpending = spendingCategories.reduce((sum, cat) => sum + cat.amount, 0);

  // Cash flow data
  const monthlyIncome = 4500;
  const monthlyExpenses = bankInsights.monthlySpending;
  const cashFlow = monthlyIncome - monthlyExpenses;

  const formatCurrency = (amount: number, digits = 2) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);

  // Upcoming bills
  const upcomingBills = [
    { name: 'Rent', amount: 1200, dueDate: 'Mar 1', status: 'pending' },
    { name: 'Internet', amount: 60, dueDate: 'Mar 5', status: 'pending' },
    { name: 'Phone', amount: 45, dueDate: 'Mar 10', status: 'pending' }
  ];

  const trendMultipliers: Record<'7D' | '30D' | '90D' | '1Y', number[]> = {
    '7D': [0.982, 0.987, 0.992, 0.989, 0.996, 0.998, 1],
    '30D': [0.938, 0.944, 0.951, 0.958, 0.962, 0.969, 0.973, 0.981, 0.988, 0.994, 1],
    '90D': [0.872, 0.886, 0.901, 0.914, 0.928, 0.941, 0.956, 0.967, 0.978, 0.989, 1],
    '1Y': [0.744, 0.768, 0.792, 0.816, 0.841, 0.868, 0.892, 0.918, 0.943, 0.971, 1],
  };

  const netWorthTrend = trendMultipliers[selectedRange].map((multiplier, index) => ({
    label: index + 1,
    value: insights.netWorth * multiplier,
  }));

  const trendMin = Math.min(...netWorthTrend.map((point) => point.value));
  const trendMax = Math.max(...netWorthTrend.map((point) => point.value));
  const trendStart = netWorthTrend[0]?.value ?? insights.netWorth;
  const trendEnd = netWorthTrend[netWorthTrend.length - 1]?.value ?? insights.netWorth;
  const trendChangePercent = trendStart === 0 ? 0 : ((trendEnd - trendStart) / trendStart) * 100;

  const chartPoints = netWorthTrend.map((point, index) => {
    const x = netWorthTrend.length === 1 ? 50 : (index / (netWorthTrend.length - 1)) * 100;
    const y = trendMax === trendMin ? 50 : 100 - ((point.value - trendMin) / (trendMax - trendMin)) * 100;
    return { ...point, x, y };
  });

  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = chartPoints.length
    ? `M ${chartPoints[0].x} 100 ${linePath.replace('M ', 'L ')} L ${chartPoints[chartPoints.length - 1].x} 100 Z`
    : '';

  const smartAlerts = [
    ...(bankInsights.monthlySpending > 3000
      ? [{ level: 'warning', text: 'Monthly spending is above $3,000. Review discretionary categories.' }]
      : []),
    ...(walletInsights.balance < 300
      ? [{ level: 'warning', text: 'AuraWallet balance is below $300. Consider topping up.' }]
      : []),
    ...(topHoldings.length > 0
      ? [{ level: 'info', text: `Top portfolio position is ${topHoldings[0].symbol}. Consider diversification check.` }]
      : []),
    ...(upcomingBills.some((bill) => bill.amount >= 1000)
      ? [{ level: 'info', text: 'High-value bill due soon. Ensure cash is reserved.' }]
      : []),
  ];

  const unifiedActivity = [
    ...recentTransactions.map((tx) => ({
      id: `bank-${tx.id}`,
      source: 'AuraBank' as const,
      title: tx.description,
      date: tx.date,
      amount: tx.amount,
    })),
    ...topHoldings.slice(0, 2).map((holding) => ({
      id: `vest-${holding.id}`,
      source: 'AuraVest' as const,
      title: `Holding update: ${holding.symbol}`,
      date: 'Today',
      amount: holding.value * 0.01,
    })),
    ...walletInsights.insights.slice(0, 2).map((insight, index) => ({
      id: `wallet-${index}`,
      source: 'AuraWallet' as const,
      title: insight,
      date: 'Today',
      amount: null,
    })),
  ].slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 bg-white/60 dark:bg-slate-900/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/40 dark:border-slate-700/60">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-white shadow-lg flex items-center justify-center overflow-hidden">
              <Image src="/images/suite.jpeg" alt="Aura Finance" width={56} height={56} className="object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-magenta to-accent bg-clip-text text-transparent">Welcome 👋</h1>
              <p className="text-sm text-muted-foreground">Your unified view of banking, investing, and payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <UserProfileMenu userName={session.user.name ?? undefined} userEmail={session.user.email ?? undefined} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Net Worth</h3>
            <p className="text-3xl font-bold text-accent mb-1">{formatCurrency(insights.netWorth)}</p>
            <p className="text-xs text-muted-foreground">Across all products</p>
          </div>
          <div className="bg-gradient-to-br from-white to-pink-50/40 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">AuraBank Balance</h3>
            <p className="text-3xl font-bold text-aurabank-magenta mb-1">{formatCurrency(bankInsights.totalBalance)}</p>
            <p className="text-xs text-muted-foreground">Monthly spend: {formatCurrency(bankInsights.monthlySpending)}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-red-50/40 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">AuraVest Portfolio</h3>
            <p className="text-3xl font-bold text-auravest-crimson mb-1">{formatCurrency(vestInsights.totalValue)}</p>
            <p className="text-xs text-muted-foreground">Top: {topHoldings[0]?.symbol ?? 'N/A'}</p>
          </div>
          <div className="bg-gradient-to-br from-white via-green-50/60 to-emerald-100/70 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">AuraWallet Balance</h3>
            <p className="text-3xl font-bold text-accent mb-1">{formatCurrency(walletInsights.balance)}</p>
            <p className="text-xs text-muted-foreground">Last activity: {walletInsights.insights[1]}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 lg:col-span-2 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-white dark:bg-white shadow-lg flex items-center justify-center overflow-hidden">
                <Image src="/images/ai.jpg" alt="AuraAI" width={48} height={48} className="object-cover" />
              </div>
              <h3 className="text-xl font-bold">AuraAI Insights</h3>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {insights.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-800 dark:to-slate-700 hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-700 transition-colors">
                  <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-accent to-magenta flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-accent to-teal hover:opacity-90" onClick={() => alert('Transfer feature coming soon')}>Transfer to AuraWallet</Button>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => alert('Investing feature coming soon')}>Invest in AuraVest</Button>
              <Button className="w-full" variant="outline" onClick={() => alert('Statements feature coming soon')}>Download Statements</Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Link href="http://localhost:3001" target="_blank" className="block group">
            <div className="bg-gradient-to-br from-aurabank-magenta to-aurabank-cyan text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  <Image src="/images/bank.jpg" alt="AuraBank" width={48} height={48} className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold">AuraBank</h3>
              </div>
              <p className="text-white/90">Manage your accounts and transactions</p>
            </div>
          </Link>
          <Link href="http://localhost:3002" target="_blank" className="block group">
            <div className="bg-gradient-to-br from-auravest-black to-auravest-crimson text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  <Image src="/images/vest.jpeg" alt="AuraVest" width={48} height={48} className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold">AuraVest</h3>
              </div>
              <p className="text-white/90">Invest in stocks, crypto, and more</p>
            </div>
          </Link>
          <Link href="http://localhost:3003" target="_blank" className="block group">
            <div className="bg-gradient-to-br from-emerald-400 via-green-600 to-black text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  <Image src="/images/wallet.jpg" alt="AuraWallet" width={48} height={48} className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold">AuraWallet</h3>
              </div>
              <p className="text-white/90">Send and receive money instantly</p>
            </div>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Net Worth Trend</h3>
              <div className="flex items-center gap-2">
                {(['7D', '30D', '90D', '1Y'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${selectedRange === range ? 'bg-gradient-to-r from-primary to-magenta text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-52 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                {[20, 40, 60, 80].map((line) => (
                  <line
                    key={line}
                    x1="0"
                    y1={line}
                    x2="100"
                    y2={line}
                    className="stroke-slate-300/60 dark:stroke-slate-600/60"
                    strokeWidth="0.6"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}

                {areaPath && (
                  <path
                    d={areaPath}
                    fill="url(#networthArea)"
                    className="opacity-70"
                  />
                )}

                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#networthLine)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )}

                {chartPoints.map((point, index) => (
                  <circle
                    key={`${point.label}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="1.6"
                    className="fill-white dark:fill-slate-900 stroke-primary"
                    strokeWidth="1.2"
                  >
                    <title>{formatCurrency(point.value)}</title>
                  </circle>
                ))}

                <defs>
                  <linearGradient id="networthLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="#D91E78" />
                  </linearGradient>
                  <linearGradient id="networthArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current net worth</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(insights.netWorth)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Range low: {formatCurrency(trendMin)}</span>
              <span className={`font-semibold ${trendChangePercent >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {trendChangePercent >= 0 ? '+' : ''}{trendChangePercent.toFixed(2)}% ({selectedRange})
              </span>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-magenta text-white flex items-center justify-center shadow-sm">
                  <BellRing className="w-4 h-4" />
                </span>
                Smart Alerts
              </h3>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground font-semibold">
                {smartAlerts.length}
              </span>
            </div>
            <div className="space-y-3">
              {smartAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No critical alerts right now.</p>
              ) : (
                smartAlerts.map((alert, index) => {
                  const isWarning = alert.level === 'warning';
                  const Icon = isWarning ? AlertTriangle : Info;

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border text-sm shadow-sm ${isWarning ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center ${isWarning ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isWarning ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>
                            {isWarning ? 'Warning' : 'Insight'}
                          </p>
                          <p className={`${isWarning ? 'text-red-900 dark:text-red-200' : 'text-blue-900 dark:text-blue-200'}`}>
                            {alert.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="mb-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Unified Activity Feed</h3>
            <span className="text-xs text-muted-foreground">AuraBank • AuraVest • AuraWallet</span>
          </div>
          <div className="space-y-3">
            {unifiedActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity available yet.</p>
            ) : (
              unifiedActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/70 dark:from-slate-800 dark:to-slate-700 border border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-semibold ${activity.source === 'AuraBank' ? 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300' : activity.source === 'AuraVest' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'}`}
                      >
                        {activity.source}
                      </span>
                      <span className="text-xs text-muted-foreground">{activity.date}</span>
                    </div>
                    <p className="font-semibold text-sm">{activity.title}</p>
                  </div>
                  {typeof activity.amount === 'number' ? (
                    <span className={`font-bold ${activity.amount >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {activity.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(activity.amount))}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Insight</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-4">Spending Breakdown</h3>
            <div className="space-y-3">
              {spendingCategories.map((cat, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-700 hover:from-slate-100 hover:to-blue-50 dark:hover:from-slate-700 dark:hover:to-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">{cat.name}</span>
                    <span className="font-bold">{formatCurrency(cat.amount, 0)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div 
                      className={`h-2 rounded-full ${cat.color} shadow-sm`} 
                      style={{ width: `${(cat.amount / totalSpending) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t mt-4">
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>Total Spending</span>
                  <span className="text-primary">{formatCurrency(totalSpending)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-4">Cash Flow</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-green-50 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-sm border border-teal-100 dark:border-slate-700">
                <span className="text-sm font-semibold">Income</span>
                <span className="text-xl font-bold text-accent">+{formatCurrency(monthlyIncome)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-sm border border-red-100 dark:border-slate-700">
                <span className="text-sm font-semibold">Expenses</span>
                <span className="text-xl font-bold text-destructive">-{formatCurrency(monthlyExpenses)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-md border-2 border-primary">
                <span className="text-sm font-bold">Net Cash Flow</span>
                <span className={`text-2xl font-bold ${cashFlow >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {cashFlow >= 0 ? '+' : '-'}{formatCurrency(Math.abs(cashFlow))}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">Last 30 days</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-4">Upcoming Bills</h3>
            <div className="space-y-3">
              {upcomingBills.map((bill, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700">
                  <div>
                    <p className="font-semibold">{bill.name}</p>
                    <p className="text-xs text-muted-foreground">Due {bill.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(bill.amount)}</p>
                    <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-500/20 dark:to-amber-500/20 text-yellow-900 dark:text-yellow-200 font-medium">Pending</span>
                  </div>
                </div>
              ))}
              <Button className="w-full mt-3 bg-gradient-to-r from-primary to-magenta hover:opacity-90" size="sm">View All Bills</Button>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentTransactions.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent transactions yet.</p>
              )}
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-700 hover:from-slate-100 hover:to-blue-50 dark:hover:from-slate-700 dark:hover:to-slate-700 transition-colors">
                  <div>
                    <p className="font-semibold">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <p className={`font-bold text-lg ${tx.amount < 0 ? 'text-destructive' : 'text-accent'}`}>
                    {tx.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-4">Goals</h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-teal-50 to-green-50 dark:from-slate-800 dark:to-slate-700">
                <div className="flex items-center justify-between text-sm mb-2 font-medium">
                  <span>Emergency Fund</span>
                  <span className="font-bold">$3,200 / $10,000</span>
                </div>
                <div className="h-3 w-full rounded-full bg-white dark:bg-slate-700 shadow-inner">
                  <div className="h-3 rounded-full bg-gradient-to-r from-accent to-teal shadow-sm" style={{ width: '32%' }} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700">
                <div className="flex items-center justify-between text-sm mb-2 font-medium">
                  <span>Investing Goal</span>
                  <span className="font-bold">$6,500 / $15,000</span>
                </div>
                <div className="h-3 w-full rounded-full bg-white dark:bg-slate-700 shadow-inner">
                  <div className="h-3 rounded-full bg-gradient-to-r from-magenta to-purple-500 shadow-sm" style={{ width: '43%' }} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
                <div className="flex items-center justify-between text-sm mb-2 font-medium">
                  <span>Vacation Fund</span>
                  <span className="font-bold">$900 / $2,500</span>
                </div>
                <div className="h-3 w-full rounded-full bg-white dark:bg-slate-700 shadow-inner">
                  <div className="h-3 rounded-full bg-gradient-to-r from-primary to-blue-500 shadow-sm" style={{ width: '36%' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-4">Top Holdings</h3>
            <div className="space-y-3">
              {topHoldings.length === 0 && (
                <p className="text-sm text-muted-foreground">No holdings yet.</p>
              )}
              {topHoldings.map((holding) => (
                <div key={holding.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-purple-50/30 dark:from-slate-800 dark:to-slate-700 hover:from-slate-100 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-700 transition-colors border border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="font-bold text-lg">{holding.symbol}</p>
                    <p className="text-xs text-muted-foreground">{holding.shares} shares</p>
                  </div>
                  <p className="font-bold text-xl text-magenta">{formatCurrency(holding.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AuraAIChat />
    </div>
  );
}

