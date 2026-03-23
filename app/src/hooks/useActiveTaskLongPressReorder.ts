import { useCallback, useRef, type MutableRefObject } from 'react';

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 14;

function findActiveDropIndex(container: Element, clientY: number, slotCount: number): number {
  const slots = container.querySelectorAll('[data-active-reorder-slot]');
  if (slots.length === 0 || slotCount <= 0) return 0;
  for (let i = 0; i < slots.length; i++) {
    const r = slots[i].getBoundingClientRect();
    const mid = r.top + r.height / 2;
    if (clientY < mid) return i;
  }
  return slotCount - 1;
}

function isReorderPointer(e: React.PointerEvent) {
  if (e.pointerType === 'mouse') return false;
  return e.pointerType === 'touch' || e.pointerType === 'pen';
}

/**
 * Long-press then drag to reorder active task rows (touch / pen; not mouse).
 * Uses [data-active-reorder-slot] wrappers for drop-index hit testing.
 */
export function useActiveTaskLongPressReorder(opts: {
  enabled: boolean;
  slotCount: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  suppressRowClickUntilRef: MutableRefObject<number>;
}) {
  const { enabled, slotCount, onReorder, suppressRowClickUntilRef } = opts;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onRowPointerDown = useCallback(
    (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || slotCount < 2) return;
      if (!isReorderPointer(e)) return;
      if ((e.target as HTMLElement).closest('button, a, input, textarea, select, label')) return;

      const rowEl = e.currentTarget;
      const startX = e.clientX;
      const startY = e.clientY;
      const pointerId = e.pointerId;
      let longPressFired = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const hoverIndexRef = { current: index };

      const clearTimer = () => {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      };

      const detachWindowListeners = () => {
        window.removeEventListener('pointermove', onWinMove);
        window.removeEventListener('pointerup', onWinUp);
        window.removeEventListener('pointercancel', onWinUp);
      };

      const finish = () => {
        clearTimer();
        detachWindowListeners();
        try {
          if (rowEl.hasPointerCapture(pointerId)) rowEl.releasePointerCapture(pointerId);
        } catch {
          /* ignore */
        }
      };

      const onWinMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!longPressFired) {
          if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
            finish();
          }
          return;
        }
        ev.preventDefault();
        const root = containerRef.current;
        if (root) {
          hoverIndexRef.current = findActiveDropIndex(root, ev.clientY, slotCount);
        }
      };

      const onWinUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        if (!longPressFired) {
          finish();
          return;
        }
        const from = index;
        const to = hoverIndexRef.current;
        suppressRowClickUntilRef.current = Date.now() + 450;
        if (from !== to) {
          onReorder(from, to);
        }
        longPressFired = false;
        finish();
      };

      timer = setTimeout(() => {
        timer = null;
        longPressFired = true;
        suppressRowClickUntilRef.current = Date.now() + 600;
        hoverIndexRef.current = index;
        try {
          rowEl.setPointerCapture(pointerId);
        } catch {
          /* ignore */
        }
      }, LONG_PRESS_MS);

      window.addEventListener('pointermove', onWinMove, { passive: false });
      window.addEventListener('pointerup', onWinUp);
      window.addEventListener('pointercancel', onWinUp);
    },
    [enabled, slotCount, onReorder, suppressRowClickUntilRef],
  );

  return { containerRef, onRowPointerDown };
}
