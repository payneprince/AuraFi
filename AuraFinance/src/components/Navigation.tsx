"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { clearUnifiedAuthSession } from '../../../shared/unified-auth';

export function Navigation() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Force light mode — remove any previously saved dark preference
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

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
            <Link href="/#products"    className="hover:text-teal transition text-sm font-medium">Products</Link>
            <Link href="/#how-it-works" className="hover:text-teal transition text-sm font-medium">How It Works</Link>
            <Link href="/#features"    className="hover:text-teal transition text-sm font-medium">Features</Link>
            <Link href="/#pricing"     className="hover:text-teal transition text-sm font-medium">Pricing</Link>
            <Link href="/#contact"     className="hover:text-teal transition text-sm font-medium">Contact</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <>
                <span className="px-4 py-2 text-sm">Welcome, {session.user?.name ?? 'User'}</span>
                <button
                  onClick={() => { clearUnifiedAuthSession(); signOut({ callbackUrl: '/' }); }}
                  className="px-4 py-2 text-sm hover:text-teal transition"
                >
                  Logout
                </button>
                <Link href="/dashboard" className="px-6 py-2 rounded-full bg-gradient-to-r from-teal to-magenta text-white text-sm font-semibold hover:opacity-90">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <button onClick={() => signIn()} className="px-4 py-2 text-sm hover:text-teal transition">Login</button>
                <button onClick={() => signIn()} className="px-6 py-2 rounded-full bg-gradient-to-r from-teal to-magenta text-white text-sm font-semibold hover:opacity-90">
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
            <Link href="/#products"     className="block px-3 py-2 text-sm" onClick={() => setOpen(false)}>Products</Link>
            <Link href="/#how-it-works" className="block px-3 py-2 text-sm" onClick={() => setOpen(false)}>How It Works</Link>
            <Link href="/#features"     className="block px-3 py-2 text-sm" onClick={() => setOpen(false)}>Features</Link>
            <Link href="/#pricing"      className="block px-3 py-2 text-sm" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/#contact"      className="block px-3 py-2 text-sm" onClick={() => setOpen(false)}>Contact</Link>
            <div className="px-3 py-2 border-t border-gray-100 mt-2">
              {session ? (
                <button onClick={() => { clearUnifiedAuthSession(); signOut({ callbackUrl: '/' }); }} className="w-full text-left text-sm hover:text-teal transition">
                  Logout
                </button>
              ) : (
                <button onClick={() => signIn()} className="w-full text-left text-sm font-semibold text-teal">
                  Get Started Free →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
