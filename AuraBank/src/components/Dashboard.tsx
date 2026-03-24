'use client';

import { useState, useEffect, useRef } from 'react';
import { getUser } from '@/lib/shared/mock-data';
import DashboardHome from './dashboard/DashboardHome';
import AccountsPage from './dashboard/AccountsPage';
import TransactionsPage from './dashboard/TransactionsPage';
import BillsPage from './dashboard/BillsPage';
import CardsPage from './dashboard/CardsPage';
import BudgetPage from './dashboard/BudgetPage';
import InvestmentsPage from './dashboard/InvestmentsPage';
import ProfilePage from './dashboard/ProfilePage';
import AuraAIChat from './AuraAIChat';
import {
  BarChart3,
  ArrowLeftRight,
  CreditCard,
  File,
  Wallet,
  TrendingUp,
  PiggyBank,
  User,
  LayoutGrid,
  Moon,
  Sun,
} from 'lucide-react';
import { subscribeUnifiedAuthSession } from '../../../shared/unified-auth';
import { useAuth } from '@/contexts/AuthContext';

type PageType = 'home' | 'accounts' | 'transactions' | 'bills' | 'cards' | 'budget' | 'investments' | 'profile';

export default function Dashboard() {
  const { theme, setTheme } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userIdNum, setUserIdNum] = useState(1);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);
  const appSwitcherRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const userId = parseInt(sessionStorage.getItem('userId') || '1');
    setUserIdNum(userId);
  }, []);

  const userData = getUser(userIdNum.toString());
  const user = userData;

  const buildAppUrl = (port: number, path = '') => {
    if (typeof window === 'undefined') return `http://localhost:${port}${path}`;
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:${port}${path}`;
  };

  useEffect(() => {
    return subscribeUnifiedAuthSession((session) => {
      if (session) return;
      sessionStorage.removeItem('userId');
      localStorage.removeItem('aurabank_user');
      window.location.href = buildAppUrl(3000, '/login');
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!appSwitcherRef.current) return;
      if (appSwitcherRef.current.contains(event.target as Node)) return;
      setAppSwitcherOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigation = [
    { id: 'home', name: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'accounts', name: 'Accounts', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'investments', name: 'Investments', icon: <PiggyBank className="w-5 h-5" /> },
    { id: 'transactions', name: 'Transfer', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'bills', name: 'Bills', icon: <File className="w-5 h-5" /> },
    { id: 'cards', name: 'Cards', icon: <Wallet className="w-5 h-5" /> },
    { id: 'budget', name: 'Budget', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'profile', name: 'Settings', icon: <User className="w-5 h-5" /> },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'accounts':
        return <AccountsPage userId={userIdNum} />;
      case 'transactions':
        return <TransactionsPage userId={userIdNum} />;
      case 'bills':
        return <BillsPage userId={userIdNum} />;
      case 'cards':
        return <CardsPage userId={userIdNum} />;
      case 'budget':
        return <BudgetPage />;
      case 'investments':
        return <InvestmentsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <DashboardHome userId={userIdNum} />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-navy-800 via-navy-900 to-navy-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-navy-800 border-r border-navy-700 transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-navy-700">
          <div className="flex items-center justify-between">
            <div className={`flex flex-col items-start space-y-1 ${!sidebarOpen && 'items-center'}`}>
              <div className="flex items-center space-x-3">
                <img src="/dblogo.jpg" alt="Payne Bank" className="w-11 h-11 rounded-xl" />
                {sidebarOpen && (
                  <div className="text-left">
                    <span className="text-xl font-bold text-text-light">AuraBank</span>
                    <p className="text-xs text-text-light/70 mt-1">Secure. Simple. Seamless.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as PageType)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-magenta-500 to-teal-500 text-white shadow-lg'
                  : 'text-text-light hover:bg-navy-700'
              } ${!sidebarOpen && 'justify-center'}`}
            >
              {item.icon}
              {sidebarOpen && <span className="font-medium">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center px-4 py-2 text-text-light hover:bg-navy-700 rounded-lg transition-all"
          >
            <svg className={`w-5 h-5 transition-transform ${!sidebarOpen && 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Header */}
        <header className="bg-navy-800/70 backdrop-blur-sm px-8 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-light">
                {navigation.find(n => n.id === currentPage)?.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div ref={appSwitcherRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAppSwitcherOpen((prev) => !prev)}
                  className="inline-flex items-center justify-center w-10 h-10 bg-navy-700 border border-navy-600 text-text-light rounded-lg hover:bg-navy-600 transition-colors"
                  aria-label="Open app switcher"
                  aria-expanded={appSwitcherOpen}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>

                {appSwitcherOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border border-navy-600 bg-navy-800/95 backdrop-blur-sm shadow-xl overflow-hidden z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setAppSwitcherOpen(false);
                        window.open(buildAppUrl(3000, '/dashboard'), '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-text-light hover:bg-navy-700"
                    >
                      AuraFinance
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAppSwitcherOpen(false);
                        window.open(buildAppUrl(3002), '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-text-light hover:bg-navy-700"
                    >
                      AuraVest
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAppSwitcherOpen(false);
                        window.open(buildAppUrl(3003), '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-text-light hover:bg-navy-700"
                    >
                      AuraWallet
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex items-center justify-center w-10 h-10 bg-navy-700 border border-navy-600 text-text-light rounded-lg hover:bg-navy-600 transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-8 pb-8 pt-2 hide-scrollbar">
          {renderPage()}
        </main>
      </div>

      {/* AuraAI Chat */}
      <AuraAIChat />
    </div>
  );
}
