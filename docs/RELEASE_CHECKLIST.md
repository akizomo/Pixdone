# リリースチェックリスト（あなたがやること）

最終更新: 2026-10-29。詳しい手順は、それぞれのドキュメントに書いてあります。
[ANDROID_RELEASE.md](ANDROID_RELEASE.md) ／ [STORE_BILLING_SETUP.md](STORE_BILLING_SETUP.md) ／ [STORE_LISTING.md](STORE_LISTING.md)

## 完了していること

- [x] Apple Developer Program、App Store Connect の有料App契約（口座・税務）、Google Play のデベロッパーアカウントとお支払いプロファイル
- [x] App Store Connect・Play Console に、PixDone のアプリの箱を作成（`com.pixdone.app`）
- [x] Firebase に iOS・Android アプリを登録、Apple ログインの有効化
- [x] Android: アップロード鍵の作成、AAB を内部テストに公開、Play の署名鍵の SHA-1 を Firebase に登録、Google ログインの動作確認
- [x] 本番の Vercel に `REVENUECAT_WEBHOOK_AUTH` を設定、Webhook の受け口が動くことを確認
- [x] 本番 DB に `subscription_provider` 列を追加

## 1. すぐにやること（短い）

- [ ] **GitHub Desktop で push**（未 push のコミットがあります。サポートページ `/support.html` などが本番に出ます）
- [ ] **法的文書の変更案を確認**（プライバシーポリシー・利用規約・特定商取引法）→ 問題なければ「コミットしてよい」と伝える
- [ ] **本番でアカウント削除を試す**: テスト用アカウントを新しく作って、アカウントページから削除。同じメールで再登録できること、Firebase の Authentication と Firestore にデータが残っていないことを確認
- [ ] **Firebase の Google アナリティクスで「Google シグナル」が無効**であることを確認（トラッキングなし、と申告するため）
- [ ] **審査用のテストアカウント**を、本番に作る（メールで登録 → 確認メールのリンクを開く）。IDとパスワードを控える

## 2. 課金（売上に直結）

- [ ] RevenueCat: アカウント、プロジェクト `PixDone`
- [ ] App Store Connect: サブスク商品 `pixdone_plus_monthly`（¥300）・`pixdone_plus_yearly`（¥3,000）、各1週間の無料の導入オファー、In-App Purchase の鍵（`.p8`）
- [ ] Google Play: サブスク `pixdone_plus`（ベースプラン `monthly`・`yearly`）、7日間の無料トライアル、サービスアカウントの JSON
- [ ] RevenueCat: 2つのストアを接続、Entitlement `plus`、Offering `default`（Current）、Webhook の登録
- [ ] RevenueCat の公開キー（`appl_…`・`goog_…`）を私に渡す → 私が `.env` に設定してビルド
- [ ] Stripe: 新しい Price（¥300・¥3,000）、既存契約者の移行、Vercel の `STRIPE_PRICE_PLUS_*` を差し替え、新しい Price ID を私に渡す → 私が画面の価格表示を更新

## 3. ストア申請の素材

- [ ] **App Store Connect**: カテゴリ（仕事効率化）、価格（無料）、サポート URL・プライバシーポリシー URL、説明文・キーワード（[STORE_LISTING.md](STORE_LISTING.md) をコピー）、年齢制限の質問票、**App のプライバシー**（Xcode のプライバシーレポートと照合）、審査メモとテストアカウント、輸出コンプライアンス
- [ ] **Google Play**: ストアの掲載情報、データセーフティ、コンテンツのレーティング、プライバシーポリシー URL、アカウント削除の案内 URL
- [ ] **スクリーンショット**（iPhone 6.9インチ 1320×2868、Android のスマホ）: 構成案は STORE_LISTING.md。テスト用アカウントができたら、私がシミュレーターで撮影できます
- [ ] **フィーチャーグラフィック**（Google Play、1024×500）

## 4. 実機での確認（TestFlight・内部テスト）

- [ ] Google ログイン・Apple ログイン後に、タスク一覧が表示される
- [ ] サブスクの購入 → PixDone+ が有効になる → 購入の復元 → 「プランを管理」
- [ ] フォーカスタイマー: ホームに戻って5分以上離れても、残り時間が合い、BGM が鳴り続ける。時間が切れたとき、完了の音（iOS は BGM オフなら通知）
- [ ] 新しい Android ビルド: `versionCode` は 2（まだ未アップロード）。iOS は、TestFlight に上げ直すときに、ビルド番号（`CURRENT_PROJECT_VERSION`、いま 1）を上げる

## 5. 審査前に必要（あなたの作業が先）

- [ ] **Apple ログインのアカウント削除（トークン取り消し）**: Apple Developer で「Sign in with Apple」用のキー（`.p8`）を作り、Key ID・Team ID とあわせて、Firebase の Apple プロバイダに登録 → 私が実装（Apple のガイドラインで必要）
- [ ] （個人アカウントの場合）Google Play の本番公開の前に、クローズドテストで12人以上のテスター・14日間、という条件の確認

## 私がやれること（依頼してください）

- 法的文書のコミット（確認後）／ 掲載文・スクリーンショットの調整・撮影
- 輸出コンプライアンス（`ITSAppUsesNonExemptEncryption`）の設定 — 法的な申告なので、了承をもらってから
- 失敗している既存テスト7件の修正、TWA の不要ファイルの削除
- Apple トークン取り消しの実装（`.p8` の登録後）
- RevenueCat キー・Stripe の Price ID を受け取ったあとの設定と価格表示の更新
