"use client";

export function Testimonials() {
  const testimonials = [
    { name: "Ella Mensah.", role: "Small Business Owner", text: "Aura Finance saved me $500 in fees by switching to AuraBank. The seamless integration between all products is incredible!", rating: 5 },
    { name: "John Abaka", role: "Investor", text: "I grew my portfolio 23% in my first year with AuraVest. The real-time analytics and low fees are unbeatable.", rating: 5 },
    { name: "Prince Tackie", role: "Freelancer", text: "AuraAI helped me save $2,400 this year by optimizing my spending and finding better investment opportunities.", rating: 5 },
    { name: "Mario Jay", role: "Tech Professional", text: "The AuraWallet QR payments feature is a game-changer. I use it daily for everything from coffee to rent.", rating: 5 },
    { name: "Thomas Henaku", role: "Lecturer", text: "Finally, a financial platform that actually makes sense. Everything I need in one beautiful app.", rating: 5 }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Trusted by Thousands</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass rounded-xl p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal to-magenta flex items-center justify-center text-white font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
