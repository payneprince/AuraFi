'use client';

import { Video, FileText, TrendingUp, Shield, DollarSign } from 'lucide-react';

export default function LearnPage() {
  const courses = [
    { title: 'Crypto Basics', description: 'Learn the fundamentals', icon: TrendingUp },
    { title: 'Stock Market 101', description: 'Understanding stocks', icon: DollarSign },
    { title: 'Risk Management', description: 'Protect your investments', icon: Shield },
  ];

  const articles = [
    { title: 'How to Build a Diversified Portfolio', category: 'Portfolio Management' },
    { title: 'Understanding Market Volatility', category: 'Trading' },
    { title: 'Tax Implications of Crypto Trading', category: 'Taxes' },
    { title: 'Gold as a Hedge Against Inflation', category: 'Commodities' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learn & Grow</h1>
        <p className="text-muted-foreground">Educational resources to help you invest smarter</p>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-4">Investment Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courses.map((course, idx) => {
            const Icon = course.icon;
            return (
              <div key={idx} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground">{course.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-4">Featured Articles</h2>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {articles.map((article, idx) => (
            <div key={idx} className="p-4 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{article.title}</h3>
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                    {article.category}
                  </span>
                </div>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Video className="w-5 h-5" />
          <h2 className="font-bold">Video Tutorials</h2>
        </div>
        <p className="text-sm opacity-90 mb-4">
          Expert-led tutorials on trading strategies and market analysis
        </p>
        <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/90">
          Browse Videos
        </button>
      </div>
    </div>
  );
}
