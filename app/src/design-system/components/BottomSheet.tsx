import { useEffect, type ReactNode } from 'react';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] bg-[var(--pd-color-overlay-backdrop)]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className="fixed bottom-0 left-0 right-0 z-[10001] max-h-[90vh] overflow-y-auto rounded-none border-t-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-elevated)] shadow-[0_-4px_0_var(--pd-color-shadow-default)] pd-pixel-ui animate-slide-up"
        style={{
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b-2 border-[var(--pd-color-border-default)]">
            <h2 id="bottom-sheet-title" className="text-lg font-bold text-[var(--pd-color-text-primary)] pd-font-pixel">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--pd-color-text-secondary)] hover:text-[var(--pd-color-text-primary)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </>
  );
}
