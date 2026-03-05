import React from 'react';
import { Home, Send, CreditCard, PieChart, Settings } from 'lucide-react';

const items = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'wallets', label: 'Wallets', icon: CreditCard },
  { id: 'send', label: 'Send', icon: Send },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ current = 'overview', onNavigate = (id: string) => {} }: { current?: string; onNavigate?: (id: string)=>void }) {
  return (
    <aside className="w-64 hidden md:block bg-[#071126] border-r border-white/6 min-h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#29C7D9] to-[#E23478] rounded-xl flex items-center justify-center">
            <span className="text-black font-bold">A</span>
          </div>
          <div>
            <div className="text-white font-bold">AuraWallet</div>
            <div className="text-white/60 text-xs">by AuraFinance</div>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map((it) => {
            const Icon = it.icon;
            const active = it.id === current;
            return (
              <button key={it.id} onClick={() => onNavigate(it.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${active ? 'bg-white/6' : 'hover:bg-white/3'}`}>
                <Icon className={`w-4 h-4 ${active ? 'text-[#29C7D9]' : 'text-white/70'}`} />
                <span className={`text-sm ${active ? 'text-[#29C7D9]' : 'text-white/70'}`}>{it.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8">
          <div className="text-white/70 text-xs mb-2">Account</div>
          <div className="bg-white/5 rounded-md p-3">
            <div className="text-white font-medium">Demo User</div>
            <div className="text-white/60 text-xs">demo@aurafinance.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
