/**
 * iOS-style push / pop between full-page screens, built on the View Transitions API.
 *
 * Usage: wrap the navigation in `runPageTransition(update, direction)`. The browser snapshots the
 * old screen, we run `update` (the router navigation), wait until React committed the new route
 * (`settlePageTransition`, called from App), then the snapshots animate. The CSS lives in
 * design-system/theme/global.css and reads `data-pd-nav` on <html>.
 *
 * Skipped (navigation just happens) when: the API is missing, reduced motion is on, or the screen
 * already moved by itself (edge swipe-back sets `data-pd-no-transition`).
 */

export type NavDirection = 'forward' | 'back';

/** Give up waiting for the route to commit (e.g. navigation refused) so the page never hangs. */
const COMMIT_TIMEOUT_MS = 500;

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void>) => { finished: Promise<void> };
};

let pendingCommit: (() => void) | null = null;
let activeId = 0;

/** Called by App once the new route is rendered. */
export function settlePageTransition(): void {
  pendingCommit?.();
}

export function runPageTransition(update: () => void, direction: NavDirection): void {
  const doc = document as ViewTransitionDocument;
  const root = document.documentElement;
  let reduced = false;
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch { /* no matchMedia */ }

  if (!doc.startViewTransition || reduced || root.dataset.pdNoTransition || pendingCommit) {
    update();
    return;
  }

  const id = ++activeId;
  root.dataset.pdNav = direction;
  try {
    const transition = doc.startViewTransition(() => new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        if (pendingCommit === done) pendingCommit = null;
        resolve();
      };
      const timer = setTimeout(done, COMMIT_TIMEOUT_MS);
      pendingCommit = done;
      update();
    }));
    const cleanup = () => { if (id === activeId) delete root.dataset.pdNav; };
    transition.finished.then(cleanup, cleanup);
  } catch {
    delete root.dataset.pdNav;
    update();
  }
}
