'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Search, ArrowRight, Home, TrendingUp, Wallet,
  ArrowLeftRight, BookOpen, Settings, X, ExternalLink,
} from 'lucide-react';

type TabType = 'home' | 'markets' | 'portfolio' | 'trade' | 'more' | 'learn';

const NAV_ITEMS = [
  { id: 'home'      as TabType, label: 'Home',      Icon: Home },
  { id: 'markets'   as TabType, label: 'Markets',   Icon: TrendingUp },
  { id: 'portfolio' as TabType, label: 'Portfolio', Icon: Wallet },
  { id: 'trade'     as TabType, label: 'Trade',     Icon: ArrowLeftRight },
  { id: 'learn'     as TabType, label: 'Learn',     Icon: BookOpen },
  { id: 'more'      as TabType, label: 'Settings',  Icon: Settings },
];

const CROSS_APP = [
  { label: 'AuraBank',    port: 3001 },
  { label: 'AuraWallet',  port: 3003 },
  { label: 'AuraFinance', port: 3000 },
];

interface HoldingItem { type: string; value: number; allocation: number; }
interface TxItem { type?: string; assetName?: string; amount?: number; }

type Result =
  | { kind: 'nav';     id: TabType; label: string; Icon: React.ElementType }
  | { kind: 'holding'; holding: HoldingItem }
  | { kind: 'tx';      tx: TxItem }
  | { kind: 'app';     label: string; port: number };

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

interface Props { onNavigate: (tab: TabType) => void; }

export default function CommandPalette({ onNavigate }: Props) {
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [holdings, setHoldings]   = useState<HoldingItem[]>([]);
  const [txs, setTxs]             = useState<TxItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => { setOpen(false); setQuery(''); setActiveIdx(0); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen((p) => !p); }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    try {
      const p = JSON.parse(localStorage.getItem('auravest_portfolio') || '{}') as { assets?: HoldingItem[] };
      setHoldings(Array.isArray(p.assets) ? p.assets : []);
      const t = JSON.parse(localStorage.getItem('auravest_transactions') || '[]') as TxItem[];
      setTxs(Array.isArray(t) ? t.slice(0, 20) : []);
    } catch { /* ignore */ }
    setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  const buildUrl = (port: number) => {
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:${port}`;
  };

  const q = query.toLowerCase().trim();

  const results: Result[] = [
    ...NAV_ITEMS.filter((n) => !q || n.label.toLowerCase().includes(q)).map((n) => ({ kind: 'nav' as const, ...n })),
    ...(q ? holdings.filter((h) => h.type?.toLowerCase().includes(q)).slice(0, 3).map((h) => ({ kind: 'holding' as const, holding: h })) : []),
    ...(q ? txs.filter((t) => (t.assetName ?? '').toLowerCase().includes(q) || (t.type ?? '').toLowerCase().includes(q)).slice(0, 4).map((t) => ({ kind: 'tx' as const, tx: t })) : []),
    ...CROSS_APP.filter((a) => !q || a.label.toLowerCase().includes(q)).map((a) => ({ kind: 'app' as const, ...a })),
  ];

  useEffect(() => setActiveIdx(0), [query]);

  const activate = (r: Result) => {
    if (r.kind === 'nav')     { onNavigate(r.id); close(); }
    if (r.kind === 'holding') { onNavigate('portfolio'); close(); }
    if (r.kind === 'tx')      { onNavigate('portfolio'); close(); }
    if (r.kind === 'app')     { window.location.href = buildUrl(r.port); }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) activate(results[activeIdx]);
  };

  if (!open) return null;

  const navResults     = results.filter((r): r is Extract<Result, { kind: 'nav' }>     => r.kind === 'nav');
  const holdingResults = results.filter((r): r is Extract<Result, { kind: 'holding' }> => r.kind === 'holding');
  const txResults      = results.filter((r): r is Extract<Result, { kind: 'tx' }>      => r.kind === 'tx');
  const appResults     = results.filter((r): r is Extract<Result, { kind: 'app' }>     => r.kind === 'app');

  const row = (active: boolean) =>
    `w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-red-500/10' : 'hover:bg-white/5'}`;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">{title}</p>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[14vh] bg-black/40 backdrop-blur-[2px]" onClick={close}>
      <div className="w-full max-w-lg bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Search pages, holdings, transactions…"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
          <button onClick={close} className="text-white/30 hover:text-white/60 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="max-h-[22rem] overflow-y-auto py-1.5">
          {results.length === 0 && <p className="text-center text-xs text-white/30 py-10">No results for &ldquo;{query}&rdquo;</p>}

          {navResults.length > 0 && (
            <Section title={q ? 'Pages' : 'Navigation'}>
              {navResults.map((r) => {
                const idx = results.indexOf(r); const active = idx === activeIdx;
                return (
                  <button key={r.id} className={row(active)} onClick={() => activate(r)} onMouseEnter={() => setActiveIdx(idx)}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-red-500' : 'bg-white/5'}`}>
                      <r.Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-white/40'}`} />
                    </div>
                    <span className={`text-sm font-medium ${active ? 'text-red-400' : 'text-white/70'}`}>{r.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-white/15" />
                  </button>
                );
              })}
            </Section>
          )}

          {holdingResults.length > 0 && (
            <Section title="Holdings">
              {holdingResults.map((r, i) => {
                const idx = results.indexOf(r); const active = idx === activeIdx;
                return (
                  <button key={i} className={row(active)} onClick={() => activate(r)} onMouseEnter={() => setActiveIdx(idx)}>
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Wallet className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/70 truncate">{r.holding.type}</p>
                      <p className="text-xs text-white/30">{r.holding.allocation}% allocation</p>
                    </div>
                    <p className="text-sm font-semibold text-red-400 shrink-0">{fmt(r.holding.value)}</p>
                  </button>
                );
              })}
            </Section>
          )}

          {txResults.length > 0 && (
            <Section title="Transactions">
              {txResults.map((r, i) => {
                const idx = results.indexOf(r); const active = idx === activeIdx;
                const isBuy = r.tx.type === 'buy' || r.tx.type === 'deposit';
                return (
                  <button key={i} className={row(active)} onClick={() => activate(r)} onMouseEnter={() => setActiveIdx(idx)}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isBuy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {isBuy ? '+' : '−'}
                    </div>
                    <p className="text-sm font-medium text-white/70 truncate flex-1">{r.tx.assetName ?? r.tx.type}</p>
                    <p className="text-sm font-semibold text-white/50 shrink-0">{fmt(Number(r.tx.amount ?? 0))}</p>
                  </button>
                );
              })}
            </Section>
          )}

          {appResults.length > 0 && (
            <Section title="Switch App">
              {appResults.map((r) => {
                const idx = results.indexOf(r); const active = idx === activeIdx;
                return (
                  <button key={r.port} className={row(active)} onClick={() => activate(r)} onMouseEnter={() => setActiveIdx(idx)}>
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <span className="text-sm font-medium text-white/60">{r.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-white/15" />
                  </button>
                );
              })}
            </Section>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/10 bg-white/[0.02]">
          {[['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']].map(([key, label]) => (
            <span key={key} className="text-[10px] text-white/25 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono">{key}</kbd>
              {label}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-white/20 font-mono">⌘K</span>
        </div>
      </div>
    </div>
  );
}
