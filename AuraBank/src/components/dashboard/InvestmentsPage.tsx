'use client';

import { useMemo } from 'react';
import { Landmark, Clock, ShieldCheck, TrendingUp, ExternalLink, Building2, Lightbulb } from 'lucide-react';

const tBillRates = [
  { tenor: '91-Day', rate: 17.8, color: 'magenta' },
  { tenor: '182-Day', rate: 18.6, color: 'teal' },
  { tenor: '364-Day', rate: 19.4, color: 'mint' },
];

const localInvestmentProducts = [
  {
    id: 'tbill-91',
    name: 'Treasury Bill (91-Day)',
    provider: 'Bank of Ghana',
    minimum: 'GHS 100',
    tenor: '91 days',
    rate: '17.8%',
    risk: 'Low',
    tax: '0% Tax',
  },
  {
    id: 'fixed-6m',
    name: 'Fixed Deposit Plus',
    provider: 'Databank',
    minimum: 'GHS 1,000',
    tenor: '6 months',
    rate: '16.2%',
    risk: 'Low',
    tax: '8% WHT',
  },
  {
    id: 'money-market',
    name: 'Money Market Saver',
    provider: 'Ecobank Capital',
    minimum: 'GHS 50',
    tenor: 'Flexible',
    rate: '13.9%',
    risk: 'Low',
    tax: '0% Tax',
  },
  {
    id: 'bond-2y',
    name: 'Government Bond (2-Year)',
    provider: 'Public Debt Market',
    minimum: 'GHS 500',
    tenor: '2 years',
    rate: '19.1%',
    risk: 'Low',
    tax: '0% Tax',
  },
];

const trustedProviders = [
  { name: 'Databank', category: 'Asset Manager', logo: '/logos/banks/databank.png' },
  { name: 'Ecobank', category: 'Investment Bank', logo: '/logos/banks/ecobank.png' },
  { name: 'GCB Bank', category: 'Commercial Bank', logo: '/logos/banks/gcb.png' },
  { name: 'Bank of Ghana', category: 'Central Bank', logo: '/logos/banks/bog.png' },
];

const getRateStyle = (color: string) => {
  switch (color) {
    case 'magenta':
      return { ring: 'border-t-magenta-500/80 border-r-magenta-500/30', bg: 'bg-magenta-500/10', text: 'text-magenta-600', bar: 'from-magenta-500 to-magenta-600' };
    case 'teal':
      return { ring: 'border-t-teal-400/80 border-r-teal-400/30', bg: 'bg-teal-100', text: 'text-teal-600', bar: 'from-teal-500 to-teal-400' };
    default:
      return { ring: 'border-t-mint-500/80 border-r-mint-500/30', bg: 'bg-mint-500/10', text: 'text-mint-600', bar: 'from-mint-500 to-mint-600' };
  }
};

