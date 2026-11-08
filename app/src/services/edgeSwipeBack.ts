/**
 * iOS-style interactive back: drag from the left edge to slide the current screen away.
 * The screen is the closest [data-pd-screen] around the visible [data-pd-back] button;
 * committing the gesture clicks that button, so navigation and sound stay in one place.
 * Android uses the system back gesture instead (nativeShell.ts → backButton).
 */

/** Touches starting within this distance of the left edge arm the gesture. */
const EDGE_PX = 24;
/** Horizontal travel before the gesture locks in (vertical travel first cancels it). */
const LOCK_PX = 10;
/** Commit when dragged past this fraction of the width… */
const COMMIT_RATIO = 0.35;
/** …or when released faster than this (px/ms). */
const COMMIT_VELOCITY = 0.5;
/** Upper bound for the settle animation (--pd-motion-slow + slack). */
const SETTLE_FALLBACK_MS = 400;

const OVERLAY = '[aria-modal="true"], [role="menu"]';

function findTarget(): { screen: HTMLElement; back: HTMLElement } | null {
  if (document.querySelector(OVERLAY)) return null;
  const backs = document.querySelectorAll<HTMLElement>('[data-pd-back]');
  const back = backs[backs.length - 1];
  const screen = back?.closest<HTMLElement>('[data-pd-screen]');
  return back && screen ? { screen, back } : null;
}

export function initEdgeSwipeBack(): void {
  let target: { screen: HTMLElement; back: HTMLElement } | null = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let locked = false;

  const settle = (screen: HTMLElement, commit: boolean, back: HTMLElement) => {
    screen.classList.add('pd-edge-swipe--settling');
    screen.style.transform = commit ? 'translateX(100%)' : '';
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      screen.classList.remove('pd-edge-swipe', 'pd-edge-swipe--settling');
      if (commit) {
        // The screen already slid off by itself: navigate without a second push/pop animation.
        const root = document.documentElement;
        root.dataset.pdNoTransition = '1';
        back.click();
        delete root.dataset.pdNoTransition;
        // If the screen is still mounted (navigation was refused), put it back.
        requestAnimationFrame(() => { screen.style.transform = ''; });
      }
    };
    screen.addEventListener('transitionend', done, { once: true });
    // No transitionend with reduced motion (0ms) or when the transform didn't change.
    window.setTimeout(done, SETTLE_FALLBACK_MS);
  };

  document.addEventListener('touchstart', (e) => {
    target = null;
    locked = false;
    const t = e.touches[0];
    if (e.touches.length !== 1 || t.clientX > EDGE_PX) return;
    target = findTarget();
    startX = lastX = t.clientX;
    startY = t.clientY;
    lastT = e.timeStamp;
    velocity = 0;
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', (e) => {
    if (!target) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (!locked) {
      if (Math.abs(dy) > LOCK_PX && Math.abs(dy) > Math.abs(dx)) { target = null; return; }
      if (dx < LOCK_PX) return;
      locked = true;
      target.screen.classList.add('pd-edge-swipe');
    }
    e.preventDefault();
    const dt = Math.max(e.timeStamp - lastT, 1);
    velocity = (t.clientX - lastX) / dt;
    lastX = t.clientX;
    lastT = e.timeStamp;
    target.screen.style.transform = `translateX(${Math.max(0, dx)}px)`;
  }, { passive: false, capture: true });

  const end = () => {
    if (!target) return;
    const { screen, back } = target;
    target = null;
    if (!locked) return;
    const dx = lastX - startX;
    const commit = dx > screen.offsetWidth * COMMIT_RATIO || velocity > COMMIT_VELOCITY;
    settle(screen, commit, back);
  };
  document.addEventListener('touchend', end, { capture: true });
  document.addEventListener('touchcancel', end, { capture: true });
}
