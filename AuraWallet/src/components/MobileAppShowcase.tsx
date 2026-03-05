import {
  Bell,
  Search,
  Home,
  BarChart2,
  Activity,
  Briefcase,
  Menu,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Send,
  Shield,
} from 'lucide-react';
import Image from 'next/image';

export default function MobileAppShowcase() {
  return (
    <div className="bg-gradient-to-br from-black via-[#071529] to-green-600 rounded-xl p-6 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-green-400/20 rounded-full blur-2xl" />

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 overflow-hidden flex items-center justify-center">
              <Image src="/images/aurawallet-logo.jpeg" alt="AuraWallet logo" width={44} height={44} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-extrabold">AuraWallet Mobile</h2>
          </div>

          <p className="text-base font-medium opacity-90 leading-relaxed">
            Send money fast, manage card payments, and track wallet activity in real time with the AuraWallet mobile experience.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Instant Transfers</h3>
                <p className="text-xs opacity-75">Send to mobile money and linked cards in seconds</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Smart Card Controls</h3>
                <p className="text-xs opacity-75">Use saved AuraBank cards and monitor card activity</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Security First</h3>
                <p className="text-xs opacity-75">Biometric login and transaction alerts keep you protected</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="bg-black/30 backdrop-blur-sm hover:bg-black/40 px-2 py-2 rounded-xl transition-colors">
              <Image src="/store/app-store-badge.svg" alt="Download on the App Store" width={160} height={48} className="h-10 w-auto" />
            </button>

            <button className="bg-black/30 backdrop-blur-sm hover:bg-black/40 px-2 py-2 rounded-xl transition-colors">
              <Image src="/store/google-play-badge.svg" alt="Get it on Google Play" width={170} height={48} className="h-10 w-auto" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold">4.9</p>
              <p className="text-xs opacity-75">App Rating</p>
            </div>
            <div className="text-center border-x border-white/20">
              <p className="text-2xl font-bold">1M+</p>
              <p className="text-xs opacity-75">Downloads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs opacity-75">Support</p>
            </div>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="relative w-64 h-[520px] mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl transform rotate-6 opacity-50" />

            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black rounded-[3rem] shadow-2xl border-[10px] border-gray-800 overflow-hidden">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-30" />

              <div className="absolute top-1 left-0 right-0 px-7 flex justify-between items-center text-[9px] text-white/90 z-20">
                <span className="font-medium">9:41</span>
                <div className="w-3 h-1.5 border border-white/80 rounded-[2px] flex items-center px-[1px]">
                  <div className="w-full h-[3px] bg-white rounded-[1px]" />
                </div>
              </div>

              <div className="h-full pt-6 pb-14 flex flex-col">
                <div className="flex-1 overflow-y-scroll scrollbar-hide px-3 space-y-2">
                  <div className="flex justify-between items-center pt-1 pb-2">
                    <div>
                      <p className="text-[9px] text-white/50">Good evening</p>
                      <p className="text-xs font-bold text-white">AuraWallet</p>
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

                  <div className="bg-gradient-to-r from-black via-[#0d271a] to-green-600 rounded-xl p-3 shadow-lg">
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <p className="text-[8px] text-white/70">Wallet Balance</p>
                        <p className="text-xl font-bold text-white">$8,420</p>
                      </div>
                      <div className="bg-green-400/20 px-1.5 py-0.5 rounded-full">
                        <span className="text-[8px] text-green-300 font-semibold">Secure</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      <div className="bg-white/10 rounded-md p-1 text-center">
                        <p className="text-[7px] text-white/70">Today In</p>
                        <p className="text-[9px] font-semibold text-green-300">+$340</p>
                      </div>
                      <div className="bg-white/10 rounded-md p-1 text-center">
                        <p className="text-[7px] text-white/70">Today Out</p>
                        <p className="text-[9px] font-semibold text-red-300">-$120</p>
                      </div>
                      <div className="bg-white/10 rounded-md p-1 text-center">
                        <p className="text-[7px] text-white/70">Cards</p>
                        <p className="text-[9px] font-semibold text-white">2 Linked</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 py-1.5">
                    {[
                      { icon: Send, label: 'Send', iconClass: 'text-green-300', bgClass: 'bg-green-500/20' },
                      { icon: ArrowDownRight, label: 'Receive', iconClass: 'text-blue-300', bgClass: 'bg-blue-500/20' },
                      { icon: CreditCard, label: 'Cards', iconClass: 'text-purple-300', bgClass: 'bg-purple-500/20' },
                      { icon: Shield, label: 'Secure', iconClass: 'text-amber-300', bgClass: 'bg-amber-500/20' },
                    ].map(({ icon: Icon, label, iconClass, bgClass }) => (
                      <button key={label} className="flex flex-col items-center gap-0.5 bg-white/5 rounded-lg p-1.5">
                        <div className={`w-6 h-6 ${bgClass} rounded-full flex items-center justify-center`}>
                          <Icon className={`w-3 h-3 ${iconClass}`} />
                        </div>
                        <span className="text-[7px] text-white/70">{label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-[10px] font-semibold text-white">Recent Transactions</p>
                      <button className="text-[8px] text-green-300">View All</button>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { type: 'out', title: 'Mobile Money', amount: '-$45', time: '2m ago' },
                        { type: 'in', title: 'Bank Transfer', amount: '+$220', time: '1h ago' },
                      ].map((tx, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-1.5 flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            tx.type === 'in' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {tx.type === 'in' ? (
                              <ArrowUpRight className="w-2.5 h-2.5 text-green-300" />
                            ) : (
                              <ArrowDownRight className="w-2.5 h-2.5 text-red-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] font-semibold text-white">{tx.title}</p>
                              <p className="text-[9px] font-bold text-white">{tx.amount}</p>
                            </div>
                            <p className="text-[7px] text-white/50">{tx.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-black/90 border-t border-white/5 px-2 py-2">
                  <div className="flex justify-around items-center">
                    {[
                      { icon: Home, label: 'Home', active: true },
                      { icon: BarChart2, label: 'Stats', active: false },
                      { icon: Activity, label: 'Activity', active: false },
                      { icon: Briefcase, label: 'Cards', active: false },
                      { icon: Menu, label: 'More', active: false },
                    ].map(({ icon: Icon, label, active }) => (
                      <button key={label} className="flex flex-col items-center gap-0.5 w-10">
                        <Icon className={`w-3.5 h-3.5 ${active ? 'text-green-300' : 'text-white/30'}`} />
                        <span className={`text-[6px] font-medium ${active ? 'text-green-300' : 'text-white/30'}`}>{label}</span>
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
