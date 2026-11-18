# App Review 再提出メモ（Guideline 2.1 Information Needed, 2026-11-06 提出分）

App Store Connect → アプリ → 1.0 → 「App Review に関する情報」→ **メモ** に、下の英文を貼ります（上限 4,000 字。下の文は約 3,800 字。足すと超えるので注意）。
`<<...>>` の部分を埋めてください。

---

## 0. 2026-11-10 のリジェクト（ビルド 7）への対応

### Guideline 2.1(b): 課金アイテムが審査に出ていない
コードの変更は不要です。App Store Connect で次の作業をします。
1. 収益化 → サブスクリプション → `pixdone_plus_monthly` / `pixdone_plus_yearly` のそれぞれに、**審査用スクリーンショット**（アプリ内の PixDone+ 購入画面）、表示名・説明（en / ja）、価格を入れ、状態を「提出準備完了」にする
2. バージョン 1.0 のページ →「App 内課金とサブスクリプション」で、2つを追加する（最初のサブスクリプションは、アプリのバージョンと一緒にしか審査に出せない）
3. **ビルド 8** を上げて、このバージョンに選び直して再提出する

### Guideline 2.5.4: バックグラウンド音声（UIBackgroundModes: audio）
`audio` は**残します**。集中タイマーの BGM は、アプリを離れたり画面をロックしたりしても、タイマーが終わるまで鳴り続けます。終わったら BGM を止めて完了音を鳴らします（`FocusServicePlugin.swift`、`AVAudioSession` を `.playback` に設定）。`audio` を外すと、ホームに戻ったときに BGM が止まります。
- 実機で録画する: タイマーボタン →「BGM オン」を見せる → 開始 → **ホーム画面に戻って 20〜30 秒、BGM が鳴り続けるところを撮る**（ロック画面のライブアクティビティも映すとよい）
- ネイティブの BGM は音量 0.06 で固定なので、**端末の音量を大きめにして**撮る
- 動画を、審査への返信と下の Notes の両方に添付する。Notes（下の英文。Focus timer の行に BGM の説明を入れ済み）も貼り直す

**審査への返信（Resolution Center）用の英文**
```
PixDone includes a Pomodoro focus timer that plays background music (BGM) while the timer runs. The music is intended to keep playing when the user leaves the app or locks the screen, until the timer ends, at which point the app stops the music and plays a completion chime. This is why "audio" is declared in UIBackgroundModes.

To reproduce: sign in → tap the timer button on the main screen → make sure "BGM ON" is shown → start the timer → go to the Home Screen. The music continues playing in the background.

A screen recording on a physical iPhone showing this:
https://drive.google.com/file/d/1YizxfjXkX5a0Vt4P2MkC7XsLyLj-vio1/view

We have also submitted the PixDone+ subscriptions (monthly and yearly) for review together with the new build.
```

---

## 1. Notes に貼る英文

