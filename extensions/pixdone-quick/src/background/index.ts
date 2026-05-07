/// <reference types="chrome" />
// PixDone Quick — background service worker

// Self-level error tracing so we can locate where "Receiving end does not
// exist" (or any other unhandled rejection) actually originates. Without this,
// Chrome's DevTools only points to service-worker-loader.js:0 with no context.
(self as unknown as EventTarget).addEventListener(
  'unhandledrejection',
  ((ev: PromiseRejectionEvent) => {
    const reason = ev.reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    // The "Receiving end does not exist" rejection is benign — it fires when we
    // message a tab that doesn't have our content script (chrome:// pages, the
    // Web Store, PDF viewer, etc). Log it at debug level and swallow.
    if (msg.includes('Receiving end does not exist')) {
      ddebug('[PixDone Quick/bg] suppressed benign sendMessage rejection');
      ev.preventDefault?.();
      return;
    }
    // Everything else: surface loudly so we can debug.
    console.error(
      '[PixDone Quick/bg] unhandled rejection:',
      reason instanceof Error ? `${reason.message}\n${reason.stack}` : reason,
    );
  }) as EventListener,
);
// Responsibilities:
//  - Register context menus ("Add to PixDone")
//  - Relay keyboard command (Cmd+Shift+Y) to content script
//  - Receive Firebase ID token from the Web /extension-link page (via content script)
//  - Schedule token refresh before expiry (Firebase secure-token REST)

import { refreshFirebaseToken } from './refreshToken';
import { doFetch } from '../api/client';
import { ensureContentScript } from './ensureContentScript';
import {
  fetchLists,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  type CreateTaskInput,
} from '../firestore/tasks';
import { getTodayTasks } from '@app/hooks/useTodayView';
import { getTodayYMD } from '@app/lib/date';
import type { Task } from '@app/types/task';
import { dlog, ddebug, dinfo } from '../log';

const CTX_MENU_ID = 'pixdone-add';
const REFRESH_ALARM = 'pixdone-refresh-token';
const BADGE_REFRESH_ALARM = 'pixdone-badge-refresh';
const BADGE_BG_COLOR = '#7b61ff';
const BADGE_REFRESH_PERIOD_MIN = 2;

// ───────────────────────────────────────────────────────────────
// Context menu + keyboard
// ───────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.contextMenus.remove(CTX_MENU_ID);
  } catch {
    /* menu may not exist yet */
  }
  chrome.contextMenus.create({
    id: CTX_MENU_ID,
    title: 'Add to PixDone',
    contexts: ['page', 'selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CTX_MENU_ID || !tab?.id) return;
  const tabId = tab.id;
  const message = {
    type: 'OPEN_ADD_TASK',
    selection: info.selectionText ?? '',
    pageTitle: tab.title ?? '',
    pageUrl: tab.url ?? '',
  };
  void ensureContentScript(tabId).then((ok) => {
    if (!ok) {
      console.warn('[PixDone Quick/bg] ctx menu: content script unavailable for tab', tabId);
      return;
    }
    chrome.tabs.sendMessage(tabId, message, () => {
      void chrome.runtime.lastError; // consume
    });
  });
});

// Toolbar icon click → toggle panel on the active tab. Replaces the old
// popup.html; the panel itself now owns sign-in / account / tasks in one place.
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  const tabId = tab.id;
  void ensureContentScript(tabId).then((ok) => {
    if (!ok) {
      console.warn('[PixDone Quick/bg] action click: content script unavailable for tab', tabId);
      return;
    }
    chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_PANEL' }, () => {
      void chrome.runtime.lastError;
    });
  });
});

chrome.commands.onCommand.addListener((command, tab) => {
  dlog('[PixDone Quick/bg] command fired:', command, 'tabId:', tab?.id);
  if (command !== 'toggle-panel') return;
  if (!tab?.id) {
    console.warn('[PixDone Quick/bg] no tab id — focused window is a non-tab surface?');
    return;
  }
  const tabId = tab.id;
  void ensureContentScript(tabId).then((ok) => {
    if (!ok) {
      console.warn('[PixDone Quick/bg] toggle: content script unavailable for tab', tabId);
      return;
    }
    chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_PANEL' }, () => {
      void chrome.runtime.lastError;
    });
  });
});

// ───────────────────────────────────────────────────────────────
// Auth storage + refresh
// ───────────────────────────────────────────────────────────────
export interface PixdoneAuth {
  idToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
  uid: string;
  email: string | null;
  apiKey: string | null;
  /**
   * Synced from /api/billing/entitlements at sign-in time. Used by the panel
   * to gate Rare/Epic effects (free users see Common only). May be undefined
   * for older auth payloads written before this field existed — the panel
   * treats undefined as `false` (free tier).
   */
  isPremium?: boolean;
}

