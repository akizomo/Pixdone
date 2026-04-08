import { useEffect, useMemo, useRef, useState } from 'react';
import { createSwapy, utils, type SlotItemMapArray, type Swapy } from 'swapy';

type Identifiable = { id: string };

type UseSwapyActiveTaskReorderOpts<TItem extends Identifiable> = {
  enabled: boolean;
  items: TItem[];
  /**
   * Called after a swap is committed and the dragged item ends up at a new index.
   * Indices refer to the *active items array* order provided in `items`.
   */
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDragStart?: () => void;
  onDragCommit?: () => void;
};

export function useSwapyActiveTaskReorder<TItem extends Identifiable>(
  opts: UseSwapyActiveTaskReorderOpts<TItem>,
) {
  const { enabled, items, onReorder, onDragStart, onDragCommit } = opts;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const swapyRef = useRef<Swapy | null>(null);

  const [slotItemMap, setSlotItemMap] = useState<SlotItemMapArray>(() =>
    utils.initSlotItemMap(items, 'id'),
  );

  // Keep a fresh reference for event handlers without re-subscribing.
  const itemsRef = useRef(items);
  const onReorderRef = useRef(onReorder);
  const onDragStartRef = useRef(onDragStart);
  const onDragCommitRef = useRef(onDragCommit);
  itemsRef.current = items;
  onReorderRef.current = onReorder;
  onDragStartRef.current = onDragStart;
  onDragCommitRef.current = onDragCommit;

  const slottedItems = useMemo(
    () => utils.toSlottedItems(items, 'id', slotItemMap),
    [items, slotItemMap],
  );

  // When items are added/removed, update Swapy's internal slot map as well.
  useEffect(() => {
    utils.dynamicSwapy(swapyRef.current, items, 'id', slotItemMap, setSlotItemMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Recreate when enabling/disabling to avoid stale listeners.
    swapyRef.current?.destroy();
    swapyRef.current = null;

    if (!enabled || items.length < 2) return;

    const swapy = createSwapy(container, {
      manualSwap: true,
      enabled: true,
      animation: 'dynamic',
      swapMode: 'hover',
      dragAxis: 'y',
      dragOnHold: true,
      autoScrollOnDrag: true,
    });

    const lastDraggingItemIdRef: { current: string | null } = { current: null };

    swapy.onSwapStart((event) => {
      lastDraggingItemIdRef.current = event.draggingItem;
      onDragStartRef.current?.();
    });

    swapy.onSwap((event) => {
      // Keep React as the source of truth.
      setSlotItemMap(event.newSlotItemMap.asArray);
    });

    swapy.onSwapEnd((event) => {
      if (!event.hasChanged) return;
      const draggingId = lastDraggingItemIdRef.current;
      if (!draggingId) return;
      const oldOrder = itemsRef.current.map((t) => t.id);
      const newOrder = event.slotItemMap.asArray.map((p) => p.item).filter(Boolean);
      if (newOrder.length !== oldOrder.length) return;

      const from = oldOrder.indexOf(draggingId);
      const to = newOrder.indexOf(draggingId);
      if (from >= 0 && to >= 0 && from !== to) {
        onReorderRef.current(from, to);
        onDragCommitRef.current?.();
      }
    });

    swapyRef.current = swapy;

    return () => {
      swapy.destroy();
      if (swapyRef.current === swapy) swapyRef.current = null;
    };
  }, [enabled, items.length]);

  return { containerRef, slottedItems, slotItemMap, setSlotItemMap };
}