```
1. Screen recording
Recorded on a physical iPhone (<<機種>>, iOS <<バージョン>>), starting from app launch. Video: https://drive.google.com/file/d/1EKVIdABLJEbQ5ZobISzOVdm9pSOH3UDq/view
It shows: launch → sign-in → creating a task → completing ("smashing") a task → Smash List → focus timer with music continuing on the Home Screen → Collection → PixDone+ subscription purchase (sandbox) and restore → account deletion.

2. Purpose and target audience
PixDone is a to-do list app that makes finishing tasks feel rewarding. Each time the user completes a task, a random pixel-art animation and sound plays ("smash"). Effects can be collected and evolve with use.
Problem it solves: traditional task managers ask users to organize, categorize and prioritize before they act, and give no feedback when a task is done. PixDone removes that friction and restores the satisfaction of crossing an item off a paper list.
Target audience: people who enjoy games and playful UI and want a simple daily to-do list, and people who feel overwhelmed by complex productivity tools. It is a personal app (no team or business features). Age 13+.

3. How to access the main features
An account is required so tasks sync across devices and the subscription is tied to the user.
The demo account (email sign-in) is entered in the "Sign-in information" fields above.
Sign in with Apple and Sign in with Google are also available.
- Write: tap "+" to add a task. Tasks can have subtasks, notes, due dates and daily/weekly repeats.
- Smash: tap a task's checkbox to complete it and see the effect. The "Smash List" tab has a dedicated smash button.
- Lists: free users can create up to 3 lists; PixDone+ removes the limit.
- Focus timer: timer button on the main screen. With "BGM ON", its music keeps playing on the Home Screen and lock screen until the timer ends (why "audio" is in UIBackgroundModes). Recording: https://drive.google.com/file/d/1YizxfjXkX5a0Vt4P2MkC7XsLyLj-vio1/view
- Collection: shows owned effects and themes. Completing 10 tasks in a regular list unlocks the "Fighter" effect for free.
- Import from Reminders (optional): copies incomplete items from Apple Reminders once, only after the user grants access. Reminders are never modified.
- PixDone+ (auto-renewable subscription, ¥300/month or ¥3,000/year, 7-day free trial): Account → "PixDone+" → choose a plan. Purchases use In-App Purchase via StoreKit (through RevenueCat). "Restore purchases" is on the same page. Unlocks unlimited lists, all themes and Rare/Epic effects.
- Account deletion: Account page → "Delete account" at the bottom → confirm. All tasks, lists and account data are deleted. For Sign in with Apple users, the Apple token is revoked.
- No user-generated content is shared with other users (tasks are private), so there is no reporting or blocking feature. No ads.

4. External services
- Firebase Authentication (Google): sign-in with email, Apple and Google
- Firebase Analytics / Google Analytics 4: anonymous usage analytics (no ads, no tracking across apps)
- Cloud Firestore (Google): progress counters
- Supabase (PostgreSQL): stores tasks and lists
- Vercel: hosts the web app and API server
- RevenueCat + Apple In-App Purchase: subscriptions on iOS
- Stripe: subscriptions on the web version only (not used in the iOS app)
- Apple EventKit: optional Reminders import, on device
No AI services are used.

5. Regional differences
The app functions the same in all regions. The UI is available in English and Japanese. It follows the device language by default and can be switched in Account → "En / Ja". Subscription prices follow the App Store price tiers for each storefront.

6. Regulated industry / third-party material
Not applicable. PixDone is not in a regulated industry. All artwork, effects and sounds are original or used under licenses that permit commercial use.
```

---

## 2. 録画の撮り方（実機で、あなたがやること）

Apple の条件: **実機・最新の iOS・アプリの起動から始める**。下の順で1本に撮ります（3〜5分が目安）。

1. 設定 → コントロールセンター に「画面収録」を追加。iOS を最新にしておく
2. **アプリを完全に終了した状態**で録画を開始 → ホーム画面からアプリを起動
3. ウェルカム画面 → ログイン（審査用アカウント、または新規登録の流れを見せる）
4. タスクを追加 → チェックで完了（エフェクトが出る）→ サブタスク・繰り返しを軽く
5. Smash List タブ → スマッシュボタン
6. フォーカスタイマーを開始（BGM オン）→ ホーム画面に戻って BGM が鳴り続けるのを見せる → アプリに戻って止める
7. コレクション画面
8. アカウント → PixDone+ → プランを選んで購入（**Sandbox のテスト用 Apple アカウント**で）→ 有料テーマに切り替えて使えることを見せる → 「購入を復元」
9. アカウント → 「アカウントを削除」→ 確認 → ログイン画面に戻る
   - 審査用アカウントは消さないこと。**削除は別に作ったテスト用アカウント**で撮る（録画の途中でログアウト → テスト用で入り直す、で可）

録画のアップロード先は、ログインなしで見られるリンクにします（iCloud Drive / Google Drive）。

## 3. 提出前の確認

- [ ] 審査用アカウントが本番でログインできる（メール確認済みの状態）
- [ ] サブスク2つ（`pixdone_plus_monthly` / `pixdone_plus_yearly`）に審査用スクリーンショットが入り、「審査待ち」としてこのバージョンに添付されている（ガイドライン 2.1(b) / 3.1.1）
- [ ] 提出するビルドが 8 以降（ビルド 7 は審査済み）
- [ ] バックグラウンドで BGM が鳴り続ける録画を、返信と Notes に添付した（ガイドライン 2.5.4）
- [ ] スクリーンショットが実際のアプリ画面（2.3.3）
- [ ] 提出するビルドを TestFlight で実機確認した
