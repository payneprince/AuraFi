import React from 'react';

export default function MobileAppShowcase() {
  return (
    <div className="bg-gradient-to-br from-[#071229] to-[#071029] rounded-2xl p-4 border border-white/6">
      <h4 className="text-white font-semibold mb-3">AuraWallet Mobile</h4>
      <p className="text-white/70 text-sm mb-4">Manage your wallets, send money via mobile money or AuraBank cards, and view transaction history — on the go.</p>

      <div className="flex gap-3 items-center">
        <div className="w-28 h-56 bg-gradient-to-br from-[#0b3450] to-[#052033] rounded-3xl flex items-center justify-center text-white/60">Phone Mock</div>
        <div className="flex-1">
          <ul className="space-y-2 text-white/80">
            <li>• One-tap transfers to mobile money</li>
            <li>• Saved AuraBank cards for fast payments</li>
            <li>• Secure biometric login</li>
            <li>• Real-time transaction notifications</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
