# 実装済み機能一覧 (Bitdone / PixDone)

> 開発管理用の棚卸しドキュメント。BRD (docs/BRD.md) が目的・方針、こちらは「いま何が実装されているか」の現状スナップショット。
> Last updated: 2026-04-13

## 凡例

- ✅ 実装済み / 本番稼働中
- 🧪 実装済みだがフラグ付き・限定公開
- ⚠️ 部分実装 / 既知の制約あり
- ❌ 未実装 (参考: BRD で定義されているが未着手)

---

## 1. コア機能 (タスク管理)

| 機能 | 状態 | 実装箇所 |
|------|------|---------|
| タスク作成 / 編集 / 削除 | ✅ | `app/src/components/TaskForm.tsx`, `TaskItem.tsx` |
| リッチテキスト入力 (タスク本文) | ✅ | `design-system/components/RichTextArea`, `RichTextField` |
| タスク完了 (Smash) アニメーション | ✅ | `services/taskAnimations.ts` |
| サブタスク | ✅ | `TaskItem.tsx` + `subtaskComplete` sound |
| 長押し並び替え | ✅ | `hooks/useActiveTaskLongPressReorder.ts` |
| スワイプ操作 (リスト切替) | ✅ | `hooks/useTaskListSwipe.ts` |
| モバイル用タスク編集シート | ✅ | `components/MobileTaskSheet.tsx` |
| リンクプレビュー | ✅ | `GET /api/link-preview` (server/routes.ts:510) |
| 自動保存 (編集画面を閉じた時) | ✅ | `docs/specs/auto-save-on-close.md` |

## 2. リスト管理

| 機能 | 状態 | 備考 |
|------|------|------|
| 複数リスト | ✅ | Free は最大 3 リスト (BRD) |
| Smash List (無制限) | ✅ | Free でも無制限 |
| リスト作成 / 名称変更 / 削除 | ✅ | `ListModal.tsx`, `ListHeader.tsx` |
| タブ UI | ✅ | `ListTabs.tsx` |

API: `GET/POST/PUT/DELETE /api/lists`, `GET /api/lists/:id/tasks`

## 3. フォーカスモード / タイマー

| 機能 | 状態 | 実装箇所 |
|------|------|---------|
| Focus Screen | ✅ | `screens/FocusScreenContainer.tsx`, `components/FocusScreen.tsx` |
| Zen モード | ✅ | `components/FocusZenMode.tsx` |
| フォーカスタイマー | ✅ | `hooks/useFocusTimer.ts` |
| ブレイクスクリーン | ✅ | `components/BreakScreen.tsx` |
| Wake Lock (画面ロック防止) | ✅ | `hooks/useWakeLock.ts` |
| Perfect Timing 準備 | ✅ | `hooks/usePerfectTimingSetup.ts` |
| Pacman 進捗バー | ✅ | `components/PacmanProgress.tsx` |
| Pixel Breaker (ミニゲーム演出) | ✅ | `components/PixelBreaker.tsx` |

## 4. チャレンジ / 進捗

| 機能 | 状態 | 実装箇所 |
|------|------|---------|
| チャレンジメニュー | ✅ | `components/ChallengeMenu.tsx` |
| アクティブチャレンジ管理 | ✅ | `hooks/useActiveChallenge.ts` |
| 円形プログレスリング | ✅ | commit 81467fe |
| 進捗ロスト防止 (多層防御) | ✅ | commit d6348af |
| 日次リセット (午前0時) | ✅ | `hooks/useMidnightRefresh.ts` |

## 5. エフェクト / コレクション

| 機能 | 状態 | 実装箇所 |
|------|------|---------|
| エフェクトレジストリ | ✅ | `data/effectsRegistry.ts` |
| エフェクト進化 (Evolution) | ✅ | `data/effectEvolution.ts` |
| Draw Pool (抽選ロジック) | ✅ | `data/buildDrawPool.test.ts` |
| エフェクト進捗 API | ✅ | `GET /api/effect-progress`, `POST /api/effect-progress/task-complete` |
| エフェクト進捗フック | ✅ | `hooks/useEffectProgress.ts` |
| コレクション画面 (Effects / Themes タブ) | ✅ | `pages/CollectionPage/` |
| エフェクト詳細 / プレビュー | ✅ | `EffectDetailView.tsx`, `EffectPreviewPanel.tsx` |
| エフェクトリクエスト (ユーザー投稿) | ✅ | `pages/EffectRequestPage.tsx` |

