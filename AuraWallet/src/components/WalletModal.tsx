import { ReactNode } from 'react';
import { X } from 'lucide-react';

export default function WalletModal({
  title,
  onClose,
  children,
  maxWidthClassName = 'max-w-md',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className={`relative w-full ${maxWidthClassName} overflow-hidden rounded-2xl bg-[#0B1E39] border border-white/10 p-5 shadow-2xl animate-in zoom-in-95 fade-in duration-300`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-xl">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:rotate-90 transition-all duration-300" aria-label="Close modal">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}
