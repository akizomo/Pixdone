# デプロイ契約（Deployment Contract）

このアプリを **Vercel（本番）** で動かすために、リポジトリが **前提とする条件**をここに固定する。  
「その場のトラブルシュート」ではなく、**満たすべき契約**として扱う。

**なぜこのファイルが必要か** → `docs/ROOT_CAUSE_5WHY.md`（5 Whys で「場当たりに見えた理由」と恒久策を整理）

---

## アーキテクチャ上の前提

| 項目 | 契約 |
|------|------|
| API エントリ | **`api/index.ts`** が唯一のメイン API（`vercel.json` が `/api/*` をここへ寄せる）。請求・Webhook 用に **`api/billing/**/*.ts` を増やさない**（別 Serverless が生え二重初期化する）。 |
| フレームワーク | **Express 5** — `path-to-regexp` v8。**`*` 単体のルートパターンは使わない**（`docs/VERCEL_FUNCTION_INVOCATION_FAILED.md`）。 |
| データベース | **PostgreSQL**（例: Supabase）。Drizzle + `pg`。 |
| セッション | **express-session + connect-pg-simple** — DB に **`sessions` テーブル**が必要。 |

---

## Vercel Production で必須の環境変数

| 変数 | 理由 |
|------|------|
| **`DATABASE_URL`** | Drizzle・`connect-pg-simple` の双方で使用。 |
| **`SESSION_SECRET`** | 署名付きクッキー。未設定だと `setupAuth` が失敗。 |

起動時に **`assertDeploymentEnv`**（`server/validateDeploymentEnv.ts`）により、`VERCEL=1` または `NODE_ENV=production` のとき **欠落があれば `ENV_CONFIG` で即失敗**する。

---

## 課金（Synthwave）を使う場合に追加で必要

| 変数 | 理由 |
|------|------|
| `STRIPE_SECRET_KEY` | Checkout セッション作成 |
| `STRIPE_PRICE_SYNTHWAVE_ONETIME` | 価格 ID |
| `STRIPE_WEBHOOK_SECRET` | Webhook 署名検証（エンドポイント設定と一致させる） |

未設定時は **checkout が 500** になるが、これは **起動成功後**のハンドラ内のチェック（`SERVER_INIT_FAILED` とは別）。

---

## 検証手順（デプロイ後）

1. **`GET /api/health`** — DB 接続込みで `status: healthy` になること（起動時は DB を必須にしないため、**ここで初めて接続エラーを確認**できる）。  
2. **`GET /api/billing/entitlements`**（ログイン後）— 401 は未ログイン、500 は別要因をログで確認。  

**Supabase**: `DATABASE_URL` のホストが `*.supabase.co` / `*.supabase.com` のとき、アプリ側で **`sslmode=require` を未設定なら自動付与**する（接続文字列に追加）。

---

## ローカル開発

`NODE_ENV` が production でなく、`VERCEL` も無い場合、**必須 env の強制チェックはスキップ**する（`.env` で段階的に試せるようにする）。  
本番同等の検証が必要なら `NODE_ENV=production` で起動する。
