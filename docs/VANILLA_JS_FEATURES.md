# PixDone Vanilla.js 版 機能一覧・受け入れ条件

現行の `public/` 配下の vanilla.js アプリの機能と、各機能の**受け入れ条件**（AC）を整理した一覧です。React 移行時の検証チェックリストとして利用できます。

---

## 1. アプリ基盤

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 1.1 | アプリ初期化 | DOMContentLoaded 後に setupAfterDOMLoaded で i18n / コンポーネント / Auth / イベント / Pager スワイプ / キーボードショートカットをセットアップ | `initializeApp`, `setupAfterDOMLoaded` |
| 1.2 | グローバル公開 | `window.pixDoneApp` で PixDoneApp インスタンスを公開（インライン編集の onclick 等から参照） | `setupGlobalAccess` |
| 1.3 | 同期インジケータ | サインイン時の同期状態表示（現在は常に非表示） | `setupSyncIndicator`, `updateSyncIndicatorVisibility` |
| 1.4 | UI コンポーネント検証 | 起動後 1 秒で必須要素の存在チェック（デバッグ用） | `validateUIComponents` |
| 1.5 | 日付ロールオーバー | 次のローカル深夜 + visibilitychange でタスク/タブの再描画（「明日」→「今日」の自動更新） | `setupDayRolloverRefresh`, `triggerDayRolloverRefresh` |

**受け入れ条件（1. アプリ基盤）**

- **1.1** ページ読み込み後、リストタブ・タスク一覧・言語・認証状態が正しく表示されること。リロードしても再現すること。
- **1.2** コンソールで `window.pixDoneApp` を参照すると PixDoneApp インスタンスが返ること。インライン編集の「Today」等の onclick が動作すること。
- **1.3** 同期インジケータは常に非表示のままであること。
- **1.4** （任意）起動後 1 秒経過時、必須要素が存在しない場合にコンソールで検証結果が分かること。
- **1.5** 期限「明日」のタスクが、アプリを開いたまま日付が変わった後（またはタブを切り替えて戻った後）、「今日」として表示・ハイライトされること。リロードなしで反映されること。

---

## 2. 認証・アカウント

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 2.1 | Firebase Auth 監視 | onAuthStateChanged でログイン/ログアウトを検知し、Firestore リスナー設定 or ローカルデータ切替 | `setupFirebaseAuthListener` |
| 2.2 | メールサインアップ/ログイン | メール+パスワードで登録・ログイン。モーダルで Sign up / Log in 切り替え | `showEmailAuthModal`, `toggleEmailAuthMode`, `emailAuthForm` submit |
| 2.3 | パスワード表示トグル | 認証フォーム・パスワード設定フォームのパスワード表示/非表示 | `togglePasswordVisibility` |
| 2.4 | パスワードリセット | メールでリセットリンク送信。専用モーダル | `showPasswordResetModal`, `passwordResetForm` submit |
| 2.5 | パスワード設定 | リセットリンク経由で新パスワード設定。確認用入力あり | `showPasswordSetupModal`, `passwordSetupForm` submit |
| 2.6 | アカウント削除 | 確認モーダル後に Firebase ユーザー削除 | `showDeleteAccountModal`, `confirmDeleteAccount` |
| 2.7 | ユーザーメニュー | アバターボタンでドロップダウン表示（メール・サウンド・言語・ログアウト・アカウント削除） | `toggleUserDropdown`, `userAvatarBtn` |
| 2.8 | ログアウト時クリーンアップ | Firestore リスナー解除、allTasksUnsubscribe、taskCountsByListId クリア、ローカルデータ再読込 | onAuthStateChanged (user === null) |

**受け入れ条件（2. 認証・アカウント）**

- **2.1** ログイン後は Firestore のリスト・タスクが表示され、ログアウト後はローカルデータ（Tutorial 等）が表示されること。
- **2.2** 未登録メール+パスワードでサインアップでき、登録済みでログインできること。「Log in」切替でログインモードになり、送信でログインできること。
- **2.3** パスワード欄の目のアイコンで、入力内容の表示/非表示が切り替わること。
- **2.4** 「Forgot your password?」からリセットモーダルを開き、メール送信後に送信完了のフィードバックがあること。
- **2.5** リセットリンクからパスワード設定モーダルを開き、新パスワード・確認を一致させて送信するとパスワードが更新されること。
- **2.6** 「Delete Account」→ 確認モーダルで「Delete Account」を押すとアカウントが削除され、未ログイン状態になること。
- **2.7** ログイン後、アバタークリックでドロップダウンが開き、メール・サウンド・言語・ログアウト・アカウント削除が表示・操作できること。
- **2.8** ログアウト後、タブのタスク数バッジがローカルデータに基づいて表示され、Firestore 購読が解除されていること（他タブで追加したタスクが残っていない等で判断可能）。

---

