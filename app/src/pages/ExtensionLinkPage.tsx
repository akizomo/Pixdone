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
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { auth as firebaseAuth } from '../lib/firebase';

interface AuthPayload {
  idToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
  uid: string;
  email: string | null;
  apiKey: string | null; // Firebase Web API key for token refresh (public value)
}

type Status = 'pending' | 'sending' | 'done' | 'error';

/**
 * Pixel-art button styling that matches the "Sign in" CTA on this page.
 * Primary = purple fill (used for the dominant action), secondary = white
 * fill with the same border + drop-shadow (used for adjacent actions like
 * Sign out).
 */
function pixelButtonStyle(variant: 'primary' | 'secondary'): CSSProperties {
  const isPrimary = variant === 'primary';
  return {
    padding: '8px 16px',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    background: isPrimary ? '#7b61ff' : '#fff',
    color: isPrimary ? '#fff' : '#191d24',
    border: '2px solid #191d24',
    boxShadow: '2px 2px 0 rgba(25,29,36,0.9)',
    cursor: 'pointer',
  };
}

async function buildAuthPayload(user: import('firebase/auth').User): Promise<AuthPayload> {
  const idToken = await user.getIdToken(true);
  const tokenResult = await user.getIdTokenResult();
  // Firebase Web API key is public (it appears in every bundled client).
  // We forward it so the extension's background can call the secure-token REST
  // endpoint to refresh the ID token without asking the user to re-sign-in.
  const apiKey = firebaseAuth.app.options.apiKey ?? null;
  return {
    idToken,
    refreshToken: user.refreshToken,
    expiresAt: Date.parse(tokenResult.expirationTime),
    uid: user.uid,
    email: user.email,
    apiKey,
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
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          maxWidth: 420,
          margin: '80px auto',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 18, marginBottom: 8 }}>Sign in to PixDone</h1>
        <p style={{ fontSize: 13, color: '#666c7a', marginBottom: 20 }}>
          Sign in to connect the PixDone Quick Chrome extension to your account.
        </p>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          style={{
            padding: '10px 16px',
            background: '#7b61ff',
            color: '#fff',
            border: '2px solid #191d24',
            boxShadow: '2px 2px 0 rgba(25,29,36,0.9)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Sign in
        </button>
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
      style={{
        maxWidth: 420,
        margin: '80px auto',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Connecting PixDone Quick…</h1>
      <p style={{ fontSize: 13, color: '#666c7a', marginBottom: 16 }}>
        Signed in as <strong>{user.email ?? user.uid}</strong>
      </p>
      {status === 'sending' && (
        <p style={{ fontSize: 13, color: '#666c7a' }}>Sending credentials to the extension…</p>
      )}
      {status === 'done' && (
        <>
          <p style={{ fontSize: 14, color: '#166534', marginBottom: 12 }}>
            ✓ Connected. You can close this tab.
          </p>
          <button
            type="button"
            onClick={() => window.close()}
            style={pixelButtonStyle('primary')}
          >
            Close
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <p style={{ fontSize: 13, color: '#c53030', marginBottom: 12 }}>
            {error ?? 'Something went wrong.'}
          </p>
          <button
            type="button"
            onClick={() => {
              hasSentRef.current = false;
              setStatus('pending');
              setError(null);
              void sendToExtension();
            }}
            style={{ ...pixelButtonStyle('primary'), marginRight: 8 }}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            style={pixelButtonStyle('secondary')}
          >
            Sign out
          </button>
        </>
      )}
    </div>
  );
}
