import {
  useState, useCallback, useEffect, useRef, useMemo,
  type MutableRefObject,
} from 'react';
import { useListsData, useListsActions } from '../features/ListsContext';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { useTaskListSwipe } from '../hooks/useTaskListSwipe';
import { useActiveTaskLongPressReorder } from '../hooks/useActiveTaskLongPressReorder';
import { playSound } from '../services/sound';
import { trackTaskAdd } from '../services/analytics';
import { t } from '../lib/i18n';
import { SMASH_TITLES } from '../features/useLists';
import { Button, ModalDialog } from '../design-system';
import {
  ListHeader, ListTabs, TaskItem, SmashListPanel, TutorialPanel,
  TaskForm,
  UpsellModal,
} from '../components';
import type { TaskFormHandle } from '../components';
import { MobileTaskSheet } from '../components/MobileTaskSheet';
import type { MobileTaskSheetHandle } from '../components/MobileTaskSheet';
import type { List } from '../types/list';
import type { Task } from '../types/task';
import type { User } from 'firebase/auth';

export interface TasksScreenProps {
  lang: 'en' | 'ja';
  user: User | null;
  isDesktop: boolean;
  hasFinePointer: boolean;
  onComplete: (taskId: string) => void;
  onUncomplete: (taskId: string) => void;
  onSmash: (taskId: string) => void;
  onNavigateToSmashList: () => void;
  onNavigateToFocus: () => void;
  onOpenSignup: () => void;
  onOpenListModal: (modal: { mode: 'add' | 'rename' | 'delete'; listId?: string }) => void;
  anyShellModalOpen: boolean;
}

