// src/components/UserProfileMenu.tsx
'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { signOut } from 'next-auth/react';
import { User, Settings, LogOut, CreditCard, HelpCircle, Bell, ChevronRight } from 'lucide-react';

interface UserProfileMenuProps {
  userName?: string;
  userEmail?: string;
}

// Portal component for menu rendering
function MenuPortal({ children, isOpen }: { children: ReactNode; isOpen: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div>{children}</div>,
    document.body
  );
}

export default function UserProfileMenu({ userName = 'User', userEmail = 'user@aurafinance.com' }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedButton = buttonRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);

      if (!clickedButton && !clickedMenu) {
        setIsOpen(false);
        setShowSettings(false);
      }
    }

    if (isOpen) {
      setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Calculate position for dropdown
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  const mainMenuItems = [
    { icon: User, label: 'Profile', action: () => { setIsOpen(false); } },
    { icon: Settings, label: 'Settings', action: () => setShowSettings(true) },
    { icon: Bell, label: 'Notifications', action: () => { setIsOpen(false); } },
  ];

  const settingsMenuItems = [
    { icon: CreditCard, label: 'Billing', href: '/billing' },
    { icon: HelpCircle, label: 'Help & Support', href: '/help' },
  ];

  return (
    <>
      {/* Profile Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="User menu"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-magenta flex items-center justify-center text-white font-bold shadow-sm">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
      </button>

      {/* Dropdown Menu - Portal Version */}
      <MenuPortal isOpen={isOpen}>
        <div
          ref={menuRef}
          className="fixed w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-[99999]"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>

          {/* Main Menu or Settings Submenu */}
          {!showSettings ? (
            <>
              {/* Main Menu Items */}
              <div className="py-2">
                {mainMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="flex items-center justify-between gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{item.label}</span>
                      </div>
                      {item.label === 'Settings' && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>

              {/* Logout Button */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
                <button
                  onClick={async () => {
                    setIsOpen(false);
                    try {
                      const result = await signOut({ redirect: false, callbackUrl: '/' });
                      window.location.href = result?.url || '/';
                    } catch {
                      window.location.href = '/';
                    }
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/5 dark:hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Settings Submenu Header */}
              <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                >
                  ← Back
                </button>
              </div>

              {/* Settings Menu Items */}
              <div className="py-2">
                {settingsMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </MenuPortal>
    </>
  );
}
