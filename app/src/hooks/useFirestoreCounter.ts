/**
 * Shared Firestore counter hook.
 *
 * Solves three problems that plagued individual hooks:
 * 1. Optimistic updates getting reverted by onSnapshot
 * 2. State resetting to 0 on reload (no localStorage cache for auth users)
 * 3. Inconsistent patterns across hooks
 *
 * Strategy:
 * - Always read/write localStorage as a local cache (auth or not)
 * - Authenticated: also sync to Firestore via onSnapshot + increment()
 * - Optimistic: increment local state + localStorage immediately
 * - onSnapshot: take max(server, local) so it never goes backwards
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface UseFirestoreCounterOptions {
  /** Firestore document path: `collection/docId`. Returns null to skip Firestore. */
  docPath: string | null;
  /** localStorage key for caching */
  localStorageKey: string;
  /** Field name inside the Firestore document */
  field: string;
  /** Extra fields to set on document creation (e.g. uid, themeId) */
  createFields?: Record<string, unknown>;
}

function readLS(key: string): number {
  try {
    return parseInt(localStorage.getItem(key) ?? '0', 10) || 0;
  } catch { return 0; }
}

function writeLS(key: string, value: number): void {
  try { localStorage.setItem(key, String(value)); } catch { /* ignore */ }
}

export function useFirestoreCounter(options: UseFirestoreCounterOptions) {
  const { docPath, localStorageKey, field } = options;
  const { user } = useAuth();

  // Always init from localStorage — instant display, no flicker
  const [count, setCount] = useState<number>(() => readLS(localStorageKey));

  // Keep options in ref so increment callback is stable
  const optRef = useRef(options);
  optRef.current = options;

  // Firestore sync (authenticated only)
  useEffect(() => {
    if (!user || !docPath) {
      // Unauthenticated: just use localStorage value
      setCount(readLS(localStorageKey));
      return;
    }

    const [col, id] = docPath.split('/');
    const docRef = doc(db, col, id);

    const unsub = onSnapshot(docRef, (snap) => {
      const serverVal = snap.exists() ? (snap.data()[field] ?? 0) : 0;
      // Always update localStorage with the latest server value
      const localVal = readLS(localStorageKey);
      const best = Math.max(serverVal, localVal);
      writeLS(localStorageKey, best);
      // Never go below current displayed value (optimistic protection)
      setCount((prev) => Math.max(best, prev));
    }, (err) => {
      console.warn(`[useFirestoreCounter] ${docPath} error:`, err);
    });

    return unsub;
  }, [user, docPath, localStorageKey, field]);

  const incrementCount = useCallback(async () => {
    const { docPath: dp, localStorageKey: lsKey, field: f, createFields: cf } = optRef.current;

    // 1. Optimistic: update localStorage + state immediately
    const prev = readLS(lsKey);
    const next = prev + 1;
    writeLS(lsKey, next);
    setCount(next);

    // 2. Firestore write (if authenticated)
    if (!user || !dp) return;

    const [col, id] = dp.split('/');
    const docRef = doc(db, col, id);

    try {
      await setDoc(docRef, {
        ...cf,
        [f]: increment(1),
      }, { merge: true });
    } catch (err) {
      console.warn(`[useFirestoreCounter] ${dp} increment failed:`, err);
    }
  }, [user]);

  return { count, incrementCount };
}
