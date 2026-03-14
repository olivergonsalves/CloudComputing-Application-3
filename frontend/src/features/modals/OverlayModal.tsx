import { ReactNode } from "react";

interface OverlayModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function OverlayModal({ open, title, onClose, children }: OverlayModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 shadow-soft animate-reveal">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            className="rounded-lg border border-[#2a2a2a] bg-[#202020] px-3 py-1.5 text-xs text-[#d9d9d9] transition hover:border-[#4a4a4a]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
