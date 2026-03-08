import { useEffect, useRef, useState } from 'react';
import type { BottomSheetProps } from './BottomSheet.types';
import './BottomSheet.css';

const snapMap = { content: 'pxd-sheet--content', medium: 'pxd-sheet--medium', large: 'pxd-sheet--large' } as const;

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  snap = 'content',
  showHandle = true,
  closeOnOverlayClick = true,
}: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) onClose();
  };

  if (!open) return null;

  return (
    <div className="pxd-sheet-wrapper" data-open={entered ? 'true' : 'false'} aria-hidden={!open}>
      <div
        ref={overlayRef}
        role="presentation"
        className="pxd-sheet-overlay"
        onClick={handleOverlayClick}
        aria-hidden
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className={`pxd-sheet ${snapMap[snap]}`}
      >
        {showHandle && (
          <div className="pxd-sheet-handle">
            <span className="pxd-sheet-handle__bar" aria-hidden />
          </div>
        )}
        {title ? (
          <div className={`pxd-sheet-header ${!showHandle ? 'pxd-sheet-header--no-handle' : ''}`}>
            <h2 id="bottom-sheet-title" className="pxd-sheet-title">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="pxd-sheet-close"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        ) : !showHandle ? (
          <div className="pxd-sheet-close-only">
            <button
              type="button"
              onClick={onClose}
              className="pxd-sheet-close"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="pxd-sheet-body">{children}</div>
      </div>
    </div>
  );
}
