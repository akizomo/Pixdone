import { useCallback } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import type { NavigateOptions, To } from 'react-router-dom';
import { runPageTransition, type NavDirection } from '../services/pageTransition';

/** Full-page screens that slide in over the main screen (same set as App's `isSubPage`). */
const SUB_PATHS = new Set(['/pricing', '/account', '/feedback']);

function isSubPath(pathname: string): boolean {
  if (SUB_PATHS.has(pathname)) return true;
  // Collection is a full page on touch devices; on desktop it sits next to the side panel.
  return pathname === '/collection' && !window.matchMedia('(any-pointer: fine)').matches;
}

function targetOf(to: To): { pathname: string; search: string } {
  const url = new URL(typeof to === 'string' ? to : `${to.pathname ?? ''}${to.search ?? ''}`, window.location.href);
  return { pathname: url.pathname, search: url.search };
}

function directionFor(to: To, replace: boolean): NavDirection | null {
  const target = targetOf(to);
  const here = window.location;
  if (target.pathname === here.pathname && target.search === here.search) return null;
  const from = isSubPath(here.pathname);
  const next = isSubPath(target.pathname);
  if (from && !next) return 'back';
  if (!next) return null;
  // Replacing the entry (tab/filter changes inside a screen) shouldn't look like opening a page.
  return replace ? null : 'forward';
}

type AppNavigate = {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
};

/**
 * Drop-in replacement for react-router's `useNavigate` that plays the iOS push / pop transition
 * when moving into or out of a full-page screen. Always import this one in the app.
 */
export function useNavigate(): AppNavigate {
  const navigate = useRouterNavigate();
  return useCallback(((to: To | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      if (to < 0) runPageTransition(() => navigate(to), 'back');
      else navigate(to);
      return;
    }
    const direction = directionFor(to, !!options?.replace);
    if (direction) runPageTransition(() => navigate(to, options), direction);
    else navigate(to, options);
  }) as AppNavigate, [navigate]);
}
