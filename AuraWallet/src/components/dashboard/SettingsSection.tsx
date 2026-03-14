"use client";

import { useState } from 'react';
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

export default function SettingsSection() {
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
          icon: darkMode ? Sun : Moon,
          label: 'Dark Mode',
          description: darkMode ? 'On' : 'Off',
          toggle: true,
          value: darkMode,
          onChange: setDarkMode,
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        { icon: FileText, label: 'Transaction Export', description: 'Download CSV summary' },
        { icon: FileText, label: 'Sync Status', description: 'AuraWallet snapshot sync active' },
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-xl p-5 bg-gradient-to-r from-black via-white/15 to-green-500 text-white border border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">D</div>
          <div>
            <h2 className="font-bold">Demo User</h2>
            <p className="text-sm opacity-90">demo@aurafinance.com</p>
          </div>
        </div>
      </div>

      {sections.map((section, index) => (
        <div key={index} className="rounded-lg border border-white/10 bg-[#0B1E39] overflow-hidden">
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
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/10 last:border-b-0 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-green-300" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{item.label}</p>
                      <p className="text-xs text-white/70">{item.description}</p>
                    </div>
                  </div>

                  {item.toggle ? (
                    <div className={`w-8 h-4 rounded-full transition-colors ${item.value ? 'bg-green-500' : 'bg-white/20'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${item.value ? 'ml-4' : 'ml-0.5'}`} />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border border-red-400/30 text-red-300 hover:bg-red-500/10 transition-colors"
        onClick={() => {
          clearUnifiedAuthSession();
          localStorage.removeItem('aurasuite_userId');
          sessionStorage.removeItem('aurasuite_userId');
          window.location.href = '/';
        }}
      >
        <LogOut className="w-4 h-4" />
        <span className="font-semibold">Logout</span>
      </button>
    </div>
  );
}
