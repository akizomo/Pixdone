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
- CSS では `--pxd-*` セマンティックトークン（`tokens.css` で定義）を使う。生の色コード (`#fff`, `rgba(...)`) やマジックナンバー (`12px`, `0.15s`) を直書きしない。
- 主なトークンプレフィックス:
  - 色: `--pxd-color-{role}-{variant}` (例: `--pxd-color-text-primary`, `--pxd-color-action-primary`)
  - スペース: `--pxd-space-{n}` / `--pxd-layout-{size}`
  - ボーダー: `--pxd-border-{weight}` (thin=1px, base=2px, strong=3px)
  - 角丸: `--pxd-radius-{size}` (none, xs, sm, md, lg, xl, full)
  - タイポ: `--pxd-font-body` / `--pxd-font-display`, `--pxd-font-size-{size}`, `--pxd-font-weight-{name}`
  - モーション: `--pxd-motion-{speed}`, `--pxd-easing-{name}`
  - シャドウ: `--pxd-shadow-{type}-{size}`

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
