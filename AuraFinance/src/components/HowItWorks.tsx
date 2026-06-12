'use client';

import { useEffect, useRef, useState } from "react";

const STEPS = [
  { num: "01", title: "Sign Up Once",       desc: "Create your Aura Finance account in minutes" },
  { num: "02", title: "Access Everything",  desc: "All products unlock automatically with one login" },
  { num: "03", title: "Move Money Freely",  desc: "Transfer between bank, wallet, and investments instantly" },
  { num: "04", title: "Get AI Insights",    desc: "AuraAI learns and guides your financial decisions" },
];

export function HowItWorks() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} id="how-it-works" className="relative py-14 overflow-hidden bg-gradient-to-b from-[#050e1c] via-[#0b1e38] to-slate-50">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[300px] bg-teal/[0.06] blur-[80px] rounded-full" />
      </div>

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className={`text-center mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal bg-teal/10 px-4 py-1.5 rounded-full mb-3">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Seamlessly Connected,{" "}
            <span className="bg-gradient-to-r from-teal to-magenta bg-clip-text text-transparent">
              Incredibly Powerful
            </span>
          </h2>
        </div>

        {/* Steps grid */}
        <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-teal/10 via-teal/30 to-teal/10" />
          {/* Connector dots */}
          {[37.5, 62.5].map((pct) => (
            <div
              key={pct}
              className="hidden lg:block absolute top-[36px] w-2 h-2 rounded-full bg-teal/40 border border-teal/60 -translate-x-1/2"
              style={{ left: `${pct}%` }}
            />
          ))}

          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex flex-col items-center text-center transition-all duration-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${i * 130}ms` }}
            >
              {/* Number circle with pulse */}
              <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
                {/* Slow pulse ring */}
                <div
                  className="absolute inset-0 rounded-full bg-teal/15"
                  style={{ animation: visible ? `step-pulse 2.8s ease-out infinite ${i * 300}ms` : "none" }}
                />
                {/* Static outer ring */}
                <div className="absolute inset-0 rounded-full border border-teal/20" />
                {/* Gradient circle */}
                <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-teal to-magenta flex items-center justify-center shadow-lg shadow-teal/25">
                  <span className="text-white font-black text-base tracking-tight">{step.num}</span>
                </div>
              </div>

              {/* Card */}
              <div className="w-full rounded-2xl border border-gray-200/70 bg-white px-5 py-5 shadow-sm hover:border-teal/40 hover:shadow-lg hover:shadow-teal/10 hover:-translate-y-1 transition-[transform,box-shadow,border-color] duration-200 group will-change-transform">
                <h3 className="text-gray-900 font-bold text-base mb-2 group-hover:text-teal transition-colors duration-200">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes step-pulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          60%  { transform: scale(1.7); opacity: 0;   }
          100% { transform: scale(1.7); opacity: 0;   }
        }
      `}</style>
    </section>
  );
}
