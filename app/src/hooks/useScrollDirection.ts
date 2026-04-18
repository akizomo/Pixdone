import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Detects scroll direction on the main content area.
 * Uses a MutationObserver to find the scroll container reliably,
 * even if it mounts after the hook runs.
 *
 * Returns 'up' | 'down'. Default is 'up' (chrome visible).
 */
export function useScrollDirection(threshold = 40): 'up' | 'down' {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const lastY = useRef(0);
  const ticking = useRef(false);
  const elRef = useRef<Element | null>(null);

  const onScroll = useCallback(() => {
    if (ticking.current || !elRef.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const y = elRef.current?.scrollTop ?? 0;
      // Near top: always show chrome (prevents bounce-back false trigger)
      if (y < threshold) {
        setDirection('up');
        lastY.current = y;
        ticking.current = false;
        return;
      }
      const diff = y - lastY.current;
      if (diff > threshold) {
        setDirection('down');
        lastY.current = y;
      } else if (diff < -threshold) {
        setDirection('up');
        lastY.current = y;
      }
      ticking.current = false;
    });
  }, [threshold]);

  useEffect(() => {
    // Try to attach immediately
    const attach = () => {
      const el = document.querySelector('.pd-app-body > main');
      if (!el || el === elRef.current) return false;
      elRef.current?.removeEventListener('scroll', onScroll);
      elRef.current = el;
      lastY.current = el.scrollTop;
      el.addEventListener('scroll', onScroll, { passive: true });
      return true;
    };

    if (attach()) {
      // Already found
    }

    // If not found yet (or main re-mounts), poll briefly
    const interval = setInterval(() => {
      attach();
    }, 500);

    // Also watch for DOM changes
    const observer = new MutationObserver(() => attach());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
      elRef.current?.removeEventListener('scroll', onScroll);
      elRef.current = null;
    };
  }, [onScroll]);

  return direction;
}
