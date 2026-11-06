# Bitdone / PixDone — Claude Code Context

## Product Requirements

The full Business Requirements Document is at [`docs/BRD.md`](docs/BRD.md).

Read it before making decisions about features, monetization, UX, or architecture.

Key points to keep in mind:

- Core loop: **Write → Smash → Reward**
- Free tier: Smash List (unlimited), up to 3 Lists, Common effects, default theme only
- PixDone+: unlimited Lists, Rare/Epic effects, all preset themes — ¥300/month or ¥3,000/year (same on web / App Store / Google Play)
- Common effects use CSS variables for theming — **never hardcode colors inside effect logic**
- Rare/Epic effects are theme-specific and must be conditionally loaded
- Theme Progression System is **Phase 2** (not yet implemented)
- AI Theme Generation is **Phase 3** (not yet implemented)
- The product intentionally avoids: project management, analytics, calendars, team features

## Stack

| Layer          | Technology |
|----------------|------------|
| Frontend       | React + TypeScript (Vite, in `app/`) |
| Native apps    | Capacitor 8 (iOS / Android) |
| Analytics      | Firebase Analytics (GA4) via `app/src/services/analytics.ts` |
| Backend        | Node.js + Express (TypeScript) |
| Database       | Firebase Firestore |
| Auth           | Firebase Auth |
| Payments       | Stripe (web), App Store / Google Play via RevenueCat (apps) |
| Deployment     | Vercel |

## Project Structure

- `app/` — frontend (Vite, React + TypeScript)
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

### Safe area（ネイティブアプリは edge-to-edge）
- ネイティブアプリは `contentInset: 'never'`（edge-to-edge）なので、ステータスバー・ホームインジケーターの回避は Web 側の責任。ブラウザでは常に 0 なので**実機まで気づけない**。
- **全画面レイヤー（`position: fixed; inset: 0` で #root の外に出るもの）は DS の `FullScreenSurface` を使う**。中の絶対配置（閉じるボタン等）は safe area の内側基準になる。
- 余白は `--pd-layout-safe-{top,right,bottom,left}` トークンで書く。`env(safe-area-inset-*)` の直書きは禁止（`tokens.css` のみ。`safeArea.test.ts` が検出する）。
- 見た目の確認は Storybook ツールバーの **Safe Area → iPhone** で行う。

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

## Notion 連携ワークフロー (mandatory)

PixDone は Notion（PM・戦略側）と、このリポジトリ（実装側）で分業している。実装の結果は必ず Notion に戻し、PM が次の判断をできる状態にする。

### 情報の正本

| 情報 | 正本 | 備考 |
|------|------|------|
| 戦略・KGI/KPI・イニシアチブ | Notion: [Goals](https://www.notion.so/33d54fb2357581ee9887d4e64ec75df3) / [Product Initiatives](https://www.notion.so/33d54fb23575815d81d0c8279aaeea5a) | 読むだけ。編集しない |
| 機能ごとの仕様書 | Notion: [Feature Ideas DB](https://www.notion.so/febbc2a1ae3b46d9abaf826481024739) の各ページ | 実装の判断はここに従う |
| PM のタスク | Notion: [Agent Tasks](https://www.notion.so/134a70b380c0426bbb43bc3de364ab2a) | |
| 実装済みの仕様・プロダクト要件 | このリポジトリ: `docs/BRD.md` / `docs/IMPLEMENTED_FEATURES.md` | コードと一緒に更新する |
| 利用データ | GA4 → Notion「📈 Weekly KPI Log」（毎週月曜に自動作成） | |

### 作業を始めるとき
1. 指示に Notion の仕様書 URL や Feature 名があれば、Notion で仕様書を読んでから着手する。
2. 仕様と現状のコードが食い違っている、または仕様のままでは実装できない場合は、**実装前に**ユーザーに報告する。
3. Feature Ideas DB の該当ページの Status を `In Dev` にする。
4. **新機能・課金・計測の変更は、仕様書なしに着手しない。** 仕様書がなければ、PM 側で作るようユーザーに伝える。バグ修正・小さな UI 調整・リファクタは仕様書不要。

### 作業が終わったとき
1. Feature Ideas DB の該当ページ
   - Status を `Done` にする（未 push・未確認の項目が残る場合は `In Dev` のままにし、残りを書く）
   - ページ末尾に「## 実装メモ（YYYY-MM-DD）」を追記する: 変更の要約 / 主なファイル / ユーザーが確認する手順 / **仕様から変えた点とその理由** / 追加・変更した計測イベント
2. Agent Tasks に対応するタスクがあれば、Status を `完了` にし、Output に要約を書く。
3. 価格・無料と有料の範囲・機能の有無が変わった場合は、`docs/BRD.md` と `docs/IMPLEMENTED_FEATURES.md` を更新し、「Notion の BRD / Goals も更新が必要」とユーザーに伝える（Notion 側の更新は PM が行う）。

### Notion で編集してよい範囲
- 編集してよい: Feature Ideas DB の Status と各ページへの追記、Agent Tasks の Status / Output
- 編集しない: Goals、Product Initiatives、Notion の BRD、各エージェントのホームページ、Weekly KPI Log、Monthly Metrics
- ページの削除・アーカイブはしない

### Notion に接続できない場合
作業の最後に「Notion 更新用メモ」として、上の「作業が終わったとき」の内容をそのまま貼れる形で出力する。

## Analytics Rules (mandatory)

計測は PM の判断材料であり、毎週の KPI レビューが GA4 のイベントを読んでいる。イベントが壊れると判断を誤るため、以下を守る。

- イベントは `app/src/services/analytics.ts` の型付き関数からのみ送る。`firebase/analytics` の `logEvent` をほかの場所から直接呼ばない。
- イベントを追加・変更・削除したら、`analytics.ts` 冒頭のイベント一覧コメントを更新し、Notion の実装メモにも書く。
- イベント名は snake_case。GA4 の推奨イベント（`sign_up`, `login` など）があればそれを使う。
- **個人情報やユーザーが書いた内容をパラメータに入れない**（メールアドレス、タスク本文、リスト名など）。件数や種類（enum）にとどめる。
- コアループ（Write → Smash → Reward）の計測は通常リストのタスクを指す。Smash List は `list_type: 'smash'` で区別し、コアループの指標に混ぜない。
- `/pricing` へ遷移するときは、必ず `?source=` を付ける（値は `analytics.ts` のユニオン型で管理）。
- 内部ユーザー（開発者のアカウント）のイベントには `traffic_type: 'internal'` を付ける。この仕組みを外さない。
- 計測の失敗がアプリの動作に影響しないようにする（`track()` の try/catch を維持）。
