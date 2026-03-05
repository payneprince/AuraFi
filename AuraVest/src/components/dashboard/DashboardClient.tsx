'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Home,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  Menu,
  Sun,
  Moon,
  LogOut,
  BookOpen,
} from 'lucide-react';
import DashboardHome from './DashboardHome';
import MarketsPage from './MarketsPage';
import PortfolioPage from './PortfolioPage';
import TradePage from './TradePage';
import MorePage from './MorePage';
import LearnPage from './LearnPage';
import AuraAIChat from '@/components/AuraAIChat';

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<'home' | 'markets' | 'portfolio' | 'trade' | 'more' | 'learn'>('home');
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('auravest_dark_mode') === 'true';
      setDarkMode(savedDarkMode);
      if (savedDarkMode) document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('auravest_dark_mode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('auravest_user');
    localStorage.removeItem('auravest_portfolio');
    // Since there's no login page, just reload the page
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="grid grid-cols-5 gap-1 p-2">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'markets', label: 'Markets', icon: TrendingUp },
            { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
            { id: 'portfolio', label: 'Portfolio', icon: Wallet },
            { id: 'more', label: 'More', icon: Menu },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-black to-crimson-600 text-white'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10">
              <Image
                src="/logo.jpeg"
                alt="AuraVest Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AuraVest</h1>
              <p className="text-xs text-muted-foreground">Invest Smarter, Grow Stronger</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'markets', label: 'Markets', icon: TrendingUp },
            { id: 'portfolio', label: 'Portfolio', icon: Wallet },
            { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
            
            { id: 'more', label: 'More', icon: Menu },
            { id: 'learn', label: 'Learn', icon: BookOpen },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-black to-crimson-600 text-white'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-sm font-medium">Theme</span>
            <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded">
              {darkMode ? 'Dark' : 'Light'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
        {activeTab === 'home' && <DashboardHome />}
        {activeTab === 'markets' && <MarketsPage />}
        {activeTab === 'portfolio' && <PortfolioPage />}
        {activeTab === 'trade' && <TradePage />}
        
        {activeTab === 'more' && <MorePage />}
        {activeTab === 'learn' && <LearnPage />}
      </main>

      <AuraAIChat />
    </div>
  );
}