## 3. リスト管理

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 3.1 | リスト一覧表示 | タブ形式。Smash → My Tasks/Tutorial → その他 の順。タブクリックでリスト切替 | `renderListTabs`, `listTabs` click |
| 3.2 | リスト追加 | モーダルでリスト名入力して作成。Firestore または localStorage に保存 | `showCreateListModal`, `createListForm` submit, `addListToFirestore` |
| 3.3 | リスト編集（名前変更） | コンテキストメニュー「Rename」→ 編集モーダルで名前変更 | `showListContextMenu`, `contextMenuEdit`, `showEditListModal`, `editListForm` submit |
| 3.4 | リスト削除 | コンテキストメニュー「Delete」→ 確認モーダル。Firestore の場合は当該 listId の tasks も削除 | `showDeleteListModal`, `confirmDeleteList`, `deleteListFromFirestore` |
| 3.5 | リストコンテキストメニュー | タブ右クリック or リストメニューボタン（…）で Rename / Delete を表示。My Tasks ではメニュー非表示 | `showListContextMenu`, `hideContextMenu`, `listMenuBtn` |
| 3.6 | リストヘッダー | 現在リストの名前を表示。My Tasks は i18n の「My Tasks」 | `updateListTitle`, `listTitle` |
| 3.7 | タブの未完了タスク数バッジ | Smash 以外のタブに件数表示。ログイン時は listenAllTasksFromFirestore の結果（taskCountsByListId）を使用 | `renderListTabs`, `listenAllTasksFromFirestore` |
| 3.8 | タブのスクロール | アクティブタブが中央付近に来るよう横スクロール | `scrollToActiveTab` |
| 3.9 | リスト切替アニメーション | 左右スワイプ/矢印キー時にコンテンツのスライドアニメ | `animateListSwitch`, `switchToList` |
| 3.10 | デフォルトリスト確保 | 起動時にリストが空なら default（Tutorial）リストを生成 | `ensureDefaultList`, `loadLists` |
| 3.11 | リスト永続化 | ゲスト: localStorage。ログイン: Firestore `lists` | `saveLists`, `loadLists` |

**受け入れ条件（3. リスト管理）**

- **3.1** タブの並びが「💥 Smash」→「My Tasks」or「Tutorial」→ その他 の順であること。タブクリックで表示リストが切り替わり、ヘッダー名が変わること。
- **3.2** 「+」でモーダルが開き、リスト名を入力して Create で新リストが追加され、タブに反映されること。リロード後も残ること。
- **3.3** リストタブの「…」または右クリックで Rename を選ぶと編集モーダルが開き、名前変更して Save でヘッダー・タブが更新されること。
- **3.4** リストの Delete を選び確認で削除すると、そのリストと配下タスクが消えること（Firestore の場合は当該 listId の tasks も削除されること）。
- **3.5** My Tasks のタブでは「…」を押してもコンテキストメニューが出ないこと。他リストでは Rename / Delete が表示されること。
- **3.6** リスト切替時にヘッダーが現在のリスト名になること。My Tasks は言語設定に応じて「My Tasks」/「マイタスク」等になること。
- **3.7** 各タブ（Smash 除く）に未完了タスク数が表示されること。ログイン時、別リストでタスクを追加/完了すると、そのリストを開かずともバッジが更新されること。
- **3.8** タブが多くて横スクロールする場合、アクティブタブが視野の中央付近にスクロールされること。
- **3.9** 矢印キーやスワイプでリストを切り替えたとき、コンテンツがスライドするアニメーションが実行されること。
- **3.10** 初回訪問（ローカルにリストがない）時、Tutorial（default）リストが 1 つ存在すること。
- **3.11** ゲスト時はリストを追加/編集/削除すると localStorage に反映され、ログイン時は Firestore に反映されること。

---

## 4. タスク CRUD・表示

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 4.1 | タスク一覧描画 | 現在リストの未完了→完了の順で DOM 生成。通常リストと Smash リストで表示を分岐 | `renderTasks`, `renderTask`, `renderSmashTask` |
| 4.2 | タスク新規作成（デスクトップ） | 「Add a task」でインライン入力フォーム表示。タイトル・詳細・日付・繰り返しを入力して保存 | `showTaskInput`, `taskForm` submit, `saveTask` |
| 4.3 | タスク新規作成（モバイル） | 「Add a task」or FAB でボトムシートを表示。Smash リストでは追加不可 | `showTaskInput` (mobile branch), `showMobileModal` |
| 4.4 | タスク編集（デスクトップ） | タスククリックでインライン編集フォームを同じリスト内に表示 | `editTask`, `showInlineTaskEdit` |
| 4.5 | タスク編集（モバイル） | タスクタップでボトムシートを編集モードで開く | `editTask` → `showMobileModal`, `populateBottomSheetData` |
| 4.6 | タスク削除 | 削除ボタンで確認モーダル表示後、Firestore またはローカルから削除 | `deleteTask`, `showDeleteModal`, `confirmDeleteTask` |
| 4.7 | タスク完了トグル | チェックボックスで完了/未完了を切り替え。完了時は祝祭演出・Perfect Timing 連携 | `toggleTaskCompletion`, PerfectTimingManager |
| 4.8 | タスク未完了化 | 完了タスクのチェックを外すと未完了に戻す。フォーカスは次の未完了タスクのチェックへ | `toggleTaskCompletion` (completed → false), `focusNextTaskCheckbox` |
| 4.9 | インライン編集の保存/キャンセル | 保存で Firestore 更新 + ローカル反映。キャンセル or 外側クリックで閉じる | `saveInlineEdit`, `cancelInlineEdit`, `setupInlineEditClickOutside` |
| 4.10 | 新規タスク時のフォームクリア | モバイルで新規追加時に currentTask 等をリセット。ボトムシート閉じてもリセット | `showTaskInput` (mobile), `hideMobileModal` |

