'use client';

import { useState, useEffect } from 'react';
import { getUser } from '@/lib/shared/mock-data';
import { getBankInsights } from '@/lib/shared/payneai-core';
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
  FileText,
  File,
  Wallet,
  TrendingUp,
  PiggyBank,
  User,
} from 'lucide-react';

type PageType = 'home' | 'accounts' | 'transactions' | 'bills' | 'cards' | 'budget' | 'investments' | 'profile';

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userIdNum, setUserIdNum] = useState(1);

  useEffect(() => {
    const userId = parseInt(sessionStorage.getItem('userId') || '1');
    setUserIdNum(userId);
  }, []);

  const userData = getUser(userIdNum.toString());
  const user = userData;
  const accounts = userData?.bank.accounts || [];
  const insights = getBankInsights(userIdNum);

  const navigation = [
    { id: 'home', name: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'accounts', name: 'Accounts', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'investments', name: 'Investments', icon: <PiggyBank className="w-5 h-5" /> },
    { id: 'transactions', name: 'Transfer', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'bills', name: 'Bills', icon: <File className="w-5 h-5" /> },
    { id: 'cards', name: 'Cards', icon: <Wallet className="w-5 h-5" /> },
    { id: 'budget', name: 'Budget', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'profile', name: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <DashboardHome userId={userIdNum} />;
      case 'accounts':
        return <AccountsPage userId={userIdNum} />;
      case 'transactions':
        return <TransactionsPage userId={userIdNum} />;
      case 'bills':
        return <BillsPage />;
      case 'cards':
        return <CardsPage />;
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
    <div className="flex h-screen bg-navy-900">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-navy-800 border-b border-navy-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-light">
                {navigation.find(n => n.id === currentPage)?.name}
              </h1>
              <p className="text-sm text-text-light/80 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* AI Insights */}
              <div className="text-right">
                <p className="text-sm font-semibold text-text-light">AuraAI</p>
                <p className="text-xs text-text-light/70">{insights.insights[0]}</p>
              </div>

              {/* User Menu */}
<div className="flex items-center space-x-3 border-l border-navy-700 pl-4">
  <div className="text-right">
    <p className="text-sm font-semibold text-text-light">{user?.name}</p>
    <p className="text-xs text-text-light/70">{user?.email}</p>
  </div>
  <button
    onClick={() => setCurrentPage('profile')}
    className="w-10 h-10 bg-gradient-to-br from-magenta-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold hover:opacity-90 transition cursor-pointer"
    title="View Profile"
  >
    {user?.name?.charAt(0)}
  </button>
</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 hide-scrollbar">
          {renderPage()}
        </main>
      </div>

      {/* AuraAI Chat */}
      <AuraAIChat />
    </div>
  );
}