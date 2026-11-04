/**
 * External links in the native app open in the in-app browser
 * (SFSafariViewController on iOS, Custom Tabs on Android) instead of leaving
 * the app — the standard behaviour for links like terms, support and the URLs
 * users write in task notes. On the web they open in a new tab as before.
 */
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { NATIVE_API_ORIGIN } from '../lib/apiUrl';

/** Absolute http(s) URL for `href`, or null when it is not a web link (mailto:, tel:, store, …). */
function toWebUrl(href: string): string | null {
  // The native bundle is served from capacitor://localhost / https://localhost, so
  // site-relative pages (/privacy.html, …) live on the deployed origin.
  const base = Capacitor.isNativePlatform() ? NATIVE_API_ORIGIN : window.location.origin;
  try {
    const url = new URL(href, base);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function openExternal(href: string): void {
  if (!Capacitor.isNativePlatform()) {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  const url = toWebUrl(href);
  if (url) void Browser.open({ url }).catch(() => window.open(url, '_blank'));
}

/**
 * Native only: route every `<a target="_blank">` tap through the in-app browser.
 * Runs after React's handlers (document-level, bubble phase), so a link's own
 * onClick (sound, analytics) still fires; links whose handler already called
 * preventDefault are left alone.
 */
export function initExternalLinks(): void {
  if (!Capacitor.isNativePlatform()) return;
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || a.target !== '_blank') return;
    const url = toWebUrl(a.getAttribute('href') ?? '');
    if (!url) return;
    e.preventDefault();
    void Browser.open({ url }).catch(() => window.open(url, '_blank'));
  });
}
