# Arcade Theme — Stage 1 実装仕様

> **スコープ**: Phase 2 World Growth System の最初のマイルストーン。
> Arcade テーマの Stage 1（ゼロ状態）を実装し、成長システム全体の基盤を作る。

---

## 1. 概要

### ゴール

タスクリスト下部に「部屋の背景」が常駐し、
ユーザーが Arcade テーマを使うと最初からゲーミング部屋（空の状態）が見える。
キャラクター Bit が neutral ポーズで立っている。

### Stage 定義

| Stage | 条件（累計完了タスク数） | 部屋の状態 |
|-------|----------------------|-----------|
| 1 | 0〜49 | 空の部屋 + Bit 立つ |
| 2 | 50〜199 | 筐体1台 + Bit 指差し |
| 3 | 200〜499 | 筐体2台 + ポスター + Bit 歩く |
| 4 | 500〜999 | RGBライト + コレクション棚 + Bit 座る |
| 5 | 1000〜 | 完成部屋 + ネオンサイン + Bit くつろぐ |

**今回の実装: Stage 1 のみ**

---

## 2. アーキテクチャ

### 2-1. レイヤー構造

```
z-index 0  : WorldLayer (canvas) ← 今回追加
z-index 1  : .pd-app-container (既存コンテンツ)
z-index 200: BottomNav (既存)
z-index 300: モーダル類 (既存)
```

WorldLayer は `position: fixed` でビューポート全体に広がり、
タスクリストの**後ろ（背景）**に描画される。

タスクリストは半透明でも不透明でも OK（既存の `--pd-color-surface-page` が背景色）。
WorldLayer はタスクリストが画面いっぱいでないとき（特にモバイルの下部余白）に見える。

### 2-2. 描画手法: Canvas

```
既存の animations.js / freeze-effect.js がすでに Canvas ベース
→ 同じ方針を採用
```

**採用理由:**
- ピクセルアート描画に最適（`imageRendering: pixelated` + `ctx.imageSmoothingEnabled = false`）
- React が canvas のライフサイクルを管理 (`useRef` + `useEffect`)
- 描画ロジックは `public/world/arcade-world.js` に分離（vanilla JS）

### 2-3. 新規ファイル構成

```
app/src/
└── components/
    └── WorldLayer.tsx          ← React コンポーネント（canvas マウント管理）

public/
└── world/
    ├── world-engine.js         ← テーマ共通エンジン（canvas セットアップ、リサイズ）
    └── arcade/
        └── arcade-world.js     ← Arcade テーマ専用描画ロジック
```

---

## 3. WorldLayer コンポーネント仕様

### Props

```typescript
interface WorldLayerProps {
  themeKey: ThemeKey;           // 'arcade' | 'synthwave' | 'forestbit'
  completedCount: number;       // 累計完了タスク数（stage 計算に使う）
}
```

### DOM 配置

`App.tsx` の `<div className="pd-app-container">` の**最初の子**として挿入。
（z-index で後ろに回るため、DOM 順は関係ないが可読性のため先頭に）

```tsx
// App.tsx の変更箇所
<div className="pd-app-container">
  <WorldLayer themeKey={visualTheme} completedCount={totalCompleted} />
  {/* 既存コンテンツ */}
  <header>...</header>
  <main>...</main>
  <BottomNav />
</div>
```

### Canvas スタイル

```css
.pd-world-canvas {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;      /* pd-app-container の max-width に合わせる */
  height: 120px;         /* 固定高さ — タスクリストのおまけ要素なので控えめに */
  z-index: 0;
  pointer-events: none;  /* タスク操作を妨げない */
  image-rendering: pixelated;
}
```

> **なぜ固定 px か**: ピクセルアートの拡大倍率を画面サイズに左右されず安定させるため。
> vh だとスマホ縦画面 vs 横画面で大きさが変わりすぎる。
> BottomNav（56px）の上に 120px 分の空間で、合計 176px が画面下部の「世界エリア」。

---

## 4. arcade-world.js 描画仕様（Stage 1）

### カラーパレット

CSS 変数から読み取る（ハードコード禁止）:

```javascript
const style = getComputedStyle(document.documentElement);
const colors = {
  wall:     style.getPropertyValue('--pd-arcade-world-wall').trim(),
  floor:    style.getPropertyValue('--pd-arcade-world-floor').trim(),
  trim:     style.getPropertyValue('--pd-arcade-world-trim').trim(),
  bitBody:  style.getPropertyValue('--pd-arcade-world-bit-body').trim(),
  bitEye:   style.getPropertyValue('--pd-arcade-world-bit-eye').trim(),
};
```

### arcade.theme.ts への追加

