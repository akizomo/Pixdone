import { describe, it, expect } from 'vitest';
import { getTodayTasks } from './useTodayView';
import type { Task } from '../types/task';
import type { List } from '../types/list';

const TODAY = '2026-04-17';
const TOMORROW = '2026-04-18';
const PAST = '2026-04-15';

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
  return Array.from(byList.entries()).map(([id, ts]) => ({ id, name: id, tasks: ts }));
}

describe('getTodayTasks', () => {
  it('includes tasks due today', () => {
    const result = getTodayTasks(makeLists([makeTask({ id: 't1', dueDate: TODAY })]), TODAY);
    expect(result.map((t) => t.id)).toEqual(['t1']);
  });

  it('includes overdue tasks', () => {
    const result = getTodayTasks(makeLists([makeTask({ id: 't1', dueDate: PAST })]), TODAY);
    expect(result.map((t) => t.id)).toEqual(['t1']);
  });

  it('excludes tasks due tomorrow or later', () => {
    const result = getTodayTasks(makeLists([makeTask({ id: 't1', dueDate: TOMORROW })]), TODAY);
    expect(result).toHaveLength(0);
  });

  it('excludes tasks without due date', () => {
    const result = getTodayTasks(makeLists([makeTask({ id: 't1', dueDate: null })]), TODAY);
    expect(result).toHaveLength(0);
  });

  it('excludes completed tasks', () => {
    const result = getTodayTasks(makeLists([makeTask({ id: 't1', dueDate: TODAY, completed: true })]), TODAY);
    expect(result).toHaveLength(0);
  });

  it('excludes Smash List tasks', () => {
    const lists: List[] = [
      { id: 'smash-list', name: '💥 Smash List', tasks: [makeTask({ id: 't1', dueDate: TODAY, listId: 'smash-list' })] },
    ];
    const result = getTodayTasks(lists, TODAY);
    expect(result).toHaveLength(0);
  });

  it('sorts by priority then id', () => {
    const tasks = [
      makeTask({ id: 'c', dueDate: TODAY, priority: 'low' }),
      makeTask({ id: 'a', dueDate: TODAY, priority: 'high' }),
      makeTask({ id: 'b', dueDate: TODAY, priority: 'high' }),
    ];
    const result = getTodayTasks(makeLists(tasks), TODAY);
    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('collects from multiple lists', () => {
    const lists: List[] = [
      { id: 'work', name: 'Work', tasks: [makeTask({ id: 't1', dueDate: TODAY, listId: 'work' })] },
      { id: 'home', name: 'Home', tasks: [makeTask({ id: 't2', dueDate: TODAY, listId: 'home' })] },
    ];
    const result = getTodayTasks(lists, TODAY);
    expect(result).toHaveLength(2);
  });
});
