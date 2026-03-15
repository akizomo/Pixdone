import { useEffect, useRef, useState } from 'react';
import { playSound } from '../../../services/sound';
import type { BottomSheetProps } from './BottomSheet.types';
import './BottomSheet.css';

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
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
      closeTimerRef.current = setTimeout(() => setVisible(false), 250);
      return () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
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

  if (!visible) return null;

  return (
    <>
      <div
        className="pxd-sheet-backdrop"
        data-open={entered ? 'true' : 'false'}
        onClick={() => { playSound('taskCancel'); onClose(); }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'pxd-sheet-title' : undefined}
        className="pxd-sheet"
        data-open={entered ? 'true' : 'false'}
      >
        <div className="pxd-sheet-header">
          <h2 id="pxd-sheet-title" className="pxd-sheet-title">
            {title ?? ''}
          </h2>
          <button
            type="button"
            onClick={() => { playSound('taskCancel'); onClose(); }}
            className="pxd-sheet-close"
            aria-label="Close"
          >
            <span className="material-icons" style={{ fontSize: '22px', lineHeight: 1 }}>close</span>
          </button>
        </div>
        <div className="pxd-sheet-body">{children}</div>
      </div>
    </>
  );
}
