# Bitdone / PixDone — Claude Code Context

## Product Requirements

The full Business Requirements Document is at [`docs/BRD.md`](docs/BRD.md).

Read it before making decisions about features, monetization, UX, or architecture.

Key points to keep in mind:

- Core loop: **Write → Smash → Reward**
- Free tier: Smash List (unlimited), up to 3 Lists, Common effects, default theme only
- PixDone+: unlimited Lists, Rare/Epic effects, all preset themes — ¥600/month or ¥6,000/year
- Common effects use CSS variables for theming — **never hardcode colors inside effect logic**
- Rare/Epic effects are theme-specific and must be conditionally loaded
- Theme Progression System is **Phase 2** (not yet implemented)
- AI Theme Generation is **Phase 3** (not yet implemented)
- The product intentionally avoids: project management, analytics, calendars, team features

## Stack

| Layer          | Technology |
|----------------|------------|
| Frontend       | Vanilla JS / HTML / CSS (in `app/`) |
| Backend        | Node.js + Express (TypeScript) |
| Database       | Firebase Firestore |
| Auth           | Firebase Auth |
| Payments       | Stripe |
| Deployment     | Vercel |

## Project Structure

- `app/` — frontend (Vite, Vanilla JS)
- `app/src/design-system/themes/` — theme definitions
- `docs/` — documentation including BRD

## Safety Rules (mandatory)

- **外部サービスへの操作は事前確認必須**: Firebase, Stripe, DB, 外部APIに対してスクリプト実行・データ変更・一括操作を行う前に、必ず (1) 現在のプラン/クォータ/制限を確認 (2) 影響範囲をユーザーに説明 (3) 承認を得てから実行する。失敗時に安易にリトライしない。
- **本番データに触れる操作は慎重に**: マイグレーション、データ移行、スキーマ変更は本番環境に直接影響する。ドライランや件数確認を先に行うこと。
- **仕様を理解してから提案する**: BRD.md を読まずに機能提案やアーキテクチャ変更を勧めない。現状のコードと仕様の乖離がないか確認してから動く。

## Design System Rules (mandatory)

UI は `app/src/design-system/` のコンポーネントとトークンを使って構築する。

### コンポーネント優先
- 新しい画面・機能を作るときは、**まず既存の DS コンポーネント**（Button, IconButton, Chip, Checkbox, Badge, TextField, Toggle, BottomSheet, ModalDialog, PopoverMenu, Toast など）で実現できないか検討する。
- DS に足りないコンポーネントやバリエーションがある場合は、**実装前にユーザーに確認**する（「Badge に `info` variant を追加してよいか？」など）。
- 画面固有の一回限りの UI は、DS コンポーネントを組み合わせて作る。共通パターンになりそうなら DS に昇格させる。

### トークンベース
- 生の色コード (`#fff`, `rgba(...)`) やマジックナンバー (`12px`, `0.15s`) を直書きしない。
- **CSS 変数は `--pd-*` の単一 namespace**。旧 `--pxd-*` は廃止済み。
- themeable かどうかは **カテゴリで決まる**:
  - **themeable (ThemeProvider + `.theme.ts` でオーバーライド)**: `--pd-color-*`, `--pd-font-*`
  - **固定 (全テーマ共通、`tokens.css` で定義)**: `--pd-space-*`, `--pd-border-*`, `--pd-radius-*`, `--pd-font-size-*`, `--pd-font-weight-*`, `--pd-line-height-*`, `--pd-motion-*`, `--pd-easing-*`, `--pd-shadow-*`, `--pd-layout-*`, `--pd-tap-target-*`
- 主なトークン:
  - 色: `--pd-color-{role}-{variant}` (例: `--pd-color-text-primary`, `--pd-color-accent-default`)
  - フォント: `--pd-font-brand` / `--pd-font-body`（テーマで変わる）
  - スペース: `--pd-space-{n}` / `--pd-layout-{size}`
  - ボーダー: `--pd-border-{weight}` (thin=1px, base=2px, strong=3px)
  - 角丸: `--pd-radius-{size}` (none, xs, sm, md, lg, xl, full)
  - タイポサイズ: `--pd-font-size-{size}`, `--pd-font-weight-{name}`
  - モーション: `--pd-motion-{speed}`, `--pd-easing-{name}`
  - シャドウ: `--pd-shadow-{type}-{size}`

