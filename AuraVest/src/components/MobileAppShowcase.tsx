'use client';

import { Smartphone, QrCode, Apple, Play, TrendingUp, ArrowUpRight, ArrowDownRight, Bell, Search, Plus, Home, BarChart2, Activity, Briefcase, Menu } from 'lucide-react';

export default function MobileAppShowcase() {
  return (
    <div className="bg-gradient-to-br from-black to-crimson-600 rounded-xl p-8 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-crimson-500/20 rounded-full blur-2xl" />

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Download Our App</h2>
          </div>

          <p className="text-base opacity-90 leading-relaxed">
            Experience seamless trading on the go. Track your portfolio, execute trades, and stay updated with real-time market data—all from your mobile device.
          </p>

          {/* Features List */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Real-Time Market Data</h3>
                <p className="text-xs opacity-75">Get live price updates, charts, and market insights instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Secure Biometric Login</h3>
                <p className="text-xs opacity-75">Face ID and fingerprint authentication for enhanced security</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Smart Notifications</h3>
                <p className="text-xs opacity-75">Price alerts, portfolio updates, and trade confirmations</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">AuraAI Assistant</h3>
                <p className="text-xs opacity-75">AI-powered insights and personalized investment recommendations</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex items-center gap-3 bg-black/30 backdrop-blur-sm hover:bg-black/40 px-4 py-3 rounded-xl transition-colors">
              <Apple className="w-6 h-6" />
              <div className="text-left">
                <p className="text-xs opacity-75">Download on the</p>
                <p className="font-semibold">App Store</p>
              </div>
            </button>

            <button className="flex items-center gap-3 bg-black/30 backdrop-blur-sm hover:bg-black/40 px-4 py-3 rounded-xl transition-colors">
              <Play className="w-6 h-6" />
              <div className="text-left">
                <p className="text-xs opacity-75">Get it on</p>
                <p className="font-semibold">Google Play</p>
              </div>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold">4.8</p>
              <p className="text-xs opacity-75">App Rating</p>
            </div>
            <div className="text-center border-x border-white/20">
              <p className="text-2xl font-bold">500K+</p>
              <p className="text-xs opacity-75">Downloads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs opacity-75">Support</p>
            </div>
          </div>
        </div>

        {/* Phone Mockup */}
        <div className="relative hidden md:block">
          <div className="relative w-64 h-[520px] mx-auto">
            {/* Shadow phone */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl transform rotate-6 opacity-50" />

            {/* Main phone */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black rounded-[3rem] shadow-2xl border-[10px] border-gray-800 overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-30" />

              {/* Status Bar */}
              <div className="absolute top-1 left-0 right-0 px-7 flex justify-between items-center text-[9px] text-white/90 z-20">
                <span className="font-medium">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1.5 border border-white/80 rounded-[2px] flex items-center px-[1px]">
                    <div className="w-full h-[3px] bg-white rounded-[1px]"></div>
                  </div>
                </div>
              </div>

              {/* Screen Content Container */}
              <div className="h-full pt-6 pb-14 flex flex-col">
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-scroll scrollbar-hide px-3 space-y-2">
                  {/* App Header */}
                  <div className="flex justify-between items-center pt-1 pb-2">
                    <div>
                      <p className="text-[9px] text-white/50">Welcome back</p>
                      <p className="text-xs font-bold text-white">Portfolio</p>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                        <Bell className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                        <Search className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Balance Card */}
                  <div className="bg-gradient-to-r from-black to-crimson-600 rounded-xl p-3 shadow-lg">
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <p className="text-[8px] text-white/70">Total Balance</p>
                        <p className="text-xl font-bold text-white">$125,847</p>
                      </div>
                      <div className="bg-green-400/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5 text-green-400" />
                        <span className="text-[8px] text-green-400 font-semibold">+3.45%</span>
                      </div>
                    </div>
                    
                    {/* Mini Chart */}
                    <div className="flex items-end gap-[1px] h-6 mt-1.5">
                      {[40, 55, 45, 60, 50, 65, 70, 60, 75, 65, 80, 75, 85, 80, 90].map((height, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-white/30 rounded-t-[1px]"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-4 gap-1.5 py-1.5">
                    {[
                      { icon: Plus, label: 'Buy', color: 'blue' },
                      { icon: ArrowDownRight, label: 'Sell', color: 'red' },
                      { icon: TrendingUp, label: 'Trade', color: 'crimson' },
                      { icon: ArrowUpRight, label: 'Send', color: 'green' },
                    ].map(({ icon: Icon, label, color }) => (
                      <button key={label} className="flex flex-col items-center gap-0.5 bg-white/5 rounded-lg p-1.5">
                        <div className={`w-6 h-6 bg-${color}-500/20 rounded-full flex items-center justify-center`}>
                          <Icon className={`w-3 h-3 text-${color}-400`} />
                        </div>
                        <span className="text-[7px] text-white/70">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* My Assets */}
                  <div className="pt-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-[10px] font-semibold text-white">My Assets</p>
                      <button className="text-[8px] text-crimson-400">View All</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { asset: 'BTC', name: 'Bitcoin', value: '$43,250', change: '+2.4%', up: true },
                        { asset: 'ETH', name: 'Ethereum', value: '$2,281', change: '+1.8%', up: true },
                        { asset: 'AAPL', name: 'Apple', value: '$178', change: '-0.5%', up: false },
                        { asset: 'GOLD', name: 'Gold', value: '$62', change: '+0.3%', up: true },
                      ].map(({ asset, name, value, change, up }) => (
                        <div key={asset} className="bg-white/5 rounded-lg p-1.5">
                          <div className="flex justify-between items-start mb-0.5">
                            <div>
                              <p className="text-[9px] font-bold text-white">{asset}</p>
                              <p className="text-[7px] text-white/50">{name}</p>
                            </div>
                            <div className={`flex items-center gap-[1px] ${up ? 'text-green-400' : 'text-red-400'}`}>
                              {up ? <ArrowUpRight className="w-1.5 h-1.5" /> : <ArrowDownRight className="w-1.5 h-1.5" />}
                              <span className="text-[7px] font-medium">{change}</span>
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="pt-1 pb-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-[10px] font-semibold text-white">Recent Activity</p>
                      <button className="text-[8px] text-crimson-400">See All</button>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { type: 'buy', asset: 'BTC', amount: '+0.025', value: '$1,081', time: '2h ago' },
                        { type: 'sell', asset: 'ETH', amount: '-1.5', value: '$3,421', time: '5h ago' },
                      ].map((tx, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-1.5 flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            tx.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {tx.type === 'buy' ? 
                              <ArrowUpRight className="w-2.5 h-2.5 text-green-400" /> : 
                              <ArrowDownRight className="w-2.5 h-2.5 text-red-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] font-semibold text-white">{tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.asset}</p>
                              <p className="text-[9px] font-bold text-white">{tx.value}</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-[7px] text-white/50">{tx.amount} {tx.asset}</p>
                              <p className="text-[7px] text-white/50">{tx.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation - Fixed */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-black/90 border-t border-white/5 px-2 py-2">
                  <div className="flex justify-around items-center">
                    {[
                      { icon: Home, label: 'Home', active: true },
                      { icon: BarChart2, label: 'Markets', active: false },
                      { icon: Activity, label: 'Trade', active: false },
                      { icon: Briefcase, label: 'Portfolio', active: false },
                      { icon: Menu, label: 'More', active: false },
                    ].map(({ icon: Icon, label, active }) => (
                      <button key={label} className="flex flex-col items-center gap-0.5 w-10">
                        <Icon className={`w-3.5 h-3.5 ${active ? 'text-crimson-500' : 'text-white/30'}`} />
                        <span className={`text-[6px] font-medium ${active ? 'text-crimson-500' : 'text-white/30'}`}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
