'use client';

import { useMemo, useState } from 'react';
import { BarChart2 } from 'lucide-react';
// @ts-ignore
import { walletData } from '@/lib/shared/mock-data';

// ─── categories ───────────────────────────────────────────────────────────────

const CIRC = 2 * Math.PI * 42; // r=42 in a 90×90 viewBox (center 45,45)
const GAP  = 3;

const CATS = [
  { key: 'food',     label: 'Food',       match: /coffee|restaurant|food|dining|pizza|cafe/i,   color: '#f59e0b', dot: 'bg-amber-400',   text: 'text-amber-300',   bar: 'bg-amber-400'   },
  { key: 'shopping', label: 'Shopping',   match: /grocery|store|shop|market|nike|best buy/i,   color: '#a855f7', dot: 'bg-purple-400', text: 'text-purple-300', bar: 'bg-purple-400' },
  { key: 'mobile',   label: 'Mobile',     match: /mobile|momo|airtel|telecel|mtn/i,            color: '#818cf8', dot: 'bg-indigo-400', text: 'text-indigo-300', bar: 'bg-indigo-400' },
  { key: 'transfer', label: 'Transfers',  match: /transfer|send|wallet/i,                      color: '#38bdf8', dot: 'bg-sky-400',    text: 'text-sky-300',    bar: 'bg-sky-400'    },
  { key: 'topup',    label: 'Top-ups',    match: /top ?up|add fund/i,                          color: '#34d399', dot: 'bg-emerald-400',text: 'text-emerald-300',bar: 'bg-emerald-400'},
  { key: 'other',    label: 'Other',      match: null as RegExp | null,                        color: '#64748b', dot: 'bg-slate-400',  text: 'text-slate-400',  bar: 'bg-slate-400'  },
] as const;

type CatKey = typeof CATS[number]['key'];

function categorize(desc: string) {
  for (const c of CATS) if (c.match && c.match.test(desc || '')) return c;
  return CATS[CATS.length - 1];
}

// ─── month helpers ────────────────────────────────────────────────────────────

interface Mo { label: string; year: number; month: number; key: string }

