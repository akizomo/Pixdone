/**
 * PixDone i18n (English + Japanese)
 * - Default: device/browser language (ja => Japanese, else English)
 * - User override saved in localStorage
 * - t(key) fallback: current lang -> en -> key
 * - [data-i18n] and [data-i18n-placeholder] for UI
 */

(function (global) {
    const STORAGE_KEY = 'pixdone-lang';

    const MESSAGES = {
        en: {
            // App & header
            appTitle: 'PixDone',
            myTasks: 'My Tasks',
            addTask: 'Add a task',
            listOptions: 'List options',

            // Account menu
            sound: 'Sound',
            soundEffectsOnOff: 'Sound effects on/off',
            logout: 'Logout',
            deleteAccount: 'Delete Account',
            signUp: 'Sign up',
            logIn: 'Log in',
            language: 'Language',
            languageEn: 'English',
            languageJa: '日本語',

            // Task form
            title: 'Title',
            details: 'Details',
            today: 'Today',
            tomorrow: 'Tomorrow',
            repeat: 'Repeat',
            pick: 'Pick',
            repeatFrequency: 'Repeat Frequency',
            noRepeat: 'No repeat',
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
            yearly: 'Yearly',
            cancel: 'Cancel',
            save: 'Save',
            delete: 'Delete',
            create: 'Create',

            // Empty & states
            loadingTasks: 'Loading your tasks...',
            ready: 'Ready?',
            pressPlusToStart: 'Press + to start your first task.',
            noTasksRest: 'No tasks - Time to rest!',
            tutorialComplete: "You've completed the tutorial!",
            tutorialCompleteSub: 'Sign up to save your own tasks and sync across devices.',

            // Completed
            completed: 'Completed',

            // Celebration
            greatJob: 'Great job!',
            makingProgress: "You're making progress!",

            // Task sheet / modal titles
            newTask: 'New Task',
            editTask: 'Edit Task',

            // Modals
            deleteTask: 'Delete Task?',
            deleteTaskConfirm: 'Are you sure you want to delete this task? This action cannot be undone.',
            createNewList: 'Create New List',
            editList: 'Edit List',
            deleteList: 'Delete List',
            listName: 'List name',
            deleteListConfirm: 'Are you sure you want to delete this list and all its tasks?',
            rename: 'Rename',

            // Auth
            email: 'Email',
            emailPlaceholder: 'your.email@example.com',
            password: 'Password',
            passwordPlaceholder: 'Enter your password',
            resetPassword: 'Reset Password',
            setPassword: 'Set Password',
            enterEmail: 'Enter your email address',
            sendResetEmail: 'Send Reset Email',
            backToLogin: 'Back to Login',
            newPassword: 'New Password',
            newPasswordPlaceholder: 'Enter new password',
            confirmPassword: 'Confirm Password',
            confirmPasswordPlaceholder: 'Confirm password',
            forgotPassword: 'Forgot your password?',
            alreadyHaveAccount: 'Already have an account? ',
            noAccount: "Don't have an account? ",
            deleteAccountConfirm: 'Are you sure you want to delete your account? This action cannot be undone.',
            deleteAccountDataLost: 'All your tasks and data will be permanently lost.',
            areYouFrozen: 'Are you frozen?',
            detailsOptional: 'Details (optional)',
            addDetails: 'Add details…',
            addSubtasks: 'Add subtasks…',
            subtasks: 'Subtasks',

            // Smash list
            smashListSubtitle: 'This list exists only to let you tap and smash tasks for pure satisfaction. No saving, no planning—just smashing.',
            smashListHint: 'Press Space to smash a task',

            // Tutorial task titles (for default list)
            tutorialTask1: 'Try completing this task!',
            tutorialTask2: 'Each time you complete a task, a different effect appears. How many can you find?',
            tutorialTask3: 'Try the [Smash List](action:smash-list) for even more fun!',

            // Due (for formatDueShort)
            dueToday: 'Today',
            dueTomorrow: 'Tomorrow',
        },
        ja: {
            // App & header (pixel font: kana preferred)
            appTitle: 'PixDone',
            myTasks: 'マイタスク',
            addTask: 'タスクを追加',
            listOptions: 'リストのオプション',

            // Account menu
            sound: 'サウンド',
            soundEffectsOnOff: 'サウンドオン/オフ',
            logout: 'ログアウト',
            deleteAccount: 'アカウントを削除',
            signUp: '新規登録',
            logIn: 'ログイン',
            language: '言語',
            languageEn: 'English',
            languageJa: '日本語',

            // Task form
            title: 'タイトル',
            details: '詳細',
            today: '今日',
            tomorrow: '明日',
            repeat: 'くりかえし',
            pick: '日付',
            repeatFrequency: 'くりかえし',
            noRepeat: 'なし',
            daily: '毎日',
            weekly: '毎週',
            monthly: '毎月',
            yearly: '毎年',
            cancel: 'キャンセル',
            save: '保存',
            delete: '削除',
            create: '作成',

            // Empty & states
            loadingTasks: 'タスクを読み込み中...',
            ready: 'Ready?',
            pressPlusToStart: '+ で最初のタスクをはじめよう。',
            noTasksRest: 'タスクなし — やすもう！',
            tutorialComplete: "You've completed the tutorial!",
            tutorialCompleteSub: 'サインアップしてタスクを保存し、端末間で同期できます。',

            // Completed
            completed: '完了',

            // Celebration
            greatJob: 'よくできた！',
            makingProgress: 'すすんでる！',

            // Task sheet / modal titles
            newTask: 'あたらしいタスク',
            editTask: 'タスクをへんしゅう',

            // Modals (pixel / short: kana)
            deleteTask: 'タスクをけす？',
            deleteTaskConfirm: 'このタスクを削除しますか？ 元に戻せません。',
            createNewList: 'あたらしいリスト',
            editList: 'リストをへんしゅう',
            deleteList: 'リストをけす',
            listName: 'リストのなまえ',
            deleteListConfirm: 'このリストとタスクをすべて削除しますか？',
            rename: 'なまえをかえる',

            // Auth
            email: 'メール',
            emailPlaceholder: 'example@email.com',
            password: 'パスワード',
            passwordPlaceholder: 'パスワードを入力',
            resetPassword: 'パスワードをリセット',
            setPassword: 'パスワードを設定',
            enterEmail: 'メールアドレスを入力',
            sendResetEmail: 'リセットメールを送信',
            backToLogin: 'ログインにもどる',
            newPassword: '新しいパスワード',
            newPasswordPlaceholder: '新しいパスワードを入力',
            confirmPassword: 'パスワード確認',
            confirmPasswordPlaceholder: 'パスワードを再入力',
            forgotPassword: 'パスワードをわすれた？',
            alreadyHaveAccount: 'アカウントを持っている？ ',
            noAccount: 'アカウントがない？ ',
            deleteAccountConfirm: 'アカウントを削除しますか？ 元に戻せません。',
            deleteAccountDataLost: 'タスクとデータはすべて消えます。',
            areYouFrozen: 'フリーズしてる？',
            detailsOptional: '詳細（任意）',
            addDetails: '詳細を追加…',
            addSubtasks: 'サブタスクを追加…',
            subtasks: 'サブタスク',

            // Smash list
            smashListSubtitle: 'このリストは、タップして気持ちよく片付けるためだけのもの。保存も計画もいらない。ただ、潰すだけ。',
            smashListHint: 'Space でスマッシュ',

            // Tutorial task titles
            tutorialTask1: 'まずはひとつ、終わらせてみよう。',
            tutorialTask2: '終わらせるたびに、違うエフェクト。いくつ見つけられる？',
            tutorialTask3: '[スマッシュリスト](action:smash-list)、試してみる？管理はしない。ただ潰す。',

            // Due (for formatDueShort - kana for pixel areas)
            dueToday: '今日',
            dueTomorrow: '明日',
        },
    };

    function detectDeviceLang() {
        const nav = global.navigator;
        const langs = nav.languages && nav.languages.length ? nav.languages : [nav.language || 'en'];
        for (let i = 0; i < langs.length; i++) {
            const code = (langs[i] || '').toLowerCase();
            if (code.startsWith('ja')) return 'ja';
        }
        return 'en';
    }

    function getStoredLang() {
        try {
            return global.localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function getLang() {
        const stored = getStoredLang();
        if (stored === 'en' || stored === 'ja') return stored;
        return detectDeviceLang();
    }

    function setLang(lang) {
        if (lang !== 'en' && lang !== 'ja') return;
        try {
            global.localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {}
        _currentLang = lang;
        if (typeof global.applyI18n === 'function') global.applyI18n();
    }

    let _currentLang = getLang();

    function t(key) {
        const cur = MESSAGES[_currentLang];
        const en = MESSAGES.en;
        if (cur && cur[key] !== undefined) return cur[key];
        if (en && en[key] !== undefined) return en[key];
        return key;
    }

    function applyI18n() {
        _currentLang = getLang();
        if (typeof document === 'undefined' || !document.querySelector) return;
        document.documentElement.lang = _currentLang === 'ja' ? 'ja' : 'en';
        const elsText = document.querySelectorAll('[data-i18n]');
        elsText.forEach(function (el) {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
        });
        const elsPh = document.querySelectorAll('[data-i18n-placeholder]');
        elsPh.forEach(function (el) {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) el.placeholder = t(key);
        });
        const elsTitle = document.querySelectorAll('[data-i18n-title]');
        elsTitle.forEach(function (el) {
            const key = el.getAttribute('data-i18n-title');
            if (key) el.title = t(key);
        });
    }

    /**
     * Localized short due label: Today/今日, Tomorrow/明日, or M/D, YY/M/D
     * @param {string} dateISO - YYYY-MM-DD
     * @param {string} [lang] - 'en' | 'ja', defaults to getLang()
     */
    function formatDueShort(dateISO, lang) {
        if (!dateISO) return '';
        lang = lang || getLang();
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        if (dateISO === today) return lang === 'ja' ? '今日' : 'Today';
        if (dateISO === tomorrowStr) return lang === 'ja' ? '明日' : 'Tomorrow';
        const d = new Date(dateISO);
        const y = d.getFullYear();
        const thisYear = new Date().getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        if (y !== thisYear) return `${String(y).slice(-2)}/${m}/${day}`;
        return `${m}/${day}`;
    }

    global.MESSAGES = MESSAGES;
    global.detectDeviceLang = detectDeviceLang;
    global.getLang = getLang;
    global.setLang = setLang;
    global.t = t;
    global.applyI18n = applyI18n;
    global.formatDueShort = formatDueShort;
})(typeof window !== 'undefined' ? window : this);
