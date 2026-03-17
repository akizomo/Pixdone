import { useState, useRef, useEffect, useCallback } from 'react';

export type FocusTimerState = 'idle' | 'running' | 'paused';

export function useFocusTimer(onTimerEnd?: () => void) {
  const [timerState, setTimerState] = useState<FocusTimerState>('idle');
  const [remaining, setRemaining] = useState(25 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimerEndRef = useRef(onTimerEnd);
  onTimerEndRef.current = onTimerEnd;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearTick = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTick();
          setTimerState('idle');
          onTimerEndRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const start = useCallback(() => {
    setTimerState('running');
    startTick();
  }, [startTick]);

  const pause = useCallback(() => {
    clearTick();
    setTimerState('paused');
  }, []);

  const resume = useCallback(() => {
    setTimerState('running');
    startTick();
  }, [startTick]);

  const reset = useCallback((seconds: number) => {
    clearTick();
    setTimerState('idle');
    setRemaining(seconds);
  }, []);

  return { timerState, remaining, start, pause, resume, reset };
}
