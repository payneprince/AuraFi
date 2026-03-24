// src/components/dashboard/MorePage.tsx
'use client';

import { 
  User, 
  Settings, 
  Shield, 
  Wallet, 
  Bell, 
  FileText, 
  HelpCircle, 
  BookOpen, 
  Gift, 
  LogOut, 
  Smartphone, 
  Moon, 
  Sun,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { exportTransactionsCSV } from '@/lib/mockAPI';
import { clearUnifiedAuthSession } from '../../../../shared/unified-auth';
import UnifiedActivityFeed from './UnifiedActivityFeed';

export default function MorePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('auravest_dark_mode') === 'true';
      setDarkMode(savedDarkMode);
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('auravest_dark_mode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const buildAppUrl = (port: number, path = '') => {
    if (typeof window === 'undefined') return `http://localhost:${port}${path}`;
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:${port}${path}`;
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', description: 'Manage your profile' },
      ]
    },
    {
      title: 'Security',
      items: [
        { icon: Shield, label: 'Two-Factor Authentication', description: twoFactor ? 'Enabled' : 'Disabled', toggle: true, value: twoFactor, onChange: setTwoFactor },
        { icon: Settings, label: 'Transaction Limits', description: 'Set spending limits' },
        { icon: Smartphone, label: 'Biometric Login', description: 'Face ID / Fingerprint' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', description: notifications ? 'Enabled' : 'Disabled', toggle: true, value: notifications, onChange: setNotifications },
        { icon: darkMode ? Sun : Moon, label: 'Dark Mode', description: darkMode ? 'On' : 'Off', toggle: true, value: darkMode, onChange: toggleDarkMode },
      ]
    },
    {
      title: 'Resources',
      items: [
        { icon: BookOpen, label: 'Educational Resources', description: 'Learn about investing', link: '/learn' },
        { icon: FileText, label: 'Tax Reporting', description: 'Download tax documents' },
        { 
          icon: FileText, 
          label: 'Transaction History', 
          description: 'Export CSV/PDF',
          action: () => {
            const url = exportTransactionsCSV();
            if (url) {
              const link = document.createElement('a');
              link.href = url;
              link.download = `auravest-transactions-${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
            }
          }
        },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', description: 'FAQs and support' },
        { icon: Gift, label: 'Referral Program', description: 'Invite friends, earn rewards' },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Settings and additional features</p>
      </div>

      {/* User Profile Card */}
      <div className="gradient-primary rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
            D
          </div>
          <div>
            <h2 className="font-bold">Demo User</h2>
            <p className="text-sm opacity-90">test@auravest.com</p>
          </div>
        </div>
      </div>

      {/* Unified Activity Feed */}
      <UnifiedActivityFeed />

      {/* Menu Sections */}
      {menuSections.map((section, idx) => (
        <div key={idx} className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-sm">{section.title}</h3>
          </div>
          <div>
            {section.items.map((item: any, itemIdx) => {
              const Icon = item.icon;
              return (
                <button
                  key={itemIdx}
                  onClick={() => {
                    if (item.toggle && item.onChange) {
                      item.onChange(!item.value);
                    } else if (item.action) {
                      item.action();
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors border-b border-border last:border-b-0 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  {item.toggle ? (
                    <div className={`w-8 h-4 rounded-full transition-colors ${item.value ? 'bg-primary' : 'bg-muted'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${item.value ? 'ml-4' : 'ml-0.5'}`} />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <button 
        className="w-full flex items-center justify-center gap-2 p-4 bg-card border border-border rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
        onClick={() => {
          clearUnifiedAuthSession();
          sessionStorage.removeItem('paynesuite_userId');
          window.location.href = buildAppUrl(3000, '/login');
        }}
      >
        <LogOut className="w-4 h-4" />
        <span className="font-semibold">Logout</span>
      </button>
    </div>
  );
}