async function saveAuth(auth: PixdoneAuth): Promise<void> {
  await chrome.storage.local.set({ pixdoneAuth: auth });
  scheduleRefresh(auth.expiresAt);
  // Refresh the toolbar badge whenever auth changes — premium status (and
  // therefore badge visibility) may have flipped.
  void updateBadge();
}

function scheduleRefresh(expiresAt: number): void {
  const fireAt = Math.max(Date.now() + 30_000, expiresAt - 5 * 60_000);
  chrome.alarms.create(REFRESH_ALARM, { when: fireAt });
}

async function loadAuth(): Promise<PixdoneAuth | null> {
  const { pixdoneAuth } = await chrome.storage.local.get('pixdoneAuth');
  return (pixdoneAuth as PixdoneAuth | undefined) ?? null;
}

async function clearAuth(): Promise<void> {
  await chrome.storage.local.remove('pixdoneAuth');
  chrome.alarms.clear(REFRESH_ALARM);
  // Sign-out hides the badge entirely.
  await chrome.action.setBadgeText({ text: '' });
}

// ───────────────────────────────────────────────────────────────
// Toolbar badge — paid feature (per PixDone Quick spec).
//
// Shows the count of "Today" tasks (incomplete + due ≤ today, mirrors the
// panel's todayTasks list). Refreshed:
//   - on auth save (sign-in / token refresh / premium flip)
//   - after every Firestore mutation routed through this background worker
//   - on a 2-minute alarm (catches off-extension changes from the web app)
//   - on chrome.runtime.onStartup
//
// Free users see no badge — text is forced to '' whenever isPremium isn't
// strictly true.
// ───────────────────────────────────────────────────────────────
async function updateBadge(): Promise<void> {
  const auth = await loadAuth();
  if (!auth?.idToken || !auth.uid || auth.isPremium !== true) {
    try {
      await chrome.action.setBadgeText({ text: '' });
    } catch {
      /* action API may be unavailable in some contexts */
    }
    return;
  }
  try {
    const [lists, tasks] = await Promise.all([
      fetchLists(auth.uid),
      fetchTasks(auth.uid),
    ]);
    const byList = new Map<string, Task[]>();
    for (const t of tasks) {
      const arr = byList.get(t.listId) ?? [];
      arr.push(t);
      byList.set(t.listId, arr);
    }
    const listsWithTasks = lists.map((l) => ({
      ...l,
      tasks: byList.get(l.id) ?? [],
    }));
    const today = getTodayYMD();
    const count = getTodayTasks(listsWithTasks, today).length;
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_BG_COLOR });
    // Cap visible text at 99+ — Chrome truncates anything over 4 chars anyway.
    const text = count <= 0 ? '' : count > 99 ? '99+' : String(count);
    await chrome.action.setBadgeText({ text });
  } catch (e) {
    console.warn('[PixDone Quick/bg] updateBadge failed', e);
  }
}

// Periodic refresh — covers the case where the user completes / creates tasks
// on the web app (or another browser) and we want the badge to catch up.
chrome.alarms.create(BADGE_REFRESH_ALARM, {
  periodInMinutes: BADGE_REFRESH_PERIOD_MIN,
});

chrome.runtime.onStartup.addListener(() => {
  void updateBadge();
});

// Recover badge state on extension reload / install too.
chrome.runtime.onInstalled.addListener(() => {
  void updateBadge();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === BADGE_REFRESH_ALARM) {
    await updateBadge();
    return;
  }
  if (alarm.name !== REFRESH_ALARM) return;
  const auth = await loadAuth();
  if (!auth?.refreshToken || !auth.apiKey) return;
  try {
    const next = await refreshFirebaseToken(auth.apiKey, auth.refreshToken);
    await saveAuth({
      ...auth,
      idToken: next.idToken,
      refreshToken: next.refreshToken,
      expiresAt: next.expiresAt,
    });
    dinfo('[PixDone Quick] token refreshed');
  } catch (e) {
    console.warn('[PixDone Quick] token refresh failed, clearing auth', e);
    await clearAuth();
  }
});

// Receive from content script on the extension-link page (any trusted origin)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'PIXDONE_AUTH_RELAY') return;
  const payload = message.payload as PixdoneAuth | undefined;
  dlog('[PixDone Quick/bg] PIXDONE_AUTH_RELAY received', {
    hasIdToken: !!payload?.idToken,
    hasRefreshToken: !!payload?.refreshToken,
    expiresAtType: typeof payload?.expiresAt,
    uid: payload?.uid,
    email: payload?.email,
    isPremium: payload?.isPremium,
  });
  if (
    !payload?.idToken ||
    !payload.refreshToken ||
    typeof payload.expiresAt !== 'number'
  ) {
    console.warn('[PixDone Quick/bg] auth relay rejected: missing_fields');
    sendResponse({ ok: false, error: 'missing_fields' });
    return;
  }
  saveAuth(payload)
    .then(() => {
      dlog('[PixDone Quick/bg] auth saved to chrome.storage.local');
      sendResponse({ ok: true });
    })
    .catch((e) => {
      console.warn('[PixDone Quick/bg] saveAuth failed', e);
      sendResponse({ ok: false, error: String(e) });
    });
  return true; // keep channel open for async sendResponse
});

