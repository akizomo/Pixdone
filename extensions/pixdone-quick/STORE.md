# PixDone Quick — Chrome Web Store submission text

This document collects every piece of text the Chrome Web Store will ask
for during submission, plus the source for the public Privacy Policy
that the listing must link to. Edit here, then paste into the Developer
Dashboard (and publish the policy at a stable HTTPS URL).

---

## 1. Single Purpose

> **EN.** PixDone Quick lets users capture and complete tasks against
> their PixDone account from any web page they are browsing, so they can
> turn a page they're reading into a task without switching tabs.

> **JA.** PixDone Quick は、ユーザーが閲覧中のあらゆる Web ページから
> PixDone アカウントのタスクを追加・完了できるようにする拡張機能です。
> ページを離れずに「読んでいる内容をタスク化する」ことに用途を絞っています。

The extension does one thing: bridge the active web page and the user's
PixDone task list. Every permission requested below exists only to make
that single flow work.

---

## 2. Permission Justifications

Paste these into the Chrome Web Store "Privacy practices" tab. Each
permission's text is short on purpose — reviewers approve faster when
the justification stays scoped to a concrete user-visible feature.

### `storage`
Stores the user's Firebase auth token, signed-in email, premium flag,
and panel preferences (language, sound on/off, last-used view, last-used
list) in `chrome.storage.local` so the panel restores its state on the
next page load and the user does not have to sign in again.

### `activeTab`
Reads the current tab's title and URL only when the user explicitly opens
the panel or invokes "Add to PixDone" from the right-click menu, so the
new task can be pre-filled with a link back to the page they were
reading.

### `scripting`
Injects the PixDone Quick content script into tabs that were already open
when the extension was installed or reloaded. Manifest V3 does not
auto-inject into pre-existing tabs, so without `scripting` the keyboard
shortcut and "Add to PixDone" right-click would silently fail on those
tabs.

### `contextMenus`
Adds a single "Add to PixDone" entry to the page and selection right-click
menus. No other menu items are registered.

### `alarms`
Schedules a background alarm that refreshes the user's Firebase ID token
shortly before it expires (1 hour). Without this, users would be silently
signed out every hour and would have to re-link the extension manually.

### Host permissions
- `https://pixdone.vercel.app/*` (canonical) and
  `https://pixdone.akizony.com/*` (legacy alias) — receive the Firebase
  ID token from the PixDone web app's `/extension-link` page when the
  user signs in, and read their premium status from
  `/api/billing/entitlements`.
- `https://securetoken.googleapis.com/*` — Firebase's official token
  refresh endpoint, used by the background alarm above.
- `https://firestore.googleapis.com/*` — read and write the user's own
  tasks and lists in their PixDone Firestore documents.

### Content scripts on `<all_urls>`
The panel is a "from any page" tool, so the content script that mounts
it must be allowed to run on whichever page the user has open when they
press the keyboard shortcut. The script does **not** read page content;
it only mounts an isolated Shadow DOM panel and listens for keyboard /
right-click activations.

### Remote code
The extension does not load or execute any remote code. All JavaScript
ships inside the extension package; the only network calls are the
Firebase / PixDone API endpoints listed above and font/asset fetches
from the extension's own origin.

---

## 3. Data Usage Disclosure (for the Privacy practices form)

Tick these in the Developer Dashboard:

- **Personally identifiable information** — _Yes._ Email and Firebase UID
  are stored locally to identify the signed-in user.
- **Authentication information** — _Yes._ Firebase ID token + refresh
  token stored in `chrome.storage.local`.
- **Personal communications** — _No._
- **Financial and payment information** — _No._
- **Health information** — _No._
- **Location** — _No._
- **Web history** — _No._ The extension reads only the active tab's
  title/URL, only when the user explicitly invokes capture, and only
  attaches them to the task the user is creating. No browsing history is
  stored or transmitted.
- **User activity** — _Yes._ Tasks the user creates (title, details,
  due date, priority, list, repeat, subtasks) are stored in the user's
  own PixDone Firestore documents.
- **Website content** — _No._ The extension does not scrape page DOM.

