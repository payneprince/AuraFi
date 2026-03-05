'use client';

import { Shield, Lock, Eye, FileCheck, Bell, Award } from "lucide-react";

export function Security() {
  const features = [
    { icon: Shield, title: "256-bit Encryption", desc: "Bank-level security for all data" },
    { icon: Lock, title: "Two-Factor Auth", desc: "Extra layer of protection" },
    { icon: Eye, title: "Biometric Login", desc: "Fingerprint & Face ID" },
    { icon: Bell, title: "Fraud Monitoring", desc: "Real-time alerts 24/7" },
    { icon: FileCheck, title: "FDIC Insured", desc: "Up to $250,000 coverage" },
    { icon: Award, title: "ISO 27001 Certified", desc: "Industry-standard compliance" }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Your Security is Our Priority</h2>
          <p className="text-xl text-gray-300">We protect your money and data with industry-leading security</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-6">
                <Icon className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-300">{f.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <span>99.99% Uptime</span>
            <span>Zero Breaches</span>
            <span>24/7 Monitoring</span>
          </div>
        </div>
      </div>
    </section>
  );
}
