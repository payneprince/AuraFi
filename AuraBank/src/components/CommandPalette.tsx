'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Account, Transaction } from '@/types';
import {
  Search, ArrowRight, CreditCard, BarChart3, File,
  TrendingUp, ArrowLeftRight, Wallet, PiggyBank, User, X, ExternalLink,
} from 'lucide-react';

type PageType = 'home' | 'accounts' | 'transactions' | 'bills' | 'cards' | 'budget' | 'investments' | 'profile';

const CROSS_APP = [
  { label: 'AuraVest',    port: 3002 },
  { label: 'AuraWallet',  port: 3003 },
  { label: 'AuraFinance', port: 3000 },
];

type NavResult  = { kind: 'nav';     id: PageType; label: string; Icon: React.ElementType };
type AccResult  = { kind: 'account'; acc: Account };
type TxResult   = { kind: 'tx';      tx: Transaction };
type AppResult  = { kind: 'app';     label: string; port: number };
type Result     = NavResult | AccResult | TxResult | AppResult;

const NAV_ITEMS: NavResult[] = [
  { kind: 'nav', id: 'home',         label: 'Overview',     Icon: BarChart3     },
  { kind: 'nav', id: 'accounts',     label: 'Accounts',     Icon: CreditCard    },
  { kind: 'nav', id: 'investments',  label: 'Investments',  Icon: PiggyBank     },
  { kind: 'nav', id: 'transactions', label: 'Transfer',     Icon: ArrowLeftRight },
  { kind: 'nav', id: 'bills',        label: 'Bills',        Icon: File          },
  { kind: 'nav', id: 'cards',        label: 'Cards',        Icon: Wallet        },
  { kind: 'nav', id: 'budget',       label: 'Budget',       Icon: TrendingUp    },
  { kind: 'nav', id: 'profile',      label: 'Settings',     Icon: User          },
];

function fmt(n: number) {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

interface Props {
  onNavigate: (page: PageType) => void;
}

export default function CommandPalette({ onNavigate }: Props) {
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const { transactions, accounts } = useAuth();
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

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 40); }, [open]);

  const q = query.toLowerCase().trim();

  const buildUrl = (port: number) => {
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:${port}`;
  };

  const results: Result[] = [
    ...NAV_ITEMS.filter((n) => !q || n.label.toLowerCase().includes(q)),
    ...(q ? accounts.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      a.accountNumber.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q)
    ).slice(0, 3).map((acc): AccResult => ({ kind: 'account', acc })) : []),
    ...(q ? transactions.filter((t) =>
      t.description?.toLowerCase().includes(q) ||
      (t.merchant ?? '').toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    ).slice(0, 5).map((tx): TxResult => ({ kind: 'tx', tx })) : []),
    ...CROSS_APP.filter((a) => !q || a.label.toLowerCase().includes(q)).map((a): AppResult => ({ kind: 'app', ...a })),
  ];

  useEffect(() => setActiveIdx(0), [query]);

  const activate = (r: Result) => {
    if (r.kind === 'nav')     { onNavigate(r.id); close(); }
    if (r.kind === 'account') { onNavigate('accounts'); close(); }
    if (r.kind === 'tx')      { onNavigate('transactions'); close(); }
    if (r.kind === 'app')     { window.location.href = buildUrl(r.port); }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) activate(results[activeIdx]);
  };

  if (!open) return null;

  const navResults    = results.filter((r): r is NavResult  => r.kind === 'nav');
  const accResults    = results.filter((r): r is AccResult  => r.kind === 'account');
  const txResults     = results.filter((r): r is TxResult   => r.kind === 'tx');
  const appResults    = results.filter((r): r is AppResult  => r.kind === 'app');

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{title}</p>
      {children}
    </div>
  );

  const rowBase = 'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors';
  const rowActive = 'bg-gradient-to-r from-magenta-500/10 to-cyan-500/5';
  const rowIdle   = 'hover:bg-slate-50';

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[14vh] bg-black/20 backdrop-blur-[2px]" onClick={close}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, accounts, transactions…"
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-400 font-mono">
            esc
          </kbd>
          <button onClick={close} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[22rem] overflow-y-auto py-1.5">
          {results.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-10">No results for &ldquo;{query}&rdquo;</p>
          )}

          {navResults.length > 0 && (
            <Section title={q ? 'Pages' : 'Navigation'}>
              {navResults.map((r) => {
                const idx = results.indexOf(r);
                const active = idx === activeIdx;
                return (
                  <button
                    key={r.id}
                    className={`${rowBase} ${active ? rowActive : rowIdle}`}
                    onClick={() => activate(r)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-gradient-to-br from-magenta-500 to-cyan-500' : 'bg-slate-100'}`}>
                      <r.Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <span className={`text-sm font-medium ${active ? 'text-magenta-600' : 'text-slate-700'}`}>{r.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-200" />
                  </button>
                );
              })}
            </Section>
          )}

          {accResults.length > 0 && (
            <Section title="Accounts">
              {accResults.map((r) => {
                const idx = results.indexOf(r);
                const active = idx === activeIdx;
                return (
                  <button
                    key={r.acc.id}
                    className={`${rowBase} ${active ? rowActive : rowIdle}`}
                    onClick={() => activate(r)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{r.acc.name}</p>
                      <p className="text-xs text-slate-400">{r.acc.accountNumber}</p>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${r.acc.balance < 0 ? 'text-red-500' : 'text-magenta-600'}`}>
                      {fmt(r.acc.balance)}
                    </p>
                  </button>
                );
              })}
            </Section>
          )}

          {txResults.length > 0 && (
            <Section title="Transactions">
              {txResults.map((r) => {
                const idx = results.indexOf(r);
                const active = idx === activeIdx;
                return (
                  <button
                    key={r.tx.id}
                    className={`${rowBase} ${active ? rowActive : rowIdle}`}
                    onClick={() => activate(r)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${r.tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {r.tx.type === 'credit' ? '+' : '−'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{r.tx.description}</p>
                      <p className="text-xs text-slate-400">{r.tx.category}</p>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${r.tx.amount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {r.tx.amount < 0 ? '−' : '+'}{fmt(r.tx.amount)}
                    </p>
                  </button>
                );
              })}
            </Section>
          )}

          {appResults.length > 0 && (
            <Section title="Switch App">
              {appResults.map((r) => {
                const idx = results.indexOf(r);
                const active = idx === activeIdx;
                return (
                  <button
                    key={r.port}
                    className={`${rowBase} ${active ? rowActive : rowIdle}`}
                    onClick={() => activate(r)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <ExternalLink className={`w-3.5 h-3.5 ${active ? 'text-magenta-500' : 'text-slate-400'}`} />
                    </div>
                    <span className={`text-sm font-medium ${active ? 'text-magenta-600' : 'text-slate-700'}`}>{r.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-200" />
                  </button>
                );
              })}
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 bg-slate-50/80">
          {[['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']].map(([key, label]) => (
            <span key={key} className="text-[10px] text-slate-400 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono shadow-sm">{key}</kbd>
              {label}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-slate-300 font-mono">⌘K</span>
        </div>
      </div>
    </div>
  );
}
