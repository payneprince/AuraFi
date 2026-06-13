"use client";

import { Fragment, useState, useEffect } from "react";
import { ArrowDown, Shield, Users, Headphones, ChevronDown, Play, X } from "lucide-react";

const YT_ID = "S-ns66i-Lbc";

export function Hero() {
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    if (!demo) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDemo(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [demo]);
  return (
    <section className="relative min-h-[82vh] flex items-center justify-center overflow-hidden pt-16">

      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/hero-bg.mp4"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/75" />

      {/* Content */}
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 text-center z-10">

        {/* Badge */}
        <div className="hero-item" style={{ animationDelay: "0ms" }}>
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/85 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
            🇬🇭 Ghana&apos;s Financial Super-App
          </span>
        </div>

        {/* Heading */}
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 text-white leading-tight hero-item"
          style={{ animationDelay: "80ms" }}
        >
          Your Complete Financial Ecosystem
        </h1>

        {/* Subheading */}
        <p
          className="text-lg sm:text-xl text-white/65 mx-auto mb-10 leading-relaxed hero-item"
          style={{ animationDelay: "180ms" }}
        >
          Banking, investing, payments, and AI-powered insights — unified in one platform.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-wrap justify-center gap-4 mb-14 hero-item"
          style={{ animationDelay: "300ms" }}
        >
          <button
            onClick={() => window.location.href = '/login'}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-teal to-magenta text-white text-base font-bold shadow-lg shadow-teal/25 hover:opacity-90 hover:shadow-xl hover:shadow-teal/30 transition-[opacity,box-shadow] duration-200"
          >
            Get Started Free
          </button>
          <button
            onClick={() => setDemo(true)}
            className="px-8 py-3.5 rounded-full border border-white/30 text-white text-base font-semibold hover:bg-white/10 hover:border-white/50 transition-[background-color,border-color] duration-200 flex items-center gap-2"
          >
            <Play className="h-4 w-4 fill-white" /> Watch Demo
          </button>
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3.5 rounded-full border border-white/30 text-white text-base font-semibold hover:bg-white/10 hover:border-white/50 transition-[background-color,border-color] duration-200 flex items-center gap-2"
          >
            <ArrowDown className="h-4 w-4" /> How It Works
          </button>
        </div>

        {/* Trust strip */}
        <div
          className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 hero-item"
          style={{ animationDelay: "440ms" }}
        >
          {[
            { icon: Users,      label: "500K+ Users" },
            { icon: Shield,     label: "Bank-Level Security" },
            { icon: Headphones, label: "24/7 Support" },
          ].map(({ icon: Icon, label }, i) => (
            <Fragment key={label}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-teal flex-shrink-0" />
                <span className="text-white/70 text-sm font-medium">{label}</span>
              </div>
              {i < 2 && <span className="hidden sm:block w-1 h-1 rounded-full bg-white/20" />}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 hero-item" style={{ animationDelay: "700ms" }}>
        <span className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Scroll</span>
        <ChevronDown className="h-5 w-5 text-white/30 animate-bounce" />
      </div>

      <style jsx>{`
        @keyframes hero-rise {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-item {
          opacity: 0;
          animation: hero-rise 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      {/* YouTube lightbox */}
      {demo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setDemo(false)}
        >
          <div
            className="relative w-full max-w-4xl mx-4 aspect-video"
            onClick={e => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1`}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="w-full h-full rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setDemo(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors duration-150 flex items-center gap-1.5 text-sm"
            >
              <X className="h-5 w-5" /> Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