Certifications:
- ✅ Does not sell or transfer user data to third parties outside of
  approved use cases.
- ✅ Does not use or transfer user data for purposes unrelated to the
  extension's single purpose.
- ✅ Does not use or transfer user data to determine creditworthiness or
  for lending purposes.

---

## 4. Privacy Policy (publish at a stable HTTPS URL)

> Canonical URL: `https://pixdone.vercel.app/extension/privacy` (also
> reachable at `https://pixdone.akizony.com/extension/privacy` since
> both domains point at the same Vercel deployment). Paste the
> vercel.app URL into the "Privacy policy" field in the Developer
> Dashboard. Both the English and Japanese versions live at the same
> URL via a language toggle.

---

### English

**Last updated: 2026-05-03**

PixDone Quick ("the extension") is a Chrome extension published by
PixDone. This policy describes what data the extension collects, how it
is used, and the choices available to you.

#### What the extension collects

- **Account information.** When you sign in, the extension receives your
  Firebase ID token, refresh token, signed-in email address, Firebase
  UID, and PixDone+ subscription flag from the PixDone web app. These
  are stored on your device only, in `chrome.storage.local`.
- **Tasks and lists.** Tasks and lists you create, edit, or complete
  through the extension are saved into your own PixDone Firestore
  documents. The data model is identical to the PixDone web app — the
  extension is a thin client over the same database.
- **Page context you choose to attach.** When you opt in to "Capture
  this tab", the extension copies the current tab's title and URL into
  the task you are creating. Nothing on the page itself is read or
  uploaded; only the title and address bar URL the browser already
  displays.
- **Local preferences.** The extension stores your interface preferences
  (language, sound on/off, last-used view, last-used list) on your
  device only.

The extension does **not** collect:

- Browsing history outside of the tab(s) you actively capture.
- Page DOM, form contents, cookies, or anything you have not explicitly
  attached to a task.
- Telemetry, analytics, or usage metrics. There is no tracking pixel,
  GA, Sentry, or comparable third-party SDK.

#### How we use the data

- **Authenticate you** with Firebase Authentication and refresh your
  session before it expires.
- **Read and write the tasks and lists you own** in PixDone's Firestore
  database.
- **Verify your PixDone+ entitlement** so premium completion effects can
  unlock for paying subscribers.

We do not sell, rent, or share your data with third parties. We do not
use your data for advertising or profiling. We do not use your data to
train machine-learning models.

#### Where the data lives

- On your device, in Chrome's encrypted `chrome.storage.local` — auth
  token, refresh token, email, UID, premium flag, preferences.
