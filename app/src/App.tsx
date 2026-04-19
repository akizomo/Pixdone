import {
  useState, useCallback, useEffect, useRef, useMemo, useSyncExternalStore, Component,
  type ErrorInfo, type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, Button, Chip, IconButton, ModalDialog, ToastProvider, useToast, PopoverMenu, TextLink, PixelIcon } from './design-system';
import {
  ThemeSelector, ListModal, AuthModal, BottomNav, HeaderSegment,
} from './components';
import type { ListModalMode, MobileSubView } from './components';

/** Main screens on mobile + desktop. Sub-pages are URL-routed separately. */
type ActiveScreen = 'tasks' | 'focus' | 'collection';
import { ListsProvider, useListsData, useListsActions } from './features/ListsContext';
import { TasksScreen } from './screens/TasksScreen';
import { FocusScreenContainer } from './screens/FocusScreenContainer';
import { usePerfectTimingSetup, type PerfectTimingBridgeCallbacks } from './hooks/usePerfectTimingSetup';
import { useMidnightRefresh } from './hooks/useMidnightRefresh';
import { detectDefaultLang, t } from './lib/i18n';
import { getTodayYMD } from './lib/date';
import { playSound, getSoundEnabled } from './services/sound';
import { initSoundEngine } from './services/soundEngine';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useThemeEntitlements } from './hooks/useThemeEntitlements';
import { useEffectProgress, bumpPending } from './hooks/useEffectProgress';
import { useActiveChallenge } from './hooks/useActiveChallenge';
import { ChallengeMenu } from './components/ChallengeMenu';
import { runVanillaCompletionEffect } from './services/taskAnimations';
import { trackTaskComplete, trackListCreate, trackEffectTriggered, trackChallengeUnlocked, trackScreenView } from './services/analytics';
import { COMMON_EFFECTS, EFFECTS_REGISTRY, buildDrawPool, weightedRandomEffect } from './data/effectsRegistry';
import { resolveAnimationKey } from './data/effectEvolution';
import { getCompletionToastMessage, getUndoLabel } from './data/effectMessages';
import './styles/task-animations.css';
import './App.css';
import type { Task } from './types/task';
import { PricingPage } from './pages/PricingPage';
import { AccountPage } from './pages/AccountPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { CollectionPage } from './pages/CollectionPage';
import { EffectRequestPage } from './pages/EffectRequestPage';
import { LandingPage } from './pages/LandingPage';
import { EffectCapturePage } from './pages/EffectCapturePage';
import { useUserTheme } from './hooks/useUserTheme';
import { useHasSeenTutorial } from './hooks/useHasSeenTutorial';
import { WorldLayer } from './components/WorldLayer';
import { AgentIcon } from './components/AgentIcon';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { MobileTaskSheet } from './components/MobileTaskSheet';
import type { MobileTaskSheetHandle } from './components/MobileTaskSheet';
import { SidePanel, type SidePanelView } from './components/SidePanel';
import { useTodayView } from './hooks/useTodayView';
import { usePlanView } from './hooks/usePlanView';
import { TodayView } from './components/TodayView';
import { PlanView } from './components/PlanView';
import { FocusWidget } from './components/FocusWidget';
import { useScrollDirection } from './hooks/useScrollDirection';
import { FocusZenMode } from './components/FocusZenMode';
import { useFocusTimer } from './hooks/useFocusTimer';
import { setBgmOn, setBgmTrack, isBgmOn, getBgmTrack, stopBgm } from './services/bgm';
import type { BgmTrack } from './services/bgm';
import { useThemeStats } from './hooks/useThemeStats';
import { useActivityDays, calcAgentCount } from './hooks/useActivityDays';

/**
 * Desktop UI: at least one fine pointer (mouse/trackpad). No viewport width involved —
 * touch-only devices use phone chrome at any width. Keep in sync with pixel.css.
 */
const FINE_POINTER_MQ = '(any-pointer: fine)';

/** Defer React completion state until PerfectTiming card animations finish (avoids clobbering inline styles). */
const PERFECT_TIMING_STATE_DEFER_MS = 520;

function subscribeFinePointer(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(FINE_POINTER_MQ);
  const schedule = () => onStoreChange();
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', schedule);
  } else {
    mq.addListener(schedule);
  }
  return () => {
    if (typeof mq.removeEventListener === 'function') {
      mq.removeEventListener('change', schedule);
    } else {
      mq.removeListener(schedule);
    }
  };
}

function getFinePointerSnapshot(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia(FINE_POINTER_MQ).matches;
}

