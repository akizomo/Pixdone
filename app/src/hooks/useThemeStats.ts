import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCounter } from './useFirestoreCounter';
import type { ThemeKey } from '../design-system/themes/themeRegistry';

// Lv thresholds — shared across all theme worlds. Each theme's draw module
// maps `level` to its own composition (cabinet count, tree count, etc.).
const LEVEL_THRESHOLDS = [0, 50, 100, 150];

export interface ThemeStats {
  tasksCompleted: number;
  level: number;
}

function deriveStats(tasksCompleted: number): ThemeStats {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (tasksCompleted >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return { tasksCompleted, level };
}

export function useThemeStats(themeKey: ThemeKey) {
  const { user } = useAuth();

  const docPath = user ? `themeStats/${user.uid}_${themeKey}` : null;

  const { count, incrementCount } = useFirestoreCounter({
    docPath,
    localStorageKey: `pixdone-theme-stats-${themeKey}`,
    field: 'tasksCompleted',
    createFields: user ? { uid: user.uid, themeId: themeKey } : undefined,
  });

  const stats = useMemo(() => deriveStats(count), [count]);

  return { stats, incrementCompleted: incrementCount };
}
