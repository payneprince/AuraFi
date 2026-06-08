"use client";

import { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Bell,
  FileText,
  HelpCircle,
  Gift,
  LogOut,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { clearUnifiedAuthSession, readUnifiedAuthSession } from '../../../../shared/unified-auth';
import { getUser as getDemoUser } from '../../../../shared/mock-data';
import { UserDetailsModal } from './UserDetailsModal';

export default function SettingsSection() {
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [profile, setProfile] = useState<{ id: string; name: string; email: string; phone?: string; address?: string }>({
    id: '1',
    name: 'Demo User',
    email: 'demo@aurafinance.com',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const session = readUnifiedAuthSession();
    const userId = sessionStorage.getItem('aurasuite_userId') || session?.userId;
    const name = session?.name || 'Demo User';
    const email = session?.email || 'demo@aurafinance.com';
    const isDemoUser = String(userId || '1') === '1' || email.toLowerCase() === 'demo@aurafinance.com';

    if (isDemoUser) {
      const demoProfile = getDemoUser('user_123');
      setProfile({ id: userId || '1', name, email, phone: demoProfile?.phone, address: demoProfile?.address });
    } else {
      setProfile({ id: userId || '1', name, email });
    }
  }, []);

  const sections = [
    {
      title: 'Security',
      accent: { bg: 'bg-red-500/15', text: 'text-red-300', spin: 'border-t-red-400/80 border-r-red-400/30' },
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
      accent: { bg: 'bg-sky-500/15', text: 'text-sky-300', spin: 'border-t-sky-400/80 border-r-sky-400/30' },
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          description: notifications ? 'Enabled' : 'Disabled',
          toggle: true,
          value: notifications,
          onChange: setNotifications,
        },
      ],
    },
    {
      title: 'Resources',
      accent: { bg: 'bg-amber-500/15', text: 'text-amber-300', spin: 'border-t-amber-400/80 border-r-amber-400/30' },
      items: [
        { icon: FileText, label: 'Transaction Export', description: 'Download CSV summary' },
      ],
    },
    {
      title: 'Support',
      accent: { bg: 'bg-purple-500/15', text: 'text-purple-300', spin: 'border-t-purple-400/80 border-r-purple-400/30' },
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => setShowUserDetails(true)}
        className="group w-full text-left rounded-xl p-5 bg-gradient-to-r from-black via-white/15 to-green-500 text-white border border-white/20 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 cursor-pointer animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/80 border-r-white/30 animate-spin" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-[3px] rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg font-bold ring-1 ring-white/25">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold truncate">{profile.name}</h2>
            <p className="text-sm opacity-90 truncate">{profile.email}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </button>

      <UserDetailsModal isOpen={showUserDetails} onClose={() => setShowUserDetails(false)} user={profile} />

      {sections.map((section, index) => (
        <div
          key={index}
          className="rounded-xl border border-white/10 bg-[#0B1E39] overflow-hidden hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
          style={{ animationDelay: `${(index + 1) * 80}ms` }}
        >
          <div className="p-3 border-b border-white/10">
            <h3 className="font-semibold text-sm text-white/90">{section.title}</h3>
          </div>
          <div>
            {section.items.map((item: any, itemIndex) => {
              const Icon = item.icon;
              return (
                <button
                  key={itemIndex}
                  onClick={() => {
                    if (item.toggle && item.onChange) item.onChange(!item.value);
                  }}
                  className="group w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors duration-200 border-b border-white/10 last:border-b-0 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ width: 36, height: 36 }}>
                      <div className={`absolute inset-0 rounded-full border-2 border-transparent ${section.accent.spin} group-hover:animate-spin`} style={{ animationDuration: '2.5s' }} />
                      <div className={`absolute inset-[2.5px] rounded-full ${section.accent.bg} ${section.accent.text} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{item.label}</p>
                      <p className="text-xs text-white/70">{item.description}</p>
                    </div>
                  </div>

                  {item.toggle ? (
                    <div className={`w-9 h-5 rounded-full transition-colors duration-300 ${item.value ? 'bg-green-500' : 'bg-white/20'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform duration-300 ${item.value ? 'ml-4' : 'ml-0.5'}`} />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/50 transition-transform duration-300 group-hover:translate-x-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border border-red-400/30 text-red-300 hover:bg-red-500/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
        style={{ animationDelay: `${(sections.length + 1) * 80}ms` }}
        onClick={() => {
          clearUnifiedAuthSession();
          localStorage.removeItem('aurasuite_userId');
          sessionStorage.removeItem('aurasuite_userId');
          window.location.href = buildAppUrl(3000, '/login');
        }}
      >
        <LogOut className="w-4 h-4" />
        <span className="font-semibold">Logout</span>
      </button>
    </div>
  );
}
