# PixDone 環境構成ガイド

## 概要

| 環境 | ブランチ | URL | Stripe |
|------|----------|-----|--------|
| 本番 (Production) | `main` | https://pixdone.akizony.com | `sk_live_...` |
| ステージング (Staging) | `develop` | https://pixdone-bwm6.vercel.app | `sk_test_...` |

---

## ブランチ戦略

```
main        ← 本番リリース用。直接 push 禁止。PR のみ。
develop     ← ステージング。機能開発の統合ブランチ。
feature/*   ← 機能開発。develop へ PR。
```

**典型的な作業フロー:**

1. `develop` から `feature/xxx` ブランチを切る
2. 開発・テスト後、`develop` へ PR → マージ → ステージングに自動デプロイ
3. ステージングで動作確認後、`develop` → `main` へ PR → マージ → 本番に自動デプロイ

---

## Vercel プロジェクト

| 環境 | プロジェクト名 | プロジェクト ID |
|------|----------------|-----------------|
| 本番 | `pixdone` | `prj_thbh5tAQTdrUYMaMrq64o0rlKuaR` |
| ステージング | `pixdone-bwm6` | `prj_o8EXZcFrMV9pm8PxAcez6gbzXmAg` |

---

## 環境変数の設定

### 共通変数（両環境で必要）

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | Supabase 接続文字列 (Port 6543) |
| `SESSION_SECRET` | セッション署名用シークレット（32文字以上） |

### Stripe 変数（環境ごとに値が異なる）

| 変数名 | ステージング | 本番 |
|--------|-------------|------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_PRICE_PLUS_MONTHLY` | テスト用 Price ID | 本番 Price ID |
| `STRIPE_PRICE_PLUS_YEARLY` | テスト用 Price ID | 本番 Price ID |
| `STRIPE_WEBHOOK_SECRET` | テスト用 Webhook シークレット | 本番 Webhook シークレット |

### Vercel ダッシュボードで設定する手順

1. https://vercel.com/akihiros-projects-ee985f2d を開く
2. プロジェクト（`pixdone` または `pixdone-bwm6`）を選択
3. **Settings → Environment Variables** を開く
4. 各変数を **Production** 環境に追加する

> ステージング (`pixdone-bwm6`) には `sk_test_...` キーを、本番 (`pixdone`) には `sk_live_...` キーを設定してください。

---

## GitHub Actions の設定

### 必要な GitHub Secret

GitHub リポジトリの **Settings → Secrets and variables → Actions** に以下を追加:

| Secret 名 | 取得場所 |
|-----------|----------|
| `VERCEL_TOKEN` | Vercel ダッシュボード → Account Settings → Tokens → **Create Token** |

### デプロイフロー

`.github/workflows/deploy.yml` が以下を制御します:

- すべての push・PR → **CI チェック**（ビルド検証）を実行
- `develop` への push → **ステージング**に自動デプロイ
- `main` への push → **本番環境**に自動デプロイ

---

## Stripe Webhook の設定

### ステージング用 Webhook

1. [Stripe ダッシュボード（テストモード）](https://dashboard.stripe.com/test/webhooks) を開く
2. **Add endpoint** → `https://pixdone-bwm6.vercel.app/api/billing/stripe-webhook`
3. 以下のイベントを選択:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. 発行された **Signing secret** を `pixdone-bwm6` の `STRIPE_WEBHOOK_SECRET` に設定

### 本番用 Webhook

1. [Stripe ダッシュボード（本番モード）](https://dashboard.stripe.com/webhooks) を開く
2. **Add endpoint** → `https://pixdone.akizony.com/api/billing/stripe-webhook`
3. 同じイベントを選択
4. 発行された **Signing secret** を `pixdone` の `STRIPE_WEBHOOK_SECRET` に設定

---

## ローカル開発

```bash
# .env を用意
cp .env.example .env
# .env を編集（Stripe は sk_test_... を使用）

# 依存関係インストール
npm install
cd app && npm install && cd ..

# サーバー起動（ポート 5000）
npm run dev

# フロントエンド起動（ポート 5173）
cd app && npm run dev

# Stripe Webhook をローカルに転送（Stripe CLI が必要）
stripe listen --forward-to localhost:5000/api/billing/stripe-webhook
```

---

## データベース

| 環境 | Supabase プロジェクト |
|------|----------------------|
| 本番 | 現在使用中のプロジェクト |
| ステージング | 別途作成を推奨（本番データを汚染しないため） |

ステージング用 DB を作成する場合:
1. https://supabase.com で新規プロジェクトを作成
2. `DATABASE_URL` を取得（Transaction Pooler / Port 6543）
3. `pixdone-bwm6` の Environment Variables に設定
4. マイグレーションを実行: `DATABASE_URL=<staging-url> npm run db:migrate`
