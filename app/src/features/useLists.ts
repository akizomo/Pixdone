import { useState, useCallback, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import type { List } from '../types/list';
import type { Task, Subtask } from '../types/task';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import { hasActiveRepeat, getNextDueDate } from '../lib/repeat';

const STORAGE_KEY = 'pixdone_lists_v1';
const ACTIVE_KEY = 'pixdone_active_v1';

/** 完了タスクを保持する日数。これを過ぎたら自動削除。 */
const COMPLETED_TASK_RETENTION_DAYS = 7;

/** completedAt が保持期間を超えているか判定 */
export function isExpiredCompletedTask(task: Task, now: Date = new Date()): boolean {
  if (!task.completed || !task.completedAt) return false;
  const completedMs = new Date(task.completedAt).getTime();
  if (Number.isNaN(completedMs)) return false;
  const cutoffMs = now.getTime() - COMPLETED_TASK_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return completedMs < cutoffMs;
}

function orderTasksForList(tasks: Task[]): Task[] {
  const active = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  const useSort = active.some((t) => typeof t.sortOrder === 'number');
  const sortedActive = useSort
    ? [...active].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id.localeCompare(b.id),
      )
    : active;
  return [...sortedActive, ...completed];
}

// Smash list dummy tasks – mirror vanilla `public/script.js` smashListTasks / smashListTasksJa
export const SMASH_TITLES = {
  en: [
    'Fix the coffee machine',
    'Buy milk and bread',
    'Call mom',
    'Clean the garage',
    'Organize email inbox',
    'Fix the leaky faucet',
    'Plan weekend trip',
    'Read 30 pages of a book',
    'Go for a 30-minute walk',
    'Backup computer files',
    'Wash the car',
    'Water the plants',
    'Take out the trash',
    'Pay electricity bill',
    'Vacuum the living room',
    'Sort through old clothes',
    'Exercise for 20 minutes',
    'Check bank balance',
    'Update phone contacts',
    'Charge all devices',
    'Finish the laundry',
    'Make grocery list',
    'Review monthly budget',
    'Call the dentist',
    'Fix the broken drawer',
    'Learn a new word',
    'Stretch for 10 minutes',
    'Write in journal',
    'Reply to messages',
    'Dust the furniture',
    'Organize desk drawer',
    'Check car oil',
    'Practice a hobby',
    'Send thank you note',
    'Delete old photos',
    'Clean the windows',
    'Update software',
    'Prepare lunch',
    'Call old friend',
    'Do 10 pushups',
    'Organize bookshelf',
    'Check weather forecast',
    'Trim fingernails',
    'Unsubscribe from emails',
    'Take a 5-minute break',
    'Smile at yourself',
    'Drink a glass of water',
    'Take a deep breath',
    'High-five yourself',
    'Say something nice',
    // Legacy Firestore initial tasks – keep same as vanilla
    'Check notifications',
    'Organize desk',
    'Review emails',
    'Take deep breaths',
    'Stretch muscles',
    'Clear browser tabs',
    'Clean keyboard',
    'Water plants',
    'Tidy up files',
    'Quick workout',
  ],
  ja: [
    'コーヒーメーカーを直す',
    '牛乳とパンを買う',
    '母に電話する',
    'ガレージを掃除する',
    'メールの受信箱を整理する',
    '蛇口の漏水を直す',
    '週末の旅行を計画する',
    '本を30ページ読む',
    '30分散歩する',
    'パソコンのバックアップ',
    '車を洗う',
    '植物に水をやる',
    'ゴミを出す',
    '電気代を払う',
    'リビングを掃除機がけする',
    '古い服を整理する',
    '20分運動する',
    '残高を確認する',
    '連絡先を更新する',
    'デバイスを充電する',
    '洗濯を終わらせる',
    '買い物リストを作る',
    '月の予算を見直す',
    '歯医者に電話する',
    '壊れた引き出しを直す',
    '新しい単語を覚える',
    '10分ストレッチする',
    '日記を書く',
    'メッセージに返信する',
    '家具のホコリを払う',
    '机の引き出しを整理する',
    '車のオイルを確認する',
    '趣味の練習をする',
    'お礼のメッセージを送る',
    '古い写真を削除する',
    '窓を拭く',
    'ソフトを更新する',
    'お弁当を用意する',
    '昔の友達に電話する',
    '腕立て10回する',
    '本棚を整理する',
    '天気予報を確認する',
    '爪を切る',
    'メルマガを解除する',
    '5分休憩する',
    '自分に微笑む',
    '水を一杯飲む',
    '深呼吸する',
    '自分とハイタッチする',
    '自分を褒める',
    // Legacy Firestore initial tasks – same order
    '通知を確認する',
    '机を整理する',
    'メールを確認する',
    '深呼吸する',
    'ストレッチする',
    'ブラウザのタブを閉じる',
    'キーボードを掃除する',
    '植物に水をやる',
    'ファイルを整理する',
    '軽い運動をする',
  ],
};

