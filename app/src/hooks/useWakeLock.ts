import { useEffect, useRef } from 'react';

/**
 * Requests a Screen Wake Lock while `active` is true.
 * Prevents the screen from sleeping during Pomodoro sessions on iOS 16.4+ / Chrome Android.
 * Silently no-ops on unsupported browsers.
 */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;

    let cancelled = false;

    const acquire = () => {
      navigator.wakeLock.request('screen').then((sentinel) => {
        if (cancelled) { sentinel.release(); return; }
        lockRef.current = sentinel;
        // Wake Lock is automatically released on visibility change (screen sleep).
        // Re-acquire when the page becomes visible again.
        sentinel.addEventListener('release', () => {
          if (!cancelled && document.visibilityState === 'visible') {
            acquire();
          }
        });
      }).catch(() => {});
    };

    acquire();

    return () => {
      cancelled = true;
      lockRef.current?.release();
      lockRef.current = null;
    };
  }, [active]);
}