function buildMonths(txs: any[]): Mo[] {
  const seen = new Map<string, { year: number; month: number; ts: number }>();
  for (const t of txs) {
    const d = new Date(t.date || t.createdAt || '');
    if (isNaN(d.getTime())) continue;
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!seen.has(k)) seen.set(k, { year: d.getFullYear(), month: d.getMonth(), ts: d.getTime() });
  }
  let entries = [...seen.values()].sort((a, b) => a.ts - b.ts);
  if (!entries.length) {
    const now = new Date();
    entries = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), ts: d.getTime() };
    });
  }
  return entries.slice(-6).map(({ year, month }) => {
    const d = new Date(year, month, 1);
    return { label: d.toLocaleString('default', { month: 'short' }), year, month, key: `${year}-${month}` };
  });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function SpendAnalytics() {
  const txs: any[] = useMemo(() => walletData.transactions || [], []);
  const months     = useMemo(() => buildMonths(txs), [txs]);
  const [selKey, setSelKey] = useState<string | null>(null);
  const active = months.find(m => m.key === selKey) ?? months[months.length - 1];

  const monthTxs = useMemo(() =>
    txs.filter(t => {
      if (Number(t.amount) >= 0) return false;
      const d = new Date(t.date || t.createdAt || '');
      return !isNaN(d.getTime()) && d.getFullYear() === active.year && d.getMonth() === active.month;
    })
  , [txs, active]);

  const total = useMemo(() => monthTxs.reduce((s, t) => s + Math.abs(Number(t.amount)), 0), [monthTxs]);

  const rows = useMemo(() => {
    const map = new Map<CatKey, { total: number }>();
    for (const c of CATS) map.set(c.key, { total: 0 });
    for (const t of monthTxs) {
      const c = categorize(t.description || '');
      map.get(c.key)!.total += Math.abs(Number(t.amount));
    }
    return CATS
      .map(c => ({ c, total: map.get(c.key)!.total, pct: total > 0 ? (map.get(c.key)!.total / total) * 100 : 0 }))
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [monthTxs, total]);

  // donut segments
  const segs = useMemo(() => {
    let off = 0;
    return rows.map(r => {
      const len = Math.max((r.pct / 100) * CIRC - GAP, 0);
      const s = { ...r, len, off };
      off += (r.pct / 100) * CIRC;
      return s;
    });
  }, [rows]);

  // trend
  const trend = useMemo(() =>
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

  const maxTrend = Math.max(...trend.map(m => m.total), 1);
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div className="rounded-2xl bg-[#0B1E39] border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '200ms' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-white text-sm font-bold">Spend Analytics</span>
          {total > 0 && (
            <span className="ml-1 text-white/40 text-xs font-normal tabular-nums">· {fmt(total)}</span>
          )}
        </div>
        {/* month tabs */}
        <div className="flex items-center gap-1 overflow-x-auto" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {months.map(m => (
            <button key={m.key} onClick={() => setSelKey(m.key)}
              className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                m.key === active.key
                  ? 'bg-violet-500/25 text-violet-300'
                  : 'text-white/30 hover:text-white/60'
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      {monthTxs.length === 0 ? (
        <div className="px-4 pb-4 flex items-center gap-3 py-5">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-4 h-4 text-white/20" />
          </div>
          <div>
            <p className="text-white/40 text-sm font-medium">No spend data for {active.label}</p>
            <p className="text-white/20 text-xs mt-0.5">Transactions will appear here automatically</p>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-1">
          <div className="flex items-center gap-4">

            {/* donut */}
            <div className="relative flex-shrink-0" style={{ width: 90, height: 90 }}>
              <svg viewBox="0 0 90 90" width="90" height="90">
                <circle cx="45" cy="45" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                {segs.map((s, i) => (
                  <circle key={s.c.key} cx="45" cy="45" r="42" fill="none"
                    stroke={s.c.color} strokeWidth="8" strokeLinecap="butt"
                    strokeDasharray={`${s.len} ${CIRC - s.len}`}
                    strokeDashoffset={-s.off}
                    transform="rotate(-90 45 45)"
                    style={{ transition: `stroke-dasharray 0.6s ease ${i * 60}ms` }}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-white font-black text-sm tabular-nums leading-tight">{fmt(total)}</span>
                <span className="text-white/35 text-[9px] leading-none">spent</span>
              </div>
            </div>

            {/* category rows */}
            <div className="flex-1 min-w-0 divide-y divide-white/5">
              {rows.slice(0, 5).map((r, i) => (
                <div key={r.c.key} className="flex items-center gap-2 py-1.5 animate-in fade-in fill-mode-both" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.c.dot}`} />
                  <span className="text-white/70 text-xs flex-1 truncate">{r.c.label}</span>
                  {/* thin bar */}
                  <div className="w-16 h-1 bg-white/8 rounded-full overflow-hidden flex-shrink-0">
                    <div className={`h-full rounded-full ${r.c.bar} transition-all duration-500`}
                      style={{ width: `${r.pct}%`, transitionDelay: `${i * 60}ms` }} />
                  </div>
                  <span className={`text-[11px] font-bold tabular-nums w-12 text-right flex-shrink-0 ${r.c.text}`}>${r.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Trend ──────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-3 mt-1 border-t border-white/5">
        <div className="flex items-end gap-1.5 h-10">
          {trend.map((m, i) => {
            const h     = maxTrend > 0 ? (m.total / maxTrend) * 100 : 0;
            const isAct = m.key === active.key;
            return (
              <button key={m.key} onClick={() => setSelKey(m.key)}
                className="flex-1 flex flex-col items-center gap-0.5 group/b focus:outline-none">
                <div className="w-full flex-1 flex items-end">
                  <div className={`w-full rounded-sm transition-all duration-400 ease-out ${
                    isAct ? 'bg-violet-400' : m.total > 0 ? 'bg-white/20 group-hover/b:bg-violet-400/50' : 'bg-white/6'
                  }`} style={{ height: `${Math.max(m.total > 0 ? h : 0, m.total > 0 ? 10 : 0)}%`, transitionDelay: `${i * 40}ms` }} />
                </div>
                <span className={`text-[9px] font-medium transition-colors leading-none ${isAct ? 'text-violet-300' : 'text-white/25 group-hover/b:text-white/50'}`}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
