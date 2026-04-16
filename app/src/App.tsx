import {
  useState, useCallback, useEffect, useRef, useMemo, useSyncExternalStore, Component,
  type ErrorInfo, type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, Button, Chip, IconButton, ModalDialog, ToastProvider, useToast, PopoverMenu, TextLink, PixelIcon } from './design-system';
import {
  ThemeSelector, ListModal, AuthModal, BottomNav,
} from './components';
import type { ListModalMode, ActiveScreen } from './components';
import { ListsProvider, useListsData, useListsActions } from './features/ListsContext';
import { TasksScreen } from './screens/TasksScreen';
import { FocusScreenContainer } from './screens/FocusScreenContainer';
import { usePerfectTimingSetup, type PerfectTimingBridgeCallbacks } from './hooks/usePerfectTimingSetup';
import { useMidnightRefresh } from './hooks/useMidnightRefresh';
import { detectDefaultLang } from './lib/i18n';
import { playSound, getSoundEnabled } from './services/sound';
import { initSoundEngine } from './services/soundEngine';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useThemeEntitlements } from './hooks/useThemeEntitlements';
import { useEffectProgress, bumpPending } from './hooks/useEffectProgress';
import { useActiveChallenge } from './hooks/useActiveChallenge';
import { ChallengeMenu } from './components/ChallengeMenu';
import { runVanillaCompletionEffect } from './services/taskAnimations';
import { trackTaskComplete, trackListCreate, trackEffectTriggered, trackChallengeUnlocked, trackScreenView, trackTutorialTaskComplete } from './services/analytics';
import { COMMON_EFFECTS, EFFECTS_REGISTRY, buildDrawPool, weightedRandomEffect, buildTutorialDrawPool, weightedRandomEffectTutorial, pickGuaranteedRareOrEpic } from './data/effectsRegistry';
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
import { useThemeStats } from './hooks/useThemeStats';
import { useActivityDays, calcAgentCount } from './hooks/useActivityDays';
import {
  recordAppOpen as recordPhAppOpen,
  shouldShowPhBanner,
  dismissPhBanner,
  PH_REVIEW_URL,
} from './services/phReviewBanner';

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
    addList, renameList, deleteList,
    completeTask, uncompleteTask,
    resetRepeatingTasks,
  } = useListsActions();

  const { user, logout } = useAuth();
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
  const [phBannerOpen, setPhBannerOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signup' | 'login'>('signup');
  const [plusIntroOpen, setPlusIntroOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // userMenuRef removed — PopoverMenu handles outside-click internally
  const [focusZenOpen, setFocusZenOpen] = useState(false);

  // List modal state (rendered in shell, triggered from TasksScreen via callback)
  const [listModal, setListModal] = useState<{ mode: ListModalMode; listId?: string } | null>(null);

  // Stripe purchase redirect banner
  const [purchaseBanner, setPurchaseBanner] = useState<'plus_success' | null>(null);

  /* ---- Screen navigation ---- */
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('tasks');
  useEffect(() => {
    trackScreenView({ screen_name: activeScreen });
  }, [activeScreen]);
  const hasFinePointer = useSyncExternalStore(subscribeFinePointer, getFinePointerSnapshot, () => true);
  const isDesktop = hasFinePointer;

  /* ---- Sound state (vanilla parity: pixdone-sound-enabled, ComicEffectsManager when loaded) ---- */
  const [soundMuted, setSoundMuted] = useState(() => !getSoundEnabled());

  /* ---- Init sound engine (fallback when vanilla not loaded) ---- */
  useEffect(() => {
    initSoundEngine();
    setSoundMuted(!getSoundEnabled());
  }, []);

  /* ---- PH review banner: record today's app-open for authenticated users ---- */
  useEffect(() => {
    if (user) recordPhAppOpen();
  }, [user]);


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

  /* ---- ログイン後・初回: Tutorial リストを先頭に seed ---- */
  // `shouldSeedTutorial` is computed once when hasSeenTutorial first resolves to false.
  // We capture it in a ref so that subsequent list changes never re-trigger the seed.
  const tutorialSeedState = useRef<'idle' | 'seeded'>('idle');
  const shouldSeedTutorial = user && hasSeenTutorial === false && tutorialSeedState.current === 'idle';

  useEffect(() => {
    if (!shouldSeedTutorial) return;
    tutorialSeedState.current = 'seeded';

    // Already has tutorial tasks (e.g. restored from Firestore) — just mark seen
    const hasTutorialTasks = lists.some(
      (l) => l.tasks.some((t) => typeof t.id === 'string' && t.id.startsWith('tutorial-')),
    );
    if (hasTutorialTasks) {
      markTutorialSeen();
      return;
    }

    // Write Tutorial list + tasks directly to Firestore.
    // onSnapshot in useLists will pick them up — no local setLists needed.
    const tutorialId = `tutorial-${user!.uid.slice(0, 8)}`;
    const titles = [
      'Try completing this task!',
      'Each time you complete a task, a different effect appears. How many can you find?',
      'Try the Smash List for even more fun!',
      'Focus with pixel BGM pomodoro timer',
      "Check this month's Challenge and earn a limited effect!",
    ];
    (async () => {
      const { doc: docRef, setDoc: set, Timestamp: TS } = await import('firebase/firestore');
      const fdb = (await import('./lib/firebase')).db;
      // Create the list doc with a known ID
      await set(docRef(fdb, 'lists', tutorialId), {
        uid: user!.uid,
        name: 'Tutorial',
        createdAt: TS.now(),
      });
      // Create tutorial tasks
      for (let i = 0; i < titles.length; i++) {
        await set(docRef(fdb, 'tasks', `tutorial-${i + 1}`), {
          uid: user!.uid,
          listId: tutorialId,
          title: titles[i],
          completed: false,
          dueDate: null,
          createdAt: TS.now(),
          sortOrder: i,
        });
      }
    })().catch((e) => console.warn('[Tutorial seed] Firestore write failed:', e));

    markTutorialSeen();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once when shouldSeedTutorial becomes true
  }, [shouldSeedTutorial]);

  /* ---- Derived: isTutorial = current list has tutorial tasks ---- */
  const isTutorial = !!(
    currentList &&
    currentList.tasks.some((t) => typeof t.id === 'string' && t.id.startsWith('tutorial-'))
  );

  const isFocusScreen = activeScreen === 'focus';
  const isCollectionScreen = activeScreen === 'collection';

  const { visualTheme, changeTheme, colorMode } = useUserTheme();

  // World Growth System
  const { stats: themeStats, incrementCompleted: incrementThemeCompleted } = useThemeStats(visualTheme);
  const { activityLevel, totalLoginDays, recordToday } = useActivityDays();
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


  /* ---- Challenge progress: optimistic + persistent replay queue ---- */
  // Dedup within a single session (prevents UI double-count if same task fires twice fast).
  // The persistent pending queue in useEffectProgress handles cross-session retry.
  const countedTaskIds = useRef(new Set<string>());

  const sendChallengeProgress = useCallback((taskId: string) => {
    if (countedTaskIds.current.has(taskId)) return;
    countedTaskIds.current.add(taskId);

    if (!activeChallenge) return;

    if (activeChallenge.isCompleted) {
      // Challenge already unlocked — still send POST so server can track evolution progress
      bumpPending();
      void flushPending();
      return;
    }

    // Optimistic: bump local progress + owned (if threshold reached) + queue pending POST
    optimisticIncrement(activeChallenge.effect.key, activeChallenge.threshold);

    // Detect completion for UX (toast + analytics)
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

  /* ---- Tutorial toast messages (per task) ---- */
  const showTutorialToast = useCallback((taskId: string, effectRarity?: string) => {
    if (!taskId.startsWith('tutorial-')) return;

    const rarityLabel = effectRarity === 'EPIC' ? (lang === 'ja' ? 'Epic' : 'Epic')
      : effectRarity === 'RARE' ? (lang === 'ja' ? 'Rare' : 'Rare')
      : null;

    const toasts: Record<string, { ja: string; en: string }> = {
      'tutorial-1': {
        ja: '完了するたびに違うエフェクト',
        en: 'A different effect every time',
      },
      'tutorial-2': {
        ja: rarityLabel
          ? `${rarityLabel}エフェクト出現。20種類以上、どんどん増える`
          : '20種類以上、どんどん増える',
        en: rarityLabel
          ? `${rarityLabel} effect. 20+ and growing`
          : '20+ effects and growing',
      },
      'tutorial-3': {
        ja: 'ストレス発散にも、タスク消化にも',
        en: 'For stress relief and getting things done',
      },
      'tutorial-4': {
        ja: 'ピクセルBGMで集中モード。タイマー時間は自由に設定',
        en: 'Pixel BGM for focus. Timer is fully customizable',
      },
      'tutorial-5': {
        ja: '毎月新しいチャレンジが登場。限定エフェクトを獲得',
        en: 'New challenges every month. Earn limited effects',
      },
    };

    const msg = toasts[taskId];
    if (!msg) return;

    showToast({
      message: lang === 'ja' ? msg.ja : msg.en,
      duration: 5000,
    });
  }, [lang, showToast]);

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
    const isTutorialTask = isTutorial && taskId.startsWith('tutorial-');

    const doComplete = () => {
      completeTask(taskId);
    };

    // Find the task to gather analytics metadata
    const task = currentList?.tasks.find((t) => t.id === taskId);
    const isSmashList = currentList?.id === 'smash-list';

    if (taskEl) {
      // Tutorial (unauthenticated): use boosted pool with Rare/Epic
      const pool = isTutorialTask
        ? buildTutorialDrawPool(visualTheme)
        : buildDrawPool(isPremium, visualTheme, activeEffects, ownedChallengeEffects);
      let selected;
      if (isTutorialTask && taskId === 'tutorial-2') {
        // Guaranteed Rare/Epic for tutorial-2 — the "wow" moment
        selected = pool.length > 0 ? pickGuaranteedRareOrEpic(pool) : undefined;
      } else if (isTutorialTask) {
        selected = pool.length > 0 ? weightedRandomEffectTutorial(pool) : undefined;
      } else {
        selected = pool.length > 0 ? weightedRandomEffect(pool) : undefined;
      }

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
        if (isTutorialTask) {
          showTutorialToast(taskId, selected?.rarity);
        } else {
          showToast({
            message: getCompletionToastMessage(baseKey, lang),
            action: { label: getUndoLabel(lang), onClick: () => uncompleteTask(taskId) },
            duration: 5000,
          });
        }
      }, finalKey);
    } else {
      doComplete();
      playSound('taskComplete');
      if (isTutorialTask) {
        showTutorialToast(taskId);
      } else {
        showToast({
          message: getCompletionToastMessage(undefined, lang),
          action: { label: getUndoLabel(lang), onClick: () => uncompleteTask(taskId) },
          duration: 5000,
        });
      }
    }

    // Analytics: task complete
    if (!isTutorialTask) {
      trackTaskComplete({
        list_type: isSmashList ? 'smash' : 'custom',
        is_repeat: !!(task as Task | undefined)?.repeat,
        has_subtasks: !!((task as Task | undefined)?.subtasks?.length),
      });
    } else if (taskId === 'tutorial-1' || taskId === 'tutorial-2' || taskId === 'tutorial-3') {
      trackTutorialTaskComplete({ tutorial_step: taskId });
    }

    if (!isTutorialTask) sendChallengeProgress(taskId);

    // World Growth — increment theme-specific completion counter
    if (!isTutorialTask) {
      incrementThemeCompleted();
    }

    if (!isTutorialTask && user && shouldShowPhBanner()) {
      window.setTimeout(() => setPhBannerOpen(true), 1600);
    }
  }, [completeTask, uncompleteTask, isPremium, visualTheme, activeEffects, ownedChallengeEffects, sendChallengeProgress, user, isTutorial, showTutorialToast, forcedEffectKey, showToast, lang, incrementThemeCompleted]);

  const runCompleteFromPerfectTiming = useCallback((taskId: string) => {
    window.setTimeout(() => completeTask(taskId), PERFECT_TIMING_STATE_DEFER_MS);
    sendChallengeProgress(taskId);
  }, [completeTask, sendChallengeProgress]);

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
      {/* Global header — full width, outside pd-app-container */}
      {!focusZenOpen && (
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          padding: '12px var(--pd-layout-container-padding, 20px)',
          background: 'var(--pd-color-background-default)',
          borderBottom: '2px solid var(--pd-color-border-default)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 'var(--pd-layout-container-maxWidth, 600px)', width: '100%', margin: '0 auto' }}>
          <h1
            className="pd-app-title"
            onClick={goHome}
            style={{ cursor: 'pointer', margin: 0 }}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') goHome(); }}
          >PixDone</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Challenge button — logged-in only */}
            {user && (
              <ChallengeMenu
                challenge={activeChallenge}
                lang={lang}
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
              size="sm"
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
              /* Logged-in: person avatar + dropdown */
              <div style={{ position: 'relative' }}>
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label={user.email ?? 'Account'}
                  title={user.email ?? 'Account'}
                  icon={<PixelIcon name="person" />}
    
                  onClick={() => setUserMenuOpen((v) => !v)}
                />
                {userMenuOpen && (
                  <PopoverMenu
                    items={[
                      { id: 'sound', label: soundMuted ? (lang === 'ja' ? 'サウンドオフ' : 'Sound off') : (lang === 'ja' ? 'サウンドオン' : 'Sound on'), icon: soundMuted ? 'volume_off' : 'volume_up' },
                      { id: 'support', label: lang === 'ja' ? 'Support PixDone' : 'Support PixDone', icon: 'favorite' },
                      { id: 'feedback', label: lang === 'ja' ? 'フィードバック' : 'Feedback', icon: 'chat_bubble_outline' },
                      { id: 'logout', label: lang === 'ja' ? 'ログアウト' : 'Log out', icon: 'logout' },
                    ]}
                    onSelect={(id) => {
                      if (id === 'sound') { toggleSound(); return; }
                      if (id === 'support') { playSound('buttonClick'); window.open('https://buymeacoffee.com/akizomo', '_blank', 'noopener,noreferrer'); return; }
                      if (id === 'feedback') { playSound('buttonClick'); setUserMenuOpen(false); navigate('/feedback'); return; }
                      if (id === 'logout') { setUserMenuOpen(false); playSound('taskComplete'); logout(); }
                    }}
                    onClose={() => { playSound('taskCancel'); setUserMenuOpen(false); }}
                    align="right"
                    className="pxd-user-menu"
                  >
                    {/* Email + plan badge */}
                    <div className="user-menu-account">
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
                    {/* Language */}
                    <div className="user-menu-lang">
                      <div className="user-menu-lang__label">
                        <PixelIcon name="language" />
                        {lang === 'ja' ? '言語' : 'Language'}
                      </div>
                      <div className="user-menu-lang__chips">
                        <Chip variant="ghost" selected={lang === 'en'} onClick={() => { changeLang('en'); playSound('buttonClick'); }}>En</Chip>
                        <Chip variant="ghost" selected={lang === 'ja'} onClick={() => { changeLang('ja'); playSound('buttonClick'); }}>Ja</Chip>
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

      {/* Content area — constrained width */}
      <div
        className="pd-app-container"
        style={{
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: focusZenOpen
            ? 0
            : isDesktop
              ? 'calc(48px + 16px + env(safe-area-inset-bottom))'
              : 'calc(56px + env(safe-area-inset-bottom))',
        }}
      >
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
        ) : isFocusScreen ? (
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
        ) : (
          <TasksScreen
            lang={lang}
            user={user}
            isDesktop={isDesktop}
            hasFinePointer={hasFinePointer}
            totalTasksCompleted={themeStats.tasksCompleted}
            totalLoginDays={totalLoginDays}
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
            onSmash={handleSmash}
            onNavigateToSmashList={navigateToSmashList}
            onNavigateToFocus={navigateToFocus}
            onNavigateToCollection={() => { playSound('buttonClick'); setCollectionInitialTab('effects'); setCollectionInitialFilter('CHALLENGE'); setActiveScreen('collection'); }}
            onDismissTutorial={(action: 'pricing' | 'later') => {
              // Delete the Tutorial list and navigate accordingly
              if (currentList && isTutorial) {
                deleteList(currentList.id, lists);
              }
              if (action === 'pricing') navigate('/pricing');
            }}
            onOpenListModal={setListModal}
            anyShellModalOpen={anyShellModalOpen}
          />
        )}
      </main>


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

      {/* PH review request — inline banner above BottomNav */}
      {phBannerOpen && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '8px 16px',
          fontSize: '0.75rem',
          fontFamily: 'var(--pd-font-body)',
          color: 'var(--pd-color-text-secondary)',
          background: 'var(--pd-color-background-elevated)',
          borderTop: '1px solid var(--pd-color-border-default)',
        }}>
          <span>{lang === 'ja' ? 'PixDone を気に入った？レビューで応援してね' : 'Enjoying PixDone? Leave a review!'}</span>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <Button variant="secondary" size="sm" soundKey="taskCancel" onClick={() => { dismissPhBanner(); setPhBannerOpen(false); }}>
              {lang === 'ja' ? '閉じる' : 'DISMISS'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => { dismissPhBanner(); setPhBannerOpen(false); window.open(PH_REVIEW_URL, '_blank', 'noopener,noreferrer'); }}>
              {lang === 'ja' ? 'レビュー' : 'REVIEW'}
            </Button>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      {!focusZenOpen && (
        <BottomNav
          activeScreen={isSubPage ? null : activeScreen}
          onSelect={(screen) => {
            playSound('buttonClick');
            if (screen === 'collection') { setCollectionInitialEffectKey(null); setCollectionInitialFilter(undefined); }
            setActiveScreen(screen);
            if (isSubPage) navigate('/');
            }}
          lang={lang}
          showCollection={!!user}
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

      {/* Footer legal links intentionally shown even when menu hides them. */}
    </div>

    <WorldLayer
      themeKey={visualTheme}
      cabinetCount={(() => { const p = new URLSearchParams(window.location.search).get('wlv'); return p !== null ? [0,1,3,5,6][Math.min(Number(p),4)] ?? 0 : themeStats.cabinetCount; })()}
      agentCount={(() => { const p = new URLSearchParams(window.location.search).get('wagent'); return p !== null ? Number(p) : worldAgentCount; })()}
    />

    <footer style={{
      textAlign: 'center',
      padding: '12px 16px 14px',
      fontSize: '0.6875rem',
      color: 'var(--pd-color-text-muted)',
      borderTop: '1px solid var(--pd-color-border-default)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      flexShrink: 0,
    }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <a
          href="/tokushoho.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'none' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
        >
          {lang === 'ja' ? '特定商取引法に基づく表示' : 'Commerce Disclosure'}
        </a>
        <a
          href="/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'none' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
        >
          {lang === 'ja' ? 'プライバシーポリシー' : 'Privacy Policy'}
        </a>
        <a
          href="/terms.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'none' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
        >
          {lang === 'ja' ? '利用規約' : 'Terms of Service'}
        </a>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'var(--pd-font-body)',
          lineHeight: 1.5,
        }}
      >
        <span>
          Created by{' '}
          <a
            href="https://akihiro-uezono.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
          >
            Akihiro Uezono
          </a>
        </span>
        <span>© 2026 PixDone</span>
      </div>
      <a
        href="https://www.producthunt.com/products/pixdone-todo-app-with-pixel-effects?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-pixdone"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1119592&theme=light&t=1776156649500"
          alt="PixDone - Earn random pixel rewards every time you smash a task | Product Hunt"
          width={250}
          height={54}
        />
      </a>
    </footer>
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