function replenishSmashList(tasks: Task[], listId: string): Task[] {
  const active = tasks.filter((t) => !t.completed);
  const result = [...active];
  while (result.length < 3) {
    const idx = Math.floor(Math.random() * SMASH_TITLES.en.length);
    result.push({
      id: `smash-${Date.now()}-${Math.random()}`,
      title: SMASH_TITLES.en[idx],
      smashIdx: idx,
      completed: false, dueDate: null, listId,
    });
  }
  return result.slice(0, 3);
}

function ensureVirtualSmashList(lists: List[]): List[] {
  const existing = lists.find((l) => l.id === 'smash-list');
  if (existing) {
    if (existing.tasks.length >= 3) return lists;
    return lists.map((l) =>
      l.id === 'smash-list' ? { ...l, tasks: replenishSmashList(l.tasks, 'smash-list') } : l,
    );
  }

  // Smash List is an "effect playground" list; keep it local-only (not persisted).
  return [
    ...lists,
    { id: 'smash-list', name: '💥 Smash List', tasks: replenishSmashList([], 'smash-list') },
  ];
}



/** Guest-only default: just the Smash List; no tutorial (tutorial is now seeded post-login). */
const guestDefaultLists: List[] = [
  {
    id: 'default',
    name: 'My Tasks',
    tasks: [] as Task[],
  },
];

function loadLists(): List[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as List[];
      const hasDefault = Array.isArray(parsed) && parsed.some((l) => l.id === 'default');
      if (!hasDefault) return guestDefaultLists;
      // Smash List のダミータスクが不足している場合は 3 件に補充
      const withSmash = parsed.map((l) => {
        const isSmash = l.id === 'smash-list' || l.name === '💥 Smash List';
        if (!isSmash || l.tasks.length >= 3) return l;
        return { ...l, tasks: replenishSmashList(l.tasks, l.id) };
      });
      return withSmash;
    }
  } catch { /* ignore */ }
  return guestDefaultLists;
}

function loadActiveId(lists: List[]): string {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw && raw !== 'smash-list' && lists.some((l) => l.id === raw)) return raw;
  } catch { /* ignore */ }
  return lists.some((l) => l.id === 'default') ? 'default' : (lists[0]?.id ?? 'default');
}

