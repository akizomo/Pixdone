import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { ThemeKey } from '../design-system/themes/themeRegistry';

const LS_KEY_PREFIX = 'pixdone-theme-stats-';

// Lv thresholds and cabinet counts
const LEVEL_TABLE = [
  { minTasks: 0,   level: 1, cabinetCount: 1 },  // Fighter
  { minTasks: 50,  level: 2, cabinetCount: 3 },  // +Shooter, Maze
  { minTasks: 100, level: 3, cabinetCount: 5 },  // +Platformer, Racing
  { minTasks: 150, level: 4, cabinetCount: 6 },  // +Mystery
];

export interface ThemeStats {
  tasksCompleted: number;
  level: number;
  cabinetCount: number;
}

function deriveStats(tasksCompleted: number): ThemeStats {
  let entry = LEVEL_TABLE[0];
  for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
    if (tasksCompleted >= LEVEL_TABLE[i].minTasks) {
      entry = LEVEL_TABLE[i];
      break;
    }
  }
  return { tasksCompleted, level: entry.level, cabinetCount: entry.cabinetCount };
}

export function useThemeStats(themeKey: ThemeKey) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ThemeStats>(() => {
    if (!user) {
      try {
        const stored = parseInt(localStorage.getItem(LS_KEY_PREFIX + themeKey) ?? '0', 10) || 0;
        return deriveStats(stored);
      } catch { return deriveStats(0); }
    }
    return deriveStats(0);
  });

  const themeKeyRef = useRef(themeKey);
  themeKeyRef.current = themeKey;

  // Firestore sync
  useEffect(() => {
    if (!user) {
      // Load from localStorage for unauthenticated users
      try {
        const stored = parseInt(localStorage.getItem(LS_KEY_PREFIX + themeKey) ?? '0', 10) || 0;
        setStats(deriveStats(stored));
      } catch { setStats(deriveStats(0)); }
      return;
    }

    const docId = `${user.uid}_${themeKey}`;
    const docRef = doc(db, 'themeStats', docId);

    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStats(deriveStats(data.tasksCompleted ?? 0));
      } else {
        setStats(deriveStats(0));
      }
    }, (err) => {
      console.warn('[useThemeStats] onSnapshot error:', err);
    });

    return unsub;
  }, [user, themeKey]);

  const incrementCompleted = useCallback(async () => {
    const key = themeKeyRef.current;

    if (!user) {
      // localStorage fallback
      try {
        const prev = parseInt(localStorage.getItem(LS_KEY_PREFIX + key) ?? '0', 10) || 0;
        const next = prev + 1;
        localStorage.setItem(LS_KEY_PREFIX + key, String(next));
        setStats(deriveStats(next));
      } catch { /* ignore */ }
      return;
    }

    const docId = `${user.uid}_${key}`;
    const docRef = doc(db, 'themeStats', docId);

    try {
      await setDoc(docRef, {
        uid: user.uid,
        themeId: key,
        tasksCompleted: increment(1),
      }, { merge: true });
    } catch (err) {
      console.warn('[useThemeStats] increment failed:', err);
    }
  }, [user]);

  return { stats, incrementCompleted };
}
