import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const CACHE_KEY = 'pd-effect-progress';

/** localStorage に進捗をキャッシュ */
function saveToCache(data: Record<string, EffectProgressEntry>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded etc. */ }
}

/** localStorage からキャッシュを復元 */
function loadFromCache(): Record<string, EffectProgressEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, EffectProgressEntry>;
  } catch {
    return {};
  }
}

function clearCache(): void {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

export function useEffectProgress(): UseEffectProgressResult {
  const { user, loading: authLoading, serverSessionReady } = useAuth();
  // キャッシュから初期化 → リロード時に即座に前回の値を表示
  const [progress, setProgress] = useState<Record<string, EffectProgressEntry>>(loadFromCache);
  const [isLoading, setIsLoading] = useState(false);
  const cancelledRef = useRef(false);
  // 初回フェッチ完了フラグ — serverSessionReady の再トグルによる無駄な refetch を防ぐ
  const hasFetchedRef = useRef(false);

  const fetchProgress = useCallback(async () => {
    // Auth ローディング中はキャッシュを維持して何もしない
    if (authLoading) return;

    // Auth 解決済みで未ログイン → クリア
    if (!user) {
      setProgress({});
      clearCache();
      hasFetchedRef.current = false;
      return;
    }

    // ログイン済みだがサーバーセッション未確立 → キャッシュを維持して待機
    if (!serverSessionReady) return;

    // 既に一度フェッチ済みなら自動リフェッチしない（明示的な refetch() は別パス）
    if (hasFetchedRef.current) return;

    setIsLoading(true);
    try {
      const resp = await fetch('/api/effect-progress', { credentials: 'include' });
      if (cancelledRef.current) return;
      if (!resp.ok) return; // キャッシュの値を維持
      const rows: EffectProgressEntry[] = await resp.json();
      if (cancelledRef.current) return;
      const map: Record<string, EffectProgressEntry> = {};
      for (const row of rows) map[row.effectId] = row;

      // サーバーデータとローカル楽観更新をマージ — 進捗は大きい方を採用
      setProgress(prev => {
        const merged: Record<string, EffectProgressEntry> = { ...map };
        for (const [id, local] of Object.entries(prev)) {
          const server = merged[id];
          if (server && local.challengeProgress > server.challengeProgress) {
            merged[id] = { ...server, challengeProgress: local.challengeProgress };
          }
        }
        saveToCache(merged);
        return merged;
      });
      hasFetchedRef.current = true;
    } catch {
      // ネットワークエラー時はキャッシュの値を維持
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  }, [user, authLoading, serverSessionReady]);

  useEffect(() => {
    cancelledRef.current = false;
    fetchProgress();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchProgress]);

  const optimisticIncrement = useCallback((effectId: string) => {
    setProgress(prev => {
      let next: Record<string, EffectProgressEntry>;
      const existing = prev[effectId];
      if (existing) {
        next = {
          ...prev,
          [effectId]: { ...existing, challengeProgress: existing.challengeProgress + 1 },
        };
      } else {
        // No existing row yet — create a placeholder so the UI can show progress
        next = {
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
      }
      saveToCache(next);
      return next;
    });
  }, []);

  /** 明示的な refetch — hasFetchedRef をリセットしてサーバーから再取得 */
  const refetch = useCallback(async () => {
    hasFetchedRef.current = false;
    await fetchProgress();
  }, [fetchProgress]);

  const ownedChallengeEffects = useMemo(
    () => Object.values(progress).filter(e => e.owned).map(e => e.effectId),
    [progress],
  );

  const challengeProgressMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [id, entry] of Object.entries(progress)) {
      map[id] = entry.challengeProgress;
    }
    return map;
  }, [progress]);

  return {
    progress,
    ownedChallengeEffects,
    challengeProgressMap,
    isLoading,
    refetch,
    optimisticIncrement,
  };
}
