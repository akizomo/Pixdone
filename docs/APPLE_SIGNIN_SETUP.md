# Apple でログイン — Web / Android 向け設定

iOS アプリはネイティブの Sign in with Apple を使うので、この設定なしで動く。
**Web と Android** は Firebase の Apple Web フローを使うため、以下を一度だけ設定する。
設定が済むまで、Web/Android の「Appleで続ける」は `auth/operation-not-allowed` などのエラーになる（画面には「この方法では現在ログインできません」と表示される）。

## 1. Apple Developer

1. **Identifiers → App IDs** で `com.pixdone.app` の「Sign in with Apple」が有効になっていることを確認する（iOS 用にすでに有効のはず）。
2. **Identifiers → Services IDs** で新規作成する。
   - Identifier の例: `com.pixdone.app.signin`（App ID と別の文字列にすること）
   - 「Sign in with Apple」にチェックを入れて **Configure** を開く
     - Primary App ID: `com.pixdone.app`
     - Domains: `red-girder-465715-n6.firebaseapp.com`
     - Return URLs: `https://red-girder-465715-n6.firebaseapp.com/__/auth/handler`
3. **Keys** で「Sign in with Apple」を有効にしたキーを作り、`.p8` をダウンロードする。Key ID と Team ID を控える。
   （`.p8` はリポジトリに入れないこと）

## 2. Firebase コンソール

Authentication → Sign-in method → **Apple** を開く:

- Services ID: 手順 1-2 で作った ID
- Apple チーム ID / キー ID / 秘密鍵: 手順 1-3 の値

Authentication → Settings → **Authorized domains** に、本番ドメイン（`pixdone.vercel.app` など）が入っていることを確認する。

## 3. 動作確認

- Web: 「Appleで続ける」→ Apple のポップアップ → ログインできる
- iOS アプリで Apple 登録したアカウントで、Web からも同じデータが見える
- Android: 「Appleで続ける」→ Apple の画面 → アプリに戻ってログインできる
