import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface EffectProgressEntry {
  id: number;
  userId: string;
  effectId: string;
  owned: boolean;
  equippedLevel: number;
  evolutionProgress: number;
  challengeProgress: number;
  earnedAt: string | null;
  updatedAt: string;
}

export interface UseEffectProgressResult {
  progress: Record<string, EffectProgressEntry>;
  ownedChallengeEffects: string[];
  challengeProgressMap: Record<string, number>;
  isLoading: boolean;
  refetch: () => Promise<void>;
  /** Optimistically bump a challenge effect's local progress by 1 (instant UI feedback). */
  optimisticIncrement: (effectId: string) => void;
}

export function useEffectProgress(): UseEffectProgressResult {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, EffectProgressEntry>>({});
  const [isLoading, setIsLoading] = useState(false);
  const cancelledRef = useRef(false);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress({});
      return;
    }
    setIsLoading(true);
    try {
      const resp = await fetch('/api/effect-progress', { credentials: 'include' });
      if (!resp.ok || cancelledRef.current) return;
      const rows: EffectProgressEntry[] = await resp.json();
      if (cancelledRef.current) return;
      const map: Record<string, EffectProgressEntry> = {};
      for (const row of rows) map[row.effectId] = row;
      setProgress(map);
    } catch {
      // ignore
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    cancelledRef.current = false;
    fetchProgress();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchProgress]);

  const optimisticIncrement = useCallback((effectId: string) => {
    setProgress(prev => {
      const existing = prev[effectId];
      if (existing) {
        return {
          ...prev,
          [effectId]: { ...existing, challengeProgress: existing.challengeProgress + 1 },
        };
      }
      // No existing row yet — create a placeholder so the UI can show progress
      return {
        ...prev,
        [effectId]: {
          id: 0,
          userId: '',
          effectId,
          owned: false,
          equippedLevel: 1,
          evolutionProgress: 0,
          challengeProgress: 1,
          earnedAt: null,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const ownedChallengeEffects = Object.values(progress)
    .filter(e => e.owned)
    .map(e => e.effectId);

  const challengeProgressMap: Record<string, number> = {};
  for (const [id, entry] of Object.entries(progress)) {
    challengeProgressMap[id] = entry.challengeProgress;
  }

  return {
    progress,
    ownedChallengeEffects,
    challengeProgressMap,
    isLoading,
    refetch: fetchProgress,
    optimisticIncrement,
  };
}
