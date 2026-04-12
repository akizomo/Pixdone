/**
 * PixDone Analytics Service
 *
 * 内部トラッキング専用。ユーザーには見えない。
 * Firebase Analytics (Google Analytics) でイベントを計測する。
 *
 * イベント一覧:
 * ── コア ──
 *   task_complete   タスク完了（Smash）
 *   task_add        タスク追加
 *   list_create     リスト作成
 *
 * ── エンゲージメント ──
 *   theme_switch       テーマ切り替え
 *   effect_triggered   完了エフェクト発生
 *   pomodoro_complete  ポモドーロ完了
 *   challenge_unlocked チャレンジ達成
 */

import { logEvent as firebaseLogEvent } from 'firebase/analytics';
import { analytics } from '../lib/firebase';

// ────────────────────────────────────────
// Event parameter types
// ────────────────────────────────────────

interface TaskCompleteParams {
  list_type: 'smash' | 'custom';
  is_repeat: boolean;
  has_subtasks: boolean;
}

interface TaskAddParams {
  list_type: 'smash' | 'custom';
  is_repeat: boolean;
}

interface ListCreateParams {
  list_name?: string;
}

interface ThemeSwitchParams {
  from_theme: string;
  to_theme: string;
}

interface EffectTriggeredParams {
  effect_tier: 'common' | 'rare' | 'epic';
  effect_id: string;
  theme_id: string;
}

interface PomodoroCompleteParams {
  duration_minutes: number;
  session_index: number; // 何回目のポモドーロか
}

interface ChallengeUnlockedParams {
  challenge_id: string;
  effect_id: string;
  tasks_completed: number;
}

// ────────────────────────────────────────
// Internal helper
// ────────────────────────────────────────

function track(eventName: string, params?: object) {
  if (!analytics) return;
  if (typeof window !== 'undefined' && window.localStorage?.getItem('pd_no_track') === '1') return;

  try {
    firebaseLogEvent(analytics, eventName, params as Record<string, unknown> | undefined);
  } catch (err) {
    // Analytics の失敗がアプリに影響しないようにする
    if (import.meta.env.DEV) {
      console.warn(`[analytics] Failed to log "${eventName}":`, err);
    }
  }
}

// ────────────────────────────────────────
// Public API
// ────────────────────────────────────────

/** タスク完了（Smash） */
export function trackTaskComplete(params: TaskCompleteParams) {
  track('task_complete', params);
}

/** タスク追加 */
export function trackTaskAdd(params: TaskAddParams) {
  track('task_add', params);
}

/** リスト作成 */
export function trackListCreate(params: ListCreateParams) {
  track('list_create', params);
}

/** テーマ切り替え */
export function trackThemeSwitch(params: ThemeSwitchParams) {
  track('theme_switch', params);
}

/** 完了エフェクト発生 */
export function trackEffectTriggered(params: EffectTriggeredParams) {
  track('effect_triggered', params);
}

/** ポモドーロ完了 */
export function trackPomodoroComplete(params: PomodoroCompleteParams) {
  track('pomodoro_complete', params);
}

/** チャレンジ達成（エフェクトアンロック） */
export function trackChallengeUnlocked(params: ChallengeUnlockedParams) {
  track('challenge_unlocked', params);
}