**受け入れ条件（4. タスク CRUD・表示）**

- **4.1** 未完了タスクが上、完了タスクが下に表示されること。Smash リストでは Smash 用の表示（ダミータスク）になること。
- **4.2** デスクトップで「Add a task」を押すと入力フォームが表示され、タイトル必須で保存すると一覧に追加されること。
- **4.3** モバイルで「Add a task」または FAB を押すとボトムシートが開くこと。Smash リストでは押しても何も起きないこと。
- **4.4** デスクトップでタスク行をクリックすると、その場にインライン編集フォームが開き、既存のタイトル・詳細・日付・繰り返しが入っていること。
- **4.5** モバイルでタスクをタップするとボトムシートが編集モードで開き、既存内容がプリフィルされていること。
- **4.6** 削除ボタンで確認モーダルが表示され、Delete でタスクが一覧から消え、永続化も削除されること。
- **4.7** チェックボックスで完了にすると祝祭が表示され、未完了にするとチェックが外れ一覧の未完了側に戻ること。
- **4.8** 完了タスクのチェックを外したとき、フォーカスが次の未完了タスクのチェックに移ること（存在する場合）。
- **4.9** インライン編集で Save を押すと変更が保存されフォームが閉じること。Cancel またはフォーム外クリックで閉じると変更は保存されないこと。
- **4.10** モバイルで一度タスクを編集して閉じた後、「Add a task」を開くとタイトル・詳細・日付が空であること。前の編集内容が残っていないこと。

---

## 5. タスク入力フォーム（共通・デスクトップ）

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 5.1 | タイトル入力 | input#taskTitle。Enter で保存（Shift+Enter は改行なし） | `taskTitle` keypress, `saveTask` |
| 5.2 | 詳細入力（リッチテキスト風） | contenteditable#taskDetails。ハイパーリンク貼り付け・マークダウン風リンク変換 | `taskDetails`, `handleHyperlinkPaste`, `setupRichTextEditor` |
| 5.3 | 今日/明日/カレンダー | Today / Tomorrow はトグル。カレンダーボタンで date input を同期的に showPicker | `selectDate`, `openCalendarPicker`, `customDatePicker` change |
| 5.4 | 繰り返し選択 | Repeat ボタンでセレクト表示。none / daily / weekly / monthly / yearly | `toggleRepeatSelector`, `repeatInterval` change |
| 5.5 | キャンセル / 削除 / 保存 | Cancel でフォーム非表示。Delete は編集時のみ表示。Save で保存 | `cancelBtn`, `deleteBtn`, `saveBtn` |
| 5.6 | カレンダーボタン文言更新 | 日付選択時に M/D 形式でボタンに表示 | `updateCalendarButtonText` |
| 5.7 | 日付のローカル YMD 統一 | 期限はすべてローカル日付 "YYYY-MM-DD" | `formatLocalYMD`, `getTodayYMD`, `getTomorrowYMD`, `normalizeDueYMD` |

**受け入れ条件（5. タスク入力フォーム）**

- **5.1** タイトル欄で Enter を押すとタスクが保存されること。Shift+Enter は改行ではなくそのまま Enter 扱いでよい。
- **5.2** 詳細欄に URL を貼り付けるとクリック可能なリンクとして扱われること。[text](url) 形式が表示用に変換されること。
- **5.3** Today / Tomorrow を押すと選択され、もう一度押すと解除されること。カレンダーボタンでネイティブの date picker が開くこと（ブラウザのユーザー操作制約内で開くこと）。
- **5.4** Repeat を押すとセレクトが表示され、none/daily/weekly/monthly/yearly を選べること。
- **5.5** Cancel でフォームが閉じること。編集時のみ Delete が表示され、押すと削除確認に進むこと。Save で保存されフォームが閉じること。
- **5.6** 日付を選ぶとカレンダーボタンに「M/D」形式で表示されること。
- **5.7** 保存される dueDate がローカル日付の "YYYY-MM-DD" であり、タイムゾーンによって「今日」がずれないこと。

---

