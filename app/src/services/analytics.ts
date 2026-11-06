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
 *   theme_switch           テーマ切り替え
 *   effect_triggered       完了エフェクト発生
 *   pomodoro_complete      ポモドーロ完了
 *   challenge_unlocked     チャレンジ達成
 *   screen_view            画面遷移
 *   tutorial_task_complete チュートリアルタスク完了
 *
 * ── 認証 ──
 *   sign_up 新規登録
 *   login   ログイン
 *
 * ── 課金ファネル ──
 *   upsell_view       アップセル（モーダル・アップグレード導線）表示   { source }
 *   pricing_view      料金ページ表示                                 { source, platform }
 *   purchase_start    購入ボタン押下（Stripe 遷移 / ストア購入シート） { plan, platform }
 *   purchase_success  PixDone+ がサーバーで有効になったのを確認        { plan, platform, is_trial }
 *   purchase_cancel   ストア購入シートでキャンセル                     { platform }
 *
 * 共通パラメータ:
 *   traffic_type: 'internal'  内部ユーザー（uid が VITE_INTERNAL_UIDS に含まれる）の全イベントに付与。
 *                             GA4 のデータフィルタ「Internal Traffic」で除外する。
 *   debug_mode: true          VITE_GA_DEBUG=1 のビルド、または localStorage pd_ga_debug=1 のとき付与（DebugView 用）
 */

import { logEvent as firebaseLogEvent, setUserId as firebaseSetUserId } from 'firebase/analytics';
import { Capacitor } from '@capacitor/core';
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
  /** 作成後のリスト数（Smash List を除く）。リスト名など内容は送らない */
  list_count: number;
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

type AuthMethod = 'email' | 'google' | 'apple';

interface SignUpParams {
  method: AuthMethod;
}

interface LoginParams {
  method: AuthMethod;
}

interface ScreenViewParams {
  screen_name: 'tasks' | 'focus' | 'collection';
}

interface TutorialTaskCompleteParams {
  tutorial_step: 'tutorial-1' | 'tutorial-2' | 'tutorial-3';
}

// ── 課金ファネル ──

/** アップセル / 料金ページへの入口。/pricing への遷移は必ず ?source= を付ける */
export type PricingSource =
  | 'list_limit'
  | 'preset_theme'
  | 'sound_effect'
  | 'collection_effect'
  | 'collection_theme'
  | 'evolution'
  | 'theme_selector'
  | 'account'
  | 'plus_intro'
  | 'onboarding'
  | 'other';

const PRICING_SOURCES: readonly PricingSource[] = [
  'list_limit', 'preset_theme', 'sound_effect', 'collection_effect', 'collection_theme',
  'evolution', 'theme_selector', 'account', 'plus_intro', 'onboarding', 'other',
];

/** ?source= の値を検証する。未指定・不明な値は 'other' */
export function parsePricingSource(value: string | null | undefined): PricingSource {
  return PRICING_SOURCES.includes(value as PricingSource) ? (value as PricingSource) : 'other';
}

/** /pricing への遷移先（source 付き） */
export function pricingPath(source: PricingSource): string {
  return `/pricing?source=${source}`;
}

export type AnalyticsPlatform = 'web' | 'ios' | 'android';
export type BillingPlan = 'monthly' | 'yearly';

export function getAnalyticsPlatform(): AnalyticsPlatform {
  const p = Capacitor.getPlatform();
  return p === 'ios' || p === 'android' ? p : 'web';
}

interface UpsellViewParams {
  source: PricingSource;
}

interface PricingViewParams {
  source: PricingSource;
}

interface PurchaseStartParams {
  plan: BillingPlan;
}

interface PurchaseSuccessParams {
  plan: BillingPlan;
  is_trial: boolean;
}

// ────────────────────────────────────────
// Internal helper
// ────────────────────────────────────────

/** ログイン中の Firebase uid（setAnalyticsUserId で受け取る） */
let currentUid: string | null = null;

function parseInternalUids(raw: string | undefined): Set<string> {
  return new Set((raw ?? '').split(',').map((s) => s.trim()).filter(Boolean));
}

const INTERNAL_UIDS = parseInternalUids(import.meta.env.VITE_INTERNAL_UIDS);

function isInternalUser(): boolean {
  return currentUid !== null && INTERNAL_UIDS.has(currentUid);
}

function isDebugMode(): boolean {
  if (import.meta.env.VITE_GA_DEBUG === '1') return true;
  try {
    return typeof window !== 'undefined' && window.localStorage?.getItem('pd_ga_debug') === '1';
  } catch {
    return false;
  }
}

/** 全イベント共通のパラメータを付与する（テスト用に export） */
export function withCommonParams(params?: object): Record<string, unknown> | undefined {
  const extra: Record<string, unknown> = {};
  if (isInternalUser()) extra.traffic_type = 'internal';
  if (isDebugMode()) extra.debug_mode = true;
  if (Object.keys(extra).length === 0) return params as Record<string, unknown> | undefined;
  return { ...(params as Record<string, unknown> | undefined), ...extra };
}

function track(eventName: string, params?: object) {
  if (!analytics) return;

  try {
    if (typeof window !== 'undefined' && window.localStorage?.getItem('pd_no_track') === '1') return;
    firebaseLogEvent(analytics, eventName, withCommonParams(params));
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

/** 新規登録（GA4 推奨イベント） */
export function trackSignUp(params: SignUpParams) {
  track('sign_up', params);
}

/** ログイン（GA4 推奨イベント） */
export function trackLogin(params: LoginParams) {
  track('login', params);
}

/** 画面遷移 */
export function trackScreenView(params: ScreenViewParams) {
  track('screen_view', params);
}

/** チュートリアルタスク完了 */
export function trackTutorialTaskComplete(params: TutorialTaskCompleteParams) {
  track('tutorial_task_complete', params);
}

/** アップセル（モーダル・アップグレード導線）表示 */
export function trackUpsellView(params: UpsellViewParams) {
  track('upsell_view', params);
}

/** 料金ページ表示 */
export function trackPricingView(params: PricingViewParams) {
  track('pricing_view', { ...params, platform: getAnalyticsPlatform() });
}

/** 購入開始（Stripe checkout へ遷移 / ストア購入シートを開いた） */
export function trackPurchaseStart(params: PurchaseStartParams) {
  track('purchase_start', { ...params, platform: getAnalyticsPlatform() });
}

/** 購入完了（PixDone+ がサーバーで有効になったのを確認できた時点） */
export function trackPurchaseSuccess(params: PurchaseSuccessParams) {
  track('purchase_success', { ...params, platform: getAnalyticsPlatform() });
}

/** ストア購入シートでキャンセル */
export function trackPurchaseCancel() {
  track('purchase_cancel', { platform: getAnalyticsPlatform() });
}

/**
 * GA4 の user_id を設定。ログイン時に Firebase uid を渡し、
 * ログアウト時は null を渡す。事前セッションと紐づく。
 */
export function setAnalyticsUserId(uid: string | null) {
  // 内部ユーザー判定に使うので、analytics の初期化前・オプトアウト中でも保持する
  currentUid = uid;
  if (!analytics) return;
  if (typeof window !== 'undefined' && window.localStorage?.getItem('pd_no_track') === '1') return;
  try {
    firebaseSetUserId(analytics, uid ?? '');
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[analytics] setUserId failed:', err);
    }
  }
}
