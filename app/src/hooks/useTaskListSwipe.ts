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
 *
 * On iOS, PointerEvent coordinates can be unreliable for horizontal direction; we use Touch
 * events on coarse pointers only and skip the Pointer path to avoid double-firing.
 */
export function useTaskListSwipe({ enabled, onSwipe }: UseTaskListSwipeOptions) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    // Prefer Touch events on real touch devices: iOS PointerEvent X can be wrong → dx always < 0.
    const useTouch =
      typeof window !== 'undefined' &&
      'ontouchstart' in window &&
      (() => {
        try {
          const coarse = window.matchMedia('(pointer: coarse)').matches;
          const noHover = window.matchMedia('(hover: none)').matches;
          const hasTouchPoints = (navigator.maxTouchPoints ?? 0) > 0;
          return coarse || (hasTouchPoints && noHover);
        } catch {
          return true;
        }
      })();

    /* ---------- Touch path (phones / coarse pointer): reliable dx on iOS ---------- */
    if (useTouch) {
      let activeTouchId: number | null = null;
      let startX = 0;
      let startY = 0;
      let lastX = 0;
      let startTime = 0;
      let locked = false;
      let fired = false;

      const reset = () => {
        activeTouchId = null;
        locked = false;
        fired = false;
      };

      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        if (isEditingText()) return;
        if (isInteractiveTarget(e.target)) return;
        const t = e.touches[0];
        activeTouchId = t.identifier;
        startX = t.clientX;
        startY = t.clientY;
        lastX = t.clientX;
        startTime = performance.now();
        locked = false;
        fired = false;
      };

      const onTouchMove = (e: TouchEvent) => {
        if (activeTouchId === null) return;
        const t = Array.from(e.touches).find((x) => x.identifier === activeTouchId);
        if (!t) return;

        lastX = t.clientX;
        const dx = lastX - startX;
        const dy = t.clientY - startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (!locked) {
          if (absDx > 6 && absDx > absDy * 1.1) {
            locked = true;
          }
        }

        if (locked) {
          e.preventDefault();
        }
      };

      const onTouchEndOrCancel = (e: TouchEvent) => {
        if (activeTouchId === null) return;
        const t = Array.from(e.changedTouches).find((x) => x.identifier === activeTouchId);
        if (!t) return;

        const endX = t.clientX;
        const dx = endX - startX;
        const absDx = Math.abs(dx);
        const elapsedMs = Math.max(1, performance.now() - startTime);

        if (locked && !fired) {
          const viewportWidth = el.clientWidth || window.innerWidth || 375;
          const switchThreshold = Math.max(50, viewportWidth * 0.25);
          const velocityPxPerMs = absDx / elapsedMs;
          const velocityThresholdPxPerMs = 0.6;

          if (absDx >= switchThreshold || velocityPxPerMs > velocityThresholdPxPerMs) {
            fired = true;
            onSwipe(dx < 0 ? 'left' : 'right');
          }
        }

        reset();
      };

      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      el.addEventListener('touchend', onTouchEndOrCancel, { passive: false });
      el.addEventListener('touchcancel', onTouchEndOrCancel, { passive: false });

      return () => {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('touchend', onTouchEndOrCancel);
        el.removeEventListener('touchcancel', onTouchEndOrCancel);
      };
    }

    /* ---------- Pointer path (mouse / fine pointer): devtools, desktop narrow window) ---------- */
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let startTime = 0;
    let locked = false;
    let fired = false;

    const onPointerDown = (e: PointerEvent) => {
      if (pointerId !== null) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (isEditingText()) return;
      if (isInteractiveTarget(e.target)) return;

      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      startTime = performance.now();
      locked = false;
      fired = false;

      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId === null || e.pointerId !== pointerId) return;

      lastX = e.clientX;
      const dx = lastX - startX;
      const dy = e.clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (!locked) {
        if (absDx > 6 && absDx > absDy * 1.1) {
          locked = true;
        }
      }

      if (locked) {
        e.preventDefault();
      }
    };

    const onPointerUpOrCancel = (e: PointerEvent) => {
      if (pointerId === null || e.pointerId !== pointerId) return;

      const captureId = e.pointerId;
      const dx = lastX - startX;
      const absDx = Math.abs(dx);
      const elapsedMs = Math.max(1, performance.now() - startTime);

      if (locked && !fired) {
        const viewportWidth = el.clientWidth || window.innerWidth || 375;
        const switchThreshold = Math.max(50, viewportWidth * 0.25);
        const velocityPxPerMs = absDx / elapsedMs;
        const velocityThresholdPxPerMs = 0.6;

        if (absDx >= switchThreshold || velocityPxPerMs > velocityThresholdPxPerMs) {
          fired = true;
          onSwipe(dx < 0 ? 'left' : 'right');
        }
      }

      pointerId = null;
      locked = false;
      fired = false;
      try {
        el.releasePointerCapture(captureId);
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
