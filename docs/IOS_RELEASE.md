# iOS リリース手順（Capacitor / TestFlight → App Store）

PixDone の iOS アプリは Capacitor で作っています（`app/ios`）。**iPhone 専用**です（iPad 用のスクリーンショットと審査は不要。iPad では iPhone 用アプリとして互換表示されます）。

- バンドル ID: `com.pixdone.app` ／ チーム: `JW8K44JXT4` ／ バージョン: `1.0`（`MARKETING_VERSION`）
- 課金: App Store のサブスク（RevenueCat 経由）→ [STORE_BILLING_SETUP.md](STORE_BILLING_SETUP.md)
- 掲載文・審査メモ・プライバシーの申告: [STORE_LISTING.md](STORE_LISTING.md)
- 全体のチェックリスト: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)

---

## 0. 設定済みのこと（確認だけ）

- iPhone 専用（`TARGETED_DEVICE_FAMILY = 1`）
- Sign in with Apple の権限（`App.entitlements`）
- バックグラウンドオーディオ（`UIBackgroundModes: audio`、フォーカスタイマーの BGM 用）
- 輸出コンプライアンス: `ITSAppUsesNonExemptEncryption = false`（HTTPS など OS 標準の暗号化のみ）
- 自動署名（Automatic）。アプリのアイコン（1024px、透過なし）

## 1. ビルドの準備

1. `app/.env` に、RevenueCat の iOS 公開キーを入れる（これがないと、料金ページの購入ボタンが「準備中」になり、**審査で落ちます**）

```
VITE_REVENUECAT_IOS_KEY=appl_…
```

2. **ビルド番号を上げる**: アップロードのたびに、同じバージョンの中で、ビルド番号が前より大きい必要があります。Xcode の Target App → General → Build（`CURRENT_PROJECT_VERSION`、最初は 1）
3. Web 側をビルドして、iOS に反映する

```bash
cd app && npm run build:native
```

## 2. Xcode でアーカイブ → アップロード

1. `app/ios/App/App.xcodeproj` を Xcode で開く（Xcode の設定 → Accounts に、Apple ID でログインしていること）
2. Target **App** → **Signing & Capabilities**
   - Team: `JW8K44JXT4`、「Automatically manage signing」にチェック
   - Capability が、次の3つ入っていること: **Sign in with Apple**、**In-App Purchase**（「＋ Capability」で追加）、**Background Modes**（Audio, AirPlay, and Picture in Picture にチェック）
3. 上のバーの実行先を **Any iOS Device (arm64)** にする
4. メニュー **Product → Archive**（数分かかります）
5. 終わると Organizer が開く → **Distribute App → App Store Connect → Upload** → 画面の案内に従う（署名は自動）

> 初回は、Xcode が配布用の証明書とプロビジョニングプロファイルを自動で作ります。Apple Developer の App ID（`com.pixdone.app`）に、Sign in with Apple と In-App Purchase が有効になっていることも、あわせて確認されます。

## 3. TestFlight で実機テスト

1. App Store Connect → PixDone → **TestFlight**。ビルドが「処理中」→「テスト可能」になるまで待つ（数分〜30分）
2. 「コンプライアンス情報が不足」と出たら、**暗号化の質問**に答える（標準の暗号化のみ、と回答）
3. **内部テスト**: 「内部テスト」→ グループを作成 → 自分（App Store Connect のユーザー）を追加 → ビルドを追加
4. iPhone の TestFlight アプリからインストール
5. 確認すること
   - [ ] Apple ログイン・Google ログイン・メールでログインして、タスク一覧が表示される
   - [ ] サブスクの購入（TestFlight ではサンドボックス）→ PixDone+ が有効になる → 購入の復元 → 「App Store でプランを管理」
   - [ ] フォーカスタイマー: ホームに戻って5分以上離れても、残り時間が合い、BGM が鳴り続ける。BGM オフのときは、時間が来たときに通知が届く
   - [ ] アカウント削除（テスト用アカウントで）

## 4. App Store Connect で申請の準備

1. **サブスク商品**（[STORE_BILLING_SETUP.md](STORE_BILLING_SETUP.md) の 1）: 月額・年額、1週間の無料の導入オファー、表示名・説明、**審査用のスクリーンショット**（料金ページの画面）→ 状態が「提出準備完了」
2. **App 情報**: カテゴリ（仕事効率化）、プライバシーポリシー URL
3. **価格および配信状況**: 無料、配信する国・地域
4. **App のプライバシー**: 収集するデータを申告（[STORE_LISTING.md](STORE_LISTING.md)。Xcode の「プライバシーレポート」と照合）
5. **年齢制限**の質問票
6. **バージョン 1.0 のページ**
   - スクリーンショット（iPhone 6.9インチ: 1320×2868）、説明文、キーワード、サポート URL、マーケティング URL、著作権
   - **ビルド**: TestFlight で確認したビルドを選ぶ
   - **アプリ内課金とサブスクリプション**: 作成したサブスクを、このバージョンに追加する（**初回は、アプリのバージョンと一緒に審査に出す必要があります**）
   - **App Review 情報**: 連絡先、**テスト用アカウント**（メールとパスワード）、審査メモ（STORE_LISTING.md の文面）
   - リリース方法: 「手動でリリース」を推奨（承認後、自分のタイミングで公開できます）

## 5. 提出

1. バージョンのページで **「審査へ提出」**
2. 審査の状況: 審査待ち → 審査中 → 承認（通常 1〜2 日。数日かかることもあります）
3. 却下された場合は、Resolution Center に理由が出るので、内容を共有してください。修正して、ビルド番号を上げて、再提出します
4. 承認後、「このバージョンをリリース」を押すと公開されます

## よくある却下の理由（PixDone で注意する点）

| ガイドライン | 内容 | PixDone の状況 |
|---|---|---|
| 5.1.1(v) | アプリ内でアカウントを削除できること | 実装済み（アカウントページ）。Apple ログインのトークン取り消しは**未対応** |
| 5.1.1 | ログインが必須の理由 | 審査メモに記載。説明が通らない場合は、ゲストモードの検討が必要 |
| 3.1.1／3.1.2 | アプリ内の購入はアプリ内課金で。購入画面に価格・期間・規約リンク | 実装済み（Stripe はアプリ内で使わない。規約・プライバシーのリンクあり） |
| 4.8 | Google ログインがあるなら Apple ログインも | 実装済み |
| 2.1 | 審査用アカウントで、すべての機能が動くこと | テスト用アカウントを用意（要作成） |
| 4.0／2.3 | 説明・スクリーンショットが実際のアプリと一致 | 掲載文は、実装済みの機能のみ |
