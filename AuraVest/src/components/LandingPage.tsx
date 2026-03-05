'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, Sun, Moon, TrendingUp, TrendingDown, Star, ChevronRight, Play, BarChart3, Shield, Zap, Users, Award, ArrowRight, Menu, X, Smartphone, QrCode, Apple } from 'lucide-react';
import TechnicalAnalysisChart from './TechnicalAnalysisChart';
import MobileAppShowcase from './MobileAppShowcase';
import { cryptoAssets, stockAssets, nftCollections } from '@/lib/mockData';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({ users: 0, volume: 0, assets: 0 });

  // Intersection Observer for animations
  const observerRef = useRef<IntersectionObserver>();
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe sections
    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach(section => observerRef.current?.observe(section));

    return () => observerRef.current?.disconnect();
  }, []);

  // Animated counters with easing
  useEffect(() => {
    if (visibleSections.has('stats')) {
      const animateValue = (start: number, end: number, duration: number, setValue: (value: number) => void) => {
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Easing function for smoother animation
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const current = Math.floor(start + (end - start) * easeOutQuart);
          setValue(current);
          if (progress < 1) requestAnimationFrame(animate);
        };
        animate();
      };

      setTimeout(() => animateValue(0, 50000, 2500, (value) => setAnimatedStats(prev => ({ ...prev, users: value }))), 200);
      setTimeout(() => animateValue(0, 2500000000, 2500, (value) => setAnimatedStats(prev => ({ ...prev, volume: value }))), 400);
      setTimeout(() => animateValue(0, 1000, 2500, (value) => setAnimatedStats(prev => ({ ...prev, assets: value }))), 600);
    }
  }, [visibleSections]);

  // Dark mode setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('auravest_dark_mode') === 'true';
      setDarkMode(savedDarkMode);
      if (savedDarkMode) document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('auravest_dark_mode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirm password is required';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Mock authentication - store user in localStorage
      localStorage.setItem('auravest_user', JSON.stringify({ email: formData.email }));
      // Reload page to show dashboard
      window.location.reload();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Smooth scroll to sections
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const featuredCryptos = cryptoAssets.slice(0, 6);
  const featuredStocks = stockAssets.slice(0, 6);
  const featuredNFTs = nftCollections.slice(0, 6);

  const features = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Real-time market data, technical analysis, and AI-powered insights to guide your decisions.'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Bank-level security with full regulatory compliance and transparent fee structure.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Execute trades instantly with our high-performance trading engine and real-time updates.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Learn from experienced investors and share strategies in our vibrant community.'
    },
    {
      icon: Award,
      title: 'Award Winning',
      description: 'Recognized by industry leaders for innovation and user experience excellence.'
    },
    {
      icon: TrendingUp,
      title: 'Portfolio Tracking',
      description: 'Comprehensive portfolio analytics with performance attribution and risk metrics.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10">
                <Image
                  src="/logo.jpeg"
                  alt="AuraVest Logo"
                  width={40}
                  height={40}
                  className="object-contain rounded-full"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">AuraVest</h1>
                <p className="text-xs text-gray-600 dark:text-gray-300">Invest Smarter, Grow Stronger</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105">Features</button>
              <button onClick={() => scrollToSection('markets')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105">Markets</button>
              <button onClick={() => scrollToSection('assets')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105">Assets</button>
              <button onClick={() => scrollToSection('mobile-app')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105">Mobile App</button>
              <button onClick={() => scrollToSection('about')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105">About</button>
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
              </button>

              <button
                onClick={() => setShowAuthModal(true)}
                className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
              <nav className="flex flex-col space-y-4">
                <button onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-2 text-left">Features</button>
                <button onClick={() => { scrollToSection('markets'); setMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-2 text-left">Markets</button>
                <button onClick={() => { scrollToSection('assets'); setMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-2 text-left">Assets</button>
                <button onClick={() => { scrollToSection('mobile-app'); setMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-2 text-left">Mobile App</button>
                <button onClick={() => { scrollToSection('about'); setMobileMenuOpen(false); }} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-2 text-left">About</button>
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 text-left"
                >
                  Get Started
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Enhanced Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-blue-400/30 to-blue-600/30 rounded-full animate-float opacity-60"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-purple-400/30 to-purple-600/30 rounded-lg rotate-45 animate-float-delayed opacity-60"></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-green-400/30 to-green-600/30 rounded-full animate-float-slow opacity-60"></div>
          <div className="absolute top-1/3 right-10 w-12 h-12 bg-gradient-to-br from-yellow-400/30 to-yellow-600/30 rounded-lg rotate-12 animate-float-reverse opacity-60"></div>
          <div className="absolute bottom-20 right-1/3 w-8 h-8 bg-gradient-to-br from-pink-400/30 to-pink-600/30 rounded-full animate-float-fast opacity-60"></div>

          {/* Animated particles */}
          <div className="absolute top-1/4 left-1/5 w-2 h-2 bg-blue-500 rounded-full animate-particle-1 opacity-80"></div>
          <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-purple-500 rounded-full animate-particle-2 opacity-80"></div>
          <div className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 bg-green-500 rounded-full animate-particle-3 opacity-80"></div>
          <div className="absolute top-2/3 right-1/5 w-1 h-1 bg-yellow-500 rounded-full animate-particle-4 opacity-80"></div>
          <div className="absolute bottom-1/4 right-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full animate-particle-5 opacity-80"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 animate-slide-up">
              Invest Smarter,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 animate-gradient-x">Grow Stronger</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto animate-slide-up-delayed">
              Multi-asset investment platform with advanced analytics, real-time market data, and AI-powered insights to help you make informed investment decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up-more-delayed">
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-110 hover:shadow-2xl shadow-lg group relative overflow-hidden"
              >
                <span className="relative z-10">Start Investing Today</span>
                <ArrowRight className="w-5 h-5 inline ml-2 group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button className="border-2 border-gray-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 group relative overflow-hidden">
                <span className="relative z-10">Watch Demo</span>
                <Play className="w-5 h-5 inline ml-2 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          {/* Hero Image/Chart Preview */}
          <div className="mt-16 relative animate-slide-up-chart">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-500 hover:shadow-3xl relative overflow-hidden group">
              {/* Chart glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <TechnicalAnalysisChart
                asset={{
                  id: 'BTC',
                  name: 'Bitcoin',
                  symbol: 'BTC',
                  price: 43250.50,
                  change24h: 2.34
                }}
                isEmbedded={true}
              />
            </div>
            {/* Enhanced floating elements around chart */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full animate-float-glow opacity-80 shadow-lg"></div>
            <div className="absolute -bottom-6 -left-6 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full animate-float-glow-delayed opacity-80 shadow-lg"></div>
            <div className="absolute top-1/2 -right-8 w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full animate-float-glow-slow opacity-80 shadow-lg"></div>
            <div className="absolute bottom-1/4 -left-8 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full animate-float-glow-reverse opacity-80 shadow-lg"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" data-animate className={`py-16 px-4 sm:px-6 lg:px-8 bg-blue-600 dark:bg-blue-700 ${visibleSections.has('stats') ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">{animatedStats.users.toLocaleString()}+</div>
              <div className="text-blue-100">Active Investors</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">${(animatedStats.volume / 1000000000).toFixed(1)}B+</div>
              <div className="text-blue-100">Trading Volume</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">{animatedStats.assets}+</div>
              <div className="text-blue-100">Assets Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" data-animate className={`py-20 px-4 sm:px-6 lg:px-8 ${visibleSections.has('features') ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Smart Investing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to build and manage a diversified investment portfolio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:scale-105 group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section id="markets" data-animate className={`py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 ${visibleSections.has('markets') ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Live Market Data
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Stay updated with real-time prices and market movements
            </p>
          </div>

          {/* Market Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { label: 'Cryptocurrency', value: '$1.2T', change: '+2.4%', color: 'text-green-500' },
              { label: 'Stocks', value: '$45T', change: '+1.2%', color: 'text-green-500' },
              { label: 'NFTs', value: '$8.5B', change: '+5.7%', color: 'text-green-500' }
            ].map((market, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">{market.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{market.value}</p>
                  </div>
                  <div className={`text-lg font-semibold ${market.color}`}>
                    {market.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Featured Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bitcoin (BTC)</h3>
              <TechnicalAnalysisChart
                asset={{
                  id: 'BTC',
                  name: 'Bitcoin',
                  symbol: 'BTC',
                  price: 43250.50,
                  change24h: 2.34
                }}
                isEmbedded={true}
              />
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Apple (AAPL)</h3>
              <TechnicalAnalysisChart
                asset={{
                  id: 'AAPL',
                  name: 'Apple Inc.',
                  symbol: 'AAPL',
                  price: 178.25,
                  change24h: 1.45
                }}
                isEmbedded={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Assets Section */}
      <section id="assets" data-animate className={`py-20 px-4 sm:px-6 lg:px-8 ${visibleSections.has('assets') ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Assets
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Discover trending cryptocurrencies, stocks, and NFTs
            </p>
          </div>

          {/* Cryptocurrencies */}
          <div className="mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Top Cryptocurrencies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCryptos.map((crypto, index) => (
                <div
                  key={crypto.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 group cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300">
                        {crypto.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{crypto.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{crypto.symbol}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${crypto.change24h >= 0 ? 'text-green-500' : 'text-red-500'} group-hover:scale-110 transition-transform duration-300`}>
                      {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h}%
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    ${crypto.price.toLocaleString()}
                  </div>
                  {/* Animated trend indicator */}
                  <div className={`mt-2 h-1 rounded-full ${crypto.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'} group-hover:h-2 transition-all duration-300`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Stocks */}
          <div className="mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              Popular Stocks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStocks.map((stock, index) => (
                <div
                  key={stock.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 group cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform duration-300">
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{stock.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{stock.symbol}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${stock.change24h >= 0 ? 'text-green-500' : 'text-red-500'} group-hover:scale-110 transition-transform duration-300`}>
                      {stock.change24h >= 0 ? '+' : ''}{stock.change24h}%
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    ${stock.price.toLocaleString()}
                  </div>
                  {/* Animated trend indicator */}
                  <div className={`mt-2 h-1 rounded-full ${stock.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'} group-hover:h-2 transition-all duration-300`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* NFTs */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-500" />
              Featured NFT Collections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredNFTs.map((nft, index) => (
                <div
                  key={nft.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 overflow-hidden group cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{nft.name}</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Floor Price</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{nft.floorPrice} ETH</p>
                      </div>
                      <div className={`text-sm font-semibold ${nft.change24h >= 0 ? 'text-green-500' : 'text-red-500'} group-hover:scale-110 transition-transform duration-300`}>
                        {nft.change24h >= 0 ? '+' : ''}{nft.change24h}%
                      </div>
                    </div>
                    {/* Animated trend indicator */}
                    <div className={`mt-3 h-1 rounded-full ${nft.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'} group-hover:h-2 transition-all duration-300`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" data-animate className={`py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 ${visibleSections.has('about') ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose AuraVest?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're committed to democratizing investing by providing powerful tools and insights to investors of all levels
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Built for the Modern Investor
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Security First</h4>
                    <p className="text-gray-600 dark:text-gray-300">Your assets and data are protected with enterprise-grade security measures.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Lightning Fast</h4>
                    <p className="text-gray-600 dark:text-gray-300">Execute trades instantly with our optimized trading infrastructure.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Community Driven</h4>
                    <p className="text-gray-600 dark:text-gray-300">Learn from and connect with a community of successful investors.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-2xl p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Trusted by Thousands</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Join over 50,000 investors who trust AuraVest with their financial future.
                  </p>
                  <div className="flex justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <div className="font-bold text-2xl text-gray-900 dark:text-white">4.9</div>
                      <div>App Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-2xl text-gray-900 dark:text-white">99.9%</div>
                      <div>Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-2xl text-gray-900 dark:text-white">$2.5B+</div>
                      <div>Assets Managed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of investors who are already growing their wealth with AuraVest.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8">
                  <Image
                    src="/logo.jpeg"
                    alt="AuraVest Logo"
                    width={32}
                    height={32}
                    className="object-contain rounded-full"
                  />
                </div>
                <h3 className="text-xl font-bold">AuraVest</h3>
              </div>
              <p className="text-gray-400">
                Invest Smarter, Grow Stronger. Your trusted partner in multi-asset investing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Markets</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Portfolio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trade</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AuraVest. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile App Showcase Section */}
      <section id="mobile-app" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <MobileAppShowcase />
        </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative transform animate-fade-in">
            {/* Close button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="w-12 h-12 mx-auto mb-4">
                  <Image
                    src="/logo.jpeg"
                    alt="AuraVest Logo"
                    width={48}
                    height={48}
                    className="object-contain rounded-full"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLogin ? 'Welcome Back' : 'Join AuraVest'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
                </p>
              </div>

              {/* Tab Toggle */}
              <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    isLogin
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !isLogin
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.email
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }`}
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.password
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
                </div>

                {/* Confirm Password Field (Signup only) */}
                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          errors.confirmPassword
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              {/* Footer Text */}
              <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
