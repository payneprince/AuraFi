"use client";

import { AnimatedCounter } from "./AnimatedCounter";
import { TrendingUp, Users, DollarSign, Globe } from "lucide-react";

export function Stats() {
  return (
    <section className="py-6 bg-gradient-to-br from-teal via-magenta to-purple">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center text-white">
            <Users className="h-5 w-5 mx-auto mb-1.5 opacity-80" />
            <div className="text-2xl font-bold mb-0.5">
              <AnimatedCounter end={500} suffix="K+" />
            </div>
            <p className="text-xs opacity-75">Active Users</p>
          </div>

          <div className="text-center text-white">
            <DollarSign className="h-5 w-5 mx-auto mb-1.5 opacity-80" />
            <div className="text-2xl font-bold mb-0.5">
              <AnimatedCounter end={1} prefix="$" suffix="B+" />
            </div>
            <p className="text-xs opacity-75">in Transactions</p>
          </div>

          <div className="text-center text-white">
            <TrendingUp className="h-5 w-5 mx-auto mb-1.5 opacity-80" />
            <div className="text-2xl font-bold mb-0.5">
              <AnimatedCounter end={4.8} suffix="/5" />
            </div>
            <p className="text-xs opacity-75">App Store Rating</p>
          </div>

          <div className="text-center text-white">
            <Globe className="h-5 w-5 mx-auto mb-1.5 opacity-80" />
            <div className="text-2xl font-bold mb-0.5">
              <AnimatedCounter end={20} suffix="+" />
            </div>
            <p className="text-xs opacity-75">Countries Served</p>
          </div>
        </div>
      </div>
    </section>
  );
}
