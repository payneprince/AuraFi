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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`w-full ${maxWidthClassName} rounded-2xl bg-[#0B1E39] border border-white/10 p-5`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-xl">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white" aria-label="Close modal">
            <X className="w-4 h-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
