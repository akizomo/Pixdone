/**
 * /extension-link — PixDone Quick (Chrome 拡張) への Firebase ID トークン受け渡しページ。
 *
 * Flow:
 *  1. ユーザーが拡張の popup から本ページを開く（別ウィンドウ）
 *  2. Firebase 未ログインならログイン UI を表示、ログイン済みならトークンを取得
 *  3. window.postMessage 経由で拡張の content script に渡す
 *  4. content script が background へ中継 → chrome.storage.local に保存
 *  5. ACK を受け取ったら「Signed in」を表示して 2 秒後に自動で閉じる
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../design-system';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { auth as firebaseAuth } from '../lib/firebase';
import { apiUrl } from '../lib/apiUrl';
import './ExtensionLinkPage.css';

interface AuthPayload {
  idToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
  uid: string;
  email: string | null;
  apiKey: string | null; // Firebase Web API key for token refresh (public value)
  /**
   * Free vs paid tier indicator — the extension uses this to gate Rare/Epic
   * effects. Resolved from /api/billing/entitlements; defaults to `false` if
   * the request fails (safe-default = treat as free).
   */
  isPremium: boolean;
}

type Status = 'pending' | 'sending' | 'done' | 'error';

async function fetchIsPremium(): Promise<boolean> {
  try {
    const resp = await fetch(apiUrl('/api/billing/entitlements'), {
      method: 'GET',
      credentials: 'include',
    });
    if (!resp.ok) return false;
    const data = (await resp.json()) as { isPremium?: unknown };
    return data.isPremium === true;
  } catch {
    // Safe default — treat as free if entitlements API is unreachable.
    return false;
  }
}

async function buildAuthPayload(user: import('firebase/auth').User): Promise<AuthPayload> {
  const idToken = await user.getIdToken(true);
  const tokenResult = await user.getIdTokenResult();
  // Firebase Web API key is public (it appears in every bundled client).
  // We forward it so the extension's background can call the secure-token REST
  // endpoint to refresh the ID token without asking the user to re-sign-in.
  const apiKey = firebaseAuth.app.options.apiKey ?? null;
  const isPremium = await fetchIsPremium();
  return {
    idToken,
    refreshToken: user.refreshToken,
    expiresAt: Date.parse(tokenResult.expirationTime),
    uid: user.uid,
    email: user.email,
    apiKey,
    isPremium,
  };
}

export function ExtensionLinkPage() {
  const { user, loading, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [status, setStatus] = useState<Status>('pending');
  const [error, setError] = useState<string | null>(null);
  const hasSentRef = useRef(false);

  // Listen for the extension ACK
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.source !== window) return;
      if (ev.origin !== window.location.origin) return;
      const data = ev.data as { type?: string; ok?: boolean; error?: string };
      if (data?.type === 'PIXDONE_QUICK_AUTH_ACK') {
        if (data.ok) {
          setStatus('done');
          window.setTimeout(() => window.close(), 1500);
        } else {
          setStatus('error');
          setError(data.error ?? 'Extension did not acknowledge');
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // When user becomes available, send the token to the content script.
  const sendToExtension = useCallback(async () => {
    if (!user || hasSentRef.current) return;
    hasSentRef.current = true;
    setStatus('sending');
    setError(null);
    try {
      const payload = await buildAuthPayload(user);
      const message = { type: 'PIXDONE_QUICK_AUTH', payload };
      const origin = window.location.origin;
      // Repeat the post a few times — if the content script registered its
      // listener after our first post (race that happens when the popup auto-
      // signs-in while the extension content script is still booting), the
      // retry catches it. We stop early once status flips to 'done' via ACK.
      let attempts = 0;
      const POLL_MS = 250;
      const MAX_ATTEMPTS = 16; // ~4 seconds, then the 5s failsafe fires
      const tick = () => {
        if (hasSentRef.current && status === 'done') return;
        if (attempts >= MAX_ATTEMPTS) return;
        window.postMessage(message, origin);
        attempts += 1;
        window.setTimeout(tick, POLL_MS);
      };
      tick();
      // Failsafe: if no ACK in 5s, assume the extension isn't installed.
      window.setTimeout(() => {
        if (status !== 'done') {
          setStatus((prev) =>
            prev === 'sending' ? 'error' : prev,
          );
          setError((prev) =>
            prev ??
            'No response from the PixDone Quick extension. Make sure it is installed and enabled.',
          );
        }
      }, 5000);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : String(e));
      hasSentRef.current = false;
    }
  }, [user, status]);

  useEffect(() => {
    if (user) {
      void sendToExtension();
    }
  }, [user, sendToExtension]);

  if (loading) {
    return (
      <div className="extension-link__text-1">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="extension-link__text-2"
      >
        <h1 className="extension-link__text-3">Sign in to PixDone</h1>
        <p className="extension-link__text-4">
          Sign in to connect the PixDone Quick Chrome extension to your account.
        </p>
        <Button variant="primary" size="md" onClick={() => setAuthModalOpen(true)}>
          Sign in
        </Button>
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={() => setAuthModalOpen(false)}
          lang="en"
          initialMode="login"
        />
      </div>
    );
  }

  return (
    <div
      className="extension-link__text-2"
    >
      <h1 className="extension-link__text-3">Connecting PixDone Quick…</h1>
      <p className="extension-link__text-6">
        Signed in as <strong>{user.email ?? user.uid}</strong>
      </p>
      {status === 'sending' && (
        <p className="extension-link__text-7">Sending credentials to the extension…</p>
      )}
      {status === 'done' && (
        <>
          <p className="extension-link__text-8">
            ✓ Connected. You can close this tab.
          </p>
          <Button variant="primary" size="md" onClick={() => window.close()}>
            Close
          </Button>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="extension-link__text-9">
            {error ?? 'Something went wrong.'}
          </p>
          <div className="extension-link__actions">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                hasSentRef.current = false;
                setStatus('pending');
                setError(null);
                void sendToExtension();
              }}
            >
              Retry
            </Button>
            <Button variant="secondary" size="md" onClick={() => { void logout(); }}>
              Sign out
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