## 6. モバイルボトムシート（タスク）

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 6.1 | ボトムシート開閉 | スライドアップ/ダウン。閉じる時に currentTask 等をクリア | `showMobileModal`, `hideMobileModal` |
| 6.2 | ヘッダー | 左に×、中央に「New Task」/「Edit Task」。Pixdone ルールのスタイル | task-sheet-header |
| 6.3 | タイトル・詳細入力 | contenteditable。詳細は空状態行と入力エリアの表示切替 | `#newTaskTitle`, `#newTaskDetails`, `updateSectionVisibility` |
| 6.4 | リンクプレビュー | タイトル/詳細に URL が含まれるとカード表示 | linkPreviewSection, linkPreviewCard |
| 6.5 | 日付ボタン | Today / Tomorrow / Pick。ネイティブ date picker はユーザージェスチャ内で同期実行 | `selectBottomSheetDate`, `showNativeDatePicker` |
| 6.6 | 繰り返し | Repeat ボタンでモーダル or トグル。選択後にボタンラベル更新 | `newRepeatBtn`, `showNewModalRepeat`, `updateRepeatButtonState` |
| 6.7 | サブタスク | リスト表示・追加（Enter/ボタン）・完了トグル・削除。サブタスク完了時は picoSound | `renderSubtasks`, `addSubtask`, `toggleSubtask`, `deleteSubtask` |
| 6.8 | 保存ボタン有効/無効 | タイトルが空なら無効化 | `updateSaveButtonState` |
| 6.9 | キーボード回避 | visualViewport でフッターをキーボード上に追従 | `setupKeyboardAvoidance`, `setupKeyboardScrollHandling` |
| 6.10 | 詳細の自動伸縮 | 4 行まで auto-grow | detailsInput input/paste/focus |

**受け入れ条件（6. モバイルボトムシート）**

- **6.1** 開くとき下からスライドし、×または閉じる操作で下にスライドして閉じること。閉じた後に再度開くと新規用で空であること。
- **6.2** ヘッダーが「× ボタン 左上」「タイトル 中央」のレイアウトで、New Task / Edit Task が切り替わること。
- **6.3** タイトル・詳細が contenteditable で入力でき、詳細は空なら「Add details…」等の空状態、フォーカスで入力エリアに切り替わること。
- **6.4** （実装次第）タイトル/詳細に URL を含めるとリンクプレビューカードが表示されること。
- **6.5** Today / Tomorrow / Pick が動作し、Pick でネイティブ date picker が確実に開くこと。
- **6.6** Repeat で繰り返しを選ぶとボタンラベルが更新されること。
- **6.7** サブタスクを追加・完了・削除でき、完了時にコンボ音が鳴ること。
- **6.8** タイトルが空のとき Save が無効（押せない or 押しても保存されない）であること。
- **6.9** キーボード表示時、フッターがキーボードの上に追従し、入力欄が隠れないこと。
- **6.10** 詳細欄が 4 行程度まで自動で高さが伸びること。

---

## 7. サブタスク（インライン編集・共通）

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 7.1 | サブタスク一覧表示 | 親タスクのインライン編集内でリスト表示 | `renderInlineSubtasks` |
| 7.2 | サブタスク追加 | 入力欄 + Enter または Add ボタン | `addInlineSubtask`, `setupInlineSubtasks` |
| 7.3 | サブタスク完了トグル | チェックで done 切り替え。picoSound | `toggleInlineSubtask` |
| 7.4 | サブタスク削除 | 削除ボタン | `deleteInlineSubtask` |
| 7.5 | サブタスク件数表示 | インライン編集ヘッダーの (N) | `updateInlineSubtasksCount` |
| 7.6 | サブタスク正規化 | id, text, done 必須。dueDate/details は任意 | `normalizeSubtask` |

**受け入れ条件（7. サブタスク）**

- **7.1** インライン編集またはボトムシートを開いたとき、既存サブタスクが一覧表示されること。
- **7.2** サブタスク入力欄に文字を入れて Enter または Add で追加され、一覧に表示されること。
- **7.3** サブタスクのチェックを入れると done になり、コンボ音が鳴ること。外すと未完了に戻ること。
- **7.4** サブタスクの削除ボタンでそのサブタスクが消えること。
- **7.5** ヘッダーの「Subtasks (N)」の N がサブタスク数と一致すること。
- **7.6** 保存時、サブタスクが id / text / done を必ず持ち、dueDate/details はあれば保存されること。

---

## 8. 期限・繰り返し（ロジック・表示）

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 8.1 | 期限ステータス | overdue / today / upcoming の算出 | `getDueStatus` |
| 8.2 | 期限の短いラベル | Today, Tomorrow, M/D。i18n の dueToday / dueTomorrow | `formatDueShortEN`, `formatDateDisplay` |
| 8.3 | 繰り返しの短いラベル | Daily, Weekly 等の i18n 表記 | `formatRepeatShortEN` |
| 8.4 | インライン編集の日付ボタン | Today / Tomorrow / カレンダー | `selectInlineDate`, `showInlineDatePicker`, `updateInlineDateButtons` |
| 8.5 | インライン編集の繰り返し | トグル + セレクトで interval 変更 | `toggleInlineRepeat`, `updateInlineRepeat`, `updateInlineRepeatSelector` |

**受け入れ条件（8. 期限・繰り返し）**