export function TasksScreen({
  lang,
  user,
  isDesktop,
  hasFinePointer,
  onComplete,
  onUncomplete,
  onSmash,
  onNavigateToSmashList,
  onNavigateToFocus,
  onOpenSignup,
  onOpenListModal,
  anyShellModalOpen,
}: TasksScreenProps) {
  const { lists, activeListId, currentList, listLimitUpsellOpen } = useListsData();
  const {
    addTask, updateTask, deleteTask, moveTask,
    reorderActiveTasks, setActiveList, closeListLimitUpsell,
  } = useListsActions();

  // ── Local state ──────────────────────────────────────────────────────────
  const [taskFormMode, setTaskFormMode] = useState<null | 'add' | string>(null);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [listSlide, setListSlide] = useState<{ listId: string; from: 'left' | 'right' } | null>(null);
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<string | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const taskFormRef = useRef<TaskFormHandle>(null);
  const mobileTaskSheetRef = useRef<MobileTaskSheetHandle>(null);
  const suppressRowClickUntilRef = useRef(0);
  const inlineTaskFormRef = useRef<HTMLDivElement>(null);

  // ── Derived values ────────────────────────────────────────────────────────
  const allTasks = currentList?.tasks ?? [];
  const activeTasks = allTasks.filter((t) => !t.completed);
  const completedTasks = allTasks.filter((t) => t.completed);

  const editingTask =
    typeof taskFormMode === 'string' && taskFormMode !== 'add'
      ? allTasks.find((t) => t.id === taskFormMode) ?? null
      : null;

  const isSmash =
    activeListId === 'smash-list' ||
    currentList?.id === 'smash-list' ||
    currentList?.name === '\u{1F4A5} Smash List';
  const isTutorial = currentList?.id === 'default';

  const preferInlineTaskUi = hasFinePointer;

  const listTabsOrder = useMemo(() => {
    const smash = lists.find((l) => l.id === 'smash-list' || l.name === '\u{1F4A5} Smash List');
    const rest = lists.filter((l) => l !== smash);
    return smash ? [smash, ...rest] : lists;
  }, [lists]);

  const getTabLabel = useCallback((list: List) => {
    if (list.id === 'smash-list' || list.name === '\u{1F4A5} Smash List') return '\u{1F4A5}';
    if (list.id === 'default') {
      return user ? t('myTasks', lang) : t('tutorial', lang);
    }
    return list.name;
  }, [user, lang]);

  const getTabCount = useCallback((list: List) => list.tasks.filter((t) => !t.completed).length, []);

  const availableListsForMove = useMemo(() =>
    lists
      .filter((l) => l.id !== 'smash-list' && l.id !== currentList?.id)
      .map((l) => ({ id: l.id, name: l.name })),
    [lists, currentList?.id],
  );

  const allListsForForm = useMemo(() =>
    lists
      .filter((l) => l.id !== 'smash-list')
      .map((l) => ({ id: l.id, name: l.name })),
    [lists],
  );

  const inlineTaskFormOpen = preferInlineTaskUi && taskFormMode !== null;

  const anyLocalModalOpen =
    deleteTaskConfirm !== null ||
    inlineTaskFormOpen;

  const anyModalOpen = anyLocalModalOpen || anyShellModalOpen;

  const listSlideClass =
    listSlide && listSlide.listId === activeListId
      ? listSlide.from === 'left'
        ? 'pd-list-enter--from-left'
        : 'pd-list-enter--from-right'
      : '';

  // ── Keyboard nav ──────────────────────────────────────────────────────────
  useKeyboardNav({
    lists: listTabsOrder,
    activeListId,
    onSelect: (id) => { setListSlide(null); setActiveList(id); setTaskFormMode(null); },
    onSound: () => playSound('buttonClick'),
  });

  // ── Side effects ──────────────────────────────────────────────────────────

  // Reset taskFormMode when activeListId changes
  useEffect(() => {
    setTaskFormMode(null);
    mobileTaskSheetRef.current?.close();
    setCompletedExpanded(false);
  }, [activeListId]);

  // Touch-first UI: switch from inline to mobile sheet when viewport changes
  useEffect(() => {
    if (hasFinePointer) return;
    if (taskFormMode === 'add') {
      mobileTaskSheetRef.current?.openAdd();
      setTaskFormMode(null);
      return;
    }
    if (taskFormMode) {
      mobileTaskSheetRef.current?.openEdit(taskFormMode);
      setTaskFormMode(null);
    }
  }, [hasFinePointer, taskFormMode]);

  // Desktop inline TaskForm: dismiss on outside tap
  useEffect(() => {
    if (!inlineTaskFormOpen) return;
    let downHandler: ((e: MouseEvent) => void) | null = null;
    const tid = window.setTimeout(() => {
      downHandler = (e: MouseEvent) => {
        const panel = inlineTaskFormRef.current;
        const t = e.target as Node;
        if (!panel || panel.contains(t)) return;
        const addSection = document.querySelector('.pd-add-task-section');
        if (taskFormMode === 'add' && addSection?.contains(t)) return;
        if (taskFormRef.current?.dismissSubmenus()) return;
        taskFormRef.current ? taskFormRef.current.close() : handleTaskFormCancel();
      };
      document.addEventListener('pointerdown', downHandler, true);
    }, 0);
    return () => {
      window.clearTimeout(tid);
      if (downHandler) document.removeEventListener('pointerdown', downHandler, true);
    };
  }, [inlineTaskFormOpen, taskFormMode]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleEdit = useCallback((taskId: string) => {
    if (preferInlineTaskUi) {
      setTaskFormMode(taskId);
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-task-id="${taskId}"]`);
        el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
      });
    } else {
      setTaskFormMode(null);
      mobileTaskSheetRef.current?.openEdit(taskId);
    }
    playSound('taskEdit');
  }, [preferInlineTaskUi]);

  const doDelete = useCallback((taskId: string) => {
    deleteTask(taskId);
    playSound('taskDelete');
    setTaskFormMode(null);
    mobileTaskSheetRef.current?.close();
    setDeleteTaskConfirm(null);
  }, [deleteTask]);

  const handleDelete = useCallback((taskId: string) => {
    playSound('buttonClick');
    setDeleteTaskConfirm(taskId);
  }, []);

  const handleMoveToList = useCallback((taskId: string, targetListId: string) => {
    playSound('buttonClick');
    moveTask(taskId, targetListId);
  }, [moveTask]);

  const handleTaskFormSave = useCallback((fields: Partial<Task> & { title: string }) => {
    const editId = taskFormMode !== 'add' && taskFormMode ? taskFormMode : null;
    if (taskFormMode === 'add') {
      addTask(currentList!.id, fields);
      playSound('taskAdd');
      trackTaskAdd({
        list_type: currentList?.id === 'smash-list' ? 'smash' : 'custom',
        is_repeat: !!fields.repeat,
      });
    } else if (editId) {
      updateTask(editId, fields);
      playSound('taskAdd');
    }
    setTaskFormMode(null);
  }, [taskFormMode, currentList, addTask, updateTask]);

  const handleTaskFormCancel = useCallback(() => {
    playSound('taskCancel');
    setTaskFormMode(null);
  }, []);

  const handleTaskFormClose = useCallback(() => {
    setTaskFormMode(null);
  }, []);

  const openAddTask = useCallback(() => {
    if (isSmash) {
      const first = (currentList?.tasks ?? []).find((t) => !t.completed);
      if (first) {
        onSmash(first.id);
      }
      return;
    }
    playSound('buttonClick');
    if (preferInlineTaskUi) {
      setTaskFormMode('add');
    } else {
      mobileTaskSheetRef.current?.openAdd();
    }
  }, [isSmash, currentList, onSmash, preferInlineTaskUi]);

  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    const currentIdx = listTabsOrder.findIndex((l) => l.id === activeListId);
    if (currentIdx < 0) return;

    const nextIdx = dir === 'left' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0 || nextIdx >= listTabsOrder.length) return;

    const nextId = listTabsOrder[nextIdx]?.id;
    if (!nextId) return;

    const from = dir === 'left' ? 'right' : 'left';
    setListSlide({ listId: nextId, from });

    setActiveList(nextId);
    setTaskFormMode(null);
    mobileTaskSheetRef.current?.close();
    setCompletedExpanded(false);
    playSound('buttonClick');
  }, [activeListId, listTabsOrder, setActiveList]);

  const swipeRef = useTaskListSwipe({
    enabled: !isDesktop && !anyModalOpen,
    onSwipe: handleSwipe,
  });

  const suppressOpenEdit = useCallback(() => Date.now() < suppressRowClickUntilRef.current, []);

  const handleReorderActive = useCallback(
    (from: number, to: number) => {
      const lid = currentList?.id;
      if (!lid || from === to) return;
      reorderActiveTasks(lid, from, to);
      playSound('buttonClick');
    },
    [currentList?.id, reorderActiveTasks],
  );

  const onReorderModeStart = useCallback(() => {
    playSound('taskEdit');
  }, []);

  const onReorderHoverSlotChange = useCallback(() => {
    playSound('buttonClick');
  }, []);

  const { containerRef: activeReorderContainerRef, onRowPointerDown, onRowTouchStart, dragState: activeReorderDrag } =
    useActiveTaskLongPressReorder({
      enabled:
        !anyModalOpen &&
        !isSmash &&
        activeTasks.length >= 2,
      slotCount: activeTasks.length,
      onReorder: handleReorderActive,
      suppressRowClickUntilRef,
      onReorderModeStart,
      onHoverSlotChange: onReorderHoverSlotChange,
    });

  const setMainScrollRef = useCallback(
    (el: HTMLDivElement | null) => {
      (swipeRef as MutableRefObject<HTMLDivElement | null>).current = el;
      activeReorderContainerRef.current = el;
    },
    [swipeRef, activeReorderContainerRef],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <ListTabs
        lists={listTabsOrder}
        activeListId={activeListId}
        onSelect={(id) => { setListSlide(null); setActiveList(id); setTaskFormMode(null); playSound('buttonClick'); }}
        onAddList={() => { playSound('buttonClick'); onOpenListModal({ mode: 'add' }); }}
        getTabLabel={getTabLabel}
        getTabCount={getTabCount}
        lang={lang}
        onRenameList={isDesktop ? (listId) => onOpenListModal({ mode: 'rename', listId }) : undefined}
        onDeleteList={isDesktop ? (listId) => onOpenListModal({ mode: 'delete', listId }) : undefined}
        canContextMenu={(list) => list.id !== 'smash-list' && !list.id.startsWith('tutorial')}
      />

      <ListHeader
        title={isTutorial ? t('tutorial', lang) : (currentList?.id === 'default' ? t('myTasks', lang) : (currentList?.name ?? ''))}
        showMenu={!isTutorial && !isSmash}
        lang={lang}
        onRename={() => onOpenListModal({ mode: 'rename', listId: currentList?.id })}
        onDelete={() => onOpenListModal({ mode: 'delete', listId: currentList?.id })}
      />

      {/* Add task button (desktop only) / inline form */}
      {!isSmash && !isTutorial && (
        <div style={{ paddingBottom: '8px' }} className="pd-add-task-section">
          <button
            type="button"
            onClick={() => { playSound('taskAdd'); openAddTask(); }}
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
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
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
            {lang === 'ja' ? '\u30BF\u30B9\u30AF\u3092\u8FFD\u52A0' : 'Add a task'}
          </button>
        </div>
      )}

      <div
        ref={setMainScrollRef}
        key={activeListId}
        className={['pd-task-area', 'pd-list-enter', 'pd-list-swipe', listSlideClass].filter(Boolean).join(' ')}
        style={{ flex: 1, overflowY: 'auto' }}
      >
        {isSmash ? (
          <SmashListPanel
            subtitle={t('smashListSubtitle', lang)}
            hint={hasFinePointer ? t('smashListHint', lang) : undefined}
            tasks={currentList?.tasks ?? []}
            onSmash={onSmash}
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
              headline={lang === 'ja' ? '\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB\u5B8C\u4E86\uFF01' : "You've completed the tutorial!"}
              subtext=""
              featuresLabel={lang === 'ja' ? '\u30B5\u30A4\u30F3\u30A2\u30C3\u30D7\u3067\u4F7F\u3048\u308B\u3053\u3068' : 'What you unlock for free'}
              freeFeatures={lang === 'ja' ? [
                { icon: '\u{1F4BE}', label: '\u30C7\u30FC\u30BF\u4FDD\u5B58\u30FB\u540C\u671F' },
                { icon: '\u{1F4CB}', label: '\u67D4\u8EDF\u306A\u30BF\u30B9\u30AF\u7BA1\u7406\uFF08\u30EA\u30B9\u30C8\u30FB\u30EA\u30D4\u30FC\u30C8\uFF09' },
                { icon: '\u23F1', label: '\u30BF\u30A4\u30DE\u30FC\u8A2D\u5B9A' },
                { icon: '\u{1F3C6}', label: '\u30C1\u30E3\u30EC\u30F3\u30B8\u3067\u30A8\u30D5\u30A7\u30AF\u30C8\u3092\u96C6\u3081\u308B' },
              ] : [
                { icon: '\u{1F4BE}', label: 'Save & sync' },
                { icon: '\u{1F4CB}', label: 'Flexible task management (lists & repeats)' },
                { icon: '\u23F1', label: 'Timer settings' },
                { icon: '\u{1F3C6}', label: 'Challenges & effect collection' },
              ]}
              buttonLabel={lang === 'ja' ? '\u30B5\u30A4\u30F3\u30A2\u30C3\u30D7\uFF08\u7121\u6599\uFF09' : 'Sign up \u2014 free'}
              onSignUp={() => onOpenSignup()}
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
                  }}>{'\u25B6'}</span>
                  {lang === 'ja' ? `\u5B8C\u4E86\u6E08\u307F (${completedTasks.length})` : `Completed (${completedTasks.length})`}
                </button>
                {completedExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.75 }}>
                    {completedTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        lang={lang}
                        onComplete={onUncomplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onTutorialSmashLinkClick={onNavigateToSmashList}
                        onTutorialFocusLinkClick={onNavigateToFocus}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : allTasks.length === 0 && taskFormMode !== 'add' ? (
          /* AC 14.1: No tasks at all -- "READY?" (vanilla parity: game-start-empty) */
          <div className="game-start-empty">
            <div className="game-start-content">
              <div className="ready-text">{t('emptyReady', lang)}</div>
              <div className="start-instruction">{t('emptyReadySub', lang)}</div>
            </div>
          </div>
        ) : activeTasks.length === 0 && completedTasks.length > 0 && taskFormMode !== 'add' ? (
          /* AC 14.2: All done -- sleeping pixel character (vanilla parity: empty-state) */
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
                <span style={{ fontSize: '0.625rem', transition: 'transform 0.2s', transform: completedExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>{'\u25B6'}</span>
                {lang === 'ja' ? `\u5B8C\u4E86\u6E08\u307F (${completedTasks.length})` : `Completed (${completedTasks.length})`}
              </button>
              {completedExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.75 }}>
                  {completedTasks.map((task) => (
                    <TaskItem key={task.id} task={task} lang={lang} onComplete={onUncomplete} onEdit={handleEdit} onDelete={handleDelete} onTutorialSmashLinkClick={onNavigateToSmashList} onTutorialFocusLinkClick={onNavigateToFocus} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Active tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {taskFormMode === 'add' && (
                <div ref={inlineTaskFormRef} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                  <TaskForm
                    ref={taskFormRef}
                    lang={lang}
                    listId={currentList?.id ?? ''}
                    onSave={handleTaskFormSave}
                    onCancel={handleTaskFormCancel}
                  />
                </div>
              )}
              {activeTasks.map((task, activeIndex) => (
                <div key={task.id} data-active-reorder-slot>
                  {activeReorderDrag.active && activeReorderDrag.hoverIndex === activeIndex && (
                    <div
                      aria-hidden
                      className="pd-active-reorder-insert-line"
                      style={{
                        height: '4px',
                        background: 'var(--pd-color-accent-default)',
                        marginBottom: '6px',
                        boxShadow: '0 0 0 1px var(--pd-color-border-default)',
                        flexShrink: 0,
                        borderRadius: 0,
                        imageRendering: 'pixelated',
                      }}
                    />
                  )}
                  {taskFormMode === task.id && editingTask ? (
                    <div ref={inlineTaskFormRef} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                      <TaskForm
                        ref={taskFormRef}
                        lang={lang}
                        listId={currentList?.id ?? ''}
                        task={editingTask}
                        onSave={handleTaskFormSave}
                        onCancel={handleTaskFormCancel}
                        onClose={handleTaskFormClose}
                        onDelete={() => handleDelete(task.id)}
                        availableLists={allListsForForm}
                        onMoveToList={handleMoveToList}
                      />
                    </div>
                  ) : (
                    <TaskItem
                      task={task}
                      lang={lang}
                      onComplete={onComplete}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onMoveToList={handleMoveToList}
                      availableLists={availableListsForMove}
                      onTutorialSmashLinkClick={onNavigateToSmashList}
                      onTutorialFocusLinkClick={onNavigateToFocus}
                      suppressOpenEdit={suppressOpenEdit}
                      onReorderPointerDown={onRowPointerDown(activeIndex)}
                      onReorderTouchStart={onRowTouchStart(activeIndex)}
                      reorderSource={
                        activeReorderDrag.active && activeReorderDrag.fromIndex === activeIndex
                      }
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
                  }}>{'\u25B6'}</span>
                  {lang === 'ja' ? `\u5B8C\u4E86\u6E08\u307F (${completedTasks.length})` : `Completed (${completedTasks.length})`}
                </button>
                {completedExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.75 }}>
                    {completedTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        lang={lang}
                        onComplete={onUncomplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onTutorialSmashLinkClick={onNavigateToSmashList}
                        onTutorialFocusLinkClick={onNavigateToFocus}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {!anyModalOpen && (
        <button
          type="button"
          onClick={() => { playSound('taskAdd'); openAddTask(); }}
          aria-label={lang === 'ja' ? '\u30BF\u30B9\u30AF\u3092\u8FFD\u52A0' : 'Add a task'}
          className={
            isSmash
              ? 'pd-mobile-fab pd-mobile-fab--smash'
              : 'pd-mobile-fab'
          }
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: isSmash ? 'white' : 'var(--accent-color)',
            color: isSmash ? 'var(--pxd-color-brand-smash)' : 'var(--pd-color-accent-text)',
            border: isSmash ? 'none' : '2px solid var(--pd-color-accent-default)',
            boxShadow: isSmash ? undefined : '2px 2px 0px var(--pd-color-shadow-default)',
            display: 'none', // shown via CSS media query
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            cursor: 'pointer',
            zIndex: 300,
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {isSmash
            ? <span aria-hidden="true">{'\u{1F4A5}'}</span>
            : <span className="material-icons" aria-hidden="true" style={{ fontSize: '24px', lineHeight: 1 }}>add</span>
          }
        </button>
      )}

      {/* Mobile BottomSheet for task add/edit */}
      <MobileTaskSheet
        ref={mobileTaskSheetRef}
        lang={lang}
        tasks={allTasks}
        currentListId={currentList?.id ?? ''}
        onAddTask={(listId, fields) => {
          addTask(listId, fields);
          trackTaskAdd({
            list_type: listId === 'smash-list' ? 'smash' : 'custom',
            is_repeat: !!fields.repeat,
          });
        }}
        onUpdateTask={updateTask}
        onDeleteRequest={handleDelete}
        onMoveToList={handleMoveToList}
        availableLists={allListsForForm}
      />

      {/* Delete task confirmation */}
      <ModalDialog
        open={deleteTaskConfirm !== null}
        onClose={() => { playSound('taskCancel'); setDeleteTaskConfirm(null); }}
        title={t('deleteTask', lang)}
        actions={
          <>
            <Button variant="secondary" onClick={() => { playSound('taskCancel'); setDeleteTaskConfirm(null); }}>{t('cancel', lang)}</Button>
            <Button variant="danger" soundKey="taskDelete" onClick={() => deleteTaskConfirm && doDelete(deleteTaskConfirm)}>{t('delete', lang)}</Button>
          </>
        }
      >
        <p style={{ color: 'var(--pd-color-text-secondary)', fontFamily: 'var(--pd-font-body)' }}>
          {t('deleteTaskConfirm', lang)}
        </p>
      </ModalDialog>

      {/* List limit upsell */}
      <UpsellModal
        open={listLimitUpsellOpen}
        onClose={closeListLimitUpsell}
        reason="list-limit"
        lang={lang}
      />
    </>
  );
}
