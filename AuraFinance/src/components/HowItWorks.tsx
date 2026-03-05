'use client';

export function HowItWorks() {
  const steps = [
    { num: "1", title: "Sign Up Once", desc: "Create your Aura Finance account in minutes" },
    { num: "2", title: "Access Everything", desc: "All products unlock automatically with one login" },
    { num: "3", title: "Move Money Freely", desc: "Transfer between bank, wallet, and investments instantly" },
    { num: "4", title: "Get AI Insights", desc: "AuraAI learns and guides your financial decisions" }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Seamlessly Connected, Incredibly Powerful</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-magenta text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                {step.num}
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