```typescript
// arcade.theme.ts の cssVariables に追加
light: {
  // ... 既存のパーティクル色
  '--pd-arcade-world-wall':     '#c8b99a',
  '--pd-arcade-world-floor':    '#a07850',
  '--pd-arcade-world-trim':     '#7a5c38',
  '--pd-arcade-world-bit-body': '#4ecdc4',
  '--pd-arcade-world-bit-eye':  '#2c2c2c',
},
dark: {
  // ... 既存のパーティクル色
  '--pd-arcade-world-wall':     '#2a1f1a',
  '--pd-arcade-world-floor':    '#1a1208',
  '--pd-arcade-world-trim':     '#4a3a2a',
  '--pd-arcade-world-bit-body': '#4ecdc4',
  '--pd-arcade-world-bit-eye':  '#e8e8e8',
},
```

### Stage 1 レイアウト仕様（2D フラット、canvas height = 120px）

```
canvas 座標系: (0,0) = 左上、(W,120) = 右下

[壁]       y=0  〜 y=48   (上 48px = 40%)
[幅木]     y=48 〜 y=56   (8px のトリムライン)
[床]       y=56 〜 y=120  (下 64px = 53%)

[Bit キャラクター]
  位置: x=W/2 (中央), 足元 y=56 (床面にぴったり立つ)
  サイズ: 16×16 論理px → 3倍拡大 = 48×48 物理px
  ポーズ: neutral (まっすぐ立つ、両手下げ)

[フロアライン]
  y=56 に 2px の水平線（--pd-arcade-world-trim 色）
```

> Bit は 48px の高さになるので、壁（48px）からほぼ頭がはみ出す位置に立つ。
> 画面に対してちょうど「ちら見え」サイズ感になる。

### Bit キャラクター描画（Stage 1 Neutral ポーズ）

```
16×16 グリッド（1論理px = canvas上では 4〜6 物理px）

   ........
  .BBBBBB.   頭部 (B=body color)
  .B.EE.B.   顔（E=eye）
  .BBBBBB.
   .BBBB.    首
  BBBBBBBB   胴体
  BB.BB.BB   腰
   BB  BB    脚
   B    B    足
```

---

## 5. 累計完了タスク数の取得

### データソース

Firestore の既存タスクデータから派生させる（新しいフィールド不要）。

```typescript
// useLists.ts から totalCompleted を計算
// 既存の completedTasks 配列を活用

// 短期的実装: セッション内のカウントを localStorage に累積
// 長期的実装: Firestore の user ドキュメントに worldProgress を追加

interface WorldProgress {
  completedTotal: number;   // 全テーマ共通の累計値
  arcade: { stage: number };
  synthwave: { stage: number };
  forestbit: { stage: number };
}
```

**Stage 1 時点のスコープ: localStorage で完結**
- Firestore 変更なし
- `localStorage.getItem('pixdone-world-completed')` に数値を保存
- `completeTask` 呼び出し時に +1 インクリメント

---

## 6. App.tsx への統合

### 変更点（最小限）

```typescript
// 1. import 追加
import { WorldLayer } from './components/WorldLayer';

// 2. totalCompleted を計算（useLists から）
const totalCompleted = useMemo(() => {
  try {
    return parseInt(localStorage.getItem('pixdone-world-completed') ?? '0', 10);
  } catch { return 0; }
}, [/* completeTask が呼ばれるたびに再計算 */]);

// 3. WorldLayer をレンダー
<div className="pd-app-container">
  <WorldLayer themeKey={visualTheme} completedCount={totalCompleted} />
  ...
```

### completeTask 時のインクリメント

```typescript
// handleComplete 関数内（既存）
const handleComplete = useCallback(async (taskId: string) => {
  // ... 既存の処理
  // + 追加
  try {
    const prev = parseInt(localStorage.getItem('pixdone-world-completed') ?? '0', 10);
    localStorage.setItem('pixdone-world-completed', String(prev + 1));
  } catch {}
}, [...]);
```

---

## 7. 実装順序

```
Step 1: arcade.theme.ts に CSS 変数追加
Step 2: public/world/arcade-world.js 作成（Stage 1 描画のみ）
Step 3: app/src/components/WorldLayer.tsx 作成
Step 4: App.tsx に WorldLayer 統合 + completeTask カウンター
Step 5: 動作確認（light/dark モード両方、モバイル/デスクトップ両方）
```

---

## 8. 未解決事項（今回スコープ外）

- Stage 2〜5 の描画ロジック
- Stage アップ時のアニメーション（ドアが開く、家具が出現するなど）
- Firestore への永続化（localStorage では他デバイスと同期しない）
- Synthwave / Forest テーマへの同じ仕組みの適用
- キャラクターのアイドルアニメーション（ループ）
