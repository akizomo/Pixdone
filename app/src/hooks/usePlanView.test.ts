import { describe, it, expect } from 'vitest';
import { groupTasksForPlan } from './usePlanView';
import type { Task } from '../types/task';
import type { List } from '../types/list';

// Helper to freeze "today" for deterministic tests
const TODAY = '2026-04-17';
const TOMORROW = '2026-04-18';
const DAY_AFTER = '2026-04-19';
const PAST = '2026-04-15';
const FUTURE = '2026-04-25';

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: `Task ${overrides.id}`,
    completed: false,
    dueDate: null,
    listId: 'list-1',
    ...overrides,
  };
}

function makeLists(tasks: Task[]): List[] {
  const byList = new Map<string, Task[]>();
  for (const t of tasks) {
    const arr = byList.get(t.listId) ?? [];
    arr.push(t);
    byList.set(t.listId, arr);
  }
  return Array.from(byList.entries()).map(([id, ts]) => ({
    id,
    name: id,
    tasks: ts,
  }));
}

describe('groupTasksForPlan', () => {
  it('puts tasks with today due date in "today" section', () => {
    const tasks = [makeTask({ id: 't1', dueDate: TODAY })];
    const result = groupTasksForPlan(makeLists(tasks), TODAY, TOMORROW);
    expect(result.today.map((t) => t.id)).toEqual(['t1']);
  });

  it('puts tasks with tomorrow due date in "tomorrow" section', () => {
    const tasks = [makeTask({ id: 't1', dueDate: TOMORROW })];
    const result = groupTasksForPlan(makeLists(tasks), TODAY, TOMORROW);
    expect(result.tomorrow.map((t) => t.id)).toEqual(['t1']);
  });

  it('puts tasks with future due date in "upcoming" section', () => {
    const tasks = [
      makeTask({ id: 't1', dueDate: DAY_AFTER }),
      makeTask({ id: 't2', dueDate: FUTURE }),
    ];
    const result = groupTasksForPlan(makeLists(tasks), TODAY, TOMORROW);
    expect(result.upcoming.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('puts overdue tasks in "today" section', () => {
    const tasks = [makeTask({ id: 't1', dueDate: PAST })];
    const result = groupTasksForPlan(makeLists(tasks), TODAY, TOMORROW);
    expect(result.today.map((t) => t.id)).toEqual(['t1']);
  });

  it('puts tasks without due date in "someday" section', () => {
    const tasks = [makeTask({ id: 't1', dueDate: null })];
    const result = groupTasksForPlan(makeLists(tasks), TODAY, TOMORROW);
    expect(result.someday.map((t) => t.id)).toEqual(['t1']);
  });

  it('excludes completed tasks', () => {
    const tasks = [
      makeTask({ id: 't1', dueDate: TODAY, completed: true }),
      makeTask({ id: 't2', dueDate: TODAY, completed: false }),
    ];
    const result = groupTasksForPlan(makeLists(tasks), TODAY, TOMORROW);
    expect(result.today.map((t) => t.id)).toEqual(['t2']);
  });

  it('excludes Smash List tasks', () => {
    const tasks = [
      makeTask({ id: 't1', dueDate: TODAY, listId: 'smash-list' }),
      makeTask({ id: 't2', dueDate: TODAY, listId: 'list-1' }),
    ];
    const lists: List[] = [
      { id: 'smash-list', name: '💥 Smash List', tasks: [tasks[0]] },
      { id: 'list-1', name: 'Work', tasks: [tasks[1]] },
    ];
    const result = groupTasksForPlan(lists, TODAY, TOMORROW);
    expect(result.today.map((t) => t.id)).toEqual(['t2']);
  });

  it('sorts by priority (high → medium → low → none) within a section', () => {
    const tasks = [
      makeTask({ id: 'low', dueDate: TODAY, priority: 'low' }),
      makeTask({ id: 'high', dueDate: TODAY, priority: 'high' }),
      makeTask({ id: 'none', dueDate: TODAY }),
      makeTask({ id: 'med', dueDate: TODAY, priority: 'medium' }),
    ];
    const result = groupTasksForPlan(makeLists(tasks), TODAY, TOMORROW);
    expect(result.today.map((t) => t.id)).toEqual(['high', 'med', 'low', 'none']);
  });

  it('sorts by id (creation proxy) when priority is equal', () => {
    const tasks = [
      makeTask({ id: 'task-300', dueDate: TODAY, priority: 'high' }),
      makeTask({ id: 'task-100', dueDate: TODAY, priority: 'high' }),
      makeTask({ id: 'task-200', dueDate: TODAY, priority: 'high' }),
    ];
    const result = groupTasksForPlan(makeLists(tasks), TODAY, TOMORROW);
    expect(result.today.map((t) => t.id)).toEqual(['task-100', 'task-200', 'task-300']);
  });

  it('collects tasks from multiple lists', () => {
    const tasks = [
      makeTask({ id: 't1', dueDate: TODAY, listId: 'work' }),
      makeTask({ id: 't2', dueDate: TODAY, listId: 'personal' }),
    ];
    const lists: List[] = [
      { id: 'work', name: 'Work', tasks: [tasks[0]] },
      { id: 'personal', name: 'Personal', tasks: [tasks[1]] },
    ];
    const result = groupTasksForPlan(lists, TODAY, TOMORROW);
    expect(result.today).toHaveLength(2);
  });

  it('sorts upcoming by due date first, then priority', () => {
    const tasks = [
      makeTask({ id: 'later-high', dueDate: FUTURE, priority: 'high' }),
      makeTask({ id: 'soon-low', dueDate: DAY_AFTER, priority: 'low' }),
    ];
    const result = groupTasksForPlan(makeLists(tasks), TODAY, TOMORROW);
    // DAY_AFTER comes before FUTURE
    expect(result.upcoming.map((t) => t.id)).toEqual(['soon-low', 'later-high']);
  });
});
