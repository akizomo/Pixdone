import { useState, useCallback, useEffect } from 'react';
import type { List } from '../types/list';
import type { Task, Subtask } from '../types/task';

const STORAGE_KEY = 'pixdone_lists_v1';
const ACTIVE_KEY = 'pixdone_active_v1';

export const SMASH_TITLES = {
  en: ['Smash this!', 'Destroy it!', 'Crush it!', 'Annihilate!', 'Obliterate!', 'Wipe it out!', 'Demolish!', 'Eradicate!', 'Pulverize!', 'Vanquish!'],
  ja: ['粉砕せよ！', 'やっつけろ！', 'やり遂げろ！', '一気に片付けろ！', 'ぶっ飛ばせ！', '消し去れ！', '全力でやれ！', '根絶せよ！', '打ち砕け！', '征服せよ！'],
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
      { id: 's1', title: 'Smash this!', smashIdx: 0, completed: false, dueDate: null, listId: 'smash-list' },
      { id: 's2', title: 'Destroy it!', smashIdx: 1, completed: false, dueDate: null, listId: 'smash-list' },
      { id: 's3', title: 'Crush it!', smashIdx: 2, completed: false, dueDate: null, listId: 'smash-list' },
    ] as Task[],
  },
];

function loadLists(): List[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as List[];
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
  const [lists, setListsState] = useState<List[]>(() => loadLists());
  const [activeId, setActiveId] = useState<string>(() => {
    const initial = loadLists();
    return loadActiveId(initial);
  });

  const setLists = useCallback((updater: List[] | ((prev: List[]) => List[])) => {
    setListsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const setActiveList = useCallback((id: string) => {
    setActiveId(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(ACTIVE_KEY, activeId); } catch { /* ignore */ }
  }, [activeId]);

  /* ---- List CRUD ---- */
  const addList = useCallback((name: string) => {
    const id = `list-${Date.now()}`;
    setLists((prev) => [...prev, { id, name, tasks: [] }]);
    setActiveList(id);
  }, [setLists, setActiveList]);

  const renameList = useCallback((listId: string, name: string) => {
    setLists((prev) => prev.map((l) => l.id === listId ? { ...l, name } : l));
  }, [setLists]);

  const deleteList = useCallback((listId: string, allLists: List[]) => {
    const remaining = allLists.filter((l) => l.id !== listId);
    setLists(remaining);
    if (activeId === listId) {
      const newActive = remaining[0]?.id ?? '';
      setActiveList(newActive);
    }
  }, [setLists, setActiveList, activeId]);

  /* ---- Task CRUD ---- */
  const addTask = useCallback((listId: string, fields: Partial<Task> & { title: string }): Task => {
    const task: Task = {
      id: `task-${Date.now()}`,
      title: fields.title,
      completed: false,
      dueDate: fields.dueDate ?? null,
      details: fields.details,
      repeat: fields.repeat ?? 'none',
      subtasks: fields.subtasks ?? [],
      listId,
    };
    setLists((prev) =>
      prev.map((l) => l.id === listId ? { ...l, tasks: [...l.tasks, task] } : l)
    );
    return task;
  }, [setLists]);

  const updateTask = useCallback((taskId: string, fields: Partial<Task>) => {
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) => t.id === taskId ? { ...t, ...fields } : t),
      }))
    );
  }, [setLists]);

  const deleteTask = useCallback((taskId: string) => {
    setLists((prev) =>
      prev.map((l) => ({ ...l, tasks: l.tasks.filter((t) => t.id !== taskId) }))
    );
  }, [setLists]);

  const completeTask = useCallback((taskId: string) => {
    setLists((prev) =>
      prev.map((l) => {
        const isSmash = l.id === 'smash-list' || l.name === '💥 Smash List';
        const updated = l.tasks.map((t) =>
          t.id === taskId
            ? { ...t, completed: true, completedAt: new Date().toISOString() }
            : t
        );
        if (isSmash) {
          return { ...l, tasks: replenishSmashList(updated, l.id) };
        }
        return { ...l, tasks: updated };
      })
    );
  }, [setLists]);

  const uncompleteTask = useCallback((taskId: string) => {
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        tasks: l.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t
        ),
      }))
    );
  }, [setLists]);

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
