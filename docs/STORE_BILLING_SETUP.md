# ストア課金（App Store / Google Play）セットアップ手順

PixDone+ をアプリ内で購入できるようにするための、ストア・RevenueCat・Stripe 側の作業をまとめた手順書です。
コード側（購入画面・復元・サーバー Webhook）は実装済みで、**ここに書いた ID とキーを設定すれば動きます**。

- 価格: **¥300/月・¥3,000/年**、新規は **7日間無料トライアル**（BRD §10）
- 仕組み: アプリ → RevenueCat SDK → ストアで購入 → RevenueCat が Webhook → 本番サーバーが `users` のプランを更新
- 購入の紐付け: RevenueCat の `app_user_id` = Firebase の uid（サーバーの `users.id` と同じ）

---

## 0. 使う ID（ここを唯一の正とする）

コードは次の名前に依存します。**変える場合はサーバーの `billingCycleOf()`（server/billing/revenuecat.ts）も確認してください**
（商品 ID に `month` / `year`（`annual`）が含まれていれば月額・年額と判定します）。

| 項目 | 値 |
|---|---|
| バンドル ID / パッケージ名 | `com.pixdone.app` |
| iOS サブスクリプショングループ | `PixDone+` |
| iOS 商品 ID | `pixdone_plus_monthly` / `pixdone_plus_yearly` |
| Google Play サブスクリプション ID | `pixdone_plus` |
| Google Play ベースプラン ID | `monthly` / `yearly` |
| RevenueCat Entitlement | `plus` |
| RevenueCat Offering | `default`（Current に設定） |
| RevenueCat Package | `$rc_monthly` / `$rc_annual`（標準のパッケージ種別を使う） |

> アプリは Offering の **Monthly / Annual** のパッケージ種別で商品を探します。名前ではなく種別が合っていれば動きます。

---

## 1. App Store Connect（iOS）

1. **契約・税務・銀行口座**: 「ビジネス」→ **有料App契約** を有効にする（未完了だと商品が作れません）
2. **アプリを登録**: 「マイApp」→ 新規 App → バンドル ID `com.pixdone.app`
3. **サブスクリプション商品を作る**: App → 「サブスクリプション」
   1. グループ `PixDone+` を作成
   2. `pixdone_plus_monthly`（1か月・**¥300**）と `pixdone_plus_yearly`（1年・**¥3,000**）を追加
   3. それぞれに「**導入オファー**」→ 無料 → **1週間**（対象: 新規購読者）
   4. 表示名・説明（日本語・英語）とレビュー用スクリーンショット（料金ページ）を入力
4. **RevenueCat 用の鍵**: 「ユーザとアクセス」→「統合」→「App 内課金」→ **In-App Purchase キー**を生成し、`.p8` ファイルを**ダウンロード**（ダウンロードできるのは**1回だけ**。1Password などに保管）。同じ画面に表示される **Issuer ID** も控える（RevenueCat に登録します）
5. **サンドボックステスター**: 「ユーザとアクセス」→「サンドボックス」で購入テスト用の Apple アカウントを作成
6. Apple Developer の App ID（`com.pixdone.app`）で **Sign in with Apple** と **In-App Purchase** が有効なことを確認（Xcode の Automatically manage signing で自動登録されます）

## 2. Google Play Console（Android）

1. **デベロッパー登録**（$25 一回）とお支払いプロファイルの設定
2. **アプリを作成**: パッケージ名 `com.pixdone.app`
3. **署名付き AAB をアップロード**（内部テストでよい）。**アップロード済みのアプリがないと、サブスク商品を作れず、購入テストもできません**
4. **サブスクリプション**: 「収益化」→「定期購入」→ 作成
   1. 商品 ID `pixdone_plus`
   2. ベースプラン `monthly`（自動更新・1か月・**¥300**）、`yearly`（自動更新・1年・**¥3,000**）
   3. 各ベースプランに「**無料トライアル**」オファー（7日間・新規ユーザーのみ）を追加し、すべて「有効化」