export function useLists() {
  const { user } = useAuth();
  const { isPremium } = useThemeEntitlements();

  const [lists, setListsState] = useState<List[]>(() => loadLists());
  const [listLimitUpsellOpen, setListLimitUpsellOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(() => {
    const initial = loadLists();
    return loadActiveId(initial);
  });

  const setLists = useCallback((updater: List[] | ((prev: List[]) => List[])) => {
    setListsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (prev: List[]) => List[])(prev) : updater;
      if (!user) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  }, [user]);

  const setActiveList = useCallback((id: string) => {
    setActiveId(id);
    if (!user) {
      try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* ignore */ }
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      try { localStorage.setItem(ACTIVE_KEY, activeId); } catch { /* ignore */ }
    }
  }, [activeId, user]);

  const prevUserRef = useRef(user);
  useEffect(() => {
    const prev = prevUserRef.current;
    prevUserRef.current = user;
    if (prev && !user) {
      const fresh = loadLists();
      setListsState(fresh);
      setActiveId(fresh.some((l) => l.id === 'default') ? 'default' : (fresh[0]?.id ?? 'default'));
    }
  }, [user]);

  /**
   * After reload or Firestore sync, activeId may point at a deleted / optimistic id that no longer
   * exists in `lists`. Then no tab matches, swipe findIndex is -1, and UI looks broken.
   * Snap to the first available list.
   */
  useEffect(() => {
    if (lists.length === 0) return;
    if (lists.some((l) => l.id === activeId)) return;
    const fallback = lists[0]?.id;
    if (fallback) {
      setActiveList(fallback);
    }
  }, [lists, activeId, setActiveList]);

  /* ---- Firestore sync when authenticated ---- */
  useEffect(() => {
    if (!user) return;

    const listsQuery = query(
      collection(db, 'lists'),
      where('uid', '==', user.uid),
    );

    let autoCreateFired = false;

    const unsubLists = onSnapshot(listsQuery, (snap) => {
      // Firestore にリストが0件 → デフォルトリストを1回だけ自動作成
      if (snap.empty) {
        if (!autoCreateFired) {
          autoCreateFired = true;
          addDoc(collection(db, 'lists'), {
            uid: user.uid,
            name: 'My Tasks',
            createdAt: Timestamp.now(),
          }).catch((e) => console.warn('[useLists] auto-create default list failed:', e));
        }
        return;
      }

      setListsState((prev) => {
        const tasksById = new Map<string, Task[]>();
        prev.forEach((l) => tasksById.set(l.id, l.tasks));
        const nextFromFirestore: List[] = snap.docs
          .map((d) => {
            const data = d.data() as any;
            const rawSort = data.sortMode;
            const sortMode: List['sortMode'] =
              rawSort === 'manual' || rawSort === 'dueDate' || rawSort === 'priority' || rawSort === 'createdAt' || rawSort === 'alphabetical'
                ? rawSort
                : undefined;
            return {
              id: d.id,
              name: data.name ?? 'My Tasks',
              tasks: tasksById.get(d.id) ?? [],
              sortMode,
            };
          })
          // If user once created a Firestore "Smash List", ignore it; we keep Smash local-only.
          .filter((l) => l.name !== '💥 Smash List')
          // Tutorial list always first
          .sort((a, b) => (a.name === 'Tutorial' ? -1 : b.name === 'Tutorial' ? 1 : 0));
        return ensureVirtualSmashList(nextFromFirestore);
      });
    });

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('uid', '==', user.uid),
    );

    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      const tasksByList: Record<string, Task[]> = {};
      // Tasks whose repeat deadline has arrived: uncomplete + write back.
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const toResetOnServer: { id: string; subtasks?: Subtask[] }[] = [];

      snap.docs.forEach((d) => {
        const data = d.data() as any;
        const listId = data.listId as string | undefined;
        if (!listId) return;
        const due = data.dueDate;
        let dueDate: string | null = null;
        if (due instanceof Timestamp) {
          dueDate = due.toDate().toISOString().slice(0, 10);
        } else if (typeof due === 'string') {
          dueDate = due;
        } else {
          dueDate = null;
        }
        const rawPriority = data.priority;
        const priority: Task['priority'] =
          rawPriority === 'high' || rawPriority === 'medium' || rawPriority === 'low'
            ? rawPriority
            : undefined;
        let completed = !!data.completed;
        let subtasks = data.subtasks ?? [];
        // Repeating task auto-reset: if completed and next dueDate has arrived, revive it.
        if (completed && hasActiveRepeat(data.repeat) && dueDate && dueDate <= todayStr) {
          completed = false;
          const resetSubs = Array.isArray(subtasks)
            ? (subtasks as Subtask[]).map((s) => ({ ...s, done: false }))
            : [];
          subtasks = resetSubs;
          toResetOnServer.push({ id: d.id, subtasks: resetSubs });
        }
        const task: Task = {
          id: d.id,
          title: data.title ?? '',
          completed,
          dueDate,
          details: data.details ?? '',
          repeat: data.repeat ?? 'none',
          subtasks,
          listId,
          priority,
          sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : undefined,
        };
        if (!tasksByList[listId]) tasksByList[listId] = [];
        tasksByList[listId].push(task);
      });

      setListsState((prev) =>
        prev.map((l) => {
          if (l.id === 'smash-list') return l; // keep local-only
          const raw = tasksByList[l.id] ?? l.tasks;
          return { ...l, tasks: orderTasksForList(raw) };
        }),
      );

      // Write-back to Firestore (fire-and-forget; optimistic UI already applied).
      for (const r of toResetOnServer) {
        const ref = doc(db, 'tasks', r.id);
        const updates: Record<string, unknown> = { completed: false };
        if (r.subtasks) updates.subtasks = r.subtasks;
        updateDoc(ref, updates).catch(() => {});
      }
    });

    return () => {
      unsubLists();
      unsubTasks();
    };
  }, [user]);

  /* ---- 完了タスク自動削除（7日経過） ---- */
  useEffect(() => {
    const now = new Date();

    setLists((prev) => {
      const expired: { id: string; listId: string }[] = [];
      const next = prev.map((l) => {
        if (l.id === 'smash-list') return l;
        const kept: Task[] = [];
        for (const t of l.tasks) {
          if (isExpiredCompletedTask(t, now)) {
            expired.push({ id: t.id, listId: l.id });
          } else {
            kept.push(t);
          }
        }
        return kept.length === l.tasks.length ? l : { ...l, tasks: kept };
      });

      // Firestore から期限切れタスクを削除
      if (user && expired.length > 0) {
        (async () => {
          const batch = writeBatch(db);
          for (const { id } of expired) {
            batch.delete(doc(db, 'tasks', id));
          }
          try {
            await batch.commit();
          } catch (e) {
            console.warn('[useLists] cleanup batch failed:', e);
          }
        })();
      }

      return next;
    });
    // マウント時 + ユーザー変更時に1回だけ実行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ---- List CRUD ---- */
  const addList = useCallback((name: string) => {
    // Smash List is virtual; don't create in Firestore/localStorage.
    if (name === '💥 Smash List') {
      setLists((prev) => ensureVirtualSmashList(prev));
      setActiveList('smash-list');
      return;
    }

    // Free plan: max 3 normal lists (Smash List not counted)
    if (!isPremium) {
      const normalListCount = lists.filter((l) => l.id !== 'smash-list').length;
      if (normalListCount >= 3) {
        setListLimitUpsellOpen(true);
        return;
      }
    }

    const optimisticId = `list-${Date.now()}`;

    if (user) {
      // optimistic local update
      setLists((prev) => [...prev, { id: optimisticId, name, tasks: [] as Task[] }]);
      setActiveList(optimisticId);

      (async () => {
        const listsCol = collection(db, 'lists');
        await addDoc(listsCol, {
          uid: user.uid,
          name,
          createdAt: Timestamp.now(),
        });
      })();
    } else {
      const id = optimisticId;
      setLists((prev) => [...prev, { id, name, tasks: [] as Task[] }]);
      setActiveList(id);
    }
  }, [setLists, setActiveList, user, isPremium, lists]);

  const setListSortMode = useCallback((listId: string, sortMode: NonNullable<List['sortMode']>) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, sortMode } : l)));
    if (user && listId !== 'smash-list') {
      (async () => {
        try {
          const ref = doc(db, 'lists', listId);
          await updateDoc(ref, { sortMode });
        } catch { /* optimistic UI already applied */ }
      })();
    }
  }, [setLists, user]);

  const renameList = useCallback((listId: string, name: string) => {
    if (user) {
      setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name } : l)));
      (async () => {
        const ref = doc(db, 'lists', listId);
        await updateDoc(ref, { name });
      })();
    } else {
      setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name } : l)));
    }
  }, [setLists, user]);

  const deleteList = useCallback((listId: string, allLists: List[]) => {
    if (listId === 'default') return; // default "My Tasks" is the inbox — never deletable
    if (user) {
      const remaining = allLists.filter((l) => l.id !== listId);
      setLists(remaining);
      if (activeId === listId) {
        const newActive = remaining[0]?.id ?? '';
        setActiveList(newActive);
      }
      (async () => {
        const ref = doc(db, 'lists', listId);
        await deleteDoc(ref);
      })();
    } else {
      const remaining = allLists.filter((l) => l.id !== listId);
      setLists(remaining);
      if (activeId === listId) {
        const newActive = remaining[0]?.id ?? '';
        setActiveList(newActive);
      }
    }
  }, [setLists, setActiveList, activeId, user]);

  /* ---- Task CRUD ---- */
  const addTask = useCallback((listId: string, fields: Partial<Task> & { title: string }): Task => {
    const optimisticId = listId === 'smash-list' ? `smash-${Date.now()}-${Math.random()}` : `task-${Date.now()}`;
    const base: Task = {
      id: optimisticId,
      title: fields.title,
      completed: false,
      dueDate: fields.dueDate ?? null,
      details: fields.details,
      repeat: fields.repeat ?? 'none',
      subtasks: fields.subtasks ?? [],
      listId,
      priority: fields.priority,
    };

    let created: Task = base;
    let sortOrderForDb = 0;

    // まずローカルを更新（ログイン・未ログイン共通）
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        if (listId === 'smash-list') {
          return { ...l, tasks: replenishSmashList([...(l.tasks ?? []), base], 'smash-list') };
        }
        const active = l.tasks.filter((t) => !t.completed);
        const maxSort = active.reduce((m, t) => Math.max(m, t.sortOrder ?? -1), -1);
        sortOrderForDb = maxSort + 1;
        created = { ...base, sortOrder: sortOrderForDb };
        return { ...l, tasks: [...l.tasks, created] };
      }),
    );

    // Smash List is local-only; never write it to Firestore.
    if (user && listId !== 'smash-list') {
      (async () => {
        const ref = doc(collection(db, 'tasks'));
        await setDoc(ref, {
          uid: user.uid,
          listId,
          title: base.title,
          details: base.details ?? '',
          dueDate: base.dueDate,
          repeat: base.repeat ?? 'none',
          subtasks: base.subtasks ?? [],
          completed: base.completed,
          createdAt: Timestamp.now(),
          sortOrder: sortOrderForDb,
          ...(base.priority ? { priority: base.priority } : {}),
        });
      })();
    }

    return created;
  }, [setLists, user]);

  const updateTask = useCallback((taskId: string, fields: Partial<Task>) => {
    const task = lists.flatMap((l) => l.tasks).find((t) => t.id === taskId);
    const isSmashTask = task?.listId === 'smash-list';

    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) => (t.id === taskId ? { ...t, ...fields } : t)),
      })),
    );

    if (user && !isSmashTask) {
      (async () => {
        const ref = doc(db, 'tasks', taskId);
        // Firestore rejects undefined in update payloads — silent failure loses edits on reload.
        const patch: Record<string, unknown> = {};
        if ('title' in fields && fields.title !== undefined) patch.title = fields.title;
        if ('details' in fields) patch.details = fields.details ?? '';
        if ('dueDate' in fields) patch.dueDate = fields.dueDate;
        if ('repeat' in fields) patch.repeat = fields.repeat ?? 'none';
        if ('subtasks' in fields) patch.subtasks = fields.subtasks ?? [];
        if ('completed' in fields && fields.completed !== undefined) patch.completed = fields.completed;
        if ('sortOrder' in fields && fields.sortOrder !== undefined) patch.sortOrder = fields.sortOrder;
        if ('priority' in fields) patch.priority = fields.priority ?? null;
        if (Object.keys(patch).length === 0) return;
        try {
          await updateDoc(ref, patch as Record<string, unknown>);
        } catch {
          /* ignore — optimistic UI already applied */
        }
      })();
    }
  }, [setLists, user]);

  const deleteTask = useCallback((taskId: string) => {
    const task = lists.flatMap((l) => l.tasks).find((t) => t.id === taskId);
    const isSmashTask = task?.listId === 'smash-list';

    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== 'smash-list') return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
        const nextTasks = l.tasks.filter((t) => t.id !== taskId);
        return { ...l, tasks: replenishSmashList(nextTasks, 'smash-list') };
      }),
    );

    if (user && !isSmashTask) {
      (async () => {
        const ref = doc(db, 'tasks', taskId);
        await deleteDoc(ref);
      })();
    }
  }, [setLists, user, lists]);

  const completeTask = useCallback((taskId: string) => {
    const task = lists.flatMap((l) => l.tasks).find((t) => t.id === taskId);
    const isSmashTask = task?.listId === 'smash-list';
    const isRepeating = task && hasActiveRepeat(task.repeat);

    // For repeating tasks, calculate the next due date from the current due date (or today).
    const nextDueDate = isRepeating
      ? getNextDueDate(task.repeat!, task.dueDate ? new Date(task.dueDate) : new Date())
      : null;

    setLists((prev) =>
      prev.map((l) => {
        const isSmash = l.id === 'smash-list' || l.name === '💥 Smash List';
        const updated = l.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            completed: true,
            completedAt: new Date().toISOString(),
            // Stash the next due date so the midnight reset knows when to uncomplete.
            ...(nextDueDate ? { dueDate: nextDueDate } : {}),
          };
        });
        if (isSmash) {
          return { ...l, tasks: replenishSmashList(updated, 'smash-list') };
        }
        return { ...l, tasks: updated };
      }),
    );

    if (user && !isSmashTask) {
      (async () => {
        const ref = doc(db, 'tasks', taskId);
        const updates: Record<string, unknown> = { completed: true };
        if (nextDueDate) updates.dueDate = nextDueDate;
        await updateDoc(ref, updates);
      })();
    }
  }, [setLists, user, lists]);

  const uncompleteTask = useCallback((taskId: string) => {
    const task = lists.flatMap((l) => l.tasks).find((t) => t.id === taskId);
    const isSmashTask = task?.listId === 'smash-list';

    let nextSortForDb = 0;
    let didUncomplete = false;

    setLists((prev) =>
      prev.map((l) => {
        const hit = l.tasks.find((t) => t.id === taskId);
        if (!hit || !hit.completed) return l;
        const activeOthers = l.tasks.filter((t) => !t.completed && t.id !== taskId);
        const maxSort = activeOthers.reduce((m, t) => Math.max(m, t.sortOrder ?? -1), -1);
        nextSortForDb = maxSort + 1;
        didUncomplete = true;
        return {
          ...l,
          tasks: l.tasks.map((t) =>
            t.id === taskId
              ? { ...t, completed: false, completedAt: undefined, sortOrder: nextSortForDb }
              : t,
          ),
        };
      }),
    );

    if (user && !isSmashTask && didUncomplete) {
      (async () => {
        const ref = doc(db, 'tasks', taskId);
        await updateDoc(ref, { completed: false, sortOrder: nextSortForDb });
      })();
    }
  }, [setLists, user, lists]);

  /* ---- Subtask CRUD ---- */
  const addSubtask = useCallback((taskId: string, text: string) => {
    const subtask: Subtask = { id: `sub-${Date.now()}`, text, done: false };
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: [...(t.subtasks ?? []), subtask] }
            : t
        ),
      }))
    );
  }, [setLists]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks ?? []).map((s) =>
                  s.id === subtaskId ? { ...s, done: !s.done } : s
                ),
              }
            : t
        ),
      }))
    );
  }, [setLists]);

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) }
            : t
        ),
      }))
    );
  }, [setLists]);

  const moveTask = useCallback((taskId: string, targetListId: string) => {
    if (targetListId === 'smash-list') return;

    let movedTask: Task | undefined;

    setLists((prev) => {
      // Find and remove from source list
      let found: Task | undefined;
      const withRemoved = prev.map((l) => {
        const idx = l.tasks.findIndex((t) => t.id === taskId);
        if (idx === -1) return l;
        found = { ...l.tasks[idx] };
        return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
      });
      if (!found) return prev;

      movedTask = { ...found, listId: targetListId };

      // Assign sortOrder at end of target list's active tasks
      const targetList = withRemoved.find((l) => l.id === targetListId);
      const targetActive = (targetList?.tasks ?? []).filter((t) => !t.completed);
      const maxSort = targetActive.reduce((m, t) => Math.max(m, t.sortOrder ?? -1), -1);
      movedTask.sortOrder = maxSort + 1;

      return withRemoved.map((l) =>
        l.id === targetListId ? { ...l, tasks: [...l.tasks, movedTask!] } : l,
      );
    });

    if (user && movedTask) {
      (async () => {
        const ref = doc(db, 'tasks', taskId);
        try {
          await updateDoc(ref, { listId: targetListId, sortOrder: movedTask!.sortOrder ?? 0 });
        } catch {
          /* ignore — optimistic UI already applied */
        }
      })();
    }
  }, [setLists, user]);

  /**
   * Apply an explicit visual order for active tasks. `orderedIds` is the list
   * of active task ids in the desired final order (already accounts for the
   * current sortMode + the move). Completed tasks are preserved.
   */
  const reorderActiveTasks = useCallback(
    (listId: string, orderedIds: string[]) => {
      if (listId === 'smash-list') return;

      setLists((prev) => {
        const list = prev.find((l) => l.id === listId);
        if (!list) return prev;
        const byId = new Map(list.tasks.map((t) => [t.id, t]));
        const nextActive: Task[] = [];
        for (const id of orderedIds) {
          const t = byId.get(id);
          if (t && !t.completed) nextActive.push(t);
        }
        if (nextActive.length === 0) return prev;
        const completed = list.tasks.filter((t) => t.completed);
        const withOrder = nextActive.map((t, i) => ({ ...t, sortOrder: i }));

        if (user) {
          queueMicrotask(() => {
            const batch = writeBatch(db);
            withOrder.forEach((t, i) => {
              batch.update(doc(db, 'tasks', t.id), { sortOrder: i });
            });
            batch.commit().catch(() => {
              /* ignore */
            });
          });
        }

        return prev.map((l) =>
          l.id === listId ? { ...l, tasks: [...withOrder, ...completed] } : l,
        );
      });
    },
    [setLists, user],
  );

  /**
   * Reset completed repeating tasks whose dueDate has arrived (i.e. ≤ today).
   * Called at midnight and on initial load.
   */
  const resetRepeatingTasks = useCallback(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    setLists((prev) =>
      prev.map((l) => {
        let changed = false;
        const tasks = l.tasks.map((t) => {
          if (!t.completed || !hasActiveRepeat(t.repeat)) return t;
          // Uncomplete if the next due date is today or in the past
          if (t.dueDate && t.dueDate <= todayStr) {
            changed = true;
            // Also reset subtasks
            const resetSubtasks = t.subtasks?.map((s) => ({ ...s, done: false }));
            return {
              ...t,
              completed: false,
              completedAt: undefined,
              ...(resetSubtasks ? { subtasks: resetSubtasks } : {}),
            };
          }
          return t;
        });
        if (!changed) return l;

        // Sync to Firestore
        if (user) {
          tasks.forEach((t) => {
            const orig = l.tasks.find((o) => o.id === t.id);
            if (orig && orig.completed && !t.completed) {
              const ref = doc(db, 'tasks', t.id);
              const updates: Record<string, unknown> = { completed: false };
              if (t.subtasks) updates.subtasks = t.subtasks;
              updateDoc(ref, updates).catch(() => {});
            }
          });
        }

        return { ...l, tasks };
      }),
    );
  }, [setLists, user]);

  // Run reset on mount and whenever lists change from Firestore sync
  useEffect(() => {
    resetRepeatingTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentList = lists.find((l) => l.id === activeId) ?? lists[0];

  return {
    lists,
    setLists,
    activeListId: activeId,
    setActiveList,
    currentList,
    addList,
    renameList,
    deleteList,
    setListSortMode,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    moveTask,
    reorderActiveTasks,
    resetRepeatingTasks,
    listLimitUpsellOpen,
    closeListLimitUpsell: () => setListLimitUpsellOpen(false),
  };
}
