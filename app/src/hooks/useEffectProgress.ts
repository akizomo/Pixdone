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
  /**
   * Optimistically bump a challenge effect's local progress by 1 (instant UI feedback).
   * Also queues a pending POST and flips owned=true if the threshold is reached.
   */
  optimisticIncrement: (effectId: string, threshold: number) => void;
  /** Drain any queued task-complete POSTs that failed previously. Called on load + after fetch. */
  flushPending: () => Promise<void>;
}

const CACHE_KEY = 'pd-effect-progress';
const PENDING_KEY = 'pd-effect-pending';
/** Safety cap: drain at most this many pending POSTs per flush invocation. */
const PENDING_FLUSH_CAP = 50;

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

/** 未送信/失敗の task-complete POST のカウンタ (localStorage 永続化). */
function loadPending(): number {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function savePending(n: number): void {
  try {
    if (n <= 0) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, String(n));
  } catch { /* ignore */ }
}

export function bumpPending(): number {
  const next = loadPending() + 1;
  savePending(next);
  return next;
}

export function decrementPending(): number {
  const next = Math.max(0, loadPending() - 1);
  savePending(next);
  return next;
}

/**
 * Pure merge: combine server rows with local (optimistic) state.
 *
 * Rules:
 * - If server has the row: take server values, but keep max(local, server) for challengeProgress,
 *   and OR owned (sticky — once owned=true anywhere, stay owned).
 * - If server does NOT have the row: preserve local fully. Prevents day-2 resets when a write
 *   is still pending or a transient server error drops a row from the response.
 *
 * 以前は server に行が無いと local が捨てられ、POST 失敗 → 翌日の GET 空レスポンス →
 * キャッシュの進捗リセット、という致命バグがあった。
 * さらに optimistic owned=true がマージで server.owned=false に潰されないよう sticky にする。
 */
export function mergeEffectProgress(
  local: Record<string, EffectProgressEntry>,
  serverRows: EffectProgressEntry[],
): Record<string, EffectProgressEntry> {
  const map: Record<string, EffectProgressEntry> = {};
  for (const row of serverRows) map[row.effectId] = row;

  const merged: Record<string, EffectProgressEntry> = { ...map };
  for (const [id, localEntry] of Object.entries(local)) {
    const server = merged[id];
    if (!server) {
      merged[id] = localEntry;
      continue;
    }
    merged[id] = {
      ...server,
      challengeProgress: Math.max(server.challengeProgress, localEntry.challengeProgress),
      owned: server.owned || localEntry.owned,
      earnedAt: server.earnedAt ?? localEntry.earnedAt,
    };
  }
  return merged;
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

      setProgress(prev => {
        const merged = mergeEffectProgress(prev, rows);
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
    (async () => {
      await fetchProgress();
      // 起動/再認証時に取り残された pending をドレイン
      if (!cancelledRef.current) void flushPendingRef.current?.();
    })();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchProgress]);

  // flushPending を ref に保持 — useEffect とのサイクリック依存を避ける
  const flushPendingRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Drain the persistent pending POST queue. Retries task-complete calls that failed previously
   * so the server eventually catches up even if individual POSTs were dropped
   * (cold start, 502, transient 401, network). Called on load, after fetchProgress, and after
   * every optimistic increment.
   */
  const flushPending = useCallback(async () => {
    if (!user || !serverSessionReady) return;
    let pending = loadPending();
    if (pending <= 0) return;

    const toDrain = Math.min(pending, PENDING_FLUSH_CAP);
    for (let i = 0; i < toDrain; i++) {
      try {
        const resp = await fetch('/api/effect-progress/task-complete', {
          method: 'POST',
          credentials: 'include',
        });
        if (!resp.ok) break; // keep remaining in queue, retry next flush
        pending = decrementPending();
      } catch {
        break; // network error — keep in queue
      }
    }
  }, [user, serverSessionReady]);

  const optimisticIncrement = useCallback((effectId: string, threshold: number) => {
    setProgress(prev => {
      const existing = prev[effectId];
      const newProgress = (existing?.challengeProgress ?? 0) + 1;
      const reachedThreshold = newProgress >= threshold;
      const nowIso = new Date().toISOString();
      const nextEntry: EffectProgressEntry = existing
        ? {
            ...existing,
            challengeProgress: newProgress,
            owned: existing.owned || reachedThreshold,
            earnedAt: existing.earnedAt ?? (reachedThreshold ? nowIso : null),
            updatedAt: nowIso,
          }
        : {
            id: 0,
            userId: '',
            effectId,
            owned: reachedThreshold,
            equippedLevel: 1,
            evolutionProgress: 0,
            challengeProgress: newProgress,
            earnedAt: reachedThreshold ? nowIso : null,
            updatedAt: nowIso,
          };
      const next = { ...prev, [effectId]: nextEntry };
      saveToCache(next);
      return next;
    });
    bumpPending();
    // Kick the pending queue immediately (first POST attempt). Fire-and-forget —
    // subsequent flushes on app load / after fetch will catch any failures.
    void flushPendingRef.current?.();
  }, []);

  // Keep ref current
  useEffect(() => { flushPendingRef.current = flushPending; }, [flushPending]);

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
    flushPending,
  };
}
