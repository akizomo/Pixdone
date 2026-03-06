import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';

export interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Primary and secondary/danger actions */
  actions?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'destructive' | 'signup' }[];
  'aria-label'?: string;
}

export function ModalDialog({ open, onClose, title, children, actions, 'aria-label': ariaLabel }: ModalDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal
      aria-labelledby="modal-title"
      aria-label={ariaLabel}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[var(--pd-color-overlay-backdrop)] transition-opacity"
      onClick={handleOverlayClick}
    >
      <div
        className="w-[90%] max-w-[400px] max-h-[90vh] overflow-y-auto rounded-none border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-elevated)] pd-shadow-lg pd-pixel-ui p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-bold text-[var(--pd-color-text-primary)] mb-4 pd-font-pixel">
          {title}
        </h2>
        <div className="text-[var(--pd-color-text-primary)] mb-6">{children}</div>
        {actions && actions.length > 0 && (
          <div className="flex gap-2 justify-end">
            {actions.map((a, i) => (
              <Button
                key={i}
                variant={a.variant ?? 'secondary'}
                onClick={a.onClick}
              >
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
