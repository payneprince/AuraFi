'use client';

import { useState, useEffect } from 'react';
import { Menu, X, DollarSign, TrendingUp, Zap, CreditCard, Brain, Headset, Play, Star, Users, Activity, Shield, Lock, Fingerprint, Eye, CheckCircle, Building2, ShieldCheck, ChevronDown, User } from 'lucide-react';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isLoginModalOpen || isSignupModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isLoginModalOpen, isSignupModalOpen]);

  const stats = [
    { icon: Users, value: '500K+', label: 'Users', color: '#40C9C9' },
    { icon: Star, value: '4.9★', label: 'Rating', color: '#A8E6CF' },
    { icon: DollarSign, value: '$2.5B', label: 'Deposits', color: '#D91E78' },
    { icon: Activity, value: '99.99%', label: 'Uptime', color: '#40C9C9' },
  ];

  const features = [
    {
      icon: DollarSign,
      title: 'No Hidden Fees',
      description: 'No monthly fees, no minimum balance, no overdraft fees. Keep more of your money.',
      color: '#40C9C9',
    },
    {
      icon: TrendingUp,
      title: '4.5% APY Savings',
      description: 'Industry-leading interest rates on your savings. Watch your money grow automatically.',
      color: '#A8E6CF',
    },
    {
      icon: Zap,
      title: 'Lightning Fast Transfers',
      description: 'Send and receive money instantly. No waiting, no delays, just instant transactions.',
      color: '#D91E78',
    },
    {
      icon: CreditCard,
      title: 'Virtual & Physical Cards',
      description: 'Create unlimited virtual cards for secure online shopping. Physical card shipped free.',
      color: '#40C9C9',
    },
    {
      icon: Brain,
      title: 'Smart Budgeting',
      description: 'Automated budgeting, spending analysis, and personalized saving tips from PayneAI.',
      color: '#D91E78',
    },
    {
      icon: Headset,
      title: 'Always Here for You',
      description: 'Real human support when you need it. AI assistance available 24/7 for quick questions.',
      color: '#A8E6CF',
    },
  ];

  const steps = [
    {
      number: '01',
      icon: User,
      title: 'Create Your Account',
      description: 'Sign up in under 3 minutes. Just your email, phone, and basic info.',
      color: '#D91E78',
    },
    {
      number: '02',
      icon: ShieldCheck,
      title: 'Quick Verification',
      description: 'Verify your identity securely. We use bank-level encryption to protect your data.',
      color: '#40C9C9',
    },
    {
      number: '03',
      icon: CheckCircle,
      title: "You're All Set!",
      description: 'Fund your account and start enjoying modern banking. Free card ships in 3-5 days.',
      color: '#A8E6CF',
    },
  ];

  const securityFeatures = [
    { icon: Lock, title: '256-bit Encryption', description: 'Bank-level encryption protects every transaction', color: '#D91E78' },
    { icon: Fingerprint, title: 'Biometric Login', description: 'Face ID and fingerprint authentication', color: '#40C9C9' },
    { icon: Shield, title: 'Two-Factor Auth', description: 'Extra layer of security for your account', color: '#A8E6CF' },
    { icon: Eye, title: 'Fraud Monitoring', description: 'AI-powered fraud detection 24/7', color: '#D91E78' },
    { icon: Building2, title: 'FDIC Insured', description: 'Your deposits insured up to $250,000', color: '#40C9C9' },
    { icon: ShieldCheck, title: 'Zero Liability', description: 'Never liable for unauthorized charges', color: '#A8E6CF' },
    { icon: CreditCard, title: 'Secure Cards', description: 'Instant freeze/unfreeze from your phone', color: '#D91E78' },
    { icon: Lock, title: 'Data Privacy', description: 'Your data is never sold or shared', color: '#40C9C9' },
  ];

  const faqs = [
    {
      question: 'Is AuraBank really free?',
      answer: 'Yes! AuraBank has no monthly fees, no minimum balance requirements, and no overdraft fees. We believe banking should be accessible to everyone.',
    },
    {
      question: 'How is my money protected?',
      answer: 'Your deposits are FDIC insured up to $250,000. We use bank-level 256-bit encryption, two-factor authentication, and 24/7 fraud monitoring to keep your money safe.',
    },
    {
      question: 'How do I deposit money?',
      answer: 'You can deposit money through direct deposit, mobile check deposit, bank transfers, or at any of our 55,000+ partner ATMs nationwide.',
    },
    {
      question: 'Can I use AuraBank if I have bad credit?',
      answer: 'Absolutely! Opening a AuraBank account does not require a credit check. We believe everyone deserves access to modern banking.',
    },
    {
      question: 'What ATMs can I use?',
      answer: 'You have access to 55,000+ fee-free ATMs nationwide. Use our app to find the nearest one.',
    },
    {
      question: 'How long does it take to open an account?',
      answer: 'Most accounts are opened in under 3 minutes! Just provide some basic information and verify your identity.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img src="/dblogo.jpg" alt="PayneBank Logo" className="w-8 h-8 object-contain" />
              <div>
                <div className="text-white font-bold text-xl">AuraBank</div>
                <div className="text-slate-400 text-xs">Secure. Simple. Seamless.</div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white hover:text-cyan-400 transition-colors">Features</a>
              <a href="#security" className="text-white hover:text-cyan-400 transition-colors">Security</a>
              <a href="#how-it-works" className="text-white hover:text-cyan-400 transition-colors">How It Works</a>
              <a href="#faq" className="text-white hover:text-cyan-400 transition-colors">FAQ</a>
            </div>

            {/* Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="text-white border border-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-400/10 transition-all hover:shadow-lg hover:shadow-cyan-400/20"
              >
                Login
              </button>
              <button
                onClick={() => setIsSignupModalOpen(true)}
                className="bg-gradient-to-r from-pink-500 to-cyan-400 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-pink-500/25 transition-all transform hover:-translate-y-0.5"
              >
                Open Account
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-700">
              <div className="px-4 py-4 space-y-4">
                <a href="#features" className="block text-white hover:text-cyan-400">Features</a>
                <a href="#security" className="block text-white hover:text-cyan-400">Security</a>
                <a href="#how-it-works" className="block text-white hover:text-cyan-400">How It Works</a>
                <a href="#faq" className="block text-white hover:text-cyan-400">FAQ</a>
                <div className="flex space-x-4 pt-4">
                  <button 
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-white border border-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-400/10"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsSignupModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-gradient-to-r from-pink-500 to-cyan-400 text-white px-4 py-2 rounded-lg"
                  >
                    Open Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-cyan-400/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-green-400/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6">
                Banking Built for<br />
                <span className="bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">
                  Tomorrow
                </span>
              </h1>
              <p className="text-xl text-slate-400 mb-8">
                Experience banking without limits. Zero fees, instant transfers, and intelligent insights to help you save more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <button
                  onClick={() => setIsSignupModalOpen(true)}
                  className="bg-gradient-to-r from-pink-500 to-cyan-400 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all transform hover:-translate-y-1 hover:scale-105"
                >
                  Open Free Account
                </button>
                <button className="border border-cyan-400 text-white px-8 py-4 rounded-lg font-semibold hover:bg-cyan-400/10 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                  <Play size={20} />
                  Watch Demo
                </button>
              </div>
              <p className="text-slate-400 text-sm">
                Join 100,000+ users who trust AuraBank | FDIC Insured up to $250,000
              </p>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="relative">
                {/* Realistic Phone Frame */}
                <div className="w-80 h-[600px] mx-auto relative">
                  {/* Phone Body */}
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] border-4 border-slate-700 shadow-2xl relative overflow-hidden">
                    {/* Screen */}
                    <div className="w-full h-full bg-black rounded-[2rem] relative overflow-hidden">
                      {/* Status Bar */}
                      <div className="absolute top-0 left-0 right-0 h-6 bg-black flex items-center justify-between px-4 pt-1 z-10">
                        <div className="text-white text-xs"></div>
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>

                      {/* App Content */}
                      <div className="p-6 pt-10">
                        {/* App Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <img src="/dblogo.jpg" alt="AuraBank" className="w-8 h-8 object-contain" />
                            <div>
                              <div className="text-white text-lg font-bold">AuraBank</div>
                              <div className="text-cyan-400 text-xs">Secure Banking</div>
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                          </div>
                        </div>

                        {/* Welcome Message */}
                        <div className="mb-6">
                          <div className="text-white text-xl font-semibold mb-1">Good morning!</div>
                          <div className="text-slate-400 text-sm">Here's your account overview</div>
                        </div>

                        {/* Total Balance Card */}
                        <div className="bg-gradient-to-br from-pink-500/20 via-cyan-400/10 to-purple-500/20 p-5 rounded-2xl border border-cyan-400/30 backdrop-blur-sm mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-slate-400 text-sm">Total Balance</div>
                            <div className="text-cyan-400 text-xs">●●●●</div>
                          </div>
                          <div className="text-white text-3xl font-bold mb-1">$138,439.25</div>
                          <div className="text-slate-400 text-xs">Available: $138,439.25</div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-4 gap-3 mb-6">
                          <div className="bg-slate-700/50 p-3 rounded-xl text-center hover:bg-slate-700 transition-colors cursor-pointer backdrop-blur-sm">
                            <div className="text-cyan-400 text-xl mb-1">↗</div>
                            <div className="text-white text-xs">Send</div>
                          </div>
                          <div className="bg-slate-700/50 p-3 rounded-xl text-center hover:bg-slate-700 transition-colors cursor-pointer backdrop-blur-sm">
                            <div className="text-green-400 text-xl mb-1">↓</div>
                            <div className="text-white text-xs">Request</div>
                          </div>
                          <div className="bg-slate-700/50 p-3 rounded-xl text-center hover:bg-slate-700 transition-colors cursor-pointer backdrop-blur-sm">
                            <div className="text-pink-400 text-xl mb-1">💳</div>
                            <div className="text-white text-xs">Cards</div>
                          </div>
                          <div className="bg-slate-700/50 p-3 rounded-xl text-center hover:bg-slate-700 transition-colors cursor-pointer backdrop-blur-sm">
                            <div className="text-purple-400 text-xl mb-1">📊</div>
                            <div className="text-white text-xs">Invest</div>
                          </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="mb-4">
                          <div className="text-white text-sm font-semibold mb-3">Recent Activity</div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between bg-slate-700/30 p-3 rounded-lg backdrop-blur-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                  <div className="text-green-400 text-sm">💰</div>
                                </div>
                                <div>
                                  <div className="text-white text-sm font-medium">Salary Deposit</div>
                                  <div className="text-slate-400 text-xs">Today, 9:15 AM</div>
                                </div>
                              </div>
                              <div className="text-green-400 font-semibold">+$5,200.00</div>
                            </div>

                            <div className="flex items-center justify-between bg-slate-700/30 p-3 rounded-lg backdrop-blur-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                                  <div className="text-pink-400 text-sm">🏪</div>
                                </div>
                                <div>
                                  <div className="text-white text-sm font-medium">Grocery Store</div>
                                  <div className="text-slate-400 text-xs">Yesterday, 2:30 PM</div>
                                </div>
                              </div>
                              <div className="text-red-400 font-semibold">-$87.43</div>
                            </div>

                            <div className="flex items-center justify-between bg-slate-700/30 p-3 rounded-lg backdrop-blur-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                  <div className="text-cyan-400 text-sm">⚡</div>
                                </div>
                                <div>
                                  <div className="text-white text-sm font-medium">Electric Bill</div>
                                  <div className="text-slate-400 text-xs">2 days ago</div>
                                </div>
                              </div>
                              <div className="text-red-400 font-semibold">-$145.20</div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Navigation */}
                        <div className="flex justify-around items-center pt-4 border-t border-slate-700/50">
                          <div className="flex flex-col items-center text-cyan-400">
                            <div className="text-lg mb-1">🏠</div>
                            <div className="text-xs">Home</div>
                          </div>
                          <div className="flex flex-col items-center text-slate-500">
                            <div className="text-lg mb-1">📊</div>
                            <div className="text-xs">Analytics</div>
                          </div>
                          <div className="flex flex-col items-center text-slate-500">
                            <div className="text-lg mb-1">💳</div>
                            <div className="text-xs">Cards</div>
                          </div>
                          <div className="flex flex-col items-center text-slate-500">
                            <div className="text-lg mb-1">⚙️</div>
                            <div className="text-xs">Settings</div>
                          </div>
                        </div>
                      </div>

                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full"></div>
                    </div>
                  </div>

                  {/* Side Buttons */}
                  <div className="absolute -right-2 top-20 w-1 h-12 bg-slate-600 rounded-r-full"></div>
                  <div className="absolute -right-2 top-36 w-1 h-8 bg-slate-600 rounded-r-full"></div>
                  <div className="absolute -left-2 top-32 w-1 h-16 bg-slate-600 rounded-l-full"></div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-pink-500 to-cyan-400 rounded-xl transform rotate-12 animate-bounce shadow-lg shadow-pink-500/25"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-green-400/20 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-cyan-400/20 rounded-full flex items-center justify-center">
                    <stat.icon size={24} style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Everything You Need,<br />
              <span className="bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">
                Nothing You Don't
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/10 transition-all transform hover:-translate-y-2 hover:scale-105"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-cyan-400/20 rounded-full flex items-center justify-center">
                    <feature.icon size={32} style={{ color: feature.color }} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 text-center">{feature.title}</h3>
                <p className="text-slate-400 text-center leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-32 h-32 bg-cyan-400/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-pink-500/5 rounded-full blur-xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Get Started in <span className="bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="text-6xl font-bold bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent mb-6">
                  {step.number}
                </div>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-pink-500/25">
                  <step.icon size={36} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.description}</p>
                
                {/* Connecting line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-1 bg-gradient-to-r from-pink-500/30 to-cyan-400/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent mb-4">
              Fort Knox Level Security
            </h2>
            <p className="text-slate-600 text-lg">Your money and data protected by bank-grade security</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl hover:bg-slate-50 transition-all">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)` }}>
                  <feature.icon size={32} style={{ color: feature.color }} />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h4>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-500/5 via-slate-900 to-cyan-400/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Loved by <span className="bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">Thousands</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 md:p-12">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-700">
                  MK
                </div>
              </div>
              <div className="text-center mb-6">
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={24} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xl md:text-2xl text-white leading-relaxed italic mb-6">
                  "AuraBank saved me over $600 in fees this year. The app is beautiful and everything just works!"
                </p>
                <div className="text-lg font-semibold bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">
                  Mitchelle Khay
                </div>
                <div className="text-slate-400">Accra, GH</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Questions? We've Got <span className="bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">Answers</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="text-lg font-semibold text-white pr-4">{faq.question}</span>
                  <ChevronDown 
                    size={24} 
                    className={`text-cyan-400 transition-transform flex-shrink-0 ${activeAccordion === index ? 'transform rotate-180' : ''}`}
                  />
                </button>
                {activeAccordion === index && (
                  <div className="px-6 pb-5 text-slate-400 leading-relaxed border-l-4 border-cyan-400 ml-6">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-500 to-cyan-400 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Experience Better Banking?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join 500,000+ users who've already made the switch. No fees, no hassle, no regrets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button className="bg-white text-pink-500 px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:-translate-y-1 hover:scale-105">
              Open Free Account
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-all transform hover:-translate-y-1">
              Schedule a Call
            </button>
          </div>
          <p className="text-white/90 text-sm">
            Takes 3 minutes • No credit check • FDIC Insured
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/dblogo.jpg" alt="AuraBank Logo" className="w-8 h-8 object-contain" />
                <div>
                  <div className="text-white font-bold text-lg">AuraBank</div>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4">Secure. Simple. Seamless.</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-gradient-to-br hover:from-pink-500 to-cyan-400">
                  <span className="sr-only">Social Link</span>
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2024 AuraBank. All rights reserved. FDIC Insured up to $250,000.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Terms</a>
              <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </div>
  );
}
