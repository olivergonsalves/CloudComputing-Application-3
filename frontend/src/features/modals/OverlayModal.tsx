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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-600 bg-[#0c1625] p-4 shadow-soft animate-reveal">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
