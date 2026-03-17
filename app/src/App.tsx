import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ThemeProvider, Button, Chip, ModalDialog, BottomSheet } from './design-system';
import {
  ListHeader, ListTabs, TaskItem, SmashListPanel, TutorialPanel, ThemeSelector,
  TaskForm, ListModal, AuthModal, BottomNav, FocusScreen,
} from './components';
import type { ListModalMode, ActiveScreen } from './components';
import { useLists } from './features/useLists';
import { SMASH_TITLES } from './features/useLists';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { useMidnightRefresh } from './hooks/useMidnightRefresh';
import { playSound, getSoundEnabled, setSoundMuted } from './services/sound';
import { initSoundEngine } from './services/soundEngine';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { runVanillaCompletionEffect } from './services/taskAnimations';
import { t } from './lib/i18n';
import './styles/task-animations.css';
import type { List } from './types/list';
import type { Task } from './types/task';

function AppContent() {
  const {
    lists, activeListId, setActiveList, currentList,
    addList, renameList, deleteList,
    addTask, updateTask, deleteTask, completeTask, uncompleteTask,
  } = useLists();

  const { user, logout } = useAuth();

  const [lang, setLang] = useState<'en' | 'ja'>(() => {
    try { return (localStorage.getItem('pixdone-lang') as 'en' | 'ja') ?? 'en'; } catch { return 'en'; }
  });

  const changeLang = useCallback((l: 'en' | 'ja') => {
    setLang(l);
    try { localStorage.setItem('pixdone-lang', l); } catch { /* ignore */ }
  }, []);

  // UI state
  const [signupOpen, setSignupOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Desktop: null = closed, 'add' = new task, task.id = editing
  const [taskFormMode, setTaskFormMode] = useState<null | 'add' | string>(null);
  // Mobile: BottomSheet open for task add/edit
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileEditTaskId, setMobileEditTaskId] = useState<string | null>(null);

  // Completed section
  const [completedExpanded, setCompletedExpanded] = useState(false);

  // List modal state
  const [listModal, setListModal] = useState<{ mode: ListModalMode; listId?: string } | null>(null);

  // Delete task confirmation
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<string | null>(null); // taskId

  /* ---- Screen navigation ---- */
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('tasks');

  /* ---- Sound state (vanilla parity: pixdone-sound-enabled, ComicEffectsManager when loaded) ---- */
  const [soundMuted, setSoundMuted] = useState(() => !getSoundEnabled());

  /* ---- Init sound engine (fallback when vanilla not loaded) ---- */
  useEffect(() => {
    initSoundEngine();
    setSoundMuted(!getSoundEnabled());
  }, []);

  /* ---- Sync document language for font rules ([lang=\"ja\"] selectors) ---- */
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  /* ---- User menu click-outside ---- */
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  /* ---- Midnight refresh ---- */
  useMidnightRefresh();

  /* ---- 未ログイン時: default リスト名を 'Tutorial' に正規化 ---- */
  useEffect(() => {
    if (user) return;
    const defaultList = lists.find((l) => l.id === 'default');
    if (defaultList && defaultList.name !== 'Tutorial') {
      renameList('default', 'Tutorial');
    }
  }, [user, lists, renameList]);

  /* ---- ログイン時: default リスト名を 'My Tasks' に切り替え ---- */
  useEffect(() => {
    if (!user) return;
    const defaultList = lists.find((l) => l.id === 'default');
    if (defaultList && defaultList.name !== 'My Tasks') {
      renameList('default', 'My Tasks');
    }
  }, [user, lists, renameList]);

  /* ---- Derived ---- */
  const isSmash = currentList?.id === 'smash-list' || currentList?.name === '💥 Smash List';
  const isTutorial = currentList?.id === 'default';

  const allTasks = currentList?.tasks ?? [];
  const activeTasks = allTasks.filter((t) => !t.completed);
  const completedTasks = allTasks.filter((t) => t.completed);

  const editingTask =
    typeof taskFormMode === 'string' && taskFormMode !== 'add'
      ? allTasks.find((t) => t.id === taskFormMode) ?? null
      : mobileEditTaskId
      ? allTasks.find((t) => t.id === mobileEditTaskId) ?? null
      : null;

  /* ---- タブ表示順: スマッシュリストを常に一番左 ---- */
  const listTabsOrder = useMemo(() => {
    const smash = lists.find((l) => l.id === 'smash-list' || l.name === '💥 Smash List');
    const rest = lists.filter((l) => l !== smash);
    return smash ? [smash, ...rest] : lists;
  }, [lists]);

  /* ---- Keyboard nav ---- */
  useKeyboardNav({
    lists: listTabsOrder,
    activeListId,
    onSelect: (id) => { setActiveList(id); setTaskFormMode(null); },
    onSound: () => playSound('buttonClick'),
  });

  /* ---- Tab labels: 未ログイン時は「チュートリアル」、ログイン時は「マイタスク」 ---- */
  const getTabLabel = (list: List) => {
    if (list.id === 'smash-list' || list.name === '💥 Smash List') return '💥';
    if (list.id === 'default') {
      return user ? t('myTasks', lang) : t('tutorial', lang);
    }
    return list.name;
  };

  const getTabCount = (list: List) => list.tasks.filter((t) => !t.completed).length;

  /* ---- Task handlers ---- */
  const handleComplete = useCallback((taskId: string) => {
    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement | null;
    const isMobile = window.innerWidth <= 480;

    const doComplete = () => {
      completeTask(taskId);
      setTaskFormMode(null);
      setMobileSheetOpen(false);
    };

    if (taskEl && !isMobile) {
      runVanillaCompletionEffect(taskEl, () => {
        doComplete();
        // Vanilla ComicEffectsManager plays its own effect sound; no playSound('taskComplete') here
      });
    } else {
      doComplete();
      playSound('taskComplete');
    }
  }, [completeTask]);

  const handleUncomplete = useCallback((taskId: string) => {
    uncompleteTask(taskId);
  }, [uncompleteTask]);

  const handleEdit = useCallback((taskId: string) => {
    // Mobile: open BottomSheet for editing
    if (window.innerWidth <= 768) {
      setMobileEditTaskId(taskId);
      setMobileSheetOpen(true);
    } else {
      setTaskFormMode(taskId);
    }
    playSound('taskEdit');
  }, []);

  const doDelete = useCallback((taskId: string) => {
    deleteTask(taskId);
    playSound('taskDelete');
    setTaskFormMode(null);
    setMobileSheetOpen(false);
    setMobileEditTaskId(null);
    setDeleteTaskConfirm(null);
  }, [deleteTask]);

  const handleDelete = useCallback((taskId: string) => {
    playSound('buttonClick');
    setDeleteTaskConfirm(taskId);
  }, []);

  const handleSmash = useCallback((taskId: string) => {
    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement | null;
    const isMobile = window.innerWidth <= 480;

    const doSmash = () => {
      completeTask(taskId);
    };

    if (taskEl && !isMobile) {
      runVanillaCompletionEffect(taskEl, () => {
        doSmash();
        // Vanilla ComicEffectsManager plays its own effect sound
      });
    } else {
      doSmash();
      playSound('taskComplete');
    }
  }, [completeTask]);

  const handleTaskFormSave = useCallback((fields: Partial<Task> & { title: string }) => {
    const editId = taskFormMode !== 'add' && taskFormMode ? taskFormMode : mobileEditTaskId;
    if (taskFormMode === 'add' || (mobileSheetOpen && !mobileEditTaskId)) {
      addTask(currentList!.id, fields);
      playSound('taskAdd');
    } else if (editId) {
      updateTask(editId, fields);
      playSound('taskAdd');
    }
    setTaskFormMode(null);
    setMobileSheetOpen(false);
    setMobileEditTaskId(null);
  }, [taskFormMode, mobileSheetOpen, mobileEditTaskId, currentList, addTask, updateTask]);

  const handleTaskFormCancel = useCallback(() => {
    playSound('taskCancel');
    setTaskFormMode(null);
    setMobileSheetOpen(false);
    setMobileEditTaskId(null);
  }, []);

  const openAddTask = useCallback(() => {
    // Smash List: FAB acts as a quick smash (same as Space key)
    if (isSmash) {
      const first = (currentList?.tasks ?? []).find((t) => !t.completed);
      if (first) {
        handleSmash(first.id);
      }
      return;
    }
    // Other lists: open task add UI
    playSound('buttonClick');
    if (window.innerWidth <= 768) {
      setMobileEditTaskId(null);
      setMobileSheetOpen(true);
    } else {
      setTaskFormMode('add');
    }
  }, [isSmash, currentList, handleSmash]);

  /* ---- Sound toggle (vanilla: sync ComicEffectsManager.setSoundEnabled so effect sounds match) ---- */
  const toggleSound = () => {
    const next = !soundMuted;
    const w = window as unknown as {
      taskAnimationEffects?: { comicEffects?: { setSoundEnabled: (enabled: boolean) => void } };
    };
    if (w.taskAnimationEffects?.comicEffects?.setSoundEnabled) {
      w.taskAnimationEffects.comicEffects.setSoundEnabled(!next);
    } else {
      try { localStorage.setItem('pixdone-sound-enabled', next ? 'false' : 'true'); } catch { /* ignore */ }
    }
    setSoundMuted(next);
    if (!next) playSound('buttonClick');
  };

  /* ---- List modal handlers ---- */
  const handleListModalConfirm = useCallback((name?: string) => {
    if (!listModal) return;
    if (listModal.mode === 'add') {
      playSound('taskAdd');
      addList(name ?? 'New list');
    } else if (listModal.mode === 'rename' && listModal.listId) {
      playSound('taskEdit');
      renameList(listModal.listId, name ?? '');
    } else if (listModal.mode === 'delete' && listModal.listId) {
      playSound('taskDelete');
      deleteList(listModal.listId, lists);
    }
    setListModal(null);
  }, [listModal, addList, renameList, deleteList, lists]);

  const anyModalOpen = signupOpen || themeModalOpen || listModal !== null || mobileSheetOpen || deleteTaskConfirm !== null;
  const isFocusScreen = activeScreen === 'focus';

  /* ---- Render ---- */
  return (
    <div className="pd-app-container" style={{ paddingBottom: '80px' }}>
      {/* Focus screen overlay */}
      {isFocusScreen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          bottom: 'calc(56px + env(safe-area-inset-bottom))',
          overflowY: 'auto',
          background: 'var(--pd-color-background-default)',
          zIndex: 100,
        }}>
          <FocusScreen
            lists={lists}
            lang={lang}
            onCompleteTask={handleComplete}
          />
        </div>
      )}

      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          gap: 'var(--pd-layout-header-gap, 16px)',
          marginBottom: 'var(--pd-layout-header-marginBottom, 24px)',
          paddingTop: 'var(--pd-layout-header-paddingVertical, 16px)',
          paddingBottom: 'var(--pd-layout-header-paddingVertical, 16px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="pd-app-title">PixDone</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Theme button */}
            <button
              type="button"
              title={user ? (lang === 'ja' ? 'テーマを変更' : 'Change theme') : (lang === 'ja' ? 'サインアップしてテーマ変更' : 'Sign up to change theme')}
              onClick={() => {
                playSound('buttonClick');
                if (!user) {
                  setSignupOpen(true);
                } else {
                  setThemeModalOpen(true);
                }
              }}
              style={{
                background: 'var(--pd-color-background-elevated)',
                border: '2px solid var(--pd-color-border-default)',
                color: 'var(--pd-color-text-secondary)',
                fontFamily: 'var(--pd-font-brand)',
                fontSize: '1rem',
                padding: '4px 8px',
                cursor: 'pointer',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="material-icons" style={{ fontSize: '20px', lineHeight: 1 }}>palette</span>
            </button>

            {user ? (
              /* Logged-in: person avatar + dropdown */
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => { playSound('buttonClick'); setUserMenuOpen((v) => !v); }}
                  title={user.email ?? 'Account'}
                  style={{
                    background: 'var(--pd-color-background-elevated)',
                    border: '2px solid var(--pd-color-border-default)',
                    color: 'var(--pd-color-text-secondary)',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    lineHeight: 1,
                    fontFamily: 'var(--pd-font-brand)',
                    fontSize: '1rem',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '20px', lineHeight: 1 }}>person</span>
                </button>
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    zIndex: 300,
                    background: 'var(--pd-color-background-elevated)',
                    border: '2px solid var(--pd-color-border-default)',
                    boxShadow: '3px 3px 0 var(--pd-color-shadow-default)',
                    minWidth: '200px',
                  }}>
                    {/* Email */}
                    <div style={{
                      padding: '10px 14px',
                      fontSize: '0.75rem',
                      color: 'var(--pd-color-text-secondary)',
                      fontFamily: 'var(--pd-font-body)',
                      borderBottom: '1px solid var(--pd-color-border-default)',
                      wordBreak: 'break-all',
                    }}>
                      {user.email}
                    </div>
                    {/* Divider */}
                    <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--pd-color-border-default)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Chip selected={lang === 'en'} onClick={() => { changeLang('en'); playSound('buttonClick'); }}>En</Chip>
                      <Chip selected={lang === 'ja'} onClick={() => { changeLang('ja'); playSound('buttonClick'); }}>Ja</Chip>
                    </div>
                    {/* Sound toggle */}
                    <button
                      type="button"
                      onClick={toggleSound}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        width: '100%', textAlign: 'left',
                        padding: '10px 14px', background: 'none',
                        border: 'none', borderBottom: '1px solid var(--pd-color-border-default)',
                        color: 'var(--pd-color-text-primary)',
                        fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem', cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pd-color-background-hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                    >
                      <span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>
                        {soundMuted ? 'volume_off' : 'volume_up'}
                      </span>
                      {soundMuted ? (lang === 'ja' ? 'サウンドオフ' : 'Sound off') : (lang === 'ja' ? 'サウンドオン' : 'Sound on')}
                    </button>
                    {/* Support PixDone */}
                    <button
                      type="button"
                      onClick={() => {
                        playSound('buttonClick');
                        window.open('https://www.buymeacoffee.com/pixdone', '_blank', 'noopener,noreferrer');
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        width: '100%', textAlign: 'left',
                        padding: '10px 14px', background: 'none',
                        border: 'none', borderBottom: '1px solid var(--pd-color-border-default)',
                        color: 'var(--pd-color-text-primary)',
                        fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem', cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pd-color-background-hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                    >
                      <span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>favorite</span>
                      {lang === 'ja' ? 'Support PixDone' : 'Support PixDone'}
                    </button>
                    {/* Log out */}
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); playSound('taskComplete'); logout(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        width: '100%', textAlign: 'left',
                        padding: '10px 14px', background: 'none',
                        border: 'none', borderBottom: '1px solid var(--pd-color-border-default)',
                        color: 'var(--pd-color-text-primary)',
                        fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem', cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pd-color-background-hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                    >
                      <span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>logout</span>
                      {lang === 'ja' ? 'ログアウト' : 'Log out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged-in: lang chips + sign up */
              <>
                <Chip selected={lang === 'en'} onClick={() => { changeLang('en'); playSound('buttonClick'); }}>En</Chip>
                <Chip selected={lang === 'ja'} onClick={() => { changeLang('ja'); playSound('buttonClick'); }}>Ja</Chip>
                <Button variant="signup" onClick={() => { playSound('buttonClick'); setSignupOpen(true); }}>Sign up</Button>
              </>
            )}
          </div>
        </div>
        <ListTabs
          lists={listTabsOrder}
          activeListId={activeListId}
          onSelect={(id) => { setActiveList(id); setTaskFormMode(null); playSound('buttonClick'); }}
          onAddList={() => { playSound('buttonClick'); setListModal({ mode: 'add' }); }}
          getTabLabel={getTabLabel}
          getTabCount={getTabCount}
        />
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ListHeader
          title={isTutorial ? t('tutorial', lang) : (currentList?.id === 'default' ? t('myTasks', lang) : (currentList?.name ?? ''))}
          showMenu={!isTutorial && !isSmash}
          lang={lang}
          onRename={() => setListModal({ mode: 'rename', listId: currentList?.id })}
          onDelete={() => setListModal({ mode: 'delete', listId: currentList?.id })}
        />

        {/* Add task button (desktop only) / inline form */}
        {!isSmash && !isTutorial && (
          <div style={{ paddingBottom: '8px' }} className="pd-add-task-section">
            {taskFormMode === 'add' ? (
              <TaskForm
                lang={lang}
                listId={currentList?.id ?? ''}
                onSave={handleTaskFormSave}
                onCancel={handleTaskFormCancel}
              />
            ) : (
              <button
                type="button"
                onClick={openAddTask}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  background: 'var(--pd-color-background-elevated)',
                  border: '2px solid var(--pd-color-border-default)',
                  borderRadius: 0,
                  color: 'var(--pd-color-text-secondary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  padding: '12px 16px',
                  textAlign: 'left',
                  boxShadow: '2px 2px 0px var(--pd-color-shadow-default)',
                  imageRendering: 'pixelated',
                  fontFamily: 'var(--pd-font-body)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'var(--pd-color-background-hover)';
                  el.style.color = 'var(--pd-color-text-primary)';
                  el.style.borderColor = 'var(--pd-color-accent-default)';
                  el.style.transform = 'translate(-1px, -1px)';
                  el.style.boxShadow = '3px 3px 0px var(--pd-color-shadow-default)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'var(--pd-color-background-elevated)';
                  el.style.color = 'var(--pd-color-text-secondary)';
                  el.style.borderColor = 'var(--pd-color-border-default)';
                  el.style.transform = '';
                  el.style.boxShadow = '2px 2px 0px var(--pd-color-shadow-default)';
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>add</span>
                {lang === 'ja' ? 'タスクを追加' : 'Add a task'}
              </button>
            )}
          </div>
        )}

        <div key={activeListId} className="pd-list-enter" style={{ flex: 1, overflowY: 'auto' }}>
          {isSmash ? (
            <SmashListPanel
              subtitle={t('smashListSubtitle', lang)}
              hint={t('smashListHint', lang)}
              tasks={currentList?.tasks ?? []}
              onSmash={handleSmash}
              getDisplayTitle={(task: Task) => {
                if (typeof task.smashIdx === 'number') {
                  return SMASH_TITLES[lang][task.smashIdx] ?? task.title;
                }
                return task.title;
              }}
            />
          ) : !user && isTutorial && activeTasks.length === 0 ? (
            <div>
              <TutorialPanel
                headline={"You've completed the tutorial!"}
                subtext={
                  lang === 'ja'
                    ? 'サインアップしてタスクを保存し、端末間で同期＆テーマ変更を楽しもう。'
                    : 'Sign up to save your own tasks, sync across devices, and unlock theme customization.'
                }
                buttonLabel={lang === 'ja' ? 'サインアップ' : 'Sign up'}
                onSignUp={() => setSignupOpen(true)}
              />
              {completedTasks.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => { playSound('buttonClick'); setCompletedExpanded((v) => !v); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '8px 4px',
                      color: 'var(--pd-color-text-secondary)',
                      fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      fontSize: '0.625rem', transition: 'transform 0.2s',
                      transform: completedExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      display: 'inline-block',
                    }}>▶</span>
                    {lang === 'ja' ? `完了済み (${completedTasks.length})` : `Completed (${completedTasks.length})`}
                  </button>
                  {completedExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.75 }}>
                      {completedTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          lang={lang}
                          onComplete={handleUncomplete}
                          onEdit={() => {}}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : allTasks.length === 0 ? (
            /* AC 14.1: No tasks at all – "READY?" (vanilla parity: game-start-empty) */
            <div className="game-start-empty">
              <div className="game-start-content">
                <div className="ready-text">{t('emptyReady', lang)}</div>
                <div className="start-instruction">{t('emptyReadySub', lang)}</div>
              </div>
            </div>
          ) : activeTasks.length === 0 && completedTasks.length > 0 ? (
            /* AC 14.2: All done – sleeping pixel character (vanilla parity: empty-state) */
            <div className="empty-state">
              <div className="empty-illustration">
                <div className="pixel-character">
                  <div className="sleep-bubble">
                    <div className="bubble-text">zzz...</div>
                  </div>
                </div>
              </div>
              <p>{t('emptyRest', lang)}</p>
              <p style={{ marginBottom: '24px' }}>{t('emptyRestSub', lang)}</p>
              {/* Still show completed tasks collapsed */}
              <div style={{ textAlign: 'left' }}>
                <button
                  type="button"
                  onClick={() => { playSound('buttonClick'); setCompletedExpanded((v) => !v); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', background: 'none', border: 'none',
                    cursor: 'pointer', padding: '8px 4px',
                    color: 'var(--pd-color-text-secondary)',
                    fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '0.625rem', transition: 'transform 0.2s', transform: completedExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
                  {lang === 'ja' ? `完了済み (${completedTasks.length})` : `Completed (${completedTasks.length})`}
                </button>
                {completedExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.75 }}>
                    {completedTasks.map((task) => (
                      <TaskItem key={task.id} task={task} lang={lang} onComplete={handleUncomplete} onEdit={() => {}} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Active tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeTasks.map((task) => (
                  <div key={task.id}>
                    {taskFormMode === task.id && editingTask ? (
                      <TaskForm
                        lang={lang}
                        listId={currentList?.id ?? ''}
                        task={editingTask}
                        onSave={handleTaskFormSave}
                        onCancel={handleTaskFormCancel}
                        onDelete={() => handleDelete(task.id)}
                      />
                    ) : (
                      <TaskItem
                        task={task}
                        lang={lang}
                        onComplete={handleComplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Completed tasks section */}
              {completedTasks.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => { playSound('buttonClick'); setCompletedExpanded((v) => !v); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '8px 4px',
                      color: 'var(--pd-color-text-secondary)',
                      fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      fontSize: '0.625rem', transition: 'transform 0.2s',
                      transform: completedExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      display: 'inline-block',
                    }}>▶</span>
                    {lang === 'ja' ? `完了済み (${completedTasks.length})` : `Completed (${completedTasks.length})`}
                  </button>
                  {completedExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.75 }}>
                      {completedTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          lang={lang}
                          onComplete={handleUncomplete}
                          onEdit={() => {}}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile FAB */}
      {!anyModalOpen && !isFocusScreen && (
        <button
          type="button"
          onClick={openAddTask}
          aria-label={lang === 'ja' ? 'タスクを追加' : 'Add a task'}
          className={isSmash ? 'pd-mobile-fab pd-mobile-fab--smash' : 'pd-mobile-fab'}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: isSmash ? 'white' : 'var(--accent-color)',
            color: isSmash ? 'var(--pxd-color-brand-smash)' : 'white',
            border: 'none',
            display: 'none', // shown via CSS media query
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            cursor: 'pointer',
            zIndex: 1000,
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {isSmash
            ? <span aria-hidden="true">💥</span>
            : <span className="material-icons" aria-hidden="true" style={{ fontSize: '24px', lineHeight: 1 }}>add</span>
          }
        </button>
      )}

      {/* Mobile BottomSheet for task add/edit */}
      <BottomSheet
        open={mobileSheetOpen}
        onClose={handleTaskFormCancel}
        title={mobileEditTaskId
          ? (lang === 'ja' ? 'タスクを編集' : 'Edit task')
          : (lang === 'ja' ? 'タスクを追加' : 'Add a task')}
      >
        <TaskForm
          lang={lang}
          listId={currentList?.id ?? ''}
          task={mobileEditTaskId ? editingTask ?? undefined : undefined}
          onSave={handleTaskFormSave}
          onCancel={handleTaskFormCancel}
          onDelete={mobileEditTaskId ? () => handleDelete(mobileEditTaskId) : undefined}
        />
      </BottomSheet>

      {/* List modal */}
      <ListModal
        open={listModal !== null}
        mode={listModal?.mode ?? 'add'}
        initialName={
          listModal?.mode === 'rename' && listModal.listId
            ? lists.find((l) => l.id === listModal.listId)?.name ?? ''
            : ''
        }
        lang={lang}
        onConfirm={handleListModalConfirm}
        onClose={() => { playSound('taskCancel'); setListModal(null); }}
      />

      {/* Theme modal */}
      <ModalDialog
        open={themeModalOpen}
        onClose={() => { playSound('taskCancel'); setThemeModalOpen(false); }}
        title="Theme"
        actions={
          <Button variant="secondary" onClick={() => { playSound('taskCancel'); setThemeModalOpen(false); }}>Close</Button>
        }
      >
        <ThemeSelector onClose={() => { playSound('taskCancel'); setThemeModalOpen(false); }} />
      </ModalDialog>

      {/* Auth modal */}
      <AuthModal
        open={signupOpen}
        onClose={() => { playSound('taskCancel'); setSignupOpen(false); }}
        lang={lang}
      />

      {/* Bottom navigation */}
      <BottomNav
        activeScreen={activeScreen}
        onSelect={(screen) => {
          playSound('buttonClick');
          setActiveScreen(screen);
          }}
        lang={lang}
      />

      {/* Delete task confirmation */}
      <ModalDialog
        open={deleteTaskConfirm !== null}
        onClose={() => { playSound('taskCancel'); setDeleteTaskConfirm(null); }}
        title={t('deleteTask', lang)}
        actions={
          <>
            <Button variant="secondary" onClick={() => { playSound('taskCancel'); setDeleteTaskConfirm(null); }}>{t('cancel', lang)}</Button>
            <Button variant="danger" onClick={() => deleteTaskConfirm && doDelete(deleteTaskConfirm)}>{t('delete', lang)}</Button>
          </>
        }
      >
        <p style={{ color: 'var(--pd-color-text-secondary)', fontFamily: 'var(--pd-font-body)' }}>
          {t('deleteTaskConfirm', lang)}
        </p>
      </ModalDialog>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
