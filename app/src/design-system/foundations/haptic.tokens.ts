/**
 * Pixdone haptic tokens (native app only).
 * サウンドトークンと 1:1 で対になる触覚フィードバック。playSound(key) が同じ key で
 * playHaptic を呼ぶので、DS コンポーネントは追加の呼び出しなしで振動する。
 * 実再生は services/haptics.ts（Capacitor Haptics）に委譲。Web では何もしない。
 *
 * - impact: 物理的な「当たり」。light < medium < heavy
 * - notification: 結果の通知（success / warning / error）
 * - selection: 選択が切り替わった軽いティック
 */
import type { SoundKey } from './sound.tokens';

export type HapticPattern =
  | { type: 'impact'; style: 'light' | 'medium' | 'heavy' }
  | { type: 'notification'; style: 'success' | 'warning' | 'error' }
  | { type: 'selection' };

/** サウンドトークンに対応する触覚パターン。 */
export const haptic: Record<SoundKey, HapticPattern> = {
  taskAdd: { type: 'impact', style: 'light' },
  taskEdit: { type: 'impact', style: 'light' },
  taskDelete: { type: 'impact', style: 'medium' },
  taskCancel: { type: 'impact', style: 'light' },
  taskComplete: { type: 'notification', style: 'success' },
  focusAlarm: { type: 'notification', style: 'warning' },
  focusPomodoroComplete: { type: 'notification', style: 'success' },
  focusBreakComplete: { type: 'notification', style: 'success' },
  perfectTimingGreat: { type: 'notification', style: 'success' },
  buttonClick: { type: 'selection' },
  subtaskComplete: { type: 'impact', style: 'medium' },
};

/** Smash（タスク完了エフェクト）の瞬間。サウンドは animations.js が鳴らすので key を持たない。 */
export const smashHaptic: HapticPattern = { type: 'impact', style: 'heavy' };
