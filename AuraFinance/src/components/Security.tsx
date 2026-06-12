'use client';

import { Shield, Lock, Eye, FileCheck, Bell, Award } from "lucide-react";

const FEATURES = [
  { icon: Shield,    title: "256-bit Encryption",  desc: "Military-grade encryption across every transaction and data point." },
  { icon: Lock,      title: "Two-Factor Auth",      desc: "Multiple identity verification layers on every login attempt." },
  { icon: Eye,       title: "Biometric Login",      desc: "Fingerprint & Face ID so you never need to type a password." },
  { icon: Bell,      title: "Fraud Monitoring",     desc: "AI scans every transaction in real time and alerts you instantly." },
  { icon: FileCheck, title: "FDIC Insured",         desc: "Your deposits are protected up to $250,000 by federal insurance." },
  { icon: Award,     title: "ISO 27001 Certified",  desc: "Globally recognised information security management standard." },
];

const STATS = [
  { value: "99.99%", label: "Uptime SLA" },
  { value: "$250K",  label: "FDIC Coverage" },
  { value: "0",      label: "Data Breaches" },
  { value: "24/7",   label: "Threat Monitoring" },
];

export function Security() {
  return (
    <section className="relative py-14 overflow-hidden bg-[#060d1a]">
      {/* Subtle white touch overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-white/[0.09]" />
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[300px] bg-teal/10 rounded-full blur-[80px] opacity-50" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-teal bg-teal/10 px-3 py-1 rounded-full mb-3">
            <Shield size={11} /> Security
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Your Security is Our Priority</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            We protect your money and data with the same infrastructure used by the world's leading banks.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center rounded-xl bg-white/[0.04] border border-white/8 py-4">
              <p className="text-2xl font-extrabold text-white">{value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Feature cards with gradient border */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-px bg-gradient-to-b from-white/10 to-white/[0.02]">
              <div className="rounded-2xl bg-[#080f1e] px-5 py-4 h-full flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={18} className="text-teal" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight mb-1">{title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
