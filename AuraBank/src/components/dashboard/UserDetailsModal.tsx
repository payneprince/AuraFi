'use client';

import { X, Mail, Phone, MapPin, Hash } from 'lucide-react';
import type { User } from '@/types';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
  if (!isOpen || !user) return null;

  const details = [
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Phone, label: 'Phone', value: user.phone || 'Not provided' },
    { icon: MapPin, label: 'Address', value: user.address || 'Not provided' },
    { icon: Hash, label: 'Account ID', value: user.id },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 bg-gradient-to-br from-magenta-500 to-cyan-500 text-white overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative flex items-center gap-4">
            <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/80 border-r-white/30 animate-spin" style={{ animationDuration: '2.5s' }} />
              <div className="absolute inset-[3px] rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold ring-1 ring-white/25">
                {(user.name || 'D').charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">{user.name}</h2>
              <p className="text-sm opacity-85 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-1">
          {details.map((d, i) => {
            const Icon = d.icon;
            return (
              <div
                key={d.label}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-9 h-9 rounded-lg bg-magenta-500/10 text-magenta-600 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{d.label}</p>
                  <p className="text-sm font-medium text-text-dark truncate">{d.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 text-text-dark font-medium hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
