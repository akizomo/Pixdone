# Firebase（フロント）と API セッション（Passport）

## 迷ったらこれだけ（最短）

1. **Firebase Console** → プロジェクト設定 → **サービス アカウント** → **新しい秘密鍵の生成**（JSON がダウンロードされる）。
2. **Cursor で Bitdone を開いたまま**、**ターミナル**を開く（画面上部メニュー **ターミナル → 新しいターミナル** など）。
3. ターミナルで **`package.json` があるフォルダ**にいるか確認する。いちばん簡単なのは、左のファイル一覧に **`package.json`** が見えていれば OK。迷ったらターミナルに次を打つ:

```bash
cd /Users/あなた/Documents/GitHub/Bitdone
```

（`あなた` の部分は自分の Mac のユーザー名。Finder で **Bitdone** フォルダを開いて、フォルダをターミナルにドラッグするとパスが自動で入ることもある。）

4. 続けて、**ダウンロードした JSON** のパスを付けて実行する（**最後の `.json` は自分のファイル名に合わせる**）:

```bash
npm run vercel:firebase-env -- ~/Downloads/プロジェクト名-firebase-adminsdk-xxxxx.json
```

**長すぎてどこをコピーすればいいかわからない（Mac）**  
手で範囲指定しないでよい。**`--copy`** を付けると、Vercel の **Value にそのまま貼る文字列がクリップボードに入る**。

```bash
npm run vercel:firebase-env -- ~/Downloads/プロジェクト名-firebase-adminsdk-xxxxx.json --copy
```

Vercel では **Name（Key）** に `FIREBASE_SERVICE_ACCOUNT_JSON` とだけ入れ、**Value** の欄で **Cmd+V**。

Base64 版をクリップボードに入れるときは **`--copy-b64`**（Name は `FIREBASE_SERVICE_ACCOUNT_BASE64`）。

**手でコピーする場合の範囲（A）**: 画面に出ている **`--- A（おすすめ）---` のすぐ次の行から、その次の空行の手前まで** が **たった1行**。先頭は `{`、末尾は `}`。前後に `"` を付けない。

**コツ（Mac）**: Finder で JSON ファイルをターミナルにドラッグ＆ドロップすると、パスがそのまま入る。

5. ターミナルに出た **A か B の「値」** をコピー（`--copy` なら手順5は不要で Cmd+V のみ）。
6. **Vercel** → プロジェクト → **Settings** → **Environment Variables** → 表示どおり **名前** と **値** を入れる → **Save** → **Redeploy**。

※ 「ルート」＝ **`package.json` と並んでいるフォルダ（この Bitdone フォルダ）** のこと。特別な用語じゃない。

※ 私（AI）はあなたの Vercel にログインできないので、「貼る文字列を作る」と「手順を短くする」まではここで代行できる。

### `Invalid or expired Firebase token`（401）のとき

`POST /api/auth/firebase-session` が **401** とこのメッセージになるのは、**Firebase Admin が ID トークンを検証できなかった**ときです。

1. **プロジェクトの食い違い（いちばん多い）**  
   Vercel の `FIREBASE_SERVICE_ACCOUNT_JSON`（または Base64）の JSON 内の **`project_id`** が、アプリの Firebase 設定（`app/src/lib/firebase.ts` の **`projectId`**）と **同じ**か確認する。違うプロジェクトの鍵だと必ず 401 になる。

2. **値が壊れている**  
   Vercel の値が途中で切れている、引用符が余計、改行が入っていると検証に失敗する。`npm run vercel:firebase-env -- <json>` の出力を **そのまま**貼り直す。

3. **再ログイン**  
   一度ログアウトしてからログインし直し、もう一度試す。

4. **Vercel のログ**  
   サーバー側では `verifyIdToken failed:` のあとに Firebase のエラーコード（例: `auth/argument-error`）が出ることがある。原因の手がかりになる。

5. **プロジェクトは同じなのに 401**  
   - **Firebase で鍵を削除したのに、Vercel の JSON が古い** → `auth/invalid-id-token` になりやすい。新しい秘密鍵を生成し、`npm run vercel:firebase-env` の **A または B を貼り直し**、Redeploy。  
   - **Vercel の Value に「全体を `"` で囲んだ」** → 503 やパース失敗になりやすい。囲まない。  
   - **JSON 用の名前に Base64 を入れた／逆** → 貼り直す。  
   レスポンスに **`firebaseCode`** が付く（例: `auth/id-token-expired`）ので、Network タブのレスポンス本文で確認できる。

---

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

## Vercel に必要な環境変数（どちらか1つ）

### 方法 A: `FIREBASE_SERVICE_ACCOUNT_JSON`（推奨）

1. **Firebase Console** → 対象プロジェクト → **⚙ プロジェクトの設定** → **サービス アカウント**。
2. **新しい秘密鍵の生成** → JSON をダウンロード（例: `my-project-xxxxx.json`）。
3. **1行にする**（Vercel の値に改行を入れないため）:
   - macOS / Linux: `jq -c . my-project-xxxxx.json` の出力をコピーする。
4. **Vercel** → 対象プロジェクト → **Settings** → **Environment Variables** → **Add**:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value**: 手順3の **1行 JSON**（先頭 `{`、末尾 `}`。**全体を二重引用符で囲まない**）。
   - **Environment**: Production（Preview も使うなら Preview にも同じ値を追加）。
5. **Redeploy**（環境変数はデプロイ後にサーバーに反映される）。

### 方法 B: `FIREBASE_SERVICE_ACCOUNT_BASE64`（貼り付けで壊れるとき）

JSON をそのまま貼ると引用符や改行で壊れる場合は、Base64 にして1行で登録する。

```bash
# macOS（GNU base64 なら -w0 が使える）
base64 < my-project-xxxxx.json | tr -d '\n'
```

- **Name**: `FIREBASE_SERVICE_ACCOUNT_BASE64`
- **Value**: 上記コマンドの出力（1行）
- `FIREBASE_SERVICE_ACCOUNT_JSON` は未設定でよい（**どちらか一方**で動く）。

### 注意

- 値の先頭は `{`（JSON）または Base64 の英数字（Base64）。（**値全体を `"..."` で囲まない**）
- 未設定・パース失敗の場合、`POST /api/auth/firebase-session` は **503** と説明メッセージを返す。

## 確認手順（運用チェックリスト）

1. **Vercel** → Project → Settings → Environment Variables → Production に **`FIREBASE_SERVICE_ACCOUNT_JSON`**（1行 JSON）または **`FIREBASE_SERVICE_ACCOUNT_BASE64`** のどちらかがある。
2. 本番 URL でログインする。
3. DevTools → **Network** → フィルタ `firebase-session` → **`POST /api/auth/firebase-session` が 200** か確認（503 なら env 未設定または JSON 壊れ）。
4. DevTools → **Application** → **Cookies** → 自サイトに **`connect.sid`** があるか。
5. 続けて Synthwave の Unlock → **`create-checkout-session` が 401 ではない**こと（Stripe 未設定なら 500 とメッセージの可能性はあるが、**401 だけは避けたい**）。

## 確認手順（簡易）

1. 本番でログインする  
2. DevTools → Application → Cookies → 自サイトに **`connect.sid`** が付いているか  
3. `POST /api/billing/synthwave/create-checkout-session` が **401 ではなく** 200 または Stripe 設定に応じた応答になるか  