- **8.1** 期限が過去なら overdue、今日なら today、それ以降なら upcoming としてスタイル・表示が変わること。
- **8.2** 一覧で「今日」「明日」または日付が言語設定に応じて表示されること。
- **8.3** 繰り返し設定があるタスクで「毎日」「毎週」等の短いラベルが表示されること。
- **8.4** インライン編集で Today / Tomorrow / カレンダーを選ぶと、そのタスクの dueDate が更新され、ボタンがアクティブ表示になること。
- **8.5** インライン編集で繰り返しを変更すると、保存時に repeat が更新されること。

---

## 9. キーボード・ショートカット

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 9.1 | Escape | タスク入力/モーダル/祝祭/コンテキストメニューを閉じる。タイトルありなら保存して閉じる | keydown Escape |
| 9.2 | Enter（タイトル欄） | 新規タスク保存 | taskTitle keypress |
| 9.3 | ArrowLeft / ArrowRight | テキスト編集中でなければリスト切替。contenteditable/IME/input/textarea/select は除外 | keydown ArrowLeft/Right |
| 9.4 | Shift+長押し（Smash） | タスク完了時に Perfect Timing オーバーレイを開く（設定で無効化可） | `setupKeyboardShortcuts`, PerfectTimingManager |

**受け入れ条件（9. キーボード・ショートカット）**

- **9.1** タスク入力フォーム or ボトムシート表示中に Escape を押すと、タイトルが空ならキャンセルで閉じ、タイトルありなら保存して閉じること。各種モーダル・祝祭・コンテキストメニューも Escape で閉じること。
- **9.2** 新規タスクのタイトル欄にフォーカスがある状態で Enter を押すとタスクが保存されること。
- **9.3** タイトル・詳細・サブタスク入力欄などテキスト編集中は ArrowLeft/Right でリストが切り替わらないこと。編集中でないときは矢印でリストが切り替わること。IME 変換中もリストが切り替わらないこと。
- **9.4** （オプション）Smash リスト等でチェックを長押ししたときに Perfect Timing オーバーレイが開くこと（無効化設定の場合は開かないこと）。

---

## 10. スワイプ・ページャ

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 10.1 | 横スワイプでリスト切替 | contentBelowTabs で pointer イベントを検知し、閾値超えで前/次のリストへ | `setupPagerSwipe` |
| 10.2 | スワイプ中のテキスト選択無効化 | 編集中のときはスワイプしない | handlePointerDown 内の ae チェック |
| 10.3 | ページとリストの同期 | リスト数に応じて pager のページ数を増減 | `syncPagerPages`, `renderListPreviewIntoPage` |

**受け入れ条件（10. スワイプ・ページャ）**

- **10.1** モバイルでコンテンツ領域を横にスワイプすると、閾値を超えた場合に前/次のリストに切り替わること。
- **10.2** 入力欄や contenteditable にフォーカスがあるときは、スワイプでリストが切り替わらずテキスト選択が優先されること。
- **10.3** リストを追加/削除すると、ページ数がリスト数と一致し、各ページに正しいリストのプレビューが表示されること。

---

## 11. ドラッグ＆ドロップ並び替え

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 11.1 | タスクのドラッグ | タスク行をドラッグして未完了タスクの順序を変更 | `setupDragAndDrop`, `_startTaskDrag`, `_moveTaskDrag`, `_endTaskDrag` |
| 11.2 | ドロップ位置のインジケータ | 挿入位置にマーカー表示 | `showSimpleDropIndicator`, `removeDropIndicators` |
| 11.3 | 並び替えの適用 | 配列の並び替え + saveTasks + persistTaskOrder | `reorderTasks`, `reorderTasksWithAnimation`, `persistTaskOrder` |

**受け入れ条件（11. ドラッグ＆ドロップ並び替え）**

- **11.1** 未完了タスクの行をドラッグして別の位置にドロップすると、その順序で並び替えられること。
- **11.2** ドラッグ中、ドロップ先の挿入位置にインジケータ（線やスペース）が表示されること。
- **11.3** 並び替え後にリロードしても順序が保持されること。ログイン時は Firestore の order が更新されていること。

---

## 12. Smash List（💥）

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 12.1 | Smash リストの存在確保 | Firestore に「💥 Smash List」がなければ作成 | setupFirestoreRealtimeListeners |
| 12.2 | ダミータスクの生成 | 英語/日本語の定型文からランダムに 3 件生成 | `generateSmashTasks`, `getSmashListTasks` |
| 12.3 | タスク補充 | 未完了が 3 未満なら補充 | `replenishSmashTasks`, `maintainSmashListTasks` |
| 12.4 | 表示タイトル | 現在言語に応じて en/ja のタイトルを表示 | `getSmashTaskDisplayTitle` |
| 12.5 | 新規タスク追加禁止 | Smash リストでは Add を押しても何もしない | `showTaskInput` 内 smash-list チェック |
| 12.6 | タブ表示 | タブは「💥」のみ。バッジなし | `renderListTabs` |

**受け入れ条件（12. Smash List）**