- On Google Cloud Firestore, in the same project that powers the
  PixDone web app — your tasks and lists. Firebase processes data on
  Google's infrastructure under
  [Google's privacy policy](https://policies.google.com/privacy) and
  [Firebase data processing terms](https://firebase.google.com/terms/data-processing-terms).

#### Your choices

- **Delete locally stored data.** Sign out from the panel's account
  menu, or remove the extension from `chrome://extensions`. Either
  action clears every value the extension wrote to
  `chrome.storage.local`.
- **Delete server-side data.** Delete tasks and lists from the PixDone
  web app or Quick panel; closing your PixDone account from the web
  app's account settings deletes the underlying Firestore documents.
- **Stop sharing page context.** Toggle off "Capture this tab" before
  saving a task — the extension will create the task with no URL or
  title attached.

#### Children

The extension is not directed to children under 13 and we do not
knowingly collect data from them.

#### Changes to this policy

We may update this policy as the extension evolves. Material changes
will be reflected in the "Last updated" date above and in the extension
release notes.

#### Contact

Questions about this policy or your data:
**contact@akizony.com**

---

### 日本語

**最終更新日: 2026-05-03**

PixDone Quick（以下「本拡張」）は PixDone が提供する Chrome 拡張機能で
す。本ポリシーでは、本拡張が収集するデータ、利用方法、ユーザーが取れる選
択肢を説明します。

#### 収集する情報

- **アカウント情報。** サインイン時、PixDone Web アプリから Firebase ID
  トークン、リフレッシュトークン、メールアドレス、Firebase UID、
  PixDone+ サブスクリプションフラグを受け取ります。これらはお使いの端末
  内 (`chrome.storage.local`) にのみ保存されます。
- **タスクとリスト。** 本拡張で作成・編集・完了したタスクとリストは、
  ご自身の PixDone Firestore ドキュメントに保存されます。データモデル
  は PixDone Web アプリと同一で、本拡張は同じデータベースを参照する薄
  いクライアントです。
- **ユーザーが添付を選んだページ情報。**「このタブを貼り付け」を有効に
  した場合に限り、現在のタブのタイトルと URL を作成中のタスクにコピー
  します。ページの中身は読み込まず、ブラウザがすでに表示しているタイト
  ルとアドレスバーの URL のみを利用します。
- **ローカル設定。** 言語、サウンド ON/OFF、最後に使った view、最後に
  選んだリストなどの UI 設定を端末内にのみ保存します。

本拡張は以下を収集しません:

- ユーザーが明示的にキャプチャしたタブ以外の閲覧履歴。
- ページの DOM、フォーム入力、Cookie、その他ユーザーがタスクに添付し
  ていない情報。
- テレメトリ・アナリティクス・利用統計。トラッキングピクセル、GA、
  Sentry 等の第三者 SDK は組み込まれていません。

#### 利用目的

- **認証と Firebase 経由のセッション維持。** トークンが期限切れになる
  前に自動更新します。
- **ユーザー所有のタスク・リストの読み書き。** PixDone の Firestore
  データベースに対してのみ行います。
- **PixDone+ サブスクリプション状態の確認。** プレミアム完了エフェクト
  を有料ユーザー向けに解放するために用います。

データを第三者に販売・賃貸・共有することはありません。広告配信や行動プ
ロファイリング、機械学習モデルの学習には利用しません。

#### データの保存先

- お使いの端末の Chrome 暗号化ストア (`chrome.storage.local`) — 認証
  トークン、リフレッシュトークン、メールアドレス、UID、premium フラ
  グ、設定。
- Google Cloud Firestore（PixDone Web アプリと同一プロジェクト）—
  タスクとリスト。Firebase は
  [Google プライバシーポリシー](https://policies.google.com/privacy?hl=ja)
  および
  [Firebase データ処理規約](https://firebase.google.com/terms/data-processing-terms)
  に従って処理します。

#### ユーザーの選択肢

- **端末内データの削除。** パネルのアカウントメニューからサインアウト、
  または `chrome://extensions` から本拡張を削除してください。いずれの
  操作でも `chrome.storage.local` 内の本拡張のデータが消去されます。
- **サーバー側データの削除。** PixDone Web アプリまたは Quick パネル
  からタスク・リストを削除できます。アカウント自体を Web アプリのアカ
  ウント設定から削除すると、関連する Firestore ドキュメントも削除され
  ます。
- **ページ情報の添付を停止。** タスク保存前に「このタブを貼り付け」を
  OFF にすると、URL とタイトル無しでタスクが作成されます。

#### 子どもの個人情報について

本拡張は 13 歳未満を対象としておらず、意図的にそのような情報を収集する
ことはありません。

#### 本ポリシーの変更

拡張機能の進化に合わせて本ポリシーを更新する場合があります。重要な変更
は冒頭の最終更新日とリリースノートで告知します。

#### お問い合わせ

ポリシーやデータに関するご質問:
**contact@akizony.com**

---

## 5. Submission Checklist

Before clicking "Submit for review":

- [ ] Privacy Policy URL is reachable over HTTPS and contains the text
      from §4.
- [ ] Single Purpose (§1) pasted into the Dashboard.
- [ ] Each permission justification (§2) pasted into the Dashboard.
- [ ] Data usage form (§3) ticked exactly as listed.
- [ ] Production build (`npm run build`) packed and uploaded — confirm
      the bundled `manifest.json` has **no** `localhost` entries.
- [ ] At least one screenshot at 1280×800 uploaded (Today / Plan / Lists
      views recommended).
- [ ] Promotional small tile 440×280 uploaded.
- [ ] Author email + homepage URL in the Developer Dashboard match the
      values in `manifest.config.ts`.