### トークン階層ルール（Primitive → Semantic）
- **Primitive トークン** (`tokens.css`): `--pd-{color}-{step}` 形式の生のカラーパレット。直接コンポーネントから参照しない（セマンティック経由で使う）。
- **Semantic トークン** (`tokens.ts`): `--pd-color-{role}-{variant}` 形式。必ず primitive の値と一致する hex を使い、対応 primitive をコメントで明記する。
- 新しいセマンティック色を追加するときは:
  1. 対応する primitive が `tokens.css` にあるか確認
  2. なければ primitive を先に追加（命名規則: `--pd-{hue}-{step}`、step は明度順）
  3. `tokens.ts` でその hex を使い、コメントで `// {hue}-{step}` を書く
- **テーマ追加時も同じルール**: 新テーマの `.theme.ts` でオーバーライドする色は、そのテーマ固有の primitive（例: `--pd-sw-*` for synthwave）を参照する。
- **テキスト色の WCAG AA 必須**: テキストに使うセマンティック色は、dark（bg `#202124`）/ light（bg `#ffffff`）両方で **4.5:1 以上**のコントラスト比を確保する。新色追加時は計算して検証すること。

### インラインスタイル禁止
- `style={{}}` は原則使わない。CSS クラス（コンポーネント名.css）を使う。
- 例外: 真に動的な値のみ（ユーザー入力に基づく色、計算された位置など）。

## Sound Rules (mandatory)

Every interactive element **must** call `playSound(key)` from `services/sound.ts`. Use the sound token that matches the semantic action:

| Action | Sound key |
|--------|-----------|
| Add / create / Toggle ON (enable something) | `taskAdd` |
| Edit / open edit mode | `taskEdit` |
| Delete / remove / Toggle OFF (disable something) | `taskDelete` |
| Cancel / close modal / back button on detail pages | `taskCancel` |
| Success / confirm / set theme active | `taskComplete` |
| Select / tab switch / chip / list item / navigate | `buttonClick` |
| Subtask complete | `subtaskComplete` |

Rules:
- DS components (`Button`, `Chip`, `Toggle`, etc.) already call `playSound` internally — **do not call it again in the handler**.
- Raw `<button>` elements must call `playSound` in their `onClick`.
- The full mapping is documented in `app/src/design-system/foundations/sound.tokens.ts`.

## Task Completion Rules (mandatory)

タスク完了時の処理は `sendTaskComplete` (App.tsx) を通じて行う。以下の設計ルールを厳守すること。

### サーバー通知は無条件
- `sendTaskComplete` は **全タスク完了時に無条件で POST を送る**。チャレンジの有無・完了状態・期限に関係なく送信する。
- サーバーが challenge progress と evolution progress を一括管理する。クライアント側でゲーティングしない。
- **NG**: `if (!activeChallenge) return;` のようにチャレンジ状態で POST 送信を制御するコード。evolution progress が進まなくなる。

### 楽観的更新はチャレンジ未完了時のみ
- `optimisticIncrement` はアクティブかつ未完了のチャレンジがある場合のみ呼ぶ。
- 完了済みチャレンジや期限切れチャレンジでは楽観的 UI 更新不要（サーバーの GET で反映される）。

### Firestore カウンターの設計原則
- `useFirestoreCounter` を使う。localStorage を常時キャッシュとして併用し、リロード時も即座に前回値を表示する。
- `onSnapshot` は `Math.max(server, local)` で値を取り、楽観的更新を巻き戻さない。
- **NG**: `onSnapshot` で server の値をそのまま `setStats` する（楽観的更新が消える）。
- **NG**: 認証済みユーザーで localStorage キャッシュを使わない（リロード時に 0 にリセットされる）。