- **12.1** ログイン後、Smash リストが存在しない場合は自動作成されること。
- **12.2** Smash リストを開くと、言語に応じた定型文タスクが 3 件表示されること。
- **12.3** Smash のタスクを完了して未完了が 3 未満になると、自動で新しいダミータスクが補充されること。
- **12.4** 言語を En/Ja で切り替えると、Smash タスクのタイトルがその言語で表示されること。
- **12.5** Smash リスト表示中に「Add a task」や FAB を押しても、フォームやボトムシートが開かないこと。
- **12.6** タブに「💥」のみ表示され、数バッジは表示されないこと。

---

## 13. チュートリアル・ゲスト

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 13.1 | チュートリアルタスク | 未ログイン時の default リストに 3 件（titleKey: tutorialTask1/2/3） | tutorialTasks, loadLists |
| 13.2 | チュートリアル完了 CTA | 全タスク完了かつ未ログインで「サインアップして保存」を表示 | tutorialCompleteCta, tutorialSignUpBtn |
| 13.3 | 未ログイン時のリスト名 | default リストを「Tutorial」と表示 | defaultList.name = 'Tutorial' |
| 13.4 | ローカル→Firestore マイグレーション | ログイン時にローカルの My Tasks タスクを Firestore に移行 | `migrateLocalDataToFirebase` |

**受け入れ条件（13. チュートリアル・ゲスト）**

- **13.1** 未ログインで初めて開いたとき、default リストにチュートリアル用タスクが 3 件あり、i18n のタイトルで表示されること。
- **13.2** 未ログインでチュートリアルタスクをすべて完了すると、「サインアップして保存」の CTA が表示されること。
- **13.3** 未ログイン時、default リストのタブ・ヘッダーが「Tutorial」と表示されること。
- **13.4** ゲストでタスクをいくつか作った状態でログインすると、それらが Firestore の My Tasks に移行され、表示されること。

---

## 14. 空状態・ローディング

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 14.1 | ゲームスタート空状態 | タスクが 1 つもないときに「Ready?」「Press + to start」 | gameStartEmpty |
| 14.2 | 通常の空状態 | 未完了タスクが 0 だが完了はあるときに「No tasks - Time to rest!」とイラスト | emptyState |
| 14.3 | Firestore ローディング | リスト取得中にスピナーと「Loading your tasks...」 | loadingFirestore |
| 14.4 | 完了セクション折りたたみ | Completed (N) のヘッダークリックで表示/非表示 | `toggleCompletedSection` |

**受け入れ条件（14. 空状態・ローディング）**

- **14.1** リストにタスクが 1 つもないとき、「Ready?」「Press + to start」が表示されること。
- **14.2** 未完了タスクが 0 で完了タスクが 1 以上あるとき、「No tasks - Time to rest!」とイラストが表示されること。
- **14.3** ログイン直後など Firestore 取得中は、スピナーと「Loading your tasks...」が表示されること。
- **14.4** 「Completed (N)」のヘッダーをクリックすると、完了タスク一覧の表示/非表示が切り替わること。

---

## 15. 祝祭・アニメーション・サウンド

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 15.1 | タスク完了祝祭オーバーレイ | メッセージ + キャンバスパーティクル等 | `showCelebration`, `hideCelebration` |
| 15.2 | タスク完了アニメーション | カードのクローン・アニメーション | ComicEffectsManager, TaskAnimationEffects |
| 15.3 | Perfect Timing ミニゲーム | チェックボックス長押しでタイミングゲーム | PerfectTimingManager |
| 15.4 | ロゴ CRT エフェクト | ロゴクリックで WorldShutdownCrtHardCut | appLogo pointerup |
| 15.5 | 操作音 | taskAdd, taskEdit, taskDelete, taskComplete, taskCancel, buttonClick 等 | comicEffects.playSound, picoSound |
| 15.6 | サウンドオン/オフ | ユーザーメニュー内のトグル。aria-checked と連動 | soundToggleBtn |
| 15.7 | Freeze エフェクト | URL ?effect=freeze または testFreeze()（開発用） | freeze-effect.js |

**受け入れ条件（15. 祝祭・アニメーション・サウンド）**

- **15.1** タスクを完了すると祝祭オーバーレイ（メッセージ＋パーティクル等）が表示され、閉じると消えること。
- **15.2** タスク完了時にカードのクローンやアニメーションが再生されること。
- **15.3** （オプション）長押しで Perfect Timing が開き、結果に応じてタスクが完了すること。
- **15.4** ロゴをクリックすると CRT 風シャットダウンエフェクトが再生されること。
- **15.5** タスク追加・編集・削除・完了・キャンセル・タブ切替・言語切替等で、対応する操作音が鳴ること（サウンド ON 時）。
- **15.6** ユーザーメニューでサウンドを OFF にすると操作音が鳴らなくなり、ON にすると鳴ること。トグルの aria-checked と状態が一致すること。
- **15.7** （開発用）?effect=freeze 付きで開くか testFreeze() で freeze 効果がかかること。

---

## 16. 国際化（i18n）

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 16.1 | 言語切替 | En / Ja。localStorage に保存し applyI18n で反映 | i18n.js, langEnBtn / langJaBtn |
| 16.2 | 文言キー | data-i18n, data-i18n-placeholder で UI を一括更新 | applyI18n, window.t(key) |
| 16.3 | リスト・タスク再描画 | 言語切替後に renderTasks, renderListTabs, updateListTitle | bindLangChip 内 |