5. **RevenueCat 用のサービスアカウント**: Google Cloud でサービスアカウントを作成 → JSON キーを発行 → Play Console の「ユーザーと権限」にそのメールを招待し、**財務データの閲覧**と**注文と定期購入の管理**の権限を付与
6. **ライセンステスター**: 「設定」→「ライセンステスト」に、自分の Google アカウントを追加
7. 購入の通知（リアルタイム デベロッパー通知）は、RevenueCat の画面の案内に従って設定

## 3. RevenueCat

画面のメニュー名は、RevenueCat の更新で変わることがあります。違っていたら、スクリーンショットを送ってください。
**料金**: 新規のアカウントは「Pro」プランで、**月の追跡売上が $2,500 まで無料**、超えた分の 1% が料金です（公式の料金ページ。Webhook は Pro の機能とされていますが、この無料の範囲で使えるはずです。Integrations 画面に Webhooks が出ない場合は、教えてください）。

**ストア側の準備が要らない作業（先にやれる）**
1. https://app.revenuecat.com でアカウントとプロジェクト `PixDone` を作成
2. **Webhook**: 左メニューの「Integrations」→「Webhooks」→「Add new configuration」
   - 名前: `PixDone server`
   - URL: `https://pixdone.vercel.app/api/billing/revenuecat-webhook`
   - **Authorization header value**: Vercel の `REVENUECAT_WEBHOOK_AUTH` と同じ文字列（1Password に保存したもの）
   - 環境: **Production と Sandbox の両方**（TestFlight・内部テストの購入も確認できます）
   - アプリの範囲: 全アプリ。イベントの種類のフィルター: なし（すべて）
   - 「HMAC webhook signing」は、オフのまま（認証は Authorization ヘッダーで行っています）
   - 保存したら、ダッシュボードの「テストイベントを送る」で送り、サーバーが `200` を返すことを確認（TEST イベントは無視されます）

**ストア側の準備ができてから（手順 1・2 の商品と鍵が必要）**
3. **App Store のアプリを追加**: 「Apps」（または Project settings）→ 新規 → **App Store**
   - バンドル ID: `com.pixdone.app`
   - 追加したアプリの設定の「**In-app purchase key configuration**」タブで、手順 1-4 の **`.p8` ファイルをアップロード**し、**Issuer ID**（App Store Connect の「ユーザとアクセス」→「統合」→「App 内課金」の画面に表示）を貼って「Save changes」。**「Valid credentials」と表示される**ことを確認
4. **Play Store のアプリを追加**: 新規 → **Play Store**
   - パッケージ名: `com.pixdone.app`
   - 「Project settings」→「Google Play App Settings」→「Service account credentials」に、手順 2-5 の **JSON をアップロード**
   - ⚠ **Google 側の権限が反映されるまで、最大36時間かかります**。それまでは「Invalid Play Store credentials」と出ても、慌てず待ってください
   - 購入の通知（Pub/Sub）の設定も、同じ画面の案内に従う（サービスアカウントに「Pub/Sub 編集者」と「モニタリング閲覧者」の役割が必要）
5. **Products**: 「Product catalog」→「Products」で、各ストアの商品を取り込む（0 の表のとおり。Google Play は `pixdone_plus:monthly`・`pixdone_plus:yearly` のように見えます）
6. **Entitlements**: 「Product catalog」→「Entitlements」タブ →「+ New entitlement」→ 識別子 `plus` → 開いて「Attach」で、**4つの商品をすべて**紐付ける
7. **Offerings**: 「Offerings」タブ →「+ New」→ 識別子 `default`（**あとから変更できません**）→ Save → 開いて「+ Add package」
   - 識別子のドロップダウンから **Monthly** を選び、月額の商品（iOS・Android）を紐付けて Save
   - もう一つ、**Annual** を選び、年額の商品（iOS・Android）を紐付けて Save
   - この `default` が、アプリから見て「現在の Offering」になるようにする（Default Offering / Current と表示される設定。最初の Offering は自動で、そうなることが多いです。違っていたら切り替える）
8. **SDK キー（公開用）**: 「API keys」から、iOS 用（`appl_…`）と Android 用（`goog_…`）をコピー → 私に渡す