export default function InvestmentsPage() {
  const openAuraVest = () => window.open('http://localhost:3002', '_self');

  const auctionCountdown = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilMonday = (8 - day) % 7 || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilMonday);
    next.setHours(10, 0, 0, 0);
    const diffMs = next.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  }, []);

  return (
    <div className="space-y-6">
      {/* Local Investments banner */}
      <div className="relative overflow-hidden rounded-2xl border border-navy-700 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-6 shadow-lg group">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-magenta-500/10 blur-3xl group-hover:bg-magenta-500/20 transition-all duration-700" />
        <div className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl group-hover:bg-teal-500/20 transition-all duration-700" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0" style={{ width: 56, height: 56 }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/70 border-r-white/25 animate-spin" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-[3px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Landmark className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Local Investments</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-semibold border border-white/20">GHS</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-mint-400" />
                </span>
              </div>
              <p className="text-sm text-white/60 mt-1 max-w-md">
                Ghana-market T-Bills, bonds and money-market funds are bought and tracked in AuraVest — open it to invest, your bank balance stays untouched.
              </p>
            </div>
          </div>
          <button
            onClick={openAuraVest}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-magenta-500 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            Open AuraVest to Invest
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-magenta-500/10 text-magenta-600 flex items-center justify-center flex-shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">BOG Policy Rate</p>
            <p className="text-lg font-bold text-text-dark tabular-nums">14.0%</p>
          </div>
        </div>
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Next T-Bill Auction</p>
            <p className="text-lg font-bold text-text-dark tabular-nums">{auctionCountdown}</p>
          </div>
        </div>
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-mint-500/10 text-mint-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">T-Bills &amp; Funds Tax</p>
            <p className="text-lg font-bold text-text-dark tabular-nums">0%</p>
          </div>
        </div>
      </div>

      {/* Live T-Bill rates */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-dark">Live T-Bill Rates</h3>
            <p className="text-sm text-slate-500">Indicative Bank of Ghana auction yields</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            Live
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tBillRates.map((item, idx) => {
            const style = getRateStyle(item.color);
            return (
              <div
                key={item.tenor}
                className="group/card relative overflow-hidden rounded-xl border border-navy-700 bg-navy-50 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-teal-500/40 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${style.bg} blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500`} />
                <div className="absolute inset-0 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                <div className="relative flex items-center gap-3 mb-3">
                  <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
                    <div className={`absolute inset-0 rounded-full border-2 border-transparent ${style.ring} group-hover/card:animate-spin`} style={{ animationDuration: '2.5s' }} />
                    <div className={`absolute inset-[3px] rounded-full ${style.bg} ${style.text} flex items-center justify-center`}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-dark">{item.tenor} T-Bill</p>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">0% Tax</span>
                  </div>
                </div>
                <p className={`relative text-3xl font-bold ${style.text} tabular-nums origin-left transition-transform duration-300 group-hover/card:scale-105`}>
                  {item.rate}%<span className="text-xs font-medium text-slate-400 ml-1">p.a.</span>
                </p>
                <div className="relative mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${style.bar} transition-all duration-700`} style={{ width: `${Math.min(item.rate * 4, 100)}%` }} />
                </div>
                <p className="relative mt-2 text-[11px] text-slate-400">Indicative yield · updated weekly</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tax comparison callout */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 text-[11px] font-semibold tracking-wide uppercase border border-teal-500/20">Tax Tip</span>
          <p className="text-sm text-slate-600 leading-relaxed">
            <span className="font-semibold text-text-dark">Why T-Bills beat a regular savings account — </span>
            Treasury Bill and money-market fund returns are exempt from withholding tax <span className="font-semibold text-teal-600">(0%)</span>, while many fixed-income products carry an <span className="font-semibold text-magenta-600">8% WHT</span>. Open AuraVest to compare live local products and place an order.
          </p>
        </div>
      </div>

      {/* Available Products */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text-dark">Available Products</h3>
          <p className="text-sm text-slate-500">Buy and track these in AuraVest — your bank balance stays untouched</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {localInvestmentProducts.map((product, idx) => (
            <div
              key={product.id}
              className="group rounded-xl border border-navy-700 bg-navy-50 p-4 space-y-3 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-teal-500/40 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div>
                <h4 className="font-semibold text-text-dark transition-colors duration-200 group-hover:text-teal-600">{product.name}</h4>
                <p className="text-xs text-slate-500">{product.provider}</p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-medium">Risk: {product.risk}</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[11px] font-medium">{product.tax}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Return</p>
                  <p className="text-sm font-bold text-teal-600 transition-transform duration-200 group-hover:scale-110 inline-block">{product.rate}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Min</p>
                  <p className="text-sm font-semibold text-text-dark">{product.minimum}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Tenor</p>
                  <p className="text-sm font-semibold text-text-dark">{product.tenor}</p>
                </div>
              </div>

              <button
                onClick={openAuraVest}
                className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-lg bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-semibold hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Invest in AuraVest
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4">Illustrative rates shown for reference — open AuraVest for live pricing and to place an order.</p>
      </div>

      {/* Trusted Providers */}
      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text-dark">Trusted Providers</h3>
          <p className="text-sm text-slate-500">Licensed partners available when you invest through AuraVest</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {trustedProviders.map((provider, idx) => (
            <button
              key={provider.name}
              onClick={openAuraVest}
              className="group bg-navy-50 border border-navy-700 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-teal-500/30 hover:shadow-sm transition-all animate-in fade-in zoom-in-95 fill-mode-both"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center">
                <img
                  src={provider.logo}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <Building2 className="w-5 h-5 text-magenta-600 hidden" />
              </div>
              <span className="text-[10px] text-slate-500 group-hover:text-text-dark transition-colors text-center leading-tight">{provider.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
