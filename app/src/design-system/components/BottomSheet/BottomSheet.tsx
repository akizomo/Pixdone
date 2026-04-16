import { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../../../services/sound';
import { IconButton } from '../IconButton/IconButton';
import { PixelIcon } from '../PixelIcon/PixelIcon';
import type { BottomSheetProps } from './BottomSheet.types';
import './BottomSheet.css';

/** Minimum downward swipe distance (px) to trigger close */
const SWIPE_CLOSE_THRESHOLD = 80;

/** Close slide-down duration (ms) — must match inline transition below */
const CLOSE_DURATION_MS = 280;

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
  /** When true, we drive the close animation via inline styles (immune to React batching) */
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);

  // ── Swipe-to-dismiss state ──
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<{ y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);

  // ── Open transition ──
  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
      // Double rAF to guarantee browser paints the off-screen state before sliding in
      let id1: number, id2: number;
      id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setEntered(true));
      });
      return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
    } else if (entered || visible) {
      // Trigger close animation via inline style (not CSS class)
      setClosing(true);
      setEntered(false);
    }
  }, [open]);

  // ── Unmount after close transition ends ──
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    // Only react to the sheet's own transform transition, not children's
    if (e.target !== sheetRef.current || e.propertyName !== 'transform') return;
    if (closing) {
      setClosing(false);
      setVisible(false);
    }
  }, [closing]);

  // Safety fallback: if onTransitionEnd doesn't fire (e.g. display:none, unmount race),
  // force unmount after duration + margin.
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => {
      setClosing(false);
      setVisible(false);
    }, CLOSE_DURATION_MS + 100);
    return () => clearTimeout(timer);
  }, [closing]);

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

  // ── Inline styles: drive close animation imperatively ──
  // This is immune to React 18's automatic batching — the style is applied
  // synchronously in the render, so the browser always sees the transition.
  let sheetStyle: React.CSSProperties;
  let backdropStyle: React.CSSProperties;

  if (dragY > 0) {
    // Dragging: follow the finger, no transition
    sheetStyle = { transform: `translateY(${dragY}px)`, transition: 'none' };
    backdropStyle = { opacity: Math.max(0, 1 - dragY / 300), transition: 'none' };
  } else if (closing) {
    // Closing (all paths): slide down via inline style
    sheetStyle = {
      transform: 'translateY(100%)',
      transition: `transform ${CLOSE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    };
    backdropStyle = {
      opacity: 0,
      transition: `opacity ${CLOSE_DURATION_MS - 30}ms ease`,
    };
  } else {
    // Open or opening: let CSS class handle via data-open
    sheetStyle = {};
    backdropStyle = {};
  }

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
        onTransitionEnd={handleTransitionEnd}
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
            icon={<PixelIcon name="close" />}
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
