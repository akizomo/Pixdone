# 根本原因分析（5 Whys）— なぜ「その場その場の対応」に見えたか

このドキュメントは、Vercel 上の API 不調に対して行ってきた修正を **症状レベル**と **構造レベル**に分け、**再発を防ぐための「根本」** を 5 Whys で整理したものです。

---

## 1. 事象の整理（何が起きていたか）

| 時期 | 観測 | 直接原因（技術） |
|------|------|------------------|
| A | `FUNCTION_INVOCATION_FAILED`・短い `text/plain` | Express 5 の **`app.options('*')`** が path-to-regexp v8 で **同期例外** → モジュール評価失敗 |
| B | HTTP 500・`application/json`・**本文約 183B** | `registerRoutes` が **一度も成功せず**、`SERVER_INIT_FAILED` フォールバックのみ有効 |
| C | checkout 500 が続く | B の状態では **Stripe 以前**に落ちる（ルート未登録） |

→ **A と B は別の欠陥**であり、「一つの原因」ではなかった。そのため **対応が「場当たり」に見えやすい**。

---

## 2. 5 Whys — 事象 A（起動すらしない）

**Why 1** なぜ関数が落ちた？  
→ `path-to-regexp` がルート文字列 `'*'` をパースできず **例外**。

**Why 2** なぜ無効なパターンが入った？  
→ Express 4 の慣習（`app.options('*')`）を **Express 5 にそのまま持ち込んだ**。

**Why 3** なぜ Express 5 の破壊的変更に気づかなかった？  
→ **移行チェックリストがリポジトリに無く**、依存のメジャーアップとルーティング仕様の差分を **テストで捕捉していなかった**。

**Why 4** なぜテストで捕捉できなかった？  
→ 「本番に近い形で **`import(api/index)` まで通す」** チェックが **後から** 追加されるまで無かった。

**Why 5（根本に近い）**  
→ **デプロイ先（Vercel）とフレームワーク（Express 5）の契約**が、コード・CI・ドキュメントのどこにも **単一の真実（single source of truth）** として定義されていなかった。

**恒久策（構造）**

- Express 5 の **無効パターン**は `npm run check:api-import` + CI で検知（既存）。
- **マイグレーションガイド**を `docs/` に置き、ルーティング変更は必ず参照する。

---

## 3. 5 Whys — 事象 B（Express は動くが全部 500）

**Why 1** なぜすべての API が同じ 500 になった？  
→ `registerRoutes` が **失敗したときに**、`api/index.ts` が **フォールバックだけ**を載せ、**本物のルートを一切登録しない**設計だから。

**Why 2** なぜ `registerRoutes` が失敗しやすい？  
→ **DB 接続テスト**と **セッション（Postgres store）**が **起動の直列チェーン**にあり、どれか一つでも失敗すると **全体が未登録**になるから。

**Why 3** なぜ失敗の種類がログまで行かずにユーザーには分かりにくかった？  
→ 本番では **汎用メッセージ**のみ返し、**どの段階で落ちたか（DB / セッション / env）**が JSON に載らなかった（※後から `code` を追加）。

**Why 4** なぜ Vercel で DB／セッションが落ちやすい？  
→ アプリはもともと **Replit** 前提の変数・フローが残り、**Vercel に必要な `DATABASE_URL` / `SESSION_SECRET` / `sessions` テーブル**が **コード上の一箇所で「必須」として検証されていなかった**。

**Why 5（根本に近い）**  
→ **「本番に載せるために満たすべき条件」がコードとドキュメントに分散**し、**起動前検証（deployment contract）**が無かった。

**恒久策（構造）**

1. **環境の必須セットを起動直後に検証**する（`assertDeploymentEnv` — 本リポジトリに追加）。  
   → 欠落は **`ENV_CONFIG`** で明示。
2. **デプロイ契約書** `docs/DEPLOYMENT_CONTRACT.md`（このドキュメントとリンク）で **Vercel 用の必須変数・DB 前提**を固定する。
3. （中長期）「DB 無しで読めるヘルス」「課金だけ別関数」など、**障害の爆発半径を小さくする**設計を検討する。

---

## 4. 5 Whys — なぜ「重複 API ファイル」問題が出たか（副次）

**Why** なぜ `api/billing/*.ts` と `api/index` が二重だった？  
→ Vercel の **ファイルシステムルーティング**と **`vercel.json` の rewrite** の優先順位が **ドキュメント化されておらず**、追加のたびに **別関数**が生えた。

**根本に近い点**  
→ **API の単一エントリ**（`api/index` + rewrite）を **アーキテクチャ規約**として書いていなかった。

**恒久策**

- 請求・Webhook は **Express 内のルートのみ**（既に重複ファイルは削除済み）。  
- `docs/DEPLOYMENT_CONTRACT.md` に **「API は `api/index.ts` に集約」** と明記。

---

## 5. 「その場対応」に見えた理由のまとめ

| 見え方 | 実際の構造 |
|--------|------------|
| 都度パッチ | 実際には **別々の欠陥**（ルーティング・起動直列・環境・重複関数）に順に当たっていた |
| 原因がはっきりしない | **単一のログに「フェーズ」が無かった** + **必須 env の一括検証が無かった** |
| Stripe を直しても直らない | **B の状態では Stripe コードに到達しない** — レイヤーが違う |

---

## 6. 今後の「根本対応」チェックリスト

- [ ] `docs/DEPLOYMENT_CONTRACT.md` を読み、Vercel Production に必須の変数を入れた  
- [ ] Supabase に `sessions` 等のスキーマがある（`docs/SUPABASE_DB_SETUP.md`）  
- [ ] デプロイ後 `GET /api/health` が **フォールバック JSON ではない**ことを確認  
- [ ] CI の `check:api-import` が緑（Express 5 ルート破壊の再発防止）  

---

## 7. 関連ドキュメント

- `docs/VERCEL_FUNCTION_INVOCATION_FAILED.md` — path-to-regexp / import チェック  
- `docs/VERCEL_SERVER_INIT_FAILED.md` — `SERVER_INIT_FAILED` の意味  
- `docs/DEPLOYMENT_CONTRACT.md` — **必須環境変数と前提（追加）**  
