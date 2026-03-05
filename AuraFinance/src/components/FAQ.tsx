"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FAQ() {
  const faqs = [
    {
      question: "What is Aura Finance?",
      answer: "Aura Finance is a complete financial ecosystem that combines banking, investing, payments, and AI-powered insights in one platform. It includes AuraBank, AuraVest, AuraWallet, and AuraAI."
    },
    {
      question: "Is Aura Finance safe and secure?",
      answer: "Yes! We use bank-level 256-bit encryption, two-factor authentication, and biometric security. AuraBank accounts are FDIC insured up to $250,000, and we're ISO 27001 certified with 24/7 fraud monitoring."
    },
    {
      question: "How much does Aura Finance cost?",
      answer: "We offer a Free plan with full access to core features, a Plus plan at $9.99/month with unlimited trades and advanced AI, and a Premium plan at $24.99/month with dedicated support and premium research."
    },
    {
      question: "Can I transfer money between Aura Finance products?",
      answer: "Absolutely! Money flows seamlessly between AuraBank, AuraWallet, and AuraVest instantly with zero fees. It's all one connected ecosystem."
    },
    {
      question: "What cryptocurrencies can I trade?",
      answer: "AuraVest supports 50+ cryptocurrencies including Bitcoin, Ethereum, Solana, and many more. We add new coins regularly based on user demand."
    },
    {
      question: "Does AuraAI really work?",
      answer: "Yes! AuraAI uses advanced machine learning to analyze your spending patterns, investment portfolio, and financial goals. Users save an average of $2,400 annually with AI-powered insights."
    },
    {
      question: "How do I get started?",
      answer: "Simply sign up for a free account, verify your identity (takes 2 minutes), and you'll have instant access to all four Aura Finance products. No credit card required for the free plan."
    },
    {
      question: "Can I use Aura Finance internationally?",
      answer: "Yes! We support multi-currency accounts and international transfers in 150+ countries. Currency exchange rates are transparent with no hidden fees."
    },
    {
      question: "What's the difference between AuraWallet and AuraBank?",
      answer: "AuraBank offers traditional banking services like savings accounts, loans, and credit building. AuraWallet focuses on instant payments, P2P transfers, bill payments, and spending management."
    },
    {
      question: "Are there any hidden fees?",
      answer: "No! We believe in transparent pricing. The free plan has zero monthly fees. Paid plans have clear monthly costs with no surprises. We never charge overdraft fees or minimum balance fees."
    },
    {
      question: "How long do transfers take?",
      answer: "Internal transfers between Aura Finance products are instant. External bank transfers typically take 1-2 business days. Crypto transfers depend on blockchain confirmation times."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes! You can upgrade, downgrade, or cancel your subscription at any time with no penalties. If you cancel a paid plan, you'll keep access until the end of your billing period."
    },
    {
      question: "What kind of customer support do you offer?",
      answer: "Free users get 24/7 AI chat support and email support. Plus users get priority support. Premium users get a dedicated account manager plus 24/7 phone support."
    },
    {
      question: "Do you offer a mobile app?",
      answer: "Yes! Aura Finance is available on iOS, Android, and as a web app. All your data syncs seamlessly across devices."
    },
    {
      question: "What happens if I forget my password?",
      answer: "You can easily reset your password via email or SMS. For security, we also offer biometric login (fingerprint/Face ID) so you don't have to remember passwords."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground">Everything you need to know about Aura Finance</p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="glass rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
