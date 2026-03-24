'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getBankInsights, getOverallInsights, getVestInsights, getWalletInsights } from 'lib/shared/auraai-core';
import { getUser } from 'lib/shared/mock-data';
import Image from 'next/image';
import AuraAIChat from '@/components/AuraAIChat';
import UserProfileMenu from '@/components/UserProfileMenu';
import { AlertTriangle, BellRing, Info, Moon, Sun } from 'lucide-react';
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
  const [showTransferPanel, setShowTransferPanel] = useState(false);
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

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('aurafinance_dark_mode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
    void persistFinanceStateToServer(sessionUserId);
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return null;

  const userId = sessionUserId ? parseInt(sessionUserId, 10) : 1;
  const user = getUser(userId);
  const insights = getOverallInsights(userId);
  const bankInsights = getBankInsights(userId);
  const vestInsights = getVestInsights(userId);
  const walletInsights = getWalletInsights(userId);

  const baseBankBalance = bankBalanceValue ?? bankInsights.totalBalance;
  const baseVestValue = vestPortfolioValue ?? vestInsights.totalValue;
  const baseWalletBalance = walletBalanceValue ?? walletInsights.balance;

  const effectiveBankBalance = Number(baseBankBalance.toFixed(2));
  const effectiveVestValue = Number(baseVestValue.toFixed(2));
  const effectiveWalletBalance = Number(baseWalletBalance.toFixed(2));
  const liveNetWorth = effectiveBankBalance + effectiveVestValue + effectiveWalletBalance;

  const recentTransactions = user?.bank?.transactions?.slice(-5).reverse() ?? [];
  const mockHoldings = (user?.vest?.portfolio ?? []).map((holding, index: number) => {
    const row = (holding && typeof holding === 'object') ? (holding as Record<string, unknown>) : {};
    return {
      id: String(row.id || `mock-holding-${index}`),
      symbol: String(row.symbol || 'N/A'),
      shares: Number(row.shares || 0),
      value: Number(row.value || 0),
    };
  });
  const topHoldings = (vestHoldings.length > 0 ? vestHoldings : mockHoldings).slice(0, 3);

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

  const buildAppUrl = (port: number, path = '') => {
    if (typeof window === 'undefined') return `http://localhost:${port}${path}`;
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:${port}${path}`;
  };

  const openAuraWalletTransfer = () => {
    window.open(buildAppUrl(3003), '_blank', 'noopener,noreferrer');
  };

  const openAuraVestInvest = () => {
    window.open(buildAppUrl(3002, '/dashboard'), '_blank', 'noopener,noreferrer');
  };

  const openLauncherApp = (app: 'bank' | 'vest' | 'wallet') => {
    const url = app === 'bank'
      ? buildAppUrl(3001)
      : app === 'vest'
        ? buildAppUrl(3002)
        : buildAppUrl(3003);
    window.open(url, '_blank', 'noopener,noreferrer');
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

  const downloadUnifiedStatement = async () => {
    const today = new Date();
    const dateStamp = today.toISOString().slice(0, 10);
    const monthlyExpenseValue = Number.isFinite(monthlyExpenses) ? monthlyExpenses : 0;

    const statementLines = [
      `Aura Finance Unified Statement - ${dateStamp}`,
      '',
      'Summary',
      `- Net Worth: ${formatCurrency(liveNetWorth)}`,
      `- AuraBank Balance: ${formatCurrency(effectiveBankBalance)}`,
      `- AuraVest Portfolio: ${formatCurrency(effectiveVestValue)}`,
      `- AuraWallet Balance: ${formatCurrency(effectiveWalletBalance)}`,
      `- Monthly Income: ${formatCurrency(monthlyIncome)}`,
      `- Monthly Expenses: ${formatCurrency(monthlyExpenseValue)}`,
      `- Monthly Net Cash Flow: ${formatCurrency(cashFlow)}`,
      '',
      'Recent AuraBank Transactions',
      ...recentTransactions.map((tx) => {
        const type = tx.amount >= 0 ? 'Credit' : 'Debit';
        return `- ${tx.date} | ${tx.description} | ${formatCurrency(tx.amount)} | ${type}`;
      }),
      '',
      'Top AuraVest Holdings',
      ...topHoldings.map((holding) => {
        const allocation = effectiveVestValue > 0 ? (holding.value / effectiveVestValue) * 100 : 0;
        return `- ${holding.symbol} | Qty ${holding.shares.toFixed(2)} | Value ${formatCurrency(holding.value)} | Allocation ${allocation.toFixed(2)}%`;
      }),
    ];

    // Build a lightweight single-page PDF statement with embedded logo.
    const escapePdfText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const maxLines = 44;
    const clippedLines = statementLines.slice(0, maxLines);
    const encoder = new TextEncoder();

    let logoBytes: Uint8Array | null = null;
    let logoWidth = 56;
    let logoHeight = 56;

    try {
      const logoResponse = await fetch('/images/suite.jpeg', { cache: 'no-store' });
      if (logoResponse.ok) {
        const logoBuffer = await logoResponse.arrayBuffer();
        logoBytes = new Uint8Array(logoBuffer);
        const logoBlob = new Blob([logoBuffer], { type: 'image/jpeg' });
        const logoBlobUrl = URL.createObjectURL(logoBlob);

        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            logoWidth = img.naturalWidth || logoWidth;
            logoHeight = img.naturalHeight || logoHeight;
            URL.revokeObjectURL(logoBlobUrl);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(logoBlobUrl);
            resolve();
          };
          img.src = logoBlobUrl;
        });
      }
    } catch (error) {
      console.error('Failed to load statement logo:', error);
      logoBytes = null;
    }

    const drawLogoCommand = logoBytes
      ? `q\n48 0 0 48 40 738 cm\n/Im1 Do\nQ\n`
      : '';

    const contentStream = `${drawLogoCommand}BT\n/F1 11 Tf\n14 TL\n${logoBytes ? '100 772 Td' : '40 790 Td'}\n${clippedLines
      .map((line, index) => `${index > 0 ? 'T*\n' : ''}(${escapePdfText(line)}) Tj`)
      .join('\n')}\nET`;

    const pdfChunks: Uint8Array[] = [];
    let pdfLength = 0;
    const pushChunk = (chunk: Uint8Array) => {
      pdfChunks.push(chunk);
      pdfLength += chunk.length;
    };

    pushChunk(encoder.encode('%PDF-1.4\n'));

    const objectOffsets: number[] = [0];
    const writeObject = (objectNumber: number, body: Uint8Array) => {
      objectOffsets[objectNumber] = pdfLength;
      pushChunk(encoder.encode(`${objectNumber} 0 obj\n`));
      pushChunk(body);
      pushChunk(encoder.encode('\nendobj\n'));
    };

    const xObjectResource = logoBytes ? '/XObject << /Im1 6 0 R >> ' : '';
    writeObject(1, encoder.encode('<< /Type /Catalog /Pages 2 0 R >>'));
    writeObject(2, encoder.encode('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    writeObject(
      3,
      encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> ${xObjectResource}>> /Contents 5 0 R >>`),
    );
    writeObject(4, encoder.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'));

    const contentBytes = encoder.encode(contentStream);
    const contentStreamPrefix = encoder.encode(`<< /Length ${contentBytes.length} >>\nstream\n`);
    const contentStreamSuffix = encoder.encode('\nendstream');
    const contentBody = new Uint8Array(contentStreamPrefix.length + contentBytes.length + contentStreamSuffix.length);
    contentBody.set(contentStreamPrefix, 0);
    contentBody.set(contentBytes, contentStreamPrefix.length);
    contentBody.set(contentStreamSuffix, contentStreamPrefix.length + contentBytes.length);
    writeObject(5, contentBody);

    if (logoBytes) {
      const imagePrefix = encoder.encode(
        `<< /Type /XObject /Subtype /Image /Width ${logoWidth} /Height ${logoHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBytes.length} >>\nstream\n`,
      );
      const imageSuffix = encoder.encode('\nendstream');
      const imageBody = new Uint8Array(imagePrefix.length + logoBytes.length + imageSuffix.length);
      imageBody.set(imagePrefix, 0);
      imageBody.set(logoBytes, imagePrefix.length);
      imageBody.set(imageSuffix, imagePrefix.length + logoBytes.length);
      writeObject(6, imageBody);
    }

    const objectCount = logoBytes ? 6 : 5;
    const xrefStart = pdfLength;
    pushChunk(encoder.encode(`xref\n0 ${objectCount + 1}\n`));
    pushChunk(encoder.encode('0000000000 65535 f \n'));
    for (let objectNumber = 1; objectNumber <= objectCount; objectNumber += 1) {
      pushChunk(encoder.encode(`${String(objectOffsets[objectNumber] || 0).padStart(10, '0')} 00000 n \n`));
    }
    pushChunk(encoder.encode(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`));

    const finalPdfBytes = new Uint8Array(pdfLength);
    let finalOffset = 0;
    for (const chunk of pdfChunks) {
      finalPdfBytes.set(chunk, finalOffset);
      finalOffset += chunk.length;
    }

    const blob = new Blob([finalPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `aura-finance-statement-${dateStamp}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

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
            <UserProfileMenu userName={session.user?.name ?? undefined} userEmail={session.user?.email ?? undefined} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Net Worth</h3>
            <p className="text-3xl font-bold text-accent mb-1">{formatCurrency(liveNetWorth)}</p>
            <p className="text-xs text-muted-foreground">Across all products</p>
          </div>
          <div className="bg-gradient-to-br from-white to-pink-50/40 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">AuraBank Balance</h3>
            <p className="text-3xl font-bold text-aurabank-magenta mb-1">{formatCurrency(effectiveBankBalance)}</p>
            <p className="text-xs text-muted-foreground">Monthly spend: {formatCurrency(bankInsights.monthlySpending)}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-red-50/40 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">AuraVest Portfolio</h3>
            <p className="text-3xl font-bold text-auravest-crimson mb-1">{formatCurrency(effectiveVestValue)}</p>
            <p className="text-xs text-muted-foreground">Top: {topHoldings[0]?.symbol ?? 'N/A'}</p>
          </div>
          <div className="bg-gradient-to-br from-white via-green-50/60 to-emerald-100/70 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-all hover:-translate-y-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">AuraWallet Balance</h3>
            <p className="text-3xl font-bold text-accent mb-1">{formatCurrency(effectiveWalletBalance)}</p>
            <p className="text-xs text-muted-foreground">Last activity: {walletInsights.insights[1]}</p>
          </div>
        </div>

        <div className="mb-8 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Unified Ledger Status</p>
              <p className="text-xs text-muted-foreground">
                Events: {unifiedReplaySnapshot?.eventCount ?? 0}
                {unifiedReplaySnapshot?.lastEventAt ? ` • Last update: ${new Date(unifiedReplaySnapshot.lastEventAt).toLocaleString()}` : ' • Waiting for events'}
              </p>
            </div>
            <div className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              {unifiedReplaySnapshot ? 'Replay Active' : 'Fallback Mode'}
            </div>
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
              <Button className="w-full bg-gradient-to-r from-accent to-teal hover:opacity-90" onClick={openAuraWalletTransfer}>Send Money with AuraWallet</Button>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={openAuraVestInvest}>Invest in AuraVest</Button>
              <Button className="w-full" variant="outline" onClick={downloadUnifiedStatement}>Download Statements</Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <button type="button" onClick={() => openLauncherApp('bank')} className="block group text-left w-full">
            <div className="bg-gradient-to-br from-aurabank-magenta to-aurabank-cyan text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  <Image src="/images/bank.jpg" alt="AuraBank" width={48} height={48} className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold">AuraBank</h3>
              </div>
              <p className="text-white/90">Manage your accounts and transactions</p>
            </div>
          </button>
          <button type="button" onClick={() => openLauncherApp('vest')} className="block group text-left w-full">
            <div className="bg-gradient-to-br from-auravest-black to-auravest-crimson text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  <Image src="/images/vest.jpeg" alt="AuraVest" width={48} height={48} className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold">AuraVest</h3>
              </div>
              <p className="text-white/90">Invest in stocks, crypto, and more</p>
            </div>
          </button>
          <button type="button" onClick={() => openLauncherApp('wallet')} className="block group text-left w-full">
            <div className="bg-gradient-to-br from-emerald-400 via-green-600 to-black text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  <Image src="/images/aurawallet-logo.jpeg" alt="AuraWallet" width={48} height={48} className="object-cover" />
                </div>
                <h3 className="text-2xl font-bold">AuraWallet</h3>
              </div>
              <p className="text-white/90">Send and receive money instantly</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              value={activitySearch}
              onChange={(event) => setActivitySearch(event.target.value)}
              placeholder="Search activity"
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
            <select
              value={activityAppFilter}
              onChange={(event) => setActivityAppFilter(event.target.value as 'all' | 'bank' | 'vest' | 'wallet')}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="all">All Apps</option>
              <option value="bank">AuraBank</option>
              <option value="vest">AuraVest</option>
              <option value="wallet">AuraWallet</option>
            </select>
            <select
              value={activityTypeFilter}
              onChange={(event) => setActivityTypeFilter(event.target.value as 'all' | 'transfer' | 'funding' | 'trade' | 'other')}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="all">All Types</option>
              <option value="transfer">Transfers</option>
              <option value="funding">Funding</option>
              <option value="trade">Trades</option>
              <option value="other">Other</option>
            </select>
            <select
              value={activityDateRange}
              onChange={(event) => setActivityDateRange(event.target.value as 'all' | '7d' | '30d' | '90d')}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <div className="space-y-3">
            {filteredActivityFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity available yet.</p>
            ) : (
              filteredActivityFeed.map((activity) => (
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

        {/* ── Quick Transfer ──────────────────────────────────────────── */}
        <div className="mb-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 dark:border-slate-700/60 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Quick Transfer</h3>
            <button
              onClick={() => setShowTransferPanel((v) => !v)}
              className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-primary to-magenta text-white font-semibold"
            >
              {showTransferPanel ? 'Hide' : 'Open'}
            </button>
          </div>
          {showTransferPanel && (
            <div className="grid sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value as 'bank' | 'wallet' | 'vest')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="bank">AuraBank</option>
                  <option value="wallet">AuraWallet</option>
                  <option value="vest">AuraVest</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value as 'bank' | 'wallet' | 'vest')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="bank">AuraBank</option>
                  <option value="wallet">AuraWallet</option>
                  <option value="vest">AuraVest</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Amount (USD)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button
                onClick={handleQuickTransfer}
                disabled={transferring}
                className="bg-gradient-to-r from-primary to-magenta hover:opacity-90 text-white"
              >
                {transferring ? 'Sending…' : 'Transfer'}
              </Button>
              {transferMsg && (
                <p className={`sm:col-span-4 text-sm font-medium ${transferMsg.type === 'ok' ? 'text-accent' : 'text-destructive'}`}>
                  {transferMsg.text}
                </p>
              )}
            </div>
          )}
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
