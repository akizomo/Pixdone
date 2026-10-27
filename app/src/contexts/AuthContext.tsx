import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User, UserCredential } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
  deleteUser,
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

async function signInWithGoogleNative(): Promise<UserCredential> {
  const result = await nativeSignIn(() => FirebaseAuthentication.signInWithGoogle());
  const idToken = result.credential?.idToken;
  if (!idToken) throw new Error('google_sign_in_failed');
  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

/** iOS only — required by App Store guideline 4.8 alongside Google sign-in. */
async function signInWithAppleNative(): Promise<UserCredential> {
  const result = await nativeSignIn(() => FirebaseAuthentication.signInWithApple());
  const { idToken, nonce } = result.credential ?? {};
  if (!idToken) throw new Error('apple_sign_in_failed');
  return signInWithCredential(auth, new OAuthProvider('apple.com').credential({ idToken, rawNonce: nonce }));
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
  /** Native iOS only. */
  loginWithApple: () => Promise<void>;
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

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      throw new Error('email_not_verified');
    }
    trackLogin({ method: 'email' });
    await runServerSessionSync(cred.user);
  };

  const finishProviderLogin = async (cred: UserCredential, method: 'google' | 'apple') => {
    const meta = cred.user.metadata;
    const isNewUser = !!(meta.creationTime && meta.lastSignInTime && meta.creationTime === meta.lastSignInTime);
    if (isNewUser) {
      trackSignUp({ method });
    } else {
      trackLogin({ method });
    }
    await runServerSessionSync(cred.user);
  };

  const loginWithGoogle = async () => {
    const cred = Capacitor.isNativePlatform()
      ? await signInWithGoogleNative()
      : await signInWithPopup(auth, new GoogleAuthProvider());
    await finishProviderLogin(cred, 'google');
  };

  const loginWithApple = async () => {
    await finishProviderLogin(await signInWithAppleNative(), 'apple');
  };

  const register = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
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
    await sendPasswordResetEmail(auth, email);
  };

  const deleteAccount = async () => {
    if (auth.currentUser) {
      await deleteUser(auth.currentUser);
    }
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
