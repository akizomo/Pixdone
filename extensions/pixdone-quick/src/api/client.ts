/// <reference types="chrome" />
/**
 * PixDone Quick API client.
 *
 * Content scripts can't call the API directly because they inherit the host
 * page's origin and hit CORS. Instead we proxy every request through the
 * background service worker, which runs in the extension's own origin and has
 * host_permissions to the API host. The popup (and the background itself) can
 * call `doFetch` directly.
 */

const DEFAULT_BASE =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5173'
    : 'https://pixdone.vercel.app';

function getApiBase(): string {
  return DEFAULT_BASE;
}

async function getIdToken(): Promise<string | null> {
  const { pixdoneAuth } = await chrome.storage.local.get('pixdoneAuth');
  const auth = pixdoneAuth as { idToken?: string } | undefined;
  return auth?.idToken ?? null;
}

/** Direct fetch — runs in extension-privileged context (popup / background). */
async function doFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getIdToken();
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${getApiBase()}${path}`, { ...init, headers });
}

/**
 * Proxy fetch via background service worker.
 * Used from content scripts where direct fetch would hit CORS.
 */
async function proxyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const body =
    typeof init.body === 'string' || init.body == null ? (init.body ?? null) : null;
  const response = await chrome.runtime.sendMessage({
    type: 'PIXDONE_API_FETCH',
    path,
    method: init.method ?? 'GET',
    body,
    headers: headersToPlainObject(init.headers),
  });
  if (!response || typeof response !== 'object') {
    throw new Error('Background did not respond');
  }
  if (response.error) throw new Error(response.error);
  // Reconstruct a Response-like shape
  return new Response(response.body ?? '', {
    status: response.status ?? 500,
    statusText: response.statusText ?? '',
    headers: new Headers(response.headers ?? {}),
  });
}

function headersToPlainObject(h: HeadersInit | undefined): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) {
    const obj: Record<string, string> = {};
    h.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }
  if (Array.isArray(h)) return Object.fromEntries(h);
  return { ...h };
}

/**
 * True when this code is running inside a content script (injected into a web page).
 * Content scripts still have `chrome.runtime` but no `chrome.runtime.getBackgroundPage`;
 * we detect the page-context via `chrome.runtime.id` existing AND `location.protocol !== 'chrome-extension:'`.
 */
function isInContentScript(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof location !== 'undefined' &&
      location.protocol !== 'chrome-extension:'
    );
  } catch {
    return false;
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (isInContentScript()) return proxyFetch(path, init);
  return doFetch(path, init);
}

export interface QuickMeResponse {
  uid: string | null;
  email: string | null;
  authVia: 'bearer' | 'session';
}

export async function fetchMe(): Promise<QuickMeResponse> {
  const resp = await apiFetch('/api/quick/me');
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`/api/quick/me failed: ${resp.status} ${text}`);
  }
  return (await resp.json()) as QuickMeResponse;
}

/** Exported so the background service worker can perform the actual fetch. */
export { doFetch };
