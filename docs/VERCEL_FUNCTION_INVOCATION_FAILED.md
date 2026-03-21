# Vercel `FUNCTION_INVOCATION_FAILED` / billing API が 500 になる件（確定原因）

## 確定した原因

**Express 5** はルーティングに **path-to-regexp v8 系**を使います。この版では、従来 Express 4 で使えた **`'*'` 単体のルートパターンが無効**です。

`api/index.ts`（および `server/index.ts`）にあった次の行が、**モジュール読み込み時**（`registerRoutes` の途中で `app` にルートを積む段階）に **同期的に例外**を投げていました。

```ts
app.options('*', cors({ ... }), (_req, res) => res.sendStatus(204));
```

例外の内容（例）:

```text
TypeError: Missing parameter name at 1: https://git.new/pathToRegexpError
    at path-to-regexp ...
```

この時点で **ハンドラは一度も正しく起動できず**、Vercel では **`x-vercel-error: FUNCTION_INVOCATION_FAILED`**（本文が短い `text/plain`）として表れます。  
DB・Stripe・bcrypt とは**無関係**で、**ルート登録の構文エラー**が先に発生していました。

## 対処

- 上記の `app.options('*', ...)` を**削除**した（上位の `app.use` で既に `OPTIONS` を 204 返却しているため冗長でもあった）。
- Express 5 でワイルドカードが必要な場合は、[Express 5 / path-to-regexp の正しいパターン](https://expressjs.com/en/guide/migrating-5.html)に合わせる（例: 用途に応じて `/*` や名前付き `*` 構文）。このプロジェクトではミドルウェアで足りるため削除で解決。

## ローカルでの再現・確認コマンド

ビルド後、DB なしでも **以前は import 時点で落ちていた**のが分かります。

```bash
npm run build
node -e "import('./dist/api/index.js').then(() => console.log('OK')).catch(e => console.error(e))"
```

- **修正前**: `path-to-regexp` の `Missing parameter name` で **モジュール import 自体が失敗**。
- **修正後**: import は成功（`DATABASE_URL` が無ければ `registerRoutes` は catch され、フォールバックの JSON 用ミドルウェアが載った `app` が export される）。

## 参考

- [Express 5 移行ガイド](https://expressjs.com/en/guide/migrating-5.html)（ルーティング・path-to-regexp の変更）

---

## 念押し：他に同種の原因が残っていないか

**「他に絶対ない」と数学的に証明することはできません**が、次はリポジトリ全体で実施済みです。

### 1. 同じクラス（Express 5 + 無効なパス文字列）

| 検査 | 内容 |
|------|------|
| `app.*('*` / `` `*` `` | リポジトリ内の **実コード** に **`app.options('*'` 等は残っていない**（コメント内の言及のみ）。 |
| `.options(` | `server/routes.ts` の3件は **`/api/billing/...` の固定パス**のみ（`*` 不使用）。 |
| `Router` | `express.Router()` は未使用。ルートはすべて `app` に直接定義。 |

### 2. エントリモジュールの読み込み

`npm run build` 後、次が **例外なしで完了**することを確認済みです。

- `import('./dist/api/index.js')` → `default` が Express アプリ
- `import('./dist/api/link-preview.js')` → デフォルトハンドラ

（`DATABASE_URL` 未設定時は `registerRoutes` が catch され、フォールバックの 500 JSON 用ミドルウェア付き `app` が export される。）

### 3. 以前よく挙がっていたが、今回の「起動時同期クラッシュ」の主因ではなかったもの

| 仮説 | 状態 |
|------|------|
| ネイティブ `bcrypt` | **`bcryptjs` に置換済み**（Vercel でのロード失敗リスク低減）。 |
| `waitForResponseEnd` / 手書きラッパー | **`export default app` に変更済み**。 |
| `dist/api/billing/*.js` の残骸 | **`build` で `rm -rf dist && tsc`** により再発しにくい。 |

### 4. まだ起こりうる「別種」の問題（症状が違うことが多い）

これらは **ルート登録の path-to-regexp 例外とは別枠**です。

- **`DATABASE_URL` / `SESSION_SECRET` 未設定** → 初期化失敗時は `SERVER_INIT_FAILED` の JSON、またはログに DB エラー。
- **DB 接続不可・SSL** → ランタイム 500 / ヘルスチェック失敗。
- **未ログイン** → `/api/billing/entitlements` は **401**（`FUNCTION_INVOCATION_FAILED` ではないことが多い）。
- **Stripe の env 不足** → checkout は **500 JSON**（`Stripe is not configured` 等、ハンドラ内）。

### 5. 回帰防止

- **ローカル / 手元**: `npm run check:api-import`（`package.json` の scripts）
- **継続確認（CI）**: GitHub に push / PR 時に **`.github/workflows/api-import-check.yml`** が同じチェックを実行する
