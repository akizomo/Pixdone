# `SERVER_INIT_FAILED`（HTTP 500・JSON）について

## これは何か

レスポンス例:

```json
{
  "error": "SERVER_INIT_FAILED",
  "code": "DB_CONNECT",
  "message": "..."
}
```

`api/index.ts` で `await registerRoutes(app)` が**一度も成功していない**とき、フォールバックのミドルウェアだけが載った状態で `export default app` されます。  
このとき **請求 API も含めすべてのルートが未登録**のため、どのパスでも上記 JSON が返ります（以前は `message` だけの長文で **約 183 バイト**になりやすかった）。

## `code` の意味

| code | 意味 | 典型的な対処 |
|------|------|----------------|
| `ENV_CONFIG` | **Vercel/本番で必須の env が未設定**（DB に触る前に検出） | Production に **`DATABASE_URL`** と **`SESSION_SECRET`** を設定（`docs/DEPLOYMENT_CONTRACT.md`） |
| `DB_CONNECT` | 起動時の `SELECT 1` が失敗 | `DATABASE_URL` の誤り、Supabase の Pooler/直結、パスワードの `?` `&` のエンコード、ネットワーク |
| `AUTH_SETUP` | `setupAuth`（セッション・Passport）が失敗 | `SESSION_SECRET` はあるが `connect-pg-simple` が DB に繋がらない、`sessions` テーブルなし など |
| `UNKNOWN` | 上記以外 | Vercel の Function ログの `registerRoutes failed at startup` を確認 |

## Stripe との関係

`code` が付いた `SERVER_INIT_FAILED` のときは **Stripe 設定以前**に落ちています。  
`STRIPE_SECRET_KEY` を直しても、**DB / セッションが通るまで** checkout は動きません。

## 確認コマンド（デプロイ後）

- `GET /api/health` … DB だけを見る場合の目安（ルートが載っていれば JSON が返る。未起動時はフォールバック 500 のことも）。
