"use client";

import { AnimatedCounter } from "./AnimatedCounter";
import { TrendingUp, Users, DollarSign, Globe } from "lucide-react";

export function Stats() {
  return (
    <section className="py-20 bg-gradient-to-br from-teal via-magenta to-purple">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center text-white">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <div className="text-5xl font-bold mb-2">
              <AnimatedCounter end={500} suffix="K+" />
            </div>
            <p className="text-lg opacity-90">Active Users</p>
          </div>

          <div className="text-center text-white">
            <DollarSign className="h-12 w-12 mx-auto mb-4" />
            <div className="text-5xl font-bold mb-2">
              $<AnimatedCounter end={1} suffix="B+" />
            </div>
            <p className="text-lg opacity-90">in Transactions</p>
          </div>

          <div className="text-center text-white">
            <TrendingUp className="h-12 w-12 mx-auto mb-4" />
            <div className="text-5xl font-bold mb-2">
              <AnimatedCounter end={4.8} suffix="/5" />
            </div>
            <p className="text-lg opacity-90">App Store Rating</p>
          </div>

          <div className="text-center text-white">
            <Globe className="h-12 w-12 mx-auto mb-4" />
            <div className="text-5xl font-bold mb-2">
              <AnimatedCounter end={20} suffix="+" />
            </div>
            <p className="text-lg opacity-90">Countries Served</p>
          </div>
        </div>
      </div>
    </section>
  );
}
