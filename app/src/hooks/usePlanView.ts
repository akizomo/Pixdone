import { useMemo } from 'react';
import type { List } from '../types/list';
import type { Task } from '../types/task';
import { getTodayYMD, getTomorrowYMD } from '../lib/date';

export interface PlanSections {
  today: Task[];
  tomorrow: Task[];
  upcoming: Task[];
  someday: Task[];
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
const NO_PRIORITY = 3;

function priorityOf(t: Task): number {
  return t.priority ? (PRIORITY_RANK[t.priority] ?? NO_PRIORITY) : NO_PRIORITY;
}

function sortWithinSection(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pa = priorityOf(a);
    const pb = priorityOf(b);
    if (pa !== pb) return pa - pb;
    return a.id.localeCompare(b.id);
  });
}

function sortUpcoming(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Due date ascending first
    const da = a.dueDate ?? '';
    const db = b.dueDate ?? '';
    if (da !== db) return da.localeCompare(db);
    // Then priority
    const pa = priorityOf(a);
    const pb = priorityOf(b);
    if (pa !== pb) return pa - pb;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Pure function: groups tasks from all lists into Plan sections.
 * Exported for testing without React hooks.
 */
export function groupTasksForPlan(
  lists: List[],
  today: string,
  tomorrow: string,
): PlanSections {
  const todayTasks: Task[] = [];
  const tomorrowTasks: Task[] = [];
  const upcomingTasks: Task[] = [];
  const somedayTasks: Task[] = [];

  for (const list of lists) {
    // Skip Smash List
    if (list.id === 'smash-list' || list.name === '💥 Smash List') continue;

    for (const task of list.tasks) {
      if (task.completed) continue;

      if (!task.dueDate) {
        somedayTasks.push(task);
      } else if (task.dueDate <= today) {
        // Today + overdue
        todayTasks.push(task);
      } else if (task.dueDate === tomorrow) {
        tomorrowTasks.push(task);
      } else {
        upcomingTasks.push(task);
      }
    }
  }

  return {
    today: sortWithinSection(todayTasks),
    tomorrow: sortWithinSection(tomorrowTasks),
    upcoming: sortUpcoming(upcomingTasks),
    someday: sortWithinSection(somedayTasks),
  };
}

/**
 * React hook: computes Plan sections from current lists.
 */
export function usePlanView(lists: List[]): PlanSections {
  const today = getTodayYMD();
  const tomorrow = getTomorrowYMD();

  return useMemo(
    () => groupTasksForPlan(lists, today, tomorrow),
    [lists, today, tomorrow],
  );
}
