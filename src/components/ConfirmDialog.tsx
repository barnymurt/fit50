'use client';

import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Branded yes/no dialog. Backed by the shared Modal so it picks
 * up the same teal-paper styling, ESC-to-close, and click-outside
 * behaviour. Use this instead of window.confirm() anywhere the
 * the OS-native dialog would feel like a hole in the design.
 *
 * Set destructive=true to render the confirm button in coral-deep
 * instead of coral (signals "this wipes data").
 */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      ariaLabel="Confirm"
    >
      <p className="font-body text-base text-ink/80 leading-[1.5] mb-6">
        {description}
      </p>
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center border border-ink/30 hover:border-ink px-6 py-3 font-body text-caption uppercase tracking-widest text-ink/70 hover:text-ink transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`inline-flex items-center justify-center px-6 py-3 font-body text-caption uppercase tracking-widest text-paper transition-colors ${
            destructive
              ? 'bg-coral-deep hover:bg-ink'
              : 'bg-coral hover:bg-coral-deep'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
