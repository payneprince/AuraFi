'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getBankInsights, getVestInsights, getWalletInsights } from 'lib/shared/auraai-core';
import { getUser } from 'lib/shared/mock-data';
import Image from 'next/image';
import AuraAIChat from '@/components/AuraAIChat';
import UserProfileMenu from '@/components/UserProfileMenu';
import { AlertTriangle, Moon, Sun, Landmark, Wallet, TrendingUp, ArrowRight, Activity, PieChart, Receipt, Target, Sparkles } from 'lucide-react';
import { writeUnifiedAuthSession } from '../../../../shared/unified-auth';
import { AURAFINANCE_STORAGE_KEYS } from '@/lib/financeStateKeys';
import {
  getUnifiedLedgerEvents,
  replayUnifiedLedger,
  appendUnifiedLedgerEvent,
  UnifiedLedgerEvent,
} from '../../../../shared/unified-ledger';
import { enqueueCrossAppTransfer } from '../../../../shared/cross-app-transfer-sync';

type VestHolding = {
  id: string;
  symbol: string;
  shares: number;
  value: number;
};

type UnifiedReplaySnapshot = {
  bank: number;
  vest: number;
  wallet: number;
  netWorth: number;
  eventCount: number;
  lastEventAt: string | null;
  touched: {
    bank: boolean;
    vest: boolean;
    wallet: boolean;
  };
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [bankBalanceValue, setBankBalanceValue] = useState<number | null>(null);
  const [vestPortfolioValue, setVestPortfolioValue] = useState<number | null>(null);
  const [walletBalanceValue, setWalletBalanceValue] = useState<number | null>(null);
  const [unifiedReplaySnapshot, setUnifiedReplaySnapshot] = useState<UnifiedReplaySnapshot | null>(null);
  const [unifiedLedgerEvents, setUnifiedLedgerEvents] = useState<UnifiedLedgerEvent[]>([]);
  const [vestHoldings, setVestHoldings] = useState<VestHolding[]>([]);
  // Transfer panel state
  const [transferFrom, setTransferFrom] = useState<'bank' | 'wallet' | 'vest'>('bank');
  const [transferTo, setTransferTo] = useState<'bank' | 'wallet' | 'vest'>('wallet');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferMsg, setTransferMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityAppFilter, setActivityAppFilter] = useState<'all' | 'bank' | 'vest' | 'wallet'>('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState<'all' | 'transfer' | 'funding' | 'trade' | 'other'>('all');
  const [activityDateRange, setActivityDateRange] = useState<'all' | '7d' | '30d' | '90d'>('30d');
  const [transferSuccessModal, setTransferSuccessModal] = useState<{
    amount: number;
    from: 'bank' | 'wallet' | 'vest';
    to: 'bank' | 'wallet' | 'vest';
    timestamp: string;
    reference: string;
  } | null>(null);
  const sessionUserId = String((session?.user as { id?: string } | undefined)?.id || '1');

  // Counter animation
  const [animBank, setAnimBank] = useState(0);
  const [animVest, setAnimVest] = useState(0);
  const [animWallet, setAnimWallet] = useState(0);
  const [balancesAnimated, setBalancesAnimated] = useState(false);

  // Chart hover
  const [chartHover, setChartHover] = useState<{ index: number } | null>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);

  const captureFinanceStateSnapshot = useCallback(() => {
    const snapshot: Record<string, string | null> = {};
    for (const key of AURAFINANCE_STORAGE_KEYS) {
      snapshot[key] = localStorage.getItem(key);
    }
    return snapshot;
  }, []);

  const persistFinanceStateToServer = useCallback(async (targetUserId: string) => {
    const normalizedUserId = String(targetUserId || '').trim();
    if (!normalizedUserId) return;

    const state = captureFinanceStateSnapshot();
    try {
      await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: normalizedUserId, state }),
        keepalive: true,
      });
    } catch {
      // Retry naturally on the next write.
    }
  }, [captureFinanceStateSnapshot]);

  const normalizeVestHoldings = (rawHoldings: unknown): VestHolding[] => {
    if (!Array.isArray(rawHoldings)) return [];

    return rawHoldings
      .map((holding, index) => {
        const row = (holding && typeof holding === 'object') ? (holding as Record<string, unknown>) : {};
        return {
          id: String(row.id || `vest-holding-${row.symbol || index}-${index}`),
          symbol: String(row.symbol || 'N/A'),
          shares: Number(row.shares || row.amount || 0),
          value: Number(row.value || row.currentValue || 0),
        };
      })
      .filter((holding) => Number.isFinite(holding.value) && holding.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const refreshUnifiedReplay = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      const [state, evts] = await Promise.all([
   
        replayUnifiedLedger(uid),
        getUnifiedLedgerEvents(uid),
      ]);
      const touched = {
        bank: evts.some((e) => e.app === 'bank'),
        vest: evts.some((e) => e.app === 'vest'),
        wallet: evts.some((e) => e.app === 'wallet'),
      };
      setUnifiedReplaySnapshot({
        bank: Number((state.cashByApp.bank ?? 0).toFixed(2)),
        vest: Number((state.cashByApp.vest ?? 0).toFixed(2)),
        wallet: Number((state.cashByApp.wallet ?? 0).toFixed(2)),
        netWorth: state.totalNetWorthEstimate,
        eventCount: evts.length,
        lastEventAt: evts.length > 0 ? evts[evts.length - 1].timestamp : null,
        touched,
      });
      setUnifiedLedgerEvents(evts.slice().reverse()); // newest first
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      if (sessionStorage.getItem('aurafinance_logging_out') === 'true') {
        sessionStorage.removeItem('aurafinance_logging_out');
        return;
      }
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await fetch(`/api/state?userId=${encodeURIComponent(sessionUserId)}`);
        if (response.ok) {
          const payload = await response.json() as { state?: Record<string, string | null> | null };
          if (payload?.state) {
            for (const key of AURAFINANCE_STORAGE_KEYS) {
              const value = payload.state[key];
              if (value === null || value === undefined) {
                localStorage.removeItem(key);
              } else {
                localStorage.setItem(key, value);
              }
            }
          }
        }
      } catch {
        // Fall back to local state.
      }

      const savedDarkMode = localStorage.getItem('aurafinance_dark_mode') === 'true';
      setDarkMode(savedDarkMode);
      document.documentElement.classList.toggle('dark', savedDarkMode);
      await persistFinanceStateToServer(sessionUserId);
    };

    void bootstrap();
  }, [sessionUserId, persistFinanceStateToServer]);

  useEffect(() => {
    if (!session?.user) return;

    writeUnifiedAuthSession({
      userId: sessionUserId,
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined,
      sourceApp: 'AuraFinance',
    });
  }, [session, sessionUserId]);

  useEffect(() => {
    const syncAuthoritativeSuiteBalances = async () => {
      try {
        const response = await fetch(`/api/suite-balances?userId=${encodeURIComponent(sessionUserId)}`);
        if (!response.ok) return false;

        const payload = await response.json() as {
          bankBalance?: number;
          walletBalance?: number;
          vestPortfolioValue?: number;
          vestTopHoldings?: VestHolding[];
        };

        if (typeof payload.bankBalance === 'number') {
          setBankBalanceValue(payload.bankBalance);
        }
        if (typeof payload.walletBalance === 'number') {
          setWalletBalanceValue(payload.walletBalance);
        }
        if (typeof payload.vestPortfolioValue === 'number') {
          setVestPortfolioValue(payload.vestPortfolioValue);
        }
        if (Array.isArray(payload.vestTopHoldings) && payload.vestTopHoldings.length > 0) {
          setVestHoldings(normalizeVestHoldings(payload.vestTopHoldings));
        }
        return true;
      } catch {
        // Fallback logic below keeps dashboard functional when endpoint is temporarily unavailable.
        return false;
      }
    };

    void syncAuthoritativeSuiteBalances();
    const authoritativeInterval = setInterval(() => {
      void syncAuthoritativeSuiteBalances();
    }, 1800);

    refreshUnifiedReplay(sessionUserId);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('aura-ledger-sync');
      channel.onmessage = (event) => {
        if (event?.data?.type === 'ledger.updated') {
          refreshUnifiedReplay(sessionUserId);
        }
      };
    }

    return () => {
      clearInterval(authoritativeInterval);
      channel?.close();
    };
  }, [sessionUserId, session, refreshUnifiedReplay]);

  // Trigger count-up animation when balances first arrive
  useEffect(() => {
    if (bankBalanceValue === null || vestPortfolioValue === null || walletBalanceValue === null) return;
    if (balancesAnimated) return;
    const tBank = bankBalanceValue;
    const tVest = vestPortfolioValue;
    const tWallet = walletBalanceValue;
    if (tBank === 0 && tVest === 0 && tWallet === 0) { setBalancesAnimated(true); return; }
    const duration = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimBank(tBank * ease);
      setAnimVest(tVest * ease);
      setAnimWallet(tWallet * ease);
      if (t < 1) requestAnimationFrame(tick);
      else setBalancesAnimated(true);
    };
    requestAnimationFrame(tick);
  }, [bankBalanceValue, vestPortfolioValue, walletBalanceValue, balancesAnimated]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('aurafinance_dark_mode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
    void persistFinanceStateToServer(sessionUserId);
  };

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = chartSvgRef.current;
    if (!svg || chartPoints.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    let nearest = 0;
    let dist = Infinity;
    chartPoints.forEach((pt, i) => {
      const d = Math.abs(pt.x - mouseX);
      if (d < dist) { dist = d; nearest = i; }
    });
    setChartHover({ index: nearest });
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return null;

  const isDemoUser = sessionUserId === '1';

  // Personalized greeting
  const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const firstName = (session.user?.name ?? '').split(' ')[0] || 'there';

  const bankInsights = isDemoUser ? getBankInsights(1) : { totalBalance: 0, monthlySpending: 0 };
  const vestInsights = isDemoUser ? getVestInsights(1) : { totalValue: 0 };
  const walletInsights = isDemoUser ? getWalletInsights(1) : { balance: 0 };
  const mockUser = isDemoUser ? getUser(parseInt(sessionUserId, 10)) : null;

  const baseBankBalance = bankBalanceValue ?? bankInsights.totalBalance;
  const baseVestValue = vestPortfolioValue ?? vestInsights.totalValue;
  const baseWalletBalance = walletBalanceValue ?? walletInsights.balance;

  const effectiveBankBalance = Number(baseBankBalance.toFixed(2));
  const effectiveVestValue = Number(baseVestValue.toFixed(2));
  const effectiveWalletBalance = Number(baseWalletBalance.toFixed(2));
  const liveNetWorth = effectiveBankBalance + effectiveVestValue + effectiveWalletBalance;
  const isNewUser = !isDemoUser && liveNetWorth === 0;

  // Animated display values (count-up on first load, then live)
  const isLoading = bankBalanceValue === null;
  const dispBank = balancesAnimated ? effectiveBankBalance : animBank;
  const dispVest = balancesAnimated ? effectiveVestValue : animVest;
  const dispWallet = balancesAnimated ? effectiveWalletBalance : animWallet;
  const dispNetWorth = dispBank + dispVest + dispWallet;

  // Portfolio allocation for donut chart
  const allocTotal = effectiveBankBalance + effectiveVestValue + effectiveWalletBalance;
  const bankAlloc = allocTotal > 0 ? (effectiveBankBalance / allocTotal) * 100 : 0;
  const vestAlloc = allocTotal > 0 ? (effectiveVestValue / allocTotal) * 100 : 0;
  const walletAlloc = allocTotal > 0 ? (effectiveWalletBalance / allocTotal) * 100 : 0;
  const donutR = 38;
  const donutCirc = 2 * Math.PI * donutR;
  const bankDash = (bankAlloc / 100) * donutCirc;
  const vestDash = (vestAlloc / 100) * donutCirc;
  const walletDash = (walletAlloc / 100) * donutCirc;

  const recentTransactions = mockUser?.bank?.transactions?.slice(-5).reverse() ?? [];
  const mockHoldings = (mockUser?.vest?.portfolio ?? []).map((holding, index: number) => {
    const row = (holding && typeof holding === 'object') ? (holding as Record<string, unknown>) : {};
    return {
      id: String(row.id || `mock-holding-${index}`),
      symbol: String(row.symbol || 'N/A'),
      shares: Number(row.shares || 0),
      value: Number(row.value || 0),
    };
  });
  const topHoldings = (vestHoldings.length > 0 ? vestHoldings : mockHoldings).slice(0, 3);

  const spendingCategories = isDemoUser ? [
    { name: 'Groceries', amount: 450, color: 'bg-accent' },
    { name: 'Dining', amount: 320, color: 'bg-magenta' },
    { name: 'Transport', amount: 180, color: 'bg-primary' },
    { name: 'Entertainment', amount: 120, color: 'bg-purple' },
    { name: 'Other', amount: 230, color: 'bg-lightGray' },
  ] : [];
  const totalSpending = spendingCategories.reduce((sum, cat) => sum + cat.amount, 0);

  // Cash flow data — only meaningful for demo user; real users start at 0
  const monthlyIncome = isDemoUser ? 4500 : 0;
  const monthlyExpenses = bankInsights.monthlySpending;
  const cashFlow = monthlyIncome - monthlyExpenses;

  const formatCurrency = (amount: number, digits = 2) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);

  const buildAppUrl = (port: number, path = '') => {
    if (typeof window === 'undefined') return `http://localhost:${port}${path}`;
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:${port}${path}`;
  };

  const stockLogoFile: Record<string, string> = {
    AAPL: 'AAPL.png', MSFT: 'MSFT.png', GOOGL: 'GOOGL.png', TSLA: 'TSLA.png',
    AMZN: 'AMZN.png', NVDA: 'NVDA.png', META: 'META.png', NFLX: 'NFLX.png',
    JPM: 'JPM.png', V: 'V.svg', JNJ: 'JNJ.png', WMT: 'WMT.png',
    PG: 'PG.png', KO: 'KO.png', DIS: 'DIS.png', BA: 'BA.svg',
    XOM: 'XOM.png', PFE: 'PFE.png', INTC: 'INTC.png', AMD: 'AMD.svg',
    CRM: 'CRM.png', ORCL: 'ORCL.png', IBM: 'IBM.png', CSCO: 'CSCO.svg',
    ADBE: 'ADBE.png', NOW: 'NOW.png', UBER: 'UBER.png', SPOT: 'SPOT.png',
    ZM: 'ZM.png', SQ: 'SQ.svg', SHOP: 'SHOP.png', PYPL: 'PYPL.png',
    EBAY: 'EBAY.svg', TWTR: 'TWTR.svg',
  };

  const cryptoLogoSlug: Record<string, string> = {
    BTC: 'btc', ETH: 'eth', BNB: 'bnb', SOL: 'sol', ADA: 'ada', DOT: 'dot',
    LINK: 'link', AVAX: 'avax', MATIC: 'matic', UNI: 'uni', ALGO: 'algo',
    VET: 'vet', ICP: 'icp', FIL: 'fil', TRX: 'trx', ETC: 'etc', XLM: 'xlm',
    THETA: 'theta', FTM: 'ftm', HBAR: 'hbar', NEAR: 'near', FLOW: 'flow',
    MANA: 'mana', SAND: 'sand', AXS: 'axs', CHZ: 'chz', ENJ: 'enj', BAT: 'bat',
    ZRX: 'zrx', STORJ: 'storj', ANT: 'ant', REP: 'rep', GNT: 'gnt', ARK: 'ark',
  };

  const GOLD_LOGO_URL = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/gold.svg';

  const getHoldingLogoUrl = (symbol: string) => {
    const upper = symbol.toUpperCase();
    const stockFile = stockLogoFile[upper];
    if (stockFile) return `/logos/stocks/${stockFile}`;
    if (upper === 'GOLD' || upper === 'XAU') return GOLD_LOGO_URL;
    const cryptoSlug = cryptoLogoSlug[upper];
    if (cryptoSlug) return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${cryptoSlug}.svg`;
    return null;
  };

  const openLauncherApp = (app: 'bank' | 'vest' | 'wallet') => {
    const port = app === 'bank' ? 3001 : app === 'vest' ? 3002 : 3003;
    window.open(buildAppUrl(port, `?userId=${sessionUserId}`), '_blank', 'noopener,noreferrer');
  };

  const appLabel = (app: 'bank' | 'wallet' | 'vest') => {
    if (app === 'bank') return 'AuraBank';
    if (app === 'wallet') return 'AuraWallet';
    return 'AuraVest';
  };

  const handleQuickTransfer = async () => {
    const parsed = parseFloat(transferAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setTransferMsg({ type: 'err', text: 'Enter a valid positive amount.' });
      return;
    }
    if (transferFrom === transferTo) {
      setTransferMsg({ type: 'err', text: 'Source and destination must differ.' });
      return;
    }
    setTransferring(true);
    setTransferMsg(null);
    try {
      const actionId = `qt-${Date.now()}`;
      const transferResponse = await fetch('/api/quick-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionUserId,
          from: transferFrom,
          to: transferTo,
          amount: parsed,
          actionId,
        }),
      });

      const transferApplication = await transferResponse.json() as {
        ok?: boolean;
        error?: string;
        deltas?: { bank: number; wallet: number; vest: number };
      };

      if (!transferResponse.ok || !transferApplication?.ok || !transferApplication.deltas) {
        setTransferMsg({ type: 'err', text: transferApplication?.error || 'Transfer failed.' });
        return;
      }

      const eventType = `transfer.${transferFrom}_to_${transferTo}` as const;
      await appendUnifiedLedgerEvent({
        userId: sessionUserId,
        app: transferFrom,
        type: eventType,
        amount: parsed,
        currency: 'USD',
        metadata: {
          source: 'finance.quickTransfer',
          toApp: transferTo,
          description: `Quick transfer: ${transferFrom} → ${transferTo}`,
          sourceActionId: actionId,
        },
      });

      enqueueCrossAppTransfer({
        id: actionId,
        userId: sessionUserId,
        fromApp: transferFrom,
        toApp: transferTo,
        amount: parsed,
        description: `Quick transfer: ${transferFrom} -> ${transferTo}`,
      });

      const deltas = transferApplication.deltas;
      setBankBalanceValue((value) => Number(((value ?? baseBankBalance) + deltas.bank).toFixed(2)));
      setVestPortfolioValue((value) => Number(((value ?? baseVestValue) + deltas.vest).toFixed(2)));
      setWalletBalanceValue((value) => Number(((value ?? baseWalletBalance) + deltas.wallet).toFixed(2)));

      setTransferMsg({ type: 'ok', text: `✓ $${parsed.toFixed(2)} queued: ${transferFrom} → ${transferTo}` });
      setTransferSuccessModal({
        amount: parsed,
        from: transferFrom,
        to: transferTo,
        timestamp: new Date().toISOString(),
        reference: actionId,
      });
      setTransferAmount('');
      refreshUnifiedReplay(sessionUserId);
    } catch {
      setTransferMsg({ type: 'err', text: 'Transfer failed. Please try again.' });
    } finally {
      setTransferring(false);
    }
  };

  const upcomingBills = isDemoUser ? [
    { name: 'Rent', amount: 1200, dueDate: 'Mar 1', status: 'pending' },
    { name: 'Internet', amount: 60, dueDate: 'Mar 5', status: 'pending' },
    { name: 'Phone', amount: 45, dueDate: 'Mar 10', status: 'pending' },
  ] : [];

  const trendMultipliers: Record<'7D' | '30D' | '90D' | '1Y', number[]> = {
    '7D': [0.982, 0.987, 0.992, 0.989, 0.996, 0.998, 1],
    '30D': [0.938, 0.944, 0.951, 0.958, 0.962, 0.969, 0.973, 0.981, 0.988, 0.994, 1],
    '90D': [0.872, 0.886, 0.901, 0.914, 0.928, 0.941, 0.956, 0.967, 0.978, 0.989, 1],
    '1Y': [0.744, 0.768, 0.792, 0.816, 0.841, 0.868, 0.892, 0.918, 0.943, 0.971, 1],
  };

  const netWorthTrend = trendMultipliers[selectedRange].map((multiplier, index) => ({
    label: index + 1,
    value: liveNetWorth * multiplier,
  }));

  const trendMin = Math.min(...netWorthTrend.map((point) => point.value));
  const trendMax = Math.max(...netWorthTrend.map((point) => point.value));
  const trendStart = netWorthTrend[0]?.value ?? liveNetWorth;
  const trendEnd = netWorthTrend[netWorthTrend.length - 1]?.value ?? liveNetWorth;
  const trendChangePercent = trendStart === 0 ? 0 : ((trendEnd - trendStart) / trendStart) * 100;

  const chartPoints = netWorthTrend.map((point, index) => {
    const x = netWorthTrend.length === 1 ? 50 : (index / (netWorthTrend.length - 1)) * 100;
    const y = trendMax === trendMin ? 50 : 100 - ((point.value - trendMin) / (trendMax - trendMin)) * 100;
    return { ...point, x, y };
  });

  // Smooth cubic bezier curve
  const smoothLinePath = chartPoints.length > 1
    ? chartPoints.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
        const prev = chartPoints[i - 1];
        const cp1x = (prev.x + (pt.x - prev.x) / 3).toFixed(2);
        const cp2x = (pt.x - (pt.x - prev.x) / 3).toFixed(2);
        return `${acc} C ${cp1x} ${prev.y.toFixed(2)} ${cp2x} ${pt.y.toFixed(2)} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
      }, '')
    : `M 50 50`;

  const smoothAreaPath = chartPoints.length > 1
    ? `M ${chartPoints[0].x.toFixed(2)} 102 ${smoothLinePath.replace(/^M/, 'L')} L ${chartPoints[chartPoints.length - 1].x.toFixed(2)} 102 Z`
    : '';

  // Keep old paths as fallback
  const linePath = smoothLinePath;
  const areaPath = smoothAreaPath;

  const activityFeed = unifiedLedgerEvents.map((event) => {
    const source = event.app === 'bank' ? 'AuraBank' : event.app === 'vest' ? 'AuraVest' : 'AuraWallet';
    const isTransfer = event.type.startsWith('transfer.');
    const signedAmount = event.type === 'funding.withdrawal' || isTransfer
      ? -Math.abs(Number(event.amount || 0))
      : Math.abs(Number(event.amount || 0));

    const fallbackTitle = isTransfer
      ? `Transfer: ${source} to ${String(event.metadata?.toApp || '').toUpperCase() || 'another app'}`
      : event.type.replace('.', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

    return {
      id: event.id,
      source,
      app: event.app,
      type: event.type,
      title: String(event.metadata?.description || fallbackTitle),
      date: new Date(event.timestamp).toLocaleString(),
      timestamp: new Date(event.timestamp).getTime(),
      amount: Number.isFinite(signedAmount) ? signedAmount : 0,
    };
  });

  const now = Date.now();
  const activityDateCutoff = activityDateRange === '7d'
    ? now - (7 * 24 * 60 * 60 * 1000)
    : activityDateRange === '30d'
      ? now - (30 * 24 * 60 * 60 * 1000)
      : activityDateRange === '90d'
        ? now - (90 * 24 * 60 * 60 * 1000)
        : 0;

  const filteredActivityFeed = activityFeed
    .filter((activity) => {
      if (activityAppFilter !== 'all' && activity.app !== activityAppFilter) return false;

      if (activityTypeFilter !== 'all') {
        const eventType = String(activity.type || '').toLowerCase();
        if (activityTypeFilter === 'other') {
          const known = eventType.startsWith('transfer.') || eventType.startsWith('funding.') || eventType.startsWith('trade.');
          if (known) return false;
        } else if (!eventType.startsWith(`${activityTypeFilter}.`)) {
          return false;
        }
      }

      if (activityDateCutoff > 0 && Number.isFinite(activity.timestamp) && activity.timestamp < activityDateCutoff) {
        return false;
      }

      const search = activitySearch.trim().toLowerCase();
      if (!search) return true;
      const haystack = `${activity.source} ${activity.title} ${activity.type}`.toLowerCase();
      return haystack.includes(search);
    })
    .slice(0, 50);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="sticky top-3 z-30 flex items-center justify-between gap-4 mb-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-md border border-white/50 dark:border-slate-700/60">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-white shadow-lg flex items-center justify-center overflow-hidden">
              <Image src="/images/suite.jpeg" alt="Aura Finance" width={56} height={56} className="object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-magenta to-accent bg-clip-text text-transparent">
                {getTimeGreeting()}, {firstName} 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
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
            <UserProfileMenu userName={session.user?.name ?? undefined} userEmail={session.user?.email ?? undefined} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Net Worth */}
          <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Net Worth</h3>
              {!isLoading && liveNetWorth > 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendChangePercent >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                  {trendChangePercent >= 0 ? '↑' : '↓'} {Math.abs(trendChangePercent).toFixed(1)}%
                </span>
              )}
            </div>
            {isLoading ? <div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" /> : <p className="text-3xl font-bold text-accent mb-1">{formatCurrency(dispNetWorth)}</p>}
            <p className="text-xs text-muted-foreground">{selectedRange} performance</p>
          </div>

          {/* AuraBank */}
          <div className="bg-gradient-to-br from-white to-pink-50/40 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">AuraBank</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${effectiveBankBalance > 0 ? 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                {isLoading ? '…' : effectiveBankBalance > 0 ? '● Live' : '● Empty'}
              </span>
            </div>
            {isLoading ? <div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" /> : <p className="text-3xl font-bold text-aurabank-magenta mb-1">{formatCurrency(dispBank)}</p>}
            <p className="text-xs text-muted-foreground">
              {isDemoUser ? `Spend: ${formatCurrency(bankInsights.monthlySpending)}/mo` : effectiveBankBalance > 0 ? 'Checking & savings' : 'Open AuraBank to deposit'}
            </p>
          </div>

          {/* AuraVest */}
          <div className="bg-gradient-to-br from-white to-red-50/40 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">AuraVest</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${effectiveVestValue > 0 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                {isLoading ? '…' : effectiveVestValue > 0 ? `↑ Top: ${topHoldings[0]?.symbol ?? '—'}` : '● Empty'}
              </span>
            </div>
            {isLoading ? <div className="h-9 w-24 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" /> : <p className="text-3xl font-bold text-auravest-crimson mb-1">{formatCurrency(dispVest)}</p>}
            <p className="text-xs text-muted-foreground">
              {effectiveVestValue > 0 ? `${topHoldings.length} holding${topHoldings.length !== 1 ? 's' : ''}` : 'Start investing in AuraVest'}
            </p>
          </div>

          {/* AuraWallet */}
          <div className="bg-gradient-to-br from-white via-green-50/60 to-emerald-100/70 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">AuraWallet</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${effectiveWalletBalance > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                {isLoading ? '…' : effectiveWalletBalance > 0 ? '● Live' : '● Empty'}
              </span>
            </div>
            {isLoading ? <div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" /> : <p className="text-3xl font-bold text-accent mb-1">{formatCurrency(dispWallet)}</p>}
            <p className="text-xs text-muted-foreground">
              {unifiedLedgerEvents.length > 0 ? `Last: ${unifiedLedgerEvents[0]?.metadata?.description ?? unifiedLedgerEvents[0]?.type}` : 'No recent activity'}
            </p>
          </div>
        </div>

        {/* New user onboarding */}
        {isNewUser && (
          <div className="mb-8 bg-gradient-to-r from-primary/5 via-magenta/5 to-accent/5 border border-primary/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-magenta flex items-center justify-center">
                <span className="text-white text-lg">🚀</span>
              </div>
              <div>
                <h2 className="font-bold text-lg">Welcome to Aura Finance, {firstName}!</h2>
                <p className="text-sm text-muted-foreground">Complete these steps to get started</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <button onClick={() => openLauncherApp('bank')} className="group text-left p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-aurabank-magenta to-aurabank-cyan flex items-center justify-center text-white font-bold text-sm">1</div>
                  <span className="font-semibold text-sm">Open AuraBank</span>
                </div>
                <p className="text-xs text-muted-foreground">Set up your checking account and make your first deposit</p>
                <p className="text-xs text-primary font-medium mt-2 group-hover:underline">Open AuraBank →</p>
              </button>
              <button onClick={() => openLauncherApp('wallet')} className="group text-left p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">2</div>
                  <span className="font-semibold text-sm">Connect AuraWallet</span>
                </div>
                <p className="text-xs text-muted-foreground">Fund your wallet to send and receive money instantly</p>
                <p className="text-xs text-primary font-medium mt-2 group-hover:underline">Open AuraWallet →</p>
              </button>
              <button onClick={() => openLauncherApp('vest')} className="group text-left p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-auravest-black to-auravest-crimson flex items-center justify-center text-white font-bold text-sm">3</div>
                  <span className="font-semibold text-sm">Start Investing</span>
                </div>
                <p className="text-xs text-muted-foreground">Buy stocks, crypto, and more with AuraVest</p>
                <p className="text-xs text-primary font-medium mt-2 group-hover:underline">Open AuraVest →</p>
              </button>
            </div>
          </div>
        )}

        {/* Portfolio Allocation */}
        <div className="mb-8 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut SVG */}
            <div className="relative flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
                {allocTotal === 0 ? (
                  <circle cx="50" cy="50" r={donutR} fill="none" stroke="#e2e8f0" strokeWidth="16" />
                ) : (
                  <>
                    {/* Bank — pink/magenta */}
                    <circle cx="50" cy="50" r={donutR} fill="none" stroke="#D91E78" strokeWidth="16"
                      strokeDasharray={`${bankDash} ${donutCirc}`}
                      strokeDashoffset={0} />
                    {/* Vest — crimson */}
                    <circle cx="50" cy="50" r={donutR} fill="none" stroke="#DC2626" strokeWidth="16"
                      strokeDasharray={`${vestDash} ${donutCirc}`}
                      strokeDashoffset={-bankDash} />
                    {/* Wallet — emerald */}
                    <circle cx="50" cy="50" r={donutR} fill="none" stroke="#10b981" strokeWidth="16"
                      strokeDasharray={`${walletDash} ${donutCirc}`}
                      strokeDashoffset={-(bankDash + vestDash)} />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-semibold text-muted-foreground leading-tight">Total</span>
                <span className="text-xs font-bold leading-tight">{formatCurrency(liveNetWorth, 0)}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full">
              <p className="text-sm font-semibold mb-3">Portfolio Allocation</p>
              <div className="space-y-2">
                {[
                  { label: 'AuraBank', value: effectiveBankBalance, pct: bankAlloc, color: 'bg-aurabank-magenta' },
                  { label: 'AuraVest', value: effectiveVestValue, pct: vestAlloc, color: 'bg-red-600' },
                  { label: 'AuraWallet', value: effectiveWalletBalance, pct: walletAlloc, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.color}`} />
                    <span className="text-xs text-muted-foreground w-20">{item.label}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-12 text-right">{item.pct.toFixed(1)}%</span>
                    <span className="text-xs text-muted-foreground w-24 text-right">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sync status */}
            <div className="flex-shrink-0 text-center">
              <div className={`text-xs px-3 py-1.5 rounded-full font-semibold ${unifiedReplaySnapshot ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                {unifiedReplaySnapshot ? '● Live' : '○ Syncing'}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {unifiedReplaySnapshot?.lastEventAt
                  ? new Date(unifiedReplaySnapshot.lastEventAt).toLocaleTimeString()
                  : 'No events yet'}
              </p>
            </div>
          </div>
        </div>


        {/* ── Quick Transfer ──────────────────────────────────────────── */}
        <div className="mb-10 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-slate-800 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-magenta flex items-center justify-center">
              <span className="text-white text-base">⇄</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">Quick Transfer</h3>
              <p className="text-xs text-muted-foreground">Move funds instantly between your Aura apps</p>
            </div>
          </div>
          {(() => {
            const transferApps = [
              { value: 'bank' as const, label: 'AuraBank', Icon: Landmark, color: 'text-aurabank-magenta', logo: '/images/bank.jpg', ring: 'ring-pink-400/40', glow: 'bg-pink-500/20' },
              { value: 'wallet' as const, label: 'AuraWallet', Icon: Wallet, color: 'text-emerald-600', logo: '/images/wallet.jpg', ring: 'ring-emerald-400/40', glow: 'bg-emerald-500/20' },
              { value: 'vest' as const, label: 'AuraVest', Icon: TrendingUp, color: 'text-auravest-crimson', logo: '/images/vest.jpeg', ring: 'ring-red-400/40', glow: 'bg-red-500/20' },
            ];
            return (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4 items-end">
                  {/* From selector */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">From</label>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                      {transferApps.map(({ value, label, color, logo, ring, glow }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTransferFrom(value)}
                          className={`group/ta flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg text-xs font-medium transition-all ${
                            transferFrom === value
                              ? 'bg-white dark:bg-slate-700 shadow-sm ' + color
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span className={`relative flex items-center justify-center w-7 h-7 rounded-full bg-white overflow-hidden ring-2 ${ring} transition-transform duration-300 group-hover/ta:-translate-y-0.5`}>
                            <span className={`absolute inset-0 rounded-full ${glow} blur-md opacity-0 group-hover/ta:opacity-100 transition-opacity`} />
                            <img src={logo} alt={label} className="relative w-full h-full object-cover" />
                          </span>
                          <span className="leading-none">{label.replace('Aura', '')}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Arrow + To selector */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">To</label>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                      {transferApps.map(({ value, label, color, logo, ring, glow }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTransferTo(value)}
                          className={`group/ta flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg text-xs font-medium transition-all ${
                            transferTo === value
                              ? 'bg-white dark:bg-slate-700 shadow-sm ' + color
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span className={`relative flex items-center justify-center w-7 h-7 rounded-full bg-white overflow-hidden ring-2 ${ring} transition-transform duration-300 group-hover/ta:-translate-y-0.5`}>
                            <span className={`absolute inset-0 rounded-full ${glow} blur-md opacity-0 group-hover/ta:opacity-100 transition-opacity`} />
                            <img src={logo} alt={label} className="relative w-full h-full object-cover" />
                          </span>
                          <span className="leading-none">{label.replace('Aura', '')}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount + Submit */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-2">Amount (USD)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="pt-5">
                      <Button
                        onClick={handleQuickTransfer}
                        disabled={transferring}
                        className="bg-gradient-to-r from-primary to-magenta hover:opacity-90 text-white rounded-xl h-10 px-4"
                      >
                        {transferring ? '…' : <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Route preview */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {(() => {
                    const from = transferApps.find(a => a.value === transferFrom)!;
                    const to = transferApps.find(a => a.value === transferTo)!;
                    return (
                      <>
                        <span className={`relative flex items-center justify-center w-5 h-5 rounded-full bg-white overflow-hidden ring-1 ${from.ring}`}>
                          <img src={from.logo} alt={from.label} className="w-full h-full object-cover" />
                        </span>
                        <span className={from.color}>{from.label}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className={`relative flex items-center justify-center w-5 h-5 rounded-full bg-white overflow-hidden ring-1 ${to.ring}`}>
                          <img src={to.logo} alt={to.label} className="w-full h-full object-cover" />
                        </span>
                        <span className={to.color}>{to.label}</span>
                        {transferAmount && Number(transferAmount) > 0 && (
                          <span className="ml-1 font-semibold text-foreground">· {formatCurrency(Number(transferAmount))}</span>
                        )}
                      </>
                    );
                  })()}
                </div>

                {transferMsg && (
                  <p className={`text-sm font-semibold px-3 py-2 rounded-lg ${transferMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-destructive dark:bg-red-500/10'}`}>
                    {transferMsg.text}
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <button type="button" onClick={() => openLauncherApp('bank')} className="block group text-left w-full">
            <div className="bg-gradient-to-br from-aurabank-magenta to-aurabank-cyan text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  <Image src="/images/bank.jpg" alt="AuraBank" width={48} height={48} className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold">AuraBank</h3>
              </div>
              <div className="mb-3">
                {isLoading
                  ? <div className="h-8 w-32 rounded bg-white/20 animate-pulse" />
                  : <p className="text-3xl font-extrabold">{formatCurrency(dispBank)}</p>
                }
                <p className="text-white/70 text-xs mt-0.5">Total balance</p>
              </div>
              <p className="text-white/80 text-sm flex items-center gap-1">Manage accounts <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition-transform" /></p>
            </div>
          </button>
          <button type="button" onClick={() => openLauncherApp('vest')} className="block group text-left w-full">
            <div className="bg-gradient-to-br from-auravest-black to-auravest-crimson text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  <Image src="/images/vest.jpeg" alt="AuraVest" width={48} height={48} className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold">AuraVest</h3>
              </div>
              <div className="mb-3">
                {isLoading
                  ? <div className="h-8 w-28 rounded bg-white/20 animate-pulse" />
                  : <p className="text-3xl font-extrabold">{formatCurrency(dispVest)}</p>
                }
                <p className="text-white/70 text-xs mt-0.5">Portfolio value</p>
              </div>
              <p className="text-white/80 text-sm flex items-center gap-1">Trade & invest <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition-transform" /></p>
            </div>
          </button>
          <button type="button" onClick={() => openLauncherApp('wallet')} className="block group text-left w-full">
            <div className="bg-gradient-to-br from-emerald-400 via-green-600 to-black text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  <Image src="/images/wallet.jpg" alt="AuraWallet" width={48} height={48} className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold">AuraWallet</h3>
              </div>
              <div className="mb-3">
                {isLoading
                  ? <div className="h-8 w-28 rounded bg-white/20 animate-pulse" />
                  : <p className="text-3xl font-extrabold">{formatCurrency(dispWallet)}</p>
                }
                <p className="text-white/70 text-xs mt-0.5">Wallet balance</p>
              </div>
              <p className="text-white/80 text-sm flex items-center gap-1">Send & receive <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition-transform" /></p>
            </div>
          </button>
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
            {/* Hover tooltip */}
            {chartHover !== null && chartPoints[chartHover.index] && (
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl font-bold text-primary">{formatCurrency(chartPoints[chartHover.index].value)}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${chartHover.index > 0 && chartPoints[chartHover.index].value >= chartPoints[chartHover.index - 1].value ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  Point {chartHover.index + 1} of {chartPoints.length}
                </span>
              </div>
            )}
            <div className="relative h-64 rounded-xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900/40 overflow-hidden border border-slate-100 dark:border-slate-700/50">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between py-3 px-2 pointer-events-none">
                {[trendMax, (trendMax + trendMin) / 2, trendMin].map((v, i) => (
                  <span key={i} className="text-[9px] text-muted-foreground/70 text-right block">{formatCurrency(v, 0)}</span>
                ))}
              </div>
              <svg
                ref={chartSvgRef}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full pl-16 cursor-crosshair"
                onMouseMove={handleChartMouseMove}
                onMouseLeave={() => setChartHover(null)}
              >
                <defs>
                  <linearGradient id="nwLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="#D91E78" />
                  </linearGradient>
                  <linearGradient id="nwArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Grid lines */}
                {[20, 40, 60, 80].map((line) => (
                  <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="currentColor" strokeOpacity="0.07" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                ))}

                {/* Area fill */}
                {areaPath && <path d={areaPath} fill="url(#nwArea)" />}

                {/* Smooth line */}
                {linePath && (
                  <path d={linePath} fill="none" stroke="url(#nwLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" filter="url(#glow)" />
                )}

                {/* Hover crosshair */}
                {chartHover !== null && chartPoints[chartHover.index] && (
                  <>
                    <line
                      x1={chartPoints[chartHover.index].x} y1="0"
                      x2={chartPoints[chartHover.index].x} y2="100"
                      stroke="hsl(var(--primary))" strokeOpacity="0.4" strokeWidth="0.8"
                      strokeDasharray="2 2" vectorEffect="non-scaling-stroke"
                    />
                    <circle cx={chartPoints[chartHover.index].x} cy={chartPoints[chartHover.index].y} r="2.5"
                      fill="white" stroke="hsl(var(--primary))" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
                    />
                    <circle cx={chartPoints[chartHover.index].x} cy={chartPoints[chartHover.index].y} r="5"
                      fill="hsl(var(--primary))" fillOpacity="0.15" vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
              </svg>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground text-xs">
                  {chartHover !== null ? 'Hover value' : 'Current net worth'}
                </span>
                <p className="font-bold text-lg text-primary">
                  {chartHover !== null && chartPoints[chartHover.index]
                    ? formatCurrency(chartPoints[chartHover.index].value)
                    : formatCurrency(dispNetWorth)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground text-xs">{selectedRange} change</span>
                <p className={`font-bold text-lg ${trendChangePercent >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {trendChangePercent >= 0 ? '+' : ''}{trendChangePercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-gradient-to-br from-primary/10 to-magenta/10 blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-5">
              <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/80 border-r-magenta/40 group-hover:animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-[3px] rounded-full bg-white overflow-hidden ring-1 ring-primary/10">
                  <Image src="/images/ai.jpg" alt="AuraAI" width={44} height={44} className="w-full h-full object-cover" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900 shadow-[0_0_6px_rgba(52,211,153,0.85)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold">AuraAI Insights</h3>
                <p className="text-xs text-muted-foreground">Personalized analysis · updated live</p>
              </div>
            </div>
            <ul className="relative space-y-3 text-sm text-muted-foreground">
              {[
                {
                  icon: TrendingUp,
                  bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
                  text: `Net worth: ${formatCurrency(liveNetWorth)} across all accounts.`,
                },
                {
                  icon: PieChart,
                  bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
                  text: `Bank: ${formatCurrency(effectiveBankBalance)} · Vest: ${formatCurrency(effectiveVestValue)} · Wallet: ${formatCurrency(effectiveWalletBalance)}`,
                },
                {
                  icon: Sparkles,
                  bg: 'bg-magenta/10 text-magenta',
                  text: 'Ask AuraAI (bottom right) for personalized advice.',
                },
              ].map((insight, idx) => {
                const Icon = insight.icon;
                return (
                  <li
                    key={idx}
                    className="group/i relative flex items-start gap-3 p-3 rounded-xl overflow-hidden bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-800 dark:to-slate-700 hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-700 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-600/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                    style={{ animationDelay: `${idx * 90}ms`, animationDuration: '350ms' }}
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover/i:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                    <div className={`relative mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.bg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="relative leading-relaxed">{insight.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mb-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/80 border-r-magenta/40 animate-spin" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-primary/15 to-magenta/15 text-primary flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold">Unified Activity Feed</h3>
              <p className="text-xs text-muted-foreground">{filteredActivityFeed.length} event{filteredActivityFeed.length === 1 ? '' : 's'} • AuraBank • AuraVest • AuraWallet</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            {/* App pill tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {([['all','All'], ['bank','Bank'], ['vest','Vest'], ['wallet','Wallet']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setActivityAppFilter(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activityAppFilter === v ? 'bg-gradient-to-r from-primary to-magenta text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                  {label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                {([['all','All time'], ['7d','7d'], ['30d','30d'], ['90d','90d']] as const).map(([v, label]) => (
                  <button key={v} onClick={() => setActivityDateRange(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activityDateRange === v ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Type + search row */}
            <div className="flex items-center gap-2 flex-wrap">
              {([['all','All types'], ['transfer','Transfers'], ['funding','Funding'], ['trade','Trades']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setActivityTypeFilter(v)}
                  className={`px-3 py-1 rounded-full text-xs transition-all border ${activityTypeFilter === v ? 'border-primary text-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-slate-300'}`}>
                  {label}
                </button>
              ))}
              <div className="ml-auto">
                <input value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Search…"
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary w-36" />
              </div>
            </div>
          </div>
          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
            {filteredActivityFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No activity available yet.</p>
            ) : (
              filteredActivityFeed.map((activity, idx) => {
                const appMeta = activity.app === 'bank'
                  ? { logo: '/images/bank.jpg', ring: 'ring-pink-400/40', glow: 'bg-pink-500/20', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300' }
                  : activity.app === 'vest'
                    ? { logo: '/images/vest.jpeg', ring: 'ring-red-400/40', glow: 'bg-red-500/20', badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' }
                    : { logo: '/images/wallet.jpg', ring: 'ring-emerald-400/40', glow: 'bg-emerald-500/20', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' };

                return (
                  <div
                    key={activity.id}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/70 dark:from-slate-800 dark:to-slate-700 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                    style={{ animationDelay: `${Math.min(idx, 12) * 40}ms`, animationDuration: '300ms' }}
                  >
                    <span className={`relative flex items-center justify-center w-11 h-11 rounded-2xl bg-white overflow-hidden ring-2 ${appMeta.ring} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                      <span className={`absolute inset-0 rounded-2xl ${appMeta.glow} blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      <img src={appMeta.logo} alt={activity.source} className="relative w-full h-full object-cover" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${appMeta.badge}`}>
                          {activity.source}
                        </span>
                        <span className="text-xs text-muted-foreground">{activity.date}</span>
                      </div>
                      <p className="font-semibold text-sm truncate">{activity.title}</p>
                    </div>
                    {typeof activity.amount === 'number' ? (
                      <span className={`font-bold flex-shrink-0 ${activity.amount >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {activity.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(activity.amount))}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground flex-shrink-0">Insight</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          <div className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-3 mb-5">
              <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/80 border-r-magenta/40 group-hover:animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-primary/15 to-magenta/15 text-primary flex items-center justify-center">
                  <PieChart className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold">Spending Breakdown</h3>
                <p className="text-xs text-muted-foreground">By category, this period</p>
              </div>
            </div>
            {spendingCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No spending data yet. Transactions will appear here once you start using AuraBank.</p>
            ) : (
              <div className="relative space-y-3">
                {spendingCategories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-700 hover:from-slate-100 hover:to-blue-50 dark:hover:from-slate-700 dark:hover:to-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-sm animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                    style={{ animationDelay: `${idx * 70}ms`, animationDuration: '350ms' }}
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cat.color} shadow-[0_0_6px_rgba(0,0,0,0.25)]`} />
                        {cat.name}
                      </span>
                      <span className="font-bold">{formatCurrency(cat.amount, 0)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`relative h-2 rounded-full ${cat.color} shadow-sm overflow-hidden transition-all duration-700`}
                        style={{ width: `${(cat.amount / totalSpending) * 100}%` }}
                      >
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      </div>
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
            )}
          </div>
          <div className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow overflow-hidden">
            <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-emerald-400/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-red-400/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-3 mb-5">
              <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/80 border-r-magenta/40 group-hover:animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-primary/15 to-magenta/15 text-primary flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold">Cash Flow</h3>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
            </div>
            {!isDemoUser && monthlyIncome === 0 && monthlyExpenses === 0 ? (
              <p className="text-sm text-muted-foreground">No cash flow data yet. Your income and expense summary will appear here.</p>
            ) : (
              (() => {
                const totalFlow = monthlyIncome + monthlyExpenses;
                const inflowShare = totalFlow > 0 ? (monthlyIncome / totalFlow) * 100 : 50;
                return (
                  <div className="relative flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative flex-shrink-0" style={{ width: 128, height: 128 }}>
                      <div
                        className="absolute inset-0 rounded-full transition-all duration-700"
                        style={{ background: `conic-gradient(#4ade80 0% ${inflowShare}%, #f87171 ${inflowShare}% 100%)` }}
                      />
                      <div className="absolute inset-[10px] rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center shadow-inner">
                        <span className="text-[10px] text-muted-foreground font-medium">Net</span>
                        <span className={`text-base font-bold ${cashFlow >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {cashFlow >= 0 ? '+' : '-'}{formatCurrency(Math.abs(cashFlow), 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 w-full space-y-2.5">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-teal-50 to-green-50 dark:from-slate-800 dark:to-slate-700 border border-teal-100 dark:border-slate-700 animate-in fade-in slide-in-from-right-2 fill-mode-both" style={{ animationDelay: '60ms' }}>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
                        <span className="text-sm font-semibold flex-1">Income</span>
                        <span className="text-base font-bold text-accent">+{formatCurrency(monthlyIncome)}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 border border-red-100 dark:border-slate-700 animate-in fade-in slide-in-from-right-2 fill-mode-both" style={{ animationDelay: '120ms' }}>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]" />
                        <span className="text-sm font-semibold flex-1">Expenses</span>
                        <span className="text-base font-bold text-destructive">-{formatCurrency(monthlyExpenses)}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-2 border-primary animate-in fade-in slide-in-from-right-2 fill-mode-both" style={{ animationDelay: '180ms' }}>
                        <span className={`w-2.5 h-2.5 rounded-full ${cashFlow >= 0 ? 'bg-accent shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.7)]'}`} />
                        <span className="text-sm font-bold flex-1">Net Cash Flow</span>
                        <span className={`text-lg font-bold ${cashFlow >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {cashFlow >= 0 ? '+' : '-'}{formatCurrency(Math.abs(cashFlow))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400/80 border-r-amber-400/30 group-hover:animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-[3px] rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold">Upcoming Bills</h3>
                <p className="text-xs text-muted-foreground">{upcomingBills.length} pending payment{upcomingBills.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            {upcomingBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming bills. Bills set in AuraBank will appear here.</p>
            ) : (
              <div className="space-y-3">
                {upcomingBills.map((bill, idx) => (
                  <div
                    key={idx}
                    className="group/bill flex items-center gap-3 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-500/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                    style={{ animationDelay: `${idx * 70}ms`, animationDuration: '350ms' }}
                  >
                    <div className="relative flex-shrink-0 transition-transform duration-300 group-hover/bill:-translate-y-0.5" style={{ width: 38, height: 38 }}>
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400/70 border-r-amber-400/20 group-hover/bill:animate-spin" style={{ animationDuration: '2.5s' }} />
                      <div className="absolute inset-[2.5px] rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">Due {bill.dueDate}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg">{formatCurrency(bill.amount)}</p>
                      <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-500/20 dark:to-amber-500/20 text-yellow-900 dark:text-yellow-200 font-medium shadow-[0_0_10px_rgba(251,191,36,0.25)]">Pending</span>
                    </div>
                  </div>
                ))}
                <Button className="w-full mt-3 bg-gradient-to-r from-primary to-magenta hover:opacity-90 group/btn relative overflow-hidden" size="sm">
                  <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  <span className="relative">View All Bills</span>
                </Button>
              </div>
            )}
          </div>
          <div className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400/80 border-r-emerald-400/30 group-hover:animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-[3px] rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold">Goals</h3>
                <p className="text-xs text-muted-foreground">Track your savings milestones</p>
              </div>
            </div>
            {!isDemoUser ? (
              <p className="text-sm text-muted-foreground">No goals set yet. Start by making your first deposit.</p>
            ) : (
              <div className="space-y-4">
                {([
                  { label: 'Emergency Fund', current: '$3,200', target: '$10,000', pct: 32, from: 'from-teal-50', to: 'to-green-50', bar: 'from-accent to-teal', glow: 'rgba(45,212,191,0.6)' },
                  { label: 'Investing Goal', current: '$6,500', target: '$15,000', pct: 43, from: 'from-purple-50', to: 'to-pink-50', bar: 'from-magenta to-purple-500', glow: 'rgba(192,38,211,0.6)' },
                  { label: 'Vacation Fund', current: '$900', target: '$2,500', pct: 36, from: 'from-blue-50', to: 'to-indigo-50', bar: 'from-primary to-blue-500', glow: 'rgba(59,130,246,0.6)' },
                ] as const).map((goal, idx) => (
                  <div
                    key={goal.label}
                    className={`p-3 rounded-lg bg-gradient-to-r ${goal.from} ${goal.to} dark:from-slate-800 dark:to-slate-700 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both`}
                    style={{ animationDelay: `${idx * 90}ms`, animationDuration: '350ms' }}
                  >
                    <div className="flex items-center justify-between text-sm mb-2 font-medium">
                      <span>{goal.label}</span>
                      <span className="font-bold">{goal.current} / {goal.target}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white dark:bg-slate-700 shadow-inner overflow-hidden">
                      <div
                        className={`relative h-3 rounded-full bg-gradient-to-r ${goal.bar} shadow-sm overflow-hidden transition-all duration-700`}
                        style={{ width: `${goal.pct}%`, boxShadow: `0 0 10px ${goal.glow}` }}
                      >
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-magenta/80 border-r-purple-400/40 group-hover:animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-[3px] rounded-full bg-magenta/10 text-magenta flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold">Top Holdings</h3>
                <p className="text-xs text-muted-foreground">{topHoldings.length > 0 ? `${topHoldings.length} position${topHoldings.length === 1 ? '' : 's'} • AuraVest` : 'AuraVest portfolio'}</p>
              </div>
            </div>
            <div className="space-y-3">
              {topHoldings.length === 0 && (
                <p className="text-sm text-muted-foreground">No holdings yet.</p>
              )}
              {(() => {
                const maxValue = Math.max(...topHoldings.map((h) => h.value), 1);
                const rankAccents = [
                  { ring: 'border-t-magenta/80 border-r-purple-400/40', bg: 'bg-magenta/10 text-magenta', bar: 'from-magenta to-purple-500', glow: 'rgba(192,38,211,0.55)' },
                  { ring: 'border-t-blue-400/80 border-r-indigo-400/40', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-300', bar: 'from-primary to-blue-500', glow: 'rgba(59,130,246,0.55)' },
                  { ring: 'border-t-emerald-400/80 border-r-teal-400/40', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300', bar: 'from-accent to-teal', glow: 'rgba(45,212,191,0.55)' },
                ];
                return topHoldings.map((holding, idx) => {
                  const accent = rankAccents[idx % rankAccents.length];
                  const sharePct = Math.max(8, Math.round((holding.value / maxValue) * 100));
                  const logoUrl = getHoldingLogoUrl(holding.symbol);
                  return (
                    <div
                      key={holding.id}
                      className="group/h p-4 rounded-xl bg-gradient-to-r from-slate-50 to-purple-50/30 dark:from-slate-800 dark:to-slate-700 hover:from-slate-100 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                      style={{ animationDelay: `${idx * 80}ms`, animationDuration: '350ms' }}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0 transition-transform duration-300 group-hover/h:-translate-y-0.5" style={{ width: 38, height: 38 }}>
                            <div className={`absolute inset-0 rounded-full border-2 border-transparent ${accent.ring} group-hover/h:animate-spin`} style={{ animationDuration: '2.5s' }} />
                            <div className={`absolute inset-[2.5px] rounded-full overflow-hidden flex items-center justify-center font-bold text-sm ${logoUrl ? 'bg-white' : accent.bg}`}>
                              {logoUrl ? (
                                <img src={logoUrl} alt={holding.symbol} className="w-full h-full object-contain p-1.5" />
                              ) : (
                                holding.symbol.charAt(0)
                              )}
                            </div>
                            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-[9px] font-bold ${accent.bg}`}>
                              {idx + 1}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-lg truncate">{holding.symbol}</p>
                            <p className="text-xs text-muted-foreground">{holding.shares} shares</p>
                          </div>
                        </div>
                        <p className="font-bold text-xl text-magenta flex-shrink-0">{formatCurrency(holding.value)}</p>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-600/50 overflow-hidden">
                        <div
                          className={`relative h-1.5 rounded-full bg-gradient-to-r ${accent.bar} overflow-hidden transition-all duration-700`}
                          style={{ width: `${sharePct}%`, boxShadow: `0 0 8px ${accent.glow}` }}
                        >
                          <span className="absolute inset-0 -translate-x-full group-hover/h:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      <AuraAIChat />

      {transferSuccessModal && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
          onClick={() => setTransferSuccessModal(null)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl dark:border-slate-700/80 dark:bg-slate-900/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-primary/15 blur-2xl" />
            <div className="pointer-events-none absolute -left-14 -bottom-20 h-40 w-40 rounded-full bg-magenta/20 blur-2xl" />

            <div className="relative">
              <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Transfer Completed
              </div>

              <div className="mt-4 flex items-start gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary text-2xl font-bold text-white shadow-lg shadow-accent/30">
                  ✓
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-foreground">Success</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your transfer has been processed and synced across the suite.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-purple-50/40 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount Sent</p>
                <p className="mt-1 text-3xl font-black text-foreground">{formatCurrency(transferSuccessModal.amount)}</p>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Route</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground dark:bg-slate-900">
                    {appLabel(transferSuccessModal.from)} {' -> '} {appLabel(transferSuccessModal.to)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-semibold text-foreground">{new Date(transferSuccessModal.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs text-foreground">{transferSuccessModal.reference}</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setTransferSuccessModal(null)}
                  className="w-full bg-gradient-to-r from-primary to-magenta py-2.5 text-white shadow-lg shadow-primary/30 hover:opacity-95"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
