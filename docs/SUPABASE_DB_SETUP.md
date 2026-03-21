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

サーバー側の DB 接続は **`pg`（node-postgres）+ Drizzle** です。`VERCEL=1` のとき、または Supabase / Neon ホスト、`sslmode=require` などのとき **TLS** を有効にします（`DATABASE_SSL=0` でオフ、`DATABASE_SSL=1` で強制）。

セッションストア（`connect-pg-simple`）も **同じプール設定**（`buildPgPoolConfig`）を使うため、Drizzle だけ繋がってセッションだけ失敗、という差を減らしています。

接続がタイムアウトする場合は Vercel の環境変数に **`PG_USE_IPV4=1`** を試してください（IPv6 経路の問題の回避用）。

**必須**: `SESSION_SECRET`（ランダム文字列）と `DATABASE_URL` が無いと `registerRoutes` 時点で失敗し、API が 500 になります。

**Vercel**: パスワードハッシュはネイティブアドオン付きの `bcrypt` ではなく、純 JS の **`bcryptjs`** を使っています（`FUNCTION_INVOCATION_FAILED` の原因になりやすいため）。既存の bcrypt ハッシュとも互換です。

## 4. 確認

Supabase → **Table Editor** に `users`, `tasks`, `task_lists`, `sessions` が出ていれば OK です。

---

## トラブル: `ECONNREFUSED 127.0.0.1:5432`

**パスワードに `?` `&` `#` `@` などが含まれる**と、接続文字列の解釈が壊れ、**ローカル Postgres（127.0.0.1）** に繋ぎに行きます。

### 対処

パスワード部分だけ **URL エンコード**してから URI に埋め込む（例）:

| 文字 | エンコード後 |
|------|----------------|
| `?` | `%3F` |
| `&` | `%26` |
| `@` | `%40` |
| `,` | `%2C` |

ターミナルで一発エンコードする例（Node）:

```bash
node -e "console.log(encodeURIComponent('あなたの生パスワード'))"
```

出てきた文字列を、`postgresql://postgres.xxx:` の **直後**〜**`@` の直前**に入れる。

### `export` は必ず1行

悪い例（改行で URL が切れる）:

```bash
export DATABASE_URL='postgresql://...
'
```

良い例:

```bash
export DATABASE_URL='postgresql://postgres.xxx:エンコード済みパスワード@aws-....pooler.supabase.com:5432/postgres?sslmode=require'
```

末尾に `?sslmode=require` を付けると Supabase で繋がりやすいです。
