/// <reference types="chrome" />
// PixDone Quick — content script entry

// Bundle pixel fonts locally. External font services (fonts.googleapis.com) are
// routinely blocked by the host page's CSP, causing silent fallbacks.
//
// CAUTION: These imports make @crxjs emit a content_scripts.css entry that
// Chrome injects into the host document. The emitted CSS references fonts via
// absolute paths like `url(/assets/...woff2)` — those resolve against the
// HOST PAGE origin, not chrome-extension://, so the browser 404s on the font
// file and logs "Failed to decode downloaded font". We work around this by
// fetching the same CSS from the extension origin at runtime, rewriting the
// `/assets/` prefix to `chrome.runtime.getURL('assets/')`, and re-injecting
// the corrected rules (see `injectExtensionFontCss` below). The wrong rules
// stay in place but the browser takes the LAST declaration, so our corrected
// @font-face wins.
import '@fontsource/vt323';
import '@fontsource/handjet/400.css';
import '@fontsource/handjet/500.css';
import '@fontsource/handjet/700.css';

import { mountQuickPanel } from './mount';
import { dlog } from '../log';

async function injectExtensionFontCss(): Promise<void> {
  try {
    const manifest = chrome.runtime.getManifest();
    const cssPaths = (manifest.content_scripts ?? [])
      .flatMap((entry) => entry.css ?? [])
      .filter((p): p is string => typeof p === 'string');
    const assetBase = chrome.runtime.getURL('assets/');
    for (const cssPath of cssPaths) {
      const extUrl = chrome.runtime.getURL(cssPath);
      const res = await fetch(extUrl);
      if (!res.ok) continue;
      const cssText = await res.text();
      if (!/\burl\(\s*\/assets\//.test(cssText)) continue;
      const rewritten = cssText.replace(/url\(\s*\/assets\//g, `url(${assetBase}`);
      const style = document.createElement('style');
      style.setAttribute('data-pixdone-quick-fonts', '');
      style.textContent = rewritten;
      document.head.appendChild(style);
    }
  } catch (err) {
    console.warn('[PixDone Quick/content] font css reinject failed', err);
  }
}

void injectExtensionFontCss();

dlog('[PixDone Quick/content] content script loaded on', location.href);

// Mount the panel eagerly. It renders nothing until opened (open=false initial state),
// but installing the React tree now means the in-page Cmd+Shift+Y listener works
// without waiting for a chrome.commands ping. Also lets any subsequent OPEN_ADD_TASK
// or TOGGLE_PANEL message be processed without a mount-time race.
const TRUSTED_AUTH_ORIGINS = new Set([
  // Canonical Vercel URL — listed first so it's the obvious default when
  // anyone reads the trust list. The akizony alias remains for back-compat
  // with users who bookmarked the old domain.
  'https://pixdone.vercel.app',
  'https://pixdone.akizony.com',
  // Dev-only: gated behind the build mode the same way manifest.config.ts
  // strips localhost from host_permissions / externally_connectable in prod.
  // Without this gate the prod bundle would silently trust messages from a
  // localhost origin even though the browser can't actually reach it.
  ...(import.meta.env.DEV ? ['http://localhost:5173'] : []),
]);

let mounted = false;

function ensureMounted() {
  if (mounted) return;
  mounted = true;
  mountQuickPanel();
}

// Mount immediately so the in-page keyboard shortcut works without depending on
// the chrome.commands API (which Chrome sometimes fails to rebind when manifest
// shortcuts change).
ensureMounted();

// ───────────────────────────────────────────────────────────────
// Auth relay: web page → content script → background
// The web page (/extension-link) posts { type: 'PIXDONE_QUICK_AUTH', payload }
// from its own origin. We forward to background and ACK back to the page.
// ───────────────────────────────────────────────────────────────
window.addEventListener('message', (ev) => {
  if (ev.source !== window) return;
  const data = ev.data as { type?: string; payload?: unknown };
  // Only log auth-tagged messages so we don't spam on every postMessage.
  if (data?.type === 'PIXDONE_QUICK_AUTH') {
    dlog('[PixDone Quick/content] PIXDONE_QUICK_AUTH received', {
      origin: ev.origin,
      trusted: TRUSTED_AUTH_ORIGINS.has(ev.origin),
      hasPayload: !!data.payload,
      payloadKeys: data.payload && typeof data.payload === 'object'
        ? Object.keys(data.payload as object)
        : null,
    });
  }
  if (!TRUSTED_AUTH_ORIGINS.has(ev.origin)) return;
  if (data?.type !== 'PIXDONE_QUICK_AUTH') return;

  chrome.runtime.sendMessage(
    { type: 'PIXDONE_AUTH_RELAY', payload: data.payload },
    (response) => {
      const lastErr = chrome.runtime.lastError?.message;
      const ok = !lastErr && response?.ok === true;
      dlog('[PixDone Quick/content] auth relay response', {
        ok,
        lastError: lastErr,
        response,
      });
      window.postMessage(
        {
          type: 'PIXDONE_QUICK_AUTH_ACK',
          ok,
          error: lastErr ?? response?.error ?? null,
        },
        window.location.origin,
      );
    },
  );
});

// ───────────────────────────────────────────────────────────────
// Panel activation: background → content script
// ───────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return;
  dlog('[PixDone Quick/content] message:', message.type);
  // Ping handler — background uses this to detect if content script is live.
  if (message.type === 'PIXDONE_PING') {
    sendResponse({ alive: true, mounted });
    return;
  }
  sendResponse({ received: true, mounted });
  switch (message.type) {
    case 'TOGGLE_PANEL':
    case 'OPEN_ADD_TASK': {
      const wasMounted = mounted;
      ensureMounted();
      const dispatch = () =>
        window.dispatchEvent(
          new CustomEvent('pixdone-quick:message', { detail: message }),
        );
      // If we just mounted, give React a tick to install its window listener.
      if (!wasMounted) {
        requestAnimationFrame(() => requestAnimationFrame(dispatch));
      } else {
        dispatch();
      }
      break;
    }
    default:
      break;
  }
});
