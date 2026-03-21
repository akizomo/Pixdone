# Firebase（フロント）と API セッション（Passport）

## なぜ 401 になっていたか

- **ログイン UI** は **Firebase Authentication**（`AuthContext`）。
- **`/api/billing/*` など** は **Passport + express-session**（Cookie `connect.sid`）。

Firebase でログインしても、**サーバーにセッション Cookie が無ければ** `isAuthenticated` が常に失敗し **401 Unauthorized** になる。これは DB や Stripe 以前の **認証レイヤーの不一致**だった。

## 対応内容

1. **`POST /api/auth/firebase-session`**  
   ボディ `{ "idToken": "<Firebase ID トークン>" }` を送ると、サーバーがトークンを検証し、Postgres の `users` を upsert して **Passport で `req.login`** する。

2. **フロント**（`AuthContext`）  
   - メールログイン成功直後に同期  
   - `onAuthStateChanged` でユーザがいるときも同期（リロード後も Cookie を張り直す）

## Vercel に必要な環境変数

**`FIREBASE_SERVICE_ACCOUNT_JSON`**

Firebase Console → プロジェクトの設定 → **サービス アカウント** → **新しい秘密鍵の生成** で JSON をダウンロードし、**中身を1行の JSON 文字列として** Vercel の Environment Variables に貼る（Production / Preview どちらにデプロイするかに合わせる）。

- 値の先頭は `{` で始まり、`}` で終わる（**前後に余計な引用符を付けない**）。
- 改行を含めない（1行にするか、Vercel の「複数行」対応に合わせる）。

未設定の場合、`POST /api/auth/firebase-session` は **503** と説明メッセージを返す。

## 確認手順

1. 本番でログインする  
2. DevTools → Application → Cookies → 自サイトに **`connect.sid`** が付いているか  
3. `POST /api/billing/synthwave/create-checkout-session` が **401 ではなく** 200 または Stripe 設定に応じた応答になるか  
