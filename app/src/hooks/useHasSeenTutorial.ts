import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const LS_KEY = 'pixdone-tutorial-seen';

/**
 * Reads & writes `users/{uid}/settings/general.hasSeenTutorial` in Firestore,
 * with a localStorage cache so the flag survives reloads even if Firestore is slow.
 *
 * Dev/QA: `?tutorial=reset` clears both caches so the tutorial re-appears.
 */
export function useHasSeenTutorial() {
  const { user } = useAuth();
  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean | null>(() => {
    // Instant: check localStorage before Firestore resolves
    try {
      if (localStorage.getItem(LS_KEY) === 'true') return true;
    } catch { /* ignore */ }
    return null;
  });
  const resetHandledRef = useRef(false);

  // Dev/QA: ?tutorial=reset → clear both caches
  useEffect(() => {
    if (!user || resetHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('tutorial') !== 'reset') return;
    resetHandledRef.current = true;
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
    setHasSeenTutorial(false);
    const ref = doc(db, 'users', user.uid, 'settings', 'general');
    deleteDoc(ref).catch(() => {});
    params.delete('tutorial');
    const clean = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (clean ? `?${clean}` : ''));
  }, [user]);

  // Subscribe to Firestore doc (authoritative source)
  useEffect(() => {
    if (!user) {
      setHasSeenTutorial(null);
      return;
    }
    const ref = doc(db, 'users', user.uid, 'settings', 'general');
    const readLocalSeen = () => {
      try { return localStorage.getItem(LS_KEY) === 'true'; } catch { return false; }
    };
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const serverSeen = snap.exists() && snap.data().hasSeenTutorial === true;
        if (serverSeen) {
          setHasSeenTutorial(true);
          try { localStorage.setItem(LS_KEY, 'true'); } catch { /* ignore */ }
          return;
        }
        // "Seen" is one-way. If this device already recorded it, a missing /
        // false server flag means the earlier write never landed — keep the
        // local value and backfill instead of replaying the tutorial.
        if (readLocalSeen()) {
          setHasSeenTutorial(true);
          if (!snap.metadata.fromCache) {
            setDoc(ref, { hasSeenTutorial: true }, { merge: true }).catch((e) => {
              console.warn('[useHasSeenTutorial] failed to backfill flag:', e);
            });
          }
          return;
        }
        // A cache-only miss is not authoritative; wait for the server.
        if (snap.metadata.fromCache && !snap.exists()) return;
        setHasSeenTutorial(false);
      },
      (e) => {
        console.warn('[useHasSeenTutorial] failed to read flag:', e);
        // Offline / denied — fall back to the localStorage cache
        setHasSeenTutorial(readLocalSeen());
      },
    );
    return unsub;
  }, [user]);

  const markTutorialSeen = useCallback(async () => {
    if (!user) return;
    // Immediately lock local state + localStorage so reloads won't re-seed
    setHasSeenTutorial(true);
    try { localStorage.setItem(LS_KEY, 'true'); } catch { /* ignore */ }
    // Best-effort Firestore write
    const ref = doc(db, 'users', user.uid, 'settings', 'general');
    try {
      await setDoc(ref, { hasSeenTutorial: true }, { merge: true });
    } catch (e) {
      console.warn('[useHasSeenTutorial] failed to write flag:', e);
    }
  }, [user]);

  return { hasSeenTutorial, markTutorialSeen };
}
