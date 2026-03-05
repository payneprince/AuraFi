import React from 'react';
import { ChevronsLeft } from 'lucide-react';
import Image from 'next/image';
import { walletNavItems } from '@/components/dashboard/navigation';
import type { WalletSection } from '@/components/dashboard/types';

export default function Sidebar({
  current = 'overview',
  onNavigate = () => {},
  collapsed = false,
  onToggleCollapse = () => {},
}: {
  current?: WalletSection;
  onNavigate?: (id: WalletSection) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} hidden md:flex flex-col bg-white border-r border-slate-200 dark:bg-[#071126] dark:border-white/10 min-h-screen sticky top-0 transition-all duration-300`}>
      <div className="p-5 border-b border-slate-200 dark:border-white/10">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} mb-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white overflow-hidden border border-white/20">
              <Image
                src="/images/aurawallet-logo.jpeg"
                alt="AuraWallet"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            {!collapsed && (
              <div>
                <div className="text-slate-900 dark:text-white font-extrabold text-lg">AuraWallet</div>
                <div className="text-slate-600 dark:text-white/75 text-sm font-medium">Fast.Secure.Everywhere</div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              className="text-slate-500 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
            aria-label="Expand sidebar"
          >
            <ChevronsLeft className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      <div className="p-4 flex-1">
        <nav className="space-y-2">
          {walletNavItems.map((it) => {
            const Icon = it.icon;
            const active = it.id === current;
            return (
              <button
                key={it.id}
                onClick={() => onNavigate(it.id)}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  active
                    ? 'bg-gradient-to-r from-black via-white/15 to-green-500 text-white shadow-lg'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-slate-700 dark:text-white/80'}`} />
                {!collapsed && <span className={`text-base font-semibold ${active ? 'text-white' : 'text-slate-700 dark:text-white/80'}`}>{it.label}</span>}
              </button>
            );
          })}
        </nav>

      </div>
    </aside>
  );
}
