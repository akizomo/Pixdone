import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { usePortalContainer } from '../../portal/PortalContainerContext';
import type { CoachmarkProps } from './Coachmark.types';
import './Coachmark.css';

/** Matches the arrow size in Coachmark.css (--pd-space-3). */
const ARROW_SIZE = 12;

/**
 * Coachmark — a speech bubble pointing at an existing UI element to introduce it.
 *
 * Non-modal: there is no backdrop and nothing is blocked. The first tap anywhere
 * (or Escape) dismisses it, and that tap still reaches its target, so tapping
 * the highlighted element both closes the bubble and opens the element.
 */
export function Coachmark({
  anchorEl,
  children,
  onDismiss,
  placement = 'bottom',
  className = '',
}: CoachmarkProps) {
  const portalContainer = usePortalContainer();
  const arrowRef = useRef<HTMLDivElement>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const { refs, floatingStyles, isPositioned, placement: finalPlacement, middlewareData, update } = useFloating({
    placement,
    strategy: 'fixed',
    open: anchorEl != null,
    elements: { reference: anchorEl ?? undefined },
    middleware: [
      offset(ARROW_SIZE),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef, padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Web fonts swapping in change the bubble's width after the first layout.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => { if (!cancelled) update(); });
    return () => { cancelled = true; };
  }, [update]);

  useEffect(() => {
    if (!anchorEl) return;
    const dismiss = () => onDismissRef.current();
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    // Defer so the interaction that mounted the bubble does not dismiss it.
    const raf = window.requestAnimationFrame(() => {
      document.addEventListener('pointerdown', dismiss, true);
      document.addEventListener('keydown', handleKey);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', dismiss, true);
      document.removeEventListener('keydown', handleKey);
    };
  }, [anchorEl]);

  if (!anchorEl) return null;

  const side = finalPlacement.split('-')[0] as 'top' | 'right' | 'bottom' | 'left';
  const staticSide = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[side];
  const arrowData = middlewareData.arrow;

  return createPortal(
    <div
      ref={refs.setFloating}
      role="status"
      aria-live="polite"
      data-side={side}
      className={`pd-coachmark ${className}`.trim()}
      style={{ ...floatingStyles, visibility: isPositioned ? 'visible' : 'hidden' }}
    >
      <div className="pd-coachmark__body">{children}</div>
      <div
        ref={arrowRef}
        className="pd-coachmark__arrow"
        aria-hidden="true"
        style={{
          left: arrowData?.x != null ? `${arrowData.x}px` : undefined,
          top: arrowData?.y != null ? `${arrowData.y}px` : undefined,
          [staticSide]: `${-ARROW_SIZE / 2 - 1}px`,
        }}
      />
    </div>,
    portalContainer ?? document.body,
  );
}
