# React 版のデプロイと本番切り替え

## 現状

- **本番**: Vanilla JS 版がルート（`/`）で配信されている（`vercel.json` の `public/` → `/`）。
- **React 版**: `app/` 配下の Vite + React アプリ。テスト用に別 URL でデプロイ可能。

---

## 1. テスト用に React 版を別デプロイする

React 版だけを別の URL で公開し、本番の Vanilla には触れずに検証したい場合の手順です。

### 方法: Vercel で「アプリのルートを `app` にする」別プロジェクトを作る

1. **Vercel ダッシュボード**
   - 同じリポジトリ（Bitdone）を**もう一つのプロジェクト**として追加する。
   - 例: プロジェクト名 `bitdone-react` や `pixdone-react-preview` など。

2. **プロジェクト設定**
   - **Root Directory**: `app` に設定する。
   - **Framework Preset**: Vite のまま（または Other）。
   - **Build Command**: `npm run build`（`app/vercel.json` で指定済みなら省略可）。
   - **Output Directory**: `dist`（同上）。
   - 環境変数は本番プロジェクトと同様に設定（Firebase など）。

3. **デプロイ**
   - デプロイ後、`xxx.vercel.app` のような専用 URL で React 版にアクセスできる。
   - 本番の Vanilla 版（メインプロジェクト）は従来どおり `/` のまま。

### 補足

- `app/vercel.json` で SPA 用のリライトを入れてあるため、`/` 以外のパスでも React ルーティングが動作する。
- 本番と同じ Firebase プロジェクトを使う場合は、環境変数だけ揃えればデータは同じものを参照できる。

---

## 2. 本プロダクトを React に切り替える（移行後）

問題なく使えると判断したら、**メインプロジェクトの配信を React に切り替える**手順です。

### 2.1 やることの概要

- メインの Vercel プロジェクトで「ルートを `app` にし、ビルド結果をルート（`/`）で配信する」ようにする。
- 必要なら Vanilla 版は `/vanilla` など別パスに残す（任意）。

### 2.2 リポジトリ側の変更

1. **ルートの `vercel.json` を書き換える**
   - 現在: `/` → `public/index.html`（Vanilla）、`/api/*` → API。
   - 変更後例:
     - API はそのまま。
     - 静的配信を **React のビルド結果** にするため、Vercel の「Root Directory」を `app` にし、Output を `dist` にする運用にするか、  
       またはルートでビルドして `app/dist` を配信するように rewrites を組み替える。

   **パターン A: メインプロジェクトの Root Directory を `app` にする（推奨）**
   - Vercel のプロジェクト設定で **Root Directory** を `app` に変更。
   - Build Command: `npm run build`、Output Directory: `dist`。
   - ルートの `vercel.json` は **API 用のプロジェクト**（ルートがリポジトリルートの別プロジェクト）で使うか、または `app` をルートにした場合は `app/vercel.json` だけが使われるため、API を同じリポジトリで動かす場合は Vercel の「Monorepo」や複数プロジェクトで役割を分ける必要あり。

   **パターン B: ルートはリポジトリルートのまま、ビルドで React を `public` に出力する**
   - ルートで `app` をビルドし、その結果を `public/` に出力するスクリプトを用意する。
   - `vercel.json` の rewrites で `/` をその `public/index.html`（React）に向ける。
   - この場合、`app/vite.config.ts` で `base: '/'` のまま、ビルド出力先をルートの `public` に変更するか、ビルド後に `app/dist` の内容を `public/` にコピーする。

   運用を簡単にするなら **パターン A** がおすすめです。  
   その場合、**API が同じリポジトリのルート（`api/` など）にある**ときは、Vercel 上で「API 用のプロジェクト」と「React 用のプロジェクト」の 2 本立てにするか、`app` をルートにしたうえで API を `app/api` に移すか、いずれかの構成が必要です。

2. **Vanilla を残す場合（任意）**
   - 現在の `public/` を `public-vanilla/` などに退避し、`vercel.json` で `/vanilla` → `public-vanilla/index.html` のようにリライトする。
   - または、別プロジェクト（テスト用に作った Vanilla 用プロジェクト）でルートを `public` にして `/` で Vanilla を配信する。

### 2.3 Vercel ダッシュボードでの設定（パターン A の場合）

- **Root Directory**: `app`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci` または `npm install`（`app` 配下で実行される）

これで、同じリポジトリのメインプロジェクトが React 版をルート（`/`）で配信する形になります。

**注意**: 現在ルートの `vercel.json` で `/api/*` をルートの `api/` に転送している場合、Root Directory を `app` にするとその設定は使われず、API は別プロジェクトで配信するか、`app` 内に API を移す必要があります。

### 2.4 切り替え後の確認

- ルート `/` で React 版が表示されること。
- 認証・Firebase 連携・タスク操作が本番と同様に動くこと。
- （Vanilla を残した場合）`/vanilla` で従来版が開けること。

---

## まとめ

| 目的 | 手順 |
|------|------|
| **テスト用に React を別 URL でデプロイ** | 同じリポジトリで「Root Directory = `app`」の**別 Vercel プロジェクト**を作成し、そちらでデプロイ。本番の Vanilla は変更しない。 |
| **本番を React に切り替える** | メインの Vercel プロジェクトの Root を `app` にし、Build/Output を Vite の `npm run build` / `dist` にする。必要に応じて API や Vanilla のパスを上記のとおり調整する。 |
