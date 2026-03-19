import { useState, useCallback, useEffect } from 'react';
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
  Timestamp,
} from 'firebase/firestore';
import type { List } from '../types/list';
import type { Task, Subtask } from '../types/task';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'pixdone_lists_v1';
const ACTIVE_KEY = 'pixdone_active_v1';

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
    { id: 'smash-list', name: '💥 Smash List', tasks: replenishSmashList([], 'smash-list') },
    ...lists,
  ];
}

const defaultLists: List[] = [
  {
    id: 'default',
    name: 'Tutorial',
    tasks: [
      {
        id: 'tutorial-1', listId: 'default', completed: false, dueDate: null,
        title: 'Try completing this task!',
      },
      {
        id: 'tutorial-2', listId: 'default', completed: false, dueDate: null,
        title: 'Each time you complete a task, a different effect appears. How many can you find?',
      },
      {
        id: 'tutorial-3', listId: 'default', completed: false, dueDate: null,
        title: 'Try the Smash List for even more fun!',
      },
    ] as Task[],
  },
  {
    id: 'smash-list',
    name: '💥 Smash List',
    tasks: [
      { id: 's1', title: SMASH_TITLES.en[0], smashIdx: 0, completed: false, dueDate: null, listId: 'smash-list' },
      { id: 's2', title: SMASH_TITLES.en[1], smashIdx: 1, completed: false, dueDate: null, listId: 'smash-list' },
      { id: 's3', title: SMASH_TITLES.en[2], smashIdx: 2, completed: false, dueDate: null, listId: 'smash-list' },
    ] as Task[],
  },
];

function loadLists(): List[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as List[];
      // 旧データなどで default リストが存在しない場合は、チュートリアル付きの初期状態にリセット
      const hasDefault = Array.isArray(parsed) && parsed.some((l) => l.id === 'default');
      if (!hasDefault) return defaultLists;
      // Smash List のダミータスクが不足している場合は 3 件に補充
      return parsed.map((l) => {
        const isSmash = l.id === 'smash-list' || l.name === '💥 Smash List';
        if (!isSmash || l.tasks.length >= 3) return l;
        return { ...l, tasks: replenishSmashList(l.tasks, l.id) };
      });
    }
  } catch { /* ignore */ }
  return defaultLists;
}

function loadActiveId(lists: List[]): string {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw && lists.some((l) => l.id === raw)) return raw;
  } catch { /* ignore */ }
  return lists[0]?.id ?? 'default';
}

export function useLists() {
  const { user } = useAuth();

  const [lists, setListsState] = useState<List[]>(() => loadLists());
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

  /* ---- Firestore sync when authenticated ---- */
  useEffect(() => {
    if (!user) return;

    const listsQuery = query(
      collection(db, 'lists'),
      where('uid', '==', user.uid),
    );

    const unsubLists = onSnapshot(listsQuery, (snap) => {
      setListsState((prev) => {
        const tasksById = new Map<string, Task[]>();
        prev.forEach((l) => tasksById.set(l.id, l.tasks));
        const nextFromFirestore: List[] = snap.docs
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              name: data.name ?? 'My Tasks',
              tasks: tasksById.get(d.id) ?? [],
            };
          })
          // If user once created a Firestore "Smash List", ignore it; we keep Smash local-only.
          .filter((l) => l.name !== '💥 Smash List');
        return ensureVirtualSmashList(nextFromFirestore);
      });
    });

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('uid', '==', user.uid),
    );

    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      const tasksByList: Record<string, Task[]> = {};

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
        const task: Task = {
          id: d.id,
          title: data.title ?? '',
          completed: !!data.completed,
          dueDate,
          details: data.details ?? '',
          repeat: data.repeat ?? 'none',
          subtasks: data.subtasks ?? [],
          listId,
        };
        if (!tasksByList[listId]) tasksByList[listId] = [];
        tasksByList[listId].push(task);
      });

      setListsState((prev) =>
        prev.map((l) => {
          if (l.id === 'smash-list') return l; // keep local-only
          return { ...l, tasks: tasksByList[l.id] ?? l.tasks };
        }),
      );
    });

    return () => {
      unsubLists();
      unsubTasks();
    };
  }, [user]);

  /* ---- List CRUD ---- */
  const addList = useCallback((name: string) => {
    // Smash List is virtual; don't create in Firestore/localStorage.
    if (name === '💥 Smash List') {
      setLists((prev) => ensureVirtualSmashList(prev));
      setActiveList('smash-list');
      return;
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
  }, [setLists, setActiveList, user]);

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
    };

    // まずローカルを更新（ログイン・未ログイン共通）
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        if (listId === 'smash-list') {
          return { ...l, tasks: replenishSmashList([...(l.tasks ?? []), base], 'smash-list') };
        }
        return { ...l, tasks: [...l.tasks, base] };
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
        });
      })();
    }

    return base;
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
        await updateDoc(ref, {
          title: fields.title,
          details: fields.details,
          dueDate: fields.dueDate,
          repeat: fields.repeat,
          subtasks: fields.subtasks,
        });
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

    setLists((prev) =>
      prev.map((l) => {
        const isSmash = l.id === 'smash-list' || l.name === '💥 Smash List';
        const updated = l.tasks.map((t) =>
          t.id === taskId
            ? { ...t, completed: true, completedAt: new Date().toISOString() }
            : t,
        );
        if (isSmash) {
          // Smash List is local-only; always replenish to keep 3 active tasks.
          return { ...l, tasks: replenishSmashList(updated, 'smash-list') };
        }
        return { ...l, tasks: updated };
      }),
    );

    if (user && !isSmashTask) {
      (async () => {
        const ref = doc(db, 'tasks', taskId);
        await updateDoc(ref, { completed: true });
      })();
    }
  }, [setLists, user, lists]);

  const uncompleteTask = useCallback((taskId: string) => {
    const task = lists.flatMap((l) => l.tasks).find((t) => t.id === taskId);
    const isSmashTask = task?.listId === 'smash-list';

    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t,
        ),
      })),
    );

    if (user && !isSmashTask) {
      (async () => {
        const ref = doc(db, 'tasks', taskId);
        await updateDoc(ref, { completed: false });
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
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  };
}
