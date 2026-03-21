import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
  deleteUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export type ServerSessionSyncResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

/** Firebase ログイン後、API 用の Passport セッション（Cookie）を発行する */
async function syncServerSessionFromFirebase(user: User): Promise<ServerSessionSyncResult> {
  try {
    const idToken = await user.getIdToken();
    const resp = await fetch('/api/auth/firebase-session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const text = await resp.text();
    if (!resp.ok) {
      let message = text;
      try {
        const j = JSON.parse(text) as { message?: string };
        if (j.message) message = j.message;
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
    await runServerSessionSync(cred.user);
  };

  const register = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await signOut(auth);
  };

  const logout = async () => {
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
