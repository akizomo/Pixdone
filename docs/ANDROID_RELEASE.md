# PixDone Android リリース手順（TWA / Google Play）

PixDone を **TWA (Trusted Web Activity)** で PWA をラップし、Google Play で配信するための手順書。
PWA はそのまま Android アプリの中身になる（別途ネイティブ実装は不要）。

- パッケージ ID: `com.pixdone.app`
- 配信元ドメイン: `https://pixdone.vercel.app`
- ラップ対象 PWA: Vercel デプロイ済みの本番サイト
- Bubblewrap 設定: リポジトリ直下 [`twa-manifest.json`](../twa-manifest.json)

---

## フェーズ一覧

| フェーズ | 内容 | 状態 |
|---|---|---|
| **A. PWA を install 可能に** | manifest / アイコン / SW | ✅ 完了 |
| **B. TWA プロジェクト生成・署名・assetlinks** | Bubblewrap・鍵生成・検証 | ⬜ 未着手（環境準備要） |
| **C. Play Console 申請** | ストア素材・審査・公開 | ⬜ 未着手 |

---

## Phase A（完了済み・記録）

- `app/public/icon-192.png` / `icon-512.png` を生成（`app/scripts/generate-pwa-icons.mjs`）
- `app/public/manifest.webmanifest` がアイコンを参照（`any` / `any maskable`）
- `index.html` の apple-touch-icon を `/icon-192.png` に統一
- vite-plugin-pwa（Workbox generateSW）で SW を自動生成、アイコンをプリキャッシュ
- `app/public/.well-known/assetlinks.json` 設置済み（**SHA256 はプレースホルダ**）
- `vercel.json` で assetlinks.json の Content-Type: application/json を保証

### 確認方法
本番 URL を Chrome（Android 実機 or DevTools の Application タブ）で開き:
- manifest が valid（インストール可能の判定が出る）
- `https://pixdone.vercel.app/icon-512.png` が 200 で返る
- `https://pixdone.vercel.app/.well-known/assetlinks.json` が JSON で返る

---

## Phase B: TWA プロジェクト生成・署名・assetlinks

### B-0. 前提環境（ローカル）
- **JDK 17**（Bubblewrap が JDK を要求）
- **Android SDK**（Bubblewrap が初回に自動DLも可能）
- Node.js（インストール済み）

```bash
npm install -g @bubblewrap/cli
bubblewrap doctor   # JDK / Android SDK の検出を確認
```

> ⚠️ JDK / Android SDK の用意が重い場合、`bubblewrap` は初回 `init` 時に JDK と Android SDK の
> 自動ダウンロードを提案する。指示に従えば手動インストール不要なことが多い。

### B-1. TWA プロジェクト生成
リポジトリ直下の `twa-manifest.json` を使う（Vercel の本番 manifest から生成済みの設定）。

```bash
# manifest URL から初期化（twa-manifest.json を上書き生成したい場合）
bubblewrap init --manifest https://pixdone.vercel.app/manifest.webmanifest

# もしくは既存の twa-manifest.json を使ってビルド
bubblewrap build
```

`bubblewrap init` 実行時に対話で:
- パッケージ名 → `com.pixdone.app`
- アプリ名 → `PixDone`
- テーマカラー → `#0A0A22`
- 背景色 → `#0A0A22`
- 署名鍵 → 新規生成（`android.keystore`、alias `pixdone`）。**パスワードを安全に保管**

### B-2. 署名鍵と SHA256 フィンガープリント
**Play App Signing を利用する前提**（推奨）。アップロード鍵は Bubblewrap が生成した `android.keystore`。

ローカルのアップロード鍵の SHA256:
```bash
keytool -list -v -keystore android.keystore -alias pixdone | grep SHA256
```

ただし **Play App Signing 利用時、最終的にユーザー端末へ届くのは Google の署名鍵**。
assetlinks に入れるべき SHA256 は:
- **Play Console → リリース → セットアップ → アプリの署名** に表示される
  **「アプリ署名鍵証明書」の SHA-256** （アップロード鍵ではない）

