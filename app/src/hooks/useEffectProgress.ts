import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiUrl } from '../lib/apiUrl';

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
   * Optimistically bump a challenge effect's local progress by 1 (instant UI feedback)
   * and flip owned=true if the threshold is reached. UI only — the POST is queued
   * separately by `bumpPending()` (once per completion).
   */
  optimisticIncrement: (effectId: string, threshold: number) => void;
  /** Drain any queued task-complete POSTs that failed previously. Called on load + after fetch. */
  flushPending: () => Promise<void>;
}

const CACHE_KEY = 'pd-effect-progress';
/** 通常リストの完了（チャレンジ・進化に数える）。旧クライアントから引き継ぐ既存のキー */
const PENDING_KEY = 'pd-effect-pending';
/** Smash List の完了（サーバーは数えないが、POST は無条件で送る） */
const PENDING_SMASH_KEY = 'pd-effect-pending-smash';

export type TaskCompleteListType = 'custom' | 'smash';

function pendingKeyFor(listType: TaskCompleteListType): string {
  return listType === 'smash' ? PENDING_SMASH_KEY : PENDING_KEY;
}
/** Safety cap: drain at most this many pending POSTs per flush invocation. */
const PENDING_FLUSH_CAP = 50;
/** Minimum gap between visibility/focus-triggered refetches (ms). */
const REFETCH_THROTTLE_MS = 5_000;

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
function loadPending(listType: TaskCompleteListType = 'custom'): number {
  try {
    const raw = localStorage.getItem(pendingKeyFor(listType));
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function savePending(n: number, listType: TaskCompleteListType = 'custom'): void {
  const key = pendingKeyFor(listType);
  try {
    if (n <= 0) localStorage.removeItem(key);
    else localStorage.setItem(key, String(n));
  } catch { /* ignore */ }
}

/** Queue one task-complete POST. Call exactly once per completed task. */
export function bumpPending(listType: TaskCompleteListType = 'custom'): number {
  const next = loadPending(listType) + 1;
  savePending(next, listType);
  return next;
}

export function decrementPending(listType: TaskCompleteListType = 'custom'): number {
  const next = Math.max(0, loadPending(listType) - 1);
  savePending(next, listType);
  return next;
}

/** True while a flush is draining the queue — prevents two flushes sending the same item twice. */
let flushInFlight = false;

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
      const resp = await fetch(apiUrl('/api/effect-progress'), { credentials: 'include' });
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
   * every task completion (sendTaskComplete).
   */
  const flushPending = useCallback(async () => {
    if (!user || !serverSessionReady) return;
    if (flushInFlight) return; // the running flush re-reads the queue and picks this up
    flushInFlight = true;
    try {
      let budget = PENDING_FLUSH_CAP;
      // Re-read the queue after each POST so items bumped mid-flush are sent too.
      while (budget > 0) {
        const listType: TaskCompleteListType | null =
          loadPending('custom') > 0 ? 'custom' : loadPending('smash') > 0 ? 'smash' : null;
        if (!listType) break;
        try {
          const resp = await fetch(apiUrl('/api/effect-progress/task-complete'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ listType }),
          });
          if (!resp.ok) break; // keep remaining in queue, retry next flush
          decrementPending(listType);
          budget--;
        } catch {
          break; // network error — keep in queue
        }
      }
    } finally {
      flushInFlight = false;
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
    // NOTE: no bumpPending() here. sendTaskComplete queues exactly one POST per
    // completion; bumping again here double-counted every completion on the server.
  }, []);

  // Keep ref current
  useEffect(() => { flushPendingRef.current = flushPending; }, [flushPending]);

  /** 明示的な refetch — hasFetchedRef をリセットしてサーバーから再取得 */
  const refetch = useCallback(async () => {
    hasFetchedRef.current = false;
    await fetchProgress();
  }, [fetchProgress]);

  // Cross-device sync: on tab visibility/focus, refetch from server so
  // a tab that's been left open picks up progress made on another device
  // (or another tab). Throttled to avoid thrashing on rapid focus changes.
  const lastRefetchAtRef = useRef(0);
  const refetchRef = useRef(refetch);
  useEffect(() => { refetchRef.current = refetch; }, [refetch]);

  useEffect(() => {
    if (!user || !serverSessionReady) return;
    const maybeRefetch = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastRefetchAtRef.current < REFETCH_THROTTLE_MS) return;
      lastRefetchAtRef.current = now;
      void refetchRef.current();
      void flushPendingRef.current?.();
    };
    document.addEventListener('visibilitychange', maybeRefetch);
    window.addEventListener('focus', maybeRefetch);
    return () => {
      document.removeEventListener('visibilitychange', maybeRefetch);
      window.removeEventListener('focus', maybeRefetch);
    };
  }, [user, serverSessionReady]);

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
