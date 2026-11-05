import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AuthCredential, User, UserCredential } from 'firebase/auth';
import {
  linkWithCredential,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import type { SignInResult } from '@capacitor-firebase/authentication';
import { auth } from '../lib/firebase';
import { trackLogin, trackSignUp, setAnalyticsUserId } from '../services/analytics';
import { apiUrl } from '../lib/apiUrl';

export type ServerSessionSyncResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

/** Firebase ログイン後、API 用の Passport セッション（Cookie）を発行する */
async function syncServerSessionFromFirebase(user: User): Promise<ServerSessionSyncResult> {
  try {
    // 強制リフレッシュで期限切れ・キャッシュずれによる 401 を減らす
    const idToken = await user.getIdToken(true);
    const resp = await fetch(apiUrl('/api/auth/firebase-session'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const text = await resp.text();
    if (!resp.ok) {
      let message = text;
      try {
        const j = JSON.parse(text) as {
          message?: string;
          firebaseCode?: string;
          hint?: string;
          tokenProjectId?: string;
          serviceAccountProjectId?: string;
        };
        if (j.message) message = j.message;
        if (j.firebaseCode) message = `${message} (${j.firebaseCode})`;
        if (j.tokenProjectId && j.serviceAccountProjectId && j.tokenProjectId !== j.serviceAccountProjectId) {
          message = `${message} — token project: ${j.tokenProjectId}, server key project: ${j.serviceAccountProjectId}`;
        }
        if (j.hint) message = `${message} — ${j.hint}`;
      } catch {
        /* raw text */
      }
      console.warn('syncServerSessionFromFirebase failed', resp.status, message);
      return { ok: false, status: resp.status, message };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, message };
  }
}

/**
 * signInWithPopup does not work inside the app's WebView. Sign in with the native
 * SDK instead, then hand its credential to the JS SDK so everything else
 * (onAuthStateChanged, Firestore, getIdToken) keeps working unchanged.
 */
async function nativeSignIn(signIn: () => Promise<SignInResult>): Promise<SignInResult> {
  try {
    return await signIn();
  } catch (e) {
    // Dismissing the native sign-in sheet should be as silent as closing the web
    // popup. Android/Google say "cancel"; Apple only gives a localized
    // "AuthorizationError … 1001" (ASAuthorizationError.canceled).
    if (/cancel|AuthorizationError\D*1001/i.test(e instanceof Error ? e.message : String(e))) {
      throw Object.assign(new Error('cancelled'), { code: 'auth/popup-closed-by-user' });
    }
    throw e;
  }
}

/**
 * Google/Apple sign-in hit an email that is already registered with another
 * method (Firebase: one account per email). Carries the credential so it can be
 * linked once the user signs in the old way.
 */
export class LinkPendingError extends Error {
  readonly code = 'auth/account-exists-with-different-credential';
  constructor(
    readonly providerId: 'google.com' | 'apple.com',
    readonly email: string | null,
    readonly credential: AuthCredential | null,
  ) {
    super('account_exists_with_different_credential');
  }
}

function errorCode(e: unknown): string | undefined {
  return e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : undefined;
}

function errorEmail(e: unknown): string | null {
  const email = (e as { customData?: { email?: unknown } } | null)?.customData?.email;
  return typeof email === 'string' ? email : null;
}

/** Turns account-exists errors into LinkPendingError; rethrows everything else. */
async function withLinkDetection(
  providerId: 'google.com' | 'apple.com',
  signIn: () => Promise<UserCredential>,
  credentialFromError: (e: unknown) => AuthCredential | null,
  email?: string | null,
): Promise<UserCredential> {
  try {
    return await signIn();
  } catch (e) {
    if (errorCode(e) === 'auth/account-exists-with-different-credential') {
      let credential: AuthCredential | null = null;
      try { credential = credentialFromError(e); } catch { /* no credential to keep */ }
      throw new LinkPendingError(providerId, errorEmail(e) ?? email ?? null, credential);
    }
    throw e;
  }
}

async function signInWithGoogleNative(): Promise<UserCredential> {
  const result = await nativeSignIn(() => FirebaseAuthentication.signInWithGoogle());
  const idToken = result.credential?.idToken;
  if (!idToken) throw new Error('google_sign_in_failed');
  const credential = GoogleAuthProvider.credential(idToken);
  return withLinkDetection('google.com', () => signInWithCredential(auth, credential), () => credential, result.user?.email);
}

async function signInWithGoogleWeb(): Promise<UserCredential> {
  return withLinkDetection(
    'google.com',
    () => signInWithPopup(auth, new GoogleAuthProvider()),
    (e) => GoogleAuthProvider.credentialFromError(e as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]),
  );
}

/**
 * iOS: native Sign in with Apple (App Store guideline 4.8).
 * Android: the plugin runs Firebase's Apple web flow (needs the Services ID set
 * up in the Firebase console, same as the web).
 */
async function signInWithAppleNative(): Promise<UserCredential> {
  const result = await nativeSignIn(() => FirebaseAuthentication.signInWithApple());
  const { idToken, nonce } = result.credential ?? {};
  if (!idToken) throw new Error('apple_sign_in_failed');
  const credential = new OAuthProvider('apple.com').credential({ idToken, rawNonce: nonce });
  return withLinkDetection('apple.com', () => signInWithCredential(auth, credential), () => credential, result.user?.email);
}

/** Web: Apple's popup flow. Lets people who signed up with Apple in the iOS app log in on the web. */
async function signInWithAppleWeb(): Promise<UserCredential> {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return withLinkDetection(
    'apple.com',
    () => signInWithPopup(auth, provider),
    (e) => OAuthProvider.credentialFromError(e as Parameters<typeof OAuthProvider.credentialFromError>[0]),
  );
}

interface PendingLink {
  providerId: 'google.com' | 'apple.com';
  email: string | null;
  credential: AuthCredential;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Passport 用セッションが最後の同期で成功したか（未ログインは false） */
  serverSessionReady: boolean;
  /** 同期失敗時のサーバーメッセージ（503 の説明など） */
  serverSessionError: string | null;
  /** 現在の Firebase ユーザーでサーバーへ再同期（checkout 直前のレース対策に使用） */
  syncServerSession: () => Promise<ServerSessionSyncResult>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  /**
   * Re-sends the verification email for an unverified email/password account.
   * Returns 'verified' (and logs in) if the email was confirmed in the meantime.
   */
  resendVerification: (email: string, password: string) => Promise<'sent' | 'verified'>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverSessionReady, setServerSessionReady] = useState(false);
  const [serverSessionError, setServerSessionError] = useState<string | null>(null);
  /** Google/Apple credential waiting to be linked after the user logs in the old way. */
  const pendingLinkRef = useRef<PendingLink | null>(null);

  const runServerSessionSync = useCallback(async (u: User): Promise<ServerSessionSyncResult> => {
    setServerSessionReady(false);
    setServerSessionError(null);
    const r = await syncServerSessionFromFirebase(u);
    if (r.ok) {
      setServerSessionReady(true);
      setServerSessionError(null);
    } else {
      setServerSessionReady(false);
      setServerSessionError(r.message);
    }
    return r;
  }, []);

  const syncServerSession = useCallback((): Promise<ServerSessionSyncResult> => {
    if (!user) {
      return Promise.resolve({ ok: false, status: 0, message: 'Not logged in' });
    }
    return runServerSessionSync(user);
  }, [user, runServerSessionSync]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      setAnalyticsUserId(u?.uid ?? null);
    });
    return unsub;
  }, []);

  /** ログイン済み Firebase ユーザーをサーバー・セッションに同期（課金 API 等に必須） */
  useEffect(() => {
    if (!user) {
      setServerSessionReady(false);
      setServerSessionError(null);
      return;
    }
    void runServerSessionSync(user);
  }, [user?.uid, runServerSessionSync]);

  /**
   * Links the Google/Apple credential that hit "account exists" earlier, if the
   * account now signed in has the same email. Best effort: the credential may
   * have expired (Apple ID tokens last ~10 min) — the user can just retry the
   * provider button then, and it will link the next time.
   */
  const linkPendingCredential = async (u: User) => {
    const pending = pendingLinkRef.current;
    if (!pending) return;
    if (pending.email && u.email && pending.email.toLowerCase() !== u.email.toLowerCase()) return;
    pendingLinkRef.current = null;
    if (u.providerData.some((p) => p.providerId === pending.providerId)) return;
    try {
      await linkWithCredential(u, pending.credential);
    } catch (e) {
      console.warn('linkWithCredential failed', errorCode(e) ?? e);
    }
  };

  /** Remembers the credential (if any) and rethrows so the screen can explain. */
  const rememberPendingLink = (e: unknown): never => {
    if (e instanceof LinkPendingError && e.credential) {
      pendingLinkRef.current = { providerId: e.providerId, email: e.email, credential: e.credential };
    }
    throw e;
  };

  const signInVerified = async (email: string, password: string) => {
    if (!email.trim()) throw new Error('missing_email');
    if (!password) throw new Error('missing_password');
    return signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const finishEmailLogin = async (u: User) => {
    trackLogin({ method: 'email' });
    await linkPendingCredential(u);
    await runServerSessionSync(u);
  };

  const login = async (email: string, password: string) => {
    const cred = await signInVerified(email, password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      throw new Error('email_not_verified');
    }
    await finishEmailLogin(cred.user);
  };

  const resendVerification = async (email: string, password: string): Promise<'sent' | 'verified'> => {
    const cred = await signInVerified(email, password);
    if (cred.user.emailVerified) {
      await finishEmailLogin(cred.user);
      return 'verified';
    }
    try {
      await sendEmailVerification(cred.user);
    } finally {
      await signOut(auth);
    }
    return 'sent';
  };

  const finishProviderLogin = async (cred: UserCredential, method: 'google' | 'apple') => {
    const meta = cred.user.metadata;
    const isNewUser = !!(meta.creationTime && meta.lastSignInTime && meta.creationTime === meta.lastSignInTime);
    if (isNewUser) {
      trackSignUp({ method });
    } else {
      trackLogin({ method });
    }
    await linkPendingCredential(cred.user);
    await runServerSessionSync(cred.user);
  };

  const loginWithGoogle = async () => {
    const cred = await (Capacitor.isNativePlatform() ? signInWithGoogleNative() : signInWithGoogleWeb())
      .catch(rememberPendingLink);
    await finishProviderLogin(cred, 'google');
  };

  const loginWithApple = async () => {
    const cred = await (Capacitor.isNativePlatform() ? signInWithAppleNative() : signInWithAppleWeb())
      .catch(rememberPendingLink);
    await finishProviderLogin(cred, 'apple');
  };

  const register = async (email: string, password: string) => {
    if (!email.trim()) throw new Error('missing_email');
    if (!password) throw new Error('missing_password');
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    trackSignUp({ method: 'email' });
    await sendEmailVerification(cred.user);
    await signOut(auth);
  };

  const logout = async () => {
    // Also clear the native Google session so the account picker shows next time.
    if (Capacitor.isNativePlatform()) await FirebaseAuthentication.signOut();
    await signOut(auth);
    setServerSessionReady(false);
    setServerSessionError(null);
  };

  const resetPassword = async (email: string) => {
    if (!email.trim()) throw new Error('missing_email');
    await sendPasswordResetEmail(auth, email.trim());
  };

  const deleteAccount = async () => {
    const current = auth.currentUser;
    if (!current) throw new Error('Not logged in');
    // The server deletes everything (Stripe, Firestore, DB, and the Firebase user itself).
    // A fresh ID token proves this is the signed-in user, not just a leftover cookie.
    const idToken = await current.getIdToken(true);
    const resp = await fetch(apiUrl('/api/account'), {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!resp.ok) {
      let message = `Failed to delete account (${resp.status})`;
      try {
        const j = (await resp.json()) as { message?: string };
        if (j.message) message = j.message;
      } catch { /* keep default */ }
      throw new Error(message);
    }
    // The Firebase user no longer exists; drop the local session and native Google/Apple state.
    if (Capacitor.isNativePlatform()) await FirebaseAuthentication.signOut().catch(() => {});
    await signOut(auth).catch(() => {});
    setServerSessionReady(false);
    setServerSessionError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        serverSessionReady,
        serverSessionError,
        syncServerSession,
        login,
        loginWithGoogle,
        loginWithApple,
        resendVerification,
        register,
        logout,
        resetPassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