**受け入れ条件（16. 国際化）**

- **16.1** En / Ja を押すと UI 文言がその言語に切り替わり、リロード後も選択が保持されること。
- **16.2** ボタン・ラベル・プレースホルダー等が data-i18n / t(key) に従って表示されること。
- **16.3** 言語切替後、リスト名・タブ・タスク一覧が再描画され、正しい言語で表示されること。

---

## 17. Firestore・永続化

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 17.1 | リスト購読 | ユーザーの lists をリアルタイム購読。tasks は [] で初期化 | listenListsFromFirestore |
| 17.2 | 現在リストのタスク購読 | 表示中の listId の tasks のみ購読。order でソート | listenTasksFromFirestore, setupTasksRealtimeListener |
| 17.3 | 全タスク購読（バッジ用） | uid で全タスクを購読し listId 別の未完了トップレベル数を集計 | listenAllTasksFromFirestore, taskCountsByListId |
| 17.4 | タスク CRUD/完了の Firestore 反映 | add/update/delete/toggleTaskCompletion を Firestore に送信 | 各 CRUD ・ toggleTaskCompletion 内 |
| 17.5 | リスト CRUD の Firestore 反映 | add/update/delete を Firestore に送信 | リストモーダル・コンテキストメニュー |
| 17.6 | タスク order の永続化 | 並び替え後に Firestore の order を更新 | persistTaskOrder |
| 17.7 | ゲスト時の localStorage 保存 | saveTasks / saveLists で保存。load で復元 | saveTasks, saveLists, loadTasks, loadLists |

**受け入れ条件（17. Firestore・永続化）**

- **17.1** ログイン後、Firestore の lists がリアルタイムで反映され、リスト追加/削除が他デバイスと同期すること。
- **17.2** 表示中のリストのタスクだけが Firestore から購読され、order でソートされた順で表示されること。
- **17.3** ログイン時、どのリストを開いていなくてもタブの未完了数が正しく表示され、他リストでタスクを追加/完了するとバッジが更新されること。
- **17.4** タスクの追加・更新・削除・完了が Firestore に反映され、他デバイスで反映されること。
- **17.5** リストの追加・名前変更・削除が Firestore に反映されること。リスト削除時は当該 listId の tasks も削除されること。
- **17.6** ドラッグで並び替えたあと、リロードや別デバイスで同じ順序で表示されること。
- **17.7** ゲスト時、タスク・リストの変更が localStorage に保存され、リロードで復元されること。

---

## 18. リッチテキスト・リンク

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 18.1 | ペースト時の URL リンク化 | 貼り付けた URL をクリック可能なリンクに変換 | handleHyperlinkPaste |
| 18.2 | マークダウン風リンク | [text](url) 形式をパースして表示用に変換 | parseMarkdownLinks, processLinksForDisplay |
| 18.3 | 表示用テキスト抽出 | contenteditable からプレーンテキストを取得（保存用） | extractTextFromRichEditor |
| 18.4 | リッチエディタ設定 | contenteditable にショートカットやプレースホルダー挙動を設定 | setupRichTextEditor |
| 18.5 | URL の自動リンク | プレーンテキスト中の URL を <a> に変換して表示 | autoLinkUrls, processTaskText |

**受け入れ条件（18. リッチテキスト・リンク）**

- **18.1** 詳細欄に URL を貼り付けると、クリック可能なリンクとして挿入されること。
- **18.2** [text](url) 形式の文字列が表示時にリンクとしてレンダリングされること。
- **18.3** 保存時、contenteditable の内容がプレーンテキスト（または所定形式）で抽出され、HTML タグがそのまま保存されないこと。
- **18.4** 詳細欄でプレースホルダーやショートカットが意図どおり動作すること。
- **18.5** タスク一覧表示時、本文中の URL がリンクとして表示され、クリックで開けること。

---

## 19. モーダル・UI パターン

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 19.1 | タスク削除確認 | deleteModal。Cancel / Delete | cancelDelete, confirmDelete |
| 19.2 | リスト作成 | createListModal。リスト名入力 + Create | createListForm, createListBtn |
| 19.3 | リスト編集 | editListModal。名前変更 + Save | editListForm, saveListBtn |
| 19.4 | リスト削除確認 | deleteListModal。Confirm で削除 | confirmDeleteList |
| 19.5 | メール認証 | emailAuthModal。Sign up / Log in 切替・閉じる | emailAuthCloseBtn, toggleAuthMode, emailAuthForm |
| 19.6 | パスワードリセット | passwordResetModal。メール送信 | passwordResetForm, backToLoginBtn |
| 19.7 | パスワード設定 | passwordSetupModal。新パスワード・確認 | passwordSetupForm |
| 19.8 | アカウント削除確認 | deleteAccountModal | confirmDeleteAccount, cancelDeleteAccount |
| 19.9 | モーダル外クリックで閉じる | オーバーレイクリック時に閉じる | 各モーダル addEventListener('click') |
| 19.10 | リストダイアログのビューポート | モーダル表示時のスクロール・ビューポート調整 | _setupListDialogViewportListener |

