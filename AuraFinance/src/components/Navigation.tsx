"use client";

import { useState, useEffect } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { clearUnifiedAuthSession } from '../../../shared/unified-auth';

export function Navigation() {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');

    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/suite.jpeg"
              alt="Aura Finance Logo"
              width={80}
              height={32}
              className="object-contain rounded-lg"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#products" className="hover:text-teal transition">Products</Link>
            <Link href="/#features" className="hover:text-teal transition">Features</Link>
            <Link href="/#pricing" className="hover:text-teal transition">Pricing</Link>
            <Link href="/about" className="hover:text-teal transition">About</Link>
            <Link href="/blog" className="hover:text-teal transition">Blog</Link>
            <Link href="/contact" className="hover:text-teal transition">Contact</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            {session ? (
              <>
                <span className="px-4 py-2">Welcome, {session.user?.name ?? 'User'}</span>
                <button
                  onClick={() => {
                    clearUnifiedAuthSession();
                    signOut({ callbackUrl: '/' });
                  }}
                  className="px-4 py-2 hover:text-teal transition"
                >
                  Logout
                </button>
                <Link href="/dashboard" className="px-6 py-2 rounded-full bg-gradient-to-r from-teal to-magenta text-white hover:opacity-90">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <button onClick={() => signIn()} className="px-4 py-2 hover:text-teal transition">Login</button>
                <button onClick={() => signIn()} className="px-6 py-2 rounded-full bg-gradient-to-r from-teal to-magenta text-white hover:opacity-90">
                  Get Started Free
                </button>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/#products" className="block px-3 py-2">Products</Link>
            <Link href="/#features" className="block px-3 py-2">Features</Link>
            <Link href="/#pricing" className="block px-3 py-2">Pricing</Link>
            <Link href="/about" className="block px-3 py-2">About</Link>
            <Link href="/blog" className="block px-3 py-2">Blog</Link>
            <Link href="/contact" className="block px-3 py-2">Contact</Link>
            <div className="px-3 py-2 flex items-center justify-between">
              <span>Dark Mode</span>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
