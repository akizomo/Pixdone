import {
  useState, useCallback, useEffect, useRef, useMemo, useSyncExternalStore, Component,
  type MutableRefObject, type ErrorInfo, type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, Button, Chip, IconButton, ModalDialog, ToastProvider, useToast, PopoverMenu } from './design-system';
import {
  ListHeader, ListTabs, TaskItem, SmashListPanel, TutorialPanel, ThemeSelector,
  TaskForm, type TaskFormHandle, ListModal, AuthModal, BottomNav, FocusScreen,
  UpsellModal,
} from './components';
import type { ListModalMode, ActiveScreen } from './components';
import { useLists } from './features/useLists';
import { SMASH_TITLES } from './features/useLists';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { usePerfectTimingSetup, type PerfectTimingBridgeCallbacks } from './hooks/usePerfectTimingSetup';
import { useMidnightRefresh } from './hooks/useMidnightRefresh';
import { useTaskListSwipe } from './hooks/useTaskListSwipe';
import { useActiveTaskLongPressReorder } from './hooks/useActiveTaskLongPressReorder';
import { playSound, getSoundEnabled } from './services/sound';
import { initSoundEngine } from './services/soundEngine';
import { useFocusTimer } from './hooks/useFocusTimer';
import { stopBgm, startBgm, isBgmOn, getBgmTrack, isBgmContextSuspended } from './services/bgm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useThemeEntitlements } from './hooks/useThemeEntitlements';
import { useEffectProgress } from './hooks/useEffectProgress';
import { useActiveChallenge } from './hooks/useActiveChallenge';
import { ChallengeMenu } from './components/ChallengeMenu';
import { runVanillaCompletionEffect } from './services/taskAnimations';
import { t } from './lib/i18n';
import { trackTaskComplete, trackTaskAdd, trackListCreate, trackEffectTriggered, trackChallengeUnlocked } from './services/analytics';
import { COMMON_EFFECTS, EFFECTS_REGISTRY, buildDrawPool, weightedRandomEffect, buildTutorialDrawPool, weightedRandomEffectTutorial, pickGuaranteedRareOrEpic } from './data/effectsRegistry';
import { resolveAnimationKey } from './data/effectEvolution';
import './styles/task-animations.css';
import type { List } from './types/list';
import type { Task } from './types/task';
import type { BgmTrack } from './services/bgm';
import { FocusZenMode } from './components/FocusZenMode';
import { MobileTaskSheet, type MobileTaskSheetHandle } from './components/MobileTaskSheet';
import { PricingPage } from './pages/PricingPage';
import { AccountPage } from './pages/AccountPage';
import { CollectionPage } from './pages/CollectionPage';
import { EffectRequestPage } from './pages/EffectRequestPage';
import { useUserTheme } from './hooks/useUserTheme';

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
  const {
    lists, activeListId, setActiveList, currentList,
    addList, renameList, deleteList,
    addTask, updateTask, deleteTask, completeTask, uncompleteTask,
    moveTask,
    reorderActiveTasks,
    resetRepeatingTasks,
    listLimitUpsellOpen, closeListLimitUpsell,
  } = useLists();

  const { user, logout, syncServerSession } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSubPage = pathname === '/pricing' || pathname === '/account' || pathname === '/effect-request';

  const [lang, setLang] = useState<'en' | 'ja'>(() => {
    try { return (localStorage.getItem('pixdone-lang') as 'en' | 'ja') ?? 'en'; } catch { return 'en'; }
  });

  const changeLang = useCallback((l: 'en' | 'ja') => {
    setLang(l);
    try { localStorage.setItem('pixdone-lang', l); } catch { /* ignore */ }
  }, []);

  // UI state
  const [signupOpen, setSignupOpen] = useState(false);
  const [plusIntroOpen, setPlusIntroOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // userMenuRef removed — PopoverMenu handles outside-click internally
  const [focusZenOpen, setFocusZenOpen] = useState(false);

  // Desktop: null = closed, 'add' = new task, task.id = editing
  const [taskFormMode, setTaskFormMode] = useState<null | 'add' | string>(null);
  // Ref to trigger close-to-save from parent (BottomSheet backdrop, outside-click, etc.)
  const taskFormRef = useRef<TaskFormHandle>(null);
  // Mobile: self-contained BottomSheet (same pattern as ChallengeMenu)
  const mobileTaskSheetRef = useRef<MobileTaskSheetHandle>(null);

  // Completed section
  const [completedExpanded, setCompletedExpanded] = useState(false);

  // Swipe list-enter direction (applied only to a specific next activeListId)
  const [listSlide, setListSlide] = useState<{ listId: string; from: 'left' | 'right' } | null>(null);

  // List modal state
  const [listModal, setListModal] = useState<{ mode: ListModalMode; listId?: string } | null>(null);

  // Delete task confirmation
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<string | null>(null); // taskId

  // Stripe purchase redirect banner
  const [purchaseBanner, setPurchaseBanner] = useState<'plus_success' | null>(null);

  /* ---- Screen navigation ---- */
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('tasks');
  const hasFinePointer = useSyncExternalStore(subscribeFinePointer, getFinePointerSnapshot, () => true);
  const isDesktop = hasFinePointer;
  const preferInlineTaskUi = hasFinePointer;

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
  const { progress: effectProgressMap, ownedChallengeEffects, challengeProgressMap, optimisticIncrement } = useEffectProgress();
  const activeChallenge = useActiveChallenge(challengeProgressMap, ownedChallengeEffects);
  useEffect(() => {
    const w = window as unknown as {
      taskAnimationEffects?: { comicEffects?: { setUserPlan: (plan: string) => void } };
    };
    w.taskAnimationEffects?.comicEffects?.setUserPlan(userPlan);
  }, [userPlan]);


  /* ---- Touch-first UI: viewport narrow while inline was open → BottomSheet ---- */
  useEffect(() => {
    if (preferInlineTaskUi) return;
    if (taskFormMode === 'add') {
      mobileTaskSheetRef.current?.openAdd();
      setTaskFormMode(null);
      return;
    }
    if (taskFormMode) {
      mobileTaskSheetRef.current?.openEdit(taskFormMode);
      setTaskFormMode(null);
    }
  }, [preferInlineTaskUi, taskFormMode, currentList?.id]);

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
  const isSmash =
    activeListId === 'smash-list' ||
    currentList?.id === 'smash-list' ||
    currentList?.name === '💥 Smash List';
  const isTutorial = currentList?.id === 'default';

  const isFocusScreen = activeScreen === 'focus';
  const isCollectionScreen = activeScreen === 'collection';
  const isTasksScreen = activeScreen === 'tasks';

  const { visualTheme, changeTheme, colorMode } = useUserTheme();

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

  /* ---- Collection tab initial state (for "See all" deep-link) ---- */
  const [collectionInitialTab, setCollectionInitialTab] = useState<'effects' | 'themes'>('effects');
  const [collectionInitialEffectKey, setCollectionInitialEffectKey] = useState<string | null>(null);

  /* ---- Sync active effects to vanilla effect engine ---- */
  useEffect(() => {
    const w = window as unknown as {
      taskAnimationEffects?: { comicEffects?: { setActiveEffects: (keys: string[]) => void } };
    };
    w.taskAnimationEffects?.comicEffects?.setActiveEffects(activeEffects);
  }, [activeEffects]);

  const allTasks = currentList?.tasks ?? [];
  const activeTasks = allTasks.filter((t) => !t.completed);
  const completedTasks = allTasks.filter((t) => t.completed);

  // editingTask is only used for inline (desktop) editing now.
  // Mobile editing is fully handled inside MobileTaskSheet.
  const editingTask =
    typeof taskFormMode === 'string' && taskFormMode !== 'add'
      ? allTasks.find((t) => t.id === taskFormMode) ?? null
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
    onSelect: (id) => { setListSlide(null); setActiveList(id); setTaskFormMode(null); },
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

  /* ---- Challenge progress: optimistic + deduplicate + retry on 401 ---- */
  const countedTaskIds = useRef(new Set<string>());

  const sendChallengeProgress = useCallback((taskId: string) => {
    if (countedTaskIds.current.has(taskId)) return;
    countedTaskIds.current.add(taskId);

    // Optimistic: bump local progress instantly so the UI updates before the API responds
    if (activeChallenge && !activeChallenge.isCompleted) {
      optimisticIncrement(activeChallenge.effect.key);

      // Detect completion: current progress (before increment) + 1 == threshold
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
    }

    const postTaskComplete = () =>
      fetch('/api/effect-progress/task-complete', { method: 'POST', credentials: 'include' });

    const attempt = (retries: number) => {
      postTaskComplete()
        .then(r => {
          if (r.status === 401 && retries > 0) {
            // セッション未確立の可能性 → 再同期してからリトライ
            syncServerSession().then(() => {
              setTimeout(() => attempt(retries - 1), 500);
            });
            return;
          }
          if (!r.ok) {
            console.warn('[Challenge] task-complete failed:', r.status);
          }
          // optimistic increment が既にローカル状態を更新済み — refetch 不要
          // 次回マウント時にサーバーと自動マージされる
        })
        .catch(e => console.warn('[Challenge] task-complete error:', e));
    };
    attempt(3);
  }, [activeChallenge, optimisticIncrement, showToast, lang, syncServerSession]);

  /* ---- Tutorial toast messages (per task) ---- */
  const showTutorialToast = useCallback((taskId: string, effectRarity?: string) => {
    if (!taskId.startsWith('tutorial-')) return;

    const rarityLabel = effectRarity === 'EPIC' ? (lang === 'ja' ? 'Epic' : 'Epic')
      : effectRarity === 'RARE' ? (lang === 'ja' ? 'Rare' : 'Rare')
      : null;

    const toasts: Record<string, { ja: string; en: string }> = {
      'tutorial-1': {
        ja: '✨ エフェクトは20種類以上、どんどん増えてる',
        en: '✨ 20+ effects — and more on the way',
      },
      'tutorial-2': {
        ja: rarityLabel
          ? `🏆 ${rarityLabel}エフェクト出た！チャレンジクリアで手に入れよう`
          : '🏆 Rare・Epicエフェクトはチャレンジクリアで手に入れよう',
        en: rarityLabel
          ? `🏆 ${rarityLabel} effect! Earn it by completing a challenge`
          : '🏆 Earn Rare & Epic effects by completing challenges',
      },
      'tutorial-3': {
        ja: '💥 ストレス発散にも、タスク管理にも使える',
        en: '💥 For stress relief and getting things done',
      },
      'tutorial-4': {
        ja: '🎵 BGMが集中を作り出す。サインアップして、集中時間を自分でセットしよう',
        en: '🎵 BGM puts you in the zone. Sign up to set your own focus time',
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
    const isTutorialTask = !user && isTutorial && taskId.startsWith('tutorial-');

    const doComplete = () => {
      completeTask(taskId);
      setTaskFormMode(null);
      mobileTaskSheetRef.current?.close();
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
        }
      }, finalKey);
    } else {
      doComplete();
      playSound('taskComplete');
      if (isTutorialTask) {
        showTutorialToast(taskId);
      }
    }

    // Analytics: task complete
    if (!isTutorialTask) {
      trackTaskComplete({
        list_type: isSmashList ? 'smash' : 'custom',
        is_repeat: !!(task as Task | undefined)?.repeat,
        has_subtasks: !!((task as Task | undefined)?.subtasks?.length),
      });
    }

    if (!isTutorialTask) sendChallengeProgress(taskId);
  }, [completeTask, isPremium, visualTheme, activeEffects, ownedChallengeEffects, sendChallengeProgress, user, isTutorial, showTutorialToast, forcedEffectKey]);

  const runCompleteFromPerfectTiming = useCallback((taskId: string) => {
    const doComplete = () => {
      completeTask(taskId);
      setTaskFormMode(null);
      mobileTaskSheetRef.current?.close();
    };
    window.setTimeout(doComplete, PERFECT_TIMING_STATE_DEFER_MS);
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
    setListSlide(null);
    setActiveList('smash-list');
    setTaskFormMode(null);
    mobileTaskSheetRef.current?.close();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById('pd-list-tab-smash')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }, [setActiveList]);

  const navigateToFocus = useCallback(() => {
    playSound('buttonClick');
    setActiveScreen('focus');
    setTaskFormMode(null);
    mobileTaskSheetRef.current?.close();
  }, []);

  const handleEdit = useCallback((taskId: string) => {
    if (preferInlineTaskUi) {
      // Inline editor (mouse / fine pointer — any viewport width)
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

  const availableListsForMove = lists
    .filter((l) => l.id !== 'smash-list' && l.id !== currentList?.id)
    .map((l) => ({ id: l.id, name: l.name }));

  const allListsForForm = lists
    .filter((l) => l.id !== 'smash-list')
    .map((l) => ({ id: l.id, name: l.name }));

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

  // Inline (desktop) task form handlers — mobile is fully inside MobileTaskSheet
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
    if (preferInlineTaskUi) {
      setTaskFormMode('add');
    } else {
      mobileTaskSheetRef.current?.openAdd();
    }
  }, [isSmash, currentList, handleSmash, preferInlineTaskUi]);

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

  const inlineTaskFormOpen = preferInlineTaskUi && taskFormMode !== null;
  // mobileSheetOpen is NOT included here — MobileTaskSheet is fully self-contained
  // (same as ChallengeMenu). The z-400 sheet covers everything so swipe/reorder
  // can't fire while it's open anyway.
  const anyModalOpen =
    signupOpen ||
    themeModalOpen ||
    listModal !== null ||
    deleteTaskConfirm !== null ||
    focusZenOpen ||
    inlineTaskFormOpen;

  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    const currentIdx = listTabsOrder.findIndex((l) => l.id === activeListId);
    if (currentIdx < 0) return;

    const nextIdx = dir === 'left' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0 || nextIdx >= listTabsOrder.length) return;

    const nextId = listTabsOrder[nextIdx]?.id;
    if (!nextId) return;

    // Swipe left => next list, new list should enter from the right.
    const from = dir === 'left' ? 'right' : 'left';
    setListSlide({ listId: nextId, from });

    setActiveList(nextId);
    setTaskFormMode(null);
    mobileTaskSheetRef.current?.close();
    setCompletedExpanded(false);
    playSound('buttonClick');
  }, [
    activeListId,
    listTabsOrder,
    setActiveList,
    setTaskFormMode,
    setCompletedExpanded,
  ]);

  const swipeRef = useTaskListSwipe({
    enabled: !isDesktop && !anyModalOpen && !isFocusScreen,
    onSwipe: handleSwipe,
  });

  const suppressRowClickUntilRef = useRef(0);
  const inlineTaskFormRef = useRef<HTMLDivElement>(null);

  /* Desktop inline TaskForm: dismiss on outside tap (close-to-save for edits) */
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
        // If a sub-menu (repeat dropdown, list selector) is open, close it first
        // and keep the form open. Next outside-click will close the form.
        if (taskFormRef.current?.dismissSubmenus()) return;
        // Use close-to-save: auto-saves dirty edits, falls back to cancel for new tasks
        taskFormRef.current ? taskFormRef.current.close() : handleTaskFormCancel();
      };
      document.addEventListener('pointerdown', downHandler, true);
    }, 0);
    return () => {
      window.clearTimeout(tid);
      if (downHandler) document.removeEventListener('pointerdown', downHandler, true);
    };
  }, [inlineTaskFormOpen, taskFormMode, handleTaskFormCancel]);

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
        !isFocusScreen &&
        !isSmash &&
        activeTasks.length >= 2 &&
        activeScreen === 'tasks',
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

  const listSlideClass =
    listSlide && listSlide.listId === activeListId
      ? listSlide.from === 'left'
        ? 'pd-list-enter--from-left'
        : 'pd-list-enter--from-right'
      : '';

  /* ---- Focus timer state (persist across navigation) ---- */
  const [focusMode, setFocusMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusPomodoroCount, setFocusPomodoroCount] = useState(0); // 0..3
  const [bgmOn, setBgmOnState] = useState<boolean>(() => isBgmOn());
  const [bgmTrack, setBgmTrackState] = useState<BgmTrack>(() => getBgmTrack());
  const [, setBgmMenuOpen] = useState(false);
  const prevBgmShouldPlayRef = useRef(false);
  const prevBgmTrackRef = useRef<BgmTrack>(bgmTrack);
  const focusModeRef = useRef(focusMode);
  useEffect(() => { focusModeRef.current = focusMode; }, [focusMode]);
  const focusCountRef = useRef(focusPomodoroCount);
  useEffect(() => { focusCountRef.current = focusPomodoroCount; }, [focusPomodoroCount]);

  const focusTimer = useFocusTimer(() => {
    const m = focusModeRef.current;
    if (m === 'pomodoro') playSound('focusPomodoroComplete');
    else playSound('focusBreakComplete');
    stopBgm();

    if (m === 'pomodoro') {
      // Count completed pomodoros; after 4 pomodoro-shortBreak cycles, trigger longBreak
      // on the SHORT BREAK end (not immediately after the 4th pomodoro end).
      const nextCount = (focusCountRef.current + 1) % 4;
      setFocusPomodoroCount(nextCount);
      setFocusMode('shortBreak');
      setFocusMinutes(5);
      focusTimerRef.current?.reset(5 * 60);
      return;
    }

    if (m === 'shortBreak') {
      if (focusCountRef.current === 0) {
        setFocusMode('longBreak');
        setFocusMinutes(15);
        focusTimerRef.current?.reset(15 * 60);
        return;
      }
    }

    // longBreak or remaining short breaks -> next pomodoro
    setFocusMode('pomodoro');
    setFocusMinutes(25);
    focusTimerRef.current?.reset(25 * 60);
  });
  // Store the latest focusTimer instance for onTimerEnd callback usage.
  // (Initialize with null to satisfy lint immutability constraints.)
  const focusTimerRef = useRef<ReturnType<typeof useFocusTimer> | null>(null);
  useEffect(() => { focusTimerRef.current = focusTimer; }, [focusTimer]);

  // Safety: ensure BGM is stopped on timer reaching 0
  useEffect(() => {
    if (focusTimer.remaining === 0) {
      stopBgm();
    }
  }, [focusTimer.remaining]);

  // Fail-safe: never keep BGM while timer is not running.
  useEffect(() => {
    if (focusTimer.timerState !== 'running') {
      stopBgm();
    }
  }, [focusTimer.timerState]);

  // Single playback authority with explicit switch semantics:
  // - running + BGM ON + remaining>0 + pomodoro mode only: play (no BGM during breaks)
  // - track change while playing: always stop old -> start new
  // - otherwise: stop
  useEffect(() => {
    const shouldPlay =
      bgmOn &&
      focusMode === 'pomodoro' &&
      focusTimer.timerState === 'running' &&
      focusTimer.remaining > 0;
    const wasPlaying = prevBgmShouldPlayRef.current;
    const prevTrack = prevBgmTrackRef.current;

    if (!shouldPlay) {
      stopBgm();
      prevBgmShouldPlayRef.current = shouldPlay;
      prevBgmTrackRef.current = bgmTrack;
      return;
    }

    // Extra safety: if AudioContext is suspended (some PWA background flows),
    // re-start the track from scratch.
    if (shouldPlay && isBgmContextSuspended()) {
      stopBgm();
      startBgm(bgmTrack);
      prevBgmShouldPlayRef.current = true;
      prevBgmTrackRef.current = bgmTrack;
      return;
    } else if (!wasPlaying) {
      startBgm(bgmTrack);
    } else if (prevTrack !== bgmTrack) {
      stopBgm();
      startBgm(bgmTrack);
    }

    prevBgmShouldPlayRef.current = shouldPlay;
    prevBgmTrackRef.current = bgmTrack;
  }, [bgmOn, bgmTrack, focusMode, focusTimer.timerState, focusTimer.remaining]);

  /* ---- Render ---- */

  const goHome = () => {
    navigate('/');
    setActiveScreen('tasks');
  };

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
              icon={<span className="material-icons">palette</span>}
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
                  icon={<span className="material-icons">person</span>}
                  onClick={() => setUserMenuOpen((v) => !v)}
                />
                {userMenuOpen && (
                  <PopoverMenu
                    items={[
                      { id: 'sound', label: soundMuted ? (lang === 'ja' ? 'サウンドオフ' : 'Sound off') : (lang === 'ja' ? 'サウンドオン' : 'Sound on'), icon: soundMuted ? 'volume_off' : 'volume_up' },
                      { id: 'support', label: lang === 'ja' ? 'Support PixDone' : 'Support PixDone', icon: 'favorite' },
                      { id: 'logout', label: lang === 'ja' ? 'ログアウト' : 'Log out', icon: 'logout' },
                    ]}
                    onSelect={(id) => {
                      if (id === 'sound') { toggleSound(); return; }
                      if (id === 'support') { playSound('buttonClick'); window.open('https://buymeacoffee.com/akizomo', '_blank', 'noopener,noreferrer'); return; }
                      if (id === 'logout') { setUserMenuOpen(false); playSound('taskComplete'); logout(); }
                    }}
                    onClose={() => { playSound('taskCancel'); setUserMenuOpen(false); }}
                    align="right"
                    className="pxd-user-menu"
                  >
                    {/* Email + plan badge */}
                    <div style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--pd-color-border-default)',
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--pd-color-text-secondary)',
                        fontFamily: 'var(--pd-font-body)',
                        wordBreak: 'break-all',
                        marginBottom: '8px',
                      }}>
                        {user.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Plan badge */}
                        <span style={{
                          fontFamily: 'var(--pd-font-brand)',
                          fontSize: '0.6rem',
                          letterSpacing: '1px',
                          padding: '2px 7px',
                          border: `1px solid ${userPlan === 'plus' ? 'var(--pd-color-accent-default)' : 'var(--pd-color-border-default)'}`,
                          color: userPlan === 'plus' ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-muted)',
                          background: userPlan === 'plus' ? 'var(--pd-color-accent-subtle)' : 'transparent',
                        }}>
                          {userPlan === 'plus' ? 'PIXDONE+' : 'FREE'}
                        </span>
                        {/* Upgrade CTA (free only) */}
                        {userPlan !== 'plus' && (
                          <Button variant="primary" size="sm" onClick={() => { setUserMenuOpen(false); navigate('/pricing'); }}>
                            {lang === 'ja' ? 'アップグレード →' : 'UPGRADE →'}
                          </Button>
                        )}
                        {/* Manage account (plus only) */}
                        {userPlan === 'plus' && (
                          <Button variant="secondary" size="sm" onClick={() => { setUserMenuOpen(false); navigate('/account'); }}>
                            {lang === 'ja' ? '管理 →' : 'MANAGE →'}
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Language */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderBottom: '1px solid var(--pd-color-border-default)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--pd-color-text-primary)', fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem' }}>
                        <span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>language</span>
                        {lang === 'ja' ? '言語' : 'Language'}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
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
                <Button variant="primary" onClick={() => { playSound('buttonClick'); setSignupOpen(true); }}>{lang === 'ja' ? '無料ではじめる' : 'Sign up free'}</Button>
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
          minHeight: 'calc(100vh + 80px)',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: focusZenOpen
            ? 0
            : isDesktop
              ? 'calc(48px + 16px + env(safe-area-inset-bottom))'
              : 'calc(56px + env(safe-area-inset-bottom))',
        }}
      >
      {!isFocusScreen && !isCollectionScreen && !isSubPage && (
        <ListTabs
          lists={listTabsOrder}
          activeListId={activeListId}
          onSelect={(id) => { setListSlide(null); setActiveList(id); setTaskFormMode(null); playSound('buttonClick'); }}
          onAddList={() => { playSound('buttonClick'); setListModal({ mode: 'add' }); }}
          getTabLabel={getTabLabel}
          getTabCount={getTabCount}
        />
      )}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingBottom: '48px' }}>
        {pathname === '/pricing' ? (
          <PricingPage />
        ) : pathname === '/account' ? (
          <AccountPage />
        ) : pathname === '/effect-request' ? (
          <EffectRequestPage />
        ) : isCollectionScreen ? (
          <CollectionPage
            key={`${collectionInitialTab}-${collectionInitialEffectKey ?? ''}`}
            lang={lang}
            isPremium={isPremium}
            activeEffects={activeEffects}
            setActiveEffects={setActiveEffects}
            activeTheme={visualTheme}
            changeTheme={changeTheme}
            colorMode={colorMode}
            initialTab={collectionInitialTab}
            initialEffectKey={collectionInitialEffectKey}
            ownedChallengeEffects={ownedChallengeEffects}
            challengeProgressMap={challengeProgressMap}
            effectProgressMap={effectProgressMap}
            onRequestEffect={() => navigate('/effect-request')}
          />
        ) : isFocusScreen ? (
          <FocusScreen
            lists={lists}
            lang={lang}
            canAdjustMinutes={!!user}
            onCompleteTask={handleComplete}
            onEditTask={handleEdit}
            mode={focusMode}
            minutes={focusMinutes}
            pomodoroCount={focusPomodoroCount}
            timerState={focusTimer.timerState}
            remaining={focusTimer.remaining}
            bgmOn={bgmOn}
            bgmTrack={bgmTrack}
            onBgmChange={({ bgmOn: nextOn, track: nextTrack }) => {
              setBgmOnState(nextOn);
              setBgmTrackState(nextTrack);
            }}
            onBgmMenuOpenChange={setBgmMenuOpen}
            onOpenZenMode={() => { playSound('buttonClick'); setFocusZenOpen(true); }}
            onSwitchMode={(m) => {
              playSound('buttonClick');
              setFocusMode(m);
              const nextMin = m === 'pomodoro' ? 25 : m === 'shortBreak' ? 5 : 15;
              setFocusMinutes(nextMin);
              focusTimer.reset(nextMin * 60);
              stopBgm();
              setBgmMenuOpen(false);
            }}
            onAdjustMinutes={(deltaMin) => {
              if (!user || focusTimer.timerState !== 'idle') return;
              playSound('buttonClick');
              const next = Math.min(60, Math.max(1, focusMinutes + deltaMin));
              setFocusMinutes(next);
              focusTimer.reset(next * 60);
            }}
            onStart={() => { playSound('buttonClick'); focusTimer.start(); }}
            onPause={() => { playSound('buttonClick'); focusTimer.pause(); stopBgm(); }}
            onResume={() => { playSound('buttonClick'); focusTimer.resume(); }}
            onSkipBreak={() => {
              if (!(focusMode === 'shortBreak' || focusMode === 'longBreak')) return;
              playSound('taskCancel');
              stopBgm();
              setFocusMode('pomodoro');
              setFocusMinutes(25);
              focusTimer.reset(25 * 60);
              setBgmMenuOpen(false);
            }}
            onCompleteFocus={() => {
              playSound('taskComplete');
              setFocusMode('shortBreak');
              setFocusMinutes(5);
              focusTimer.reset(5 * 60);
              stopBgm();
              setBgmMenuOpen(false);
            }}
            onTutorialSmashLinkClick={navigateToSmashList}
            onTutorialFocusLinkClick={navigateToFocus}
          />
        ) : (
          <>
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
                  {lang === 'ja' ? 'タスクを追加' : 'Add a task'}
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
                    headline={lang === 'ja' ? 'チュートリアル完了！' : "You've completed the tutorial!"}
                    subtext=""
                    featuresLabel={lang === 'ja' ? 'サインアップで使えること' : 'What you unlock for free'}
                    freeFeatures={lang === 'ja' ? [
                      { icon: '💾', label: 'データ保存・同期' },
                      { icon: '📋', label: '柔軟なタスク管理（リスト・リピート）' },
                      { icon: '⏱', label: 'タイマー設定' },
                      { icon: '🏆', label: 'チャレンジでエフェクトを集める' },
                    ] : [
                      { icon: '💾', label: 'Save & sync' },
                      { icon: '📋', label: 'Flexible task management (lists & repeats)' },
                      { icon: '⏱', label: 'Timer settings' },
                      { icon: '🏆', label: 'Challenges & effect collection' },
                    ]}
                    buttonLabel={lang === 'ja' ? 'サインアップ（無料）' : 'Sign up — free'}
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
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onTutorialSmashLinkClick={navigateToSmashList}
                          onTutorialFocusLinkClick={navigateToFocus}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : allTasks.length === 0 && taskFormMode !== 'add' ? (
            /* AC 14.1: No tasks at all – "READY?" (vanilla parity: game-start-empty) */
            <div className="game-start-empty">
              <div className="game-start-content">
                <div className="ready-text">{t('emptyReady', lang)}</div>
                <div className="start-instruction">{t('emptyReadySub', lang)}</div>
              </div>
            </div>
          ) : activeTasks.length === 0 && completedTasks.length > 0 && taskFormMode !== 'add' ? (
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
                      <TaskItem key={task.id} task={task} lang={lang} onComplete={handleUncomplete} onEdit={handleEdit} onDelete={handleDelete} onTutorialSmashLinkClick={navigateToSmashList} onTutorialFocusLinkClick={navigateToFocus} />
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
                        onComplete={handleComplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onMoveToList={handleMoveToList}
                        availableLists={availableListsForMove}
                        onTutorialSmashLinkClick={navigateToSmashList}
                        onTutorialFocusLinkClick={navigateToFocus}
                        suppressOpenEdit={() => Date.now() < suppressRowClickUntilRef.current}
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
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onTutorialSmashLinkClick={navigateToSmashList}
                          onTutorialFocusLinkClick={navigateToFocus}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Mobile FAB */}
      {!anyModalOpen && isTasksScreen && !isSubPage && (
        <button
          type="button"
          onClick={openAddTask}
          aria-label={lang === 'ja' ? 'タスクを追加' : 'Add a task'}
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
            ? <span aria-hidden="true">💥</span>
            : <span className="material-icons" aria-hidden="true" style={{ fontSize: '24px', lineHeight: 1 }}>add</span>
          }
        </button>
      )}

      {/* Mobile BottomSheet for task add/edit — self-contained, same pattern as ChallengeMenu */}
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

      {/* Bottom navigation */}
      {!focusZenOpen && (
        <BottomNav
          activeScreen={isSubPage ? null : activeScreen}
          onSelect={(screen) => {
            playSound('buttonClick');
            if (screen === 'collection') setCollectionInitialEffectKey(null);
            setActiveScreen(screen);
            if (isSubPage) navigate('/');
            }}
          lang={lang}
          showCollection={!!user}
        />
      )}

      {/* Focus Zen mode (full-screen, hides header/bottom nav) */}
      {focusZenOpen && (
        <FocusZenMode
          lang={lang}
          mode={focusMode}
          timerState={focusTimer.timerState}
          remaining={focusTimer.remaining}
          totalSeconds={focusMinutes * 60}
          bgmOn={bgmOn}
          bgmTrack={bgmTrack}
          onBgmChange={({ bgmOn: nextOn, track: nextTrack }) => {
            setBgmOnState(nextOn);
            setBgmTrackState(nextTrack);
          }}
          onBgmMenuOpenChange={setBgmMenuOpen}
          onClose={() => { playSound('taskCancel'); setFocusZenOpen(false); setBgmMenuOpen(false); }}
          onStart={() => { playSound('buttonClick'); focusTimer.start(); }}
          onPause={() => { playSound('buttonClick'); focusTimer.pause(); stopBgm(); }}
          onResume={() => { playSound('buttonClick'); focusTimer.resume(); }}
          onSkipBreak={() => {
            if (!(focusMode === 'shortBreak' || focusMode === 'longBreak')) return;
            playSound('taskCancel');
            stopBgm();
            setFocusMode('pomodoro');
            setFocusMinutes(25);
            focusTimer.reset(25 * 60);
            setBgmMenuOpen(false);
          }}
          onCompleteFocus={() => {
            playSound('taskComplete');
            setFocusMode('shortBreak');
            setFocusMinutes(5);
            focusTimer.reset(5 * 60);
            stopBgm();
            setBgmMenuOpen(false);
          }}
        />
      )}

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

      {/* List limit upsell */}
      <UpsellModal
        open={listLimitUpsellOpen}
        onClose={closeListLimitUpsell}
        reason="list-limit"
        lang={lang}
      />

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
        marginTop: 'auto',
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
      </footer>
      {/* Footer legal links intentionally shown even when menu hides them. */}
    </div>
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
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  );
}
