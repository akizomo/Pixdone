import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Task } from '@app/types/task';
import type { List } from '@app/types/list';
import { TaskForm } from '@app/components/TaskForm';
import { TaskItem } from '@app/components/TaskItem';
import { ListTabs } from '@app/components/ListTabs';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  IconButton,
  PixelIcon,
  PopoverMenu,
  PortalContainerProvider,
  ToastProvider,
} from '@app/design-system';
import type { PopoverMenuItem } from '@app/design-system/components/PopoverMenu/PopoverMenu.types';
import { getTodayTasks } from '@app/hooks/useTodayView';
import { groupTasksForPlan } from '@app/hooks/usePlanView';
import { getTodayYMD, getTomorrowYMD } from '@app/lib/date';
import { hasActiveRepeat, getNextDueDateAfter } from '@app/lib/repeat';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { makeSiteLink } from './description';
import { fetchLists, fetchTasks, createTask, updateTask, deleteTask } from './firestoreClient';
import { pickRandomEffectKey, dispatchPlayEffect, buildEffectClone } from './effectSelector';
import { AccountMenu, WEB_EXTENSION_LINK_URL } from './AccountMenu';
import './QuickPanelShell.css';

interface QuickPanelAppProps {
  shadowRoot: ShadowRoot;
  /**
   * Container for DS `createPortal` targets (PopoverMenu, ModalDialog). Must
   * live inside the `pointer-events: auto` react-host so menu items receive
   * clicks. If omitted, falls back to the shadow root.
   */
  portalContainer?: Element;
}

const PANEL_W = 340;
const PANEL_H_MIN = 200;

type FormMode =
  | { kind: 'new'; listId: string; initialDetails?: string; initialTitle?: string; key: number }
  | { kind: 'edit'; task: Task }
  | null;

/** Mirrors the mobile BottomNav — three sub-views switched via header dropdown. */
type QuickView = 'today' | 'plan' | 'lists';

const VIEW_STORAGE_KEY = 'pixdone-quick-view';
const ACTIVE_LIST_STORAGE_KEY = 'pixdone-quick-active-list';

function readStoredView(): QuickView {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (raw === 'today' || raw === 'plan' || raw === 'lists') return raw;
  } catch {
    /* ignore */
  }
  return 'today';
}

function readStoredActiveListId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_LIST_STORAGE_KEY);
  } catch {
    return null;
  }
}

interface CurrentPage {
  siteName: string;
  title: string;
  url: string;
}

