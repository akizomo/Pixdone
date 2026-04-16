import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Reads & writes `users/{uid}/settings/general.hasSeenTutorial` in Firestore.
 *
 * - `hasSeenTutorial`: null while loading, then boolean.
 * - `markTutorialSeen()`: sets the flag to true.
 * - Dev/QA: `?tutorial=reset` resets the flag so the tutorial re-appears.
 */
export function useHasSeenTutorial() {
  const { user } = useAuth();
  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean | null>(null);
  const resetHandledRef = useRef(false);

  // Dev/QA: ?tutorial=reset → clear the flag so tutorial seeds again
  useEffect(() => {
    if (!user || resetHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('tutorial') !== 'reset') return;
    resetHandledRef.current = true;
    const ref = doc(db, 'users', user.uid, 'settings', 'general');
    deleteDoc(ref).catch(() => {});
    // Remove the query param from the URL so it doesn't fire again on HMR
    params.delete('tutorial');
    const clean = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (clean ? `?${clean}` : ''));
  }, [user]);

  // Subscribe to Firestore doc
  useEffect(() => {
    if (!user) {
      setHasSeenTutorial(null);
      return;
    }
    const ref = doc(db, 'users', user.uid, 'settings', 'general');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setHasSeenTutorial(snap.data().hasSeenTutorial === true);
        } else {
          setHasSeenTutorial(false);
        }
      },
      () => {
        setHasSeenTutorial(false);
      },
    );
    return unsub;
  }, [user]);

  const markTutorialSeen = useCallback(async () => {
    if (!user) return;
    setHasSeenTutorial(true);
    const ref = doc(db, 'users', user.uid, 'settings', 'general');
    try {
      await setDoc(ref, { hasSeenTutorial: true }, { merge: true });
    } catch (e) {
      console.warn('[useHasSeenTutorial] failed to write flag:', e);
    }
  }, [user]);

  return { hasSeenTutorial, markTutorialSeen };
}
