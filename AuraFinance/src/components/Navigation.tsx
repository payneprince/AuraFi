"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { clearUnifiedAuthSession } from '../../../shared/unified-auth';

const NAV_LINKS = [
  { label: "Products",     href: "/#products",     id: "products"     },
  { label: "How It Works", href: "/#how-it-works", id: "how-it-works" },
  { label: "Features",     href: "/#features",     id: "features"     },
  { label: "Pricing",      href: "/#pricing",      id: "pricing"      },
  { label: "Contact",      href: "/#contact",      id: "contact"      },
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Observe each section and mark active when it enters the viewport
    const observers = NAV_LINKS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;

      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.25, rootMargin: "-64px 0px -35% 0px" }
      );
      observer.observe(el);
      return observer;
    });

    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050e1c]/90 backdrop-blur-md border-b border-white/8 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={() => setActiveSection("")}>
            <Image
              src="/images/suite.jpeg"
              alt="Aura Finance Logo"
              width={80}
              height={32}
              className="object-contain rounded-lg"
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map(({ label, href, id }) => {
              const isActive = activeSection === id;
              return (
                <Link
                  key={id}
                  href={href}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md ${
                    isActive
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {label}
                  {/* Teal underline dot for active */}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-white/60 text-sm">Welcome, {session.user?.name ?? 'User'}</span>
                <button
                  onClick={() => { clearUnifiedAuthSession(); signOut({ callbackUrl: '/' }); }}
                  className="text-sm text-white/60 hover:text-white transition"
                >
                  Logout
                </button>
                <Link href="/dashboard" className="px-5 py-2 rounded-full bg-gradient-to-r from-teal to-magenta text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <button onClick={() => signIn()} className="text-sm text-white/60 hover:text-white transition">
                  Login
                </button>
                <button
                  onClick={() => signIn()}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-teal to-magenta text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-white/80 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#050e1c] border-t border-white/8">
          <div className="px-3 pt-2 pb-4 space-y-1">
            {NAV_LINKS.map(({ label, href, id }) => (
              <Link
                key={id}
                href={href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === id
                    ? "text-white bg-white/8"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/8 mt-2">
              {session ? (
                <button
                  onClick={() => { clearUnifiedAuthSession(); signOut({ callbackUrl: '/' }); }}
                  className="w-full text-left px-3 py-2 text-sm text-white/60 hover:text-white"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-teal"
                >
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
