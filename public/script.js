/**
 * PixDone - Task Management App
 * Features celebration animations and encouraging messages
 */

class PixDoneApp {
    constructor() {
        this.lists = [];
        this.currentListId = 'default';
        this.listIdCounter = 1;
        this.taskIdCounter = 1;
        this.isInputVisible = false;
        this.isCompletedExpanded = false;
        this.selectedDate = null;
        this.currentTask = null;
        this.selectedRepeat = 'none';
        this.lastComboTime = 0;
        this.comboCount = 0;
        this.isMobileModalOpen = false;
        this.comicEffects = new ComicEffectsManager();
        this.taskAnimationEffects = new TaskAnimationEffects();
        this.user = null;
        this.isAuthenticated = false;
        this.editingListId = null;
        this.deletingListId = null;
        this.contextMenuListId = null;
        this.tasksUnsubscribe = null;
        this.listsUnsubscribe = null;
        this.allTasksUnsubscribe = null;
        this.taskCountsByListId = {};
        this.isCreatingMyTasksList = false;
        this.isCreatingSmashList = false;
        this.isLoadingFromFirestore = false;
        this._dayRolloverTimeout = null;
        this._lastTodayYMD = null;

        // Tutorial tasks for unauthenticated users (title resolved via i18n: tutorialTask1, tutorialTask2, tutorialTask3)
        this.tutorialTasks = [
            { id: 'tutorial-1', titleKey: 'tutorialTask1', completed: false, dueDate: null, priority: 'normal', category: 'general', description: '', listId: 'default' },
            { id: 'tutorial-2', titleKey: 'tutorialTask2', completed: false, dueDate: null, priority: 'normal', category: 'general', description: '', listId: 'default' },
            { id: 'tutorial-3', titleKey: 'tutorialTask3', completed: false, dueDate: null, priority: 'normal', category: 'general', description: '', listId: 'default' }
        ];

        // Smash List dummy tasks
        this.smashListTasks = [
            "Fix the coffee machine",
            "Buy milk and bread",
            "Call mom",
            "Clean the garage",
            "Organize email inbox",
            "Fix the leaky faucet",
            "Plan weekend trip",
            "Read 30 pages of a book",
            "Go for a 30-minute walk",
            "Backup computer files",
            "Wash the car",
            "Water the plants",
            "Take out the trash",
            "Pay electricity bill",
            "Vacuum the living room",
            "Sort through old clothes",
            "Exercise for 20 minutes",
            "Check bank balance",
            "Update phone contacts",
            "Charge all devices",
            "Finish the laundry",
            "Make grocery list",
            "Review monthly budget",
            "Call the dentist",
            "Fix the broken drawer",
            "Learn a new word",
            "Stretch for 10 minutes",
            "Write in journal",
            "Reply to messages",
            "Dust the furniture",
            "Organize desk drawer",
            "Check car oil",
            "Practice a hobby",
            "Send thank you note",
            "Delete old photos",
            "Clean the windows",
            "Update software",
            "Prepare lunch",
            "Call old friend",
            "Do 10 pushups",
            "Organize bookshelf",
            "Check weather forecast",
            "Trim fingernails",
            "Unsubscribe from emails",
            "Take a 5-minute break",
            "Smile at yourself",
            "Drink a glass of water",
            "Take a deep breath",
            "High-five yourself",
            "Say something nice",
            // 旧 Firestore 初期タスク（初期表示の3つが英語になる対策）
            "Check notifications",
            "Organize desk",
            "Review emails",
            "Take deep breaths",
            "Stretch muscles",
            "Clear browser tabs",
            "Clean keyboard",
            "Water plants",
            "Tidy up files",
            "Quick workout"
        ];

        // Smash list dummy tasks (Japanese) — same order as smashListTasks
        this.smashListTasksJa = [
            "コーヒーメーカーを直す",
            "牛乳とパンを買う",
            "母に電話する",
            "ガレージを掃除する",
            "メールの受信箱を整理する",
            "蛇口の漏水を直す",
            "週末の旅行を計画する",
            "本を30ページ読む",
            "30分散歩する",
            "パソコンのバックアップ",
            "車を洗う",
            "植物に水をやる",
            "ゴミを出す",
            "電気代を払う",
            "リビングを掃除機がけする",
            "古い服を整理する",
            "20分運動する",
            "残高を確認する",
            "連絡先を更新する",
            "デバイスを充電する",
            "洗濯を終わらせる",
            "買い物リストを作る",
            "月の予算を見直す",
            "歯医者に電話する",
            "壊れた引き出しを直す",
            "新しい単語を覚える",
            "10分ストレッチする",
            "日記を書く",
            "メッセージに返信する",
            "家具のホコリを払う",
            "机の引き出しを整理する",
            "車のオイルを確認する",
            "趣味の練習をする",
            "お礼のメッセージを送る",
            "古い写真を削除する",
            "窓を拭く",
            "ソフトを更新する",
            "お弁当を用意する",
            "昔の友達に電話する",
            "腕立て10回する",
            "本棚を整理する",
            "天気予報を確認する",
            "爪を切る",
            "メルマガを解除する",
            "5分休憩する",
            "自分に微笑む",
            "水を一杯飲む",
            "深呼吸する",
            "自分とハイタッチする",
            "自分を褒める",
            // 旧 Firestore 初期タスク（同上・同じ順）
            "通知を確認する",
            "机を整理する",
            "メールを確認する",
            "深呼吸する",
            "ストレッチする",
            "ブラウザのタブを閉じる",
            "キーボードを掃除する",
            "植物に水をやる",
            "ファイルを整理する",
            "軽い運動する"
        ];

        this.initializeApp();
        this.setupGlobalAccess();
    }

    getTaskDisplayTitle(task) {
        if (!task) return '';
        if (task.title) return task.title; // user-edited or saved title
        if (task.titleKey && typeof window.t === 'function') return window.t(task.titleKey);
        return '';
    }

    getSmashListTasks() {
        const lang = (typeof window.getLang === 'function' && window.getLang()) || 'en';
        return lang === 'ja' ? this.smashListTasksJa : this.smashListTasks;
    }

    /** Smash list タスクの表示用タイトル（現在の言語に合わせる） */
    getSmashTaskDisplayTitle(task) {
        if (!task || !task.title) return '';
        const lang = typeof window.getLang === 'function' ? window.getLang() : 'en';
        const enIdx = this.smashListTasks.indexOf(task.title);
        if (enIdx !== -1) return lang === 'ja' ? this.smashListTasksJa[enIdx] : this.smashListTasks[enIdx];
        const jaIdx = this.smashListTasksJa.indexOf(task.title);
        if (jaIdx !== -1) return lang === 'en' ? this.smashListTasks[jaIdx] : this.smashListTasksJa[jaIdx];
        return task.title;
    }

