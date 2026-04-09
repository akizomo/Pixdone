import { useEffect, useState } from 'react';

/** Returns a counter that increments at midnight, triggering re-renders that depend on "today". */
export function useMidnightRefresh(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function scheduleNextMidnight() {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      const ms = next.getTime() - now.getTime();
      return setTimeout(() => {
        setTick((t) => t + 1);
        scheduleNextMidnight();
      }, ms);
    }
    const id = scheduleNextMidnight();
    return () => clearTimeout(id);
  }, []);

  return tick;
}
