import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCounter } from './useFirestoreCounter';
import type { ThemeKey } from '../design-system/themes/themeRegistry';

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