    initializeApp() {
        console.log('[PixDone] Initializing PixDone application...');

        // DOM読み込み完了を待つ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('[PixDone] DOM content loaded, proceeding with setup...');
                this.setupAfterDOMLoaded();
            });
        } else {
            console.log('[PixDone] DOM already ready, proceeding with setup...');
            this.setupAfterDOMLoaded();
        }
    }

    setupAfterDOMLoaded() {
        // i18n: apply translations and sync lang buttons
        if (typeof window.applyI18n === 'function') window.applyI18n();
        this.refreshLangUI();
        this.setupDayRolloverRefresh();

        // 新しいコンポーネント管理システムの初期化
        this.initializeComponentSystem();

        // 従来のシステムも並行して動作
        this.setupFirebaseAuthListener();
        this.setupEventListeners();
        this.setupPagerSwipe();
        // Mobile modal now handled by new system
        try {
            this.comicEffects = new ComicEffectsManager();
        } catch (error) {
            console.warn('[PixDone] Failed to initialize ComicEffectsManager:', error);
            this.comicEffects = null;
        }
        // Global access setup moved to setupGlobalAccess()

        // UI要素の検証を遅延実行
        setTimeout(() => {
            this.validateUIComponents();
        }, 1000);

        // Sync status indicator (Synced / Offline) when signed in
        this.setupSyncIndicator();

        // 認証前でもデフォルトリストを初期化
        const authHint = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pixdone-auth-hint') : null;
        if (authHint === 'logged_in') {
            this.isLoadingFromFirestore = true;
        }
        this.ensureDefaultList();
        this.loadTasks();
        this.loadLists();
        this.renderListTabs();
        this.renderTasks();
        this.updateCompletedCount();
        this.updateListTitle();

        // Shift+smash を確実に有効にするため、キーボードショートカットをここでも登録
        if (!this.keyboardShortcutsSetup) {
            this.setupKeyboardShortcuts();
        }

        // 初回読み込み時、未ログインの場合は Tutorial を確実に選択（Firebase Auth 状態確定前でも動作するように）
        // authHint が logged_in の場合はスキップ（ローディング表示のまま）
        setTimeout(() => {
            if (authHint === 'logged_in') return;
            if (!this.isAuthenticated && !firebase.auth().currentUser) {
                const defaultList = this.lists.find(l => l.id === 'default');
                if (defaultList && defaultList.name !== 'Tutorial') {
                    defaultList.name = 'Tutorial';
                }
                const defaultIdx = this.lists.findIndex(l => l.id === 'default');
                if (defaultIdx > 0) {
                    const [def] = this.lists.splice(defaultIdx, 1);
                    this.lists.unshift(def);
                }
                if (this.currentListId !== 'default') {
                    this.currentListId = 'default';
                }
                this.renderListTabs();
                this.renderTasks();
                this.updateListTitle();
            }
        }, 100);
    }

    /**
     * Setup sync/offline indicator. Sync across devices is done via Firestore when signed in.
     */
    setupSyncIndicator() {
        const el = document.getElementById('syncIndicator');
        if (!el) return;
        // Always hide sync indicator
        el.style.display = 'none';
    }

    updateSyncIndicatorVisibility() {
        const el = document.getElementById('syncIndicator');
        if (!el) return;
        // Always hide sync indicator
        el.style.display = 'none';
    }

    /**
     * 新しいコンポーネント管理システムの初期化
     */
    initializeComponentSystem() {
        // 新システムは複雑すぎるため、直接修復を実行
        console.log('[PixDone] Skipping new component system, using direct fix...');
        this.fixMobileModalDirectly();
    }

    /**
     * 既存システムと新システムの統合
     */
    integrateWithComponentManager() {
        // 新システムは複雑すぎるため、シンプルな直接修復を実行
        console.log('[PixDone] Applying direct modal fix...');
        this.fixMobileModalDirectly();
    }

    fixMobileModalDirectly() {
        console.log('[PixDone] Creating bottom sheet modal system');

        // Initialize subtasks state
        this.currentSubtasks = [];

        // Remove any existing modal
        const existingModal = document.getElementById('newMobileModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Hide modal function
        this.hideMobileModal = () => {
            const modal = document.getElementById('newMobileModal');
            if (modal) {
                modal.classList.remove('open');
                setTimeout(() => {
                    modal.remove();
                    this.currentSubtasks = [];
                }, 300);
            }
            // Reset edit state so the next "new task" starts clean
            this.currentTask = null;
            this.selectedDate = null;
            this.selectedRepeat = 'none';
            this.isMobileModalOpen = false;
            this.renderMobileFab();
            console.log('[PixDone] Bottom sheet hidden');
        };

        // Show modal function
        this.showMobileModal = () => {
            console.log('[PixDone] Creating bottom sheet');
            // Remove existing modal
            const existing = document.getElementById('newMobileModal');
            if (existing) {
                existing.remove();
            }

            // Create bottom sheet container
            const sheet = document.createElement('div');
            sheet.id = 'newMobileModal';
            sheet.className = 'task-bottom-sheet';

            const sheetTitle = (typeof window.t === 'function' ? window.t : (k) => k)(this.currentTask ? 'editTask' : 'newTask');
            // Build HTML structure
            sheet.innerHTML = `
                <!-- Fixed Header（close 左上） -->
                <div class="task-sheet-header">
                    <button class="task-sheet-close-btn" id="taskSheetCloseBtn" aria-label="Close" title="${(typeof window !== 'undefined' && window.t ? window.t('close') : 'Close')}">×</button>
                    <h3 class="pixel-title" id="taskSheetTitle">${sheetTitle}</h3>
                </div>

                <!-- Scrollable Body -->
                <div class="task-sheet-body" id="taskSheetBody">
                    <!-- Section 1: Title -->
                    <div class="task-sheet-section" id="titleSection">
                        <div class="task-sheet-section-content">
                            <div id="newTaskTitle" class="task-sheet-title-input" contenteditable="true" placeholder="${(typeof window !== 'undefined' && window.t ? window.t('title') : 'Title')}"></div>
                        </div>
                    </div>

                    <!-- Section 2: Details -->
                    <div class="task-sheet-section" id="detailsSection">
                        <!-- Empty state row (shown when details is empty) -->
                        <div class="task-sheet-empty-state" id="detailsEmptyState" style="display: none;">
                            <span class="task-sheet-empty-state-text">${(typeof window !== 'undefined' && window.t ? window.t('addDetails') : 'Add details…')}</span>
                        </div>
                        <!-- Details input (shown when details has content or when focused) -->
                        <div class="task-sheet-section-content" id="detailsContent" style="display: none;">
                            <div id="newTaskDetails" class="task-sheet-details-input" contenteditable="true" placeholder="${(typeof window !== 'undefined' && window.t ? window.t('detailsOptional') : 'Details (optional)')}"></div>
                        </div>
                    </div>

                    <!-- Link preview card (shown when title/details contain a URL) -->
                    <div class="task-sheet-section task-sheet-link-preview-section" id="linkPreviewSection" style="display: none;">
                        <div class="link-preview-card" id="linkPreviewCard">
                            <div class="link-preview-text">
                                <div class="link-preview-title" id="linkPreviewTitle"></div>
                                <div class="link-preview-url" id="linkPreviewUrl"></div>
                            </div>
                            <div class="link-preview-image-wrap">
                                <img class="link-preview-image" id="linkPreviewImage" alt="" referrerpolicy="no-referrer" />
                            </div>
                        </div>
                    </div>

                    <!-- Section 3: Date Buttons -->
                    <div class="task-sheet-section" id="dateSection">
                        <div class="task-sheet-section-content">
                            <div class="task-sheet-date-buttons">
                                <button id="newTodayBtn" class="task-sheet-date-btn">${(typeof window !== 'undefined' && window.t ? window.t('today') : 'Today')}</button>
                                <button id="newTomorrowBtn" class="task-sheet-date-btn">${(typeof window !== 'undefined' && window.t ? window.t('tomorrow') : 'Tomorrow')}</button>
                                <button id="newCalendarBtn" class="task-sheet-date-btn"><i class="fa fa-calendar"></i> ${(typeof window !== 'undefined' && window.t ? window.t('pick') : 'Pick')}</button>
                                <span id="repeatRow"><button id="newRepeatBtn" class="task-sheet-date-btn"><i class="fa fa-repeat"></i> ${(typeof window !== 'undefined' && window.t ? window.t('repeat') : 'Repeat')}</button></span>
                            </div>
                            <input type="date" id="newNativeDatePicker" style="display: none;" />
                            <input type="hidden" id="newRepeatInterval" value="none" />
                        </div>
                    </div>

                    <!-- Section 4: Subtasks -->
                    <div class="task-sheet-section" id="subtasksSection">
                        <!-- Empty state row (shown when subtasks is empty) -->
                        <div class="task-sheet-empty-state" id="subtasksEmptyState" style="display: none;">
                            <span class="task-sheet-empty-state-text">${(typeof window !== 'undefined' && window.t ? window.t('addSubtasks') : 'Add subtasks…')}</span>
                        </div>
                        <!-- Subtasks content (shown when subtasks has content or when input is focused) -->
                        <div class="task-sheet-section-content" id="subtasksContent" style="display: none;">
                            <div class="task-sheet-subtasks-header">
                                <span class="task-sheet-section-title">${(typeof window !== 'undefined' && window.t ? window.t('subtasks') : 'Subtasks')} (<span id="subtasksCount">0</span>)</span>
                            </div>
                            <ul class="task-sheet-subtasks-list" id="subtasksList"></ul>
                            <div class="task-sheet-subtask-add">
                                <input type="text" id="subtaskInput" class="task-sheet-subtask-input" placeholder="${(typeof window !== 'undefined' && window.t ? window.t('addSubtasks') : 'Add subtasks…')}" />
                                <button id="subtaskAddBtn" class="task-sheet-subtask-add-btn" style="display: none;" aria-label="Add subtask">+ Add</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Fixed Footer -->
                <div class="task-sheet-footer" id="taskSheetFooter">
                    <div class="task-sheet-footer-left">
                        <button id="newCancelBtn" class="task-sheet-btn task-sheet-btn-cancel">${(typeof window !== 'undefined' && window.t ? window.t('cancel') : 'Cancel')}</button>
                    </div>
                    <div class="task-sheet-footer-right">
                        <button id="newDeleteBtn" class="task-sheet-btn task-sheet-btn-delete" style="display: none;">${(typeof window !== 'undefined' && window.t ? window.t('delete') : 'Delete')}</button>
                        <button id="newSaveBtn" class="task-sheet-btn task-sheet-btn-save">${(typeof window !== 'undefined' && window.t ? window.t('save') : 'Save')}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(sheet);

            // Initialize subtasks from current task (normalized: no repeat on subtasks)
            if (this.currentTask && this.currentTask.subtasks) {
                this.currentSubtasks = this.currentTask.subtasks.map(st => this.normalizeSubtask(st)).filter(Boolean);
            } else {
                this.currentSubtasks = [];
            }

            // Setup event listeners
            this.setupBottomSheetEvents(sheet);

            // Setup empty state rows
            this.setupEmptyStates(sheet);

            // Setup subtasks functionality
            this.setupSubtasks(sheet);

            // Setup keyboard scroll handling
            this.setupKeyboardScrollHandling(sheet);

            // Setup keyboard avoidance using visualViewport
            this.setupKeyboardAvoidance(sheet);

            // Populate form data if editing
            this.populateBottomSheetData(sheet);

            // Animate sheet in
            setTimeout(() => {
                sheet.classList.add('open');
            }, 10);

            this.isMobileModalOpen = true;
            console.log('[PixDone] Bottom sheet created');
        };

        // Setup bottom sheet helper functions
        this.setupBottomSheetEvents = (sheet) => {
            // Close button
            sheet.querySelector('#taskSheetCloseBtn').addEventListener('click', () => {
                if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('taskCancel');
                this.hideMobileModal();
            });

            // Cancel button
            sheet.querySelector('#newCancelBtn').addEventListener('click', () => {
                this.hideMobileModal();
                if (this.comicEffects && this.comicEffects.playSound) {
                    this.comicEffects.playSound('taskCancel');
                }
            });

            // Save button
            sheet.querySelector('#newSaveBtn').addEventListener('click', async () => {
                const titleEl = sheet.querySelector('#newTaskTitle');
                const title = titleEl.textContent.trim();
                if (!title) {
                    if (this.comicEffects && this.comicEffects.playSound) {
                        this.comicEffects.playSound('taskCancel');
                    }
                    return;
                }
                await this.saveBottomSheetTask(sheet);
                if (this.comicEffects && this.comicEffects.playSound) {
                    this.comicEffects.playSound('taskAdd');
                }
            });

            // Delete button (task only)
            const deleteBtn = sheet.querySelector('#newDeleteBtn');
            deleteBtn.addEventListener('click', () => {
                if (this.currentTask && this.currentTask.id) {
                    this.deleteTask(this.currentTask.id);
                    this.hideMobileModal();
                    if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('taskDelete');
                }
            });

            // Date buttons
            sheet.querySelector('#newTodayBtn').addEventListener('click', () => {
                if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                this.selectBottomSheetDate(sheet, 'today');
            });

            sheet.querySelector('#newTomorrowBtn').addEventListener('click', () => {
                if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                this.selectBottomSheetDate(sheet, 'tomorrow');
            });

            sheet.querySelector('#newCalendarBtn').addEventListener('click', () => {
                if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                this.showNativeDatePicker(sheet);
            });

            sheet.querySelector('#newRepeatBtn').addEventListener('click', () => {
                if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                this.showBottomSheetRepeat(sheet);
            });

            // Native date picker
            const nativeDatePicker = sheet.querySelector('#newNativeDatePicker');
            if (nativeDatePicker) {
                nativeDatePicker.addEventListener('change', (e) => {
                    if (e.target.value) {
                        if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                        this.selectBottomSheetDate(sheet, 'custom', e.target.value);
                    }
                });
            }

            // Title input validation
            const titleInput = sheet.querySelector('#newTaskTitle');
            if (titleInput) {
                titleInput.addEventListener('input', () => {
                    this.updateSaveButtonState(sheet);
                });
            }
        };

        // Setup empty state rows and visibility logic
        this.setupEmptyStates = (sheet) => {
            const detailsEmptyState = sheet.querySelector('#detailsEmptyState');
            const detailsContent = sheet.querySelector('#detailsContent');
            const detailsInput = sheet.querySelector('#newTaskDetails');
            const subtasksEmptyState = sheet.querySelector('#subtasksEmptyState');
            const subtasksContent = sheet.querySelector('#subtasksContent');
            const subtaskInput = sheet.querySelector('#subtaskInput');

            // Details empty state click handler
            if (detailsEmptyState) {
                detailsEmptyState.addEventListener('click', () => {
                    if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                    detailsEmptyState.style.display = 'none';
                    detailsContent.style.display = 'block';
                    setTimeout(() => {
                        detailsInput.focus();
                        this.setupRichTextEditor(detailsInput);
                    }, 10);
                });
            }

            // Subtasks empty state click handler
            if (subtasksEmptyState) {
                subtasksEmptyState.addEventListener('click', () => {
                    if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                    subtasksEmptyState.style.display = 'none';
                    subtasksContent.style.display = 'block';
                    setTimeout(() => {
                        subtaskInput.focus();
                    }, 10);
                });
            }

            // Update visibility based on content
            this.updateSectionVisibility(sheet);
        };

        // Update section visibility based on content
        this.updateSectionVisibility = (sheet) => {
            const detailsInput = sheet.querySelector('#newTaskDetails');
            const detailsEmptyState = sheet.querySelector('#detailsEmptyState');
            const detailsContent = sheet.querySelector('#detailsContent');
            const subtasksEmptyState = sheet.querySelector('#subtasksEmptyState');
            const subtasksContent = sheet.querySelector('#subtasksContent');

            // Details visibility
            const hasDetails = detailsInput && detailsInput.textContent.trim();
            if (hasDetails) {
                detailsEmptyState.style.display = 'none';
                detailsContent.style.display = 'block';
            } else {
                // Check if input is focused
                const isDetailsFocused = document.activeElement === detailsInput;
                if (isDetailsFocused) {
                    detailsEmptyState.style.display = 'none';
                    detailsContent.style.display = 'block';
                } else {
                    detailsEmptyState.style.display = 'block';
                    detailsContent.style.display = 'none';
                }
            }

            // Subtasks visibility
            const hasSubtasks = this.currentSubtasks && this.currentSubtasks.length > 0;
            const subtaskInput = sheet.querySelector('#subtaskInput');
            const isSubtaskFocused = subtaskInput && document.activeElement === subtaskInput;
            
            if (hasSubtasks || isSubtaskFocused) {
                subtasksEmptyState.style.display = 'none';
                subtasksContent.style.display = 'block';
            } else {
                subtasksEmptyState.style.display = 'block';
                subtasksContent.style.display = 'none';
            }
        };

        // Setup subtasks functionality
        this.setupSubtasks = (sheet) => {
            const subtaskInput = sheet.querySelector('#subtaskInput');
            const subtaskAddBtn = sheet.querySelector('#subtaskAddBtn');
            const subtasksList = sheet.querySelector('#subtasksList');

            if (subtaskInput && !subtaskInput.hyperlinkPasteSetup) {
                this.handleHyperlinkPaste(subtaskInput);
                subtaskInput.hyperlinkPasteSetup = true;
            }

            // Add subtask on button click
            subtaskAddBtn.addEventListener('click', () => {
                if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                this.addSubtask(sheet);
            });

            // Add subtask on Enter key
            subtaskInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addSubtask(sheet);
                }
            });

            // Show subtasks content when input is focused
            subtaskInput.addEventListener('focus', () => {
                this.updateSectionVisibility(sheet);
            });

            // Initial render
            this.renderSubtasks(sheet);
            this.updateSubtasksCount(sheet);
        };

        // Add subtask
        this.addSubtask = (sheet) => {
            const subtaskInput = sheet.querySelector('#subtaskInput');
            const text = subtaskInput.value.trim();
            if (!text) return;

            const newSubtask = {
                id: Date.now().toString(),
                text: text,
                done: false
            };

            this.currentSubtasks.push(newSubtask);
            subtaskInput.value = '';
            this.renderSubtasks(sheet);
            this.updateSubtasksCount(sheet);
            this.updateSectionVisibility(sheet);
        };

        // Delete subtask
        this.deleteSubtask = (sheet, subtaskId) => {
            this.currentSubtasks = this.currentSubtasks.filter(st => st.id !== subtaskId);
            this.renderSubtasks(sheet);
            this.updateSubtasksCount(sheet);
            this.updateSectionVisibility(sheet);
        };

        // Toggle subtask done state
        this.toggleSubtask = (sheet, subtaskId) => {
            const subtask = this.currentSubtasks.find(st => st.id === subtaskId);
            if (subtask) {
                const wasDone = subtask.done;
                subtask.done = !subtask.done;
                if (subtask.done && !wasDone && window.picoSound && typeof window.picoSound.playSubtaskCompleteSound === 'function') {
                    const total = this.currentSubtasks.length;
                    const completed = this.currentSubtasks.filter(st => st.done).length;
                    window.picoSound.playSubtaskCompleteSound({ total, completed });
                }
                this.renderSubtasks(sheet);
            }
        };

        // Render subtasks list
        this.renderSubtasks = (sheet) => {
            const subtasksList = sheet.querySelector('#subtasksList');
            subtasksList.innerHTML = '';

            this.currentSubtasks.forEach(subtask => {
                const li = document.createElement('li');
                li.className = `task-sheet-subtask-item ${subtask.done ? 'done' : ''}`;
                li.innerHTML = `
                    <input type="checkbox" class="task-sheet-subtask-checkbox" ${subtask.done ? 'checked' : ''} data-subtask-id="${subtask.id}" />
                    <span class="task-sheet-subtask-text">${this.escapeHtml(subtask.text)}</span>
                    <button class="task-sheet-subtask-delete" data-subtask-id="${subtask.id}" aria-label="Delete">×</button>
                `;

                // Checkbox event
                const checkbox = li.querySelector('.task-sheet-subtask-checkbox');
                checkbox.addEventListener('change', () => {
                    this.toggleSubtask(sheet, subtask.id);
                });

                // Delete button event
                const deleteBtn = li.querySelector('.task-sheet-subtask-delete');
                deleteBtn.addEventListener('click', () => {
                    if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                    this.deleteSubtask(sheet, subtask.id);
                });

                subtasksList.appendChild(li);
            });
        };

        // Update subtasks count
        this.updateSubtasksCount = (sheet) => {
            const countEl = sheet.querySelector('#subtasksCount');
            if (countEl) {
                countEl.textContent = this.currentSubtasks.length;
            }
        };

        // Setup keyboard avoidance using visualViewport API - positions footer above keyboard
        this.setupKeyboardAvoidance = (sheet) => {
            // Only apply on mobile devices (not desktop)
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const isDesktop = window.matchMedia('(min-width: 769px)').matches;
            
            if (!isMobile || isDesktop) {
                return;
            }

            const footer = sheet.querySelector('.task-sheet-footer');
            if (!footer) return;

            let resizeHandler = null;
            let scrollHandler = null;
            let focusInHandler = null;
            let focusOutHandler = null;
            let rafId = null;

            // Calculate keyboard height and update footer position
            const updateFooterPosition = () => {
                // Cancel any pending animation frame
                if (rafId) {
                    cancelAnimationFrame(rafId);
                }

                rafId = requestAnimationFrame(() => {
                    let keyboardHeight = 0;
                    let isKeyboardVisible = false;

                    if (window.visualViewport) {
                        // Use visualViewport API (preferred method)
                        const viewport = window.visualViewport;
                        const windowHeight = window.innerHeight;
                        const viewportHeight = viewport.height;
                        const viewportTop = viewport.offsetTop;
                        keyboardHeight = Math.max(0, windowHeight - (viewportHeight + viewportTop));
                        isKeyboardVisible = keyboardHeight > 50;
                    } else {
                        // Fallback: monitor viewport height changes
                        const currentHeight = window.innerHeight;
                        const initialHeight = sheet._initialViewportHeight || currentHeight;
                        if (!sheet._initialViewportHeight) {
                            sheet._initialViewportHeight = currentHeight;
                        }
                        const heightDiff = initialHeight - currentHeight;
                        keyboardHeight = Math.max(0, heightDiff);
                        isKeyboardVisible = keyboardHeight > 50;
                    }

                    // Update footer bottom position
                    // CSS base is calc(0px + env(safe-area-inset-bottom)), we add keyboard height
                    if (keyboardHeight > 0) {
                        footer.style.bottom = `calc(${keyboardHeight}px + env(safe-area-inset-bottom))`;
                    } else {
                        footer.style.bottom = 'calc(0px + env(safe-area-inset-bottom))';
                    }

                    // Add/remove keyboard-open class on html element
                    if (isKeyboardVisible) {
                        document.documentElement.classList.add('keyboard-open');
                    } else {
                        document.documentElement.classList.remove('keyboard-open');
                    }
                });
            };

            // Throttle resize handler to prevent layout thrashing
            let resizeTimeout = null;
            resizeHandler = () => {
                if (resizeTimeout) {
                    clearTimeout(resizeTimeout);
                }
                resizeTimeout = setTimeout(updateFooterPosition, 16); // ~60fps
            };

            scrollHandler = updateFooterPosition;

            // Focus handlers for additional stability
            focusInHandler = (e) => {
                // Check if focus is on an input within the sheet
                if (sheet.contains(e.target)) {
                    // Small delay to allow keyboard to appear
                    setTimeout(updateFooterPosition, 100);
                }
            };

            focusOutHandler = (e) => {
                // Check if focus is leaving the sheet
                if (sheet.contains(e.target)) {
                    // Delay to check if keyboard actually closed
                    setTimeout(() => {
                        // Only update if no input in sheet is focused
                        const activeElement = document.activeElement;
                        if (!sheet.contains(activeElement) || activeElement === document.body) {
                            updateFooterPosition();
                        }
                    }, 150);
                }
            };

            // Initial check
            updateFooterPosition();

            // Listen for viewport resize/scroll (keyboard show/hide)
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', resizeHandler);
                window.visualViewport.addEventListener('scroll', scrollHandler);
            } else {
                // Fallback: monitor window resize
                window.addEventListener('resize', resizeHandler);
            }

            // Listen for focus events
            document.addEventListener('focusin', focusInHandler);
            document.addEventListener('focusout', focusOutHandler);

            // Store cleanup function on sheet element
            sheet._keyboardAvoidanceCleanup = () => {
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                if (window.visualViewport) {
                    if (resizeHandler) {
                        window.visualViewport.removeEventListener('resize', resizeHandler);
                    }
                    if (scrollHandler) {
                        window.visualViewport.removeEventListener('scroll', scrollHandler);
                    }
                } else {
                    if (resizeHandler) {
                        window.removeEventListener('resize', resizeHandler);
                    }
                }
                if (focusInHandler) {
                    document.removeEventListener('focusin', focusInHandler);
                }
                if (focusOutHandler) {
                    document.removeEventListener('focusout', focusOutHandler);
                }
                if (resizeTimeout) {
                    clearTimeout(resizeTimeout);
                }
                // Reset footer to CSS default (includes safe-area-inset-bottom)
                footer.style.bottom = '';
                document.documentElement.classList.remove('keyboard-open');
                delete sheet._initialViewportHeight;
            };
        };

        // Setup keyboard scroll handling and auto-grow for details
        this.setupKeyboardScrollHandling = (sheet) => {
            const body = sheet.querySelector('.task-sheet-body');
            const inputs = sheet.querySelectorAll('input, [contenteditable="true"]');
            const detailsInput = sheet.querySelector('#newTaskDetails');

            // Auto-grow for details input
            if (detailsInput) {
                const autoGrowDetails = () => {
                    // Reset height to auto to get the correct scrollHeight
                    detailsInput.style.height = 'auto';
                    const scrollHeight = detailsInput.scrollHeight;
                    const lineHeight = parseFloat(getComputedStyle(detailsInput).lineHeight);
                    const maxHeight = lineHeight * 4 + 12; // 4 lines max
                    
                    if (scrollHeight <= maxHeight) {
                        detailsInput.style.height = scrollHeight + 'px';
                        detailsInput.style.overflowY = 'hidden';
                    } else {
                        detailsInput.style.height = maxHeight + 'px';
                        detailsInput.style.overflowY = 'auto';
                    }
                };

                // Initial height
                autoGrowDetails();

                // Auto-grow on input
                detailsInput.addEventListener('input', autoGrowDetails);
                detailsInput.addEventListener('paste', () => {
                    setTimeout(autoGrowDetails, 10);
                });

                // Show details content when focused
                detailsInput.addEventListener('focus', () => {
                    this.updateSectionVisibility(sheet);
                    setTimeout(() => {
                        autoGrowDetails();
                    }, 10);
                });

                // Update visibility on blur
                detailsInput.addEventListener('blur', () => {
                    setTimeout(() => {
                        this.updateSectionVisibility(sheet);
                    }, 100);
                });
            }

            // Scroll into view for all inputs with keyboard avoidance
            const footer = sheet.querySelector('.task-sheet-footer');
            const footerHeight = footer ? footer.offsetHeight : 72;
            
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                    // Set scroll-padding-bottom to account for footer
                    const body = sheet.querySelector('.task-sheet-body');
                    if (body) {
                        body.style.scrollPaddingBottom = `${footerHeight + 20}px`;
                    }

                    setTimeout(() => {
                        input.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'nearest'
                        });
                    }, 300); // Delay for keyboard animation
                });
            });
        };

        // Populate bottom sheet data (task only; no subtask-only mode)
        this.populateBottomSheetData = (sheet) => {
            const deleteBtn = sheet.querySelector('#newDeleteBtn');
            if (deleteBtn) deleteBtn.textContent = (typeof window.t === 'function' ? window.t('delete') : 'Delete');
            if (this.currentTask) {
                    const titleEl = sheet.querySelector('#newTaskTitle');
                    titleEl.textContent = this.getTaskDisplayTitle(this.currentTask);
                    this.setupRichTextEditor(titleEl);
                    const detailsEl = sheet.querySelector('#newTaskDetails');
                    detailsEl.innerHTML = this.processLinksForDisplay(this.currentTask.details || '');
                    this.setupRichTextEditor(detailsEl);
                    setTimeout(() => {
                        detailsEl.style.height = 'auto';
                        const sh = detailsEl.scrollHeight;
                        const lh = parseFloat(getComputedStyle(detailsEl).lineHeight);
                        const maxH = lh * 4 + 12;
                        detailsEl.style.height = (sh <= maxH ? sh : maxH) + 'px';
                        detailsEl.style.overflowY = sh <= maxH ? 'hidden' : 'auto';
                    }, 50);
                    deleteBtn.style.display = 'inline-block';
                    this.renderSubtasks(sheet);
                    this.updateSubtasksCount(sheet);
                    if (this.currentTask.dueDate) {
                        const dueYMD = this.normalizeDueYMD(this.currentTask.dueDate);
                        const todayStr = this.getTodayYMD();
                        const tomorrowStr = this.getTomorrowYMD();
                        if (dueYMD === todayStr) this.selectBottomSheetDate(sheet, 'today');
                        else if (dueYMD === tomorrowStr) this.selectBottomSheetDate(sheet, 'tomorrow');
                        else {
                            this.selectedDate = dueYMD;
                            sheet.querySelector('#newCalendarBtn').classList.add('active');
                        }
                    }
                    if (this.currentTask.repeat && this.currentTask.repeat !== 'none') {
                        this.selectedRepeat = this.currentTask.repeat;
                        setTimeout(() => this.updateRepeatButtonState(sheet), 100);
                    }
            } else {
                sheet.querySelector('#newTaskTitle').textContent = '';
                sheet.querySelector('#newTaskDetails').innerHTML = '';
                deleteBtn.style.display = 'none';
                this.selectedDate = null;
                this.selectedRepeat = 'none';
                this.currentSubtasks = [];
                this.renderSubtasks(sheet);
                this.updateSubtasksCount(sheet);
            }

            setTimeout(() => this.updateSectionVisibility(sheet), 50);
            setTimeout(() => {
                if (this.focusSubtasksWhenSheetOpen) {
                    this.focusSubtasksWhenSheetOpen = false;
                    const section = sheet.querySelector('#subtasksSection');
                    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    const titleInput = sheet.querySelector('#newTaskTitle');
                    if (titleInput) {
                        titleInput.focus();
                        this.setupRichTextEditor(titleInput);
                    }
                }
                this.updateSaveButtonState(sheet);
            }, 100);
        };

        // Helper: Escape HTML
        this.escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

        // Save bottom sheet task
        this.saveBottomSheetTask = async (sheet) => {
            const titleEl = sheet.querySelector('#newTaskTitle');
            const title = titleEl.textContent.trim();
            const detailsEl = sheet.querySelector('#newTaskDetails');
            const details = this.extractTextFromRichEditor(detailsEl);

            if (!title) {
                if (this.comicEffects && this.comicEffects.playSound) {
                    this.comicEffects.playSound('taskCancel');
                }
                return;
            }

            // サブタスク入力欄に未追加のテキストがあれば保存前に追加
            const subtaskInput = sheet.querySelector('#subtaskInput');
            if (subtaskInput && subtaskInput.value.trim()) {
                const text = subtaskInput.value.trim();
                this.currentSubtasks = this.currentSubtasks || [];
                this.currentSubtasks.push({ id: Date.now().toString(), text, done: false });
                subtaskInput.value = '';
                if (this.updateSubtasksCount) this.updateSubtasksCount(sheet);
            }

            const dueDate = this.selectedDate ? this.normalizeDueYMD(this.selectedDate) : null;
            const repeat = this.selectedRepeat || 'none';
            const subtasks = (this.currentSubtasks || []).map(st => this.normalizeSubtask(st)).filter(Boolean);
            const listId = this.currentListId || 'default';

            if (this.currentTask) {
                this.currentTask.title = title;
                this.currentTask.details = details;
                this.currentTask.dueDate = dueDate;
                this.currentTask.repeat = repeat;
                this.currentTask.subtasks = subtasks;
                if (this.isAuthenticated) {
                    try {
                        await updateTaskInFirestore(this.currentTask.id, {
                            title,
                            details: details || '',
                            dueDate,
                            repeat,
                            subtasks
                        });
                    } catch (error) {
                        console.error('[PixDone] Error updating task in Firestore:', error);
                    }
                }
                const currentList = this.getCurrentList();
                if (currentList && currentList.tasks) {
                    const taskIndex = currentList.tasks.findIndex(t => t.id === this.currentTask.id);
                    if (taskIndex >= 0) {
                        currentList.tasks[taskIndex] = { ...this.currentTask };
                    }
                }
            } else {
                const currentList = this.getCurrentList();
                const newTask = {
                    id: Date.now().toString(),
                    title: title,
                    details: details,
                    dueDate: dueDate,
                    repeat: repeat,
                    completed: false,
                    listId: listId,
                    subtasks: subtasks
                };
                if (this.isAuthenticated) {
                    try {
                        const taskId = await addTaskToFirestore(title, details, dueDate, repeat, listId, subtasks);
                        if (taskId) newTask.id = taskId;
                    } catch (error) {
                        console.error('[PixDone] Error adding task to Firestore:', error);
                    }
                }
                if (currentList && currentList.tasks) {
                    currentList.tasks.unshift(newTask);
                    this.tasks = currentList.tasks;
                }
            }

            this.saveTasks();
            this.renderTasks();
            this.hideMobileModal();
            this.currentTask = null;
            this.selectedDate = null;
            this.selectedRepeat = 'none';
            this.currentSubtasks = [];
        };

        // Select date in bottom sheet
        this.selectBottomSheetDate = (sheet, dateType, customDate) => {
            const buttons = sheet.querySelectorAll('.task-sheet-date-btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
            });

            if (dateType === 'today') {
                const btn = sheet.querySelector('#newTodayBtn');
                btn.classList.add('active');
                this.selectedDate = this.getTodayYMD();
            } else if (dateType === 'tomorrow') {
                const btn = sheet.querySelector('#newTomorrowBtn');
                btn.classList.add('active');
                this.selectedDate = this.getTomorrowYMD();
            } else if (dateType === 'custom' && customDate) {
                const btn = sheet.querySelector('#newCalendarBtn');
                btn.classList.add('active');
                this.selectedDate = this.normalizeDueYMD(customDate);
            }
        };

        // Show native date picker (bottom sheet): make input openable then call showPicker/click
        this.showNativeDatePicker = (sheet) => {
            const nativeDatePicker = sheet.querySelector('#newNativeDatePicker');
            if (!nativeDatePicker) return;
            // Many browsers won't open the picker when input is display:none. Make it "visible" but invisible.
            nativeDatePicker.style.display = 'block';
            nativeDatePicker.style.position = 'fixed';
            nativeDatePicker.style.left = '0';
            nativeDatePicker.style.top = '0';
            nativeDatePicker.style.width = '100%';
            nativeDatePicker.style.height = '100%';
            nativeDatePicker.style.opacity = '0';
            nativeDatePicker.style.pointerEvents = 'auto';
            nativeDatePicker.style.zIndex = '99999';
            if (!nativeDatePicker.value) {
                nativeDatePicker.value = this.getTodayYMD();
            }
            const hideAgain = () => {
                nativeDatePicker.style.display = 'none';
                nativeDatePicker.style.position = '';
                nativeDatePicker.style.left = '';
                nativeDatePicker.style.top = '';
                nativeDatePicker.style.width = '';
                nativeDatePicker.style.height = '';
                nativeDatePicker.style.opacity = '';
                nativeDatePicker.style.pointerEvents = '';
                nativeDatePicker.style.zIndex = '';
            };
            nativeDatePicker.addEventListener('blur', hideAgain, { once: true });
            nativeDatePicker.addEventListener('change', hideAgain, { once: true });
            // Open synchronously within user gesture when possible
            try {
                if (typeof nativeDatePicker.showPicker === 'function') {
                    nativeDatePicker.showPicker();
                } else {
                    nativeDatePicker.focus();
                    nativeDatePicker.click();
                }
            } catch (e) {
                try {
                    nativeDatePicker.focus();
                    nativeDatePicker.click();
                } catch (_) { }
            }
        };

        // Show repeat selector in bottom sheet
        this.showBottomSheetRepeat = (sheet) => {
            // Simple toggle for now - can be enhanced with dropdown
            const repeatBtn = sheet.querySelector('#newRepeatBtn');
            const repeatOptions = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
            const currentIndex = repeatOptions.indexOf(this.selectedRepeat || 'none');
            const nextIndex = (currentIndex + 1) % repeatOptions.length;
            this.selectedRepeat = repeatOptions[nextIndex];
            this.updateRepeatButtonState(sheet);
        };

        // Update repeat button state
        this.updateRepeatButtonState = (sheet) => {
            const repeatBtn = sheet.querySelector('#newRepeatBtn');
            if (repeatBtn && this.selectedRepeat && this.selectedRepeat !== 'none') {
                repeatBtn.classList.add('active');
            } else if (repeatBtn) {
                repeatBtn.classList.remove('active');
            }
        };

        // Update save button state
        this.updateSaveButtonState = (sheet) => {
            const titleInput = sheet.querySelector('#newTaskTitle');
            const saveButton = sheet.querySelector('#newSaveBtn');

            if (titleInput && saveButton) {
                const title = titleInput.textContent.trim();
                const isEmpty = title === '';

                if (isEmpty) {
                    saveButton.disabled = true;
                    saveButton.style.opacity = '0.6';
                    saveButton.style.cursor = 'not-allowed';
                } else {
                    saveButton.disabled = false;
                    saveButton.style.opacity = '1';
                    saveButton.style.cursor = 'pointer';
                }
            }
        };

        // Save button validation
        this.updateSaveButtonState = () => {
            const titleInput = document.getElementById('newTaskTitle');
            const saveButton = document.getElementById('newSaveBtn');

            if (titleInput && saveButton) {
                const title = titleInput.textContent.trim();
                const isEmpty = title === '';

                if (isEmpty) {
                    // Disable save button
                    saveButton.disabled = true;
                    saveButton.style.background = 'var(--border-color) !important';
                    saveButton.style.color = 'var(--text-secondary) !important';
                    saveButton.style.borderColor = 'var(--border-color) !important';
                    saveButton.style.cursor = 'not-allowed !important';
                    saveButton.style.opacity = '0.6 !important';
                } else {
                    // Enable save button
                    saveButton.disabled = false;
                    saveButton.style.background = 'var(--accent-color) !important';
                    saveButton.style.color = 'white !important';
                    saveButton.style.borderColor = 'var(--accent-color) !important';
                    saveButton.style.cursor = 'pointer !important';
                    saveButton.style.opacity = '1 !important';
                }
            }
        };

        // Modal helper functions
        this.selectNewModalDate = (dateType, customDate) => {
            const buttons = document.querySelectorAll('.new-date-btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'var(--bg-primary)';
                btn.style.color = 'var(--text-secondary)';
                btn.style.borderColor = 'var(--border-color)';
            });

            if (dateType === 'today') {
                const btn = document.getElementById('newTodayBtn');
                btn.classList.add('active');
                btn.style.background = 'var(--accent-color)';
                btn.style.color = 'white';
                btn.style.borderColor = 'var(--accent-color)';
                this.selectedDate = this.getTodayYMD();
            } else if (dateType === 'tomorrow') {
                const btn = document.getElementById('newTomorrowBtn');
                btn.classList.add('active');
                btn.style.background = 'var(--accent-color)';
                btn.style.color = 'white';
                btn.style.borderColor = 'var(--accent-color)';
                this.selectedDate = this.getTomorrowYMD();
            } else if (dateType === 'custom' && customDate) {
                const btn = document.getElementById('newCalendarBtn');
                btn.classList.add('active');
                btn.style.background = 'var(--accent-color)';
                btn.style.color = 'white';
                btn.style.borderColor = 'var(--accent-color)';
                this.selectedDate = this.normalizeDueYMD(customDate);
            }

            // No need to hide anything for native date picker
        };

        // Helper method to reset all date buttons
        this.resetAllDateButtons = () => {
            document.querySelectorAll('.new-date-btn').forEach(btn => {
                btn.style.background = 'var(--bg-primary)';
                btn.style.color = 'var(--text-secondary)';
                btn.style.borderColor = 'var(--border-color)';
            });

            // Reset button text
            const todayBtn = document.getElementById('newTodayBtn');
            const tomorrowBtn = document.getElementById('newTomorrowBtn');
            const calendarBtn = document.getElementById('newCalendarBtn');
            if (todayBtn) todayBtn.innerHTML = (typeof window.t === 'function' ? window.t('today') : 'Today');
            if (tomorrowBtn) tomorrowBtn.innerHTML = (typeof window.t === 'function' ? window.t('tomorrow') : 'Tomorrow');
            if (calendarBtn) calendarBtn.innerHTML = '<i class="fa fa-calendar"></i> ' + (typeof window.t === 'function' ? window.t('pick') : 'Pick');
        };

        this.showNativeDatePicker = () => {
            const datePicker = document.getElementById('newNativeDatePicker');
            if (datePicker) {
                // Set today as default if no date is selected
                if (!datePicker.value) {
                    const today = new Date();
                    datePicker.value = this.getTodayYMD();
                }
                datePicker.focus();
                // Use showPicker for better native experience
                if (datePicker.showPicker) {
                    datePicker.showPicker();
                } else {
                    // Fallback to click for older browsers
                    datePicker.click();
                }
            }
        };

        // Native date picker doesn't need these methods

        this.showNewModalRepeat = () => {
            // Remove existing repeat modal if any
            const existingModal = document.getElementById('newRepeatSelector');
            if (existingModal) {
                existingModal.remove();
            }

            // Create new repeat modal
            const repeatModal = document.createElement('div');
            repeatModal.id = 'newRepeatSelector';
            repeatModal.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.5) !important;
                z-index: 100001 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-sizing: border-box !important;
            `;

            const rt = (typeof window.t === 'function' ? window.t : (k) => k);
            repeatModal.innerHTML = `
                <div id="repeatModalContent" style="width: 300px !important; max-width: 90% !important; background: var(--bg-primary) !important; border: 2px solid var(--border-color) !important; border-radius: 0px !important; box-shadow: 4px 4px 0px var(--shadow-color) !important; padding: 16px !important; box-sizing: border-box !important;">
                    <div style="display: flex !important; flex-direction: column !important; gap: 12px !important;">
                        <div style="text-align: center !important; margin-bottom: 8px !important;">
                            <h3 class="pixel-title" style="font-size: var(--md-title-medium) !important; color: var(--text-primary) !important; font-weight: 600 !important; font-family: 'VT323', 'Courier New', monospace !important; margin: 0 !important;">${rt('repeatFrequency')}</h3>
                        </div>
                        <div style="display: flex !important; flex-direction: column !important; gap: 8px !important;">
                            <button class="repeat-option" data-value="none" style="width: 100% !important; padding: 12px !important; border: 2px solid var(--border-color) !important; border-radius: 0px !important; background: var(--bg-primary) !important; color: var(--text-primary) !important; font-size: var(--md-label-large) !important; cursor: pointer !important; font-family: Inter, sans-serif !important; box-shadow: 2px 2px 0px var(--shadow-color) !important; image-rendering: pixelated !important; text-align: left !important; transition: all 0.2s ease !important; font-weight: 500 !important;">${rt('noRepeat')}</button>
                            <button class="repeat-option" data-value="daily" style="width: 100% !important; padding: 12px !important; border: 2px solid var(--border-color) !important; border-radius: 0px !important; background: var(--bg-primary) !important; color: var(--text-primary) !important; font-size: var(--md-label-large) !important; cursor: pointer !important; font-family: Inter, sans-serif !important; box-shadow: 2px 2px 0px var(--shadow-color) !important; image-rendering: pixelated !important; text-align: left !important; transition: all 0.2s ease !important; font-weight: 500 !important;">${rt('daily')}</button>
                            <button class="repeat-option" data-value="weekly" style="width: 100% !important; padding: 12px !important; border: 2px solid var(--border-color) !important; border-radius: 0px !important; background: var(--bg-primary) !important; color: var(--text-primary) !important; font-size: var(--md-label-large) !important; cursor: pointer !important; font-family: Inter, sans-serif !important; box-shadow: 2px 2px 0px var(--shadow-color) !important; image-rendering: pixelated !important; text-align: left !important; transition: all 0.2s ease !important; font-weight: 500 !important;">${rt('weekly')}</button>
                            <button class="repeat-option" data-value="monthly" style="width: 100% !important; padding: 12px !important; border: 2px solid var(--border-color) !important; border-radius: 0px !important; background: var(--bg-primary) !important; color: var(--text-primary) !important; font-size: var(--md-label-large) !important; cursor: pointer !important; font-family: Inter, sans-serif !important; box-shadow: 2px 2px 0px var(--shadow-color) !important; image-rendering: pixelated !important; text-align: left !important; transition: all 0.2s ease !important; font-weight: 500 !important;">${rt('monthly')}</button>
                            <button class="repeat-option" data-value="yearly" style="width: 100% !important; padding: 12px !important; border: 2px solid var(--border-color) !important; border-radius: 0px !important; background: var(--bg-primary) !important; color: var(--text-primary) !important; font-size: var(--md-label-large) !important; cursor: pointer !important; font-family: Inter, sans-serif !important; box-shadow: 2px 2px 0px var(--shadow-color) !important; image-rendering: pixelated !important; text-align: left !important; transition: all 0.2s ease !important; font-weight: 500 !important;">${rt('yearly')}</button>
                        </div>
                        <div style="display: flex !important; gap: 8px !important; margin-top: 8px !important;">
                            <button id="newCancelRepeatBtn" style="flex: 1 !important; padding: 8px !important; border: 2px solid var(--border-color) !important; border-radius: 0px !important; cursor: pointer !important; font-size: var(--md-label-large) !important; background: var(--bg-primary) !important; color: var(--text-secondary) !important; box-shadow: 2px 2px 0px var(--shadow-color) !important; font-family: Inter, sans-serif !important; image-rendering: pixelated !important; font-weight: 600 !important;">${rt('cancel')}</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(repeatModal);

            // Add background click to close
            repeatModal.addEventListener('click', (e) => {
                if (e.target === repeatModal) {
                    this.hideNewModalRepeat();
                    this.comicEffects.playSound('taskCancel');
                }
            });

            // Prevent content clicks from bubbling to background
            const content = repeatModal.querySelector('#repeatModalContent');
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Add event listeners for repeat options
            repeatModal.querySelectorAll('.repeat-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const value = e.target.dataset.value;
                    this.selectedRepeat = value;
                    this.updateRepeatButtonState();
                    this.hideNewModalRepeat();
                    this.comicEffects.playSound('taskAdd');
                });
            });

            // Cancel button
            const cancelBtn = repeatModal.querySelector('#newCancelRepeatBtn');
            cancelBtn.addEventListener('click', () => {
                this.hideNewModalRepeat();
                this.comicEffects.playSound('taskCancel');
            });
        };

        this.updateRepeatButtonState = () => {
            const btn = document.getElementById('newRepeatBtn');
            if (!btn) return;
            const t = typeof window.t === 'function' ? window.t : (k) => k;
            const repeatLabels = { daily: t('daily'), weekly: t('weekly'), monthly: t('monthly'), yearly: t('yearly') };
            if (this.selectedRepeat === 'none') {
                btn.classList.remove('active');
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
                btn.innerHTML = '<i class="fa fa-repeat" aria-hidden="true"></i> ' + t('repeat');
            } else {
                btn.classList.add('active');
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
                btn.innerHTML = `<i class="fa fa-repeat" aria-hidden="true"></i> ${repeatLabels[this.selectedRepeat] || t('repeat')}`;
            }
        };

        this.hideNewModalRepeat = () => {
            const repeatSelector = document.getElementById('newRepeatSelector');
            if (repeatSelector) {
                repeatSelector.remove();
            }
        };

        // Helper functions for mobile modal updates
        this.updateMobileModalDateButtons = (task) => {
            // Update date buttons for mobile modal
            document.querySelectorAll('.new-date-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'var(--bg-primary)';
                btn.style.color = 'var(--text-secondary)';
                btn.style.borderColor = 'var(--border-color)';
            });

            if (task.dueDate) {
                const today = this.getTodayYMD();
                const tomorrowStr = this.getTomorrowYMD();

                if (task.dueDate === today) {
                    const todayBtn = document.getElementById('newTodayBtn');
                    if (todayBtn) {
                        todayBtn.classList.add('active');
                        todayBtn.style.background = 'var(--accent-color)';
                        todayBtn.style.color = 'white';
                        todayBtn.style.borderColor = 'var(--accent-color)';
                    }
                } else if (task.dueDate === tomorrowStr) {
                    const tomorrowBtn = document.getElementById('newTomorrowBtn');
                    if (tomorrowBtn) {
                        tomorrowBtn.classList.add('active');
                        tomorrowBtn.style.background = 'var(--accent-color)';
                        tomorrowBtn.style.color = 'white';
                        tomorrowBtn.style.borderColor = 'var(--accent-color)';
                    }
                } else {
                    const calendarBtn = document.getElementById('newCalendarBtn');
                    const datePicker = document.getElementById('newNativeDatePicker');
                    if (calendarBtn) {
                        calendarBtn.classList.add('active');
                        calendarBtn.style.background = 'var(--accent-color)';
                        calendarBtn.style.color = 'white';
                        calendarBtn.style.borderColor = 'var(--accent-color)';
                        // Format date for display
                        const date = this.parseYMDToLocalDate(task.dueDate) || new Date(task.dueDate);
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        calendarBtn.innerHTML = `<i class="fa fa-calendar"></i> ${month}/${day}`;
                    }
                    if (datePicker) {
                        datePicker.value = task.dueDate;
                    }
                }
            }
        };

        this.updateMobileModalRepeatButton = (task) => {
            const repeatBtn = document.getElementById('newRepeatBtn');
            const repeatInterval = document.getElementById('newRepeatInterval');

            const t = typeof window.t === 'function' ? window.t : (k) => k;
            const repeatLabels = { daily: t('daily'), weekly: t('weekly'), monthly: t('monthly'), yearly: t('yearly') };
            if (task.repeat && task.repeat !== 'none') {
                this.selectedRepeat = task.repeat;
                if (repeatInterval) repeatInterval.value = task.repeat;
                if (repeatBtn) {
                    repeatBtn.classList.add('active');
                    repeatBtn.style.background = '';
                    repeatBtn.style.color = '';
                    repeatBtn.style.borderColor = '';
                    repeatBtn.innerHTML = `<i class="fa fa-repeat" aria-hidden="true"></i> ${repeatLabels[task.repeat] || t('repeat')}`;
                }
            } else {
                this.selectedRepeat = 'none';
                if (repeatInterval) repeatInterval.value = 'none';
                if (repeatBtn) {
                    repeatBtn.classList.remove('active');
                    repeatBtn.style.background = '';
                    repeatBtn.style.color = '';
                    repeatBtn.style.borderColor = '';
                    repeatBtn.innerHTML = '<i class="fa fa-repeat" aria-hidden="true"></i> Repeat';
                }
            }
        };

        this.saveNewModalTask = () => {
            // Legacy function - redirects to bottom sheet save if using new modal
            const sheet = document.getElementById('newMobileModal');
            if (sheet && sheet.classList.contains('task-bottom-sheet')) {
                this.saveBottomSheetTask(sheet);
                return;
            }

            // Fallback for old modal structure
            const titleEl = document.getElementById('newTaskTitle');
            const title = titleEl ? titleEl.textContent.trim() : '';
            const detailsEl = document.getElementById('newTaskDetails');
            const details = detailsEl ? this.extractTextFromRichEditor(detailsEl) : '';

            if (!title) {
                if (this.comicEffects && this.comicEffects.playSound) {
                    this.comicEffects.playSound('taskCancel');
                }
                return;
            }

            const currentList = this.getCurrentList();
            if (this.currentTask) {
                // Update existing task
                this.currentTask.title = title;
                this.currentTask.details = details;
                this.currentTask.dueDate = this.selectedDate ? this.normalizeDueYMD(this.selectedDate) : null;
                this.currentTask.repeat = this.selectedRepeat || 'none';
                this.currentTask.subtasks = (this.currentSubtasks || []).map(st => this.normalizeSubtask(st)).filter(Boolean);

                // Update task in current list
                if (currentList && currentList.tasks) {
                    const taskIndex = currentList.tasks.findIndex(t => t.id === this.currentTask.id);
                    if (taskIndex >= 0) {
                        currentList.tasks[taskIndex] = { ...this.currentTask };
                    }
                }
            } else {
                // Create new task
                const newTask = {
                    id: Date.now().toString(),
                    title: title,
                    details: details,
                    dueDate: this.selectedDate ? this.normalizeDueYMD(this.selectedDate) : null,
                    repeat: this.selectedRepeat || 'none',
                    completed: false,
                    listId: this.currentListId || 'default',
                    subtasks: this.currentSubtasks || []
                };

                if (currentList && currentList.tasks) {
                    currentList.tasks.unshift(newTask);
                }
            }

            this.saveTasks();
            this.renderTasks();
            this.hideMobileModal();

            // Reset form state
            this.currentTask = null;
            this.selectedDate = null;
            this.selectedRepeat = 'none';
            this.currentSubtasks = [];
        };

        this.hideMobileModal = () => {
            const modal = document.getElementById('newMobileModal');
            if (modal) {
                // Cleanup keyboard avoidance listeners
                if (modal._keyboardAvoidanceCleanup) {
                    modal._keyboardAvoidanceCleanup();
                }
                modal.remove();
            }

            // Also hide any open repeat modal
            const repeatModal = document.getElementById('newRepeatSelector');
            if (repeatModal) {
                repeatModal.remove();
            }

            this.isMobileModalOpen = false;

            // Show appropriate empty state
            const activeTasks = this.tasks.filter(t => !t.completed);
            const hasNoTasks = this.tasks.length === 0;

            if (activeTasks.length === 0) {
                const emptyState = document.getElementById('emptyState');
                const gameStartEmpty = document.getElementById('gameStartEmpty');

                if (hasNoTasks) {
                    if (emptyState) emptyState.style.display = 'none';
                    if (gameStartEmpty) gameStartEmpty.style.display = 'block';
                } else {
                    if (emptyState) emptyState.style.display = 'block';
                    if (gameStartEmpty) gameStartEmpty.style.display = 'none';
                }
            }

            console.log('[PixDone] New modal hidden');
        };

        // Duplicate function removed - using the correct one above

        // Date selection methods
        this.selectNewModalDate = (type, customDate = null) => {
            const todayStr = this.getTodayYMD();
            const tomorrowStr = this.getTomorrowYMD();

            // Check if we're toggling off an already selected date
            if (type === 'today' && this.selectedDate === todayStr) {
                // Deselect today
                this.selectedDate = null;
                this.resetAllDateButtons();
                return;
            } else if (type === 'tomorrow' && this.selectedDate === tomorrowStr) {
                // Deselect tomorrow  
                this.selectedDate = null;
                this.resetAllDateButtons();
                return;
            }

            // Otherwise, proceed with normal selection
            // Remove active class from all date buttons and reset text
            this.resetAllDateButtons();

            if (type === 'today') {
                this.selectedDate = todayStr;
                const todayBtn = document.getElementById('newTodayBtn');
                if (todayBtn) {
                    todayBtn.style.background = 'var(--accent-color)';
                    todayBtn.style.color = 'white';
                    todayBtn.style.borderColor = 'var(--accent-color)';
                    todayBtn.innerHTML = (typeof window.t === 'function' ? window.t('today') : 'Today');
                }
            } else if (type === 'tomorrow') {
                this.selectedDate = tomorrowStr;
                const tomorrowBtn = document.getElementById('newTomorrowBtn');
                if (tomorrowBtn) {
                    tomorrowBtn.style.background = 'var(--accent-color)';
                    tomorrowBtn.style.color = 'white';
                    tomorrowBtn.style.borderColor = 'var(--accent-color)';
                    tomorrowBtn.innerHTML = (typeof window.t === 'function' ? window.t('tomorrow') : 'Tomorrow');
                }
            } else if (type === 'custom' && customDate) {
                this.selectedDate = customDate;
                const calendarBtn = document.getElementById('newCalendarBtn');
                if (calendarBtn) {
                    calendarBtn.style.background = 'var(--accent-color)';
                    calendarBtn.style.color = 'white';
                    calendarBtn.style.borderColor = 'var(--accent-color)';

                    // Show the selected date on the button
                    const selectedDateObj = new Date(customDate);
                    const formattedDate = selectedDateObj.toLocaleDateString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit'
                    });
                    calendarBtn.innerHTML = `<i class="fa fa-calendar"></i> ${formattedDate}`;
                }
            }

            // Play sound if available
            if (this.comicEffects && this.comicEffects.playSound) {
                this.comicEffects.playSound('buttonClick');
            }
        };

        this.toggleNewModalCalendar = () => {
            const picker = document.getElementById('newCalendarPicker');
            if (picker.style.display === 'none') {
                picker.style.display = 'block';
                document.getElementById('newCustomDatePicker').focus();
            } else {
                this.hideNewModalCalendar();
            }
        };

        this.hideNewModalCalendar = () => {
            document.getElementById('newCalendarPicker').style.display = 'none';
        };

        this.toggleNewModalRepeat = () => {
            const selector = document.getElementById('newRepeatSelector');
            if (selector && selector.style.display === 'none') {
                selector.style.display = 'block';
            } else if (selector) {
                selector.style.display = 'none';
            }
            // Play sound if available
            if (this.comicEffects && this.comicEffects.playSound) {
                this.comicEffects.playSound('buttonClick');
            }
        };

        this.setNewModalDate = (dueDate) => {
            if (!dueDate) return;

            const today = this.getTodayYMD();
            const tomorrowStr = this.getTomorrowYMD();

            if (dueDate === today) {
                this.selectNewModalDate('today');
            } else if (dueDate === tomorrowStr) {
                this.selectNewModalDate('tomorrow');
            } else {
                document.getElementById('newCustomDatePicker').value = dueDate;
                this.selectNewModalDate('custom', dueDate);
            }
        };

        this.setNewModalRepeat = (repeat) => {
            if (repeat && repeat !== 'none') {
                document.getElementById('newRepeatInterval').value = repeat;
                this.toggleNewModalRepeat();
            }
        };

        console.log('[PixDone] New modal system created');
    }

    validateUIComponents() {
        console.log('[PixDone] Starting UI component validation...');

        // Skip old modal validation - using new programmatic system
        const requiredElements = [];

        // DOM ready状態を確認
        console.log('[PixDone] DOM ready state:', document.readyState);

        const missing = requiredElements.filter(id => {
            const element = document.getElementById(id);
            console.log(`[PixDone] Checking element '${id}':`, element ? 'FOUND' : 'NOT FOUND');
            return !element;
        });

        if (missing.length > 0) {
            console.error('Missing UI elements:', missing);
            console.log('[PixDone] Searching for mobile modal in DOM...');

            // モバイルモーダルが存在するか確認
            const mobileModal = document.querySelector('#mobileModal');
            console.log('[PixDone] Mobile modal element:', mobileModal);

            if (mobileModal) {
                console.log('[PixDone] Mobile modal innerHTML:', mobileModal.innerHTML);
            }

            // HTML構造を確認して、実際のIDを表示
            const modal = document.getElementById('mobileModal');
            if (modal) {
                console.log('Modal found, checking children...');
                const allIds = Array.from(modal.querySelectorAll('*')).map(el => el.id).filter(id => id);
                console.log('Available IDs in modal:', allIds);
            }

            return false;
        }
        console.log('All UI components validated successfully');
        return true;
    }

    setupFirebaseAuthListener() {
        const currentUser = firebase.auth().currentUser;
        const authHint = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pixdone-auth-hint') : null;

        if (currentUser) {
            this.user = currentUser;
            this.isAuthenticated = true;
            this.showUserInfo();
        } else if (authHint === 'logged_in') {
            this.user = null;
            this.isAuthenticated = false;
            this.showUserInfo();
        } else {
            this.showLoginButton();
        }

        firebase.auth().onAuthStateChanged(async (user) => {
            this.user = user;
            this.isAuthenticated = !!user;
            this.updateSyncIndicatorVisibility();
            if (user) {
                this.isLoadingFromFirestore = true;
                this.showUserInfo();
                // ログイン時：ローカルデータをクリアしてFirebaseのみ使用
                await this.migrateLocalDataToFirebase();
                // Firestoreリスト・タスク監視をセットアップ
                await this.setupFirestoreRealtimeListeners();
            } else {
                this.showLoginButton();
                // ログアウト時：Firestoreリスナーを解除してローカルデータに切り替え
                if (this.listsUnsubscribe) this.listsUnsubscribe();
                if (this.tasksUnsubscribe) this.tasksUnsubscribe();
                if (this.allTasksUnsubscribe) this.allTasksUnsubscribe();
                this.taskCountsByListId = {};

                // 未ログインでもデフォルトリストを確保
                this.loadTasks();
                this.loadLists();
                this.ensureDefaultList();
                // 未ログイン時は必ず Tutorial（id: default）を選択
                const defaultList = this.lists.find(l => l.id === 'default');
                if (defaultList) {
                    if (defaultList.name !== 'Tutorial') {
                        defaultList.name = 'Tutorial';
                    }
                    const defaultIdx = this.lists.findIndex(l => l.id === 'default');
                    if (defaultIdx > 0) {
                        const [def] = this.lists.splice(defaultIdx, 1);
                        this.lists.unshift(def);
                    }
                    this.currentListId = 'default';
                }
                this.renderListTabs();
                this.renderTasks();
                this.updateCompletedCount();
                this.updateListTitle();
                console.log('Data loaded from localStorage for offline use');
            }
        });
    }

    async migrateLocalDataToFirebase() {
        try {
            // ローカルデータを確認
            this.loadTasks();
            this.loadLists();

            // ローカルタスクがあるかチェック（チュートリアルタスクは除外）
            const localTasks = this.tasks.filter(task =>
                task.listId === 'default' &&
                !task.id.startsWith('tutorial-')
            );

            if (localTasks.length === 0) {
                this.lists = [];
                this.tasks = [];
                this.currentListId = null;
                this.taskIdCounter = 1;
                this.listIdCounter = 1;
                localStorage.removeItem('pixTaskLists');
                localStorage.removeItem('pixTaskTasks');
                localStorage.removeItem('pixTaskCurrentListId');
                localStorage.removeItem('pixTaskTaskIdCounter');
                localStorage.removeItem('pixTaskListIdCounter');
                localStorage.removeItem('google_tasks_data');
                localStorage.removeItem('google_tasks_lists');
                return;
            }

            if (localTasks.length > 0) {
                console.log('Migrating local tasks to Firebase...');

                // Firebase上のMy Tasksリストを取得または作成
                const user = firebase.auth().currentUser;
                const listsSnap = await db.collection('lists').where('uid', '==', user.uid).where('name', '==', 'My Tasks').get();

                let myTasksListId;
                if (listsSnap.empty) {
                    // My Tasksリストが存在しない場合は作成
                    const listRef = await db.collection('lists').add({
                        name: 'My Tasks',
                        uid: user.uid,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    myTasksListId = listRef.id;
                } else {
                    // 既存のMy Tasksリストを使用
                    myTasksListId = listsSnap.docs[0].id;
                    // 重複したMy Tasksリストがある場合は削除
                    if (listsSnap.docs.length > 1) {
                        const batch = db.batch();
                        for (let i = 1; i < listsSnap.docs.length; i++) {
                            batch.delete(listsSnap.docs[i].ref);
                        }
                        await batch.commit();
                        console.log('Removed duplicate My Tasks lists');
                    }
                }

                // ローカルタスクをFirebaseに移行（チュートリアルタスクは除外）
                const batch = db.batch();
                localTasks.forEach(task => {
                    const taskRef = db.collection('tasks').doc();
                    batch.set(taskRef, {
                        ...task,
                        listId: myTasksListId,
                        uid: user.uid,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();

                console.log(`Migrated ${localTasks.length} tasks to Firebase`);
            }

            // ローカルデータをクリア（認証後はチュートリアルタスクは不要）
            this.lists = [];
            this.tasks = [];
            this.currentListId = null;
            this.taskIdCounter = 1;
            this.listIdCounter = 1;
            localStorage.removeItem('pixTaskLists');
            localStorage.removeItem('pixTaskTasks');
            localStorage.removeItem('pixTaskCurrentListId');
            localStorage.removeItem('pixTaskTaskIdCounter');
            localStorage.removeItem('pixTaskListIdCounter');
            localStorage.removeItem('google_tasks_data');
            localStorage.removeItem('google_tasks_lists');

            console.log('Local data cleared, tutorial tasks removed');

        } catch (error) {
            console.error('Error migrating local data to Firebase:', error);
        }
    }

    async setupFirestoreRealtimeListeners() {
        // 既存のリスナーを解除
        if (this.listsUnsubscribe) this.listsUnsubscribe();
        if (this.tasksUnsubscribe) this.tasksUnsubscribe();
        if (this.allTasksUnsubscribe) this.allTasksUnsubscribe();

        // Tasks (all lists) listener for tab badge counts
        this.allTasksUnsubscribe = listenAllTasksFromFirestore((tasks) => {
            const counts = {};
            for (const t of tasks || []) {
                if (!t) continue;
                if (!t.listId) continue;
                if (t.completed) continue;
                if (!this.isTopLevelTask(t)) continue;
                const lid = String(t.listId);
                counts[lid] = (counts[lid] || 0) + 1;
            }
            this.taskCountsByListId = counts;
            this.renderListTabs();
        });

        // リスト監視
        this.listsUnsubscribe = listenListsFromFirestore(async (lists) => {
            this.lists = lists;
            this.isLoadingFromFirestore = false;
            this.renderTasks();

            // 必要なリストを確保（マイタスク＝My Tasks、中身は同じ）
            const hasMyTasks = lists.some(l => this.isMyTasksList(l));
            const hasSmashList = lists.some(l => l.name === '💥 Smash List');

            // My Tasksリストがなければ作成
            if (!hasMyTasks && !this.isCreatingMyTasksList) {
                this.isCreatingMyTasksList = true;
                await addListToFirestore('My Tasks');
                this.isCreatingMyTasksList = false;
                return; // 生成後は次のonSnapshotで再取得
            }

            // Smash Listがなければ作成
            if (!hasSmashList && !this.isCreatingSmashList) {
                this.isCreatingSmashList = true;
                await addListToFirestore('💥 Smash List');
                this.isCreatingSmashList = false;
                return; // 生成後は次のonSnapshotで再取得
            }
            // currentListIdが未設定ならMy Tasksを選択
            if (!this.currentListId || !lists.some(l => l.id === this.currentListId)) {
                const myTasks = lists.find(l => this.isMyTasksList(l));
                this.currentListId = myTasks ? myTasks.id : lists[0].id;
            }
            this.renderListTabs();
            // タスクリスナー再セット
            this.setupTasksRealtimeListener();
        });
    }

    setupTasksRealtimeListener() {
        if (this.tasksUnsubscribe) this.tasksUnsubscribe();
        if (!this.currentListId) {
            this.tasks = [];
            this.renderTasks();
            return;
        }
        this.tasksUnsubscribe = listenTasksFromFirestore(this.currentListId, (tasks) => {
            this.tasks = tasks;
            const idx = this.lists.findIndex(l => l.id === this.currentListId);
            if (idx !== -1) {
                this.lists[idx].tasks = tasks;
            }
            // 完了アニメーション中は renderTasks を遅延（DOM置換でアニメが途切れるのを防ぐ）
            if (this.suppressSnapshotRenderUntil && Date.now() < this.suppressSnapshotRenderUntil) {
                return;
            }
            this.renderTasks();
            this.updateCompletedCount();
            this.renderListTabs();
        });
    }

    showUserInfo() {
        const userInfo = document.getElementById('userInfo');
        const authButtons = document.getElementById('authButtons');
        const userEmail = document.getElementById('userEmail');
        const userSection = document.getElementById('userSection');

        try {
            sessionStorage.setItem('pixdone-auth-hint', 'logged_in');
        } catch (e) {}

        if (userInfo) userInfo.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        if (userSection) userSection.removeAttribute('data-auth-pending');
        if (this.user && userEmail) {
            userEmail.textContent = this.user.email || 'User';
        } else if (userEmail) {
            userEmail.textContent = '…';
        }
    }

    showLoginButton() {
        const userInfo = document.getElementById('userInfo');
        const authButtons = document.getElementById('authButtons');
        const userSection = document.getElementById('userSection');

        try {
            sessionStorage.setItem('pixdone-auth-hint', 'logged_out');
        } catch (e) {}

        if (userInfo) userInfo.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        if (userSection) userSection.removeAttribute('data-auth-pending');
    }

    loadTasks() {
        try {
            const data = localStorage.getItem('google_tasks_data');
            if (data) {
                const parsed = JSON.parse(data);
                this.tasks = parsed.tasks || [];
                this.taskIdCounter = parsed.taskIdCounter || 1;
                this.currentListId = parsed.currentListId || 'default';
            }

            // Tutorial tasks are now handled in loadLists() method
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }



    hideUserInfo() {
        const userInfo = document.getElementById('userInfo');
        const authButtons = document.getElementById('authButtons');

        if (userInfo) userInfo.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
    }

    generateSmashTasks() {
        const tasks = [];
        for (let i = 0; i < 3; i++) {
            const pool = this.getSmashListTasks();
            const randomTask = pool[Math.floor(Math.random() * pool.length)];
            tasks.push({
                id: `smash-${Date.now()}-${i}`,
                title: randomTask,
                completed: false,
                dueDate: null,
                priority: 'normal',
                category: 'general',
                description: '',
                listId: 'smash-list'
            });
        }
        return tasks;
    }

    replenishSmashTasks() {
        const smashList = this.lists.find(l => l.id === 'smash-list' || l.name === '💥 Smash List');
        if (smashList) {
            const incompleteTasks = smashList.tasks.filter(t => !t.completed);
            if (incompleteTasks.length < 3) {
                const tasksToAdd = 3 - incompleteTasks.length;
                const pool = this.getSmashListTasks();
                for (let i = 0; i < tasksToAdd; i++) {
                    const randomTask = pool[Math.floor(Math.random() * pool.length)];
                    const newTask = {
                        id: `smash-${Date.now()}-${Math.random()}`,
                        title: randomTask,
                        completed: false,
                        dueDate: null,
                        priority: 'normal',
                        category: 'general',
                        description: '',
                        listId: smashList.id
                    };
                    smashList.tasks.push(newTask);
                }
                this.renderTasks();
            }
        }
    }

    maintainSmashListTasks() {
        const currentList = this.getCurrentList();
        if (currentList && (currentList.id === 'smash-list' || currentList.name === '💥 Smash List')) {
            // Remove all completed tasks from Smash List
            currentList.tasks = currentList.tasks.filter(t => !t.completed);

            // Ensure exactly 3 tasks
            const pool = this.getSmashListTasks();
            while (currentList.tasks.length < 3) {
                const randomTask = pool[Math.floor(Math.random() * pool.length)];
                const newTask = {
                    id: `smash-${Date.now()}-${Math.random()}`,
                    title: randomTask,
                    completed: false,
                    dueDate: null,
                    priority: 'normal',
                    category: 'general',
                    description: '',
                    listId: currentList.id
                };
                currentList.tasks.push(newTask);
            }

            // Keep only 3 tasks
            if (currentList.tasks.length > 3) {
                currentList.tasks = currentList.tasks.slice(0, 3);
            }
        }
    }

    async loadServerData() {
        if (!this.isAuthenticated) {
            // User not authenticated, skip server data load
            return;
        }

        try {
            // Load Firestore data for authenticated user
            // Firestoreからリスト取得
            const serverLists = await loadListsFromFirestore();
            this.lists = [];
            for (const list of serverLists) {
                // Firestoreから各リストのタスク取得
                const serverTasks = await window.db.collection('tasks')
                    .where('uid', '==', firebase.auth().currentUser.uid)
                    .where('listId', '==', list.id)
                    .orderBy('createdAt', 'desc')
                    .limit(200)
                    .get();
                const tasks = serverTasks.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.lists.push({
                    id: list.id,
                    name: list.name,
                    tasks
                });
            }
            if (this.lists.length > 0) {
                if (!this.lists.some(l => l.id === this.currentListId)) {
                    this.currentListId = this.lists[0].id;
                }
            }
            this.updateCountersFromServerData();
            this.renderListTabs();
            this.updateListTitle();
            this.renderTasks();
            this.updateCompletedCount();
        } catch (error) {
            // Error loading Firestore data - display appropriate error message
            this.showErrorMessage('Failed to load tasks and lists from server.');
        }
    }

    updateCountersFromServerData() {
        // Update taskIdCounter based on server data
        let maxTaskId = 0;
        for (const list of this.lists) {
            for (const task of list.tasks) {
                if (task.id > maxTaskId) {
                    maxTaskId = task.id;
                }
            }
        }
        this.taskIdCounter = maxTaskId + 1;

        // Update listIdCounter based on server data
        let maxListId = 0;
        for (const list of this.lists) {
            if (list.id > maxListId) {
                maxListId = list.id;
            }
        }
        this.listIdCounter = maxListId + 1;
    }

    /**
     * Renders a non-interactive preview of a list into a page's .task-list-preview container.
     * Used for prev/next pages so both lists are visible during swipe.
     */
    renderListPreviewIntoPage(list, pageEl) {
        const preview = pageEl.querySelector('.task-list-preview');
        if (!preview) return;

        if (!list) {
            preview.innerHTML = '';
            return;
        }

        const topLevelTasks = (list.tasks || []).filter(t => this.isTopLevelTask(t));
        const activeTasks = topLevelTasks.filter(t => !t.completed);

        if (list.id === 'smash-list' || list.name === '💥 Smash List') {
            const smashTasks = activeTasks.slice(0, 3);
            let smashSub = (typeof window.t === 'function' ? window.t('smashListSubtitle') : 'This list exists only to let you tap and smash tasks for pure satisfaction. No saving, no planning—just smashing.');
            smashSub = smashSub.replace(/\. /g, '.<br>').replace(/。/g, '。<br>');
            preview.innerHTML = `
                <div class="task-list task-list-preview-inner">
                    <div class="smash-list-message">
                        <p class="smash-list-subtitle">${smashSub}</p>
                    </div>
                    ${smashTasks.map(task => this.renderSmashTask(task)).join('')}
                </div>
            `;
        } else if (activeTasks.length > 0) {
            preview.innerHTML = `
                <div class="task-list task-list-preview-inner">
                    ${activeTasks.map(task => this.renderTask(task)).join('')}
                </div>
            `;
            preview.querySelectorAll('.task-card').forEach(el => { el.draggable = false; });
        } else {
            const emptyLabel = typeof window.t === 'function' ? window.t('noTasksRest') : 'No tasks - Time to rest!';
            preview.innerHTML = `
                <div class="task-list task-list-preview-inner task-list-preview-empty">
                    <div class="empty-state-preview">
                        <div class="empty-illustration">
                            <div class="pixel-character">
                                <div class="sleep-bubble"><div class="bubble-text">zzz...</div></div>
                            </div>
                        </div>
                        <p>${this.escapeHtml(emptyLabel)}</p>
                    </div>
                </div>
            `;
        }
    }

    syncPagerPages() {
        const viewport = document.querySelector('.pager-viewport');
        const track = document.querySelector('.pager-track');
        const tasksContainer = document.querySelector('.task-list-container');
        if (!viewport || !track || !tasksContainer) return;

        const count = this.lists?.length || 1;
        const currentIndex = Math.max(0, this.lists?.findIndex(list => list.id === this.currentListId) ?? 0);
        const targetCount = Math.max(1, count);

        // Build N pages; each page has a .task-list-preview container
        let pages = track.querySelectorAll('.pager-page');
        while (pages.length < targetCount) {
            const page = document.createElement('div');
            page.className = 'pager-page';
            page.dataset.pageIndex = String(pages.length);
            const preview = document.createElement('div');
            preview.className = 'task-list-preview';
            page.appendChild(preview);
            track.appendChild(page);
            pages = track.querySelectorAll('.pager-page');
        }
        while (pages.length > targetCount) {
            const last = pages[pages.length - 1];
            if (last.contains(tasksContainer)) {
                const active = track.querySelector(`.pager-page[data-page-index="${currentIndex}"]`);
                if (active) active.appendChild(tasksContainer);
            }
            last.remove();
            pages = track.querySelectorAll('.pager-page');
        }

        // Ensure every page has a .task-list-preview (for pages created from initial HTML)
        track.querySelectorAll('.pager-page').forEach((p) => {
            if (!p.querySelector('.task-list-preview')) {
                const preview = document.createElement('div');
                preview.className = 'task-list-preview';
                p.appendChild(preview);
            }
        });

        // Put tasksContainer in active page
        const activePage = track.querySelector(`.pager-page[data-page-index="${currentIndex}"]`);
        if (activePage && !activePage.contains(tasksContainer)) {
            activePage.appendChild(tasksContainer);
        }

        // Render previews for prev and next pages only (adjacent lists visible during swipe)
        const prevIndex = targetCount > 1 ? (currentIndex > 0 ? currentIndex - 1 : targetCount - 1) : -1;
        const nextIndex = targetCount > 1 ? (currentIndex < targetCount - 1 ? currentIndex + 1 : 0) : -1;

        track.querySelectorAll('.pager-page').forEach((page, i) => {
            const preview = page.querySelector('.task-list-preview');
            if (!preview) return;
            if (i === prevIndex || i === nextIndex) {
                const list = this.lists?.[i];
                this.renderListPreviewIntoPage(list, page);
            } else {
                preview.innerHTML = '';
            }
        });

        track.style.width = `${targetCount * 100}%`;
        track.querySelectorAll('.pager-page').forEach((p, i) => {
            p.style.flex = `0 0 ${100 / targetCount}%`;
        });
        const viewportWidth = viewport.offsetWidth;
        track.style.transform = `translateX(${-currentIndex * viewportWidth}px)`;
    }

    setupPagerSwipe() {
        const swipeTarget = document.getElementById('contentBelowTabs');
        const viewport = document.querySelector('.pager-viewport');
        const track = document.querySelector('.pager-track');
        if (!swipeTarget || !viewport || !track) return;

        this.syncPagerPages();

        let startX = 0, startY = 0, startTime = 0;
        let activePointerId = null;
        let isLocked = false;
        const LOCK_DY_OFFSET_PX = 8;
        const SNAP_MS = 220;

        const canSwipe = () => {
            if (!this.lists || this.lists.length <= 1) return false;
            if (this.isAnyModalOpen && this.isAnyModalOpen()) return false;
            if (this.isInputVisible) return false;
            const ae = document.activeElement;
            if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return false;
            return true;
        };

        const getCurrentIndex = () => Math.max(0, this.lists?.findIndex(list => list.id === this.currentListId) ?? 0);

        const applyTrackTransform = (offsetPx, useTransition = false) => {
            track.style.transition = useTransition ? `transform ${SNAP_MS}ms ease-out` : 'none';
            track.style.transform = `translateX(${offsetPx}px)`;
        };

        // Swipe start blocked on: inputs, task interactions, buttons. #contentBelowTabs 全域でスワイプ開始可（上記以外）
        const shouldBlockSwipeStart = (target) => {
            if (!target || !target.closest) return true;
            if (target.closest('#taskInputContainer')) return true;
            if (target.closest('input, textarea, select')) return true;
            if (target.closest('[contenteditable="true"]')) return true;
            if (target.closest('.task-checkbox, .task-actions, .task-action-btn, .task-link, .task-action-link')) return true;
            if (target.closest('button')) return true;
            if (target.closest('.list-tab, .add-list-tab-btn')) return true;
            if (target.closest('.task-item.dragging')) return true;
            if (target.closest('.task-item.completed')) return true;
            return false;
        };

        const handlePointerDown = (e) => {
            if (!canSwipe() || activePointerId !== null) return;
            if (shouldBlockSwipeStart(e.target)) return;

            activePointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;
            startTime = Date.now();
            isLocked = false;
            // Do NOT setPointerCapture here: wait for horizontal intent to avoid blocking vertical scroll
        };

        const handlePointerMove = (e) => {
            if (e.pointerId !== activePointerId) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const adx = Math.abs(dx), ady = Math.abs(dy);

            if (!isLocked) {
                // Horizontal intent: abs(dx) > abs(dy) + 8px. Before lock: do NOT preventDefault (preserves body vertical scroll)
                if (adx > ady + LOCK_DY_OFFSET_PX) {
                    isLocked = true;
                    try { swipeTarget.setPointerCapture(e.pointerId); } catch (_) {}
                    e.preventDefault();
                } else {
                    return;
                }
            }

            const viewportWidth = viewport.offsetWidth;
            const baseOffset = -getCurrentIndex() * viewportWidth;
            applyTrackTransform(baseOffset + dx, false);
            e.preventDefault();
        };

        const handlePointerUp = (e) => {
            if (e.pointerId !== activePointerId) return;
            if (isLocked) {
                try { swipeTarget.releasePointerCapture(e.pointerId); } catch (_) {}
            }
            const wasLocked = isLocked;
            activePointerId = null;
            isLocked = false;

            if (!wasLocked) return;

            const dx = e.clientX - startX;
            const durationMs = Date.now() - startTime;
            const velocity = durationMs > 0 ? Math.abs(dx) / durationMs : 0;
            const viewportWidth = viewport.offsetWidth;
            const switchThreshold = viewportWidth * 0.25;
            const shouldSwitch = Math.abs(dx) > switchThreshold || velocity > 0.5;

            if (shouldSwitch && canSwipe()) {
                if (dx > 0) {
                    this.switchToPreviousList();
                } else {
                    this.switchToNextList();
                }
            }
            this.syncPagerPages();
        };

        const handlePointerCancel = (e) => {
            if (e.pointerId === activePointerId) {
                if (isLocked) {
                    try { swipeTarget.releasePointerCapture(e.pointerId); } catch (_) {}
                }
                activePointerId = null;
                isLocked = false;
                this.syncPagerPages();
            }
        };

        // Fallback: if pointer released outside swipeTarget before lock, ensure cleanup
        const handleDocumentPointerUp = (e) => {
            if (e.pointerId === activePointerId && !swipeTarget.contains(e.target)) {
                activePointerId = null;
                isLocked = false;
            }
        };

        swipeTarget.addEventListener('pointerdown', handlePointerDown, { passive: true });
        swipeTarget.addEventListener('pointermove', handlePointerMove, { passive: false });
        swipeTarget.addEventListener('pointerup', handlePointerUp, { passive: true });
        swipeTarget.addEventListener('pointercancel', handlePointerCancel, { passive: true });
        document.addEventListener('pointerup', handleDocumentPointerUp, { passive: true });

        /*
         * 動作確認の観点:
         * - PC/モバイル: #contentBelowTabs 内の空白・ヘッダ・カード外で横スワイプ → リスト切り替え
         * - 縦スクロール: 縦方向のドラッグは body の自然なスクロールに委譲（引っかかりなし）
         * - 入力中: #taskInputContainer 内・input/textarea/contenteditable 上ではスワイプ開始しない
         * - タブ横スクロール: .list-tabs は header 内で、#contentBelowTabs 外 → 影響なし
         * - モーダル表示中: canSwipe でモーダルオープン時はスワイプ無効
         */
    }

    setupEventListeners() {
        // Handle internal action links ([text](action:command))
        document.addEventListener('click', (e) => {
            const actionLink = e.target.closest('.task-action-link');
            if (actionLink) {
                e.preventDefault();
                const action = actionLink.dataset.action;
                console.log('Action link clicked:', action);
                if (action === 'smash-list') {
                    this.switchToList('smash-list');
                } else if (action === 'signup') {
                    this.showEmailAuthModal();
                }
            }
        });

        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showTaskInput();
            // メニュー選択音を再生
            this.comicEffects.playSound('taskAdd');
        });

        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
            // Close mobile modal if open
            if (this.isMobileModalOpen) {
                this.hideMobileModal();
            }
        });

        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', () => {
            if (this.isMobileModalOpen) {
                this.hideMobileModal();
            } else {
                this.hideTaskInput();
            }
            this.comicEffects.playSound('taskCancel');
        });

        // Delete button
        document.getElementById('deleteBtn').addEventListener('click', async () => {
            if (this.currentTask) {
                console.log('Delete button clicked for task:', this.currentTask.id);
                this.comicEffects.playSound('taskDelete');

                // Delete task directly without modal
                if (this.isAuthenticated) {
                    try {
                        await deleteTaskFromFirestore(this.currentTask.id);
                    } catch (error) {
                        console.error('Error deleting task from Firestore:', error);
                    }
                }

                this.tasks = this.tasks.filter(t => t.id !== this.currentTask.id);
                this.saveTasks();
                this.renderTasks();
                this.updateCompletedCount();
                this.renderListTabs(); // Update tab counts

                // Hide task input if it was open
                if (this.isInputVisible) {
                    this.hideTaskInput();
                }

                // Hide mobile modal if it was open
                if (this.isMobileModalOpen) {
                    this.hideMobileModal();
                }
            }
        });

        // フォーム外クリックで閉じる（自動保存）
        document.addEventListener('click', (e) => {
            const taskForm = document.getElementById('taskForm');
            const addTaskBtn = document.getElementById('addTaskBtn');

            if (this.isInputVisible &&
                taskForm && !taskForm.contains(e.target) &&
                addTaskBtn && !addTaskBtn.contains(e.target)) {

                const title = document.getElementById('taskTitle').value.trim();
                if (title) {
                    this.saveTask();
                } else {
                    this.hideTaskInput();
                    this.comicEffects.playSound('taskCancel');
                }
            }
        });

        // モバイル用のタッチイベント対応（自動保存）
        document.addEventListener('touchstart', (e) => {
            const taskForm = document.getElementById('taskForm');
            const addTaskBtn = document.getElementById('addTaskBtn');

            if (this.isInputVisible &&
                taskForm && !taskForm.contains(e.target) &&
                addTaskBtn && !addTaskBtn.contains(e.target)) {

                const title = document.getElementById('taskTitle').value.trim();
                if (title) {
                    this.saveTask();
                } else {
                    this.hideTaskInput();
                    this.comicEffects.playSound('taskCancel');
                }
            }
        });



        // Date buttons
        document.getElementById('todayBtn').addEventListener('click', () => {
            this.selectDate('today');
            this.comicEffects.playSound('taskAdd');
        });

        document.getElementById('tomorrowBtn').addEventListener('click', () => {
            this.selectDate('tomorrow');
            this.comicEffects.playSound('taskAdd');
        });

        document.getElementById('calendarBtn').addEventListener('click', () => {
            this.openCalendarPicker();
            this.comicEffects.playSound('taskAdd');
        });

        // カスタム日付選択
        const customDatePicker = document.getElementById('customDatePicker');
        if (customDatePicker) {
            customDatePicker.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.selectCustomDate(e.target.value);
                    this.comicEffects.playSound('taskAdd');
                }
            });
        }

        // 繰り返しボタン
        const repeatBtn = document.getElementById('repeatBtn');
        if (repeatBtn) {
            repeatBtn.addEventListener('click', () => {
                this.toggleRepeatSelector();
                this.comicEffects.playSound('taskAdd');
            });
        }

        // 繰り返し選択
        const repeatInterval = document.getElementById('repeatInterval');
        if (repeatInterval) {
            repeatInterval.addEventListener('change', (e) => {
                this.selectedRepeat = e.target.value;
            });
        }

        // Completed section toggle
        const completedToggle = document.getElementById('completedToggle');
        if (completedToggle) {
            completedToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleCompletedSection();
            });

            // Add touch event for mobile
            completedToggle.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleCompletedSection();
            });
        }

        // Delete modal buttons
        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.confirmDeleteTask();
        });

        // Create list modal events
        document.getElementById('createListForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.comicEffects.playSound('taskAdd');
            this.handleCreateList();
        });

        document.getElementById('cancelCreateList').addEventListener('click', () => {
            this.comicEffects.playSound('taskCancel');
            this.hideCreateListModal();
        });

        // Edit list modal events
        document.getElementById('editListForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.comicEffects.playSound('taskAdd');
            this.handleEditList();
        });

        document.getElementById('cancelEditList').addEventListener('click', () => {
            this.comicEffects.playSound('taskCancel');
            this.hideEditListModal();
        });

        // Delete list modal events
        document.getElementById('cancelDeleteList').addEventListener('click', () => {
            this.comicEffects.playSound('taskCancel');
            this.hideDeleteListModal();
        });

        document.getElementById('confirmDeleteList').addEventListener('click', () => {
            this.comicEffects.playSound('taskDelete');
            this.handleDeleteList();
        });

        // Context menu events
        document.getElementById('contextMenuEdit').addEventListener('click', () => {
            this.comicEffects.playSound('taskEdit');
            this.showEditListModal(this.contextMenuListId);
            this.hideContextMenu();
        });

        document.getElementById('contextMenuDelete').addEventListener('click', () => {
            this.comicEffects.playSound('taskDelete');
            this.showDeleteListModal(this.contextMenuListId);
            this.hideContextMenu();
        });

        // Close context menu when clicking outside
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('contextMenu');
            if (contextMenu && contextMenu.classList.contains('active') &&
                !e.target.closest('#contextMenu') && !e.target.closest('.list-tab')) {
                this.hideContextMenu();
            }
        });

        // List menu button
        const listMenuBtn = document.getElementById('listMenuBtn');
        if (listMenuBtn) {
            // Remove any existing event listeners
            listMenuBtn.removeEventListener('click', this.listMenuClickHandler);

            // Create a new handler and store it
            this.listMenuClickHandler = (e) => {
                e.stopPropagation();
                console.log('List menu button clicked');

                // Play sound first
                this.comicEffects.playSound('taskEdit');

                // Don't show menu for default list
                const currentList = this.getCurrentList();
                const isDefaultList = currentList && this.isMyTasksList(currentList);

                console.log('Current list:', currentList);
                console.log('Is default list:', isDefaultList);

                if (!isDefaultList) {
                    this.showListContextMenu(e, this.currentListId);
                }
            };

            listMenuBtn.addEventListener('click', this.listMenuClickHandler);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isInputVisible) {
                    const title = document.getElementById('taskTitle').value.trim();
                    if (title) {
                        this.saveTask();
                    } else {
                        this.hideTaskInput();
                        this.comicEffects.playSound('taskCancel');
                    }
                } else if (document.getElementById('createListModal').classList.contains('active')) {
                    this.hideCreateListModal();
                } else if (document.getElementById('editListModal').classList.contains('active')) {
                    this.hideEditListModal();
                } else if (document.getElementById('deleteListModal').classList.contains('active')) {
                    this.hideDeleteListModal();
                } else if (document.getElementById('deleteModal').classList.contains('active')) {
                    this.hideDeleteModal();
                } else if (document.getElementById('celebrationOverlay').classList.contains('active')) {
                    this.hideCelebration();
                } else if (document.getElementById('contextMenu').classList.contains('active')) {
                    this.hideContextMenu();
                } else if (this.isMobileModalOpen) {
                    const titleEl = document.getElementById('newTaskTitle');
                    const title = titleEl ? titleEl.textContent.trim() : '';
                    if (title) {
                        this.saveNewModalTask();
                    } else {
                        this.hideMobileModal();
                        this.comicEffects.playSound('taskCancel');
                    }
                }
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                // Only handle arrow keys if no modals are open and user is NOT editing text
                const isTextEditing = (() => {
                    if (e.isComposing || e.keyCode === 229) return true;
                    const target = e.target;
                    if (target && typeof target.closest === 'function') {
                        if (target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return true;
                    }
                    const ae = document.activeElement;
                    if (!ae) return false;
                    if (ae.tagName && ae.tagName.match(/INPUT|TEXTAREA|SELECT/)) return true;
                    if (ae.isContentEditable) return true;
                    if (ae.closest && ae.closest('[contenteditable="true"]')) return true;
                    return false;
                })();

                if (!this.isInputVisible &&
                    !document.getElementById('createListModal').classList.contains('active') &&
                    !document.getElementById('deleteModal').classList.contains('active') &&
                    !this.isMobileModalOpen &&
                    !isTextEditing) {

                    e.preventDefault();
                    if (e.key === 'ArrowLeft') {
                        this.switchToPreviousList();
                    } else if (e.key === 'ArrowRight') {
                        this.switchToNextList();
                    }
                }
            }
        });

        // Enter key to add task (モバイル最適化)
        document.getElementById('taskTitle').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveTask();
                this.comicEffects.playSound('taskAdd');
            }
        });

        // モバイルキーボード対応
        document.getElementById('taskTitle').addEventListener('input', (e) => {
            // モバイルでの入力体験を向上
            if (window.innerWidth <= 768) {
                e.target.style.borderColor = 'var(--accent-color)';
                setTimeout(() => {
                    e.target.style.borderColor = '';
                }, 200);
            }
        });

        // Mobile modal event listeners now handled by new system

        // Logo CRT world shutdown effect (checkmark only)
        const appLogo = document.querySelector('.app-logo');
        if (appLogo && this.comicEffects?.playWorldShutdownCrtHardCut) {
            appLogo.addEventListener('pointerup', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.comicEffects.playWorldShutdownCrtHardCut();
            });
        }

        // List management events
        document.getElementById('addListBtn').addEventListener('click', () => {
            this.comicEffects.playSound('taskAdd');
            this.showCreateListModal();
        });

        // List menu button (duplicate removed)

        // Auth events
        document.getElementById('signupBtn').addEventListener('click', () => {
            this.comicEffects.playSound('taskAdd');
            this.showEmailAuthModal();
        });
        document.getElementById('tutorialSignUpBtn')?.addEventListener('click', () => {
            this.comicEffects.playSound('taskAdd');
            this.showEmailAuthModal();
        });

        // User menu and account management
        document.getElementById('userAvatarBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.comicEffects.playSound('taskEdit');
            this.toggleUserDropdown();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.comicEffects.playSound('taskCancel');
            this.logout();
        });

        document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
            this.comicEffects.playSound('taskDelete');
            this.showDeleteAccountModal();
        });

        document.querySelector('.settings-link')?.addEventListener('click', () => {
            if (this.comicEffects?.playSound) this.comicEffects.playSound('buttonClick');
        });

        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn && this.comicEffects) {
            soundToggleBtn.setAttribute('aria-checked', this.comicEffects.getSoundEnabled());
            soundToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const enabled = !this.comicEffects.getSoundEnabled();
                this.comicEffects.setSoundEnabled(enabled);
                soundToggleBtn.setAttribute('aria-checked', enabled);
                if (enabled) this.comicEffects.playSound('buttonClick');
            });
        }

        const langEnBtn = document.getElementById('langEnBtn');
        const langJaBtn = document.getElementById('langJaBtn');
        const authLangEnBtn = document.getElementById('authLangEnBtn');
        const authLangJaBtn = document.getElementById('authLangJaBtn');

        const bindLangChip = (btn, lang) => {
            if (!btn || typeof window.setLang !== 'function') return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.comicEffects?.playSound) this.comicEffects.playSound('buttonClick');
                window.setLang(lang);
                this.refreshLangUI();
                this.updateListTitle();
                this.renderTasks();
                this.renderListTabs();
            });
        };
        bindLangChip(langEnBtn, 'en');
        bindLangChip(langJaBtn, 'ja');
        bindLangChip(authLangEnBtn, 'en');
        bindLangChip(authLangJaBtn, 'ja');

        // 画面に戻ったときにリスト・タブの表示を現在の言語で再描画（英語に戻るのを防ぐ）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) return;
            if (typeof window.applyI18n === 'function') window.applyI18n();
            this.updateListTitle();
            this.renderListTabs();
        });

        document.getElementById('confirmDeleteAccount')?.addEventListener('click', () => {
            this.comicEffects.playSound('taskDelete');
            this.deleteAccount();
        });

        document.getElementById('cancelDeleteAccount')?.addEventListener('click', () => {
            this.comicEffects.playSound('taskCancel');
            this.hideDeleteAccountModal();
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                const userDropdown = document.getElementById('userDropdown');
                if (userDropdown && userDropdown.style.display === 'block') {
                    userDropdown.style.display = 'none';
                    if (this.comicEffects?.playSound) this.comicEffects.playSound('taskCancel');
                }
            }
        });

        // Close modals when clicking outside
        document.getElementById('createListModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('createListModal')) {
                this.hideCreateListModal();
            }
        });

        // Create list form (duplicate - already handled above)
        // Edit list form (duplicate - already handled above)

        // Cancel buttons (duplicate - already handled above)
        // Removed duplicated event listeners

        // Email auth modal events
        document.getElementById('emailAuthModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('emailAuthModal')) {
                this.hideEmailAuthModal();
            }
        });

        document.getElementById('emailAuthCloseBtn').addEventListener('click', () => {
            this.comicEffects.playSound('buttonClick');
            this.hideEmailAuthModal();
        });

        // Removed authBackBtn and authSkipBtn event listeners as buttons were removed from HTML

        document.getElementById('toggleAuthMode').addEventListener('click', () => {
            this.comicEffects.playSound('taskEdit');
            this.toggleEmailAuthMode();
        });

        document.getElementById('emailAuthForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            this.comicEffects.playSound('taskAdd');
            await this.handleEmailAuth();
        });

        // Password reset events
        document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
            this.comicEffects.playSound('buttonClick');
            this.showPasswordResetModal();
        });

        document.getElementById('backToLoginBtn').addEventListener('click', () => {
            this.hidePasswordResetModal();
            this.showEmailAuthModal();
        });

        document.getElementById('passwordResetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handlePasswordReset();
        });

        // Password reset modal close on outside click
        document.getElementById('passwordResetModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('passwordResetModal')) {
                this.hidePasswordResetModal();
            }
        });

        document.getElementById('passwordResetCloseBtn').addEventListener('click', () => {
            this.comicEffects.playSound('buttonClick');
            this.hidePasswordResetModal();
            this.showEmailAuthModal();
        });

        // Password visibility toggle
        document.getElementById('passwordToggle').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Password setup form
        document.getElementById('passwordSetupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePasswordSetup();
        });

        document.getElementById('passwordSetupCloseBtn').addEventListener('click', () => {
            this.comicEffects.playSound('buttonClick');
            this.hidePasswordSetupModal();
        });

        // Password setup toggles
        document.getElementById('newPasswordToggle').addEventListener('click', () => {
            this.togglePasswordVisibility('newPasswordInput', 'newPasswordToggle');
        });

        document.getElementById('confirmPasswordToggle').addEventListener('click', () => {
            this.togglePasswordVisibility('confirmPasswordInput', 'confirmPasswordToggle');
        });

        // Social auth buttons removed from HTML

        // Close modals when clicking outside
        document.getElementById('editListModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('editListModal')) {
                this.hideEditListModal();
            }
        });

        document.getElementById('deleteListModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('deleteListModal')) {
                this.hideDeleteListModal();
            }
        });

        // Context menu events
        document.getElementById('contextMenuEdit').addEventListener('click', () => {
            this.hideContextMenu();
            this.showEditListModal(this.contextMenuListId);
        });

        document.getElementById('contextMenuDelete').addEventListener('click', () => {
            this.hideContextMenu();
            this.showDeleteListModal(this.contextMenuListId);
        });

        // Hide context menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });

        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('deleteModal')) {
                this.hideDeleteModal();
                this.comicEffects.playSound('taskCancel');
            }
        });
    }

    showTaskInput() {
        this.isInputVisible = true;

        // Hide both empty states when showing task input
        const emptyState = document.getElementById('emptyState');
        const gameStartEmpty = document.getElementById('gameStartEmpty');
        if (emptyState) emptyState.style.display = 'none';
        if (gameStartEmpty) gameStartEmpty.style.display = 'none';

        // Check if mobile and show modal instead
        if (window.innerWidth <= 600) {
            this.showMobileModal();
            return;
        } else {
            const container = document.getElementById('taskInputContainer');
            container.style.display = 'block';

            // Focus on title input
            setTimeout(() => {
                document.getElementById('taskTitle').focus();
            }, 100);
        }
    }

    showMobileModal() {
        console.log('showMobileModal called');

        // Don't allow adding tasks to Smash List
        const currentList = this.getCurrentList();
        if (currentList && currentList.id === 'smash-list') {
            return;
        }

        const modal = document.getElementById('mobileModal');
        if (!modal) {
            console.error('Mobile modal not found');
            return;
        }

        // Hide empty states
        const emptyState = document.getElementById('emptyState');
        const gameStartEmpty = document.getElementById('gameStartEmpty');
        if (emptyState) emptyState.style.display = 'none';
        if (gameStartEmpty) gameStartEmpty.style.display = 'none';

        // Set modal title
        const modalTitle = document.getElementById('mobileModalTitle');
        if (modalTitle) {
            const t = typeof window.t === 'function' ? window.t : (k) => k;
            modalTitle.textContent = this.currentTask ? t('editTask') : t('newTask');
        }

        // Show modal with explicit styles
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.zIndex = '10000';
        modal.style.background = '#f5f5f5';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';

        this.isMobileModalOpen = true;
        console.log('Modal displayed with explicit styles');

        // 表示確認のためのテスト
        setTimeout(() => {
            const computed = window.getComputedStyle(modal);
            console.log('Modal computed styles:', {
                display: computed.display,
                position: computed.position,
                visibility: computed.visibility,
                zIndex: computed.zIndex,
                width: computed.width,
                height: computed.height
            });
        }, 50);

        // Focus on title input
        setTimeout(() => {
            const titleInput = document.getElementById('mobileTaskTitle');
            if (titleInput) {
                titleInput.focus();
            }
        }, 100);
    }

    hideMobileModal() {
        const modal = document.getElementById('mobileModal');
        if (!modal) return;

        modal.style.display = 'none';
        this.isMobileModalOpen = false;

        // Show appropriate empty state
        const activeTasks = this.tasks.filter(t => !t.completed);
        const hasNoTasks = this.tasks.length === 0;

        if (activeTasks.length === 0) {
            const emptyState = document.getElementById('emptyState');
            const gameStartEmpty = document.getElementById('gameStartEmpty');

            if (hasNoTasks) {
                if (emptyState) emptyState.style.display = 'none';
                if (gameStartEmpty) gameStartEmpty.style.display = 'block';
            } else {
                if (emptyState) emptyState.style.display = 'block';
                if (gameStartEmpty) gameStartEmpty.style.display = 'none';
            }
        }

        // Old resetMobileForm call removed - now handled by new system
    }

    // Make app globally accessible for inline editing
    setupGlobalAccess() {
        window.pixDoneApp = this;
        window.testFreeze = () => {
            const mgr = window.taskAnimationEffects?.comicEffects || this.comicEffects;
            if (mgr && typeof mgr.testFreeze === "function") mgr.testFreeze();
        };
    }

    // Old setupMobileModalEvents removed - now handled by new system

    // Old mobile modal functions removed (setupMobileModalEvents, selectMobileDate, etc.)
    // These are now handled by the new programmatic modal system

    // The following functions have been removed since they are no longer needed:
    // - setupMobileModalEvents
    // - selectMobileDate
    // - openMobileCalendarPicker
    // - selectMobileCustomDate
    // toggleMobileRepeatSelector
    // - saveMobileTask
    // - deleteMobileTask
    // - resetMobileForm
    // - syncToMobileForm
    // - syncFromMobileForm

    showTaskInput() {
        // Don't allow adding tasks to Smash List
        const currentList = this.getCurrentList();
        if (currentList && currentList.id === 'smash-list') {
            return;
        }

        // Desktop task input functionality
        if (window.innerWidth <= 768) {
            // Mobile devices use modal
            // Ensure "new task" never inherits previous edit state
            this.currentTask = null;
            this.selectedDate = null;
            this.selectedRepeat = 'none';
            this.currentSubtasks = [];
            this.showMobileModal();
            return;
        }

        // Desktop task input form (always "add" when called from Add task button)
        this.currentTask = null;
        this.isInputVisible = true;
        const container = document.getElementById('taskInputContainer');
        if (container) {
            container.style.display = 'block';

            // When opening for NEW task, clear form so previous details don't persist
            if (!this.currentTask) {
                const titleInput = document.getElementById('taskTitle');
                const detailsEl = document.getElementById('taskDetails');
                if (titleInput) titleInput.value = '';
                if (detailsEl) {
                    detailsEl.textContent = '';
                    detailsEl.innerHTML = '';
                    if (detailsEl.hasAttribute('placeholder')) detailsEl.classList.add('empty');
                }
                this.selectedDate = null;
                this.selectedRepeat = 'none';
                const repeatSelector = document.getElementById('repeatSelector');
                const repeatInterval = document.getElementById('repeatInterval');
                const repeatBtn = document.getElementById('repeatBtn');
                const customDatePicker = document.getElementById('customDatePicker');
                if (repeatSelector) repeatSelector.style.display = 'none';
                if (repeatInterval) repeatInterval.value = 'none';
                if (repeatBtn) repeatBtn.classList.remove('active');
                if (customDatePicker) customDatePicker.value = '';
                document.querySelectorAll('.date-btn').forEach(btn => btn.classList.remove('active'));
                this.updateCalendarButtonText();
            }

            // Hide empty states
            const emptyState = document.getElementById('emptyState');
            const gameStartEmpty = document.getElementById('gameStartEmpty');
            if (emptyState) emptyState.style.display = 'none';
            if (gameStartEmpty) gameStartEmpty.style.display = 'none';

            // Focus on title input and set up hyperlink paste
            const titleInput = document.getElementById('taskTitle');
            if (titleInput) {
                titleInput.focus();

                // Set up paste event handlers for hyperlink creation on title
                if (!titleInput.hyperlinkPasteSetup) {
                    this.handleHyperlinkPaste(titleInput);
                    titleInput.hyperlinkPasteSetup = true;
                }
            }

            // Set up paste event handlers for hyperlink creation on details
            const taskDetailsTextarea = document.getElementById('taskDetails');
            if (taskDetailsTextarea && !taskDetailsTextarea.hyperlinkPasteSetup) {
                this.handleHyperlinkPaste(taskDetailsTextarea);
                taskDetailsTextarea.hyperlinkPasteSetup = true;

                // Set up rich text editing for new tasks
                if (!this.currentTask) {
                    const taskDetailsEl = document.getElementById('taskDetails');
                    if (taskDetailsEl) {
                        this.setupRichTextEditor(taskDetailsEl);
                        // Setup placeholder behavior
                        if (taskDetailsEl.textContent.trim() === '' && taskDetailsEl.hasAttribute('placeholder')) {
                            taskDetailsEl.classList.add('empty');
                        }
                    }
                }
            }
        }
    }

    // All old mobile modal functions have been removed since they are now handled by the new programmatic modal system

    hideTaskInput() {
        this.isInputVisible = false;
        const container = document.getElementById('taskInputContainer');
        container.style.display = 'none';

        // Show appropriate empty state
        const activeTasks = this.tasks.filter(t => !t.completed);
        const hasNoTasks = this.tasks.length === 0;

        if (activeTasks.length === 0) {
            const emptyState = document.getElementById('emptyState');
            const gameStartEmpty = document.getElementById('gameStartEmpty');

            if (hasNoTasks) {
                if (emptyState) emptyState.style.display = 'none';
                if (gameStartEmpty) gameStartEmpty.style.display = 'block';
            } else {
                if (emptyState) emptyState.style.display = 'block';
                if (gameStartEmpty) gameStartEmpty.style.display = 'none';
            }
        }

        // Hide delete button
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }

        // Reset form
        this.resetForm();
    }

    resetForm() {
        document.getElementById('taskTitle').value = '';
        const taskDetailsEl = document.getElementById('taskDetails');
        if (taskDetailsEl) {
            taskDetailsEl.textContent = '';
            taskDetailsEl.innerHTML = '';
        }
        this.selectedDate = null;
        this.currentTask = null;
        this.selectedRepeat = 'none';

        // Reset date buttons
        document.querySelectorAll('.date-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Reset repeat selector
        const repeatSelector = document.getElementById('repeatSelector');
        const repeatInterval = document.getElementById('repeatInterval');
        const repeatBtn = document.getElementById('repeatBtn');
        const customDatePicker = document.getElementById('customDatePicker');

        if (repeatSelector) repeatSelector.style.display = 'none';
        if (repeatInterval) repeatInterval.value = 'none';
        if (repeatBtn) repeatBtn.classList.remove('active');

        // Reset custom date picker
        if (customDatePicker) {
            customDatePicker.value = '';
        }

        // Reset calendar button text
        this.updateCalendarButtonText();
    }

    updateCalendarButtonText() {
        const calendarBtn = document.getElementById('calendarBtn');
        if (!calendarBtn) return;

        if (this.selectedDate) {
            // 日付を表示形式に変換
            const date = this.parseYMDToLocalDate(this.selectedDate) || new Date(this.selectedDate);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            calendarBtn.innerHTML = `<span>${month}/${day}</span>`;
        } else {
            calendarBtn.innerHTML = '<i class="fas fa-calendar"></i>';
        }
    }

    selectDate(dateType) {
        // Reset all date buttons
        document.querySelectorAll('.date-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        let selectedBtn;
        let dueDate = null;

        if (dateType === 'today') {
            selectedBtn = document.getElementById('todayBtn');
            // 既に選択されている場合は解除
            if (this.selectedDate === this.getTodayYMD()) {
                this.selectedDate = null;
                this.updateCalendarButtonText();
                return;
            }
            dueDate = this.getTodayYMD();
        } else if (dateType === 'tomorrow') {
            selectedBtn = document.getElementById('tomorrowBtn');
            const tomorrowStr = this.getTomorrowYMD();
            // 既に選択されている場合は解除
            if (this.selectedDate === tomorrowStr) {
                this.selectedDate = null;
                this.updateCalendarButtonText();
                return;
            }
            dueDate = tomorrowStr;
        }

        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        this.selectedDate = dueDate;
        this.updateCalendarButtonText();
    }

    openCalendarPicker() {
        const datePicker = document.getElementById('customDatePicker');
        const calendarBtn = document.getElementById('calendarBtn');

        if (datePicker && calendarBtn) {
            // 日付入力を一時的にクリック可能にする（position/opacity/pointer-events を有効化）
            datePicker.style.position = 'absolute';
            datePicker.style.left = '0';
            datePicker.style.top = '0';
            datePicker.style.width = '100%';
            datePicker.style.height = '100%';
            datePicker.style.opacity = '0';
            datePicker.style.pointerEvents = 'auto';
            datePicker.style.zIndex = '9999';
            datePicker.style.display = 'block';

            const hideAfterSelection = () => {
                setTimeout(() => {
                    datePicker.style.position = 'absolute';
                    datePicker.style.left = '-9999px';
                    datePicker.style.top = '-9999px';
                    datePicker.style.width = '';
                    datePicker.style.height = '';
                    datePicker.style.opacity = '0';
                    datePicker.style.pointerEvents = 'none';
                    datePicker.style.zIndex = '-1';
                }, 100);
            };

            const openPicker = () => {
                if (typeof datePicker.showPicker === 'function') {
                    datePicker.showPicker();
                } else {
                    datePicker.focus();
                    datePicker.click();
                }
            };

            datePicker.addEventListener('blur', hideAfterSelection, { once: true });
            datePicker.addEventListener('change', hideAfterSelection, { once: true });
            // Open picker synchronously within the user gesture to avoid browser blocking
            try {
                openPicker();
            } catch (err) {
                try {
                    datePicker.focus();
                    datePicker.click();
                } catch (_) { }
            }
        }
    }

    selectCustomDate(dateStr) {
        const customDatePicker = document.getElementById('customDatePicker');
        const calendarBtn = document.getElementById('calendarBtn');

        if (dateStr) {
            // 既に選択されている場合は解除
            if (this.selectedDate === dateStr) {
                this.selectedDate = null;
                if (customDatePicker) customDatePicker.value = '';
                document.querySelectorAll('.date-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.updateCalendarButtonText();
                return;
            }

            this.selectedDate = dateStr;
            // 他のボタンの状態をリセット
            document.querySelectorAll('.date-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            if (calendarBtn) calendarBtn.classList.add('active');

            // カレンダーボタンのテキストを更新
            this.updateCalendarButtonText();
        }
    }

    // Inline task editing for desktop
    showInlineTaskEdit(taskId) {
        console.log('Showing inline edit for task:', taskId);

        // Close any existing inline edits first
        this.closeAllInlineEdits();

        // Find the task element
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskElement) {
            console.error('Task element not found for ID:', taskId);
            return;
        }

        // Get task data
        const currentList = this.getCurrentList();
        const task = currentList ? currentList.tasks.find(t => String(t.id) === String(taskId)) : null;
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }

        // Create inline edit form
        const it = typeof window.t === 'function' ? window.t : (k) => k;
        const editForm = document.createElement('div');
        editForm.className = 'inline-edit-form';
        editForm.setAttribute('data-editing-task', taskId);
        editForm.innerHTML = `
            <div class="inline-edit-container">
                <div class="inline-edit-field">
                    <div id="inline-title-${taskId}" class="inline-edit-title-rich" contenteditable="true" placeholder="${it('title')}">${this.processLinksForDisplay(this.getTaskDisplayTitle(task))}</div>
                </div>
                <div class="inline-edit-field">
                    <div id="inline-details-${taskId}" class="inline-edit-details-rich" contenteditable="true" placeholder="${it('details')}">${this.processLinksForDisplay(task.details || '')}</div>
                </div>
                <div class="inline-edit-date-section">
                    <div class="inline-date-buttons">
                        <button type="button" class="inline-date-btn" id="inline-today-${taskId}" onclick="window.pixDoneApp.selectInlineDate('${taskId}', 'today')">${it('today')}</button>
                        <button type="button" class="inline-date-btn" id="inline-tomorrow-${taskId}" onclick="window.pixDoneApp.selectInlineDate('${taskId}', 'tomorrow')">${it('tomorrow')}</button>
                        <button type="button" class="inline-date-btn inline-calendar-btn" id="inline-calendar-${taskId}">
                            <i class="fa fa-calendar"></i> ${it('pick')}
                        </button>
                        <button type="button" class="inline-repeat-btn" id="inline-repeat-${taskId}" onclick="window.pixDoneApp.toggleInlineRepeat('${taskId}')">
                            <i class="fas fa-redo"></i>
                        </button>
                        <input type="date" id="inline-date-picker-${taskId}" style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;">
                    </div>
                    <div class="inline-repeat-selector" id="inline-repeat-selector-${taskId}" style="display: none;">
                        <label for="inline-repeat-interval-${taskId}">${it('repeat')}:</label>
                        <select id="inline-repeat-interval-${taskId}" onchange="window.pixDoneApp.updateInlineRepeat('${taskId}')">
                            <option value="none">${it('noRepeat')}</option>
                            <option value="daily">${it('daily')}</option>
                            <option value="weekly">${it('weekly')}</option>
                            <option value="monthly">${it('monthly')}</option>
                            <option value="yearly">${it('yearly')}</option>
                        </select>
                    </div>
                </div>
                <div class="inline-edit-subtasks-section">
                    <div class="inline-subtasks-header">
                        <span class="inline-subtasks-title">${it('subtasks')} (<span id="inline-subtasks-count-${taskId}">0</span>)</span>
                    </div>
                    <ul class="inline-subtasks-list" id="inline-subtasks-list-${taskId}"></ul>
                    <div class="inline-subtask-add">
                        <input type="text" id="inline-subtask-input-${taskId}" class="inline-subtask-input" placeholder="${it('addSubtasks')}" />
                        <button id="inline-subtask-add-btn-${taskId}" class="inline-subtask-add-btn" style="display: none;" aria-label="Add subtask">+ Add</button>
                    </div>
                </div>
                <div class="inline-edit-actions">
                    <div class="inline-edit-actions-left">
<button type="button" class="inline-delete-btn" onclick="window.pixDoneApp.deleteInlineTask('${taskId}')">${it('delete')}</button>
                        </div>
                        <div class="inline-edit-actions-right">
                        <button type="button" class="inline-cancel-btn" onclick="window.pixDoneApp.cancelInlineEdit('${taskId}')">${it('cancel')}</button>
                        <button type="button" class="inline-save-btn" onclick="window.pixDoneApp.saveInlineEdit('${taskId}')">${it('save')}</button>
                    </div>
                </div>
            </div>
        `;

        // Insert the edit form after the task element
        taskElement.style.display = 'none';
        taskElement.parentNode.insertBefore(editForm, taskElement.nextSibling);

        // Set up rich text editing and focus
        setTimeout(() => {
            const titleInput = document.getElementById(`inline-title-${taskId}`);
            const detailsInput = document.getElementById(`inline-details-${taskId}`);

            if (titleInput) {
                titleInput.focus();
                this.selectAllText(titleInput);
                this.setupRichTextEditor(titleInput);
            }

            if (detailsInput) {
                this.setupRichTextEditor(detailsInput);
            }

            // Set up date buttons based on task data
            this.updateInlineDateButtons(taskId, task.dueDate);

            // Set up inline calendar button (addEventListener so it works without relying on window.pixDoneApp)
            const calendarBtn = document.getElementById(`inline-calendar-${taskId}`);
            if (calendarBtn) {
                calendarBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.comicEffects && this.comicEffects.playSound) this.comicEffects.playSound('buttonClick');
                    this.showInlineDatePicker(taskId);
                });
            }

            // Set up repeat selector based on task data
            this.updateInlineRepeatSelector(taskId, task.repeat || 'none');

            // Set up subtasks for desktop
            this.setupInlineSubtasks(taskId);
        }, 100);

        // Set up click-outside-to-close behavior
        this.setupInlineEditClickOutside(editForm, taskId);

        // Store current task for saving
        this.currentTask = { ...task };
        this.selectedDate = task.dueDate;
        this.selectedRepeat = task.repeat || 'none';
        
        // Initialize subtasks from current task
        if (task.subtasks && Array.isArray(task.subtasks)) {
            this.currentSubtasks = (task.subtasks || []).map(st => this.normalizeSubtask(st)).filter(Boolean);
        } else {
            this.currentSubtasks = [];
        }
    }

    async saveInlineEdit(taskId) {
        console.log('Saving inline edit for task:', taskId);

        const titleInput = document.getElementById(`inline-title-${taskId}`);
        const detailsInput = document.getElementById(`inline-details-${taskId}`);

        if (!titleInput || !detailsInput) {
            console.error('Inline edit inputs not found');
            return;
        }

        const title = this.extractTextFromRichEditor(titleInput);
        const details = this.extractTextFromRichEditor(detailsInput);

        if (!title) {
            titleInput.focus();
            return;
        }

        // サブタスク入力欄に未追加のテキストがあれば保存前に追加
        const subtaskInput = document.getElementById(`inline-subtask-input-${taskId}`);
        if (subtaskInput && subtaskInput.value.trim()) {
            const text = subtaskInput.value.trim();
            this.currentSubtasks = this.currentSubtasks || [];
            this.currentSubtasks.push({ id: Date.now().toString(), text, done: false });
            subtaskInput.value = '';
            const addBtn = document.getElementById(`inline-subtask-add-btn-${taskId}`);
            if (addBtn) addBtn.style.display = 'none';
        }

        // Update task
        const currentList = this.getCurrentList();
        const taskIndex = currentList ? currentList.tasks.findIndex(t => String(t.id) === String(taskId)) : -1;

        if (taskIndex === -1) {
            console.error('Task not found for update');
            return;
        }

        // Update task data
        currentList.tasks[taskIndex].title = title;
        currentList.tasks[taskIndex].details = details;
        currentList.tasks[taskIndex].dueDate = this.selectedDate;
        currentList.tasks[taskIndex].repeat = this.selectedRepeat;
        currentList.tasks[taskIndex].subtasks = (this.currentSubtasks || []).map(st => this.normalizeSubtask(st)).filter(Boolean);

        // Update in Firebase if authenticated
        if (this.isAuthenticated) {
            try {
                await updateTaskInFirestore(taskId, {
                    title,
                    details: details || '',
                    dueDate: this.selectedDate,
                    repeat: this.selectedRepeat,
                    subtasks: (this.currentSubtasks || []).map(st => this.normalizeSubtask(st)).filter(Boolean)
                });
            } catch (error) {
                console.error('[PixDone] Error updating task in Firestore:', error);
            }
        }

        // Update global tasks array
        this.tasks = currentList.tasks;

        // Clean up inline edit
        this.cancelInlineEdit(taskId);

        // Re-render tasks
        this.saveTasks();
        this.renderTasks();
        this.updateCompletedCount();

        // Play sound
        if (this.comicEffects && typeof this.comicEffects.playSound === 'function') {
            this.comicEffects.playSound('taskEdit');
        }
    }

    cancelInlineEdit(taskId) {
        console.log('Cancelling inline edit for task:', taskId);

        // Remove the edit form and clean up event listeners
        const editForm = document.querySelector(`.inline-edit-form[data-editing-task="${taskId}"]`) ||
            document.querySelector('.inline-edit-form');
        if (editForm) {
            // Clean up outside click handler
            if (editForm._outsideClickHandler) {
                document.removeEventListener('click', editForm._outsideClickHandler);
            }
            editForm.remove();
        }

        // Show the original task element
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.style.display = '';
        }

        // Reset current task
        this.currentTask = null;
        this.selectedDate = null;
        this.selectedRepeat = 'none';
        this.currentSubtasks = [];

        // Play sound
        if (this.comicEffects && typeof this.comicEffects.playSound === 'function') {
            this.comicEffects.playSound('taskCancel');
        }
    }

    // Setup subtasks for desktop inline edit
    setupInlineSubtasks(taskId) {
        const subtaskInput = document.getElementById(`inline-subtask-input-${taskId}`);
        const subtaskAddBtn = document.getElementById(`inline-subtask-add-btn-${taskId}`);
        const subtasksList = document.getElementById(`inline-subtasks-list-${taskId}`);

        if (!subtaskInput || !subtasksList) return;

        if (!subtaskInput.hyperlinkPasteSetup) {
            this.handleHyperlinkPaste(subtaskInput);
            subtaskInput.hyperlinkPasteSetup = true;
        }

        // Add subtask on button click
        if (subtaskAddBtn) {
            subtaskAddBtn.addEventListener('click', () => {
                this.addInlineSubtask(taskId);
            });
        }

        // Add subtask on Enter key
        subtaskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addInlineSubtask(taskId);
            }
        });

        // Show add button when input has text
        subtaskInput.addEventListener('input', () => {
            if (subtaskAddBtn) {
                subtaskAddBtn.style.display = subtaskInput.value.trim() ? 'inline-flex' : 'none';
            }
        });

        // Initial render
        this.renderInlineSubtasks(taskId);
        this.updateInlineSubtasksCount(taskId);
    }

    // Add subtask for desktop inline edit
    addInlineSubtask(taskId) {
        const subtaskInput = document.getElementById(`inline-subtask-input-${taskId}`);
        if (!subtaskInput) return;

        const text = subtaskInput.value.trim();
        if (!text) return;

        const newSubtask = {
            id: Date.now().toString(),
            text: text,
            done: false
        };

        if (!this.currentSubtasks) {
            this.currentSubtasks = [];
        }
        this.currentSubtasks.push(newSubtask);
        subtaskInput.value = '';
        
        const subtaskAddBtn = document.getElementById(`inline-subtask-add-btn-${taskId}`);
        if (subtaskAddBtn) {
            subtaskAddBtn.style.display = 'none';
        }

        this.renderInlineSubtasks(taskId);
        this.updateInlineSubtasksCount(taskId);
    }

    // Delete subtask for desktop inline edit
    deleteInlineSubtask(taskId, subtaskId) {
        if (!this.currentSubtasks) return;
        this.currentSubtasks = this.currentSubtasks.filter(st => st.id !== subtaskId);
        this.renderInlineSubtasks(taskId);
        this.updateInlineSubtasksCount(taskId);
    }

    // Toggle subtask done state for desktop inline edit
    toggleInlineSubtask(taskId, subtaskId) {
        if (!this.currentSubtasks) return;
        const subtask = this.currentSubtasks.find(st => st.id === subtaskId);
        if (subtask) {
            const wasDone = subtask.done;
            subtask.done = !subtask.done;
            if (subtask.done && !wasDone && window.picoSound && typeof window.picoSound.playSubtaskCompleteSound === 'function') {
                const total = this.currentSubtasks.length;
                const completed = this.currentSubtasks.filter(st => st.done).length;
                window.picoSound.playSubtaskCompleteSound({ total, completed });
            }
            this.renderInlineSubtasks(taskId);
        }
    }

    // Render subtasks list for desktop inline edit
    renderInlineSubtasks(taskId) {
        const subtasksList = document.getElementById(`inline-subtasks-list-${taskId}`);
        if (!subtasksList) return;

        subtasksList.innerHTML = '';

        if (!this.currentSubtasks || this.currentSubtasks.length === 0) {
            return;
        }

        this.currentSubtasks.forEach(subtask => {
            const li = document.createElement('li');
            li.className = `inline-subtask-item ${subtask.done ? 'done' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="inline-subtask-checkbox" ${subtask.done ? 'checked' : ''} data-subtask-id="${subtask.id}" />
                <span class="inline-subtask-text">${this.escapeHtml(subtask.text)}</span>
                <button class="inline-subtask-delete" data-subtask-id="${subtask.id}" aria-label="Delete">×</button>
            `;

            // Checkbox event
            const checkbox = li.querySelector('.inline-subtask-checkbox');
            checkbox.addEventListener('change', () => {
                this.toggleInlineSubtask(taskId, subtask.id);
            });

            // Delete button event
            const deleteBtn = li.querySelector('.inline-subtask-delete');
            deleteBtn.addEventListener('click', () => {
                this.deleteInlineSubtask(taskId, subtask.id);
            });

            subtasksList.appendChild(li);
        });
    }

    // Update subtasks count for desktop inline edit
    updateInlineSubtasksCount(taskId) {
        const countEl = document.getElementById(`inline-subtasks-count-${taskId}`);
        if (countEl) {
            countEl.textContent = this.currentSubtasks ? this.currentSubtasks.length : 0;
        }
    }

    async deleteInlineTask(taskId) {
        console.log('Deleting inline task:', taskId);

        // Delete task
        if (this.isAuthenticated) {
            try {
                await deleteTaskFromFirestore(taskId);
            } catch (error) {
                console.error('Error deleting task from Firestore:', error);
            }
        }

        // Remove from tasks array
        const currentList = this.getCurrentList();
        if (currentList) {
            currentList.tasks = currentList.tasks.filter(t => String(t.id) !== String(taskId));
            this.tasks = currentList.tasks;
        }

        // Clean up inline edit
        this.cancelInlineEdit(taskId);

        // Re-render tasks
        this.saveTasks();
        this.renderTasks();
        this.updateCompletedCount();
        this.renderListTabs();

        // Play sound
        if (this.comicEffects && typeof this.comicEffects.playSound === 'function') {
            this.comicEffects.playSound('taskDelete');
        }
    }

    // Close all inline edits
    closeAllInlineEdits() {
        document.querySelectorAll('.inline-edit-form').forEach(form => {
            const taskId = form.getAttribute('data-editing-task');
            if (taskId) {
                this.cancelInlineEdit(taskId);
            } else {
                form.remove();
            }
        });
    }

    // Set up click-outside-to-close behavior for inline edit
    setupInlineEditClickOutside(editForm, taskId) {
        const handleOutsideClick = (event) => {
            // Check if click is outside the edit form
            if (!editForm.contains(event.target)) {
                // Also check if click is not on the original task element (to avoid closing when clicking to edit)
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (!taskElement || !taskElement.contains(event.target)) {
                    console.log('Click outside detected, closing inline edit');
                    this.cancelInlineEdit(taskId);
                    document.removeEventListener('click', handleOutsideClick);
                }
            }
        };

        // Add the listener after a short delay to avoid immediate closure
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 100);

        // Store the listener for cleanup
        editForm._outsideClickHandler = handleOutsideClick;
    }

    // Inline edit date and repeat functions
    selectInlineDate(taskId, dateType) {
        // Reset all date buttons
        document.querySelectorAll(`#inline-today-${taskId}, #inline-tomorrow-${taskId}, #inline-calendar-${taskId}`).forEach(btn => {
            btn.classList.remove('active');
        });

        const t = typeof window.t === 'function' ? window.t : (k) => k;
        if (dateType === 'today') {
            const btn = document.getElementById(`inline-today-${taskId}`);
            btn.classList.add('active');
            btn.textContent = t('today');
            this.selectedDate = this.getTodayYMD();
        } else if (dateType === 'tomorrow') {
            const btn = document.getElementById(`inline-tomorrow-${taskId}`);
            btn.classList.add('active');
            btn.textContent = t('tomorrow');
            this.selectedDate = this.getTomorrowYMD();
        }

        // Play sound
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskEdit');
        }
    }

    showInlineDatePicker(taskId) {
        const datePicker = document.getElementById(`inline-date-picker-${taskId}`);
        if (!datePicker) return;
        // Make input openable (browsers often block showPicker when input is off-screen/hidden)
        datePicker.removeAttribute('style');
        datePicker.style.position = 'fixed';
        datePicker.style.left = '0';
        datePicker.style.top = '0';
        datePicker.style.width = '100%';
        datePicker.style.height = '100%';
        datePicker.style.opacity = '0';
        datePicker.style.pointerEvents = 'auto';
        datePicker.style.zIndex = '99999';
        datePicker.style.display = 'block';
        if (!datePicker.value) {
            datePicker.value = this.getTodayYMD();
        }
        const hideAgain = () => {
            datePicker.style.position = 'absolute';
            datePicker.style.left = '-9999px';
            datePicker.style.top = '0';
            datePicker.style.width = '';
            datePicker.style.height = '';
            datePicker.style.opacity = '0';
            datePicker.style.pointerEvents = 'none';
            datePicker.style.zIndex = '-1';
            datePicker.style.display = '';
        };
        datePicker.addEventListener('blur', hideAgain, { once: true });
        datePicker.addEventListener('change', hideAgain, { once: true });
        datePicker.focus();
        try {
            if (typeof datePicker.showPicker === 'function') {
                datePicker.showPicker();
            } else {
                datePicker.click();
            }
        } catch (err) {
            datePicker.click();
        }
        datePicker.onchange = () => {
            const selectedDate = datePicker.value;
            if (selectedDate) {
                    this.selectedDate = selectedDate;

                    // Reset other buttons
                    document.querySelectorAll(`#inline-today-${taskId}, #inline-tomorrow-${taskId}`).forEach(btn => {
                        btn.classList.remove('active');
                    });

                    // Update calendar button
                    const calendarBtn = document.getElementById(`inline-calendar-${taskId}`);
                    calendarBtn.classList.add('active');
                    const date = this.parseYMDToLocalDate(selectedDate) || new Date(selectedDate);
                    calendarBtn.innerHTML = `<i class="fa fa-calendar"></i> ${date.getMonth() + 1}/${date.getDate()}`;

                    // Play sound
                    if (this.comicEffects && this.comicEffects.playSound) {
                        this.comicEffects.playSound('taskEdit');
                    }
                }
            };
    }

    toggleInlineRepeat(taskId) {
        const repeatSelector = document.getElementById(`inline-repeat-selector-${taskId}`);
        const repeatBtn = document.getElementById(`inline-repeat-${taskId}`);

        if (repeatSelector.style.display === 'none') {
            repeatSelector.style.display = 'block';
            repeatBtn.classList.add('active');
        } else {
            repeatSelector.style.display = 'none';
            repeatBtn.classList.remove('active');
            this.selectedRepeat = 'none';
            document.getElementById(`inline-repeat-interval-${taskId}`).value = 'none';
        }

        // Play sound
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskEdit');
        }
    }

    updateInlineRepeat(taskId) {
        const repeatInterval = document.getElementById(`inline-repeat-interval-${taskId}`);
        this.selectedRepeat = repeatInterval.value;

        // Play sound
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskEdit');
        }
    }

    updateInlineDateButtons(taskId, dueDate) {
        if (!dueDate) return;

        const today = this.getTodayYMD();
        const tomorrowStr = this.getTomorrowYMD();

        if (dueDate === today) {
            const btn = document.getElementById(`inline-today-${taskId}`);
            if (btn) btn.classList.add('active');
        } else if (dueDate === tomorrowStr) {
            const btn = document.getElementById(`inline-tomorrow-${taskId}`);
            if (btn) btn.classList.add('active');
        } else {
            const calendarBtn = document.getElementById(`inline-calendar-${taskId}`);
            if (calendarBtn) {
                calendarBtn.classList.add('active');
                const date = this.parseYMDToLocalDate(dueDate) || new Date(dueDate);
                calendarBtn.innerHTML = `<i class="fa fa-calendar"></i> ${date.getMonth() + 1}/${date.getDate()}`;
            }
        }
    }

    updateInlineRepeatSelector(taskId, repeat) {
        if (repeat && repeat !== 'none') {
            const repeatSelector = document.getElementById(`inline-repeat-selector-${taskId}`);
            const repeatBtn = document.getElementById(`inline-repeat-${taskId}`);
            const repeatInterval = document.getElementById(`inline-repeat-interval-${taskId}`);

            if (repeatSelector) repeatSelector.style.display = 'block';
            if (repeatBtn) repeatBtn.classList.add('active');
            if (repeatInterval) repeatInterval.value = repeat;
        }
    }

    toggleRepeatSelector() {
        const repeatSelector = document.getElementById('repeatSelector');
        const repeatBtn = document.getElementById('repeatBtn');
        const repeatInterval = document.getElementById('repeatInterval');

        if (!repeatSelector) return;

        const isVisible = repeatSelector.style.display !== 'none';
        repeatSelector.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            if (repeatBtn) repeatBtn.classList.add('active');
        } else {
            if (repeatBtn) repeatBtn.classList.remove('active');
            this.selectedRepeat = 'none';
            if (repeatInterval) repeatInterval.value = 'none';
        }
    }

    async saveTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const details = this.extractTextFromRichEditor(document.getElementById('taskDetails'));
        if (!title) {
            document.getElementById('taskTitle').focus();
            return;
        }
        if (this.currentTask) {
            // Edit existing task
            this.currentTask.title = title;
            this.currentTask.details = details;
            this.currentTask.dueDate = this.selectedDate;
            this.currentTask.repeat = this.selectedRepeat;
            if (this.isAuthenticated) {
                // Firestoreに更新を送信（既存IDを維持）
                try {
                    await updateTaskInFirestore(this.currentTask.id, {
                        title,
                        details: details || '',
                        dueDate: this.selectedDate,
                        repeat: this.selectedRepeat,
                        subtasks: (this.currentSubtasks || []).map(st => this.normalizeSubtask(st)).filter(Boolean)
                    });
                } catch (error) {
                    console.error('[PixDone] Error updating task in Firestore:', error);
                }
            } else {
                // ローカルのみで更新
                const currentList = this.getCurrentList();
                if (currentList) {
                    const idx = currentList.tasks.findIndex(t => t.id === this.currentTask.id);
                    if (idx !== -1) {
                        currentList.tasks[idx] = { ...this.currentTask, subtasks: this.currentSubtasks || [] };
                        // Update the global tasks array for backward compatibility
                        this.tasks = currentList.tasks;
                    }
                }
            }
        } else {
            // Create new task
            const task = {
                id: this.taskIdCounter++,
                title,
                details,
                dueDate: this.selectedDate,
                repeat: this.selectedRepeat,
                subtasks: this.currentSubtasks || [],
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            };
            if (this.isAuthenticated) {
                const taskId = await addTaskToFirestore(title, details, this.selectedDate, this.selectedRepeat, this.currentListId, this.currentSubtasks || []);
                if (taskId) task.id = taskId;
                const currentList = this.getCurrentList();
                if (currentList) {
                    currentList.tasks.unshift(task);
                    this.tasks = currentList.tasks;
                }
            } else {
                // Add to current list for offline users
                const currentList = this.getCurrentList();
                if (currentList) {
                    currentList.tasks.unshift(task);
                    // Update the global tasks array for backward compatibility
                    this.tasks = currentList.tasks;
                }
            }
        }
        this.saveTasks();
        this.renderTasks();
        this.updateCompletedCount();
        this.renderListTabs();
        this.hideTaskInput();
        // Animate new task
        if (!this.currentTask && this.tasks.length > 0 && typeof this.tasks[0].id !== 'undefined') {
            setTimeout(() => {
                const taskElement = document.querySelector(`[data-task-id="${this.tasks[0].id}"]`);
                if (taskElement) {
                    taskElement.classList.add('task-item-new');
                }
            }, 100);
            this.comicEffects.playSound('taskAdd');
        }
    }

    async toggleTaskCompletion(taskId, taskElement = null, options = {}) {
        console.log('toggleTaskCompletion called with taskId:', taskId);

        // Prevent duplicate completion calls
        if (this.processingTaskId === taskId) {
            console.log('Task completion already in progress for:', taskId);
            return;
        }
        this.processingTaskId = taskId;

        // Find task in current list directly
        const currentList = this.getCurrentList();
        if (!currentList || !currentList.tasks) {
            console.log('No current list or tasks found');
            this.processingTaskId = null;
            return;
        }
        const task = currentList.tasks.find(t => String(t.id) === String(taskId));
        if (!task) {
            console.log('Task not found:', taskId);
            this.processingTaskId = null;
            return;
        }
        // Clean up all tasks - remove isProcessing flag
        currentList.tasks.forEach(t => {
            delete t.isProcessing;
        });
        // Use provided element or find it in DOM.
        // Normalize to the task card element (.task-item) so rect/clone match Smash list behavior.
        if (!taskElement) {
            taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        } else if (taskElement && taskElement.nodeType === 1 && !taskElement.classList.contains('task-item')) {
            const closestCard = taskElement.closest ? taskElement.closest(`.task-item[data-task-id="${taskId}"], .task-item`) : null;
            if (closestCard) taskElement = closestCard;
        }
        console.log('Task found, toggling completion:', task.title, 'completed:', task.completed);
        if (task.completed) {
            // Uncomplete task
            task.completed = false;
            task.completedAt = null;
            delete task.perfectTimingResult;
            if (this.isAuthenticated) {
                try {
                    await toggleTaskCompletionFirestore(taskId, false);
                } catch (error) {
                    console.error('Error updating task completion in Firestore:', error);
                }
            }
            this.saveTasks();
            this.renderTasks();
            this.updateCompletedCount();
            this.renderListTabs();
            this.processingTaskId = null;
        } else {
            // Complete task without processing flag
            task.completed = true;
            task.completedAt = new Date().toISOString();
            if (options.fromPerfectTiming && options.perfectTimingResult) {
                task.perfectTimingResult = options.perfectTimingResult;
            }

            // onSnapshot による renderTasks を一時抑制（Firestore 更新中にDOM置換が先に走るのを防ぐ）
            this.suppressSnapshotRenderUntil = Date.now() + 1200;

            if (this.isAuthenticated) {
                try {
                    await toggleTaskCompletionFirestore(taskId, true);
                } catch (error) {
                    console.error('Error updating task completion in Firestore:', error);
                }
            }

            // Show celebration effects once for all cases
            this.showCelebration(task);

            // Keep pager transform stable BEFORE capturing rect (Smash list is usually index=0; normal lists can drift if transform is updated later).
            const viewport = document.querySelector('.pager-viewport');
            const track = document.querySelector('.pager-track');
            if (viewport && track) {
                const currentIndex = Math.max(0, this.lists?.findIndex(list => list.id === this.currentListId) ?? 0);
                track.style.transform = `translateX(${-currentIndex * viewport.offsetWidth}px)`;
            }

            // Capture rect + clone BEFORE any DOM changes (position/size can shift after adding .completed)
            let taskRectForEffect = null;
            let effectCloneBase = null;
            if (taskElement && taskElement.nodeType === 1) {
                // getBoundingClientRect includes CSS transforms (e.g. :hover translate(-1px,-1px)).
                // Smash list is often triggered via keyboard/tap (no hover), so compensate translation here
                // so the clone starts exactly where the non-hover card is.
                const rect = taskElement.getBoundingClientRect();
                const cs = window.getComputedStyle(taskElement);
                let tx = 0;
                let ty = 0;
                const tf = cs && cs.transform ? cs.transform : 'none';
                if (tf && tf !== 'none') {
                    // matrix(a,b,c,d,tx,ty)
                    const m2 = tf.match(/^matrix\(([^)]+)\)$/);
                    if (m2) {
                        const parts = m2[1].split(',').map(s => parseFloat(s.trim()));
                        if (parts.length === 6 && Number.isFinite(parts[4]) && Number.isFinite(parts[5])) {
                            tx = parts[4];
                            ty = parts[5];
                        }
                    } else {
                        // matrix3d(..., tx, ty, tz)
                        const m3 = tf.match(/^matrix3d\(([^)]+)\)$/);
                        if (m3) {
                            const parts = m3[1].split(',').map(s => parseFloat(s.trim()));
                            if (parts.length === 16 && Number.isFinite(parts[12]) && Number.isFinite(parts[13])) {
                                tx = parts[12];
                                ty = parts[13];
                            }
                        }
                    }
                }
                taskRectForEffect = {
                    left: rect.left - tx,
                    top: rect.top - ty,
                    width: rect.width,
                    height: rect.height,
                    right: rect.right - tx,
                    bottom: rect.bottom - ty,
                    x: rect.x - tx,
                    y: rect.y - ty,
                };
                effectCloneBase = taskElement.cloneNode(true);
                // Make clone look completed so the effect has a "done" feel
                effectCloneBase.classList.add('completed');
                const cloneCheckbox = effectCloneBase.querySelector('.task-checkbox');
                if (cloneCheckbox) {
                    cloneCheckbox.classList.add('completed');
                    cloneCheckbox.setAttribute('aria-checked', 'true');
                }
            }

            // Update DOM immediately for visual feedback
            if (taskElement) {
                taskElement.classList.add('completed');
                const checkbox = taskElement.querySelector('.task-checkbox');
                if (checkbox) {
                    checkbox.classList.add('completed');
                    checkbox.setAttribute('aria-checked', 'true');
                }
            }

            // Show comic effects immediately with the current task element (skip when from PerfectTiming - effects handled there)
            if (!options.fromPerfectTiming && window.taskAnimationEffects && effectCloneBase && taskRectForEffect) {
                const taskRect = taskRectForEffect;
                // Body-level clone so effect is visible (not clipped by .pager-viewport).
                // Fallback when rect has no size (e.g. hidden page) so animation still shows.
                const hasSize = taskRect.width > 0 && taskRect.height > 0;
                const left = hasSize ? taskRect.left : Math.max(0, (window.innerWidth - 280) / 2);
                const top = hasSize ? taskRect.top : Math.max(0, (window.innerHeight - 56) / 2);
                const width = hasSize ? taskRect.width : 280;
                const height = hasSize ? taskRect.height : 56;

                const effectClone = effectCloneBase;
                effectClone.classList.add('task-effect-clone');
                effectClone.setAttribute('style', [
                    'position: fixed !important',
                    'left: ' + left + 'px !important',
                    'top: ' + top + 'px !important',
                    'width: ' + width + 'px !important',
                    'height: ' + height + 'px !important',
                    'margin: 0 !important',
                    'pointer-events: none !important',
                    'visibility: visible !important',
                    'z-index: 99999 !important',
                    'box-sizing: border-box !important'
                ].join('; '));
                document.body.appendChild(effectClone);

                document.body.classList.add('task-effect-playing');
                document.documentElement.classList.add('task-effect-playing');

                const effectRect = { left, top, width, height };
                // Start effect immediately (avoid "task disappears then effect appears" feel)
                window.taskAnimationEffects.animateTaskCompletion(effectClone, effectRect);

                // Hide original only after effect has started (next frame) to match Smash list feel
                if (hasSize && taskElement && taskElement.parentNode) {
                    requestAnimationFrame(() => {
                        try { taskElement.style.visibility = 'hidden'; } catch (e) {}
                    });
                }

                setTimeout(() => {
                    if (effectClone.parentNode) effectClone.remove();
                    if (hasSize && taskElement.parentNode) taskElement.style.visibility = '';
                    document.body.classList.remove('task-effect-playing');
                    document.documentElement.classList.remove('task-effect-playing');
                    this.syncPagerPages();
                }, 1100);

                // Special handling for Smash List - delay replenishment until after effects
                if (currentList.id === 'smash-list' || currentList.name === '💥 Smash List') {
                    // Wait for the visual effects to complete before removing the task
                    setTimeout(() => {
                        // Remove completed task from Smash List after effects finish
                        currentList.tasks = currentList.tasks.filter(t => t.id !== taskId);
                        this.replenishSmashTasks();
                        // Force re-render to show new tasks
                        this.renderTasks();
                        this.updateCompletedCount();
                        this.renderListTabs();
                        this.processingTaskId = null;
                    }, 1000); // Wait longer for effects to be visible
                } else if (taskId.startsWith('tutorial-')) {
                    // Tutorial: 完了タスクはリストに残し Completed に表示する
                    setTimeout(() => {
                        this.saveTasks();
                        this.renderTasks();
                        this.updateCompletedCount();
                        this.renderListTabs();
                        // Move focus after DOM updates (avoid shifting layout mid-effect; align with Smash list feel)
                        this.focusNextTaskCheckbox(taskId);
                        this.processingTaskId = null;
                    }, 500);
                } else {
                    // Keep behavior aligned with Smash list: don't re-render mid-effect.
                    setTimeout(() => {
                        this.saveTasks();
                        this.renderTasks();
                        this.updateCompletedCount();
                        this.renderListTabs(); // Update tab counts
                        // Move focus after DOM updates (avoid shifting layout mid-effect; align with Smash list feel)
                        this.focusNextTaskCheckbox(taskId);
                        this.processingTaskId = null;
                    }, 1000);
                }
            } else {
                console.warn('No taskAnimationEffects or taskElement available, taskElement:', taskElement);

                // Special handling for Smash List - delay replenishment for fallback too
                if (currentList.id === 'smash-list' || currentList.name === '💥 Smash List') {
                    // Apply basic scaling effect even without animation library
                    if (taskElement) {
                        taskElement.style.transform = 'scale(1.2)';
                        taskElement.style.backgroundColor = '#4CAF50';
                        taskElement.style.transition = 'all 0.3s ease';
                        taskElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                    }

                    // Wait for effects to complete before removing task
                    setTimeout(() => {
                        // Remove completed task from Smash List after effects
                        currentList.tasks = currentList.tasks.filter(t => t.id !== taskId);
                        this.replenishSmashTasks();
                        this.renderTasks();
                        this.updateCompletedCount();
                        this.renderListTabs();
                        this.processingTaskId = null;
                    }, 800); // Wait for basic effects to be visible
                } else if (taskId.startsWith('tutorial-')) {
                    // Tutorial: 完了タスクはリストに残し Completed に表示する (fallback)
                    if (taskElement) {
                        taskElement.style.transform = 'scale(1.2)';
                        taskElement.style.backgroundColor = '#4CAF50';
                        taskElement.style.transition = 'all 0.3s ease';
                        taskElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                    }
                    setTimeout(() => {
                        this.saveTasks();
                        this.renderTasks();
                        this.updateCompletedCount();
                        this.renderListTabs();
                        this.processingTaskId = null;
                    }, 800);
                } else {
                    // Normal lists fallback (no animation library): keep timings closer to Smash list.
                    this.saveTasks();
                    this.renderTasks();
                    this.updateCompletedCount();
                    this.renderListTabs(); // Update tab counts
                    this.processingTaskId = null;
                }
            }
        }
    }

    focusNextTaskCheckbox(completedTaskId) {
        // 未完了のタスクを取得（親タスクのみ）
        const incompleteTasks = this.tasks.filter(task => this.isTopLevelTask(task) && !task.completed);

        if (incompleteTasks.length > 0) {
            // 次のタスクのチェックボックスを見つける
            const nextTaskId = incompleteTasks[0].id;

            // 少し遅らせて次のチェックボックスにフォーカス
            setTimeout(() => {
                const nextCheckbox = document.querySelector(`[data-task-id="${nextTaskId}"] .task-checkbox`);
                if (nextCheckbox) {
                    nextCheckbox.focus();

                    // 視覚的なフォーカス効果を追加
                    nextCheckbox.style.boxShadow = '0 0 8px rgba(66, 133, 244, 0.6)';
                    nextCheckbox.style.borderColor = '#4285f4';
                    nextCheckbox.style.transition = 'all 0.2s ease';

                    // フォーカス効果を一定時間後に削除
                    setTimeout(() => {
                        nextCheckbox.style.boxShadow = '';
                        nextCheckbox.style.borderColor = '';
                    }, 1000);
                }
            }, 300); // エフェクトの開始後に少し遅らせる
        }
    }

    /**
     * Toggle a subtask's done state from the main list. Updates task, saves, re-renders. Plays pico sound when completing.
     */
    toggleSubtaskInList(taskId, subtaskId) {
        const currentList = this.getCurrentList();
        if (!currentList || !currentList.tasks) return;
        const task = currentList.tasks.find(t => String(t.id) === String(taskId));
        if (!task || !Array.isArray(task.subtasks)) return;
        const subtask = task.subtasks.find(s => String(s.id) === String(subtaskId));
        if (!subtask) return;
        const wasDone = subtask.done;
        subtask.done = !subtask.done;
        if (subtask.done && !wasDone && window.picoSound && typeof window.picoSound.playSubtaskCompleteSound === 'function') {
            const completed = task.subtasks.filter(s => s.done).length;
            window.picoSound.playSubtaskCompleteSound({ total: task.subtasks.length, completed });
        }
        this.saveTasks();
        this.renderTasks();
    }

    editTask(taskId, options = {}) {
        console.log('editTask called with taskId:', taskId);

        const currentList = this.getCurrentList();
        if (currentList && (currentList.id === 'smash-list' || currentList.name === '💥 Smash List')) {
            console.log('Preventing edit of Smash List task');
            return;
        }

        // Find task in current list
        if (!currentList || !currentList.tasks) {
            console.log('No current list or tasks found');
            return;
        }

        const task = currentList.tasks.find(t => String(t.id) === String(taskId));
        if (!task) {
            console.log('Task not found:', taskId);
            return;
        }

        console.log('Found task for editing:', task);
        this.currentTask = { ...task };
        this.selectedDate = task.dueDate;
        this.selectedRepeat = task.repeat || 'none';
        if (task.subtasks && Array.isArray(task.subtasks)) {
            this.currentSubtasks = (task.subtasks || []).map(st => this.normalizeSubtask(st)).filter(Boolean);
        } else {
            this.currentSubtasks = [];
        }
        this.focusSubtasksWhenSheetOpen = !!(options && options.focusSubtasks);

        if (window.innerWidth <= 768) {
            this.showMobileModal();
            // Bottom sheet will populate data via populateBottomSheetData()
        } else {
            // Desktop: Show inline editing
            this.showInlineTaskEdit(taskId);

            if (this.focusSubtasksWhenSheetOpen) {
                this.focusSubtasksWhenSheetOpen = false;
                setTimeout(() => {
                    const form = document.querySelector(`.inline-edit-form[data-editing-task="${taskId}"]`);
                    const section = form && form.querySelector('.inline-edit-subtasks-section');
                    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
            }

            // Fill form with task data for desktop
            const titleField = document.getElementById('taskTitle');
            const detailsField = document.getElementById('taskDetails');

            if (titleField) {
                const displayTitle = this.getTaskDisplayTitle(task);
                if (titleField.tagName === 'INPUT') {
                    titleField.value = displayTitle;
                } else {
                    titleField.innerHTML = this.processLinksForDisplay(displayTitle);
                }
            }

            if (detailsField) {
                detailsField.innerHTML = this.processLinksForDisplay(task.details || '');
            }
        }

        // Set up rich text editing for desktop only (mobile is handled in setTimeout above)
        if (window.innerWidth > 768) {
            const taskTitleEl = document.getElementById('taskTitle');
            const taskDetailsEl = document.getElementById('taskDetails');

            if (taskTitleEl && taskTitleEl.contentEditable === 'true') {
                this.setupRichTextEditor(taskTitleEl);

                // Setup placeholder behavior
                if (taskTitleEl.textContent.trim() === '' && taskTitleEl.hasAttribute('placeholder')) {
                    taskTitleEl.classList.add('empty');
                }
            }

            if (taskDetailsEl) {
                this.setupRichTextEditor(taskDetailsEl);

                // Setup placeholder behavior
                if (taskDetailsEl.textContent.trim() === '' && taskDetailsEl.hasAttribute('placeholder')) {
                    taskDetailsEl.classList.add('empty');
                }
            }
        }

        // Update date and repeat buttons for desktop only (mobile is handled in setTimeout above)
        if (window.innerWidth > 768) {
            // Update date buttons
            document.querySelectorAll('.date-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            if (task.dueDate) {
                const today = this.getTodayYMD();
                const tomorrowStr = this.getTomorrowYMD();

                if (task.dueDate === today) {
                    document.getElementById('todayBtn').classList.add('active');
                } else if (task.dueDate === tomorrowStr) {
                    document.getElementById('tomorrowBtn').classList.add('active');
                } else {
                    const calendarBtn = document.getElementById('calendarBtn');
                    const customDatePicker = document.getElementById('customDatePicker');
                    if (calendarBtn) calendarBtn.classList.add('active');
                    if (customDatePicker) customDatePicker.value = task.dueDate;
                }
            }

            // Update repeat selector
            const repeatSelector = document.getElementById('repeatSelector');
            const repeatInterval = document.getElementById('repeatInterval');
            const repeatBtn = document.getElementById('repeatBtn');

            if (task.repeat && task.repeat !== 'none') {
                if (repeatSelector) repeatSelector.style.display = 'block';
                if (repeatInterval) repeatInterval.value = task.repeat;
                if (repeatBtn) repeatBtn.classList.add('active');
            }

            // Show delete button in edit mode
            const deleteBtn = document.getElementById('deleteBtn');
            if (deleteBtn) {
                deleteBtn.style.display = 'block';
            }
        }

        // Focus on title input
        document.getElementById('taskTitle').focus();
    }

    deleteTask(taskId) {
        this.taskToDelete = taskId;
        this.showDeleteModal();
    }

    async confirmDeleteTask() {
        if (this.taskToDelete) {
            if (this.isAuthenticated) {
                // Firestoreから削除
                try {
                    await deleteTaskFromFirestore(this.taskToDelete);
                } catch (error) {
                    console.error('Error deleting task from Firestore:', error);
                }
                this.tasks = this.tasks.filter(t => t.id !== this.taskToDelete);
            } else {
                // ローカルのみで削除
                this.tasks = this.tasks.filter(t => t.id !== this.taskToDelete);
            }
            this.saveTasks();
            this.renderTasks();
            this.updateCompletedCount();
            this.renderListTabs();
            this.comicEffects.playSound('taskDelete');
            this.hideDeleteModal();
        }
    }

    showDeleteModal() {
        document.getElementById('deleteModal').classList.add('active');
        this.comicEffects.playSound('taskAdd');
    }

    hideDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.taskToDelete = null;
        this.comicEffects.playSound('taskCancel');
    }

    toggleCompletedSection() {
        console.log('Toggling completed section');
        this.isCompletedExpanded = !this.isCompletedExpanded;
        const completedTasks = document.getElementById('completedTasks');
        const completedIcon = document.getElementById('completedIcon');
        const completedToggle = document.getElementById('completedToggle');

        if (this.isCompletedExpanded) {
            completedTasks.style.display = 'block';
            completedIcon.style.transform = 'rotate(90deg)';
            completedToggle.classList.add('expanded');
        } else {
            completedTasks.style.display = 'none';
            completedIcon.style.transform = 'rotate(0deg)';
            completedToggle.classList.remove('expanded');
        }

        // Play sound feedback
        if (this.comicEffects && typeof this.comicEffects.playSound === 'function') {
            this.comicEffects.playSound('taskAdd');
        }
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const completedTasks = document.getElementById('completedTasks');
        const emptyState = document.getElementById('emptyState');
        const gameStartEmpty = document.getElementById('gameStartEmpty');
        const tutorialCompleteCta = document.getElementById('tutorialCompleteCta');
        const loadingFirestore = document.getElementById('loadingFirestore');

        if (this.isLoadingFromFirestore && loadingFirestore) {
            if (taskList) taskList.innerHTML = '';
            if (emptyState) emptyState.style.display = 'none';
            if (gameStartEmpty) gameStartEmpty.style.display = 'none';
            if (tutorialCompleteCta) tutorialCompleteCta.style.display = 'none';
            loadingFirestore.style.display = 'flex';
            const completedSection = document.getElementById('completedSection');
            if (completedSection) completedSection.style.display = 'none';
            return;
        }

        if (loadingFirestore) loadingFirestore.style.display = 'none';

        // Get tasks from current list (count/display only top-level tasks; exclude subtasks stored as separate docs)
        const currentList = this.getCurrentList();
        const currentTasks = currentList ? currentList.tasks : [];
        const topLevelTasks = currentTasks.filter(t => this.isTopLevelTask(t));

        // Update global tasks array for backward compatibility
        this.tasks = currentTasks;

        const activeTasks = topLevelTasks.filter(t => !t.completed);
        const completedTasksList = topLevelTasks.filter(t => t.completed);

        // Check if there are NO tasks at all (including completed)
        const hasNoTasks = topLevelTasks.length === 0;

        // Special handling for Smash List
        if (currentList && (currentList.id === 'smash-list' || currentList.name === '💥 Smash List')) {
            // Hide both empty states and CTA for Smash List
            if (emptyState) emptyState.style.display = 'none';
            if (gameStartEmpty) gameStartEmpty.style.display = 'none';
            if (tutorialCompleteCta) tutorialCompleteCta.style.display = 'none';

            // Hide add task button for Smash List
            const addTaskButton = document.getElementById('addTaskBtn');
            if (addTaskButton) {
                addTaskButton.style.display = 'none';
                addTaskButton.style.visibility = 'hidden';
            }

            // Ensure Smash List has exactly 3 tasks at all times
            this.maintainSmashListTasks();
            const updatedActiveTasks = currentList.tasks.filter(t => this.isTopLevelTask(t) && !t.completed);

            // Always show Smash List message and tasks
            let smashSub = (typeof window.t === 'function' ? window.t('smashListSubtitle') : 'This list exists only to let you tap and smash tasks for pure satisfaction. No saving, no planning—just smashing.');
            smashSub = smashSub.replace(/\. /g, '.<br>').replace(/。/g, '。<br>');
            let smashHint = typeof window.t === 'function' ? window.t('smashListHint') : 'Press Space to smash a task';
            smashHint = smashHint.replace(/\bSpace\b/g, '<span class="command-key">Space</span>');
            taskList.innerHTML = `
                <div class="smash-list-message">
                    <p class="smash-list-subtitle">${smashSub}</p>
                    <p class="desktop-only smash-list-hint">${smashHint}</p>
                </div>
                ${updatedActiveTasks.map(task => this.renderSmashTask(task)).join('')}
            `;

            // Hide completed tasks section for Smash List
            const completedSection = document.getElementById('completedSection');
            if (completedSection) completedSection.style.display = 'none';
        } else {
            // Regular list rendering
            // Show add task button for regular lists
            const addTaskButton = document.getElementById('addTaskBtn');
            if (addTaskButton) {
                addTaskButton.style.display = 'block';
                addTaskButton.style.visibility = 'visible';
            }

            if (activeTasks.length === 0) {
                taskList.innerHTML = '';
                const isTutorialList = currentList && currentList.id === 'default' && currentList.name === 'Tutorial';
                const allTutorialCompleted = !this.isAuthenticated && isTutorialList && completedTasksList.length > 0;
                if (allTutorialCompleted) {
                    if (emptyState) emptyState.style.display = 'none';
                    if (gameStartEmpty) gameStartEmpty.style.display = 'none';
                    if (tutorialCompleteCta) tutorialCompleteCta.style.display = 'block';
                } else if (hasNoTasks) {
                    if (emptyState) emptyState.style.display = 'none';
                    if (gameStartEmpty) gameStartEmpty.style.display = 'block';
                    if (tutorialCompleteCta) tutorialCompleteCta.style.display = 'none';
                } else {
                    if (emptyState) emptyState.style.display = 'block';
                    if (gameStartEmpty) gameStartEmpty.style.display = 'none';
                    if (tutorialCompleteCta) tutorialCompleteCta.style.display = 'none';
                }
            } else {
                if (emptyState) emptyState.style.display = 'none';
                if (gameStartEmpty) gameStartEmpty.style.display = 'none';
                if (tutorialCompleteCta) tutorialCompleteCta.style.display = 'none';
                taskList.innerHTML = activeTasks.map(task => this.renderTask(task)).join('');
            }

            // Render completed tasks for regular lists (top-level only)
            completedTasks.innerHTML = completedTasksList.map(task => this.renderTask(task)).join('');

            // Show completed tasks section for regular lists
            const completedSection = document.getElementById('completedSection');
            if (completedSection) completedSection.style.display = 'block';
        }

        // Setup event listeners for tasks (only once)
        if (!this.taskEventListenersSetup) {
            this.setupTaskEventListeners();
        }

        // Setup keyboard shortcuts (only once)
        if (!this.keyboardShortcutsSetup) {
            this.setupKeyboardShortcuts();
        }

        // Re-setup drag listeners after render
        if (this.setupTaskDragListeners) {
            this.setupTaskDragListeners();
        }

        // Refresh pager previews when tasks change
        if (typeof this.syncPagerPages === 'function') this.syncPagerPages();

        // Setup mobile FAB (only once)
        if (!this.mobileFabListenerSetup) {
            this.setupMobileFabListener();
            this.mobileFabListenerSetup = true;
        }

        // Render mobile FAB state
        this.renderMobileFab();
    }

    renderTask(task) {
        const dueStatus = this.getDueStatus(task.dueDate);
        const dueShort = this.formatDueShortEN(task.dueDate);
        const repeatShort = this.formatRepeatShortEN(task.repeat);
        const metaParts = [dueShort, repeatShort].filter(Boolean);
        const parentMetaText = metaParts.length > 0 ? metaParts.map(s => this.escapeHtml(s)).join(' · ') : '';
        const parentMetaHtml = parentMetaText ? `<div class="task-meta-text ${dueStatus}">${parentMetaText}</div>` : '';
        const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
        const SUBTASK_PREVIEW_MAX = 2;
        const previewSubtasks = subtasks.slice(0, SUBTASK_PREVIEW_MAX);
        const remainingCount = subtasks.length - SUBTASK_PREVIEW_MAX;
        const subtaskRowsHtml = subtasks.length > 0
            ? previewSubtasks.map(st => {
                const stDue = this.formatDueShortEN(st.dueDate);
                const stMeta = stDue ? `<span class="subtask-meta-text">${this.escapeHtml(stDue)}</span>` : '';
                return `
                <div class="subtask-row ${st.done ? 'done' : ''}" data-type="subtask" data-parent-id="${this.escapeHtml(task.id)}" data-sub-id="${this.escapeHtml(st.id)}">
                    <div class="subtask-row1">
                        <input type="checkbox" class="subtask-preview-checkbox" ${st.done ? 'checked' : ''} data-task-id="${this.escapeHtml(task.id)}" data-subtask-id="${this.escapeHtml(st.id)}" aria-label="Toggle subtask" />
                        <span class="subtask-preview-text">${this.escapeHtml(st.text)}</span>
                        ${stMeta}
                    </div>
                </div>`;
            }).join('') + (remainingCount > 0 ? `<div class="subtask-more" data-task-id="${this.escapeHtml(task.id)}">+${remainingCount}</div>` : '')
            : '';
        const subtasksBlockHtml = subtasks.length > 0 ? `<div class="subtasks" data-task-id="${this.escapeHtml(task.id)}">${subtaskRowsHtml}</div>` : '';
        const ptResult = task.perfectTimingResult ? ` data-perfect-timing-result="${this.escapeHtml(task.perfectTimingResult)}"` : '';
        return `
            <div class="task-card task-item ${task.completed ? 'completed' : ''}" data-task-id="${this.escapeHtml(task.id)}"${ptResult} draggable="${!task.completed}">
                <div class="task-main">
                    <div class="task-row" data-type="task" data-id="${this.escapeHtml(task.id)}">
                        <div class="task-checkbox ${task.completed ? 'completed' : ''}" tabindex="0" role="checkbox" aria-checked="${task.completed}"></div>
                        <div class="task-content">
                            <div class="task-title">${this.parseMarkdownLinks(this.getTaskDisplayTitle(task))}</div>
                            ${task.details ? `<div class="task-details-text">${this.parseMarkdownLinks(task.details)}</div>` : ''}
                            ${parentMetaHtml}
                        </div>
                        <div class="task-actions">
                            <button class="task-action-btn edit-btn" data-task-id="${this.escapeHtml(task.id)}" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="task-action-btn delete-btn" data-task-id="${this.escapeHtml(task.id)}" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
                ${subtasksBlockHtml}
            </div>
        `;
    }

    renderSmashTask(task) {
        // Same card structure as renderTask so width/layout match; no edit/delete actions
        const displayTitle = this.getSmashTaskDisplayTitle(task);
        const ptResult = task.perfectTimingResult ? ` data-perfect-timing-result="${this.escapeHtml(task.perfectTimingResult)}"` : '';
        return `
            <div class="task-card task-item ${task.completed ? 'completed' : ''}" data-task-id="${this.escapeHtml(task.id)}"${ptResult} draggable="false">
                <div class="task-main">
                    <div class="task-row" data-type="task" data-id="${this.escapeHtml(task.id)}">
                        <div class="task-checkbox ${task.completed ? 'completed' : ''}" tabindex="0" role="checkbox" aria-checked="${task.completed}"></div>
                        <div class="task-content">
                            <div class="task-title">${this.parseMarkdownLinks(displayTitle)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupTaskEventListeners() {
        console.log('Setting up task event listeners');

        // Prevent duplicate event listeners
        if (this.taskEventListenersSetup) {
            console.log('Event listeners already set up, skipping');
            return;
        }
        this.taskEventListenersSetup = true;

        // Clear any existing event listeners by removing them first
        const existingListeners = document.querySelectorAll('.task-event-listener');
        existingListeners.forEach(listener => {
            listener.remove();
        });

        // Single click handler for all task interactions
        document.addEventListener('click', (e) => {
            // Prevent click events immediately after touch events
            if (this.lastTouchTime && Date.now() - this.lastTouchTime < 500) {
                console.log('Preventing click event after touch');
                return;
            }

            // Subtask checkbox: toggle only (do NOT open sheet)
            if (e.target.closest('.subtask-preview-checkbox')) {
                e.stopPropagation();
                e.preventDefault();
                const cb = e.target.closest('.subtask-preview-checkbox');
                const taskId = cb.dataset.taskId;
                const subtaskId = cb.dataset.subtaskId;
                if (taskId && subtaskId) this.toggleSubtaskInList(taskId, subtaskId);
                return;
            }
            // Subtask row click -> open parent task edit with focus on subtasks
            if (e.target.closest('.subtask-row')) {
                e.stopPropagation();
                const row = e.target.closest('.subtask-row');
                const parentId = row.dataset.parentId;
                if (parentId != null) {
                    if (this.comicEffects && typeof this.comicEffects.playSound === 'function') this.comicEffects.playSound('taskEdit');
                    this.editTask(parentId, { focusSubtasks: true });
                }
                return;
            }
            // "+N" click -> open parent task edit focused on subtasks
            if (e.target.closest('.subtask-more')) {
                e.stopPropagation();
                const more = e.target.closest('.subtask-more');
                const taskId = more.dataset.taskId;
                if (taskId) {
                    if (this.comicEffects && typeof this.comicEffects.playSound === 'function') this.comicEffects.playSound('taskEdit');
                    this.editTask(taskId, { focusSubtasks: true });
                }
                return;
            }
            // Parent task checkbox: handled by PerfectTiming (pointer events)
            // (no click handler here - PerfectTimingManager handles via pointerdown/pointerup)

            if (e.target.closest('.edit-btn')) {
                e.stopPropagation();
                const taskId = e.target.closest('.task-action-btn').dataset.taskId;
                if (taskId) {
                    if (this.comicEffects && typeof this.comicEffects.playSound === 'function') this.comicEffects.playSound('taskEdit');
                    this.editTask(taskId);
                }
                return;
            }

            if (e.target.closest('.delete-btn')) {
                e.stopPropagation();
                const taskId = e.target.closest('.task-action-btn').dataset.taskId;
                if (taskId) this.deleteTask(taskId);
                return;
            }

            // Parent task row click -> open task edit (not checkbox, not actions, not links)
            if (e.target.closest('.task-row') &&
                !e.target.closest('.task-checkbox') &&
                !e.target.closest('.task-actions') &&
                !e.target.closest('a.task-link') &&
                !e.target.closest('a.task-action-link')) {
                const row = e.target.closest('.task-row');
                const taskId = row.dataset.id;
                if (taskId) {
                    if (this.comicEffects && typeof this.comicEffects.playSound === 'function') this.comicEffects.playSound('taskEdit');
                    this.editTask(taskId);
                }
                return;
            }
        });

        // Mobile touch events — tap-to-edit uses touchend; synthetic click follows (~300ms).
        // Only set lastTouchTime when we actually handle the gesture, so a "missed" touchend
        // (finger moved > slop) can fall through to click — otherwise both paths were blocked
        // and users had to tap twice.
        let touchStartData = null;
        const TAP_MOVE_MAX_PX = 40;

        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.task-item')) {
                const touch = e.touches[0];
                touchStartData = {
                    x: touch.clientX,
                    y: touch.clientY,
                    time: Date.now()
                };
            }
        });

        document.addEventListener('touchend', (e) => {
            // Parent task checkbox fallback: environments without PointerEvents / PerfectTiming
            // (e.g. some mobile browsers) should still toggle completion + play effects on tap.
            if (e.target.closest('.task-checkbox')) {
                const hasPointerEvents = typeof window.PointerEvent !== 'undefined';
                const hasPerfectTiming = typeof window.PerfectTimingManager !== 'undefined';
                if (!hasPointerEvents || !hasPerfectTiming) {
                    const cb = e.target.closest('.task-checkbox');
                    const taskItem = cb && cb.closest('.task-item');
                    const taskId = taskItem && taskItem.dataset ? taskItem.dataset.taskId : null;
                    if (taskId && taskItem) {
                        e.stopPropagation();
                        e.preventDefault();
                        this.toggleTaskCompletion(taskId, taskItem);
                        this.lastTouchTime = Date.now();
                        return;
                    }
                }
            }

            // Subtask preview checkbox
            if (e.target.closest('.subtask-preview-checkbox')) {
                e.stopPropagation();
                e.preventDefault();
                const cb = e.target.closest('.subtask-preview-checkbox');
                const taskId = cb && cb.dataset.taskId;
                const subtaskId = cb && cb.dataset.subtaskId;
                if (taskId && subtaskId) {
                    this.toggleSubtaskInList(taskId, subtaskId);
                    this.lastTouchTime = Date.now();
                }
                return;
            }
            // Subtask row touch -> open parent task edit with focus on subtasks
            if (e.target.closest('.subtask-row')) {
                e.stopPropagation();
                const row = e.target.closest('.subtask-row');
                const parentId = row && row.dataset.parentId;
                if (parentId != null && touchStartData) {
                    const touch = e.changedTouches[0];
                    const deltaX = Math.abs(touch.clientX - touchStartData.x);
                    const deltaY = Math.abs(touch.clientY - touchStartData.y);
                    const timeDiff = Date.now() - touchStartData.time;
                    if (timeDiff < 500 && deltaX < TAP_MOVE_MAX_PX && deltaY < TAP_MOVE_MAX_PX) {
                        if (this.comicEffects && typeof this.comicEffects.playSound === 'function') this.comicEffects.playSound('taskEdit');
                        this.editTask(parentId, { focusSubtasks: true });
                        this.lastTouchTime = Date.now();
                    }
                }
                touchStartData = null;
                return;
            }
            // +N touch -> open parent task edit focused on subtasks
            if (e.target.closest('.subtask-more')) {
                e.stopPropagation();
                const more = e.target.closest('.subtask-more');
                const taskId = more && more.dataset.taskId;
                if (taskId && touchStartData) {
                    const touch = e.changedTouches[0];
                    const deltaX = Math.abs(touch.clientX - touchStartData.x);
                    const deltaY = Math.abs(touch.clientY - touchStartData.y);
                    const timeDiff = Date.now() - touchStartData.time;
                    if (timeDiff < 500 && deltaX < TAP_MOVE_MAX_PX && deltaY < TAP_MOVE_MAX_PX) {
                        if (this.comicEffects && typeof this.comicEffects.playSound === 'function') this.comicEffects.playSound('taskEdit');
                        this.editTask(taskId, { focusSubtasks: true });
                        this.lastTouchTime = Date.now();
                    }
                }
                touchStartData = null;
                return;
            }
            // Handle checkbox touches: delegated to PerfectTiming (pointer events)
            // (no touchend handler here - PerfectTimingManager handles via pointerdown/pointerup)

            // Handle task item touches for editing — 添付リンク押下時は編集モーダルを開かない
            if (e.target.closest('.task-item') &&
                !e.target.closest('.task-checkbox') &&
                !e.target.closest('.task-actions') &&
                !e.target.closest('.task-action-btn') &&
                !e.target.closest('a.task-link') &&
                !e.target.closest('a.task-action-link')) {

                const taskItem = e.target.closest('.task-item');
                const taskId = taskItem.dataset.taskId;

                if (touchStartData) {
                    const touch = e.changedTouches[0];
                    const deltaX = Math.abs(touch.clientX - touchStartData.x);
                    const deltaY = Math.abs(touch.clientY - touchStartData.y);
                    const timeDiff = Date.now() - touchStartData.time;

                    // Simple tap detection: under 500ms and movement within slop (scroll/tremor tolerant)
                    if (timeDiff < 500 && deltaX < TAP_MOVE_MAX_PX && deltaY < TAP_MOVE_MAX_PX) {
                        console.log('Mobile tap edit for task:', taskId);
                        if (this.comicEffects && typeof this.comicEffects.playSound === 'function') {
                            this.comicEffects.playSound('taskEdit');
                        }
                        this.editTask(taskId);
                        this.lastTouchTime = Date.now();
                    }

                    touchStartData = null;
                }
            }
        });

        // Perfect Timing minigame (long-press to enter timing bar)
        this.setupPerfectTiming();

        // Setup drag and drop
        this.setupDragAndDrop();
    }

    setupPerfectTiming() {
        if (typeof window.PerfectTimingManager === 'undefined') return;
        window.comicEffects = this.comicEffects;
        const getTaskInfo = (taskId) => {
            const task = this.getCurrentList()?.tasks?.find(t => String(t.id) === String(taskId));
            return task?.completed ? { disabled: true } : null;
        };
        const completeTask = (taskId, taskElement, fromPerfectTiming, perfectTimingResult) => {
            if (taskId) this.toggleTaskCompletion(taskId, taskElement, { fromPerfectTiming, perfectTimingResult });
        };
        window.PerfectTimingManager.setup(getTaskInfo, completeTask);
    }

    setupKeyboardShortcuts() {
        console.log('Setting up keyboard shortcuts');

        // Prevent duplicate event listeners
        if (this.keyboardShortcutsSetup) {
            console.log('Keyboard shortcuts already set up, skipping');
            return;
        }
        this.keyboardShortcutsSetup = true;
        this.lastShiftSmashTime = this.lastShiftSmashTime ?? 0;

        const trySmashFirstTask = (e) => {
            const currentList = this.getCurrentList();
            if (!currentList || (currentList.id !== 'smash-list' && currentList.name !== '💥 Smash List')) {
                return;
            }
            const activeElement = document.activeElement;
            if (activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable ||
                activeElement.closest('.modal') ||
                activeElement.closest('.task-form')
            )) {
                return;
            }
            const now = Date.now();
            if (now - (this.lastShiftSmashTime ?? 0) < 300) {
                return;
            }
            this.lastShiftSmashTime = now;
            const activeTasks = currentList.tasks.filter(t => this.isTopLevelTask(t) && !t.completed);
            if (activeTasks.length === 0) {
                return;
            }
            const firstTask = activeTasks[0];
            let taskElement = document.querySelector(`.task-item[data-task-id="${firstTask.id}"]`);
            if (!taskElement) {
                const taskListEl = document.getElementById('taskList');
                if (taskListEl) {
                    taskElement = taskListEl.querySelector('.task-item:not(.completed)');
                }
            }
            if (taskElement && firstTask) {
                if (e && e.preventDefault) e.preventDefault();
                if (e && e.stopPropagation) e.stopPropagation();
                this.toggleTaskCompletion(firstTask.id, taskElement);
            }
        };

        // Space: Smash List — short press = complete one task; long press = open Perfect Timing game
        let spaceHoldTimer = null;
        let spaceLongPressTriggered = false;
        let spaceKeyDownForSmash = false;
        const spaceHoldMs = (typeof window.PerfectTimingManager !== 'undefined' && window.PerfectTimingManager.config)
            ? window.PerfectTimingManager.config.holdThresholdMs : 350;

        const clearSpaceHold = () => {
            if (spaceHoldTimer) {
                clearTimeout(spaceHoldTimer);
                spaceHoldTimer = null;
            }
        };

        const handleKeyDown = (e) => {
            const isSpace = (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) && !e.ctrlKey && !e.altKey && !e.metaKey;
            if (!isSpace) return;
            const currentList = this.getCurrentList();
            const isSmashList = currentList && (currentList.id === 'smash-list' || currentList.name === '💥 Smash List');
            if (!isSmashList) return;
            const activeElement = document.activeElement;
            if (activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable ||
                activeElement.closest('.modal') ||
                activeElement.closest('.task-form')
            )) {
                return;
            }
            e.preventDefault();
            if (e.repeat) return;
            spaceLongPressTriggered = false;
            clearSpaceHold();
            const firstIncomplete = currentList.tasks.find(t => this.isTopLevelTask(t) && !t.completed);
            if (!firstIncomplete) return;
            spaceKeyDownForSmash = true;
            spaceHoldTimer = setTimeout(() => {
                spaceHoldTimer = null;
                spaceLongPressTriggered = true;
                const taskEl = document.querySelector(`.task-item[data-task-id="${firstIncomplete.id}"]`) ||
                    document.getElementById('taskList')?.querySelector('.task-item:not(.completed)');
                if (typeof window.PerfectTimingManager?.openForTask === 'function') {
                    window.PerfectTimingManager.openForTask(firstIncomplete.id, taskEl);
                    if (this.comicEffects?.playSound) this.comicEffects.playSound('buttonClick');
                } else {
                    trySmashFirstTask(e);
                }
            }, spaceHoldMs);
        };

        const handleKeyUp = (e) => {
            const isSpace = (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) && !e.ctrlKey && !e.altKey && !e.metaKey;
            if (!isSpace) {
                spaceKeyDownForSmash = false;
                return;
            }
            const currentList = this.getCurrentList();
            const isSmashList = currentList && (currentList.id === 'smash-list' || currentList.name === '💥 Smash List');
            clearSpaceHold();
            if (isSmashList && spaceKeyDownForSmash && !spaceLongPressTriggered) {
                e.preventDefault();
                trySmashFirstTask(e);
            }
            spaceKeyDownForSmash = false;
            spaceLongPressTriggered = false;
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        console.log('Keyboard shortcuts set up successfully');
    }

    // --- D&D用内部メソッド例（既存のものを流用・整理） ---
    _startTaskDrag(taskItem, x, y, e) {
        this.draggedTask = taskItem;
        this.draggedTask.classList.add('dragging');
        this.dragStartY = y;
    }

    _moveTaskDrag(taskItem, x, y, e) {
        if (!this.draggedTask) return;
        const taskList = this.draggedTask.parentNode;
        const tasks = Array.from(taskList.querySelectorAll('.task-item:not(.dragging)'));
        const mouseY = y;
        let insertBefore = null;
        for (const t of tasks) {
            const rect = t.getBoundingClientRect();
            if (mouseY < rect.top + rect.height / 2) {
                insertBefore = t;
                break;
            }
        }
        if (insertBefore) {
            taskList.insertBefore(this.draggedTask, insertBefore);
        } else {
            taskList.appendChild(this.draggedTask);
        }
    }

    _endTaskDrag(taskItem, x, y, e) {
        if (this.draggedTask) {
            this.draggedTask.classList.remove('dragging');
            this.draggedTask = null;
            // 並び替え後の順序でthis.tasksを更新
            this._updateTaskOrderFromDOM();
        }
    }

    _updateTaskOrderFromDOM() {
        // 現在のDOM順序に合わせてthis.tasksを並び替え
        const taskList = document.getElementById('taskList');
        if (!taskList) return;
        const newOrder = Array.from(taskList.querySelectorAll('.task-item')).map(item => item.dataset.taskId);
        this.tasks = newOrder.map(id => this.tasks.find(t => String(t.id) === String(id))).filter(Boolean);
        // 必要ならFirestore等にも保存
        // this.saveTasks();
    }

    setupDragAndDrop() {
        console.log('Setting up drag and drop functionality');

        // Simplified drag and drop variables
        let draggedElement = null;
        let draggedIndex = -1;
        let isMouseDown = false;
        let isDraggingNow = false;
        let startY = 0;
        let startX = 0;
        let dragThreshold = 15;
        let floatingClone = null;
        let isTouchDevice = false;

        const setupTaskDragListeners = () => {
            console.log('Setting up task drag listeners');
            document.querySelectorAll('.task-item:not(.completed)').forEach((taskItem, index) => {
                console.log('Adding listeners to task:', taskItem.dataset.taskId);

                // マウスイベント（PC用）
                taskItem.addEventListener('mousedown', (e) => {
                    if (isTouchDevice) return; // タッチデバイスでは無効化

                    // Don't start drag on interactive elements
                    if (e.target.closest('.task-checkbox, .task-actions, .task-action-btn')) {
                        return;
                    }

                    isMouseDown = true;
                    isDraggingNow = false; // 追加: ドラッグ開始前にリセット
                    startY = e.clientY;
                    startX = e.clientX;
                    draggedElement = taskItem;
                    draggedIndex = Array.from(taskItem.parentNode.children).indexOf(taskItem);

                    e.preventDefault();
                });

                taskItem.addEventListener('mousemove', (e) => {
                    if (isTouchDevice) return; // タッチデバイスでは無効化
                    if (!isMouseDown || !draggedElement || isDraggingNow) return;

                    const deltaY = Math.abs(e.clientY - startY);
                    const deltaX = Math.abs(e.clientX - startX);

                    if (deltaY > dragThreshold || deltaX > dragThreshold) {
                        // ドラッグ開始
                        isDraggingNow = true;
                        draggedElement.classList.add('dragging');
                        draggedElement.style.opacity = '0.5';

                        // サウンドは一度だけ
                        if (this.comicEffects && typeof this.comicEffects.playSound === 'function') {
                            this.comicEffects.playSound('taskAdd');
                        }

                        // フローティングクローン生成
                        floatingClone = draggedElement.cloneNode(true);
                        floatingClone.classList.add('floating-clone');
                        floatingClone.style.position = 'fixed';
                        floatingClone.style.pointerEvents = 'none';
                        floatingClone.style.opacity = '0.85';
                        floatingClone.style.left = `${e.clientX - draggedElement.offsetWidth / 2}px`;
                        floatingClone.style.top = `${e.clientY - draggedElement.offsetHeight / 2}px`;
                        floatingClone.style.width = `${draggedElement.offsetWidth}px`;
                        floatingClone.style.height = `${draggedElement.offsetHeight}px`;
                        document.body.appendChild(floatingClone);

                        // ドキュメント全体で追従
                        document.addEventListener('mousemove', handleDocumentMouseMove);
                        document.addEventListener('mouseup', handleDocumentMouseUp);
                    }
                });

                taskItem.addEventListener('mouseup', () => {
                    if (isTouchDevice) return; // タッチデバイスでは無効化
                    if (isMouseDown && draggedElement && !draggedElement.classList.contains('dragging')) {
                        // This was a click, not a drag
                        isMouseDown = false;
                        draggedElement = null;
                        draggedIndex = -1;
                    }
                });

                // Touch events for mobile - 300ms long press implementation
                let longPressTimer = null;
                let touchStartTime = 0;
                let touchMoved = false;

                taskItem.addEventListener('touchstart', (e) => {
                    if (e.target.closest('.task-checkbox, .task-actions, .task-action-btn')) {
                        return;
                    }

                    console.log('Touch start on task:', taskItem.dataset.taskId);
                    isTouchDevice = true;
                    const touch = e.touches[0];
                    touchStartTime = Date.now();
                    touchMoved = false;
                    startY = touch.clientY;
                    startX = touch.clientX;
                    draggedElement = taskItem;
                    draggedIndex = Array.from(taskItem.parentNode.children).indexOf(taskItem);

                    // Start 300ms timer for long press detection
                    longPressTimer = setTimeout(() => {
                        if (!touchMoved && draggedElement) {
                            console.log('Long press detected, starting drag for task:', taskItem.dataset.taskId);
                            isDraggingNow = true;
                            isMouseDown = true;
                            draggedElement.classList.add('dragging');

                            // Add sound feedback for successful long press
                            if (this.comicEffects && typeof this.comicEffects.playSound === 'function') {
                                this.comicEffects.playSound('taskAdd');
                            }

                            document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
                            document.addEventListener('touchend', handleDocumentTouchEnd, { passive: false });
                            console.log('Document touch listeners added for long press drag');
                        }
                    }, 300);

                    // Don't prevent default to allow normal scrolling
                }, { passive: true });

                taskItem.addEventListener('touchmove', (e) => {
                    if (!isTouchDevice) return;

                    const touch = e.touches[0];
                    const deltaY = Math.abs(touch.clientY - startY);
                    const deltaX = Math.abs(touch.clientX - startX);

                    // Cancel long press if finger moves too much (8px threshold)
                    if ((deltaY > 8 || deltaX > 8) && !isDraggingNow) {
                        touchMoved = true;
                        if (longPressTimer) {
                            clearTimeout(longPressTimer);
                            longPressTimer = null;
                        }
                    }

                    // Only prevent default if already in drag mode
                    if (isDraggingNow) {
                        e.preventDefault();
                    }
                }, { passive: false });

                taskItem.addEventListener('touchend', (e) => {
                    if (!isTouchDevice) return;

                    // Clear timer if touch ends before long press completes
                    if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }

                    console.log('Task touchend called, isDraggingNow:', isDraggingNow);

                    // Don't reset drag state here if we're actively dragging
                    // Let the document handler manage it
                    if (!isDraggingNow) {
                        // Reset drag state only if not actively dragging
                        isMouseDown = false;
                        isDraggingNow = false;
                        draggedElement = null;
                        draggedIndex = -1;
                        touchMoved = false;
                    }
                }, { passive: true });
            });
        };

        const handleDocumentMouseMove = (e) => {
            if (!draggedElement || !isDraggingNow) return;
            // フローティングクローンをマウスに追従
            if (floatingClone) {
                floatingClone.style.left = `${e.clientX - floatingClone.offsetWidth / 2}px`;
                floatingClone.style.top = `${e.clientY - floatingClone.offsetHeight / 2}px`;
            }
            const taskList = document.getElementById('taskList');
            const tasks = Array.from(taskList.querySelectorAll('.task-item:not(.completed):not(.dragging)'));
            let dropIndex = -1;
            let minDistance = Infinity;
            tasks.forEach((task, index) => {
                const rect = task.getBoundingClientRect();
                const taskCenterY = rect.top + rect.height / 2;
                const distance = Math.abs(e.clientY - taskCenterY);
                if (distance < minDistance) {
                    minDistance = distance;
                    dropIndex = index;
                }
            });
            // If mouse is below all tasks, drop at the end
            if (tasks.length > 0) {
                const lastTask = tasks[tasks.length - 1];
                const lastRect = lastTask.getBoundingClientRect();
                if (e.clientY > lastRect.bottom) {
                    dropIndex = tasks.length;
                }
            }
            // Show drop indicator
            this.showSimpleDropIndicator(dropIndex, tasks);
        };

        const handleDocumentMouseUp = (e) => {
            if (!draggedElement || !isDraggingNow) return;
            const taskList = document.getElementById('taskList');
            const tasks = Array.from(taskList.querySelectorAll('.task-item:not(.completed):not(.dragging)'));
            let dropIndex = -1;
            let minDistance = Infinity;
            tasks.forEach((task, index) => {
                const rect = task.getBoundingClientRect();
                const taskCenterY = rect.top + rect.height / 2;
                const distance = Math.abs(e.clientY - taskCenterY);
                if (distance < minDistance) {
                    minDistance = distance;
                    dropIndex = index;
                }
            });
            if (tasks.length > 0) {
                const lastTask = tasks[tasks.length - 1];
                const lastRect = lastTask.getBoundingClientRect();
                if (e.clientY > lastRect.bottom) {
                    dropIndex = tasks.length;
                }
            }
            // Cleanup
            draggedElement.classList.remove('dragging');
            draggedElement.style.opacity = '';
            this.removeDropIndicators();
            // フローティングクローン削除
            if (floatingClone && floatingClone.parentNode) {
                floatingClone.parentNode.removeChild(floatingClone);
            }
            floatingClone = null;
            // Reorder tasks if needed
            if (dropIndex >= 0 && dropIndex !== draggedIndex) {
                this.reorderTasksWithAnimation(draggedIndex, dropIndex);
                if (this.comicEffects && typeof this.comicEffects.playSound === 'function') {
                    this.comicEffects.playSound('taskAdd');
                }
            }
            // Reset state
            isMouseDown = false;
            isDraggingNow = false;
            draggedElement = null;
            draggedIndex = -1;
            // Remove document listeners
            document.removeEventListener('mousemove', handleDocumentMouseMove);
            document.removeEventListener('mouseup', handleDocumentMouseUp);
        };

        // タッチイベント用のハンドラー
        const handleDocumentTouchMove = (e) => {
            if (!draggedElement || !isDraggingNow) return;
            const touch = e.touches[0];
            // フローティングクローンをタッチに追従
            if (floatingClone) {
                floatingClone.style.left = `${touch.clientX - floatingClone.offsetWidth / 2}px`;
                floatingClone.style.top = `${touch.clientY - floatingClone.offsetHeight / 2}px`;
            }
            const taskList = document.getElementById('taskList');
            const tasks = Array.from(taskList.querySelectorAll('.task-item:not(.completed):not(.dragging)'));
            let dropIndex = -1;
            let minDistance = Infinity;
            tasks.forEach((task, index) => {
                const rect = task.getBoundingClientRect();
                const taskCenterY = rect.top + rect.height / 2;
                const distance = Math.abs(touch.clientY - taskCenterY);
                if (distance < minDistance) {
                    minDistance = distance;
                    dropIndex = index;
                }
            });
            // If touch is below all tasks, drop at the end
            if (tasks.length > 0) {
                const lastTask = tasks[tasks.length - 1];
                const lastRect = lastTask.getBoundingClientRect();
                if (touch.clientY > lastRect.bottom) {
                    dropIndex = tasks.length;
                }
            }
            // Show drop indicator
            this.showSimpleDropIndicator(dropIndex, tasks);
        };

        const handleDocumentTouchEnd = (e) => {
            console.log('handleDocumentTouchEnd called');
            if (!draggedElement || !isDraggingNow) {
                console.log('No dragged element or not dragging');
                return;
            }

            e.preventDefault();
            const touch = e.changedTouches[0];
            const taskList = document.getElementById('taskList');
            const tasks = Array.from(taskList.querySelectorAll('.task-item:not(.completed):not(.dragging)'));
            let dropIndex = -1;
            let minDistance = Infinity;

            // Find drop position
            tasks.forEach((task, index) => {
                const rect = task.getBoundingClientRect();
                const taskCenterY = rect.top + rect.height / 2;
                const distance = Math.abs(touch.clientY - taskCenterY);
                if (distance < minDistance) {
                    minDistance = distance;
                    dropIndex = index;
                }
            });

            // Handle drop at end
            if (tasks.length > 0) {
                const lastTask = tasks[tasks.length - 1];
                const lastRect = lastTask.getBoundingClientRect();
                if (touch.clientY > lastRect.bottom) {
                    dropIndex = tasks.length;
                }
            }

            console.log('Touch end - draggedIndex:', draggedIndex, 'dropIndex:', dropIndex);

            // Cleanup dragging styles
            draggedElement.classList.remove('dragging');
            draggedElement.style.opacity = '';
            this.removeDropIndicators();

            // Remove floating clone if exists
            if (floatingClone && floatingClone.parentNode) {
                floatingClone.parentNode.removeChild(floatingClone);
            }
            floatingClone = null;

            // Reorder tasks if position changed
            if (dropIndex >= 0 && dropIndex !== draggedIndex) {
                console.log('Reordering tasks from', draggedIndex, 'to', dropIndex);
                this.reorderTasksWithAnimation(draggedIndex, dropIndex);

                if (this.comicEffects && typeof this.comicEffects.playSound === 'function') {
                    this.comicEffects.playSound('taskAdd');
                }
            }

            // Reset drag state
            isMouseDown = false;
            isDraggingNow = false;
            draggedElement = null;
            draggedIndex = -1;

            // Remove document listeners
            document.removeEventListener('touchmove', handleDocumentTouchMove);
            document.removeEventListener('touchend', handleDocumentTouchEnd);
            console.log('Document touch listeners removed');
        };

        // Initial setup
        setupTaskDragListeners();

        // Store the setup function for later use
        this.setupTaskDragListeners = setupTaskDragListeners;
    }

    showSimpleDropIndicator(index, tasks) {
        this.removeDropIndicators();

        if (tasks.length === 0) return;

        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        indicator.style.position = 'fixed';
        indicator.style.height = '3px';
        indicator.style.backgroundColor = '#4285f4';
        indicator.style.borderRadius = '2px';
        indicator.style.pointerEvents = 'none';
        indicator.style.zIndex = '99999';
        indicator.style.opacity = '0.8';

        if (index === 0) {
            // Insert at the beginning
            const firstTask = tasks[0];
            const rect = firstTask.getBoundingClientRect();
            indicator.style.top = `${rect.top - 2}px`;
            indicator.style.left = `${rect.left}px`;
            indicator.style.width = `${rect.width}px`;
        } else if (index >= tasks.length) {
            // Insert at the end
            const lastTask = tasks[tasks.length - 1];
            const rect = lastTask.getBoundingClientRect();
            indicator.style.top = `${rect.bottom + 2}px`;
            indicator.style.left = `${rect.left}px`;
            indicator.style.width = `${rect.width}px`;
        } else {
            // Insert between tasks
            const prevTask = tasks[index - 1];
            const rect = prevTask.getBoundingClientRect();
            indicator.style.top = `${rect.bottom + 2}px`;
            indicator.style.left = `${rect.left}px`;
            indicator.style.width = `${rect.width}px`;
        }

        document.body.appendChild(indicator);
    }

    removeDropIndicators() {
        document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    }

    reorderTasksWithAnimation(fromIndex, toIndex) {
        console.log('reorderTasksWithAnimation called:', fromIndex, '->', toIndex);
        const activeTasks = this.tasks.filter(t => this.isTopLevelTask(t) && !t.completed);
        console.log('Active tasks before reorder:', activeTasks.length);

        if (fromIndex < 0 || fromIndex >= activeTasks.length || toIndex < 0 || toIndex > activeTasks.length) {
            console.log('Invalid indices, returning');
            return;
        }

        // 1. すべてのタスクの現在位置を記録
        const taskElements = Array.from(document.querySelectorAll('.task-item:not(.completed)'));
        const prevRects = taskElements.map(el => ({
            id: el.dataset.taskId,
            rect: el.getBoundingClientRect()
        }));

        // 2. タスク配列を入れ替えてDOMを再描画
        const taskToMove = activeTasks[fromIndex];
        console.log('Moving task:', taskToMove.title, 'from', fromIndex, 'to', toIndex);
        activeTasks.splice(fromIndex, 1);
        activeTasks.splice(toIndex, 0, taskToMove);

        const completedTasks = this.tasks.filter(t => this.isTopLevelTask(t) && t.completed);
        this.tasks = [...activeTasks, ...completedTasks];
        this.saveTasks();
        this.renderTasks();
        this.renderListTabs();

        // 3. 新しい位置を取得し、アニメーションを適用
        setTimeout(() => {
            const newTaskElements = Array.from(document.querySelectorAll('.task-item:not(.completed)'));

            newTaskElements.forEach(el => {
                const prev = prevRects.find(r => r.id === el.dataset.taskId);
                if (prev) {
                    const currentRect = el.getBoundingClientRect();
                    const deltaY = prev.rect.top - currentRect.top;

                    if (Math.abs(deltaY) > 1) {
                        // アニメーション用のスタイルを適用
                        el.style.transition = 'none';
                        el.style.transform = `translateY(${deltaY}px)`;
                        el.classList.add('reordering');

                        // 次のフレームでアニメーション開始
                        requestAnimationFrame(() => {
                            el.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
                            el.style.transform = '';

                            // アニメーション完了後にクリーンアップ
                            setTimeout(() => {
                                el.classList.remove('reordering');
                                el.style.transition = '';
                            }, 300);
                        });
                    }
                }
            });
        }, 10);
    }

    reorderTasks(fromIndex, toIndex) {
        const activeTasks = this.tasks.filter(t => this.isTopLevelTask(t) && !t.completed);

        if (fromIndex < 0 || fromIndex >= activeTasks.length ||
            toIndex < 0 || toIndex > activeTasks.length) {
            return;
        }

        // Get the task to move
        const taskToMove = activeTasks[fromIndex];

        // Remove from original position
        activeTasks.splice(fromIndex, 1);

        // Insert at new position
        activeTasks.splice(toIndex, 0, taskToMove);

        // Update the main tasks array with the new order (top-level only)
        const completedTasks = this.tasks.filter(t => this.isTopLevelTask(t) && t.completed);
        this.tasks = [...activeTasks, ...completedTasks];

        // Save the new order (localStorage when guest; Firestore when authenticated)
        this.saveTasks();
        this.persistTaskOrder();
        this.renderTasks();
        this.renderListTabs();
    }

    /** Persist task order to Firestore so it survives list switch / reload. No-op when not authenticated or Smash list. */
    async persistTaskOrder() {
        if (!this.isAuthenticated || this.currentListId === 'smash-list') return;
        const activeTasks = this.tasks.filter(t => this.isTopLevelTask(t) && !t.completed);
        try {
            for (let i = 0; i < activeTasks.length; i++) {
                await updateTaskInFirestore(activeTasks[i].id, { order: i });
            }
        } catch (err) {
            console.error('[PixDone] Error persisting task order:', err);
        }
    }

    /** Format Date as local calendar day string (YYYY-MM-DD). */
    formatLocalYMD(date) {
        const d = date instanceof Date ? date : new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    /** Parse YYYY-MM-DD into a local Date (at local midnight). */
    parseYMDToLocalDate(ymd) {
        if (!ymd || typeof ymd !== 'string') return null;
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
        if (!m) return null;
        const y = Number(m[1]);
        const mo = Number(m[2]);
        const d = Number(m[3]);
        return new Date(y, mo - 1, d);
    }

    /** Normalize stored dueDate to YYYY-MM-DD if possible. */
    normalizeDueYMD(dueDate) {
        if (!dueDate) return null;
        if (typeof dueDate === 'string') {
            // Already date-only
            if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return dueDate;
            // Try parse other string formats
            const parsed = new Date(dueDate);
            return isNaN(parsed.getTime()) ? null : this.formatLocalYMD(parsed);
        }
        if (dueDate instanceof Date) return this.formatLocalYMD(dueDate);
        return null;
    }

    getTodayYMD() {
        return this.formatLocalYMD(new Date());
    }

    getTomorrowYMD() {
        const t = new Date();
        t.setDate(t.getDate() + 1);
        return this.formatLocalYMD(t);
    }

    /** Recompute date-relative UI at local day boundary and when tab becomes visible. */
    setupDayRolloverRefresh() {
        const today = this.getTodayYMD();
        if (this._lastTodayYMD === today && this._dayRolloverTimeout) return;
        this._lastTodayYMD = today;

        if (this._dayRolloverTimeout) {
            clearTimeout(this._dayRolloverTimeout);
            this._dayRolloverTimeout = null;
        }

        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const ms = Math.max(1000, nextMidnight.getTime() - now.getTime() + 250);
        this._dayRolloverTimeout = setTimeout(() => {
            this._dayRolloverTimeout = null;
            this.triggerDayRolloverRefresh();
            this.setupDayRolloverRefresh();
        }, ms);

        if (!this._dayRolloverVisibilityBound) {
            this._dayRolloverVisibilityBound = true;
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.triggerDayRolloverRefresh();
                    this.setupDayRolloverRefresh();
                }
            });
        }
    }

    triggerDayRolloverRefresh() {
        try {
            this.renderTasks();
            this.updateCompletedCount();
            this.renderListTabs();

            // If inline edits are open, refresh their date button state too
            document.querySelectorAll('.inline-edit-form').forEach(form => {
                const taskId = form.getAttribute('data-editing-task');
                if (!taskId) return;
                const currentList = this.getCurrentList();
                const task = currentList && currentList.tasks ? currentList.tasks.find(t => String(t.id) === String(taskId)) : null;
                if (task && task.dueDate) this.updateInlineDateButtons(taskId, this.normalizeDueYMD(task.dueDate));
            });
        } catch (e) {
            // no-op
        }
    }

    getDueStatus(dueDate) {
        if (!dueDate) return '';

        const today = this.getTodayYMD();
        const taskDate = this.normalizeDueYMD(dueDate);
        if (!taskDate) return '';

        if (taskDate < today) return 'overdue';
        if (taskDate === today) return 'today';
        return 'upcoming';
    }

    /**
     * Short due label for list: localized Today/今日, Tomorrow/明日, or M/D, YY/M/D.
     */
    formatDueShortEN(dueDate) {
        if (typeof window.formatDueShort === 'function') {
            return window.formatDueShort(dueDate, typeof window.getLang === 'function' ? window.getLang() : 'en');
        }
        if (!dueDate) return '';
        const today = this.getTodayYMD();
        const tomorrowStr = this.getTomorrowYMD();
        if (dueDate === today) return 'Today';
        if (dueDate === tomorrowStr) return 'Tomorrow';
        const d = this.parseYMDToLocalDate(dueDate) || new Date(dueDate);
        const y = d.getFullYear();
        const thisYear = new Date().getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        if (y !== thisYear) return `${String(y).slice(-2)}/${m}/${day}`;
        return `${m}/${day}`;
    }

    /**
     * Short repeat label for list (parent only): localized Daily/毎日, etc.
     */
    formatRepeatShortEN(rule) {
        if (!rule || rule === 'none') return '';
        const t = typeof window.t === 'function' ? window.t : (k) => k;
        const map = { daily: t('daily'), weekly: t('weekly'), monthly: t('monthly'), yearly: t('yearly') };
        return map[rule] || '';
    }

    /** Normalize subtask to allowed fields only (no repeat). */
    normalizeSubtask(st) {
        if (!st || typeof st.id === 'undefined') return null;
        return {
            id: String(st.id),
            text: typeof st.text === 'string' ? st.text : '',
            done: !!st.done,
            ...(st.dueDate ? { dueDate: st.dueDate } : {}),
            ...(st.details !== undefined && st.details !== null && st.details !== '' ? { details: String(st.details) } : {})
        };
    }

    formatDateDisplay(dueDate) {
        if (!dueDate) return '';
        if (typeof window.formatDueShort === 'function') {
            const short = window.formatDueShort(dueDate, typeof window.getLang === 'function' ? window.getLang() : 'en');
            if (short) return short;
        }
        const today = this.getTodayYMD();
        const tomorrowStr = this.getTomorrowYMD();
        const t = typeof window.t === 'function' ? window.t : (k) => k;
        if (dueDate === today) return t('dueToday');
        if (dueDate === tomorrowStr) return t('dueTomorrow');
        const date = this.parseYMDToLocalDate(dueDate) || new Date(dueDate);
        const lang = typeof window.getLang === 'function' ? window.getLang() : 'en';
        return date.toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', { month: 'short', day: 'numeric' });
    }

    /** 親タスクのみカウント（サブタスクが別ドキュメントの場合は除外） */
    isTopLevelTask(task) {
        return task && !task.parentId && !task.parentTaskId;
    }

    refreshLangUI() {
        const cur = typeof window.getLang === 'function' ? window.getLang() : 'en';
        const chips = ['langEnBtn', 'langJaBtn', 'authLangEnBtn', 'authLangJaBtn'];
        const expected = { langEnBtn: 'en', langJaBtn: 'ja', authLangEnBtn: 'en', authLangJaBtn: 'ja' };
        chips.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('active', cur === expected[id]);
        });
    }

    updateCompletedCount() {
        const currentList = this.getCurrentList();
        if (!currentList) return; // null/undefinedガードを追加
        const currentListId = currentList.id;
        const allCompletedTasks = this.tasks.filter(t => this.isTopLevelTask(t) && t.completed);
        const currentListCompletedTasks = allCompletedTasks.filter(t => t.listId === currentListId);
        const completedCount = currentListCompletedTasks.length;
        const completedCountElement = document.getElementById('completedCount');
        if (completedCountElement) {
            completedCountElement.textContent = completedCount;
        }
        // Hide completed section if no completed tasks
        const completedSection = document.getElementById('completedSection');
        if (completedSection) {
            if (completedCount === 0) {
                completedSection.style.display = 'none';
            } else {
                completedSection.style.display = 'block';
            }
        }
    }

    showCelebration(task) {
        // Prevent duplicate celebration for the same task
        if (this.celebratingTaskId === task.id) {
            console.log('Celebration already in progress for task:', task.id);
            return;
        }
        this.celebratingTaskId = task.id;

        // Show celebration message (effects are handled by animateTaskCompletion to avoid duplicates)
        const message = getCelebrationMessage(task);
        console.log('Celebration:', message);

        // Clear celebration flag after effects complete
        setTimeout(() => {
            this.celebratingTaskId = null;
        }, 2000); // Wait for effects to complete
    }

    hideCelebration() {
        // No overlay to hide - comic effects auto-dismiss
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // URL handling functions
    autoLinkUrls(text) {
        // First escape HTML to prevent XSS
        const escapedText = this.escapeHtml(text);

        // URL regex pattern that matches http:// and https:// URLs
        const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;

        // Replace URLs with anchor tags
        return escapedText.replace(urlRegex, (url) => {
            // Clean URL (remove trailing punctuation that shouldn't be part of the link)
            const cleanUrl = url.replace(/[.,;:!?]+$/, '');
            const trailingPunctuation = url.substring(cleanUrl.length);

            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="task-link" style="color: #1A73E8 !important; text-decoration: underline !important; font-weight: 500 !important;">${cleanUrl}</a>${trailingPunctuation}`;
        });
    }

    processTaskText(text) {
        if (!text) return '';
        return this.parseMarkdownLinks(text);
    }

    // Handle paste events for hyperlink creation
    handleHyperlinkPaste(inputElement) {
        console.log('[PixDone] Setting up hyperlink paste handler for:', inputElement.id);

        inputElement.addEventListener('paste', (e) => {
            console.log('[PixDone] Paste event triggered');
            const clipboardText = e.clipboardData.getData('text/plain');
            console.log('[PixDone] Clipboard text:', clipboardText);

            // Check if pasted text is a URL
            const urlRegex = /^https?:\/\/[^\s<>"']+$/i;
            if (!urlRegex.test(clipboardText.trim())) {
                console.log('[PixDone] Not a URL, allowing default paste');
                return; // Not a URL, let default paste behavior happen
            }

            const selectionStart = inputElement.selectionStart;
            const selectionEnd = inputElement.selectionEnd;
            const selectedText = inputElement.value.substring(selectionStart, selectionEnd);
            console.log('[PixDone] Selected text:', selectedText);

            // If text is selected and we're pasting a URL, create a hyperlink
            if (selectedText && selectedText.trim() !== '') {
                console.log('[PixDone] Creating hyperlink');
                e.preventDefault();

                // Create hyperlink markdown-style format: [text](url)
                const hyperlinkText = `[${selectedText}](${clipboardText.trim()})`;
                console.log('[PixDone] Hyperlink text:', hyperlinkText);

                // Replace selected text with hyperlink
                const beforeSelection = inputElement.value.substring(0, selectionStart);
                const afterSelection = inputElement.value.substring(selectionEnd);
                inputElement.value = beforeSelection + hyperlinkText + afterSelection;

                // Position cursor after the inserted hyperlink
                const newCursorPosition = selectionStart + hyperlinkText.length;
                inputElement.setSelectionRange(newCursorPosition, newCursorPosition);

                // Trigger input event to update any listeners
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));

                // Play sound feedback
                if (this.comicEffects && typeof this.comicEffects.playSound === 'function') {
                    this.comicEffects.playSound('taskEdit');
                }

                console.log('[PixDone] Hyperlink created successfully');
            } else {
                console.log('[PixDone] No text selected, allowing default paste');
            }
        });
    }

    // Parse markdown-style links and convert to HTML
    parseMarkdownLinks(text) {
        if (!text) return '';

        // First escape HTML
        let processedText = this.escapeHtml(text);

        // Convert internal action links [text](action:command) to HTML anchor tags
        const actionLinkRegex = /\[([^\]]+)\]\(action:([^\s)]+)\)/gi;
        processedText = processedText.replace(actionLinkRegex, (match, linkText, action) => {
            return `<a href="#" class="task-action-link" data-action="${action}" style="color: #1A73E8 !important; text-decoration: underline !important; font-weight: 500 !important;">${linkText}</a>`;
        });

        // Convert markdown links [text](url) to HTML anchor tags with inline style
        const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi;
        processedText = processedText.replace(markdownLinkRegex, (match, linkText, url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="task-link" style="color: #1A73E8 !important; text-decoration: underline !important; font-weight: 500 !important;">${linkText}</a>`;
        });

        // Then auto-link any remaining plain URLs that are not already inside anchor tags with inline style
        const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
        processedText = processedText.replace(urlRegex, (url) => {
            // Don't replace URLs that are already part of an anchor tag
            const beforeUrl = processedText.substring(0, processedText.indexOf(url));
            const isInsideAnchor = beforeUrl.lastIndexOf('<a ') > beforeUrl.lastIndexOf('</a>');

            if (isInsideAnchor) {
                return url; // Keep original URL if inside anchor
            }

            // Clean URL (remove trailing punctuation that shouldn't be part of the link)
            const cleanUrl = url.replace(/[.,;:!?]+$/, '');
            const trailingPunctuation = url.substring(cleanUrl.length);

            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="task-link" style="color: #1A73E8 !important; text-decoration: underline !important; font-weight: 500 !important;">${cleanUrl}</a>${trailingPunctuation}`;
        });

        return processedText;
    }

    // Highlight markdown links in text without converting to HTML links
    highlightMarkdownLinks(text) {
        if (!text) return '';

        // Escape HTML first
        let processedText = this.escapeHtml(text);

        // Highlight markdown links [text](url) 
        const markdownLinkRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/gi;
        processedText = processedText.replace(markdownLinkRegex, (match, fullMatch, linkText, url) => {
            return `<span class="markdown-link-preview">${fullMatch}</span>`;
        });

        // Highlight plain URLs
        const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
        processedText = processedText.replace(urlRegex, (url) => {
            // Don't highlight URLs that are already inside markdown links
            const beforeUrl = processedText.substring(0, processedText.indexOf(url));
            const isInsideMarkdown = beforeUrl.includes('[') && beforeUrl.lastIndexOf('[') > beforeUrl.lastIndexOf(']');

            if (isInsideMarkdown) {
                return url; // Keep original URL if inside markdown
            }

            return `<span class="markdown-link-preview">${url}</span>`;
        });

        return processedText;
    }

    // Process links for rich text display
    processLinksForDisplay(text) {
        if (!text) return '';

        // Escape HTML first
        let processedText = this.escapeHtml(text);

        // Convert markdown links [text](url) to HTML links with inline style for mobile
        const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi;
        processedText = processedText.replace(markdownLinkRegex, (match, linkText, url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="task-link" style="color: #1A73E8 !important; text-decoration: underline !important; font-weight: 500 !important;">${linkText}</a>`;
        });

        // Convert plain URLs to HTML links with inline style for mobile
        const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
        processedText = processedText.replace(urlRegex, (url) => {
            // Don't convert URLs that are already inside HTML links
            const beforeUrl = processedText.substring(0, processedText.indexOf(url));
            const isInsideLink = beforeUrl.includes('<a href="') && beforeUrl.lastIndexOf('<a href="') > beforeUrl.lastIndexOf('</a>');

            if (isInsideLink) {
                return url; // Keep original URL if inside HTML link
            }

            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="task-link" style="color: #1A73E8 !important; text-decoration: underline !important; font-weight: 500 !important;">${url}</a>`;
        });

        return processedText;
    }

    // Set up rich text editor with live link conversion
    setupRichTextEditor(element) {
        if (!element || element.richTextSetup) return;

        // Check if this is the details input for auto-grow
        const isDetailsInput = element.id === 'newTaskDetails';
        const sheet = element.closest('.task-bottom-sheet');

        // Handle input to convert links in real-time
        const handleInput = () => {
            const selection = window.getSelection();
            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            const offset = range ? range.startOffset : 0;

            // Get current text content
            const text = element.textContent || '';

            // Process and update HTML
            const newHTML = this.processLinksForDisplay(text);

            if (element.innerHTML !== newHTML) {
                element.innerHTML = newHTML;

                // Restore cursor position
                if (range && element.firstChild) {
                    try {
                        const textNode = this.findTextNodeAtOffset(element, offset);
                        if (textNode) {
                            range.setStart(textNode.node, Math.min(textNode.offset, textNode.node.textContent.length));
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    } catch (e) {
                        // Fallback: place cursor at end
                        const lastNode = this.getLastTextNode(element);
                        if (lastNode) {
                            range.setStart(lastNode, lastNode.textContent.length);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                }
            }

            // Auto-grow for details input
            if (isDetailsInput) {
                setTimeout(() => {
                    element.style.height = 'auto';
                    const scrollHeight = element.scrollHeight;
                    const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
                    const maxHeight = lineHeight * 4 + 12;
                    
                    if (scrollHeight <= maxHeight) {
                        element.style.height = scrollHeight + 'px';
                        element.style.overflowY = 'hidden';
                    } else {
                        element.style.height = maxHeight + 'px';
                        element.style.overflowY = 'auto';
                    }
                }, 0);
            }

            // Update section visibility
            if (sheet) {
                setTimeout(() => {
                    this.updateSectionVisibility(sheet);
                }, 10);
            }
        };

        // Handle paste: selected text + URL paste → [text](url) markdown link
        const urlRegex = /^https?:\/\/[^\s<>"']+$/i;
        const handlePaste = (e) => {
            e.preventDefault();
            const rawPaste = e.clipboardData.getData('text/plain') || '';
            const pastedTrimmed = rawPaste.trim();

            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);
            if (!element.contains(range.commonAncestorContainer)) return;
            const selectedText = selection.toString();

            if (selectedText && urlRegex.test(pastedTrimmed)) {
                const markdownLink = `[${selectedText}](${pastedTrimmed})`;
                range.deleteContents();
                range.insertNode(document.createTextNode(markdownLink));
                range.collapse(false);
                if (isDetailsInput) setTimeout(() => handleInput(), 10);
            } else {
                range.insertNode(document.createTextNode(rawPaste));
                range.collapse(false);
            }
            setTimeout(handleInput, 10);
        };

        element.addEventListener('input', handleInput);
        element.addEventListener('paste', handlePaste);
        element.richTextSetup = true;

        // Set placeholder behavior
        if (element.textContent.trim() === '' && element.hasAttribute('placeholder')) {
            element.classList.add('empty');
        }

        element.addEventListener('focus', () => {
            if (element.classList.contains('empty')) {
                element.classList.remove('empty');
            }
        });

        element.addEventListener('blur', () => {
            if (element.textContent.trim() === '') {
                element.classList.add('empty');
            }
        });
    }

    // Extract plain text with markdown from rich editor
    extractTextFromRichEditor(element) {
        let text = '';

        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'A') {
                    const href = node.getAttribute('href');
                    const linkText = node.textContent;
                    if (href && linkText !== href) {
                        text += `[${linkText}](${href})`;
                    } else {
                        text += href || linkText;
                    }
                } else {
                    // Process child nodes for other elements
                    for (let child of node.childNodes) {
                        processNode(child);
                    }
                    // Add line break for block elements
                    if (['DIV', 'P', 'BR'].includes(node.tagName)) {
                        text += '\n';
                    }
                }
            }
        };

        for (let child of element.childNodes) {
            processNode(child);
        }

        return text.trim();
    }

    // Select all text in contenteditable element
    selectAllText(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    // Find text node at specific offset
    findTextNodeAtOffset(element, targetOffset) {
        let currentOffset = 0;

        const walk = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const length = node.textContent.length;
                if (currentOffset + length >= targetOffset) {
                    return {
                        node: node,
                        offset: targetOffset - currentOffset
                    };
                }
                currentOffset += length;
            } else {
                for (let child of node.childNodes) {
                    const result = walk(child);
                    if (result) return result;
                }
            }
            return null;
        };

        return walk(element);
    }

    // Get last text node in element
    getLastTextNode(element) {
        let lastTextNode = null;

        const walk = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                lastTextNode = node;
            } else {
                for (let child of node.childNodes) {
                    walk(child);
                }
            }
        };

        walk(element);
        return lastTextNode;
    }

    // Error handling utility
    showErrorMessage(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        } else {
            // Fallback if no error div exists
            alert(message);
        }
    }

    // List management methods
    renderListTabs() {
        // タブ表示順: Smash list を一番左、次にマイタスク or Tutorial、その他。this.lists は変更しない。
        const smashList = this.lists && this.lists.find(l => l.id === 'smash-list' || l.name === '💥 Smash List');
        const primaryList = this.lists && (this.lists.find(l => this.isMyTasksList(l)) || this.lists.find(l => l.id === 'default'));
        const rest = this.lists ? this.lists.filter(l => l !== smashList && l !== primaryList) : [];
        const displayOrder = [smashList, primaryList, ...rest].filter(Boolean);

        const t = typeof window.t === 'function' ? window.t : (k) => k;
        const container = document.getElementById('listTabs');
        container.innerHTML = displayOrder.map(list => {
            const displayName = (list.id === 'smash-list' || list.name === '💥 Smash List')
                ? '💥'
                : (this.isMyTasksList(list) ? t('myTasks') : list.name);
            const count = (this.isAuthenticated && this.taskCountsByListId)
                ? (this.taskCountsByListId[String(list.id)] ?? 0)
                : (list.tasks || []).filter(task => this.isTopLevelTask(task) && !task.completed).length;
            return `
            <button class="list-tab ${list.id === this.currentListId ? 'active' : ''}" 
                    data-list-id="${list.id}">
                <span class="list-name">${this.escapeHtml(displayName)}</span>
                ${(list.id === 'smash-list' || list.name === '💥 Smash List') ? '' : `<span class="list-count">${count}</span>`}
            </button>
        `}).join('');

        // Add event listeners to list tabs
        container.querySelectorAll('.list-tab').forEach(tab => {
            // Left click to switch
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                this.switchToList(tab.dataset.listId);
            });

            // Right click for context menu
            tab.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showListContextMenu(e, tab.dataset.listId);
            });
        });

        // Scroll to active tab
        this.scrollToActiveTab();

        // Keep pager in sync when tabs change
        if (typeof this.syncPagerPages === 'function') this.syncPagerPages();
    }

    scrollToActiveTab() {
        const container = document.getElementById('listTabs');
        const activeTab = container.querySelector('.list-tab.active');

        if (activeTab && container.scrollWidth > container.clientWidth) {
            const containerRect = container.getBoundingClientRect();
            const activeTabRect = activeTab.getBoundingClientRect();
            const scrollLeft = activeTabRect.left - containerRect.left + container.scrollLeft - (containerRect.width / 2) + (activeTabRect.width / 2);

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }

    switchToPreviousList() {
        const currentIndex = this.lists.findIndex(list => list.id === this.currentListId);
        if (currentIndex > 0) {
            this.switchToList(this.lists[currentIndex - 1].id, 'right');
        } else if (this.lists.length > 1) {
            // Wrap to last list
            this.switchToList(this.lists[this.lists.length - 1].id, 'right');
        }
    }

    switchToNextList() {
        const currentIndex = this.lists.findIndex(list => list.id === this.currentListId);
        if (currentIndex < this.lists.length - 1) {
            this.switchToList(this.lists[currentIndex + 1].id, 'left');
        } else if (this.lists.length > 1) {
            // Wrap to first list
            this.switchToList(this.lists[0].id, 'left');
        }
    }

    animateListSwitch(direction, callback) {
        const tasksContainer = document.querySelector('.task-list-container');
        if (!tasksContainer) {
            callback();
            return;
        }

        const translateX = direction === 'left' ? -30 : 30;

        // Start animation - slide out current content
        tasksContainer.style.transition = 'all 0.15s ease';
        tasksContainer.style.transform = `translateX(${translateX}px)`;
        tasksContainer.style.opacity = '0.5';

        setTimeout(() => {
            // Switch content
            callback();

            // Slide in new content from opposite direction
            tasksContainer.style.transform = `translateX(${-translateX}px)`;

            setTimeout(() => {
                tasksContainer.style.transform = 'translateX(0)';
                tasksContainer.style.opacity = '1';

                setTimeout(() => {
                    tasksContainer.style.transition = '';
                }, 150);
            }, 10);
        }, 150);
    }

    switchToList(listId, direction = 'none') {
        if (typeof window.PerfectTimingManager?.closeOverlay === 'function') {
            window.PerfectTimingManager.closeOverlay();
        }
        if (direction !== 'none') {
            this.animateListSwitch(direction, () => {
                this.currentListId = listId;
                this.setupTasksRealtimeListener();
                this.renderListTabs();
                this.updateListTitle();
                this.renderTasks();
                this.updateCompletedCount();
                this.comicEffects.playSound('taskAdd');
            });
        } else {
            this.currentListId = listId;
            this.setupTasksRealtimeListener();
            this.renderListTabs();
            this.updateListTitle();
            this.renderTasks();
            this.updateCompletedCount();
            this.comicEffects.playSound('taskAdd');
        }
    }

    getCurrentList() {
        return this.lists.find(list => list.id === this.currentListId) || this.lists[0];
    }

    get tasks() {
        const currentList = this.getCurrentList();
        if (!currentList) return [];
        // Clean up tasks - remove isProcessing flag
        return currentList.tasks.map(task => {
            const cleanTask = { ...task };
            delete cleanTask.isProcessing;
            return cleanTask;
        });
    }

    set tasks(newTasks) {
        const currentList = this.getCurrentList();
        if (currentList) {
            // Clean up tasks - remove isProcessing flag
            currentList.tasks = newTasks.map(task => {
                const cleanTask = { ...task };
                delete cleanTask.isProcessing;
                return cleanTask;
            });
        }
    }

    showCreateListModal() {
        const modal = document.getElementById('createListModal');
        const input = document.getElementById('listNameInput');
        modal.classList.add('active');
        document.body.classList.add('list-dialog-open');
        this._setupListDialogViewportListener();
        // Hide FAB when modal opens
        const fab = document.getElementById('mobileFab');
        if (fab) {
            fab.style.display = 'none';
        }
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskAdd');
        }
        setTimeout(() => {
            input.focus();
            this._scrollListDialogInputIntoView(input);
        }, 100);
    }

    hideCreateListModal() {
        const modal = document.getElementById('createListModal');
        const input = document.getElementById('listNameInput');
        modal.classList.remove('active');
        if (!document.getElementById('editListModal').classList.contains('active')) {
            document.body.classList.remove('list-dialog-open');
            this._removeListDialogViewportListener();
        }
        input.value = '';
        // Show FAB when modal closes
        this.renderMobileFab();
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskCancel');
        }
    }

    async handleCreateList() {
        const input = document.getElementById('listNameInput');
        const listName = input.value.trim();
        if (listName) {
            await this.createNewList(listName);
            this.hideCreateListModal();
        }
    }

    async createNewList(name) {
        if (this.isAuthenticated) {
            try {
                const newListId = await addListToFirestore(name);
                // Firestoreからリストを再取得してUIを更新
                this.lists = await loadListsFromFirestore();
                this.switchToList(newListId);
                if (this.comicEffects && this.comicEffects.playSound) {
                    this.comicEffects.playSound('taskAdd');
                }
                this.renderListTabs();
                return;
            } catch (error) {
                console.error('Error creating list:', error);
            }
        }
        // Fallback to local storage for unauthenticated users
        const newList = {
            id: `list-${this.listIdCounter++}`,
            name: name,
            tasks: [],
            createdAt: new Date().toISOString()
        };
        this.lists.push(newList);
        this.saveLists();
        this.switchToList(newList.id);
        this.updateListTitle();
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskAdd');
        }
    }

    // Context menu methods
    showListContextMenu(event, listId) {
        const list = this.lists.find(l => l.id === listId);
        if (list && (this.isMyTasksList(list) || list.name === 'Tutorial')) return;

        this.contextMenuListId = listId;
        const contextMenu = document.getElementById('contextMenu');

        // Position context menu
        const x = event.clientX;
        const y = event.clientY;

        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.classList.add('active');
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskEdit');
        }

        // Adjust position if menu goes off screen
        setTimeout(() => {
            const rect = contextMenu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                contextMenu.style.left = (x - rect.width) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                contextMenu.style.top = (y - rect.height) + 'px';
            }
        }, 10);
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu && contextMenu.classList.contains('active')) {
            contextMenu.classList.remove('active');
            this.contextMenuListId = null;
            if (this.comicEffects && this.comicEffects.playSound) {
                this.comicEffects.playSound('taskCancel');
            }
        }
    }

    // List management methods
    showEditListModal(listId) {
        const list = this.lists.find(l => l.id == listId);
        if (list && (this.isMyTasksList(list) || list.name === 'Tutorial')) return;

        if (!list) return;

        this.editingListId = listId;
        const modal = document.getElementById('editListModal');
        const input = document.getElementById('editListNameInput');

        input.value = list.name;
        modal.classList.add('active');
        document.body.classList.add('list-dialog-open');
        this._setupListDialogViewportListener();
        // Hide FAB when modal opens
        const fab = document.getElementById('mobileFab');
        if (fab) {
            fab.style.display = 'none';
        }
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskAdd');
        }

        setTimeout(() => {
            input.focus();
            input.select();
            this._scrollListDialogInputIntoView(input);
        }, 100);
    }

    hideEditListModal() {
        const modal = document.getElementById('editListModal');
        const input = document.getElementById('editListNameInput');
        modal.classList.remove('active');
        if (!document.getElementById('createListModal').classList.contains('active')) {
            document.body.classList.remove('list-dialog-open');
            this._removeListDialogViewportListener();
        }
        input.value = '';
        // Show FAB when modal closes
        this.renderMobileFab();
        this.editingListId = null;
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskCancel');
        }
    }

    /**
     * モバイルでキーボード表示時に入力が隠れないようスクロール（リスト追加/編集ダイアログ用）
     */
    _scrollListDialogInputIntoView(input) {
        if (!input) return;
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) return;
        const scrollIntoView = () => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
        setTimeout(scrollIntoView, 400);
    }

    _setupListDialogViewportListener() {
        if (!window.visualViewport || this._listDialogViewportBound) return;
        this._listDialogViewportBound = true;
        const handler = () => {
            const createActive = document.getElementById('createListModal').classList.contains('active');
            const editActive = document.getElementById('editListModal').classList.contains('active');
            if (!createActive && !editActive) return;
            const input = document.activeElement;
            if (input && (input.id === 'listNameInput' || input.id === 'editListNameInput')) {
                requestAnimationFrame(() => {
                    input.scrollIntoView({ behavior: 'auto', block: 'center' });
                });
            }
        };
        window.visualViewport.addEventListener('resize', handler);
        window.visualViewport.addEventListener('scroll', handler);
        this._listDialogViewportCleanup = () => {
            window.visualViewport.removeEventListener('resize', handler);
            window.visualViewport.removeEventListener('scroll', handler);
            this._listDialogViewportBound = false;
        };
    }

    _removeListDialogViewportListener() {
        if (this._listDialogViewportCleanup) {
            this._listDialogViewportCleanup();
            this._listDialogViewportCleanup = null;
        }
    }

    async handleEditList() {
        const input = document.getElementById('editListNameInput');
        const newName = input.value.trim();
        if (!newName || !this.editingListId) return;
        if (this.isAuthenticated) {
            try {
                await editListInFirestore(this.editingListId, newName);
                this.lists = await loadListsFromFirestore();
                this.renderListTabs();
                this.updateListTitle();
                if (this.comicEffects && this.comicEffects.playSound) {
                    this.comicEffects.playSound('taskAdd');
                }
                this.hideEditListModal();
                return;
            } catch (error) {
                console.error('Error updating list:', error);
            }
        }
        // Fallback to local storage
        const list = this.lists.find(l => l.id === this.editingListId);
        if (list) {
            list.name = newName;
            this.saveLists();
            this.renderListTabs();
            this.updateListTitle();
            if (this.comicEffects && this.comicEffects.playSound) {
                this.comicEffects.playSound('taskAdd');
            }
        }
        this.hideEditListModal();
    }

    showDeleteListModal(listId) {
        const list = this.lists.find(l => l.id == listId);
        if (list && (this.isMyTasksList(list) || list.name === 'Tutorial')) return;

        if (!list) return;

        this.deletingListId = listId;
        const modal = document.getElementById('deleteListModal');
        const message = document.getElementById('deleteListMessage');

        const msg = typeof window.t === 'function' ? window.t('deleteListConfirm') : 'Are you sure you want to delete this list and all its tasks?';
        message.textContent = msg;
        modal.classList.add('active');
        // Hide FAB when modal opens
        const fab = document.getElementById('mobileFab');
        if (fab) {
            fab.style.display = 'none';
        }
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskAdd');
        }
    }

    hideDeleteListModal() {
        const modal = document.getElementById('deleteListModal');
        modal.classList.remove('active');
        this.deletingListId = null;
        // Show FAB when modal closes
        this.renderMobileFab();
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskCancel');
        }
    }

    async handleDeleteList() {
        if (!this.deletingListId) return;
        if (this.isAuthenticated) {
            try {
                await deleteListFromFirestore(this.deletingListId);
                this.lists = await loadListsFromFirestore();
                // --- 追加: 各リストのtasksを再構築 ---
                const user = firebase.auth().currentUser;
                if (user) {
                    const tasksSnap = await db.collection('tasks').where('uid', '==', user.uid).limit(200).get();
                    const allTasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    this.lists.forEach(list => {
                        list.tasks = allTasks.filter(t => t.listId === list.id);
                    });
                }
                // --- ここまで追加 ---
                this.renderListTabs();
                this.updateListTitle();
                if (this.comicEffects && this.comicEffects.playSound) {
                    this.comicEffects.playSound('taskAdd');
                }
                this.hideDeleteListModal();
                return;
            } catch (error) {
                console.error('Error deleting list:', error);
            }
        }
        // Fallback to local storage
        this.lists = this.lists.filter(l => l.id !== this.deletingListId);
        this.saveLists();
        this.renderListTabs();
        this.updateListTitle();
        if (this.comicEffects && this.comicEffects.playSound) {
            this.comicEffects.playSound('taskAdd');
        }
        this.hideDeleteListModal();
    }

    getCurrentList() {
        return this.lists.find(l => l.id === this.currentListId);
    }

    /** マイタスク／My Tasks は言語で表示が変わるだけで同一リスト。未ログイン時の default は Tutorial なので除外 */
    isMyTasksList(list) {
        if (!list) return false;
        if (list.name === 'Tutorial') return false;
        return list.id === 'default' || list.name === 'My Tasks' || list.name === 'マイタスク';
    }

    ensureDefaultList() {
        // デフォルトリストは id: 'default' で1つだけ。未ログイン時は「Tutorial」、ログイン時は「My Tasks」
        const hasDefaultById = this.lists.some(l => l.id === 'default');
        if (!hasDefaultById) {
            const name = this.isAuthenticated ? 'My Tasks' : 'Tutorial';
            const tasks = !this.isAuthenticated ? this.tutorialTasks.map(t => ({ ...t, listId: 'default' })) : [];
            this.lists.unshift({
                id: 'default',
                name,
                tasks,
                createdAt: new Date().toISOString()
            });
            this.currentListId = 'default';
            this.saveLists();
        } else {
            // 既に default がある場合は名前だけ認証状態に合わせる（二重に My Tasks を追加しない）
            const defaultList = this.lists.find(l => l.id === 'default');
            if (defaultList) {
                const targetName = this.isAuthenticated ? 'My Tasks' : 'Tutorial';
                if (defaultList.name !== targetName) {
                    defaultList.name = targetName;
                    this.saveLists();
                }
            }
        }

        // currentListIdが未設定または無効な場合はデフォルトリストを選択
        if (!this.currentListId || !this.lists.some(l => l.id === this.currentListId)) {
            const defaultList = this.lists.find(l => l.id === 'default');
            this.currentListId = defaultList ? defaultList.id : this.lists[0]?.id;
        }
    }

    // List title methods
    updateListTitle() {
        const titleElement = document.getElementById('listTitle');
        const menuButton = document.getElementById('listMenuBtn');
        const currentList = this.getCurrentList();
        if (titleElement && currentList) {
            const t = typeof window.t === 'function' ? window.t : (k) => k;
            titleElement.textContent = this.isMyTasksList(currentList) ? t('myTasks') : currentList.name;
            const isFixedEnglish = currentList.name === 'Tutorial' || currentList.id === 'smash-list' || currentList.name === '💥 Smash List';
            titleElement.toggleAttribute('data-fixed-english', isFixedEnglish);
        }

        // Hide menu button for Tutorial・マイタスク・Smash List（名前変更・削除メニューを出さない）
        if (menuButton) {
            const currentList = this.getCurrentList();
            const isTutorialOrMyTasks = currentList && (this.isMyTasksList(currentList) || currentList.name === 'Tutorial');
            const isSmashList = (this.currentListId === 'smash-list') || (currentList && currentList.name === '💥 Smash List');

            if (isTutorialOrMyTasks || isSmashList) {
                menuButton.style.display = 'none';
                menuButton.classList.add('hidden');
                menuButton.style.visibility = 'hidden';
                menuButton.style.opacity = '0';
            } else {
                menuButton.style.display = 'block';
                menuButton.classList.remove('hidden');
                menuButton.style.visibility = 'visible';
                menuButton.style.opacity = '1';

                // Re-add event listener for non-default lists
                this.setupListMenuButton();
            }
        }
    }

    // Setup list menu button event listener
    setupListMenuButton() {
        const menuButton = document.getElementById('listMenuBtn');
        if (menuButton) {
            // Remove existing event listener
            menuButton.removeEventListener('click', this.listMenuClickHandler);

            // Create new handler
            this.listMenuClickHandler = (e) => {
                e.stopPropagation();

                // Play sound feedback
                this.comicEffects.playSound('taskEdit');

                // Show context menu
                this.showListContextMenu(e, this.currentListId);
            };

            // Add event listener
            menuButton.addEventListener('click', this.listMenuClickHandler);
        }
    }

    // Data persistence
    saveLists() {
        try {
            // 認証されていない場合はローカルストレージに保存
            if (!this.isAuthenticated) {
                localStorage.setItem('google_tasks_lists', JSON.stringify({
                    lists: this.lists,
                    currentListId: this.currentListId,
                    listIdCounter: this.listIdCounter,
                    taskIdCounter: this.taskIdCounter
                }));
                return;
            }
            // 認証時はFirestore直接操作（add/update/delete）＋onSnapshotで同期。saveToServerによる全量書き戻しは行わない（競合防止）
        } catch (error) {
            console.error('[PixDone] Error saving lists:', error);
        }
    }

    async saveToServer() {
        if (!this.isAuthenticated) return;

        try {
            // リスト保存
            for (const list of this.lists) {
                if (!list.id) {
                    // 新規リスト
                    list.id = await addListToFirestore(list.name);
                } else {
                    await editListInFirestore(list.id, list.name);
                }
            }
            // タスク保存
            for (const list of this.lists) {
                for (const task of list.tasks) {
                    if (!task.id) {
                        // 新規タスク
                        const title = this.getTaskDisplayTitle(task);
                        await addTaskToFirestore(title, task.details, task.dueDate, task.repeat, list.id, task.subtasks || []);
                    } else if (typeof task.id === 'string') {
                        const title = this.getTaskDisplayTitle(task);
                        await db.collection('tasks').doc(task.id).set({ ...task, title, uid: firebase.auth().currentUser.uid, listId: list.id }, { merge: true });
                    }
                }
            }
        } catch (error) {
            console.error('Error saving to Firestore:', error);
        }
    }

    loadLists() {
        try {
            const authHint = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pixdone-auth-hint') : null;
            const data = localStorage.getItem('google_tasks_lists');
            if (data) {
                const parsed = JSON.parse(data);
                this.lists = parsed.lists || [];
                this.currentListId = parsed.currentListId || 'default';
                this.listIdCounter = parsed.listIdCounter || 1;
                this.taskIdCounter = parsed.taskIdCounter || 1;
            }

            // Create default list if no lists exist
            if (this.lists.length === 0) {
                const defaultTasks = [];
                const awaitingFirestore = authHint === 'logged_in';

                if (!awaitingFirestore && !this.isAuthenticated) {
                    defaultTasks.push(...this.tutorialTasks.map(task => ({ ...task })));
                }

                this.lists.push({
                    id: 'default',
                    name: (awaitingFirestore || this.isAuthenticated) ? 'My Tasks' : 'Tutorial',
                    tasks: defaultTasks,
                    createdAt: new Date().toISOString()
                });
                this.currentListId = 'default';
            } else {
                const awaitingFirestore = authHint === 'logged_in';
                if (!awaitingFirestore && !this.isAuthenticated) {
                    const defaultList = this.lists.find(list => list.id === 'default');
                    if (defaultList) {
                        // Check if tutorial tasks already exist (avoid duplicates)
                        const existingTutorialIds = defaultList.tasks.map(t => t.id);

                        this.tutorialTasks.forEach(tutorialTask => {
                            if (!existingTutorialIds.includes(tutorialTask.id)) {
                                const taskCopy = { ...tutorialTask };
                                taskCopy.listId = defaultList.id;
                                defaultList.tasks.push(taskCopy);
                            }
                        });
                    }
                }
            }

            // Ensure only one default list (id: 'default'); 重複を解消
            const defaultLists = this.lists.filter(list => list.id === 'default');
            if (defaultLists.length > 1) {
                const tutorialOne = defaultLists.find(l => l.name === 'Tutorial') || defaultLists[0];
                const mergedTasks = defaultLists.reduce((acc, l) => acc.concat(l.tasks || []), []);
                const seen = new Set();
                tutorialOne.tasks = mergedTasks.filter(t => {
                    const key = t.id;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                this.lists = this.lists.filter(list => list.id !== 'default');
                this.lists.unshift(tutorialOne);
                this.currentListId = 'default';
                this.saveLists();
            }

            // Ensure default list has correct name (未ログインは this.isAuthenticated のみで判定し、キャッシュの currentUser に左右されない)
            const defaultList = this.lists.find(list => list.id === 'default');
            if (defaultList) {
                const targetName = (authHint === 'logged_in' || this.isAuthenticated) ? 'My Tasks' : 'Tutorial';
                if (defaultList.name !== targetName && (this.isMyTasksList(defaultList) || defaultList.name === 'Tutorial')) {
                    defaultList.name = targetName;
                    this.saveLists();
                }
            }

            if (authHint !== 'logged_in' && !this.isAuthenticated) {
                const defaultIdx = this.lists.findIndex(l => l.id === 'default');
                if (defaultIdx > 0) {
                    const [def] = this.lists.splice(defaultIdx, 1);
                    this.lists.unshift(def);
                }
                this.currentListId = 'default';
                if (this.lists.some(l => l.id === 'default')) {
                    this.saveLists();
                }
            }

            // Ensure Smash List exists (only for unauthenticated users)
            // Authenticated users will get Smash List from Firebase
            if (!this.isAuthenticated && !this.lists.some(l => l.name === '💥 Smash List')) {
                const smashList = {
                    id: 'smash-list',
                    name: '💥 Smash List',
                    tasks: this.generateSmashTasks(),
                    createdAt: new Date().toISOString()
                };
                this.lists.push(smashList);
                this.saveLists();
            }

            // Ensure current list ID is valid
            const currentListExists = this.lists.some(list => list.id === this.currentListId);
            if (!currentListExists && this.lists.length > 0) {
                // 未ログイン時は必ず default を優先、それ以外は先頭を選択
                const defaultList = this.lists.find(l => l.id === 'default');
                this.currentListId = defaultList ? defaultList.id : this.lists[0].id;
                this.saveLists();
            }

            // Migrate old tasks data if exists
            this.migrateOldTasksData();
        } catch (error) {
            console.error('Error loading lists:', error);
        }
    }

    migrateOldTasksData() {
        try {
            const oldData = localStorage.getItem('google_tasks_data');
            if (oldData) {
                const parsed = JSON.parse(oldData);
                if (parsed.tasks && parsed.tasks.length > 0) {
                    const defaultList = this.lists.find(list => list.id === 'default');
                    if (defaultList && defaultList.tasks.length === 0) {
                        defaultList.tasks = parsed.tasks;
                        this.taskIdCounter = parsed.taskIdCounter || this.taskIdCounter;
                        this.saveLists();
                        localStorage.removeItem('google_tasks_data');
                    }
                }
            }

            // Migrate Japanese list names to English and update Smash List name
            let hasChanges = false;
            this.lists.forEach(list => {
                if (list.name === 'マイタスク') {
                    list.name = 'My Tasks';
                    hasChanges = true;
                }
                if (list.name === 'Smash List') {
                    list.name = '💥 Smash List';
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                this.saveLists();
            }

            // Ensure current list ID is still valid after migration
            const currentListExists = this.lists.some(list => list.id === this.currentListId);
            if (!currentListExists && this.lists.length > 0) {
                this.currentListId = this.lists[0].id;
                this.saveLists();
            }
        } catch (error) {
            console.error('Error migrating old tasks data:', error);
        }
    }

    // Update save method to use new structure
    saveTasks() {
        this.saveLists();
    }

    // Email Authentication Methods
    showEmailAuthModal() {
        document.getElementById('emailAuthModal').classList.add('active');
        // Hide FAB when modal opens
        const fab = document.getElementById('mobileFab');
        if (fab) {
            fab.style.display = 'none';
        }
        this.isEmailAuthRegistering = true; // デフォルトでサインアップモード
        this.updateEmailAuthModal();
        this.comicEffects.playSound('taskAdd');
    }

    hideEmailAuthModal() {
        document.getElementById('emailAuthModal').classList.remove('active');
        this.resetEmailAuthForm();
        // Show FAB when modal closes
        this.renderMobileFab();
        this.comicEffects.playSound('taskCancel');
    }

    toggleEmailAuthMode() {
        this.isEmailAuthRegistering = !this.isEmailAuthRegistering;
        this.updateEmailAuthModal();
        this.comicEffects.playSound('taskEdit');
    }

    updateEmailAuthModal() {
        const title = document.getElementById('emailAuthTitle');
        const submitBtn = document.getElementById('emailAuthSubmit');
        const toggleBtn = document.getElementById('toggleAuthMode');
        const authFooter = document.querySelector('.auth-footer span');
        const forgotPasswordSection = document.getElementById('forgotPasswordSection');
        const t = typeof window.t === 'function' ? window.t : (k) => k;

        const authModal = document.getElementById('emailAuthModal');
        const authForm = document.getElementById('emailAuthForm');
        if (this.isEmailAuthRegistering) {
            title.textContent = t('signUp');
            submitBtn.textContent = t('signUp');
            toggleBtn.textContent = t('logIn');
            authFooter.textContent = t('alreadyHaveAccount');
            forgotPasswordSection.style.display = 'none';
            authModal?.classList.add('signup-mode');
            authForm?.classList.add('signup-mode');
        } else {
            title.textContent = t('logIn');
            submitBtn.textContent = t('logIn');
            toggleBtn.textContent = t('signUp');
            authFooter.textContent = t('noAccount');
            forgotPasswordSection.style.display = 'block';
            authModal?.classList.remove('signup-mode');
            authForm?.classList.remove('signup-mode');
        }
    }

    togglePasswordVisibility(inputId = 'passwordInput', toggleId = 'passwordToggle') {
        const passwordInput = document.getElementById(inputId);
        const toggleBtn = document.getElementById(toggleId);

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = '👁';
        }
        this.comicEffects.playSound('taskEdit');
    }

    resetEmailAuthForm() {
        document.getElementById('emailInput').value = '';
        document.getElementById('passwordInput').value = '';
    }

    // Password reset methods
    showPasswordResetModal() {
        document.getElementById('emailAuthModal').classList.remove('active');
        const resetModal = document.getElementById('passwordResetModal');
        resetModal.style.display = 'flex';
        resetModal.classList.add('active');
        // FAB is already hidden by emailAuthModal, but ensure it stays hidden
        const fab = document.getElementById('mobileFab');
        if (fab) {
            fab.style.display = 'none';
        }
        this.comicEffects.playSound('taskAdd');
    }

    hidePasswordResetModal() {
        const resetModal = document.getElementById('passwordResetModal');
        resetModal.classList.remove('active');
        resetModal.style.display = 'none';
        document.getElementById('resetEmailInput').value = '';
        // Show FAB when modal closes (if no other modals are open)
        this.renderMobileFab();
        this.comicEffects.playSound('taskCancel');
    }

    async handlePasswordReset() {
        const email = document.getElementById('resetEmailInput').value.trim();

        if (!email) {
            alert('Please enter your email address');
            return;
        }

        try {
            const result = await window.firebaseAuth.resetPassword(email);

            if (result.success) {
                this.comicEffects.playSound('taskComplete');
                alert(result.message);
                this.hidePasswordResetModal();
                this.showEmailAuthModal();
            } else {
                this.comicEffects.playSound('taskCancel');
                alert(result.message);
            }
        } catch (error) {
            console.error('Password reset error:', error);
            this.comicEffects.playSound('taskCancel');
            alert('Failed to send reset email. Please try again.');
        }
    }

    // Password setup methods
    showPasswordSetupModal(token) {
        document.getElementById('passwordSetupModal').style.display = 'flex';
        this.verificationToken = token;
    }

    hidePasswordSetupModal() {
        document.getElementById('passwordSetupModal').style.display = 'none';
        document.getElementById('newPasswordInput').value = '';
        document.getElementById('confirmPasswordInput').value = '';
        this.verificationToken = null;
    }

    async handlePasswordSetup() {
        const password = document.getElementById('newPasswordInput').value;
        const confirmPassword = document.getElementById('confirmPasswordInput').value;

        if (!password || !confirmPassword) {
            alert('Please enter both passwords');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        try {
            const response = await fetch('/api/auth/set-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.verificationToken,
                    password: password
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Password setup completed! Please log in.');
                this.hidePasswordSetupModal();
                this.showEmailAuthModal();
                this.isEmailAuthRegistering = false;
                this.updateEmailAuthModal();
            } else {
                alert(result.message || 'Password setup failed');
            }
        } catch (error) {
            console.error('Password setup error:', error);
            alert('Error occurred during password setup');
        }
    }

    toggleUserDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        const isVisible = userDropdown.style.display === 'block';
        userDropdown.style.display = isVisible ? 'none' : 'block';
        if (isVisible && this.comicEffects?.playSound) this.comicEffects.playSound('taskCancel');
    }

    showDeleteAccountModal() {
        const modal = document.getElementById('deleteAccountModal');
        modal.style.display = 'flex';
    }

    hideDeleteAccountModal() {
        const modal = document.getElementById('deleteAccountModal');
        modal.style.display = 'none';
    }

    async deleteAccount() {
        try {
            const result = await window.firebaseAuth.deleteAccount();
            if (result.success) {
                this.hideDeleteAccountModal();
                alert('Account deleted successfully');
                window.location.reload();
            } else {
                alert(result.message || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Error deleting account');
        }
    }

    async logout() {
        try {
            // サーバーセッションがあれば終了（本番の静的ホストでは /api がないのでスキップされる）
            try {
                const res = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                if (!res.ok) {
                    console.warn('Server logout not available or failed (status:', res.status, '). Proceeding with Firebase signOut.');
                }
            } catch (e) {
                console.warn('Server logout request failed (e.g. no backend). Proceeding with Firebase signOut.');
            }
            // 常にFirebaseサインアウトを実行（本番でもログアウトできるようにする）
            const result = await window.firebaseAuth.logout();
            if (result.success) {
                this.comicEffects.playSound('taskComplete');
                this.user = null;
                this.isAuthenticated = false;
                window.location.reload();
            } else {
                this.comicEffects.playSound('taskCancel');
                alert('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.comicEffects.playSound('taskCancel');
            alert('Logout failed');
        }
    }

    async handleEmailAuth() {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;

        if (!email || !password) {
            this.comicEffects.playSound('taskCancel');
            alert('Please enter email and password');
            return;
        }

        try {
            let result;

            if (this.isEmailAuthRegistering) {
                // Use Firebase for registration
                result = await window.firebaseAuth.register(email, password);
            } else {
                // Use Firebase for login
                result = await window.firebaseAuth.login(email, password);
            }

            if (result.success) {
                this.comicEffects.playSound('taskComplete');
                if (this.isEmailAuthRegistering && result.needsVerification) {
                    alert(result.message);
                    this.hideEmailAuthModal();
                } else {
                    alert(result.message);
                    this.hideEmailAuthModal();
                    // --- MIGRATION LOGIC ---
                    await this.migrateLocalDataToServer();
                    window.location.reload();
                }
            } else {
                this.comicEffects.playSound('taskCancel');
                // Duplicate email error handling
                if (result.message && (result.message.includes('User already exists') || result.message.includes('already in use'))) {
                    alert('An account with this email already exists.');
                } else {
                    alert(result.message);
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.comicEffects.playSound('taskCancel');
            alert('Authentication error occurred');
        }
    }

    // Mobile FAB methods
    setupMobileFabListener() {
        const fab = document.getElementById('mobileFab');
        if (!fab) return;

        // Clone to replace existing listeners to ensure fresh state
        const newFab = fab.cloneNode(true);
        fab.parentNode.replaceChild(newFab, fab);

        let smashHoldTimer = null;
        let smashLongPressTriggered = false;
        const holdMs = (typeof window.PerfectTimingManager !== 'undefined' && window.PerfectTimingManager.config)
            ? window.PerfectTimingManager.config.holdThresholdMs : 350;

        const clearSmashHold = () => {
            if (smashHoldTimer) {
                clearTimeout(smashHoldTimer);
                smashHoldTimer = null;
            }
        };

        newFab.addEventListener('pointerdown', (e) => {
            if (this.isAnyModalOpen()) return;
            const currentList = this.getCurrentList();
            const isSmashList = currentList && (currentList.id === 'smash-list' || currentList.name === '💥 Smash List');
            if (!isSmashList) return;

            smashLongPressTriggered = false;
            clearSmashHold();
            const firstIncomplete = currentList?.tasks?.find(t => !t.completed);
            if (!firstIncomplete) return;

            smashHoldTimer = setTimeout(() => {
                smashHoldTimer = null;
                smashLongPressTriggered = true;
                const taskEl = document.querySelector(`.task-item[data-task-id="${firstIncomplete.id}"]`) ||
                    document.getElementById('taskList')?.querySelector('.task-item:not(.completed)');
                if (typeof window.PerfectTimingManager?.openForTask === 'function') {
                    window.PerfectTimingManager.openForTask(firstIncomplete.id, taskEl);
                    if (this.comicEffects?.playSound) this.comicEffects.playSound('buttonClick');
                } else {
                    this.toggleTaskCompletion(firstIncomplete.id);
                }
            }, holdMs);
        }, { passive: true });

        newFab.addEventListener('pointerup', (e) => {
            if (this.isAnyModalOpen()) return;
            const currentList = this.getCurrentList();
            const isSmashList = currentList && (currentList.id === 'smash-list' || currentList.name === '💥 Smash List');
            if (!isSmashList) return;

            if (smashHoldTimer) {
                clearSmashHold();
                if (!smashLongPressTriggered) {
                    const firstIncomplete = currentList?.tasks?.find(t => !t.completed);
                    if (firstIncomplete) this.toggleTaskCompletion(firstIncomplete.id);
                    else this.comicEffects?.playSound?.('taskCancel');
                }
            }
        }, { passive: true });

        newFab.addEventListener('pointerleave', () => {
            if (smashHoldTimer) clearSmashHold();
        }, { passive: true });

        newFab.addEventListener('pointercancel', () => {
            clearSmashHold();
        }, { passive: true });

        newFab.addEventListener('click', (e) => {
            e.stopPropagation();

            if (this.isAnyModalOpen()) return;

            const currentList = this.getCurrentList();
            const isSmashList = currentList && (currentList.id === 'smash-list' || currentList.name === '💥 Smash List');

            if (isSmashList) {
                e.preventDefault();
                return;
            }

            this.showTaskInput();
            this.comicEffects.playSound('taskAdd');
        });
    }

    // Check if any modal is currently open
    isAnyModalOpen() {
        const createListModal = document.getElementById('createListModal');
        const editListModal = document.getElementById('editListModal');
        const deleteListModal = document.getElementById('deleteListModal');
        const emailAuthModal = document.getElementById('emailAuthModal');
        const passwordResetModal = document.getElementById('passwordResetModal');
        const deleteModal = document.getElementById('deleteModal');
        const newMobileModal = document.getElementById('newMobileModal');
        
        return (createListModal && createListModal.classList.contains('active')) ||
               (editListModal && editListModal.classList.contains('active')) ||
               (deleteListModal && deleteListModal.classList.contains('active')) ||
               (emailAuthModal && emailAuthModal.classList.contains('active')) ||
               (passwordResetModal && passwordResetModal.classList.contains('active')) ||
               (deleteModal && deleteModal.classList.contains('active')) ||
               (newMobileModal && newMobileModal.classList.contains('open')) ||
               this.isMobileModalOpen;
    }

    renderMobileFab() {
        const fab = document.getElementById('mobileFab');
        if (!fab) return;

        // Don't show FAB if any modal is open
        if (this.isAnyModalOpen()) {
            fab.style.display = 'none';
            return;
        }

        const currentList = this.getCurrentList();
        const isSmashList = currentList && (currentList.id === 'smash-list' || (currentList.name && currentList.name.includes('Smash List')));

        // Remove inline display none if present (initial state)
        if (fab.style.display === 'none') {
            fab.style.display = 'flex';
        }

        // Reset content
        fab.innerHTML = '';
        fab.classList.remove('smash-mode');

        if (isSmashList) {
            fab.classList.add('smash-mode');
            // Use emoji matching the list title
            fab.innerHTML = '<span class="emoji-icon">💥</span>';
            fab.setAttribute('title', 'Smash Task');
            fab.style.display = 'flex';
        } else {
            // Use icon for regular Add Task
            fab.innerHTML = '<i class="fas fa-plus"></i>';
            fab.setAttribute('title', 'Add Task');
            fab.style.display = 'flex';
        }
    }

    renderMobileFab_OLD() {
        const fab = document.getElementById('mobileFab');
        if (!fab) return;

        const currentList = this.getCurrentList();
        const isSmashList = currentList && (currentList.id === 'smash-list' || currentList.name === '💥 Smash List');

        // Remove inline display none if present (initial state)
        if (fab.style.display === 'none') {
            fab.style.display = 'flex';
        }

        const icon = fab.querySelector('i');

        // Reset classes
        fab.classList.remove('smash-mode');

        if (isSmashList) {
            fab.classList.add('smash-mode');
            if (icon) icon.className = 'fas fa-gavel'; // Hammer icon for Smash
            fab.setAttribute('title', 'Smash Task');
            fab.style.display = 'flex';
        } else {
            if (icon) icon.className = 'fas fa-plus';
            fab.setAttribute('title', 'Add Task');
            fab.style.display = 'flex';
        }
    }

    // --- MIGRATION LOGIC ---
    async migrateLocalDataToServer() {
        if (!this.isAuthenticated) return;
        // Get local lists
        const local = localStorage.getItem('google_tasks_lists');
        if (!local) return;
        let localData;
        try {
            localData = JSON.parse(local);
        } catch (e) { return; }
        if (!localData.lists || localData.lists.length === 0) return;
        // Upload lists and tasks
        for (const list of localData.lists) {
            // Create list on Firestore
            let createdListId = null;
            try {
                createdListId = await addListToFirestore(list.name);
            } catch (e) { continue; }
            if (!createdListId || !list.tasks) continue;
            // Upload tasks for this list (preserve completed status)
            for (const task of list.tasks) {
                try {
                    const title = this.getTaskDisplayTitle ? this.getTaskDisplayTitle(task) : (task.title || '');
                    await addTaskToFirestore(title, task.details, task.dueDate, task.repeat, createdListId, task.subtasks || [], task.completed);
                } catch (e) { continue; }
            }
        }
        // Remove local data after migration
        localStorage.removeItem('google_tasks_lists');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pixDoneApp = new PixDoneApp();

    // Initialize task animation effects
    if (typeof TaskAnimationEffects !== 'undefined') {
        window.taskAnimationEffects = new TaskAnimationEffects();
    }
    
    // Idle rare effect is initialized in idleRareEffect.js
});

// サーバーにIDトークンを送ってセッション確立
async function establishSession(user) {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken })
    });
    if (!res.ok) throw new Error('サーバーセッション確立失敗');
}

// PixDoneのログイン/新規登録UIイベントで↓を呼ぶようにする
async function handleLogin(email, password) {
    const userCred = await auth.signInWithEmailAndPassword(email, password);
    await establishSession(userCred.user);
    // 以降はPixDoneのUI更新ロジックを呼ぶ
}
async function handleRegister(email, password) {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    await establishSession(userCred.user);
    // 以降はPixDoneのUI更新ロジックを呼ぶ
}

// タスク取得・追加・削除などはfetch＋credentials: 'include'でAPIを叩く
// 例: タスク取得
async function fetchTasks() {
    const res = await fetch('/api/tasks', { credentials: 'include' });
    if (!res.ok) throw new Error('タスク取得失敗');
    return await res.json();
}
// 例: タスク追加
async function addTask(title) {
    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title })
    });
    if (!res.ok) throw new Error('タスク追加失敗');
    return await res.json();
}