## 6. テーマ

| 機能 | 状態 | 備考 |
|------|------|------|
| デフォルトテーマ | ✅ | Free 利用可 |
| Arcade テーマ | ✅ | `themes/arcade.theme.ts` (PixDone+) |
| Synthwave テーマ | ✅ | `themes/synthwave.theme.ts` (PixDone+) |
| Forestbit テーマ | ✅ | `themes/forestbit.theme.ts` (PixDone+) |
| ThemeSelector UI | ✅ | `components/ThemeSelector.tsx` |
| テーマ権限チェック | ✅ | `hooks/useThemeEntitlements.ts` |
| ユーザーテーマ永続化 | ✅ | `PATCH /api/user/theme`, `hooks/useUserTheme.ts` |
| テーマ進化 (Progression) | ❌ | BRD Phase 2 未着手 |
| AI テーマ生成 | ❌ | BRD Phase 3 未着手 |

## 7. 認証

| 機能 | 状態 | 実装箇所 |
|------|------|---------|
| Firebase Auth | ✅ | `contexts/AuthContext.tsx`, `server/firebaseAdmin.ts` |
| Google ログイン | ✅ | `server/googleAuth.ts` |
| Email ログイン | ✅ | `server/emailAuth.ts` |
| Firebase セッション (サーバー) | ✅ | `server/firebaseSessionRoute.ts`, `docs/FIREBASE_SERVER_SESSION.md` |
| Replit Auth (レガシー) | ⚠️ | `server/replitAuth.ts` - 維持のみ |
| Auth Modal | ✅ | `components/AuthModal.tsx` |
| ログイン/サインアップ analytics | ✅ | commit d8d6c23 |

## 8. 課金 (PixDone+)

| 機能 | 状態 | 実装箇所 |
|------|------|---------|
| Stripe Checkout セッション作成 | ✅ | `POST /api/billing/create-checkout-session` |
| サブスクキャンセル | ✅ | `POST /api/billing/cancel` |
| Stripe Webhook | ✅ | `POST /api/billing/stripe-webhook` |
| エンタイトルメント取得 | ✅ | `GET /api/billing/entitlements` |
| 価格ページ | ✅ | `pages/PricingPage.tsx` |
| アップセルモーダル | ✅ | `components/UpsellModal.tsx` |
| アカウントページ | ✅ | `pages/AccountPage.tsx` |
| 月額 / 年額プラン | ✅ | ¥600/月, ¥6,000/年 (BRD) |

## 9. サウンド / BGM

| 機能 | 状態 | 実装箇所 |
|------|------|---------|
| サウンドエンジン | ✅ | `services/soundEngine.ts`, `services/sound.ts` |
| サウンドトークン | ✅ | `design-system/foundations/sound.tokens.ts` |
| BGM 制御 | ✅ | `services/bgm.ts`, `components/BgmControl.tsx` |

## 10. デザインシステム

| カテゴリ | 実装済みコンポーネント |
|---------|---------------------|
| 入力 | Button, IconButton, Checkbox, Chip, TextField, TextArea, RichTextField, RichTextArea, Toggle |
| 表示 | Badge, TextLink |
| オーバーレイ | BottomSheet, ModalDialog, PopoverMenu, Toast |
| トークン | color / typography / spacing / border / radius / shadow / motion / sound / zIndex |
| テーマ機構 | `theme/ThemeProvider`, `themes/themeRegistry.ts`, `themePrimitives.ts` |
| Storybook | ListHeader, ListTabs, SmashListPanel, TaskItem, TutorialPanel など |

### ピクセルカーソル (`app/src/utils/pixelCursor.ts`)

デスクトップ (`@media (pointer: fine)`) のみ、OS カーソルをピクセルアート風に差し替え。モバイル/タッチは無変更。

