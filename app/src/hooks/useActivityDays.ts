import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCounter } from './useFirestoreCounter';

export type ActivityLevel = 'high' | 'mid' | 'low';

const LS_DAYS_KEY = 'pixdone-activity-days';
const RETENTION_DAYS = 7;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function pruneDays(days: string[]): string[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return days.filter((d) => d >= cutoffStr);
}

function calcActivityLevel(days: string[]): ActivityLevel {
  const recent = pruneDays(days);
  if (recent.length >= 5) return 'high';
  if (recent.length >= 2) return 'mid';
  return 'low';
}

// Agent count per level × activity (from spec table)
const AGENT_TABLE: Record<number, Record<ActivityLevel, number>> = {
  1: { high: 1, mid: 1, low: 0 },
  2: { high: 3, mid: 1, low: 0 },
  3: { high: 5, mid: 2, low: 0 },
  4: { high: 6, mid: 3, low: 0 },
};

export function calcAgentCount(level: number, activityLevel: ActivityLevel): number {
  const entry = AGENT_TABLE[level];
  if (!entry) return 0;
  return entry[activityLevel];
}

function readDaysLS(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_DAYS_KEY) ?? '[]');
    return Array.isArray(stored) ? stored : [];
  } catch { return []; }
}

function writeDaysLS(days: string[]): void {
  try { localStorage.setItem(LS_DAYS_KEY, JSON.stringify(days)); } catch { /* ignore */ }
}

export function useActivityDays() {
  const { user } = useAuth();
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(() => calcActivityLevel(readDaysLS()));
  const recordedRef = useRef(false);

  // totalLoginDays via shared counter helper
  const { count: totalLoginDays, incrementCount: incrementLoginDays } = useFirestoreCounter({
    docPath: user ? `activityDays/${user.uid}` : null,
    localStorageKey: 'pixdone-total-login-days',
    field: 'totalLoginDays',
    createFields: user ? { uid: user.uid } : undefined,
  });

  // Sync activity level from Firestore days array
  useEffect(() => {
    if (!user) {
      setActivityLevel(calcActivityLevel(readDaysLS()));
      return;
    }

    const docRef = doc(db, 'activityDays', user.uid);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const days = Array.isArray(data.days) ? data.days : [];
        setActivityLevel(calcActivityLevel(days));
      } else {
        setActivityLevel('low');
      }
    }, (err) => {
      console.warn('[useActivityDays] onSnapshot error:', err);
    });

    return unsub;
  }, [user]);

  const recordToday = useCallback(async () => {
    if (recordedRef.current) return;
    recordedRef.current = true;

    const today = todayISO();

    if (!user) {
      const days = readDaysLS();
      const isNew = !days.includes(today);
      if (isNew) {
        days.push(today);
        incrementLoginDays();
      }
      const pruned = pruneDays(days);
      writeDaysLS(pruned);
      setActivityLevel(calcActivityLevel(pruned));
      return;
    }

    const docRef = doc(db, 'activityDays', user.uid);
    try {
      const { getDoc } = await import('firebase/firestore');
      const snap = await getDoc(docRef);
      const existing: string[] = snap.exists() ? (snap.data().days ?? []) : [];
      const isNew = !existing.includes(today);
      if (isNew) existing.push(today);
      const pruned = pruneDays(existing);

      // Write days array (non-counter field, use setDoc directly)
      await setDoc(docRef, { uid: user.uid, days: pruned }, { merge: true });

      // Increment totalLoginDays counter via shared helper (handles optimistic + Firestore)
      if (isNew) incrementLoginDays();
    } catch (err) {
      console.warn('[useActivityDays] recordToday failed:', err);
    }
  }, [user, incrementLoginDays]);

  return { activityLevel, totalLoginDays, recordToday };
}
