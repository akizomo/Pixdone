# Supabase が空のとき（テーブル作成）

PixDone の API は **PostgreSQL** に `users` / `tasks` / `task_lists` / `sessions` などのテーブルが必要です。新しい Supabase プロジェクトは空なので、**ローカルから一度だけスキーマを流し込み**ます。

## 1. 接続文字列（ローカル用）

**マイグレーション / `push` は「直結」（Direct）の URL が確実**です。

- Supabase → **Project Settings → Database**
- **Connection string** の **URI** で、**ポート 5432**（Direct）のものをコピー  
  （Pooler 6543 は DDL で失敗することがある）

リポジトリ直下に `.env` を置き（Git にコミットしない）:

```env
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-....pooler.supabase.com:5432/postgres?sslmode=require
```

`dotenv` は `drizzle-kit` が自動で読まない場合があるので、**ターミナルで export してから実行**してもよいです。

```bash
export DATABASE_URL='postgresql://...'
```

## 2. スキーマを DB に反映（推奨: push）

```bash
cd /path/to/Bitdone
npm install
npm run db:push
```

`shared/schema.ts` の内容が Supabase にそのままテーブルとして作成されます。

## 3. Vercel

本番では引き続き **Pooler（6543）** の `DATABASE_URL` を Vercel の環境変数に入れて問題ありません（アプリのクエリ用）。

## 4. 確認

Supabase → **Table Editor** に `users`, `tasks`, `task_lists`, `sessions` が出ていれば OK です。
