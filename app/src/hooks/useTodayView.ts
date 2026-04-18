import { useMemo } from 'react';
import type { List } from '../types/list';
import type { Task } from '../types/task';
import { getTodayYMD } from '../lib/date';

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
const NO_PRIORITY = 3;

function priorityOf(t: Task): number {
  return t.priority ? (PRIORITY_RANK[t.priority] ?? NO_PRIORITY) : NO_PRIORITY;
}

/**
 * Pure function: returns tasks due today or overdue, from all lists except Smash.
 * Sorted by priority (high → none) then creation order (id ascending).
 */
export function getTodayTasks(lists: List[], today: string): Task[] {
  const result: Task[] = [];

  for (const list of lists) {
    if (list.id === 'smash-list' || list.name === '💥 Smash List') continue;
    for (const task of list.tasks) {
      if (task.completed) continue;
      if (!task.dueDate) continue;
      if (task.dueDate <= today) {
        result.push(task);
      }
    }
  }

  return result.sort((a, b) => {
    const pa = priorityOf(a);
    const pb = priorityOf(b);
    if (pa !== pb) return pa - pb;
    return a.id.localeCompare(b.id);
  });
}

/**
 * React hook: returns today's tasks from current lists.
 */
export function useTodayView(lists: List[]): Task[] {
  const today = getTodayYMD();
  return useMemo(() => getTodayTasks(lists, today), [lists, today]);
}
