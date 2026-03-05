"use client";

import { Play, ArrowDown, Shield, Users, Headphones, DollarSign, TrendingUp, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/images/hsbg.jpg)' }} />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center z-10">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
          Your Complete <span className="gradient-text drop-shadow-lg">Financial Ecosystem</span>
        </h1>

        <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Banking, Investing, Payments, and AI-Powered Insights - All in One Place
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <button className="px-8 py-4 rounded-full bg-gradient-to-r from-teal to-magenta text-white text-lg font-semibold hover:opacity-90 hover:shadow-xl transition-all duration-300 shadow-lg">
            Get Started Free
          </button>
          <button className="px-8 py-4 rounded-full border-2 border-white/20 text-lg font-semibold hover:bg-white/10 hover:shadow-lg transition-all duration-300 flex items-center gap-2 backdrop-blur-sm">
            <Play className="h-5 w-5" /> Watch Demo
          </button>
          <button className="px-8 py-4 rounded-full border-2 border-white/20 text-lg font-semibold hover:bg-white/10 hover:shadow-lg transition-all duration-300 flex items-center gap-2 backdrop-blur-sm">
            <ArrowDown className="h-5 w-5" /> See How It Works
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto animate-scale-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Users className="h-6 w-6 text-teal" />
            <span className="font-semibold text-lg">500K+ Users Trust Aura Finance</span>
          </div>
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Shield className="h-6 w-6 text-magenta" />
            <span className="font-semibold text-lg">Bank-Level Security</span>
          </div>
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Headphones className="h-6 w-6 text-purple" />
            <span className="font-semibold text-lg">24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  );
}
