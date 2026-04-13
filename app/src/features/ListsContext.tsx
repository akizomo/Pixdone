/**
 * ListsContext — React Context wrapper around useLists.
 *
 * Split into two contexts to avoid unnecessary re-renders:
 *   - ListsDataContext: reactive data (lists, activeListId, currentList)
 *   - ListsActionsContext: stable action callbacks (addTask, deleteTask, etc.)
 *
 * Components that only call actions (e.g. MobileTaskSheet) won't re-render
 * when the lists data changes.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLists } from './useLists';
import type { List, SortMode } from '../types/list';
import type { Task } from '../types/task';

// ── Data context (changes when lists/activeId change) ──────────────────────

interface ListsDataValue {
  lists: List[];
  activeListId: string;
  currentList: List | undefined;
  listLimitUpsellOpen: boolean;
}

const ListsDataContext = createContext<ListsDataValue | null>(null);

// ── Actions context (stable references, never triggers re-render) ──────────

interface ListsActionsValue {
  setLists: (updater: List[] | ((prev: List[]) => List[])) => void;
  setActiveList: (id: string) => void;
  addList: (name: string) => void;
  renameList: (listId: string, name: string) => void;
  deleteList: (listId: string, allLists: List[]) => void;
  setListSortMode: (listId: string, sortMode: SortMode) => void;
  addTask: (listId: string, fields: Partial<Task> & { title: string }) => Task;
  updateTask: (taskId: string, fields: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  uncompleteTask: (taskId: string) => void;
  addSubtask: (taskId: string, text: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  moveTask: (taskId: string, targetListId: string) => void;
  reorderActiveTasks: (listId: string, fromIndex: number, toIndex: number) => void;
  resetRepeatingTasks: () => void;
  closeListLimitUpsell: () => void;
}

const ListsActionsContext = createContext<ListsActionsValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function ListsProvider({ children }: { children: ReactNode }) {
  const {
    lists,
    setLists,
    activeListId,
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
    closeListLimitUpsell,
  } = useLists();

  const dataValue: ListsDataValue = useMemo(() => ({
    lists,
    activeListId,
    currentList,
    listLimitUpsellOpen,
  }), [lists, activeListId, currentList, listLimitUpsellOpen]);

  const actionsValue: ListsActionsValue = useMemo(() => ({
    setLists,
    setActiveList,
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
    closeListLimitUpsell,
  }), [
    setLists, setActiveList, addList, renameList, deleteList, setListSortMode,
    addTask, updateTask, deleteTask, completeTask, uncompleteTask,
    addSubtask, toggleSubtask, deleteSubtask,
    moveTask, reorderActiveTasks, resetRepeatingTasks, closeListLimitUpsell,
  ]);

  return (
    <ListsDataContext.Provider value={dataValue}>
      <ListsActionsContext.Provider value={actionsValue}>
        {children}
      </ListsActionsContext.Provider>
    </ListsDataContext.Provider>
  );
}

// ── Consumer hooks ─────────────────────────────────────────────────────────

/** Use when you need reactive list data (re-renders on list changes) */
export function useListsData(): ListsDataValue {
  const ctx = useContext(ListsDataContext);
  if (!ctx) throw new Error('useListsData must be used within ListsProvider');
  return ctx;
}

/** Use when you only need action callbacks (never re-renders from data changes) */
export function useListsActions(): ListsActionsValue {
  const ctx = useContext(ListsActionsContext);
  if (!ctx) throw new Error('useListsActions must be used within ListsProvider');
  return ctx;
}

/** Use when you need both data and actions (convenience, same as useLists before) */
export function useListsContext() {
  return { ...useListsData(), ...useListsActions() };
}