// ログアウト時はサーバー→Firebase signOut
async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    await auth.signOut();
    // 以降はPixDoneのUI更新ロジックを呼ぶ
}

// PixDoneのUIイベントハンドラで上記関数を使うように修正
// ... 既存のUI/UX・描画ロジックはそのまま ...

// 1. すべてのfetch('/api/lists'), fetch('/api/tasks')などサーバーAPI呼び出しを削除
// 2. FirestoreのJS APIでタスク管理するロジックに置換
// 3. UI/UXやイベントハンドラはPixDoneのまま維持
// 4. 認証はFirebase Authのまま
// 5. 例: タスク取得
async function loadTasksFromFirestore() {
    const user = firebase.auth().currentUser;
    if (!user) return [];
    const snap = await db.collection('tasks').where('uid', '==', user.uid).orderBy('createdAt', 'desc').limit(200).get();
    return snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(task => typeof task.id !== 'undefined');
}
// 例: タスク追加（UUID固定IDでsetDoc、IDを返す）
async function addTaskToFirestore(title, details = '', dueDate = null, repeat = 'none', listId, subtasks = [], completed = false) {
    const user = firebase.auth().currentUser;
    if (!user || !listId) return null;
    const taskId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    const docRef = db.collection('tasks').doc(taskId);
    await docRef.set({
        uid: user.uid,
        listId,
        title,
        details: details || '',
        dueDate: dueDate || null,
        repeat: repeat || 'none',
        subtasks: subtasks || [],
        completed: !!completed,
        order: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return taskId;
}

// タスク編集（updateDocで既存IDを維持）
async function updateTaskInFirestore(taskId, fields) {
    const user = firebase.auth().currentUser;
    if (!user || !taskId) return;
    const docRef = db.collection('tasks').doc(taskId);
    const doc = await docRef.get();
    if (doc.exists) {
        await docRef.update({ ...fields, uid: user.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    } else {
        console.warn('[PixDone] No such task to update:', taskId);
    }
}
// 例: タスク削除
async function deleteTaskFromFirestore(taskId) {
    await db.collection('tasks').doc(taskId).delete();
}
// 例: タスク完了トグル
async function toggleTaskCompletionFirestore(taskId, completed) {
    const docRef = db.collection('tasks').doc(taskId);
    const doc = await docRef.get();
    if (doc.exists) {
        await docRef.update({ completed });
    } else {
        // ドキュメントがなければ何もしない（またはエラー処理）
        console.warn('No such task to update:', taskId);
    }
}
// 以降、UIイベントでこれらのFirestore関数を使うように修正
// ... 既存のUI/UX・描画ロジックはそのまま ...

// 1. Firestoreリスト管理用関数を追加
async function loadListsFromFirestore() {
    const user = firebase.auth().currentUser;
    if (!user) return [];
    const snap = await db.collection('lists').where('uid', '==', user.uid).orderBy('createdAt', 'asc').get();
    return snap.docs
        .map(doc => ({ id: doc.id, ...doc.data(), tasks: [] }))
        .filter(list => typeof list.id !== 'undefined');
}
async function addListToFirestore(name) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const docRef = await db.collection('lists').add({
        uid: user.uid,
        name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        tasks: []
    });

    // Smash Listの場合は初期タスクを追加（現在の言語のダミータスクからランダムに10件）
    if (name === '💥 Smash List') {
        const pool = (typeof window.pixDoneApp !== 'undefined' && window.pixDoneApp.getSmashListTasks)
            ? window.pixDoneApp.getSmashListTasks()
            : ['Fix the coffee machine', 'Buy milk and bread', 'Call mom', 'Clean the garage', 'Organize email inbox', 'Fix the leaky faucet', 'Plan weekend trip', 'Read 30 pages of a book', 'Go for a 30-minute walk', 'Backup computer files'];
        const titles = [];
        for (let i = 0; i < 10; i++) {
            titles.push(pool[Math.floor(Math.random() * pool.length)]);
        }
        const smashTasks = titles.map(title => ({ title, completed: false }));

        const batch = db.batch();
        smashTasks.forEach(task => {
            const taskRef = db.collection('tasks').doc();
            batch.set(taskRef, {
                ...task,
                listId: docRef.id,
                uid: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
    }

    return docRef.id;
}
async function editListInFirestore(listId, name) {
    const docRef = db.collection('lists').doc(listId);
    const doc = await docRef.get();
    if (doc.exists) {
        await docRef.update({ name });
    } else {
        await docRef.set({ name }); // 必要なら他のフィールドもセット
    }
}
async function deleteListFromFirestore(listId) {
    await db.collection('lists').doc(listId).delete();
    // そのリストのtasksも削除（listIdが厳密一致するものだけ）
    const snap = await db.collection('tasks').where('listId', '==', String(listId)).limit(200).get();
    const batch = db.batch();
    snap.forEach(doc => {
        const data = doc.data();
        // listIdがundefined/nullのタスクは絶対に消さない
        if (data.listId === String(listId)) {
            batch.delete(doc.ref);
        }
    });
    await batch.commit();
}

/**
 * Firestoreのtasksコレクションをリアルタイム監視し、UIに即時反映する
 * @param {string} listId - 現在のリストID
 * @param {function} onUpdate - タスク配列を受け取るコールバック
 */
function listenTasksFromFirestore(listId, onUpdate) {
    const user = firebase.auth().currentUser;
    if (!user || !listId) return () => { };
    return db.collection('tasks')
        .where('uid', '==', user.uid)
        .where('listId', '==', listId)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .onSnapshot(
            snap => {
                const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort by order field so drag-to-reorder persists; tasks without order keep index order; same order → newest first
                const withOrder = tasks.map((t, i) => ({ ...t, _order: typeof t.order === 'number' ? t.order : i }));
                withOrder.sort((a, b) => {
                    if (a._order !== b._order) return a._order - b._order;
                    const ca = a.createdAt?.toMillis?.() ?? 0;
                    const cb = b.createdAt?.toMillis?.() ?? 0;
                    return cb - ca;
                });
                const sorted = withOrder.map(({ _order, ...t }) => t);
                onUpdate(sorted);
            },
            err => { console.error('[PixDone] Firestore snapshot error (tasks):', err); }
        );
}

/**
 * Firestoreのtasksコレクションを全リスト横断でリアルタイム監視（主にタブ件数用）
 * @param {function} onUpdate - タスク配列を受け取るコールバック
 */
function listenAllTasksFromFirestore(onUpdate) {
    const user = firebase.auth().currentUser;
    if (!user) return () => { };
    return db.collection('tasks')
        .where('uid', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(500)
        .onSnapshot(
            snap => {
                const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                onUpdate(tasks);
            },
            err => { console.error('[PixDone] Firestore snapshot error (tasks all):', err); }
        );
}

/**
 * Firestoreのlistsコレクションをリアルタイム監視し、UIに即時反映する
 * @param {function} onUpdate - リスト配列を受け取るコールバック
 */
function listenListsFromFirestore(onUpdate) {
    const user = firebase.auth().currentUser;
    if (!user) return () => { };
    return db.collection('lists')
        .where('uid', '==', user.uid)
        .orderBy('createdAt', 'asc')
        .limit(20)
        .onSnapshot(
            snap => {
                const lists = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), tasks: [] }));
                onUpdate(lists);
            },
            err => { console.error('[PixDone] Firestore snapshot error (lists):', err); }
        );
}

// Add Task Button
const addTaskBtn = document.getElementById('addTaskBtn');
if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
        this.currentTask = null;
        this.showMobileModal();
    });
}