この値を取得できるのは AAB を一度 Play Console にアップロードした後（B-4以降）。

### B-3. assetlinks.json の更新 → デプロイ
取得した SHA-256 を `app/public/.well-known/assetlinks.json` の
`sha256_cert_fingerprints` に差し替える（`REPLACE_WITH_PLAY_SIGNING_FINGERPRINT` を置換）。

```json
"sha256_cert_fingerprints": ["AB:CD:EF:...:99"]
```

その後 Vercel に main を push してデプロイ。検証:
```bash
curl -s https://pixdone.vercel.app/.well-known/assetlinks.json
# Google の検証ツールでも確認
# https://developers.google.com/digital-asset-links/tools/generator
```

> assetlinks が一致しないと TWA でアドレスバー（Custom Tabs のURL表示）が残る。
> 一致すると完全フルスクリーンのアプリ表示になる。

### B-4. AAB ビルド
```bash
bubblewrap build
# 生成物: app-release-bundle.aab（Play 申請用）, app-release-signed.apk（端末確認用）
```

実機確認:
```bash
bubblewrap install   # 接続中の端末に APK をインストール
```

---

## Phase C: Google Play Console 申請

### C-0. アカウント
- Google Play Console デベロッパー登録（**$25 一回**）
- アプリを新規作成 → パッケージ名 `com.pixdone.app`

### C-1. 必要なストア素材
| 素材 | 規格 |
|---|---|
| アプリアイコン | 512×512 PNG（`icon-512.png` を流用可。背景透過不可・余白注意） |
| フィーチャーグラフィック | 1024×500 PNG/JPG |
| スクリーンショット | スマホ最低2枚（16:9 or 9:16、1080px以上推奨） |
| 短い説明 | 80文字以内 |
| 詳しい説明 | 4000文字以内 |
| プライバシーポリシー URL | 必須（要設置） |

### C-2. 申請前チェックリスト
- [ ] assetlinks.json に Play 署名鍵の SHA-256 が反映済み・デプロイ済み
- [ ] AAB をアップロードしクラッシュなく起動（内部テスト）
- [ ] TWA でアドレスバーが消えている（assetlinks 検証成功の証拠）
- [ ] プライバシーポリシー URL 設置済み
- [ ] データセーフティ申告（Firebase Auth / Firestore / Stripe のデータ取扱い）
- [ ] コンテンツレーティング質問票
- [ ] 対象年齢・広告有無の申告
- [ ] 課金（PixDone+）を Play 課金に載せるか Stripe のまま web 課金にするか方針確定 ※後述

### C-3. リリーストラック
1. **内部テスト** → 自分の端末で最終確認
2. **クローズドテスト**（任意）
3. **製品版** → 審査（通常数時間〜数日）

---

## ⚠️ 重要: 課金（PixDone+）の扱い

Google Play では **アプリ内のデジタルコンテンツ課金は原則 Google Play 課金が必須**。
現状 PixDone+ は **Stripe**（¥600/月・¥6,000/年）。TWA でそのまま Stripe 課金画面を出すと
**Play のポリシー違反でリジェクトされるリスク**がある。

選択肢（**リリース前に方針決定が必要**）:
1. **Play 課金（Google Play Billing）を実装** — TWA では Digital Goods API + Play Billing が必要。手数料15〜30%。
2. **当面は無料アプリとして申請** — PixDone+ の導線を Android アプリ内では出さない / web に誘導（ただし「外部課金への誘導」もポリシー注意）。
3. **iOS/Android は無料機能のみ、課金は web 限定**として申告。

→ BRD のマネタイズ方針と照らして要判断。実装前に必ずユーザー確認すること。

---

## 参考リンク
- Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap
- TWA Quick Start: https://developer.chrome.com/docs/android/trusted-web-activity/
- Digital Asset Links 検証: https://developers.google.com/digital-asset-links/tools/generator
- Play Billing in TWA: https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing/
