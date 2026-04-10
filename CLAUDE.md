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
