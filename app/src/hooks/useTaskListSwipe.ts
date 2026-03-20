import { useEffect, useRef } from 'react';
import { isEditingText } from '../lib/utils';

type SwipeDirection = 'left' | 'right';

interface UseTaskListSwipeOptions {
  enabled: boolean;
  onSwipe: (dir: SwipeDirection) => void;
}

function isInteractiveTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return Boolean(
    el.closest?.(
      [
        'button',
        'a',
        'input',
        'textarea',
        'select',
        'label',
        '[role="button"]',
        '[role="switch"]',
        '[contenteditable="true"]',
      ].join(',')
    )
  );
}

/**
 * Mobile: detect horizontal swipe on the task list area (while preserving vertical scroll).
 * - Do NOT call preventDefault() until a horizontal lock condition is met.
 * - Call onSwipe at most once per gesture.
 */
export function useTaskListSwipe({ enabled, onSwipe }: UseTaskListSwipeOptions) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let locked = false;
    let fired = false;

    const onPointerDown = (e: PointerEvent) => {
      if (pointerId !== null) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return; // left click only
      if (isEditingText()) return;
      if (isInteractiveTarget(e.target)) return;

      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startTime = performance.now();
      locked = false;
      fired = false;

      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // ignore (some browsers may throw)
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId === null || e.pointerId !== pointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (!locked) {
        // Horizontal lock heuristic:
        // - must be clearly horizontal
        // - do not block scroll until we are sure it's a swipe
        if (absDx > 8 && absDx > absDy * 1.2) {
          locked = true;
        }
      }

      if (locked) {
        // Prevent browser swipe-back / horizontal scroll once we committed to horizontal gesture.
        e.preventDefault();
      }
    };

    const onPointerUpOrCancel = (e: PointerEvent) => {
      if (pointerId === null || e.pointerId !== pointerId) return;

      const dx = e.clientX - startX;
      const absDx = Math.abs(dx);
      const elapsedMs = Math.max(1, performance.now() - startTime);

      if (locked && !fired) {
        const viewportWidth = el.clientWidth || window.innerWidth || 375;
        const switchThreshold = Math.max(50, viewportWidth * 0.25); // 25% viewport width
        const velocityPxPerMs = absDx / elapsedMs;
        const velocityThresholdPxPerMs = 0.6;

        if (absDx >= switchThreshold || velocityPxPerMs > velocityThresholdPxPerMs) {
          fired = true;
          // dir means finger direction: left => next list, right => previous list
          onSwipe(dx < 0 ? 'left' : 'right');
        }
      }

      pointerId = null;
      locked = false;
      fired = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    el.addEventListener('pointerdown', onPointerDown, { passive: true });
    el.addEventListener('pointermove', onPointerMove, { passive: false });
    el.addEventListener('pointerup', onPointerUpOrCancel, { passive: true });
    el.addEventListener('pointercancel', onPointerUpOrCancel, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUpOrCancel);
      el.removeEventListener('pointercancel', onPointerUpOrCancel);
    };
  }, [enabled, onSwipe]);

  return ref;
}

