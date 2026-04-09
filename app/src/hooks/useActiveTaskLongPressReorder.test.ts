import { renderHook, act } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useActiveTaskLongPressReorder } from './useActiveTaskLongPressReorder';

function mountTwoSlotList(): HTMLDivElement {
  document.body.replaceChildren();
  const root = document.createElement('div');
  const s0 = document.createElement('div');
  s0.setAttribute('data-active-reorder-slot', '');
  const s1 = document.createElement('div');
  s1.setAttribute('data-active-reorder-slot', '');
  root.appendChild(s0);
  root.appendChild(s1);
  document.body.appendChild(root);
  vi.spyOn(s0, 'getBoundingClientRect').mockReturnValue({
    top: 0,
    height: 40,
    left: 0,
    width: 100,
    bottom: 40,
    right: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
  vi.spyOn(s1, 'getBoundingClientRect').mockReturnValue({
    top: 40,
    height: 40,
    left: 0,
    width: 100,
    bottom: 80,
    right: 100,
    x: 0,
    y: 40,
    toJSON: () => ({}),
  } as DOMRect);
  return root;
}

describe('useActiveTaskLongPressReorder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('calls onReorder after mouse long-press and pointer move to another slot', () => {
    const onReorder = vi.fn();
    const suppressRef = { current: 0 };
    const root = mountTwoSlotList();
    const row = document.createElement('div');
    document.body.appendChild(row);

    const { result } = renderHook(() =>
      useActiveTaskLongPressReorder({
        enabled: true,
        slotCount: 2,
        onReorder,
        suppressRowClickUntilRef: suppressRef,
      }),
    );

    act(() => {
      result.current.containerRef.current = root;
    });

    const pointerId = 7;
    const down = result.current.onRowPointerDown(0);
    act(() => {
      down({
        pointerType: 'mouse',
        button: 0,
        pointerId,
        clientX: 10,
        clientY: 10,
        currentTarget: row,
        target: row,
        preventDefault: () => {},
      } as unknown as ReactPointerEvent<HTMLDivElement>);
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: 10,
          clientY: 50,
          pointerId,
          pointerType: 'mouse',
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          clientX: 10,
          clientY: 50,
          pointerId,
          pointerType: 'mouse',
        }),
      );
    });

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onReorder).toHaveBeenCalledWith(0, 1);
  });

  it('does not call onReorder on quick mouse click (release before long-press)', () => {
    const onReorder = vi.fn();
    const suppressRef = { current: 0 };
    const root = mountTwoSlotList();
    const row = document.createElement('div');
    document.body.appendChild(row);

    const { result } = renderHook(() =>
      useActiveTaskLongPressReorder({
        enabled: true,
        slotCount: 2,
        onReorder,
        suppressRowClickUntilRef: suppressRef,
      }),
    );

    act(() => {
      result.current.containerRef.current = root;
    });

    const pointerId = 3;
    const down = result.current.onRowPointerDown(0);
    act(() => {
      down({
        pointerType: 'mouse',
        button: 0,
        pointerId,
        clientX: 10,
        clientY: 10,
        currentTarget: row,
        target: row,
        preventDefault: () => {},
      } as unknown as ReactPointerEvent<HTMLDivElement>);
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          clientX: 10,
          clientY: 10,
          pointerId,
          pointerType: 'mouse',
        }),
      );
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onReorder).not.toHaveBeenCalled();
  });
});
