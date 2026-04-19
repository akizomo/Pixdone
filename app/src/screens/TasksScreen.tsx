import {
  useState, useCallback, useEffect, useRef, useMemo,
  type MutableRefObject, type ReactNode,
} from 'react';
import { useListsData, useListsActions } from '../features/ListsContext';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { useTaskListSwipe } from '../hooks/useTaskListSwipe';
import { useActiveTaskLongPressReorder } from '../hooks/useActiveTaskLongPressReorder';
import { playSound } from '../services/sound';
import { trackTaskAdd } from '../services/analytics';
import { t } from '../lib/i18n';
import { SMASH_TITLES } from '../features/useLists';
import { Button, ModalDialog, PixelIcon } from '../design-system';
import {
  ListHeader, ListTabs, TaskItem, SmashListPanel, TutorialPanel,
  TaskForm,
  UpsellModal,
} from '../components';
import type { TaskFormHandle } from '../components';
import { MobileTaskSheet } from '../components/MobileTaskSheet';
import type { MobileTaskSheetHandle } from '../components/MobileTaskSheet';
import { PlanView } from '../components/PlanView';
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
  onNavigateToCollection: () => void;
  onDismissTutorial: (action: 'pricing' | 'later') => void;
  onOpenListModal: (modal: { mode: 'add' | 'rename' | 'delete'; listId?: string }) => void;
  anyShellModalOpen: boolean;
  /** Incremented by the shell to force-open the add-task form (used by onboarding). */
  autoOpenAddTaskNonce?: number;
  /** When true, the FAB-triggered add form prefills the title (first-task tour). */
  isOnboardingTour?: boolean;
  /** Fires when the user taps the Add button — used by the shell to close the onboarding tour. */
  onAddButtonClick?: () => void;
  /** Shell-level edit request forwarded from Today/Plan views (mobile bottom sheet). */
  pendingEditRequest?: { taskId: string; nonce: number } | null;
  /** Callback fired after TasksScreen consumes `pendingEditRequest` so the shell can clear it. */
  onConsumePendingEditRequest?: () => void;
  /** Optional node rendered at the bottom of the task-list scroll area (e.g. WorldLayer). */
  worldSlot?: ReactNode;
}

