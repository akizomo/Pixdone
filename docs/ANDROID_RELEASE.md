# PixDone Android リリース手順（Capacitor / Google Play）

PixDone の Android アプリは **Capacitor** で Web アプリを包んだものです（`app/android`）。
当初検討した TWA（Bubblewrap）は使いません。iOS も同じ仕組みで、コードは Web と共通です。

- パッケージ名: `com.pixdone.app`
- API の向き先: 本番 `https://pixdone.vercel.app`（アプリ内に Web の画面を同梱し、API だけ本番を呼ぶ）
- 課金: Google Play 課金（RevenueCat 経由）→ [STORE_BILLING_SETUP.md](STORE_BILLING_SETUP.md)
- 方式の判断経緯は memory の `project_native_app_capacitor` を参照

---

## 1. 前提（Mac）

- Android Studio（同梱の JDK を使う）
- Android SDK（`~/Library/Android/sdk`）
- ターミナルで毎回、次を設定する（または `~/.zshrc` に追記）

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

## 2. アップロード鍵を作る（最初の1回だけ）

Play Console に AAB をアップロードするときの署名鍵です。**パスワードと `.jks` は必ずバックアップしてください**（紛失するとアップロード鍵のリセット申請が必要になります）。
リポジトリの外に置きます。

```bash
"$JAVA_HOME/bin/keytool" -genkeypair -v -keystore ~/pixdone-upload.jks -alias pixdone-upload -keyalg RSA -keysize 2048 -validity 10000
```

パスワードなどを聞かれるので、自分で決めて 1Password などに保管します。

次に `app/android/keystore.properties` を作ります（**Git には入りません**。`.gitignore` 済み）。

```properties
storeFile=/Users/<あなたのユーザー名>/pixdone-upload.jks
storePassword=<手順で決めたパスワード>
keyAlias=pixdone-upload
keyPassword=<手順で決めたパスワード>
```

> `keystore.properties` がないと、`bundleRelease` は**署名なし**の AAB を作ります（Play Console には上げられません）。

## 3. リリース用 AAB を作る

1. **バージョンを上げる**: `app/android/app/build.gradle` の `versionCode`（Play にアップロードするたびに、前より大きい整数にする。同じ値は拒否されます）と `versionName`
2. ビルド

```bash
cd app && npm run build:native && cd android && ./gradlew bundleRelease
```

3. 出力: `app/android/app/build/outputs/bundle/release/app-release.aab`

> `npm run build:native` は `app/.env` の `VITE_REVENUECAT_ANDROID_KEY` を取り込みます。キーが空だと、料金ページは「準備中」になります。

## 4. Play Console にアップロード

1. アプリを作成（パッケージ名 `com.pixdone.app`）
2. テスト → **内部テスト** → リリースを作成 → AAB をアップロード
3. テスターに自分の Google アカウントを追加し、表示される参加リンクからインストール
4. 初回アップロード時に **Play App Signing** を有効にする（推奨・既定）

## 5. Google ログイン用の SHA-1 を Firebase に追加（重要）

Play 経由でインストールしたアプリは、**Google が再署名**します。この証明書を Firebase に登録しないと、Google ログインが失敗します。

1. Play Console → アプリの完全性（App integrity）→ アプリ署名 → **アプリ署名鍵の証明書**の SHA-1 をコピー
2. 手順 2 のアップロード鍵の SHA-1 もコピー

```bash
"$JAVA_HOME/bin/keytool" -list -v -keystore ~/pixdone-upload.jks -alias pixdone-upload | grep SHA1
```

3. Firebase コンソール → プロジェクトの設定 → マイアプリ → PixDone Android に、2つの SHA-1 を追加
4. `google-services.json` をダウンロードし直して、`app/android/app/google-services.json` を差し替える
5. 差し替えたら、versionCode を上げて、手順 3 からやり直す

（開発用のデバッグ鍵の SHA-1 は登録済みです。シミュレーターやデバッグビルドの確認用です）

## 6. ストア掲載の素材と申告

| 素材 | 規格 |
|---|---|
| アプリアイコン | 512×512 PNG（`app/public/icon-512.png` を流用できる） |
| フィーチャーグラフィック | 1024×500 PNG/JPG |
| スクリーンショット | スマホ 2〜8 枚（16:9 または 9:16、1080px 以上推奨） |
| 短い説明 | 80 文字以内 |
| 詳しい説明 | 4000 文字以内 |
| プライバシーポリシー URL | `https://pixdone.vercel.app/privacy.html` |

申告: データセーフティ（Firebase Auth / Firestore / 課金）、コンテンツレーティング、対象年齢、広告の有無。

## 7. 公開までの流れ

1. **内部テスト**: 自分の端末で、ログイン・購入・復元まで確認（購入のテストはこのトラックから）
2. **クローズドテスト**（必要な場合）: 個人アカウントは、一般公開の前に「12 人以上のテスターが 14 日間参加」という条件があります（アカウントの種類によって異なります。Play Console の案内を確認してください）
3. **製品版**: 審査（数時間〜数日）

### 申請前チェックリスト
- [ ] Play App Signing の SHA-1 を Firebase に登録し、Play 経由の端末で Google ログインできる
- [ ] 購入・復元・「Google Play でプランを管理」が動く（STORE_BILLING_SETUP.md の確認項目）
- [ ] 利用規約・プライバシーポリシーのリンクが料金ページにある（実装済み）
- [ ] データセーフティ・コンテンツレーティングの申告
- [ ] `versionCode` が前回より大きい

## 8. 使っていないファイル（TWA の名残）

次のファイルは今の構成では不要です。消しても影響はありません。
- `twa-manifest.json`（リポジトリ直下）
- `app/public/.well-known/assetlinks.json`（`vercel.json` の assetlinks 用ヘッダーも同様）

## 付録: Web（PWA）としての名残

`app/public/manifest.webmanifest` と Service Worker は、Web 版の「ホーム画面に追加」用に今も使われています。アプリ内（ネイティブ）のビルドでは Service Worker を無効にしています（`vite build --mode native`）。
