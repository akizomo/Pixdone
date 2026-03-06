import { useState, useCallback } from 'react';
import type { List } from '../types/list';
import type { Task } from '../types/task';

const defaultLists: List[] = [
  {
    id: 'default',
    name: 'Tutorial',
    tasks: [
      { id: 't1', title: 'Sample task', completed: false, dueDate: null, listId: 'default' },
    ] as Task[],
  },
  {
    id: 'smash-list',
    name: '💥 Smash List',
    tasks: [
      { id: 's1', title: 'Smash me', completed: false, dueDate: null, listId: 'smash-list' },
    ] as Task[],
  },
];

export function useLists(initial: List[] = defaultLists) {
  const [lists, setLists] = useState<List[]>(initial);
  const [activeId, setActiveId] = useState<string>(lists[0]?.id ?? 'default');

  const setActiveList = useCallback((id: string) => setActiveId(id), []);
  const addList = useCallback((name: string) => {
    const id = `list-${Date.now()}`;
    setLists((prev) => [...prev, { id, name, tasks: [] }]);
    setActiveId(id);
  }, []);
  const currentList = lists.find((l) => l.id === activeId) ?? lists[0];

  return { lists, activeListId: activeId, setActiveList, addList, currentList, setLists };
}
