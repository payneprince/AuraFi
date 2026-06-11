import { Wallet, TrendingUp, TrendingDown, PieChart, Activity } from 'lucide-react';
import TransactionList from '@/components/TransactionList';
import SpendAnalytics from './SpendAnalytics';

interface PortfolioSectionProps {
  walletBalance: number;
  transactions: Array<{ amount: number }>;
}

export default function PortfolioSection({ walletBalance, transactions }: PortfolioSectionProps) {
  const credits = transactions
    .filter((transaction) => Number(transaction.amount) > 0)
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const debits = Math.abs(transactions
    .filter((transaction) => Number(transaction.amount) < 0)
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));

  const net = credits - debits;
  const flowTotal = credits + debits;
  const inflowShare = flowTotal > 0 ? (credits / flowTotal) * 100 : 0;

  const stats = [
    {
      label: 'Current Balance', value: `$${walletBalance.toFixed(2)}`, sub: net >= 0 ? `Net +$${net.toFixed(2)} this period` : `Net -$${Math.abs(net).toFixed(2)} this period`,
      Icon: Wallet, bg: 'bg-emerald-500/15', text: 'text-emerald-300', spin: 'border-t-emerald-400/80 border-r-emerald-400/30', valueColor: 'text-white',
    },
    {
      label: 'Total Inflow', value: `+$${credits.toFixed(2)}`, sub: 'Money received',
      Icon: TrendingUp, bg: 'bg-green-500/15', text: 'text-green-300', spin: 'border-t-green-400/80 border-r-green-400/30', valueColor: 'text-green-400',
    },
    {
      label: 'Total Outflow', value: `-$${debits.toFixed(2)}`, sub: 'Money sent & spent',
      Icon: TrendingDown, bg: 'bg-red-500/15', text: 'text-red-300', spin: 'border-t-red-400/80 border-r-red-400/30', valueColor: 'text-red-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.Icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl p-5 bg-[#0B1E39] border border-white/10 hover:border-white/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-500`} />
              <div className="relative flex items-center gap-3 mb-1">
                <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ width: 40, height: 40 }}>
                  <div className={`absolute inset-0 rounded-full border-2 border-transparent ${stat.spin} group-hover:animate-spin`} style={{ animationDuration: '2.5s' }} />
                  <div className={`absolute inset-[3px] rounded-full ${stat.bg} ${stat.text} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-white/80 text-base font-semibold">{stat.label}</p>
              </div>
              <p className={`relative ${stat.valueColor} text-4xl font-extrabold mt-2 tabular-nums transition-transform duration-300 group-hover:scale-[1.03] origin-left`}>{stat.value}</p>
              <p className="relative text-white/60 text-xs mt-1.5">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="group relative overflow-hidden rounded-2xl p-5 bg-[#0B1E39] border border-white/10 hover:border-white/20 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '260ms' }}>
        <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-green-500/10 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-red-500/10 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />

        <div className="relative flex items-center gap-3 mb-5">
          <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-400/80 border-r-green-400/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-[3px] rounded-full bg-green-500/15 text-green-300 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">Cash Flow Balance</h3>
            <p className="text-white/60 text-xs">Inflow vs. outflow distribution this period</p>
          </div>
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex-shrink-0 transition-transform duration-500 group-hover:scale-105" style={{ width: 132, height: 132 }}>
            <div
              className="absolute inset-0 rounded-full transition-all duration-1000 ease-out"
              style={{ background: `conic-gradient(#4ade80 0% ${inflowShare}%, #f87171 ${inflowShare}% 100%)` }}
            />
            <div className="absolute inset-[3px] rounded-full bg-[#0B1E39]" />
            <div className="absolute inset-[10px] rounded-full bg-[#0B1E39] flex flex-col items-center justify-center ring-1 ring-white/10">
              <span className="text-white font-extrabold text-2xl tabular-nums">{inflowShare.toFixed(0)}%</span>
              <span className="text-white/50 text-[10px] uppercase tracking-wide">Inflow Share</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                <span className="text-white/80 text-sm">Inflow</span>
              </div>
              <span className="text-green-400 font-bold tabular-nums">+${credits.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '60ms' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
                <span className="text-white/80 text-sm">Outflow</span>
              </div>
              <span className="text-red-400 font-bold tabular-nums">-${debits.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${net >= 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]'}`} />
                <span className="text-white/80 text-sm">Net Flow</span>
              </div>
              <span className={`font-bold tabular-nums ${net >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>{net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Inflow {inflowShare.toFixed(0)}%</span>
            <span>Outflow {(100 - inflowShare).toFixed(0)}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden flex">
            <div className="group/bar relative h-full overflow-hidden bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000 ease-out" style={{ width: `${inflowShare}%` }}>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
            <div className="relative h-full overflow-hidden bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000 ease-out" style={{ width: `${100 - inflowShare}%` }}>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      <SpendAnalytics />

      <div className="group relative overflow-hidden rounded-2xl p-5 bg-[#0B1E39] border border-white/10 hover:border-white/20 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: '320ms' }}>
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-sky-500/10 blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
        <div className="relative flex items-center gap-3 mb-4">
          <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-400/80 border-r-sky-400/30 group-hover:animate-spin" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-[3px] rounded-full bg-sky-500/15 text-sky-300 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">Portfolio Activity</h3>
            <p className="text-white/60 text-xs">{transactions.length} transaction{transactions.length === 1 ? '' : 's'} recorded</p>
          </div>
        </div>
        <div className="relative">
          <TransactionList />
        </div>
      </div>
    </div>
  );
}
