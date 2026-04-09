import { useState, useRef, useEffect, useCallback } from 'react';
import { trackPomodoroComplete } from '../services/analytics';

export type FocusTimerState = 'idle' | 'running' | 'paused';

export function useFocusTimer(onTimerEnd?: () => void) {
  const [timerState, setTimerState] = useState<FocusTimerState>('idle');
  const [remaining, setRemaining] = useState(25 * 60);
  // Mirror remaining in a ref for synchronous access (avoids stale closure in startTick).
  const remainingRef = useRef(25 * 60);
  // Total duration in seconds for the current session (set when timer starts).
  const totalDurationRef = useRef(25 * 60);
  // How many pomodoros completed in this hook lifecycle.
  const sessionCountRef = useRef(0);
  // Unix ms when the timer should reach 0. null when not running.
  const deadlineRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimerEndRef = useRef(onTimerEnd);
  onTimerEndRef.current = onTimerEnd;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const updateRemaining = (secs: number) => {
    remainingRef.current = secs;
    setRemaining(secs);
  };

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const syncRemaining = useCallback(() => {
    if (deadlineRef.current === null) return;
    const newRemaining = Math.ceil((deadlineRef.current - Date.now()) / 1000);
    if (newRemaining <= 0) {
      clearTick();
      deadlineRef.current = null;
      updateRemaining(0);
      setTimerState('idle');
      sessionCountRef.current += 1;
      trackPomodoroComplete({
        duration_minutes: Math.round(totalDurationRef.current / 60),
        session_index: sessionCountRef.current,
      });
      onTimerEndRef.current?.();
    } else {
      updateRemaining(newRemaining);
    }
  }, [clearTick]);

  const startTick = useCallback((remainingSeconds: number) => {
    clearTick();
    deadlineRef.current = Date.now() + remainingSeconds * 1000;
    // 500ms interval: more responsive than 1s, still deadline-based so no drift.
    intervalRef.current = setInterval(syncRemaining, 500);
  }, [clearTick, syncRemaining]);

  // Sync timer when iOS wakes from sleep.
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && deadlineRef.current !== null) {
        syncRemaining();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [syncRemaining]);

  const start = useCallback(() => {
    totalDurationRef.current = remainingRef.current;
    setTimerState('running');
    startTick(remainingRef.current);
  }, [startTick]);

  const pause = useCallback(() => {
    clearTick();
    deadlineRef.current = null;
    setTimerState('paused');
  }, [clearTick]);

  const resume = useCallback(() => {
    setTimerState('running');
    startTick(remainingRef.current);
  }, [startTick]);

  const reset = useCallback((seconds: number) => {
    clearTick();
    deadlineRef.current = null;
    setTimerState('idle');
    updateRemaining(seconds);
  }, [clearTick]);

  return { timerState, remaining, start, pause, resume, reset };
}