function AppContent() {
  const { lists, currentList } = useListsData();
  const {
    setActiveList,
    addList, addTask, updateTask, renameList, deleteList,
    completeTask, uncompleteTask,
    resetRepeatingTasks,
  } = useListsActions();

  const { user, logout, syncServerSession } = useAuth();
  const { hasSeenTutorial, markTutorialSeen } = useHasSeenTutorial();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSubPage = pathname === '/pricing' || pathname === '/account' || pathname === '/effect-request' || pathname === '/feedback';

  const [lang, setLang] = useState<'en' | 'ja'>(() => detectDefaultLang());

  const changeLang = useCallback((l: 'en' | 'ja') => {
    setLang(l);
    try { localStorage.setItem('pixdone-lang', l); } catch { /* ignore */ }
  }, []);

  // UI state
  const [signupOpen, setSignupOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signup' | 'login'>('signup');
  const [plusIntroOpen, setPlusIntroOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // userMenuRef removed — PopoverMenu handles outside-click internally
  const [focusZenOpen, setFocusZenOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 900 : true
  );

  // Desktop zen-mode timer state (independent of FocusScreenContainer)
  const desktopTimer = useFocusTimer(() => { stopBgm(); });
  const [desktopBgmOn, setDesktopBgmOn] = useState(() => isBgmOn());
  const [desktopBgmTrack, setDesktopBgmTrack] = useState<BgmTrack>(() => getBgmTrack());

  // List modal state (rendered in shell, triggered from TasksScreen via callback)
  const [listModal, setListModal] = useState<{ mode: ListModalMode; listId?: string } | null>(null);

  // Stripe purchase redirect banner
  const [purchaseBanner, setPurchaseBanner] = useState<'plus_success' | null>(null);

  /* ---- Screen navigation ---- */
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('tasks');
  /** Desktop side-panel view: 'today' | 'plan' | 'smash' | listId */
  const [sideView, setSideView] = useState<SidePanelView>('today');
  /** Mobile sub-menu view: 'today' | 'plan' | 'lists' */
  const [mobileSubView, setMobileSubView] = useState<MobileSubView>('lists');
  useEffect(() => {
    trackScreenView({ screen_name: activeScreen });
  }, [activeScreen]);
  const hasFinePointer = useSyncExternalStore(subscribeFinePointer, getFinePointerSnapshot, () => true);
  const isDesktop = hasFinePointer;
  const scrollDir = useScrollDirection();
  const mobileChromHidden = !isDesktop && scrollDir === 'down';

  /* ---- Sound state (vanilla parity: pixdone-sound-enabled, ComicEffectsManager when loaded) ---- */
  const [soundMuted, setSoundMuted] = useState(() => !getSoundEnabled());

  /* ---- Init sound engine (fallback when vanilla not loaded) ---- */
  useEffect(() => {
    initSoundEngine();
    setSoundMuted(!getSoundEnabled());
  }, []);

  const { showToast } = useToast();

  /* ---- Sync user plan to vanilla effect engine ---- */
  const { plan: userPlan, isPremium } = useThemeEntitlements();
  const { progress: effectProgressMap, ownedChallengeEffects, challengeProgressMap, optimisticIncrement, flushPending } = useEffectProgress();
  const activeChallenge = useActiveChallenge(challengeProgressMap, ownedChallengeEffects);
  useEffect(() => {
    const w = window as unknown as {
      taskAnimationEffects?: { comicEffects?: { setUserPlan: (plan: string) => void } };
    };
    w.taskAnimationEffects?.comicEffects?.setUserPlan(userPlan);
  }, [userPlan]);


  /* ---- Sync document language for font rules ([lang=\"ja\"] selectors) ---- */
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  /* ---- User menu click-outside: handled by PopoverMenu DS component ---- */

  /* ---- Close email auth modal when Firebase session is ready (login success / restored session) ---- */
  useEffect(() => {
    if (user) setSignupOpen(false);
  }, [user]);

  /* ---- Unauthenticated users cannot stay on Collection screen ---- */
  useEffect(() => {
    if (user) return;
    if (activeScreen === 'collection') {
      setActiveScreen('tasks');
    }
  }, [user, activeScreen]);

  /* ---- Midnight refresh — also reset repeating tasks ---- */
  const midnightTick = useMidnightRefresh();
  useEffect(() => {
    if (midnightTick > 0) resetRepeatingTasks();
  }, [midnightTick, resetRepeatingTasks]);

  /* ---- Stripe purchase redirect + auth open ---- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchase = params.get('purchase');
    const authOpen = params.get('auth');
    const url = new URL(window.location.href);
    url.searchParams.delete('purchase');
    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url.toString());
    if (purchase === 'plus_success') {
      setPurchaseBanner('plus_success');
    }
    if (authOpen === '1') {
      setSignupOpen(true);
    }
  }, []);

  /* ---- Deep links: open Collection tab / focus specific effect ---- */
  useEffect(() => {
    // Keep URL params as-is so links remain shareable.
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const screen = params.get('screen');
    if (screen !== 'collection') return;

    const tab = params.get('tab');
    const effectKey = params.get('effect') ?? params.get('effectKey') ?? params.get('fx');

    setActiveScreen('collection');
    if (tab === 'themes') setCollectionInitialTab('themes');
    else if (tab === 'effects') setCollectionInitialTab('effects');

    if (typeof effectKey === 'string' && effectKey.trim().length > 0) {
      setCollectionInitialTab('effects');
      setCollectionInitialEffectKey(effectKey.trim());
    }
  }, [user]);

  useEffect(() => {
    if (purchaseBanner !== 'plus_success') return;
    playSound('taskComplete');
    const tid = window.setTimeout(() => setPurchaseBanner(null), 5000);
    return () => window.clearTimeout(tid);
  }, [purchaseBanner]);

  /* ---- Full-screen onboarding overlay (first login) ---- */
  // `showOnboarding` is a one-shot: once mounted for a first-time user, it stays
  // open until the user explicitly finishes it. We do NOT re-derive from
  // `hasSeenTutorial` — if we did, marking the flag mid-flow (e.g. on upgrade)
  // would unmount the overlay instantly.
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingResolvedRef = useRef(false);
  useEffect(() => {
    if (onboardingResolvedRef.current) return;
    if (!user) return;
    if (hasSeenTutorial === null) return; // still resolving from Firestore
    onboardingResolvedRef.current = true;
    if (hasSeenTutorial === false) setShowOnboarding(true);
  }, [user, hasSeenTutorial]);

  const handleOnboardingDone = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingTourActive(false);
    markTutorialSeen();
  }, [markTutorialSeen]);

  const [autoOpenAddTaskNonce, setAutoOpenAddTaskNonce] = useState(0);
  /** Carries an edit-task request from Today/Plan views to TasksScreen. */
  const [pendingEditRequest, setPendingEditRequest] = useState<{ taskId: string; nonce: number } | null>(null);

  const handleEditFromViews = useCallback((taskId: string) => {
    const host = lists.find((l) => l.tasks.some((t) => t.id === taskId));
    if (!host) return;
    if (host.id !== currentList?.id) setActiveList(host.id);
    if (isDesktop) {
      setSideView(host.id);
    } else {
      setMobileSubView('lists');
    }
    setPendingEditRequest((prev) => ({ taskId, nonce: (prev?.nonce ?? 0) + 1 }));
  }, [lists, currentList?.id, isDesktop, setActiveList]);
  const [onboardingTourActive, setOnboardingTourActive] = useState(false);
  /** Bottom-sheet for "add a task to My tasks" (mobile FAB on Today/Plan). */
  const mobileAddSheetRef = useRef<MobileTaskSheetHandle>(null);
  /**
   * Hidden input used to pre-open the mobile keyboard in the user-gesture
   * chain. iOS Safari only opens the keyboard when `focus()` is called
   * synchronously from a user event. Async focus after the sheet mounts is
   * ignored. We focus this input in the tap handler so the keyboard stays
   * open when focus transfers to the real title field on mount.
   */
  const keyboardWarmupRef = useRef<HTMLInputElement>(null);
  const warmupKeyboard = useCallback(() => {
    keyboardWarmupRef.current?.focus({ preventScroll: true });
  }, []);

  // Lock body scroll + block keyboard scroll keys while the tour is live so
  // only the spotlit Add button / FAB is interactive.
  useEffect(() => {
    if (!onboardingTourActive) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    const blockKey = (e: KeyboardEvent) => {
      const scrollKeys = new Set([
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'PageUp', 'PageDown', 'Home', 'End', ' ',
      ]);
      if (scrollKeys.has(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', blockKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
      window.removeEventListener('keydown', blockKey);
    };
  }, [onboardingTourActive]);

  const handleEnterFirstTask = useCallback(() => {
    // Onboarding Step 5 ("tour"): route the user to My tasks (the default
    // list in TasksScreen) so the real Add button / FAB becomes the tap
    // target underneath the agent + speech bubble. No dummy button is
    // rendered by the tutorial itself. Mark the tutorial as seen here too
    // — the user has watched the whole story arc; even if they close the
    // tab mid-tour it must never replay.
    const inboxId =
      lists.find((l) => l.kind === 'inbox')?.id ??
      lists.find((l) => l.id !== 'smash-list' && l.name !== '\u{1F4A5} Smash List')?.id ??
      lists[0]?.id ??
      '';
    if (!inboxId) return;
    setActiveList(inboxId);
    setActiveScreen('tasks');
    setSideView(inboxId);           // desktop side panel → My Tasks list
    setMobileSubView('lists');      // mobile sub-tab → Lists so TasksScreen renders
    setOnboardingTourActive(true);
    markTutorialSeen();
  }, [lists, setActiveList, markTutorialSeen]);

  const handleAddTaskToDefault = useCallback((fields: Partial<Task> & { title: string }) => {
    // Today / Plan quick-add: always targets the Inbox ("My Tasks").
    const targetList =
      lists.find((l) => l.kind === 'inbox') ??
      lists.find((l) => l.id !== 'smash-list' && l.name !== '\u{1F4A5} Smash List') ??
      lists[0];
    if (!targetList) return;
    addTask(targetList.id, fields);
    playSound('taskAdd');
  }, [lists, addTask]);

  // Closes the onboarding tour the moment the user presses the real Add
  // button on the Today/Plan view during Step 5. No-op outside the tour.
  const handleTourAddButtonClick = useCallback(() => {
    if (!onboardingTourActive) return;
    setOnboardingTourActive(false);
    setShowOnboarding(false);
    markTutorialSeen();
  }, [onboardingTourActive, markTutorialSeen]);

  const handleOnboardingUpgrade = useCallback(async (billingCycle: 'monthly' | 'yearly') => {
    if (!user) return;
    try {
      const sync = await syncServerSession();
      if (!sync.ok) {
        window.alert(sync.message || 'Session sync failed.');
        return;
      }
      const resp = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ billingCycle }),
      });
      if (!resp.ok) {
        let msg = `Checkout failed (${resp.status})`;
        try {
          const err = (await resp.json()) as { message?: string };
          if (err.message) msg = err.message;
        } catch { /* ignore */ }
        window.alert(msg);
        return;
      }
      const data = (await resp.json()) as { checkoutUrl?: string };
      if (data.checkoutUrl) {
        markTutorialSeen();
        window.location.href = data.checkoutUrl;
      }
    } catch {
      window.alert('Network error. Please try again.');
    }
  }, [user, syncServerSession, markTutorialSeen]);

  const isFocusScreen = activeScreen === 'focus';
  const isCollectionScreen = activeScreen === 'collection';

  // Side panel counts
  const todayTasks = useTodayView(lists);
  const planSections = usePlanView(lists);
  const planTotalCount = planSections.today.length + planSections.tomorrow.length + planSections.upcoming.length + planSections.someday.length;

  const { visualTheme, changeTheme, colorMode } = useUserTheme();

  // World Growth System
  const { stats: themeStats, incrementCompleted: incrementThemeCompleted } = useThemeStats(visualTheme);
  const { activityLevel, recordToday } = useActivityDays();
  const worldAgentCount = calcAgentCount(themeStats.level, activityLevel);

  /* ---- World Growth: record today's activity ---- */
  useEffect(() => {
    recordToday();
  }, [recordToday]);

  /* ---- Active effects (localStorage, multi-select) ---- */
  const normalizeActiveEffects = useCallback((keys: string[]): string[] => {
    const allowed = new Set(EFFECTS_REGISTRY.map((e) => e.key));
    const cleaned = (Array.isArray(keys) ? keys : [])
      .filter((k): k is string => typeof k === 'string')
      .filter((k) => allowed.has(k));
    return cleaned.length > 0 ? cleaned : COMMON_EFFECTS.map((e) => e.key);
  }, []);

  const [activeEffects, setActiveEffectsState] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pd-active-effects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return normalizeActiveEffects(parsed as string[]);
      }
    } catch { /* ignore */ }
    // Default: all COMMON effects
    return COMMON_EFFECTS.map((e) => e.key);
  });
  const setActiveEffects = useCallback((keys: string[]) => {
    const next = normalizeActiveEffects(keys);
    setActiveEffectsState(next);
    localStorage.setItem('pd-active-effects', JSON.stringify(next));
  }, [normalizeActiveEffects]);

  // Cleanup in case the registry changed (e.g. effects hidden/removed)
  useEffect(() => {
    const next = normalizeActiveEffects(activeEffects);
    if (next.join('|') !== activeEffects.join('|')) {
      setActiveEffects(next);
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- 所有エフェクトは新規獲得時に自動で active にする ----
   * 一度 active 化したキーは seen に記録し、ユーザーが手動で OFF にした後に
   * 再び強制 ON にならないようにする。
   */
  const autoActivatedOwnedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pd-auto-activated-owned');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) autoActivatedOwnedRef.current = new Set(parsed as string[]);
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!ownedChallengeEffects || ownedChallengeEffects.length === 0) return;
    const seen = autoActivatedOwnedRef.current;
    const allowed = new Set(EFFECTS_REGISTRY.map((e) => e.key));
    const toAdd = ownedChallengeEffects.filter((k) => allowed.has(k) && !seen.has(k));
    if (toAdd.length === 0) return;
    toAdd.forEach((k) => seen.add(k));
    try {
      localStorage.setItem('pd-auto-activated-owned', JSON.stringify(Array.from(seen)));
    } catch { /* ignore */ }
    const missing = toAdd.filter((k) => !activeEffects.includes(k));
    if (missing.length > 0) {
      setActiveEffects([...activeEffects, ...missing]);
    }
  }, [ownedChallengeEffects, activeEffects, setActiveEffects]);

  /* ---- Collection tab initial state (for "See all" deep-link) ---- */
  const [collectionInitialTab, setCollectionInitialTab] = useState<'effects' | 'themes'>('effects');
  const [collectionInitialFilter, setCollectionInitialFilter] = useState<string | undefined>(undefined);
  const [collectionInitialEffectKey, setCollectionInitialEffectKey] = useState<string | null>(null);

  /* ---- Sync active effects to vanilla effect engine ---- */
  useEffect(() => {
    const w = window as unknown as {
      taskAnimationEffects?: { comicEffects?: { setActiveEffects: (keys: string[]) => void } };
    };
    w.taskAnimationEffects?.comicEffects?.setActiveEffects(activeEffects);
  }, [activeEffects]);


  /* ---- Task completion → server notification ---- */
  //
  // DESIGN RULE: sendTaskComplete は全タスク完了時に無条件で呼ぶ。
  // チャレンジの有無・完了状態・期限に関係なく POST を送る。
  // サーバーが challenge progress と evolution progress を一括管理する。
  // クライアントはチャレンジ未完了時のみ楽観的 UI 更新を行う。
  //
  // NG: if (!activeChallenge) return;  ← evolution progress が進まなくなる
  // NG: POST 送信をチャレンジ状態でゲーティング ← 新チャレンジ追加時にバグる
  //
  const countedTaskIds = useRef(new Set<string>());

  const sendTaskComplete = useCallback((taskId: string) => {
    if (countedTaskIds.current.has(taskId)) return;
    countedTaskIds.current.add(taskId);

    // 1. Always notify server (challenge + evolution progress)
    bumpPending();
    void flushPending();

    // 2. Optimistic UI: only for active incomplete challenges
    if (!activeChallenge || activeChallenge.isCompleted) return;

    optimisticIncrement(activeChallenge.effect.key, activeChallenge.threshold);

    // 3. Detect completion for UX (toast + analytics)
    if (activeChallenge.progress + 1 >= activeChallenge.threshold) {
      trackChallengeUnlocked({
        challenge_id: activeChallenge.effect.key,
        effect_id: activeChallenge.effect.key,
        tasks_completed: activeChallenge.threshold,
      });
      const effectName = activeChallenge.effect.name;
      showToast({
        message: lang === 'ja'
          ? `チャレンジ達成！「${effectName}」を獲得しました`
          : `Challenge complete! You earned "${effectName}"`,
        action: {
          label: lang === 'ja' ? '確認' : 'VIEW',
          onClick: () => {
            setCollectionInitialTab('effects');
            setCollectionInitialEffectKey(activeChallenge.effect.key);
            setActiveScreen('collection');
          },
        },
        duration: 8000,
      });
    }
  }, [activeChallenge, optimisticIncrement, flushPending, showToast, lang]);

  /* ---- Dev / QA: ?effect=<key> forces that effect on every task completion ---- */
  const forcedEffectKey = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const key = p.get('effect') ?? p.get('fx');
    if (!key) return null;
    // Only honour if the key exists in registry
    return EFFECTS_REGISTRY.some(e => e.key === key) ? key : null;
  }, []);

  /* ---- Task handlers ---- */
  const runCompleteShort = useCallback((taskId: string) => {
    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement | null;

    const doComplete = () => {
      completeTask(taskId);
    };

    // Find the task to gather analytics metadata
    const task = currentList?.tasks.find((t) => t.id === taskId);
    const isSmashList = currentList?.id === 'smash-list';

    if (taskEl) {
      const pool = buildDrawPool(isPremium, visualTheme, activeEffects, ownedChallengeEffects);
      const selected = pool.length > 0 ? weightedRandomEffect(pool) : undefined;

      // Analytics: effect triggered
      if (selected) {
        trackEffectTriggered({
          effect_tier: selected.rarity as 'common' | 'rare' | 'epic',
          effect_id: selected.key,
          theme_id: visualTheme,
        });
      }

      const baseKey = forcedEffectKey ?? selected?.key;
      const equippedLvl = baseKey ? (effectProgressMap[baseKey]?.equippedLevel ?? 1) : 1;
      const finalKey = baseKey ? resolveAnimationKey(baseKey, equippedLvl) : undefined;
      runVanillaCompletionEffect(taskEl, () => {
        doComplete();
        showToast({
          message: getCompletionToastMessage(baseKey, lang),
          action: { label: getUndoLabel(lang), onClick: () => uncompleteTask(taskId) },
          duration: 5000,
        });
      }, finalKey);
    } else {
      doComplete();
      playSound('taskComplete');
      showToast({
        message: getCompletionToastMessage(undefined, lang),
        action: { label: getUndoLabel(lang), onClick: () => uncompleteTask(taskId) },
        duration: 5000,
      });
    }

    // Analytics: task complete
    trackTaskComplete({
      list_type: isSmashList ? 'smash' : 'custom',
      is_repeat: !!(task as Task | undefined)?.repeat,
      has_subtasks: !!((task as Task | undefined)?.subtasks?.length),
    });

    sendTaskComplete(taskId);

    // World Growth — increment theme-specific completion counter
    incrementThemeCompleted();
  }, [completeTask, uncompleteTask, isPremium, visualTheme, activeEffects, ownedChallengeEffects, sendTaskComplete, user, forcedEffectKey, showToast, lang, incrementThemeCompleted, currentList, effectProgressMap]);

  const runCompleteFromPerfectTiming = useCallback((taskId: string) => {
    window.setTimeout(() => completeTask(taskId), PERFECT_TIMING_STATE_DEFER_MS);
    sendTaskComplete(taskId);
  }, [completeTask, sendTaskComplete]);

  const handleComplete = useCallback(
    (taskId: string) => {
      runCompleteShort(taskId);
    },
    [runCompleteShort],
  );

  const handleUncomplete = useCallback((taskId: string) => {
    uncompleteTask(taskId);
  }, [uncompleteTask]);

  const navigateToSmashList = useCallback(() => {
    playSound('buttonClick');
    setActiveScreen('tasks');
    setActiveList('smash-list');
    // TasksScreen resets its own state (taskFormMode, mobileSheet) via useEffect on activeListId change
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById('pd-list-tab-smash')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }, [setActiveList]);

  const navigateToFocus = useCallback(() => {
    playSound('buttonClick');
    setActiveScreen('focus');
  }, []);


  const runSmashShort = useCallback((taskId: string) => {
    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement | null;

    const doSmash = () => {
      completeTask(taskId);
    };

    if (taskEl) {
      const pool = buildDrawPool(isPremium, visualTheme, activeEffects, ownedChallengeEffects);
      const baseSmashKey = forcedEffectKey ?? (pool.length > 0 ? weightedRandomEffect(pool).key : undefined);
      const smashLvl = baseSmashKey ? (effectProgressMap[baseSmashKey]?.equippedLevel ?? 1) : 1;
      const selectedKey = baseSmashKey ? resolveAnimationKey(baseSmashKey, smashLvl) : undefined;
      runVanillaCompletionEffect(taskEl, () => {
        doSmash();
      }, selectedKey);
    } else {
      doSmash();
      playSound('taskComplete');
    }
    // Smash List tasks are local-only dummies — do NOT count toward challenge progress.
  }, [completeTask, isPremium, visualTheme, activeEffects, ownedChallengeEffects, forcedEffectKey]);

  const runSmashFromPerfectTiming = useCallback((taskId: string) => {
    window.setTimeout(() => {
      completeTask(taskId);
    }, PERFECT_TIMING_STATE_DEFER_MS);
  }, [completeTask]);

  const handleSmash = useCallback(
    (taskId: string) => {
      runSmashShort(taskId);
    },
    [runSmashShort],
  );

  const perfectTimingBridgeRef = useRef<PerfectTimingBridgeCallbacks | null>(null);
  perfectTimingBridgeRef.current = {
    onCompleteShort: runCompleteShort,
    onCompleteFromPt: runCompleteFromPerfectTiming,
    onUncomplete: handleUncomplete,
    onSmashShort: runSmashShort,
    onSmashFromPt: runSmashFromPerfectTiming,
  };
  usePerfectTimingSetup(lists, perfectTimingBridgeRef);


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
      trackListCreate({ list_name: name ?? 'New list' });
    } else if (listModal.mode === 'rename' && listModal.listId) {
      playSound('taskEdit');
      renameList(listModal.listId, name ?? '');
    } else if (listModal.mode === 'delete' && listModal.listId) {
      playSound('taskDelete');
      deleteList(listModal.listId, lists);
    }
    setListModal(null);
  }, [listModal, addList, renameList, deleteList, lists]);

  const anyShellModalOpen =
    signupOpen ||
    themeModalOpen ||
    listModal !== null ||
    focusZenOpen;


  /* ---- Render ---- */

  const goHome = () => {
    navigate('/');
    setActiveScreen('tasks');
  };

  const openAuth = (mode: 'signup' | 'login') => {
    playSound('buttonClick');
    setAuthInitialMode(mode);
    setSignupOpen(true);
  };

  /* ---- Dev-only effect capture page for Playwright screenshots ---- */
  if (import.meta.env.DEV && pathname === '/__capture-effects') {
    return <EffectCapturePage />;
  }

  /* ---- Unauthenticated landing page — rendered standalone, full-width, no app chrome ---- */
  if (!user && pathname === '/') {
    return (
      <>
        <LandingPage
          lang={lang}
          onChangeLang={changeLang}
          onOpenLogin={() => openAuth('login')}
          onOpenSignup={() => openAuth('signup')}
        />
        <AuthModal
          open={signupOpen}
          onClose={() => { playSound('taskCancel'); setSignupOpen(false); }}
          onLoginSuccess={() => setSignupOpen(false)}
          lang={lang}
          initialMode={authInitialMode}
          onSignupSuccess={() => setPlusIntroOpen(true)}
        />
      </>
    );
  }

  return (
    <>
      {/* Global header — full width, outside pd-app-body */}
      {(!focusZenOpen || isDesktop) && (
      <header className="pd-header">
        <div className="pd-header__inner">
          <div className="pd-header__left">
            {isDesktop ? (
              <>
                <button
                  type="button"
                  className="pd-header__menu-btn"
                  aria-label={sidePanelOpen ? 'Close menu' : 'Open menu'}
                  onClick={() => { playSound('buttonClick'); setSidePanelOpen((v) => !v); }}
                >
                  <PixelIcon name="menu" size="20px" />
                </button>
                <h1
                  className="pd-app-title"
                  onClick={goHome}
                  style={{ cursor: 'pointer', margin: 0 }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') goHome(); }}
                >PixDone</h1>
              </>
            ) : (
              user && (
                <ChallengeMenu
                  challenge={activeChallenge}
                  lang={lang}
                  effectProgress={effectProgressMap}
                  isPremium={isPremium}
                  onPreviewEffect={(effectKey) => {
                    setCollectionInitialTab('effects');
                    setCollectionInitialEffectKey(effectKey);
                    setActiveScreen('collection');
                  }}
                />
              )
            )}
          </div>

          {/* Center — mobile-only Tasks/Focus segment (hidden on sub-pages) */}
          {!isDesktop && !isSubPage && (
            <div className="pd-header__center">
              <HeaderSegment
                activeValue={activeScreen === 'tasks' || activeScreen === 'focus' ? activeScreen : null}
                onSelect={(v) => {
                  setActiveScreen(v);
                }}
                lang={lang}
              />
            </div>
          )}

          <div className="pd-header__right">
            {/* Desktop-only: Challenge button stays on the right */}
            {isDesktop && user && (
              <ChallengeMenu
                challenge={activeChallenge}
                lang={lang}
                effectProgress={effectProgressMap}
                isPremium={isPremium}
                onPreviewEffect={(effectKey) => {
                  setCollectionInitialTab('effects');
                  setCollectionInitialEffectKey(effectKey);
                  setActiveScreen('collection');
                }}
              />
            )}

            {/* Theme button */}
            <IconButton
              variant="ghost"
              size="md"
              aria-label={user ? (lang === 'ja' ? 'テーマを変更' : 'Change theme') : (lang === 'ja' ? 'サインアップしてテーマ変更' : 'Sign up to change theme')}
              title={user ? (lang === 'ja' ? 'テーマを変更' : 'Change theme') : (lang === 'ja' ? 'サインアップしてテーマ変更' : 'Sign up to change theme')}
              icon={<PixelIcon name="palette" />}

              onClick={() => {
                if (!user) {
                  setSignupOpen(true);
                } else {
                  setThemeModalOpen(true);
                }
              }}
            />

            {user ? (
              /* Logged-in: Agent avatar + dropdown */
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  aria-label={user.email ?? 'Account'}
                  title={user.email ?? 'Account'}
                  onClick={() => { playSound('buttonClick'); setUserMenuOpen((v) => !v); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                >
                  <AgentIcon themeKey={visualTheme} isPremium={isPremium} faceOnly className="pd-agent-icon--header" />
                </button>
                {userMenuOpen && (
                  <PopoverMenu
                    items={[
                      { id: 'collection', label: 'Effects / Themes', icon: 'auto_awesome', group: 'nav' },
                      {
                        id: 'lang', label: lang === 'ja' ? '言語' : 'Language', icon: 'language', group: 'settings',
                        trailing: (
                          <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                            <Chip variant="ghost" size="sm" selected={lang === 'en'} onClick={() => changeLang('en')}>En</Chip>
                            <Chip variant="ghost" size="sm" selected={lang === 'ja'} onClick={() => changeLang('ja')}>Ja</Chip>
                          </div>
                        ),
                      },
                      { id: 'sound', label: soundMuted ? (lang === 'ja' ? 'サウンドオフ' : 'Sound off') : (lang === 'ja' ? 'サウンドオン' : 'Sound on'), icon: soundMuted ? 'volume_off' : 'volume_up', group: 'settings' },
                      { id: 'support', label: 'Support PixDone', icon: 'favorite', group: 'feedback' },
                      { id: 'feedback', label: lang === 'ja' ? 'フィードバック' : 'Feedback', icon: 'chat_bubble_outline', group: 'feedback' },
                      { id: 'logout', label: lang === 'ja' ? 'ログアウト' : 'Log out', icon: 'logout', group: 'logout' },
                    ]}
                    onSelect={(id) => {
                      if (id === 'collection') { setUserMenuOpen(false); setActiveScreen('collection'); return; }
                      if (id === 'lang') return; // handled by trailing chips
                      if (id === 'sound') { toggleSound(); return; }
                      if (id === 'support') { playSound('buttonClick'); window.open('https://buymeacoffee.com/akizomo', '_blank', 'noopener,noreferrer'); return; }
                      if (id === 'feedback') { playSound('buttonClick'); setUserMenuOpen(false); navigate('/feedback'); return; }
                      if (id === 'logout') { setUserMenuOpen(false); playSound('taskComplete'); logout(); }
                    }}
                    onClose={() => { playSound('taskCancel'); setUserMenuOpen(false); }}
                    align="right"
                    className="pxd-user-menu"
                    footer={
                      <>
                        <div className="user-menu-footer">
                          <a href="/privacy.html" target="_blank" rel="noopener noreferrer">Privacy</a>
                          <span className="user-menu-footer__dot">·</span>
                          <a href="/terms.html" target="_blank" rel="noopener noreferrer">Terms</a>
                          <span className="user-menu-footer__dot">·</span>
                          <a href="/tokushoho.html" target="_blank" rel="noopener noreferrer">Commerce</a>
                        </div>
                        <div className="user-menu-footer">
                          <a href="https://akizony.com" target="_blank" rel="noopener noreferrer">Made by Akihiro Uezono</a>
                        </div>
                      </>
                    }
                  >
                    {/* Agent icon + Email + plan badge */}
                    <div className="user-menu-account">
                      <AgentIcon themeKey={visualTheme} isPremium={isPremium} size={40} faceOnly />
                      <div>
                        <div className="user-menu-account__email">
                          {user.email}
                        </div>
                        <div className="user-menu-account__plan-row">
                          <span className={`user-menu-account__badge${userPlan === 'plus' ? ' user-menu-account__badge--plus' : ''}`}>
                            {userPlan === 'plus' ? 'PIXDONE+' : 'FREE'}
                          </span>
                          <TextLink
                            size="sm"
                            onClick={() => { setUserMenuOpen(false); navigate(userPlan !== 'plus' ? '/pricing' : '/account'); }}
                          >
                            {userPlan !== 'plus'
                              ? (lang === 'ja' ? '変更' : 'Change')
                              : (lang === 'ja' ? '管理' : 'Manage')}
                          </TextLink>
                        </div>
                      </div>
                    </div>
                  </PopoverMenu>
                )}
              </div>
            ) : (
              /* Not logged-in: lang chips + sign up */
              <>
                <Chip variant="ghost" selected={lang === 'en'} onClick={() => { changeLang('en'); playSound('buttonClick'); }}>En</Chip>
                <Chip variant="ghost" selected={lang === 'ja'} onClick={() => { changeLang('ja'); playSound('buttonClick'); }}>Ja</Chip>
                <Button variant="primary" onClick={() => { playSound('buttonClick'); setSignupOpen(true); }}>{lang === 'ja' ? '新規登録' : 'Sign up'}</Button>
              </>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Content area: SidePanel + Main */}
      <div className="pd-app-body">
      {/* Desktop side panel — always in DOM for transition */}
      {isDesktop && (
        <SidePanel
          lists={lists}
          activeView={sideView}
          open={sidePanelOpen && !isSubPage}
          onSelectView={(view) => {
            setSideView(view);
            if (view !== 'today' && view !== 'plan' && view !== 'smash') {
              setActiveList(view);
            } else if (view === 'smash') {
              setActiveList('smash-list');
            }
            setActiveScreen('tasks');
          }}
          onAddList={() => { playSound('buttonClick'); setListModal({ mode: 'add' }); }}
          onClose={() => setSidePanelOpen(false)}
          lang={lang}
          todayCount={todayTasks.length}
          planCount={planTotalCount}
        />
      )}
      <main>
        {pathname === '/pricing' ? (
          <PricingPage />
        ) : pathname === '/account' ? (
          <AccountPage />
        ) : pathname === '/feedback' ? (
          <FeedbackPage />
        ) : pathname === '/effect-request' ? (
          <EffectRequestPage />
        ) : isCollectionScreen ? (
          <CollectionPage
            key={`${collectionInitialTab}-${collectionInitialFilter ?? ''}-${collectionInitialEffectKey ?? ''}`}
            lang={lang}
            isPremium={isPremium}
            activeEffects={activeEffects}
            setActiveEffects={setActiveEffects}
            activeTheme={visualTheme}
            changeTheme={changeTheme}
            colorMode={colorMode}
            initialTab={collectionInitialTab}
            initialFilter={collectionInitialFilter as any}
            initialEffectKey={collectionInitialEffectKey}
            ownedChallengeEffects={ownedChallengeEffects}
            challengeProgressMap={challengeProgressMap}
            effectProgressMap={effectProgressMap}
            onRequestEffect={() => navigate('/effect-request')}
          />
        ) : isFocusScreen && !isDesktop ? (
          <FocusScreenContainer
            lang={lang}
            user={user}
            onComplete={handleComplete}
            onEdit={() => setActiveScreen('tasks')}
            onNavigateToSmashList={navigateToSmashList}
            onNavigateToFocus={navigateToFocus}
            focusZenOpen={focusZenOpen}
            onFocusZenOpenChange={setFocusZenOpen}
          />
        ) : (isDesktop && sideView === 'today') || (!isDesktop && activeScreen === 'tasks' && mobileSubView === 'today') ? (
          <TodayView
            lists={lists}
            lang={lang}
            onComplete={handleComplete}
            onEdit={handleEditFromViews}
            onAddTask={handleAddTaskToDefault}
            autoOpenAddTaskNonce={autoOpenAddTaskNonce}
            onAddButtonClick={handleTourAddButtonClick}
            isOnboardingTour={onboardingTourActive}
          />
        ) : (isDesktop && sideView === 'plan') || (!isDesktop && activeScreen === 'tasks' && mobileSubView === 'plan') ? (
          <PlanView
            lists={lists}
            lang={lang}
            onComplete={handleComplete}
            onEdit={handleEditFromViews}
            onUpdateTask={updateTask}
            onAddTask={handleAddTaskToDefault}
            autoOpenAddTaskNonce={autoOpenAddTaskNonce}
            onAddButtonClick={handleTourAddButtonClick}
            isOnboardingTour={onboardingTourActive}
          />
        ) : (
          <TasksScreen
            lang={lang}
            user={user}
            isDesktop={isDesktop}
            hasFinePointer={hasFinePointer}
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
            onSmash={handleSmash}
            onNavigateToSmashList={navigateToSmashList}
            onNavigateToFocus={navigateToFocus}
            onNavigateToCollection={() => { playSound('buttonClick'); setCollectionInitialTab('effects'); setCollectionInitialFilter('CHALLENGE'); setActiveScreen('collection'); }}
            onDismissTutorial={(action: 'pricing' | 'later') => {
              if (action === 'pricing') navigate('/pricing');
            }}
            onOpenListModal={setListModal}
            anyShellModalOpen={anyShellModalOpen}
            autoOpenAddTaskNonce={autoOpenAddTaskNonce}
            isOnboardingTour={onboardingTourActive}
            onAddButtonClick={handleTourAddButtonClick}
            pendingEditRequest={pendingEditRequest}
            onConsumePendingEditRequest={() => setPendingEditRequest(null)}
            worldSlot={(() => {
              // Non-subscribers viewing the premium forestbit world see a static Lv1 scene.
              const gated = visualTheme === 'forestbit' && !isPremium;
              const params = new URLSearchParams(window.location.search);
              const lvParam = params.get('wlv');
              const agentParam = params.get('wagent');
              const level = lvParam !== null
                ? Math.max(0, Math.min(Number(lvParam), 4))
                : (gated ? 1 : themeStats.level);
              const agentCount = agentParam !== null
                ? Number(agentParam)
                : (gated ? 0 : worldAgentCount);
              return (
                <WorldLayer
                  themeKey={visualTheme}
                  level={level}
                  agentCount={agentCount}
                />
              );
            })()}
          />
        )}
      </main>

      {/* Focus widget — floating, desktop only, hidden during zen-mode */}
      {isDesktop && !focusZenOpen && !isSubPage && (
        <FocusWidget
          lang={lang}
          timerState={desktopTimer.timerState}
          remaining={desktopTimer.remaining}
          bgmOn={desktopBgmOn}
          bgmTrack={desktopBgmTrack}
          onStart={() => { playSound('buttonClick'); desktopTimer.start(); }}
          onPause={() => { playSound('buttonClick'); desktopTimer.pause(); stopBgm(); }}
          onResume={() => { playSound('buttonClick'); desktopTimer.resume(); }}
          onSkip={() => { desktopTimer.reset(25 * 60); stopBgm(); }}
          onBgmChange={({ bgmOn: nextOn, track: nextTrack }) => {
            setDesktopBgmOn(nextOn);
            setBgmOn(nextOn);
            setDesktopBgmTrack(nextTrack);
            setBgmTrack(nextTrack);
          }}
          onOpenZen={() => setFocusZenOpen(true)}
        />
      )}

      {/* Desktop zen-mode: direct overlay, no screen transition */}
      {isDesktop && focusZenOpen && (
        <FocusZenMode
          lang={lang}
          mode="pomodoro"
          timerState={desktopTimer.timerState}
          remaining={desktopTimer.remaining}
          totalSeconds={25 * 60}
          bgmOn={desktopBgmOn}
          bgmTrack={desktopBgmTrack}
          onBgmChange={({ bgmOn: nextOn, track: nextTrack }) => {
            setDesktopBgmOn(nextOn);
            setBgmOn(nextOn);
            setDesktopBgmTrack(nextTrack);
            setBgmTrack(nextTrack);
          }}
          onClose={() => { setFocusZenOpen(false); stopBgm(); }}
          onStart={() => { playSound('buttonClick'); desktopTimer.start(); }}
          onPause={() => { playSound('buttonClick'); desktopTimer.pause(); stopBgm(); }}
          onResume={() => { playSound('buttonClick'); desktopTimer.resume(); }}
          onSkipBreak={() => {}}
          onCompleteFocus={() => { desktopTimer.reset(25 * 60); setFocusZenOpen(false); stopBgm(); }}
        />
      )}


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
        actions={undefined}
      >
        <ThemeSelector
          lang={lang}
          onClose={() => { setThemeModalOpen(false); }}
        />
      </ModalDialog>

      {/* Auth modal */}
      <AuthModal
        open={signupOpen}
        onClose={() => { playSound('taskCancel'); setSignupOpen(false); }}
        onLoginSuccess={() => setSignupOpen(false)}
        lang={lang}
        initialMode={authInitialMode}
        onSignupSuccess={() => setPlusIntroOpen(true)}
      />

      {/* PixDone+ intro modal (post-signup) */}
      <ModalDialog
        open={plusIntroOpen}
        onClose={() => { playSound('taskCancel'); setPlusIntroOpen(false); }}
        closeOnOverlayClick
        aria-label="PixDone+"
        actions={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" size="sm" soundKey="taskCancel" onClick={() => setPlusIntroOpen(false)}>
              {lang === 'ja' ? 'あとで' : 'LATER'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setPlusIntroOpen(false); navigate('/pricing'); }}>
              {lang === 'ja' ? 'PixDone+ を見る' : 'VIEW PIXDONE+'}
            </Button>
          </div>
        }
      >
        <div style={{ padding: '4px 0 8px' }}>
          <p style={{
            fontFamily: 'var(--pd-font-brand)', fontSize: '0.875rem',
            color: 'var(--pd-color-accent-default)', letterSpacing: '1px', margin: '0 0 12px',
          }}>
            PIXDONE+
          </p>
          <p style={{
            fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem',
            color: 'var(--pd-color-text-secondary)', margin: '0 0 12px', lineHeight: 1.6,
          }}>
            {lang === 'ja'
              ? 'アップグレードするとできること：'
              : 'Unlock more with PixDone+:'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { ja: '✦ リストが無制限に作れる', en: '✦ Unlimited task lists' },
              { ja: '✦ Synthwave テーマが使える', en: '✦ Synthwave theme' },
              { ja: '✦ レアエフェクトが発動する（Rainbow Smash / Freeze）', en: '✦ Rare effects (Rainbow Smash / Freeze)' },
            ].map((f) => (
              <p key={f.en} style={{
                fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
                color: 'var(--pd-color-text-primary)', margin: 0,
              }}>
                {lang === 'ja' ? f.ja : f.en}
              </p>
            ))}
          </div>
        </div>
      </ModalDialog>

      {/* Mobile FAB — visible on Tasks tab.
          - Smash list: white "💥" FAB that smashes the first active dummy
            task (mirrors the desktop Space-key behavior in SmashListPanel).
          - Everywhere else: standard "+" FAB that opens the add-task sheet. */}
      {!focusZenOpen && !isDesktop && activeScreen === 'tasks' && !isSubPage && (() => {
        const isSmashList =
          mobileSubView === 'lists' &&
          (currentList?.id === 'smash-list' ||
            currentList?.name === '\u{1F4A5} Smash List');

        if (isSmashList) {
          return (
            <button
              type="button"
              className="pd-mobile-fab pd-mobile-fab--smash"
              onClick={() => {
                const first = currentList?.tasks.find((t) => !t.completed);
                if (!first) return;
                playSound('buttonClick');
                handleSmash(first.id);
              }}
              aria-label={lang === 'ja' ? 'スマッシュ' : 'Smash'}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'white',
                color: 'var(--pd-color-brand-smash, #9c27b0)',
                border: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                lineHeight: 1,
                cursor: 'pointer',
              }}
            >
              <span aria-hidden="true">💥</span>
            </button>
          );
        }

        return (
          <button
            type="button"
            className="pd-mobile-fab"
            data-tour={onboardingTourActive ? 'true' : 'false'}
            onClick={() => {
              // Focus the warmup input FIRST so iOS opens the keyboard within
              // this user gesture. Focus transfers to the real title field
              // once TaskForm mounts.
              warmupKeyboard();
              playSound('taskAdd');
              // Today/Plan: open the App-level add-task bottom sheet directly.
              // Lists: fall back to TasksScreen's own flow via the nonce.
              if (mobileSubView === 'today' || mobileSubView === 'plan') {
                mobileAddSheetRef.current?.openAdd(
                  mobileSubView === 'today' ? { initialDueDate: getTodayYMD() } : undefined,
                );
              } else {
                setAutoOpenAddTaskNonce((n) => n + 1);
              }
              handleTourAddButtonClick();
            }}
            aria-label={lang === 'ja' ? 'タスクを追加' : 'Add task'}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--pd-color-accent-default)',
              color: 'var(--pd-color-accent-text)',
              border: '2px solid var(--pd-color-accent-default)',
              boxShadow: '2px 2px 0px var(--pd-color-shadow-default)',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            <PixelIcon name="add" size="28px" />
          </button>
        );
      })()}

      {/* Hidden input used to pre-open the iOS keyboard in the user-gesture
          chain when the FAB or Add button fires. Off-screen, opacity:0, but
          NOT display:none / visibility:hidden (those would block focus). */}
      <input
        ref={keyboardWarmupRef}
        type="text"
        aria-hidden="true"
        tabIndex={-1}
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        style={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: 1,
          height: 1,
          opacity: 0,
          border: 'none',
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* App-level add-task bottom sheet for Today/Plan FAB taps. Seeds the
          list chip with My Tasks (the inbox default); the user can still pick
          any non-smash list via the chip. */}
      {!isDesktop && (
        <MobileTaskSheet
          ref={mobileAddSheetRef}
          lang={lang}
          tasks={[]}
          currentListId={
            lists.find((l) => l.kind === 'inbox')?.id ??
            lists.find((l) => l.id !== 'smash-list' && l.name !== '\u{1F4A5} Smash List')?.id ??
            lists[0]?.id ??
            ''
          }
          onAddTask={(listId, fields) => {
            addTask(listId, fields);
            trackTaskComplete({
              list_type: 'custom',
              is_repeat: !!fields.repeat,
              has_subtasks: (fields.subtasks?.length ?? 0) > 0,
            });
          }}
          onUpdateTask={() => {}}
          onDeleteRequest={() => {}}
          onMoveToList={() => {}}
          availableLists={lists
            .filter((l) => l.id !== 'smash-list' && l.name !== '\u{1F4A5} Smash List')
            .map((l) => ({ id: l.id, name: l.kind === 'inbox' ? t('myTasks', lang) : l.name }))}
        />
      )}

      {/* Bottom navigation — mobile only, hidden on sub-pages and zen mode.
          Hosts the Lists/Today/Plan task-view switcher. When active screen is
          Focus (or Collection), tapping a tab returns to Tasks + selects the view. */}
      {!focusZenOpen && !isDesktop && !isSubPage && (
        <BottomNav
          activeView={activeScreen === 'tasks' ? mobileSubView : null}
          onSelect={(view) => {
            setMobileSubView(view);
            if (activeScreen !== 'tasks') setActiveScreen('tasks');
          }}
          lang={lang}
          hidden={mobileChromHidden}
        />
      )}


      {/* Stripe purchase success banner */}
      {purchaseBanner === 'plus_success' && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '96px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'var(--pd-color-background-elevated)',
            border: '2px solid var(--pd-color-semantic-success)',
            boxShadow: '3px 3px 0 var(--pd-color-shadow-default)',
            maxWidth: 'min(400px, calc(100vw - 32px))',
            width: 'max-content',
            fontFamily: 'var(--pd-font-body)',
          }}
        >
          <span style={{ color: 'var(--pd-color-semantic-success)', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>✓</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--pd-font-brand)', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--pd-color-semantic-success)' }}>
              {lang === 'ja' ? 'PIXDONE+ へようこそ！' : 'WELCOME TO PIXDONE+'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--pd-color-text-secondary)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {lang === 'ja' ? (
                <>
                  <span>✦ リストが無制限に作れます</span>
                  <span>✦ Synthwave テーマが解放されました</span>
                  <span>✦ レアエフェクト（Rainbow Smash / Freeze）が発動します</span>
                </>
              ) : (
                <>
                  <span>✦ Unlimited task lists unlocked</span>
                  <span>✦ Synthwave theme unlocked</span>
                  <span>✦ Rare effects enabled (Rainbow Smash / Freeze)</span>
                </>
              )}
            </div>
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            soundKey="taskCancel"
            aria-label={lang === 'ja' ? '閉じる' : 'Dismiss'}
            onClick={() => setPurchaseBanner(null)}
            icon={<span style={{ fontSize: '1rem', lineHeight: 1 }}>✕</span>}
          />
        </div>
      )}

    </div>

    {showOnboarding && (
      <OnboardingTutorial
        themeKey={visualTheme}
        isPremium={isPremium}
        lang={lang}
        onDone={handleOnboardingDone}
        onUpgrade={handleOnboardingUpgrade}
        onReachCta={markTutorialSeen}
        onEnterFirstTask={handleEnterFirstTask}
      />
    )}
    </>
  );
}

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[PixDone crash]', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', color: 'red', background: '#111', minHeight: '100vh' }}>
          <h2>App crashed</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <RootErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ListsProvider>
              <AppContent />
            </ListsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  );
}