**受け入れ条件（19. モーダル・UI パターン）**

- **19.1** タスク削除で確認モーダルが表示され、Cancel で閉じ、Delete で削除が実行されること。
- **19.2 〜 19.4** リスト作成・編集・削除の各モーダルが開き、送信/確認で対応する操作が実行され、Cancel で閉じること。
- **19.5** 認証モーダルで Sign up / Log in が切り替わり、×で閉じること。
- **19.6 〜 19.7** パスワードリセット・パスワード設定モーダルが開き、送信・戻るが動作すること。
- **19.8** アカウント削除確認モーダルで Cancel / Delete Account が動作すること。
- **19.9** モーダルのオーバーレイ（背景）をクリックするとモーダルが閉じること（閉じる設計のモーダルのみ）。
- **19.10** リスト作成/編集/削除モーダル表示時、キーボード表示などで入力欄が隠れないようビューポートが調整されること。

---

## 20. モバイル FAB

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 20.1 | FAB 表示/非表示 | モバイルでタスク入力・モーダルが開いていなければ FAB 表示 | renderMobileFab, isAnyModalOpen |
| 20.2 | FAB クリックでタスク追加 | ボトムシートを開く（Smash では無反応） | mobileFab click |

**受け入れ条件（20. モバイル FAB）**

- **20.1** モバイルでタスク入力フォームや各種モーダルが開いているときは FAB が非表示、閉じているときは表示されること。
- **20.2** FAB をタップするとタスク追加用ボトムシートが開くこと。Smash リストのときはタップしても開かないこと。

---

## 21. その他・ユーティリティ

| # | 機能 | 説明 | 主な実装箇所 |
|---|------|------|--------------|
| 21.1 | エラーメッセージ表示 | errorMessage 要素にテキスト表示。5 秒で非表示 | showErrorMessage |
| 21.2 | HTML エスケープ | ユーザー入力をそのまま表示する箇所で XSS 防止 | escapeHtml |
| 21.3 | トップレベルタスク判定 | parentId / parentTaskId が無いものをトップレベルとしてカウント・並び替え | isTopLevelTask |
| 21.4 | My Tasks リスト判定 | リスト名が「My Tasks」または id が default 等 | isMyTasksList |
| 21.5 | getCurrentList | currentListId に一致するリストを返す。無ければ lists[0] | getCurrentList |
| 21.6 | tasks getter/setter | 現在リストの tasks を返す/セット。isProcessing を除去 | get tasks, set tasks |

**受け入れ条件（21. その他・ユーティリティ）**

- **21.1** showErrorMessage 呼び出し後、指定メッセージが表示され、約 5 秒で非表示になること。
- **21.2** ユーザー入力由来の文字列を表示する箇所で HTML がエスケープされ、スクリプトが実行されないこと。
- **21.3** サブタスクなど parentId を持つタスクはトップレベルとしてカウント・並び替え対象に含まれないこと。
- **21.4** 「My Tasks」または default リストが My Tasks として扱われ、タブ名・コンテキストメニュー非表示等の条件に使われること。
- **21.5** getCurrentList() が currentListId に対応するリストを返し、存在しなければ lists[0] を返すこと。
- **21.6** tasks の get/set で isProcessing が除去され、現在リストのタスクのみが扱われること。

---

## 22. 外部スクリプト・アセット

| # | ファイル | 役割 |
|---|----------|------|
| 22.1 | i18n.js | 言語切替・t(key)・applyI18n・getLang |
| 22.2 | firebase.js | Firebase 初期化・Auth・Firestore の add/update/delete/listen 関数 |
| 22.3 〜 22.15 | （一覧の通り） | アニメーション・Perfect Timing・サウンド・PWA・スタイル等 |

**受け入れ条件（22. 外部スクリプト・アセット）**

- **22.1** i18n.js 読み込み後、window.t / applyI18n / getLang が利用可能であり、言語切替が動作すること。
- **22.2** firebase.js 読み込み後、Auth と Firestore の各関数が呼び出せ、ログイン・CRUD・購読が動作すること。
- **22.3 〜 22.15** 各アセットが読み込まれ、対応する機能（アニメーション・Perfect Timing・サウンド・PWA・スタイル等）が期待どおり動作すること。

---

## 23. HTML 要素 ID 一覧（イベント・参照用）

（記載内容は従来どおり。受け入れ条件としては「一覧の ID が DOM に存在し、該当イベントが紐づくこと」を満たせばよい。）

---

## 受け入れ条件の使い方

- **開発時**: 各機能の「受け入れ条件」を満たすように実装する。
- **React 移行時**: 上記 AC をそのまま React 版の受け入れ条件として使い、満たしているかどうかを手動または E2E で確認する。
- **不足 AC**: プロダクト固有の制約（例: 特定ブラウザ・解像度）があれば、該当セクションに追記する。

以上が、機能一覧と受け入れ条件の整理です。
