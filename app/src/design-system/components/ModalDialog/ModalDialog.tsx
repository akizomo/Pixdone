import { useEffect, useRef, useState } from 'react';
import { playSound } from '../../../services/sound';
import type { ModalDialogProps } from './ModalDialog.types';
import './ModalDialog.css';

export function ModalDialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  closeOnOverlayClick = true,
  onOverlayClick,
  'aria-label': ariaLabel,
}: ModalDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(open);
  const [entered, setEntered] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setVisible(true);
      let id1: number, id2: number;
      id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setEntered(true));
      });
      return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
    } else {
      setEntered(false);
      closeTimerRef.current = setTimeout(() => setVisible(false), 200);
      return () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { playSound('taskCancel'); onClose(); }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (visible) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [visible]);

  useEffect(() => {
    if (!open) return;
    let id1: number, id2: number;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        const first = panelRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      });
    });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!closeOnOverlayClick || e.target !== overlayRef.current) return;
    playSound('taskCancel');
    if (onOverlayClick) onOverlayClick();
    else onClose();
  };

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      aria-label={ariaLabel}
      className={`pxd-modal-overlay ${entered ? 'pxd-modal-overlay--open' : ''}`}
      onClick={handleOverlayClick}
    >
      <div ref={panelRef} className="pxd-modal-panel" onClick={(e) => e.stopPropagation()}>
        {title && (
          <h2 id="modal-title" className="pxd-modal-title">
            {title}
          </h2>
        )}
        {description && (
          <p id="modal-description" className="pxd-modal-description">
            {description}
          </p>
        )}
        <div className="pxd-modal-body">{children}</div>
        {actions != null && <div className="pxd-modal-actions">{actions}</div>}
      </div>
    </div>
  );
}
