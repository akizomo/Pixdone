import { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../../../services/sound';
import { IconButton } from '../IconButton/IconButton';
import type { BottomSheetProps } from './BottomSheet.types';
import './BottomSheet.css';

/** Minimum downward swipe distance (px) to trigger close */
const SWIPE_CLOSE_THRESHOLD = 80;

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  bodyClassName,
}: BottomSheetProps) {
  const [visible, setVisible] = useState(open);
  const [entered, setEntered] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);

  // ── Swipe-to-dismiss state ──
  const [dragY, setDragY] = useState(0);
  /** When closing via swipe, keep the current dragY so the sheet slides out from its position */
  const [exitDragY, setExitDragY] = useState(0);
  const dragStartRef = useRef<{ y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setExitDragY(0);
      setVisible(true);
      let id1: number, id2: number;
      id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setEntered(true));
      });
      return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
    } else {
      setEntered(false);
      closeTimerRef.current = setTimeout(() => { setVisible(false); setExitDragY(0); }, 300);
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

  // ── Swipe-to-dismiss handlers (header / drag-handle area) ──
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
    isDraggingRef.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStartRef.current) return;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    // Only allow downward drag
    if (dy > 0) {
      isDraggingRef.current = true;
      setDragY(dy);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!dragStartRef.current) return;
    const finalY = dragY;
    const elapsed = Date.now() - dragStartRef.current.time;
    // Close if dragged past threshold OR fast flick (>0.4 px/ms velocity)
    const velocity = finalY / Math.max(elapsed, 1);
    if (finalY > SWIPE_CLOSE_THRESHOLD || velocity > 0.4) {
      // Preserve drag position so the exit animation starts from here, not from top
      setExitDragY(finalY);
      setDragY(0);
      playSound('taskCancel');
      onClose();
    } else {
      // Snap back
      setDragY(0);
    }
    dragStartRef.current = null;
    isDraggingRef.current = false;
  }, [dragY, onClose]);

  if (!visible) return null;

  // While dragging: no transition (follow the finger).
  // Closing after swipe: slide to 100% from current position.
  // Snap-back: let CSS transition handle the bounce back to 0.
  const sheetStyle: React.CSSProperties = dragY > 0
    ? { transform: `translateY(${dragY}px)`, transition: 'none' }
    : exitDragY > 0 && !entered
      ? { transform: `translateY(100%)`, transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }
      : {};

  // Backdrop opacity dims proportionally during drag
  const backdropStyle: React.CSSProperties = dragY > 0
    ? { opacity: Math.max(0, 1 - dragY / 300), transition: 'none' }
    : {};

  return (
    <>
      <div
        className="pxd-sheet-backdrop"
        data-open={entered ? 'true' : 'false'}
        style={backdropStyle}
        onClick={() => { playSound('taskCancel'); onClose(); }}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'pxd-sheet-title' : undefined}
        className={['pxd-sheet', className].filter(Boolean).join(' ')}
        data-open={entered ? 'true' : 'false'}
        style={sheetStyle}
      >
        {/* Drag handle — visible swipe affordance */}
        <div
          className="pxd-sheet-drag-handle"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="pxd-sheet-drag-pill" />
        </div>
        <div
          className="pxd-sheet-header"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <h2 id="pxd-sheet-title" className="pxd-sheet-title">
            {title ?? ''}
          </h2>
          <IconButton
            variant="ghost"
            size="md"
            aria-label="Close"
            icon={<span className="material-icons">close</span>}
            soundKey="taskCancel"
            onClick={onClose}
            className="pxd-sheet-close"
          />
        </div>
        <div className={['pxd-sheet-body', bodyClassName].filter(Boolean).join(' ')}>
          {children}
        </div>
      </div>
    </>
  );
}
