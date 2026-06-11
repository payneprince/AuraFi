'use client';

import { useMemo, useState } from 'react';
import { PieChart, TrendingDown, Calendar, Zap, ShoppingBag, Coffee, ArrowLeftRight, Smartphone, PlusCircle, MoreHorizontal } from 'lucide-react';
// @ts-ignore
import { walletData } from '@/lib/shared/mock-data';

// ─── category definitions (mirrors TransactionList keyword logic) ─────────────

const CIRC = 2 * Math.PI * 54; // circumference for r=54
const GAP  = 3.5;               // path units between donut segments

const CATS = [
  { key: 'food',     label: 'Food & Dining',  Icon: Coffee,        match: /coffee|restaurant|food|dining|pizza|cafe/i,    color: '#f59e0b', ring: 'border-t-amber-400/80',   bg: 'bg-amber-500/15',   text: 'text-amber-300',   dot: 'bg-amber-400',   bar: 'from-amber-500 to-amber-400'   },
  { key: 'shopping', label: 'Shopping',        Icon: ShoppingBag,   match: /grocery|store|shop|market|nike|best buy/i,    color: '#a855f7', ring: 'border-t-purple-400/80',  bg: 'bg-purple-500/15', text: 'text-purple-300', dot: 'bg-purple-400', bar: 'from-purple-500 to-purple-400' },
  { key: 'mobile',   label: 'Mobile & MoMo',   Icon: Smartphone,    match: /mobile|momo|airtel|telecel|mtn/i,             color: '#818cf8', ring: 'border-t-indigo-400/80',  bg: 'bg-indigo-500/15', text: 'text-indigo-300', dot: 'bg-indigo-400', bar: 'from-indigo-500 to-indigo-400' },
  { key: 'transfer', label: 'Transfers',        Icon: ArrowLeftRight,match: /transfer|send|wallet/i,                       color: '#38bdf8', ring: 'border-t-sky-400/80',     bg: 'bg-sky-500/15',    text: 'text-sky-300',    dot: 'bg-sky-400',    bar: 'from-sky-500 to-sky-400'       },
  { key: 'topup',    label: 'Top-ups',          Icon: PlusCircle,    match: /top ?up|add fund/i,                           color: '#34d399', ring: 'border-t-emerald-400/80', bg: 'bg-emerald-500/15',text: 'text-emerald-300',dot: 'bg-emerald-400',bar: 'from-emerald-500 to-emerald-400'},
  { key: 'other',    label: 'Other',            Icon: MoreHorizontal,match: null as RegExp | null,                         color: '#94a3b8', ring: 'border-t-slate-400/80',   bg: 'bg-slate-500/15',  text: 'text-slate-300',  dot: 'bg-slate-400',  bar: 'from-slate-500 to-slate-400'   },
] as const;

type CatKey = typeof CATS[number]['key'];

function categorize(description: string) {
  for (const cat of CATS) {
    if (cat.match && cat.match.test(description || '')) return cat;
  }
  return CATS[CATS.length - 1];
}

// ─── month helpers ────────────────────────────────────────────────────────────

interface MonthOption { label: string; year: number; month: number; key: string }

