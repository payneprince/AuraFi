'use client';

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Send } from "lucide-react";

const SOCIAL: { href: string; label: string; svg: React.ReactNode }[] = [
  {
    href: '#', label: 'Twitter / X',
    svg: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    href: '#', label: 'LinkedIn',
    svg: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  },
  {
    href: '#', label: 'Instagram',
    svg: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  },
  {
    href: '#', label: 'GitHub',
    svg: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>,
  },
];

const LINKS = {
  Products: [
    { label: 'AuraBank',   href: 'http://localhost:3001' },
    { label: 'AuraVest',   href: 'http://localhost:3002' },
    { label: 'AuraWallet', href: 'http://localhost:3003' },
    { label: 'AuraAI',     href: '#' },
  ],
  Company: [
    { label: 'About Us',     href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Pricing',      href: '/#pricing' },
    { label: 'Careers',      href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy',   href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Security',         href: '#' },
    { label: 'Cookie Policy',    href: '#' },
  ],
};

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <footer id="contact" className="bg-[#050e1c] relative overflow-hidden">

      {/* Teal top border */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-teal to-transparent opacity-60" />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-teal/[0.05] blur-[80px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-5">

        {/* Newsletter banner */}
        <div className="rounded-2xl p-px bg-gradient-to-r from-teal/30 via-magenta/20 to-teal/10 mb-8">
          <div className="rounded-2xl bg-white/[0.03] px-6 py-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-magenta flex items-center justify-center">
                <Send className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">Stay in the loop</p>
                <p className="text-white/40 text-xs">Updates, tips & early access</p>
              </div>
            </div>
            {subscribed ? (
              <p className="text-emerald-400 text-sm font-medium sm:ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> You&apos;re subscribed!
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 sm:w-52 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/25 outline-none focus:border-teal/50 transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal to-magenta text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  Subscribe <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">

          {/* Brand column */}
          <div className="col-span-2 flex flex-col gap-4">
            <div>
              <Image
                src="/images/suite.jpeg"
                alt="Aura Finance"
                width={80}
                height={32}
                className="object-contain rounded-lg mb-3"
              />
              <p className="text-white/35 text-xs leading-relaxed max-w-[210px]">
                Banking, investing, payments & AI — all in one ecosystem built for the future of finance.
              </p>
            </div>

            {/* Social icons */}
            <div className="flex gap-2">
              {SOCIAL.map(({ svg, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 hover:border-white/20 transition-[color,background-color,border-color] duration-200"
                >
                  {svg}
                </a>
              ))}
            </div>

            {/* App badges */}
            <div className="flex gap-2 items-center">
              <a href="#" className="group opacity-45 hover:opacity-80 transition-opacity duration-200">
                <Image src="/images/app-store-badge.svg" alt="App Store" width={100} height={30} className="h-7 w-auto" />
              </a>
              <a href="#" className="group opacity-45 hover:opacity-80 transition-opacity duration-200">
                <Image src="/images/google-play-badge.svg" alt="Google Play" width={100} height={30} className="h-7 w-auto" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="text-white/60 font-bold text-[10px] uppercase tracking-[0.15em] mb-3.5">{heading}</h4>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-white/30 text-xs hover:text-white/80 transition-colors duration-200 flex items-center gap-1 group"
                    >
                      <span className="w-0 group-hover:w-1.5 h-px bg-teal transition-[width] duration-200 overflow-hidden" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-4" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-white/20 text-[11px]">
          <p>© {new Date().getFullYear()} Aura Finance. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
              PWA Ready
            </span>
            <span className="text-white/10">|</span>
            <span>Demo Platform</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
