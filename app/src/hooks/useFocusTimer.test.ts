import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFocusTimer } from './useFocusTimer';

describe('useFocusTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in idle state with 25 minutes remaining', () => {
    const { result } = renderHook(() => useFocusTimer());
    expect(result.current.timerState).toBe('idle');
    expect(result.current.remaining).toBe(25 * 60);
  });

  it('transitions to running state on start()', () => {
    const { result } = renderHook(() => useFocusTimer());
    act(() => result.current.start());
    expect(result.current.timerState).toBe('running');
  });

  it('decrements remaining over time', () => {
    const { result } = renderHook(() => useFocusTimer());
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remaining).toBeLessThan(25 * 60);
  });

  it('pauses and stops decrementing', () => {
    const { result } = renderHook(() => useFocusTimer());
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    const snapshotAfterPause = result.current.remaining;
    act(() => result.current.pause());
    expect(result.current.timerState).toBe('paused');
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remaining).toBe(snapshotAfterPause);
  });

  it('resumes from paused and continues countdown', () => {
    const { result } = renderHook(() => useFocusTimer());
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.pause());
    const beforeResume = result.current.remaining;
    act(() => result.current.resume());
    expect(result.current.timerState).toBe('running');
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remaining).toBeLessThan(beforeResume);
  });

  it('resets to provided seconds and returns to idle', () => {
    const { result } = renderHook(() => useFocusTimer());
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    act(() => result.current.reset(10 * 60));
    expect(result.current.timerState).toBe('idle');
    expect(result.current.remaining).toBe(10 * 60);
  });

  it('calls onTimerEnd when countdown reaches zero', () => {
    const onTimerEnd = vi.fn();
    const { result } = renderHook(() => useFocusTimer(onTimerEnd));
    act(() => result.current.reset(2));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(onTimerEnd).toHaveBeenCalledTimes(1);
    expect(result.current.timerState).toBe('idle');
    expect(result.current.remaining).toBe(0);
  });

  it('does not call onTimerEnd when reset before expiry', () => {
    const onTimerEnd = vi.fn();
    const { result } = renderHook(() => useFocusTimer(onTimerEnd));
    act(() => result.current.reset(5));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.reset(25 * 60));
    act(() => vi.advanceTimersByTime(3000));
    expect(onTimerEnd).not.toHaveBeenCalled();
  });

  it('does not throw when paused and timer is already stopped', () => {
    const { result } = renderHook(() => useFocusTimer());
    expect(() => act(() => result.current.pause())).not.toThrow();
  });

  it('syncs remaining on visibilitychange when running', () => {
    const { result } = renderHook(() => useFocusTimer());
    act(() => result.current.reset(10));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    const beforeSync = result.current.remaining;
    // Simulate returning from background
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current.remaining).toBeLessThanOrEqual(beforeSync);
  });
});
