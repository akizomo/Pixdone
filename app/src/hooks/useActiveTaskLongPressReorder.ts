import { useCallback, useRef, useState, type MutableRefObject } from 'react';

/** Long-press to arm reorder. */
const LONG_PRESS_MS = 200;
/** Mouse / pen: cancel long-press if pointer moves beyond this before it arms. */
const MOVE_CANCEL_PX = 14;
/** Touch: slightly larger slop — finger jitter should not cancel before long-press. */
const MOVE_CANCEL_TOUCH_PX = 32;

export type ActiveReorderDragState = {
  active: boolean;
  fromIndex: number | null;
  hoverIndex: number | null;
};

const INACTIVE_DRAG_STATE: ActiveReorderDragState = {
  active: false,
  fromIndex: null,
  hoverIndex: null,
};

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

/**
 * Same heuristic as `useTaskListSwipe`: on iOS, touch coordinates are reliable;
 * PointerEvent for finger touch is skipped in favor of Touch events.
 */
function shouldUseTouchGesturePath(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('ontouchstart' in window)) return false;
  try {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const noHover = window.matchMedia('(hover: none)').matches;
    const hasTouchPoints = (navigator.maxTouchPoints ?? 0) > 0;
    return coarse || (hasTouchPoints && noHover);
  } catch {
    return true;
  }
}

/**
 * Long-press then drag to reorder active task rows (mouse / touch / pen).
 * Uses [data-active-reorder-slot] wrappers for drop-index hit testing.
 */
export function useActiveTaskLongPressReorder(opts: {
  enabled: boolean;
  slotCount: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  suppressRowClickUntilRef: MutableRefObject<number>;
  /** Fired once when long-press arms (reorder mode). */
  onReorderModeStart?: () => void;
  /** Fired when hover drop index changes after armed (not on the initial arm). */
  onHoverSlotChange?: () => void;
}) {
  const {
    enabled,
    slotCount,
    onReorder,
    suppressRowClickUntilRef,
    onReorderModeStart,
    onHoverSlotChange,
  } = opts;

  const [dragState, setDragState] = useState<ActiveReorderDragState>(INACTIVE_DRAG_STATE);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onReorderModeStartRef = useRef(onReorderModeStart);
  const onHoverSlotChangeRef = useRef(onHoverSlotChange);
  onReorderModeStartRef.current = onReorderModeStart;
  onHoverSlotChangeRef.current = onHoverSlotChange;

  const onRowPointerDown = useCallback(
    (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || slotCount < 2) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // Finger touch on phones/tablets: Touch handlers own the gesture (iOS PointerEvent is unreliable).
      if (e.pointerType === 'touch' && shouldUseTouchGesturePath()) return;
      if ((e.target as HTMLElement).closest('button, a, input, textarea, select, label')) return;

      const rowEl = e.currentTarget;
      const prevUserSelect = rowEl.style.userSelect;
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

      const resetDragUi = () => {
        setDragState(INACTIVE_DRAG_STATE);
      };

      const finish = () => {
        clearTimer();
        detachWindowListeners();
        rowEl.style.userSelect = prevUserSelect;
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
          const next = findActiveDropIndex(root, ev.clientY, slotCount);
          if (next !== hoverIndexRef.current) {
            hoverIndexRef.current = next;
            setDragState((prev) =>
              prev.active ? { ...prev, hoverIndex: next } : prev,
            );
            onHoverSlotChangeRef.current?.();
          }
        }
      };

      const onWinUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        if (!longPressFired) {
          finish();
          return;
        }
        const from = index;
        const root = containerRef.current;
        if (root) {
          hoverIndexRef.current = findActiveDropIndex(root, ev.clientY, slotCount);
        }
        const to = hoverIndexRef.current;
        suppressRowClickUntilRef.current = Date.now() + 450;
        if (from !== to) {
          onReorder(from, to);
        }
        longPressFired = false;
        resetDragUi();
        finish();
      };

      timer = setTimeout(() => {
        timer = null;
        longPressFired = true;
        rowEl.style.userSelect = 'none';
        suppressRowClickUntilRef.current = Date.now() + 600;
        hoverIndexRef.current = index;
        setDragState({ active: true, fromIndex: index, hoverIndex: index });
        onReorderModeStartRef.current?.();
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

  const onRowTouchStart = useCallback(
    (index: number) => (e: React.TouchEvent<HTMLDivElement>) => {
      if (!enabled || slotCount < 2) return;
      if (!shouldUseTouchGesturePath()) return;
      if (e.touches.length !== 1) return;
      if ((e.target as HTMLElement).closest('button, a, input, textarea, select, label')) return;

      const rowEl = e.currentTarget;
      const prevUserSelect = rowEl.style.userSelect;
      const touch0 = e.touches[0];
      const touchId = touch0.identifier;
      const startX = touch0.clientX;
      const startY = touch0.clientY;
      let longPressFired = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const hoverIndexRef = { current: index };

      const touchInTouches = (ev: TouchEvent) =>
        Array.from(ev.touches).find((t) => t.identifier === touchId);

      const clearTimer = () => {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      };

      const detachWindowListeners = () => {
        window.removeEventListener('touchmove', onWinMove);
        window.removeEventListener('touchend', onWinEnd);
        window.removeEventListener('touchcancel', onWinEnd);
      };

      const resetDragUi = () => {
        setDragState(INACTIVE_DRAG_STATE);
      };

      const finish = () => {
        clearTimer();
        detachWindowListeners();
        rowEl.style.userSelect = prevUserSelect;
      };

      const onWinMove = (ev: TouchEvent) => {
        const t = touchInTouches(ev);
        if (!t) return;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (!longPressFired) {
          if (dx * dx + dy * dy > MOVE_CANCEL_TOUCH_PX * MOVE_CANCEL_TOUCH_PX) {
            finish();
          }
          return;
        }
        ev.preventDefault();
        const root = containerRef.current;
        if (root) {
          const next = findActiveDropIndex(root, t.clientY, slotCount);
          if (next !== hoverIndexRef.current) {
            hoverIndexRef.current = next;
            setDragState((prev) =>
              prev.active ? { ...prev, hoverIndex: next } : prev,
            );
            onHoverSlotChangeRef.current?.();
          }
        }
      };

      const onWinEnd = (ev: TouchEvent) => {
        const tEnd = Array.from(ev.changedTouches).find((t) => t.identifier === touchId);
        if (!tEnd) return;
        if (!longPressFired) {
          finish();
          return;
        }
        const root = containerRef.current;
        if (root) {
          hoverIndexRef.current = findActiveDropIndex(root, tEnd.clientY, slotCount);
        }
        const from = index;
        const to = hoverIndexRef.current;
        suppressRowClickUntilRef.current = Date.now() + 450;
        if (from !== to) {
          onReorder(from, to);
        }
        longPressFired = false;
        resetDragUi();
        finish();
      };

      timer = setTimeout(() => {
        timer = null;
        longPressFired = true;
        rowEl.style.userSelect = 'none';
        suppressRowClickUntilRef.current = Date.now() + 600;
        hoverIndexRef.current = index;
        setDragState({ active: true, fromIndex: index, hoverIndex: index });
        onReorderModeStartRef.current?.();
      }, LONG_PRESS_MS);

      window.addEventListener('touchmove', onWinMove, { passive: false });
      window.addEventListener('touchend', onWinEnd, { passive: false });
      window.addEventListener('touchcancel', onWinEnd, { passive: false });
    },
    [enabled, slotCount, onReorder, suppressRowClickUntilRef],
  );

  return { containerRef, onRowPointerDown, onRowTouchStart, dragState };
}