function buildMonths(txs: any[]): MonthOption[] {
  const seen = new Map<string, { year: number; month: number; ts: number }>();
  for (const t of txs) {
    const d = new Date(t.date || t.createdAt || '');
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!seen.has(key)) seen.set(key, { year: d.getFullYear(), month: d.getMonth(), ts: d.getTime() });
  }
  let entries = [...seen.values()].sort((a, b) => a.ts - b.ts);
  if (entries.length === 0) {
    const now = new Date();
    entries = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), ts: d.getTime() };
    });
  }
  const last6 = entries.slice(-6);
  return last6.map(({ year, month }) => {
    const d = new Date(year, month, 1);
    return { label: d.toLocaleString('default', { month: 'short' }), year, month, key: `${year}-${month}` };
  });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function SpendAnalytics() {
  const txs: any[] = useMemo(() => walletData.transactions || [], []);

  const months = useMemo(() => buildMonths(txs), [txs]);
  const [selKey, setSelKey] = useState<string | null>(null);
  const activeMo = months.find(m => m.key === selKey) ?? months[months.length - 1];

  // outflows in the selected month
  const monthTxs = useMemo(() =>
    txs.filter(t => {
      if (Number(t.amount) >= 0) return false;
      const d = new Date(t.date || t.createdAt || '');
      return !isNaN(d.getTime()) && d.getFullYear() === activeMo.year && d.getMonth() === activeMo.month;
    })
  , [txs, activeMo]);

  const totalSpent = useMemo(() =>
    monthTxs.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  , [monthTxs]);

  const catRows = useMemo(() => {
    const map = new Map<CatKey, { total: number; count: number }>();
    for (const cat of CATS) map.set(cat.key, { total: 0, count: 0 });
    for (const t of monthTxs) {
      const cat = categorize(t.description || '');
      const row = map.get(cat.key)!;
      row.total += Math.abs(Number(t.amount));
      row.count += 1;
    }
    return CATS
      .map(cat => ({ cat, ...map.get(cat.key)!, pct: totalSpent > 0 ? (map.get(cat.key)!.total / totalSpent) * 100 : 0 }))
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [monthTxs, totalSpent]);

  // SVG donut segments (cumulative offset)
  const donutSegs = useMemo(() => {
    let off = 0;
    return catRows.map(r => {
      const len = Math.max((r.pct / 100) * CIRC - GAP, 0);
      const seg = { ...r, len, off };
      off += (r.pct / 100) * CIRC;
      return seg;
    });
  }, [catRows]);

  // monthly totals for bar chart
  const monthlyTotals = useMemo(() =>
    months.map(m => ({
      ...m,
      total: txs
        .filter(t => {
          if (Number(t.amount) >= 0) return false;
          const d = new Date(t.date || t.createdAt || '');
          return !isNaN(d.getTime()) && d.getFullYear() === m.year && d.getMonth() === m.month;
        })
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
    }))
  , [txs, months]);

  const maxMonthly = Math.max(...monthlyTotals.map(m => m.total), 1);

  const topCat     = catRows[0] ?? null;
  const biggestTx  = monthTxs.length > 0
    ? monthTxs.reduce((a, b) => Math.abs(Number(a.amount)) >= Math.abs(Number(b.amount)) ? a : b)
    : null;

  const isEmpty = monthTxs.length === 0;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-5 bg-[#0B1E39] border border-white/10 hover:border-white/20 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both space-y-5"
      style={{ animationDelay: '200ms' }}
    >
      {/* background glows */}
      <div className="pointer-events-none absolute -top-14 -right-14 w-40 h-40 rounded-full bg-violet-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-14 w-40 h-40 rounded-full bg-amber-500/8 blur-3xl" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-3">
        <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-400/80 border-r-violet-400/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
          <div className="absolute inset-[3px] rounded-full bg-violet-500/15 text-violet-300 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-white font-bold text-xl">Spend Analytics</h3>
          <p className="text-white/60 text-xs">Breakdown of where your money goes</p>
        </div>
      </div>

      {/* ── Month tabs ─────────────────────────────────────────────────────── */}
      <div className="relative flex gap-1.5 overflow-x-auto pb-0.5" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {months.map(m => {
          const isActive = m.key === activeMo.key;
          const hasData  = monthlyTotals.find(mt => mt.key === m.key)?.total ?? 0;
          return (
            <button key={m.key} onClick={() => setSelKey(m.key)}
              className={`relative flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                  : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}>
              {m.label}{m.year !== new Date().getFullYear() ? ` '${String(m.year).slice(2)}` : ''}
              {hasData > 0 && !isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-violet-400 opacity-70" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <PieChart className="w-6 h-6 text-white/25" />
          </div>
          <p className="text-white/40 text-sm font-semibold">No spending in {activeMo.label}</p>
          <p className="text-white/25 text-xs mt-1">Make a transfer or add transactions to see your breakdown</p>
        </div>
      ) : (
        <>
          {/* ── Donut + legend ───────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center gap-6">

            {/* SVG donut */}
            <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
              <svg viewBox="0 0 120 120" width="160" height="160" style={{ overflow: 'visible' }}>
                {/* track */}
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                {/* segments */}
                {donutSegs.map((seg, i) => (
                  <circle
                    key={seg.cat.key}
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke={seg.cat.color}
                    strokeWidth="10"
                    strokeLinecap="butt"
                    strokeDasharray={`${seg.len} ${CIRC - seg.len}`}
                    strokeDashoffset={-seg.off}
                    transform="rotate(-90 60 60)"
                    style={{ transition: `stroke-dasharray 0.7s ease ${i * 80}ms, opacity 0.4s ease` }}
                  />
                ))}
              </svg>

              {/* center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-white font-black text-xl tabular-nums leading-none">${totalSpent < 1000 ? totalSpent.toFixed(2) : (totalSpent / 1000).toFixed(1) + 'k'}</span>
                <span className="text-white/40 text-[10px] mt-0.5 uppercase tracking-wider">spent</span>
              </div>
            </div>

            {/* category legend */}
            <div className="flex-1 w-full space-y-2.5">
              {catRows.map((r, i) => (
                <div
                  key={r.cat.key}
                  className="animate-in fade-in slide-in-from-right-2 fill-mode-both"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.cat.dot}`} />
                      <span className="text-white/80 text-xs font-medium truncate">{r.cat.label}</span>
                      <span className="text-white/30 text-[10px] flex-shrink-0">{r.count}×</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs font-bold tabular-nums ${r.cat.text}`}>${r.total.toFixed(2)}</span>
                      <span className="text-white/30 text-[10px] w-7 text-right tabular-nums">{r.pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${r.cat.bar} transition-all duration-700 ease-out`}
                      style={{ width: `${r.pct}%`, transitionDelay: `${i * 80}ms` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Insight callouts ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topCat && (
              <div className={`rounded-xl p-3.5 border border-white/10 ${topCat.cat.bg} flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-xl ${topCat.cat.bg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
                  <Zap className={`w-3.5 h-3.5 ${topCat.cat.text}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Top Category</p>
                  <p className={`text-sm font-bold truncate ${topCat.cat.text}`}>{topCat.cat.label}</p>
                  <p className="text-white/40 text-[10px]">${topCat.total.toFixed(2)} · {topCat.pct.toFixed(0)}% of spend</p>
                </div>
              </div>
            )}
            {biggestTx && (
              <div className="rounded-xl p-3.5 border border-red-500/20 bg-red-500/8 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Largest Transaction</p>
                  <p className="text-sm font-bold text-red-300 truncate">{biggestTx.description}</p>
                  <p className="text-white/40 text-[10px]">-${Math.abs(Number(biggestTx.amount)).toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 6-Month Trend ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-3.5 h-3.5 text-white/40" />
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">6-Month Spend Trend</p>
        </div>
        <div className="flex items-end gap-2 h-20">
          {monthlyTotals.map((m, i) => {
            const h      = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
            const isAct  = m.key === activeMo.key;
            const hasAmt = m.total > 0;
            return (
              <button
                key={m.key}
                onClick={() => setSelKey(m.key)}
                className="flex-1 flex flex-col items-center gap-1 group/bar focus:outline-none"
              >
                <span className={`text-[9px] tabular-nums font-semibold transition-colors leading-none ${isAct ? 'text-violet-300' : 'text-white/25'}`}>
                  {hasAmt ? `$${m.total < 1000 ? m.total.toFixed(0) : (m.total / 1000).toFixed(1) + 'k'}` : ''}
                </span>
                <div className="relative w-full flex-1 flex items-end overflow-hidden rounded-t-md">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                      isAct
                        ? 'bg-gradient-to-t from-violet-700 to-violet-400 shadow-[0_-4px_12px_rgba(139,92,246,0.4)]'
                        : hasAmt
                          ? 'bg-white/15 group-hover/bar:bg-violet-500/30'
                          : 'bg-white/6'
                    }`}
                    style={{ height: `${Math.max(hasAmt ? h : 0, hasAmt ? 6 : 0)}%`, transitionDelay: `${i * 50}ms` }}
                  />
                </div>
                <span className={`text-[9px] font-medium transition-colors ${isAct ? 'text-violet-300' : 'text-white/35'}`}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