- **形状**: `default` (アロー) と `pointer` (指) はユーザー提供の SVG (cursor.svg / pointer.svg) を `shape-rendering="crispEdges"` 付きの data URL として埋め込み。`text` / `notAllowed` / `wait` / `help` / `grab` / `grabbing` / `move` / `crosshair` は Canvas 2D で描画した文字列グリッド (`#`=輪郭, `.`=塗り, space=透明)。全 10 種。
- **サイズ**: OS デフォルト相当。default 10×17, pointer 13×16, text 10×16 CSS px。その他は 10×10 グリッド × CELL=2 で 20×20。
- **カラー**: 塗り = `--pd-color-accent-default` (紫)、輪郭 = `--pd-color-text-primary` (ライトで黒 / ダークで白)。テーマ切替時に自動再描画。
- **適用方式**:
  1. `*, *::before, *::after { cursor: var(--pd-cursor) !important }` を注入して全要素を強制上書き
  2. `mouseover` (capture) で対象要素の *ネイティブ* 計算済み `cursor` 値を読み取り (スタイル要素を `disabled=true` にして一時無効化 → 読む → 戻す)、キーワードを自作 10 種にマッピング
  3. `--pd-cursor` CSS 変数を上書きして即座に反映
- **カバレッジ**: 既存の `cursor: pointer` / `cursor: text` 等を CSS で持つ全要素を、セレクタ列挙なしで自動追従。`cursor: auto` の場合は実在する text 入力要素 (`input[type=text/email/...]`, `textarea`, `[contenteditable]`) のみ I-beam に、それ以外は default。
- **テーマ追従**: `MutationObserver` が `<html>` の `data-theme` / `data-visual-theme` / `style` 変更を監視して再描画。`prefers-color-scheme` の OS 切替にも対応。
- **初期化**: `app/src/main.tsx` で `initPixelCursor()` を呼び出し。

## 11. チュートリアル / オンボーディング

| 機能 | 状態 | 実装箇所 |
|------|------|---------|
| Tutorial Panel | ✅ | `components/TutorialPanel.tsx` |
| Tutorial task complete analytics | ✅ | commit d8d6c23 |

## 12. 分析 / 計測

| 機能 | 状態 | 備考 |
|------|------|------|
| analytics 基盤 | ✅ | `services/analytics.ts` |
| 先行指標イベント | ✅ | sign_up / login / screen_view / tutorial_task_complete (d8d6c23) |
| ローカル opt-out | ✅ | 端末単位 (0c7fb0d) |

## 13. インフラ / デプロイ

| 項目 | 状態 | 備考 |
|------|------|------|
| Vercel デプロイ | ✅ | `docs/vercel-deployment.md`, `DEPLOY_REACT.md` |
| 環境変数バリデーション | ✅ | `server/validateDeploymentEnv.ts` |
| Firestore | ✅ | `server/db.ts`, `server/storage.ts` |
| Supabase (補助 DB) | ⚠️ | `docs/SUPABASE_DB_SETUP.md` 参照 |
| Health check | ✅ | `GET /health`, `GET /api/health` |
| Startup error ハンドリング | ✅ | `server/startupError.ts` |

## 14. API エンドポイント一覧 (server/routes.ts)

```
GET    /api/health
GET    /health
GET    /api/auth/user
PATCH  /api/user/theme
GET    /api/billing/entitlements
POST   /api/billing/create-checkout-session
POST   /api/billing/cancel
POST   /api/billing/stripe-webhook
GET    /api/effect-progress
POST   /api/effect-progress/task-complete
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/lists
POST   /api/lists
PUT    /api/lists/:id
DELETE /api/lists/:id
GET    /api/lists/:id/tasks
GET    /api/link-preview
```

## 15. テストカバレッジ (主要)

- `TaskForm.test.tsx`, `TaskItem.test.tsx`, `MobileTaskSheet.test.tsx`, `ChallengeMenu.test.tsx`
- `useLists.test.ts`, `useActiveChallenge.test.ts`, `useEffectProgress.test.ts`, `useFocusTimer.test.ts`, `useActiveTaskLongPressReorder.test.ts`, `useKeyboardNav.test.tsx`
- `taskAnimations.test.ts`, `effectEvolution.test.ts`, `buildDrawPool.test.ts`

---

## BRD との差分 (未実装)

- ❌ **Theme Progression System** (Phase 2)
- ❌ **AI Theme Generation** (Phase 3)
- ❌ BRD で明示的に対象外の機能: プロジェクト管理、分析ダッシュボード、カレンダー、チーム機能