// Expose a helper for other extension pages (popup) to sign out
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'PIXDONE_SIGN_OUT') return;
  clearAuth()
    .then(() => sendResponse({ ok: true }))
    .catch((e) => sendResponse({ ok: false, error: String(e) }));
  return true;
});

// Open the Web sign-in popup (content scripts can't call `chrome.windows`).
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'PIXDONE_OPEN_SIGN_IN') return;
  const url = String(message.url ?? 'https://pixdone.vercel.app/extension-link');
  chrome.windows.create(
    { url, type: 'popup', width: 420, height: 600 },
    () => {
      const err = chrome.runtime.lastError?.message;
      sendResponse(err ? { ok: false, error: err } : { ok: true });
    },
  );
  return true;
});

// Popup asks us to open the panel in a specific tab. We own the
// ensureContentScript logic here so the popup doesn't need the `scripting`
// permission logic inline.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'PIXDONE_OPEN_PANEL_IN_TAB') return;
  const tabId = Number(message.tabId);
  if (!Number.isFinite(tabId)) {
    sendResponse({ ok: false, error: 'invalid tabId' });
    return;
  }
  (async () => {
    const ok = await ensureContentScript(tabId);
    if (!ok) {
      sendResponse({ ok: false, error: 'content script unavailable (chrome:// page?)' });
      return;
    }
    chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_PANEL' }, () => {
      const err = chrome.runtime.lastError?.message;
      sendResponse(err ? { ok: false, error: err } : { ok: true });
    });
  })();
  return true;
});

// ─────────────────────────────────────────────────────────────
// Firestore proxy — content scripts call these via sendMessage.
// Background runs in the extension-privileged origin, so it can call
// firestore.googleapis.com with the Bearer ID token.
// ─────────────────────────────────────────────────────────────
async function resolveUid(): Promise<string | null> {
  const { pixdoneAuth } = await chrome.storage.local.get('pixdoneAuth');
  const auth = pixdoneAuth as { uid?: string } | undefined;
  return auth?.uid ?? null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const type = message?.type as string | undefined;
  if (!type || !type.startsWith('PIXDONE_FS_')) return;

  (async () => {
    try {
      const uid = await resolveUid();
      if (!uid) {
        sendResponse({ ok: false, error: 'not_authenticated' });
        return;
      }
      switch (type) {
        case 'PIXDONE_FS_FETCH_LISTS': {
          const lists = await fetchLists(uid);
          sendResponse({ ok: true, lists });
          return;
        }
        case 'PIXDONE_FS_FETCH_TASKS': {
          const tasks = await fetchTasks(uid);
          sendResponse({ ok: true, tasks });
          return;
        }
        case 'PIXDONE_FS_CREATE_TASK': {
          const payload = (message.payload ?? {}) as Omit<CreateTaskInput, 'uid'>;
          const task = await createTask({ ...payload, uid });
          sendResponse({ ok: true, task });
          // Mutation may have changed today's count — refresh after responding
          // so the response isn't blocked by the network round-trip.
          void updateBadge();
          return;
        }
        case 'PIXDONE_FS_UPDATE_TASK': {
          const { taskId, updates } = message as {
            taskId: string;
            updates: Parameters<typeof updateTask>[1];
          };
          const task = await updateTask(taskId, updates ?? {});
          sendResponse({ ok: true, task });
          void updateBadge();
          return;
        }
        case 'PIXDONE_FS_DELETE_TASK': {
          await deleteTask(String(message.taskId ?? ''));
          sendResponse({ ok: true });
          void updateBadge();
          return;
        }
        default:
          sendResponse({ ok: false, error: `unknown type ${type}` });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  })();
  return true;
});

// CORS-bypass fetch proxy for content scripts.
// Content scripts inherit the host page origin; the backend CORS doesn't echo
// `Access-Control-Allow-Origin` for every page, so we re-issue the request
// from the extension's privileged context.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'PIXDONE_API_FETCH') return;
  (async () => {
    try {
      const init: RequestInit = {
        method: message.method ?? 'GET',
        headers: message.headers ?? {},
        body:
          message.body != null && message.method && message.method !== 'GET'
            ? String(message.body)
            : undefined,
      };
      const resp = await doFetch(String(message.path ?? ''), init);
      const bodyText = await resp.text();
      const headers: Record<string, string> = {};
      resp.headers.forEach((v, k) => {
        headers[k] = v;
      });
      sendResponse({
        ok: true,
        status: resp.status,
        statusText: resp.statusText,
        headers,
        body: bodyText,
      });
    } catch (e) {
      sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  })();
  return true;
});

// Boot-time scheduling (service workers wake on events, so re-arm if token is active)
(async () => {
  const auth = await loadAuth();
  if (auth?.expiresAt) scheduleRefresh(auth.expiresAt);
})();
