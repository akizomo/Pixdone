# Vercel への API デプロイ（`/api/*`）

Vercel の Serverless 関数（[`api/index.ts`](../api/index.ts)）は起動時に [`server/routes.ts`](../server/routes.ts) を読み込みます。次の条件を満たさないと **`500` / `FUNCTION_INVOCATION_FAILED`** になります。

## 必須の環境変数

| 変数 | 用途 |
|------|------|
| **`DATABASE_URL`** | Drizzle（Postgres）接続。起動時に `SELECT 1` で検証されます。 |
| **`SESSION_SECRET`** | `express-session` の署名。未設定だと [`server/replitAuth.ts`](../server/replitAuth.ts) の `getSession()` が **起動時に例外** を投げます。 |

## データベース

- **`sessions` テーブル**が存在すること（`connect-pg-simple` 用。`createTableIfMissing: false` のため、未作成だとセッション保存時に失敗し得ます）。
- **`users` テーブル**に `synthwave_premium` カラムがあること（[`shared/schema.ts`](../shared/schema.ts)）。未適用の場合、`/api/billing/entitlements` の `getUser` が SQL エラーになり **500 JSON** になります（起動成功後）。

  ```sql
  ALTER TABLE users ADD COLUMN IF NOT EXISTS synthwave_premium BOOLEAN DEFAULT FALSE;
  ```

## 任意（機能ごと）

- **Replit OIDC**: `REPLIT_DOMAINS`, `REPL_ID`, `ISSUER_URL` など（未設定でも OIDC だけスキップされ、メール/Google 認証は動く想定）。
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SYNTHWAVE_ONETIME` など。

## 確認手順

1. Vercel ダッシュボード → Project → Settings → Environment Variables で上記を設定し、**再デプロイ**。
2. `GET /api/health` が `200` と `database: connected` を返すか確認。
3. ブラウザで `/api/billing/entitlements` は **ログイン済みセッション Cookie** が必要です。未ログインなら **401 JSON** が正常です。

## `/api/billing/entitlements` が 500 になるとき

- **起動前に落ちている**（`text/plain` や `SERVER_INIT_FAILED`）→ **`DATABASE_URL` / `SESSION_SECRET` / DB 到達性** を確認。
- **起動後に 500 JSON**（`Failed to fetch entitlements`）→ DB の **`users` スキーマ**（特に `synthwave_premium`）や接続エラーをサーバーログで確認。
