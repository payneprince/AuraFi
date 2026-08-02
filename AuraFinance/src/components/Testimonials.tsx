"use client";

const ROW_A = [
  { name: "Ella Mensah",    role: "Small Business Owner", text: "Aura Finance saved me $500 in fees by switching to AuraBank. The seamless integration between all products is incredible!" },
  { name: "John Abaka",     role: "Investor",             text: "I grew my portfolio 23% in my first year with AuraVest. The real-time analytics and low fees are unbeatable." },
  { name: "Prince Tackie",  role: "Freelancer",           text: "AuraAI helped me save $2,400 this year by optimizing my spending and finding better investment opportunities." },
  { name: "Michael Olise",   role: "Footballer",         text: "Managing payroll and personal savings from one dashboard changed everything. I can't imagine going back to separate apps." },
  { name: "Kweku Darko",    role: "Software Engineer",    text: "The AuraVest crypto tools are on par with dedicated exchanges, but I also get my banking right there. Incredible value." },
];

const ROW_B = [
  { name: "Mario Jay",      role: "Tech Professional",    text: "The AuraWallet QR payments feature is a game-changer. I use it daily for everything from coffee to rent." },
  { name: "Thomas Henaku",  role: "Lecturer",             text: "Finally, a financial platform that actually makes sense. Everything I need in one beautiful app." },
  { name: "Ama Owusu",      role: "Product Designer",     text: "The UI is genuinely beautiful — not just for a fintech app, but for any app. And it's fast. Seriously impressed." },
  { name: "Nana Boateng",   role: "Startup Founder",      text: "Real-time transfers between AuraBank and AuraWallet with zero fees have simplified my business cash flow dramatically." },
  { name: "Gifty Amponsah", role: "Finance Analyst",      text: "AuraAI's spending insights are eerily accurate. It flagged a subscription I forgot about within the first week." },
];

const trackA = [...ROW_A, ...ROW_A, ...ROW_A];
const trackB = [...ROW_B, ...ROW_B, ...ROW_B];

function Card({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <div className="inline-flex flex-col w-72 flex-shrink-0 mx-3 rounded-2xl border border-white/[0.08] bg-[#0d1b2a] p-5 group cursor-default
      hover:border-teal/35 hover:bg-[#0f2236] hover:-translate-y-2 hover:shadow-2xl hover:shadow-teal/20 hover:scale-[1.02]
      transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out will-change-transform">
      {/* Quote mark */}
      <div className="text-5xl font-serif leading-none text-teal/30 mb-2 select-none group-hover:text-teal/65 transition-colors duration-300">&ldquo;</div>
      {/* Text */}
      <p className="text-white/70 text-sm leading-relaxed flex-1 mb-4 group-hover:text-white/90 transition-colors duration-300">{text}</p>
      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className="w-3 h-3 text-amber-400 group-hover:text-amber-300 transition-colors duration-200"
            style={{ transitionDelay: `${i * 40}ms`, transform: "scale(1)" }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {/* Author */}
      <div className="flex items-center gap-2.5 translate-y-0 group-hover:-translate-y-0.5 transition-transform duration-300">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-magenta flex items-center justify-center text-white text-xs font-bold flex-shrink-0
          group-hover:shadow-md group-hover:shadow-teal/40 transition-shadow duration-300">
          {name[0]}
        </div>
        <div>
          <p className="text-white text-xs font-semibold leading-tight group-hover:text-teal transition-colors duration-300">{name}</p>
          <p className="text-white/40 text-[10px] group-hover:text-white/60 transition-colors duration-300">{role}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="relative py-8 overflow-hidden">

      {/* Video background */}
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" src="/videos/faq.mp4" />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-5">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal bg-teal/10 px-4 py-1.5 rounded-full mb-3">
          Testimonials
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white">Trusted by Thousands</h2>
        <p className="text-white/45 text-sm mt-2">Real people. Real results.</p>
      </div>

      {/* Row A — scrolls left */}
      <div className="relative w-full overflow-hidden py-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/70 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/70 to-transparent z-10" />
        <div
          className="flex items-stretch"
          style={{ animation: "marquee-left 45s linear infinite", willChange: "transform" }}
        >
          {trackA.map((t, i) => <Card key={i} {...t} />)}
        </div>
      </div>

      {/* Row B — scrolls right */}
      <div className="relative w-full overflow-hidden py-2 mt-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/70 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/70 to-transparent z-10" />
        <div
          className="flex items-stretch"
          style={{ animation: "marquee-right 45s linear infinite", willChange: "transform" }}
        >
          {trackB.map((t, i) => <Card key={i} {...t} />)}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-left {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-33.333%, 0, 0); }
        }
        @keyframes marquee-right {
          from { transform: translate3d(-33.333%, 0, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </section>
  );
}
