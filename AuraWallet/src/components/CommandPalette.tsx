'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, ArrowRight, Home, Send, PieChart, Settings, X, ExternalLink } from 'lucide-react';
import type { WalletSection } from '@/components/dashboard/types';

const NAV_ITEMS = [
  { id: 'overview'  as WalletSection, label: 'Home',      Icon: Home },
  { id: 'send'      as WalletSection, label: 'Send',      Icon: Send },
  { id: 'portfolio' as WalletSection, label: 'Portfolio', Icon: PieChart },
  { id: 'settings'  as WalletSection, label: 'Settings',  Icon: Settings },
];

const CROSS_APP = [
  { label: 'AuraBank',    port: 3001 },
  { label: 'AuraVest',    port: 3002 },
  { label: 'AuraFinance', port: 3000 },
];

interface TxItem { id?: string; type?: string; category?: string; amount?: number; description?: string; recipient?: string; }

type Result =
  | { kind: 'nav'; id: WalletSection; label: string; Icon: React.ElementType }
  | { kind: 'tx';  tx: TxItem }
  | { kind: 'app'; label: string; port: number };

function fmt(n: number) {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

interface Props { onNavigate: (section: WalletSection) => void; }

export default function CommandPalette({ onNavigate }: Props) {
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
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
      const txKey = Object.keys(localStorage).find((k) => k.includes('wallet') && k.includes('transaction'));
      if (txKey) {
        const parsed = JSON.parse(localStorage.getItem(txKey) || '[]') as TxItem[];
        if (Array.isArray(parsed)) setTxs(parsed.slice(0, 20));
      }
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
    ...(q ? txs.filter((t) =>
      (t.description ?? '').toLowerCase().includes(q) ||
      (t.recipient ?? '').toLowerCase().includes(q) ||
      (t.category ?? '').toLowerCase().includes(q)
    ).slice(0, 5).map((t) => ({ kind: 'tx' as const, tx: t })) : []),
    ...CROSS_APP.filter((a) => !q || a.label.toLowerCase().includes(q)).map((a) => ({ kind: 'app' as const, ...a })),
  ];

  useEffect(() => setActiveIdx(0), [query]);

  const activate = (r: Result) => {
    if (r.kind === 'nav') { onNavigate(r.id); close(); }
    if (r.kind === 'tx')  { onNavigate('overview'); close(); }
    if (r.kind === 'app') { window.location.href = buildUrl(r.port); }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) activate(results[activeIdx]);
  };

  if (!open) return null;

  const navResults = results.filter((r): r is Extract<Result, { kind: 'nav' }> => r.kind === 'nav');
  const txResults  = results.filter((r): r is Extract<Result, { kind: 'tx' }>  => r.kind === 'tx');
  const appResults = results.filter((r): r is Extract<Result, { kind: 'app' }> => r.kind === 'app');

  const row = (active: boolean) =>
    `w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-green-500/10' : 'hover:bg-white/5'}`;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">{title}</p>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[14vh] bg-black/40 backdrop-blur-[2px]" onClick={close}>
      <div className="w-full max-w-lg bg-[#0B1E39] border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Search pages, transactions…"
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
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-green-500' : 'bg-white/5'}`}>
                      <r.Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-white/40'}`} />
                    </div>
                    <span className={`text-sm font-medium ${active ? 'text-green-400' : 'text-white/70'}`}>{r.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-white/15" />
                  </button>
                );
              })}
            </Section>
          )}

          {txResults.length > 0 && (
            <Section title="Transactions">
              {txResults.map((r, i) => {
                const idx = results.indexOf(r); const active = idx === activeIdx;
                const isCredit = r.tx.type === 'credit' || r.tx.type === 'receive';
                return (
                  <button key={i} className={row(active)} onClick={() => activate(r)} onMouseEnter={() => setActiveIdx(idx)}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isCredit ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {isCredit ? '+' : '−'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/70 truncate">{r.tx.description ?? r.tx.recipient ?? 'Transaction'}</p>
                      {r.tx.category && <p className="text-xs text-white/30">{r.tx.category}</p>}
                    </div>
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