export function TasksScreen({
  lang,
  // `user` is accepted for API symmetry but not referenced — inbox label is now driven by `kind`.
  isDesktop,
  hasFinePointer,
  onComplete,
  onUncomplete,
  onSmash,
  onNavigateToSmashList,
  onNavigateToFocus,
  onNavigateToCollection,
  onDismissTutorial,
  onOpenListModal,
  anyShellModalOpen,
  autoOpenAddTaskNonce,
  isOnboardingTour,
  onAddButtonClick,
  pendingEditRequest,
  onConsumePendingEditRequest,
  worldSlot,
}: TasksScreenProps) {
  const { lists, activeListId, currentList, listLimitUpsellOpen } = useListsData();
  const {
    addTask, updateTask, deleteTask, moveTask,
    reorderActiveTasks, setActiveList, closeListLimitUpsell, setListSortMode,
  } = useListsActions();

  // ── Local state ──────────────────────────────────────────────────────────
  const [viewMode] = useState<'lists' | 'plan'>('lists');
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
  const sortMode = currentList?.sortMode ?? 'manual';
  const rawActiveTasks = allTasks.filter((t) => !t.completed);
  const activeTasks = useMemo(() => {
    if (sortMode === 'manual') return rawActiveTasks;
    const arr = [...rawActiveTasks];
    const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const cmpStr = (a: string, b: string) => a.localeCompare(b);
    arr.sort((a, b) => {
      switch (sortMode) {
        case 'dueDate': {
          const ad = a.dueDate ?? '\uffff';
          const bd = b.dueDate ?? '\uffff';
          return cmpStr(ad, bd) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        }
        case 'priority': {
          const ap = a.priority ? PRIORITY_RANK[a.priority] : 3;
          const bp = b.priority ? PRIORITY_RANK[b.priority] : 3;
          return ap - bp || (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        }
        case 'createdAt':
          return cmpStr(b.id, a.id);
        case 'alphabetical':
          return cmpStr(a.title, b.title);
        default:
          return 0;
      }
    });
    return arr;
  }, [rawActiveTasks, sortMode]);
  const completedTasks = allTasks.filter((t) => t.completed);

  const editingTask =
    typeof taskFormMode === 'string' && taskFormMode !== 'add'
      ? allTasks.find((t) => t.id === taskFormMode) ?? null
      : null;

  const isSmash =
    activeListId === 'smash-list' ||
    currentList?.id === 'smash-list' ||
    currentList?.name === '\u{1F4A5} Smash List';
  const isTutorial = !!(
    currentList &&
    currentList.tasks.some((t) => typeof t.id === 'string' && t.id.startsWith('tutorial-'))
  );

  const preferInlineTaskUi = hasFinePointer;

  // Tab order: Smash List (if present) → Inbox ("My Tasks") → others.
  const listTabsOrder = useMemo(() => {
    const smash = lists.find((l) => l.id === 'smash-list' || l.name === '\u{1F4A5} Smash List');
    const inbox = lists.find((l) => l.kind === 'inbox');
    const rest = lists.filter((l) => l !== smash && l !== inbox);
    const ordered: List[] = [];
    if (smash) ordered.push(smash);
    if (inbox) ordered.push(inbox);
    return [...ordered, ...rest];
  }, [lists]);

  const getTabLabel = useCallback((list: List) => {
    if (list.id === 'smash-list' || list.name === '\u{1F4A5} Smash List') return '\u{1F4A5}';
    if (list.kind === 'inbox') return t('myTasks', lang);
    return list.name;
  }, [lang]);

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

  // Shell (onboarding) may force-open the add-task form by incrementing the nonce.
  // Seed the ref with the nonce at mount so a stale value from another view
  // (e.g. FAB tap while on Today) does not auto-open the form when TasksScreen
  // mounts for the first time.
  const lastConsumedNonce = useRef(autoOpenAddTaskNonce ?? 0);
  useEffect(() => {
    if (!autoOpenAddTaskNonce || autoOpenAddTaskNonce === lastConsumedNonce.current) return;
    lastConsumedNonce.current = autoOpenAddTaskNonce;
    setTaskFormMode('add');
    if (!hasFinePointer) {
      const prefill = isOnboardingTour ? t('tutorialFirstTaskPrefill', lang) : undefined;
      window.requestAnimationFrame(() =>
        mobileTaskSheetRef.current?.openAdd(prefill ? { initialTitle: prefill } : undefined),
      );
    }
  }, [autoOpenAddTaskNonce, hasFinePointer, isOnboardingTour, lang]);

  // Shell forwards edit requests from Today/Plan via pendingEditRequest.
  // Init ref to 0 (not the incoming nonce) so the first request always fires on
  // mount; the shell clears the request after consumption to prevent re-fires.
  const lastConsumedEditNonce = useRef(0);
  useEffect(() => {
    if (!pendingEditRequest) return;
    if (pendingEditRequest.nonce === lastConsumedEditNonce.current) return;
    // Only consume when the request points at a task in the active list.
    // Otherwise wait for setActiveList to settle on the next render.
    if (!allTasks.some((t) => t.id === pendingEditRequest.taskId)) return;
    lastConsumedEditNonce.current = pendingEditRequest.nonce;
    if (hasFinePointer) {
      setTaskFormMode(pendingEditRequest.taskId);
    } else {
      const id = pendingEditRequest.taskId;
      window.requestAnimationFrame(() => mobileTaskSheetRef.current?.openEdit(id));
    }
    onConsumePendingEditRequest?.();
  }, [pendingEditRequest, hasFinePointer, allTasks, onConsumePendingEditRequest]);

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
      const ids = activeTasks.map((t) => t.id);
      if (from < 0 || from >= ids.length || to < 0 || to >= ids.length) return;
      const [moved] = ids.splice(from, 1);
      ids.splice(to, 0, moved);
      reorderActiveTasks(lid, ids);
      if (sortMode !== 'manual') {
        setListSortMode(lid, 'manual');
      }
      playSound('buttonClick');
    },
    [currentList?.id, activeTasks, sortMode, reorderActiveTasks, setListSortMode],
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
      {/* ListTabs — mobile only, when in Lists view */}
      <div className="pd-mobile-only">
        <ListTabs
          lists={listTabsOrder}
          activeListId={activeListId}
          onSelect={(id) => { setListSlide(null); setActiveList(id); setTaskFormMode(null); playSound('buttonClick'); }}
          onAddList={() => { playSound('buttonClick'); onOpenListModal({ mode: 'add' }); }}
          getTabLabel={getTabLabel}
          getTabCount={getTabCount}
          lang={lang}
          canContextMenu={(list) => list.id !== 'smash-list' && list.kind !== 'inbox' && !list.id.startsWith('tutorial')}
        />
      </div>

      {viewMode === 'lists' ? (
      <>
      <ListHeader
        title={isTutorial ? t('tutorial', lang) : (currentList?.kind === 'inbox' ? t('myTasks', lang) : (currentList?.name ?? ''))}
        showMenu={!isTutorial && !isSmash && currentList?.kind !== 'inbox'}
        lang={lang}
        sortMode={sortMode}
        onChangeSort={!isSmash && currentList ? (mode) => setListSortMode(currentList.id, mode) : undefined}
        onRename={currentList?.kind === 'inbox' ? undefined : () => onOpenListModal({ mode: 'rename', listId: currentList?.id })}
        onDelete={currentList?.kind === 'inbox' ? undefined : () => onOpenListModal({ mode: 'delete', listId: currentList?.id })}
      />

      {/* Add task button (desktop only) / inline form */}
      {!isSmash && !isTutorial && (
        <div style={{ paddingBottom: '8px' }} className="pd-add-task-section">
          <button
            type="button"
            className="pd-add-task-section__button"
            data-tour={isOnboardingTour ? 'true' : 'false'}
            onClick={() => { playSound('taskAdd'); openAddTask(); onAddButtonClick?.(); }}
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
            <PixelIcon name="add" size="18px" />
            {lang === 'ja' ? '\u30BF\u30B9\u30AF\u3092\u8FFD\u52A0' : 'Add a task'}
          </button>
        </div>
      )}

      <div
        ref={setMainScrollRef}
        key={activeListId}
        className={['pd-task-area', 'pd-list-enter', 'pd-list-swipe', listSlideClass].filter(Boolean).join(' ')}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
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
        ) : isTutorial && activeTasks.length === 0 ? (
          <div>
            <TutorialPanel
              headline={lang === 'ja' ? '🎮 もっと楽しみたい？' : '🎮 Ready to go further?'}
              subtext=""
              freeFeatures={lang === 'ja' ? [
                { icon: '📋', label: '無制限のタスクリスト' },
                { icon: '🎨', label: '全プリセットテーマ + 進化' },
                { icon: '✨', label: 'Rare・Epicエフェクト' },
                { icon: '💌', label: 'エフェクトリクエスト（月1回）' },
              ] : [
                { icon: '📋', label: 'Unlimited task lists' },
                { icon: '🎨', label: 'All preset themes + progression system' },
                { icon: '✨', label: 'Rare & Epic effects' },
                { icon: '💌', label: 'Monthly effect request' },
              ]}
              buttonLabel={lang === 'ja' ? 'PixDone+を試す' : 'Try PixDone+'}
              onSignUp={() => onDismissTutorial('pricing')}
              pricingLabel={lang === 'ja' ? 'あとで' : 'Later'}
              onViewPricing={() => onDismissTutorial('later')}
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
                  <PixelIcon name="chevron_right_2" size="0.625rem" style={{ transition: 'transform 0.2s', transform: completedExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
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
                        onTutorialChallengeLinkClick={onNavigateToCollection}
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
                <PixelIcon name="chevron_right_2" size="0.625rem" style={{ transition: 'transform 0.2s', transform: completedExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                {lang === 'ja' ? `\u5B8C\u4E86\u6E08\u307F (${completedTasks.length})` : `Completed (${completedTasks.length})`}
              </button>
              {completedExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.75 }}>
                  {completedTasks.map((task) => (
                    <TaskItem key={task.id} task={task} lang={lang} onComplete={onUncomplete} onEdit={handleEdit} onDelete={handleDelete} onTutorialSmashLinkClick={onNavigateToSmashList} onTutorialFocusLinkClick={onNavigateToFocus} onTutorialChallengeLinkClick={onNavigateToCollection} />
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
                    initialTitle={isOnboardingTour ? t('tutorialFirstTaskPrefill', lang) : undefined}
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
                        onTutorialChallengeLinkClick={onNavigateToCollection}
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
                  <PixelIcon name="chevron_right_2" size="0.625rem" style={{ transition: 'transform 0.2s', transform: completedExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
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
                        onTutorialChallengeLinkClick={onNavigateToCollection}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {worldSlot}
      </div>

      </>
      ) : (
        /* ── Plan view ── */
        <PlanView
          lists={lists}
          lang={lang}
          onComplete={onComplete}
          onEdit={handleEdit}
          onUpdateTask={updateTask}
        />
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
