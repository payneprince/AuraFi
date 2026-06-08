'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Settings,
  Shield,
  Bell,
  FileText,
  HelpCircle,
  Gift,
  LogOut,
  Smartphone,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react';
import { clearUnifiedAuthSession } from '../../../../shared/unified-auth';
import { UserDetailsModal } from './UserDetailsModal';

export default function ProfilePage() {
  const { user, theme, setTheme, soundEnabled, toggleSound } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const sections = [
    {
      title: 'Security',
      items: [
        {
          icon: Shield,
          label: 'Two-Factor Authentication',
          description: twoFactor ? 'Enabled' : 'Disabled',
          toggle: true,
          value: twoFactor,
          onChange: setTwoFactor,
        },
        { icon: Settings, label: 'Transaction Limits', description: 'Set daily and per-transfer limits' },
        { icon: Smartphone, label: 'Biometric Login', description: 'Face ID / Fingerprint access' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          description: notifications ? 'Enabled' : 'Disabled',
          toggle: true,
          value: notifications,
          onChange: setNotifications,
        },
        {
          icon: theme === 'dark' ? Sun : Moon,
          label: 'Dark Mode',
          description: theme === 'dark' ? 'On' : 'Off',
          toggle: true,
          value: theme === 'dark',
          onChange: (val: boolean) => setTheme(val ? 'dark' : 'light'),
        },
        {
          icon: Bell,
          label: 'Sound',
          description: soundEnabled ? 'On' : 'Off',
          toggle: true,
          value: soundEnabled,
          onChange: toggleSound,
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        { icon: FileText, label: 'Transaction Export', description: 'Download CSV summary' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', description: 'FAQs and support options' },
        { icon: Gift, label: 'Refer & Earn', description: 'Invite friends and earn rewards' },
      ],
    },
  ];

  const buildAppUrl = (port: number, path = '') => {
    if (typeof window === 'undefined') return `http://localhost:${port}${path}`;
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:${port}${path}`;
  };

  const sectionAccents = [
    { bg: 'bg-magenta-500/10', text: 'text-magenta-600' },
    { bg: 'bg-cyan-500/10', text: 'text-cyan-600' },
    { bg: 'bg-mint-500/15', text: 'text-mint-600' },
    { bg: 'bg-slate-100', text: 'text-slate-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => setShowUserDetails(true)}
        className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-magenta-500 to-cyan-500 text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 w-full text-left transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-2xl cursor-pointer"
      >
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none transition-transform duration-500 group-hover:scale-110" />
        <div className="relative flex items-center gap-4">
          <div className="relative flex-shrink-0" style={{ width: 56, height: 56 }}>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/80 border-r-white/30 animate-spin" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-[3px] rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold ring-1 ring-white/25">
              {(user?.name || 'D').charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold truncate">{user?.name || 'Demo User'}</h2>
            <p className="text-sm opacity-85 truncate">{user?.email || 'demo@aurafinance.com'}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </button>

      <UserDetailsModal isOpen={showUserDetails} onClose={() => setShowUserDetails(false)} user={user} />

      {sections.map((section, index) => {
        const accent = sectionAccents[index % sectionAccents.length];
        return (
        <div
          key={index}
          className="rounded-2xl border border-slate-200 bg-surface shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
          style={{ animationDelay: `${(index + 1) * 80}ms` }}
        >
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-text-dark">{section.title}</h3>
          </div>
          <div>
            {section.items.map((item: any, itemIndex: number) => {
              const Icon = item.icon;
              return (
                <button
                  key={itemIndex}
                  onClick={() => {
                    if (item.toggle && item.onChange) item.onChange(!item.value);
                  }}
                  className="group/item w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg ${accent.bg} ${accent.text} flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover/item:scale-110`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-text-dark truncate">{item.label}</p>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                    </div>
                  </div>

                  {item.toggle ? (
                    <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${item.value ? 'bg-mint-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${item.value ? 'left-[1.125rem]' : 'left-0.5'}`} />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 group-hover/item:translate-x-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        );
      })}

      <button
        className="group w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50/60 text-red-600 font-medium hover:bg-red-100/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
        style={{ animationDelay: `${(sections.length + 1) * 80}ms` }}
        onClick={() => {
          clearUnifiedAuthSession();
          localStorage.removeItem('aurasuite_userId');
          sessionStorage.removeItem('aurasuite_userId');
          window.location.href = buildAppUrl(3000, '/login');
        }}
      >
        <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        <span>Logout</span>
      </button>
    </div>
  );
}