function detectLang(): 'en' | 'ja' {
  try {
    const saved = localStorage.getItem('pixdone-quick-lang');
    if (saved === 'en' || saved === 'ja') return saved;
  } catch {
    /* ignore */
  }
  const raw = (typeof navigator !== 'undefined' && navigator.language) || 'en';
  return raw.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

function getCurrentPage(): CurrentPage {
  const host = window.location.hostname.replace(/^www\./, '');
  return {
    siteName: host || window.location.host || 'this page',
    title: document.title || host,
    url: window.location.href,
  };
}

function anchorAboveRight(x: number, y: number): { x: number; y: number } {
  const GAP = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let px = x + GAP;
  let py = y - PANEL_H_MIN - GAP;
  if (px + PANEL_W > vw - 8) px = Math.max(8, vw - PANEL_W - 8);
  if (py < 8) py = y + GAP;
  if (py + PANEL_H_MIN > vh - 8) py = Math.max(8, vh - PANEL_H_MIN - 8);
  return { x: px, y: py };
}

/**
 * Build a Firestore-shaped `lists` array where each list already contains its
 * active tasks — this is the shape `getTodayTasks(lists, today)` expects.
 */
function embedTasksInLists(lists: List[], tasks: Task[]): List[] {
  const byList = new Map<string, Task[]>();
  for (const t of tasks) {
    const bucket = byList.get(t.listId);
    if (bucket) bucket.push(t);
    else byList.set(t.listId, [t]);
  }
  return lists.map((l) => ({ ...l, tasks: byList.get(l.id) ?? [] }));
}

interface StoredAuth {
  idToken?: string;
  email?: string | null;
  uid?: string;
  /** Synced from the web app at sign-in. Gates Rare/Epic effects, etc. */
  isPremium?: boolean;
}

function QuickPanelAppInner({ shadowRoot }: QuickPanelAppProps) {
  const [lang, setLang] = useState<'en' | 'ja'>(() => detectLang());
  const [soundMuted, setSoundMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pixdone-sound-enabled') === 'false';
    } catch {
      return false;
    }
  });
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [allLists, setAllLists] = useState<List[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [captureOn, setCaptureOn] = useState(true);
  const [page, setPage] = useState<CurrentPage>(() => getCurrentPage());
  const [view, setView] = useState<QuickView>(() => readStoredView());
  const [activeListId, setActiveListId] = useState<string | null>(() => readStoredActiveListId());
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewTriggerRef = useRef<HTMLButtonElement>(null);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Persist view + activeListId across panel opens.
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);
  useEffect(() => {
    try {
      if (activeListId) localStorage.setItem(ACTIVE_LIST_STORAGE_KEY, activeListId);
      else localStorage.removeItem(ACTIVE_LIST_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [activeListId]);

  // Load auth + listen for changes
  useEffect(() => {
    chrome.storage.local.get('pixdoneAuth', (res) => {
      setAuth((res.pixdoneAuth as StoredAuth | undefined) ?? null);
    });
    const onChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'local' || !changes.pixdoneAuth) return;
      setAuth((changes.pixdoneAuth.newValue as StoredAuth | undefined) ?? null);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const signedIn = !!auth?.idToken;

  const openSignIn = useCallback(() => {
    // Content scripts can't call `chrome.windows` — route through background.
    chrome.runtime.sendMessage(
      { type: 'PIXDONE_OPEN_SIGN_IN', url: WEB_EXTENSION_LINK_URL },
      () => {
        void chrome.runtime.lastError;
      },
    );
  }, []);

  const signOut = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'PIXDONE_SIGN_OUT' }, () => {
      void chrome.runtime.lastError;
    });
    setAllTasks([]);
    setAllLists([]);
  }, []);

  const changeLang = useCallback((l: 'en' | 'ja') => {
    setLang(l);
    try {
      localStorage.setItem('pixdone-quick-lang', l);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pixdone-sound-enabled', next ? 'false' : 'true');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Track mouse for positioning
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lists, tasks] = await Promise.all([fetchLists(), fetchTasks()]);
      setAllLists(lists);
      setAllTasks(tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setPage(getCurrentPage());
    if (signedIn) void refresh();
  }, [open, signedIn, refresh]);

  const today = useMemo(() => getTodayYMD(), []);
  const tomorrow = useMemo(() => getTomorrowYMD(), []);
  const listsWithTasks = useMemo(
    () => embedTasksInLists(allLists, allTasks),
    [allLists, allTasks],
  );
  const todayTasks = useMemo(
    () => getTodayTasks(listsWithTasks, today),
    [listsWithTasks, today],
  );
  const planSections = useMemo(
    () => groupTasksForPlan(listsWithTasks, today, tomorrow),
    [listsWithTasks, today, tomorrow],
  );

  // Inbox-first, smash-excluded — used both for ListTabs and `defaultListId`.
  const inboxList = useMemo(
    () => allLists.find((l) => l.kind === 'inbox') ?? null,
    [allLists],
  );
  const tabLists = useMemo(() => {
    const nonSmash = listsWithTasks.filter(
      (l) => l.id !== 'smash-list' && l.name !== '💥 Smash List' && l.name !== 'Smash List',
    );
    if (!inboxList) return nonSmash;
    const rest = nonSmash.filter((l) => l.id !== inboxList.id);
    const inboxWithTasks = nonSmash.find((l) => l.id === inboxList.id);
    return inboxWithTasks ? [inboxWithTasks, ...rest] : nonSmash;
  }, [listsWithTasks, inboxList]);

  // Resolve the active list, falling back to inbox if the stored id is gone or
  // unset (e.g. first run, or the list got deleted on another device).
  const resolvedActiveListId = useMemo(() => {
    if (activeListId && tabLists.some((l) => l.id === activeListId)) return activeListId;
    return inboxList?.id ?? tabLists[0]?.id ?? null;
  }, [activeListId, tabLists, inboxList]);

  // Sync resolution back to state so localStorage stays consistent.
  useEffect(() => {
    if (resolvedActiveListId && resolvedActiveListId !== activeListId) {
      setActiveListId(resolvedActiveListId);
    }
  }, [resolvedActiveListId, activeListId]);

  const activeListTasks = useMemo(() => {
    if (!resolvedActiveListId) return [] as Task[];
    return allTasks
      .filter((t) => t.listId === resolvedActiveListId && !t.completed)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || a.id.localeCompare(b.id));
  }, [allTasks, resolvedActiveListId]);

  // Tasks the user currently sees — drives keyboard shortcuts (1-5) and the
  // empty state. For Plan view we flatten in display order so digit shortcuts
  // map to the visible row.
  const currentTasks = useMemo<Task[]>(() => {
    if (view === 'today') return todayTasks;
    if (view === 'plan') {
      return [
        ...planSections.today,
        ...planSections.tomorrow,
        ...planSections.upcoming,
        ...planSections.someday,
      ];
    }
    return activeListTasks;
  }, [view, todayTasks, planSections, activeListTasks]);

  const defaultListId = useMemo(() => {
    if (view === 'lists' && resolvedActiveListId) return resolvedActiveListId;
    return inboxList?.id ?? allLists[0]?.id ?? '';
  }, [view, resolvedActiveListId, inboxList, allLists]);

  const availableLists = useMemo(
    () =>
      allLists
        .filter((l) => l.id !== 'smash-list' && l.name !== '💥 Smash List' && l.name !== 'Smash List')
        .map((l) => ({ id: l.id, name: l.name })),
    [allLists],
  );

  const listNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of allLists) m.set(l.id, l.name);
    return m;
  }, [allLists]);

  const openNewTask = useCallback(
    (opts?: {
      at?: { x: number; y: number };
      initialTitle?: string;
      initialDetails?: string;
      captureOn?: boolean;
    }) => {
      // Only reposition when the panel was CLOSED. If the user is already
      // looking at the panel (viewing task list or editing), keep it in place
      // — add and edit should feel like the same panel, not a new one.
      setOpen((prev) => {
        if (!prev) {
          const anchor = opts?.at ?? mouseRef.current;
          setPosition(anchorAboveRight(anchor.x, anchor.y));
        }
        return true;
      });
      setPage(getCurrentPage());
      if (opts?.captureOn !== undefined) setCaptureOn(opts.captureOn);
      setFormMode({
        kind: 'new',
        listId: defaultListId,
        initialTitle: opts?.initialTitle,
        initialDetails: opts?.initialDetails,
        key: Date.now(),
      });
    },
    [defaultListId],
  );

  const openEditTask = useCallback((task: Task) => {
    setFormMode({ kind: 'edit', task });
  }, []);

  const closeForm = useCallback(() => setFormMode(null), []);

  const currentSiteLink = useMemo(() => makeSiteLink(page.siteName, page.url), [page]);

  const handleSave = useCallback(
    async (fields: Partial<Task> & { title: string }) => {
      try {
        if (formMode?.kind === 'edit') {
          await updateTask(formMode.task.id, {
            title: fields.title,
            details: fields.details,
            dueDate: fields.dueDate,
            priority: fields.priority,
            repeat: fields.repeat,
            completed: fields.completed,
            subtasks: fields.subtasks,
          });
        } else if (formMode?.kind === 'new') {
          await createTask({
            listId: formMode.listId,
            title: fields.title,
            details: fields.details,
            dueDate: fields.dueDate ?? null,
            priority: fields.priority,
            repeat: fields.repeat ?? 'none',
          });
        }
        setFormMode(null);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [formMode, refresh],
  );

  const handleComplete = useCallback(
    async (taskId: string) => {
      // For repeating tasks, advance `dueDate` to the next occurrence. The main
      // web app's `useLists` has an onSnapshot handler that AUTO-UNCOMPLETES
      // any task where `repeat != 'none' && dueDate <= today` — without
      // advancing dueDate, our completion would be reverted the moment the web
      // app's snapshot listener sees it (and reverted on-server via updateDoc).
      // Match `useLists.completeTask` semantics exactly.
      const task = allTasks.find((t) => t.id === taskId);
      const nextDueDate =
        task && hasActiveRepeat(task.repeat)
          ? getNextDueDateAfter(
              task.repeat!,
              task.dueDate ? new Date(task.dueDate) : new Date(),
              today,
            )
          : null;
      const updates: Parameters<typeof updateTask>[1] = { completed: true };
      if (nextDueDate) updates.dueDate = nextDueDate;

      // Clone-based effect flow — mirrors the web app's
      // `runVanillaCompletionEffect`:
      //   1. Measure source row rect (viewport coords)
      //   2. Build a fixed-positioned clone with inlined computed styles
      //      (shadow CSS can't reach document.body, so inlining is required)
      //   3. Hide the source row (visibility:hidden) so only the clone is
      //      visible during the animation
      //   4. Dispatch the effect — the MAIN-world bridge finds the clone by
      //      data attribute and feeds it to animations.js; the CARD itself
      //      gets the scale/fade/shatter transforms while particles spawn
      //      around it
      //   5. After the effect duration, remove clone, update state (row gets
      //      filtered out by getTodayTasks), restore visibility defensively
      const rowEl = shadowRoot.querySelector<HTMLElement>(`[data-task-id="${taskId}"]`);
      const rect = rowEl?.getBoundingClientRect();
      const effectKey = pickRandomEffectKey({
        isPremium: auth?.isPremium === true,
        visualTheme: 'arcade',
      });
      let clone: HTMLElement | null = null;
      let cloneId: string | undefined;
      let originalVisibility = '';
      if (rowEl && rect && rect.width > 0 && rect.height > 0 && effectKey) {
        const built = buildEffectClone(rowEl, rect);
        clone = built.el;
        cloneId = built.id;
        document.body.appendChild(clone);
        originalVisibility = rowEl.style.visibility;
        rowEl.style.visibility = 'hidden';
        dispatchPlayEffect(effectKey, rect, cloneId);
      }

      // Fire Firestore update right away (server sees completed regardless of
      // client-side effect timing). Rollback restores both visibility and
      // clone lifecycle on failure.
      try {
        await updateTask(taskId, updates);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        if (clone?.parentNode) clone.parentNode.removeChild(clone);
        if (rowEl) rowEl.style.visibility = originalVisibility;
        await refresh();
        return;
      }

      // Defer the list mutation until the clone effect finishes. Long effects
      // (fighterLv2+) get a longer hold; keep in lockstep with bridge.js.
      const LONG_EFFECT_KEYS = new Set(['fighterLv2', 'fighterLv3', 'fighterLv4', 'fighterLv5']);
      const holdMs = clone
        ? effectKey && LONG_EFFECT_KEYS.has(effectKey)
          ? 1550
          : 1100
        : 0;
      window.setTimeout(() => {
        if (clone?.parentNode) clone.parentNode.removeChild(clone);
        // Restore visibility defensively — if the state update below succeeds
        // the row gets filtered out by getTodayTasks anyway, but if React
        // re-renders before the removal we don't want the hidden row to stay
        // invisible in place.
        if (rowEl?.isConnected) rowEl.style.visibility = originalVisibility;
        setAllTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, completed: true, ...(nextDueDate ? { dueDate: nextDueDate } : {}) }
              : t,
          ),
        );
      }, holdMs);
    },
    [allTasks, today, refresh, shadowRoot, auth?.isPremium],
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      try {
        await deleteTask(taskId);
        setFormMode(null);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [refresh],
  );

  // Click-outside-to-close (Shadow-DOM-aware via composedPath).
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const panel = panelRef.current;
      if (panel && (path as EventTarget[]).includes(panel)) return;
      // PopoverMenus (portaled into our shadow root) and their backdrops
      // must NOT trigger panel close. Otherwise dismissing a submenu by
      // clicking the backdrop also tears down the whole panel.
      const popoverEls = shadowRoot.querySelectorAll(
        '.pxd-popover-menu, .pxd-popover-menu__backdrop',
      );
      for (const el of popoverEls) {
        if ((path as EventTarget[]).includes(el)) return;
      }
      setOpen(false);
      setFormMode(null);
    };
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', handler, true);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', handler, true);
    };
  }, [open, shadowRoot]);

  // Content-script messages
  useEffect(() => {
    const onMessage = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        type: string;
        selection?: string;
        pageTitle?: string;
        pageUrl?: string;
      };
      if (detail?.type === 'TOGGLE_PANEL') {
        setOpen((prev) => {
          if (!prev) setPosition(anchorAboveRight(mouseRef.current.x, mouseRef.current.y));
          return !prev;
        });
      }
      if (detail?.type === 'OPEN_ADD_TASK') {
        const selection = (detail.selection ?? '').trim();
        const siteLink = makeSiteLink(
          getCurrentPage().siteName,
          detail.pageUrl ?? window.location.href,
        );
        openNewTask({
          at: mouseRef.current,
          initialTitle: selection || (detail.pageTitle ?? document.title),
          initialDetails: siteLink,
          captureOn: true,
        });
      }
    };
    window.addEventListener('pixdone-quick:message', onMessage);
    return () => window.removeEventListener('pixdone-quick:message', onMessage);
  }, [openNewTask]);

  useKeyboardShortcuts({
    onTogglePanel: () => {
      if (open) {
        setOpen(false);
        setFormMode(null);
      } else {
        setPosition(anchorAboveRight(mouseRef.current.x, mouseRef.current.y));
        setOpen(true);
      }
    },
    onOpenNewTask: () => openNewTask({ captureOn: true, initialDetails: currentSiteLink }),
    onSmashByIndex: (i) => {
      if (formMode) return;
      const t = currentTasks[i];
      if (!t) return;
      void handleComplete(t.id);
    },
    onEscape: () => {
      if (formMode) setFormMode(null);
      else if (open) setOpen(false);
    },
    isInputFocused: false,
    // Listen on the shadow root, not window. The host element re-emits
    // bubble-phase events with its `keydown stopPropagation` blocker (see
    // mount.tsx) so window-level listeners would never fire — but more
    // importantly, listening at the shadow root keeps `e.target` resolved to
    // the real focused element (input vs panel chrome) so `isTypingTarget`
    // can correctly suppress digit shortcuts while the user is typing.
    target: shadowRoot,
  });

  // ── Drag-to-move header ────────────────────────────────────────
  // Only activates when mousedown hits the header itself (or the brand/title
  // text). Clicks on child buttons/menus bubble up through other elements,
  // but the guard uses `.closest` so nested controls never start a drag.
  // NOTE: must be declared BEFORE any early return so hooks order stays stable.
  const onHeaderMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, [role="menuitem"], [role="button"]')) return;
    const panel = panelRef.current;
    if (!panel) return;
    e.preventDefault();
    const rect = panel.getBoundingClientRect();
    dragStateRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      const x = Math.max(4, Math.min(vw - w - 4, ev.clientX - drag.offsetX));
      const y = Math.max(4, Math.min(vh - h - 4, ev.clientY - drag.offsetY));
      setPosition({ x, y });
    };
    const onUp = () => {
      dragStateRef.current = null;
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  if (!open) return null;

  const closeLabel = lang === 'ja' ? '閉じる' : 'Close';
  const emptyTitle = lang === 'ja' ? 'やることがありません' : 'All caught up';
  const emptyDesc = lang === 'ja' ? '新しいタスクを追加しましょう' : 'Add a new task to get started.';
  const newTaskLabel = lang === 'ja' ? '+ 新しいタスク' : '+ New task';
  const captureLabel = captureOn
    ? lang === 'ja' ? '✓ タブを貼り付け中' : '✓ Tab attached'
    : lang === 'ja' ? '+ タブを貼り付け' : '+ Capture this tab';

  const viewLabels: Record<QuickView, string> = {
    today: lang === 'ja' ? '今日' : 'Today',
    plan: 'Plan',
    lists: lang === 'ja' ? 'リスト' : 'Lists',
  };
  const viewIcons: Record<QuickView, string> = {
    today: 'calendar_today',
    plan: 'format_list_bulleted',
    lists: 'folder',
  };
  const viewMenuItems: PopoverMenuItem[] = (['today', 'plan', 'lists'] as QuickView[]).map((id) => ({
    id,
    label: viewLabels[id],
    icon: viewIcons[id],
    selected: view === id,
  }));

  const planSectionLabels = {
    today: lang === 'ja' ? '今日' : 'Today',
    tomorrow: lang === 'ja' ? '明日' : 'Tomorrow',
    upcoming: lang === 'ja' ? '今後' : 'Upcoming',
    someday: lang === 'ja' ? '日付なし' : 'Someday',
  } as const;

  const renderTaskRow = (task: Task, kbdIndex?: number) => (
    <li key={task.id} className="pq-shell__list-item">
      <TaskItem
        task={task}
        lang={lang}
        listName={listNameById.get(task.listId) ?? undefined}
        onComplete={handleComplete}
        onEdit={(taskId) => {
          const t = allTasks.find((tt) => tt.id === taskId);
          if (t) openEditTask(t);
        }}
        onDelete={handleDelete}
      />
      {kbdIndex !== undefined && kbdIndex < 5 && (
        <kbd className="pq-shell__shortcut" aria-label={`Shortcut ${kbdIndex + 1}`}>
          {kbdIndex + 1}
        </kbd>
      )}
    </li>
  );

  return (
    <div
      ref={panelRef}
      className="pq-shell"
      style={{ left: position.x, top: position.y }}
      role="dialog"
      aria-label="PixDone Quick"
    >
      <header className="pq-shell__header" onMouseDown={onHeaderMouseDown}>
        {formMode ? (
          <>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label={lang === 'ja' ? '戻る' : 'Back'}
              icon={<PixelIcon name="arrow_back" />}
              onClick={() => setFormMode(null)}
            />
            <span className="pq-shell__form-title">
              {formMode.kind === 'edit'
                ? lang === 'ja' ? 'タスクを編集' : 'Edit task'
                : lang === 'ja' ? '新しいタスク' : 'New task'}
            </span>
          </>
        ) : signedIn ? (
          <>
            <button
              ref={viewTriggerRef}
              type="button"
              className="pq-view-trigger"
              aria-haspopup="menu"
              aria-expanded={viewMenuOpen}
              onClick={() => setViewMenuOpen((v) => !v)}
            >
              <PixelIcon name={viewIcons[view]} />
              <span className="pq-view-trigger__label">{viewLabels[view]}</span>
              <PixelIcon name="arrow_drop_down" />
            </button>
            {viewMenuOpen && (
              <PopoverMenu
                items={viewMenuItems}
                anchorEl={viewTriggerRef.current}
                placement="bottom-start"
                onSelect={(id) => {
                  setView(id as QuickView);
                  setViewMenuOpen(false);
                }}
                onClose={() => setViewMenuOpen(false)}
              />
            )}
          </>
        ) : (
          <span className="pq-shell__brand">PixDone Quick</span>
        )}
        {signedIn && !formMode ? (
          <AccountMenu
            lang={lang}
            email={auth?.email ?? null}
            soundMuted={soundMuted}
            onChangeLang={changeLang}
            onToggleSound={toggleSound}
            onSignOut={signOut}
          />
        ) : null}
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={closeLabel}
          icon={<PixelIcon name="close" />}
          onClick={() => setOpen(false)}
        />
      </header>

      <div className="pq-shell__body">
        {!signedIn ? (
          <div className="pq-shell__signin">
            <img
              src={chrome.runtime.getURL('pixdone-logo-black.svg')}
              alt="PixDone"
              className="pq-shell__signin-logo"
            />
            <h2 className="pq-shell__signin-title">
              {lang === 'ja' ? 'PixDone にサインイン' : 'Sign in to PixDone'}
            </h2>
            <p className="pq-shell__signin-desc">
              {lang === 'ja'
                ? 'アカウントでサインインするとタスクを同期します。'
                : 'Sign in to sync tasks with your PixDone account.'}
            </p>
            <Button variant="primary" size="md" onClick={openSignIn}>
              {lang === 'ja' ? 'サインイン' : 'Sign in'}
            </Button>
          </div>
        ) : formMode ? (
          <div className="pq-shell__form">
            {formMode.kind === 'new' && (
              <div className="pq-shell__capture">
                <Chip font="body" selected={captureOn} onClick={() => setCaptureOn((v) => !v)}>
                  {captureLabel}
                </Chip>
              </div>
            )}
            <TaskForm
              key={
                formMode.kind === 'new'
                  ? `new-${formMode.key}-${captureOn ? 'on' : 'off'}`
                  : `edit-${formMode.task.id}`
              }
              lang={lang}
              listId={formMode.kind === 'new' ? formMode.listId : formMode.task.listId}
              task={formMode.kind === 'edit' ? formMode.task : undefined}
              initialTitle={formMode.kind === 'new' ? formMode.initialTitle : undefined}
              initialDueDate={formMode.kind === 'new' ? today : undefined}
              initialDetails={
                formMode.kind === 'new'
                  ? captureOn
                    ? (formMode.initialDetails ?? currentSiteLink)
                    : undefined
                  : undefined
              }
              onSave={handleSave}
              onCancel={closeForm}
              onDelete={formMode.kind === 'edit' ? () => handleDelete(formMode.task.id) : undefined}
              availableLists={availableLists}
              mobile
            />
          </div>
        ) : loading ? (
          <div className="pq-shell__status">
            <Badge variant="default">{lang === 'ja' ? '読み込み中…' : 'Loading…'}</Badge>
          </div>
        ) : error ? (
          <div className="pq-shell__status">
            <Badge variant="danger">
              {lang === 'ja' ? '読み込みに失敗しました' : "Couldn't load tasks"}
            </Badge>
            <p className="pq-shell__error-detail">{error}</p>
          </div>
        ) : (
          <>
            {view === 'lists' && tabLists.length > 0 && (
              <ListTabs
                lists={tabLists}
                activeListId={resolvedActiveListId}
                onSelect={(id) => setActiveListId(id)}
                onAddList={() => {
                  /* List creation lives in the main app — no-op here. */
                }}
                getTabLabel={(l) =>
                  l.kind === 'inbox'
                    ? lang === 'ja' ? 'マイタスク' : 'My Tasks'
                    : l.name
                }
                getTabCount={(l) => l.tasks.filter((t) => !t.completed).length}
                lang={lang}
              />
            )}

            {currentTasks.length === 0 ? (
              <EmptyState
                title={emptyTitle}
                description={emptyDesc}
                action={
                  <Button variant="primary" size="sm" onClick={() => openNewTask({ captureOn: true })}>
                    {newTaskLabel}
                  </Button>
                }
              />
            ) : view === 'plan' ? (
              <>
                {(['today', 'tomorrow', 'upcoming', 'someday'] as const).map((sectionKey) => {
                  const tasks = planSections[sectionKey];
                  if (tasks.length === 0) return null;
                  return (
                    <section key={sectionKey} className="pq-shell__section">
                      <h3 className="pq-shell__section-title">{planSectionLabels[sectionKey]}</h3>
                      <ul className="pq-shell__list">
                        {tasks.map((task) => renderTaskRow(task))}
                      </ul>
                    </section>
                  );
                })}
                <div className="pq-shell__new-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openNewTask({ captureOn: true, initialDetails: currentSiteLink })}
                  >
                    {newTaskLabel}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <ul className="pq-shell__list">
                  {currentTasks.map((task, index) => renderTaskRow(task, index))}
                </ul>
                <div className="pq-shell__new-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openNewTask({ captureOn: true, initialDetails: currentSiteLink })}
                  >
                    {newTaskLabel}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Top-level wrapper — provides the ToastProvider + PortalContainerProvider so
 * DS components (Chip's toasts, PopoverMenu's portals) stay inside the shadow
 * root and inherit our injected tokens.
 */
export function QuickPanelApp({ shadowRoot, portalContainer }: QuickPanelAppProps) {
  return (
    <PortalContainerProvider container={portalContainer ?? shadowRoot}>
      <ToastProvider>
        <QuickPanelAppInner shadowRoot={shadowRoot} />
      </ToastProvider>
    </PortalContainerProvider>
  );
}
