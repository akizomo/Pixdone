/**
 * 最初のチャレンジ（期限なし・全員が登録時から参加）
 *
 * 通常リストのタスクを規定数（registry の threshold）完了すると Fighter / Punch を獲得する。
 * Smash List の完了は数えない（サーバー側で判断）。
 * 獲得した完了では、そのタスクで Fighter のパンチを見せる（App.tsx の runCompleteShort）。
 */

/** 最初のチャレンジの対象エフェクト */
export const FIRST_CHALLENGE_EFFECT_KEY = 'fighter_punch';
