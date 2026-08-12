'use client';

import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export default function Modal({ open, onClose, title, children, ariaLabel }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 animate-overlay-in flex items-end md:items-center justify-center md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className="bg-paper w-full md:max-w-lg border border-ink/15 max-h-[90vh] overflow-y-auto animate-sheet-up rounded-t-2xl md:rounded pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-ink/20 rounded-full" />
        </div>
        <div className="px-6 pt-4 md:pt-6 pb-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50">
              {ariaLabel ?? 'Details'}
            </p>
            <h3 className="font-display text-h2 text-ink leading-tight mt-1">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 -mr-2 -mt-1 p-2 font-body text-caption uppercase text-ink/60 hover:text-ink transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}
