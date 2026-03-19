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
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);

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

  // Mobile-friendly scroll lock (prevents background scroll + iOS bounce)
  useEffect(() => {
    if (!visible) return;
    const body = document.body;
    const html = document.documentElement;
    const prev = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
    };
    scrollYRef.current = window.scrollY || 0;
    body.style.position = 'fixed';
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';

    return () => {
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      body.style.overflow = prev.bodyOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      window.scrollTo(0, scrollYRef.current);
    };
  }, [visible]);

  // Keyboard avoidance via VisualViewport (vanilla parity)
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--pxd-keyboard-inset', `${keyboardInset}px`);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--pxd-keyboard-inset');
    };
  }, [open]);

  // Focus first interactive element when opened
  useEffect(() => {
    if (!open) return;
    let id1: number, id2: number;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        const root = sheetRef.current;
        const first = root?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        first?.focus();
      });
    });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, [open]);

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
        ref={sheetRef}
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