## 4. キーの設定（私に渡す・自分で入れる）

| 設定先 | 名前 | 値 | 備考 |
|---|---|---|---|
| `app/.env`（ビルド時） | `VITE_REVENUECAT_IOS_KEY` | `appl_…` | 公開用の SDK キー。Git には入れません |
| `app/.env`（ビルド時） | `VITE_REVENUECAT_ANDROID_KEY` | `goog_…` | 同上 |
| Vercel（Production） | `REVENUECAT_WEBHOOK_AUTH` | 手順 3-2 の文字列 | **本番サーバー用。未設定だと Webhook は 500 を返します** |

キーを設定したら `cd app && npm run build:native` で再ビルドします（キーなしのビルドでは料金ページが「準備中」になります）。

## 5. Stripe（Web の価格を ¥300 / ¥3,000 に）

1. Stripe ダッシュボード（本番）で、PixDone+ の商品に新しい Price を2つ作る: **月額 ¥300**・**年額 ¥3,000**
2. Vercel の本番環境変数を新しい Price ID に差し替える: `STRIPE_PRICE_PLUS_MONTHLY` / `STRIPE_PRICE_PLUS_YEARLY`
   （ステージング用の環境変数も、テスト用の新 Price に差し替え）
3. **既存の契約者（¥600/¥6,000）**: 次回更新から新価格にする（値下げなので不利益はありません）。Stripe の「サブスクリプションの一括更新」などで新 Price へ移行します
4. Price ID が変わったら私に伝えてください。LP と料金ページ・アカウントページの価格表示（¥600 / ¥500 / ¥6,000）を ¥300 / ¥250 / ¥3,000 に変更します
   - ※ 順序を守ってください。表示だけ先に変えると、実際の請求と食い違います

---

## 6. テスト

### iOS
- シミュレーターではサンドボックス購入ができません。**TestFlight 配信、または実機**でテストします
- 端末の「設定 → App Store → サンドボックスアカウント」で、手順 1-5 のテスターでサインイン
- サンドボックスでは更新間隔が短縮されます（1か月 → 約5分）

### Android
- Play Console の**内部テストトラック**に AAB をアップロードし、ライセンステスターのアカウントでテスターに参加してインストール
- ライセンステスターの購入は課金されず、更新間隔も短縮されます

### 確認する項目
- [ ] 料金ページにストアの価格（¥300 など）が表示される
- [ ] 購入 → 数秒以内に PixDone+ の画面になる（Rare/Epic エフェクトが使える）
- [ ] アカウントページに「App Store / Google Play でプランを管理」が表示され、Stripe の解約は出ない
- [ ] アプリを入れ直して「購入を復元」→ PixDone+ に戻る
- [ ] Web でログインして、アプリで買った PixDone+ が有効になっている（同じアカウント）
- [ ] すでに Web（Stripe）で契約中のアカウントは、アプリの料金ページに購入ボタンが出ない

## 7. 審査に出す前に

- **App Store**: 審査メモにテスト用アカウント（メール・パスワード）を書く。ログインが必須のアプリのため必須です（ガイドライン 5.1.1 との説明も添える）
- **App Store**: 料金ページの利用規約・プライバシーポリシーのリンクは実装済み（`/terms.html`, `/privacy.html`）。内容が最新か確認する
- **Google Play**: データセーフティの申告、プライバシーポリシー URL（`https://pixdone.vercel.app/privacy.html`）
- Web の決済（Stripe）への誘導をアプリ内に出さない（現状は出していません）

## 8. 既知の制限

- **サンドボックス／テスト購入も本番サーバーの DB に反映されます**（RevenueCat の `environment` で区別していません）。必ずご自身のアカウントでテストしてください
- **復元でアカウントが変わる場合**（別の Firebase アカウントで「購入を復元」）は、RevenueCat から `TRANSFER` イベントが届きますが、サーバーは無視します。今は同じアカウントでの復元だけを想定しています
- ストアの**課金失敗の猶予期間**（BILLING_ISSUE）中は、プランをそのまま維持し、期限切れ（EXPIRATION）でダウングレードします
