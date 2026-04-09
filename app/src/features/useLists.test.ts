import { describe, it, expect } from 'vitest';
import { isExpiredCompletedTask } from './useLists';

const NOW = new Date('2026-04-09T12:00:00Z');

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 't1',
    title: 'Test',
    completed: false,
    dueDate: null,
    listId: 'default',
    ...overrides,
  } as any;
}

describe('isExpiredCompletedTask', () => {
  it('returns false for incomplete tasks', () => {
    const task = makeTask({ completed: false, completedAt: '2026-03-01T00:00:00Z' });
    expect(isExpiredCompletedTask(task, NOW)).toBe(false);
  });

  it('returns false for completed tasks without completedAt', () => {
    const task = makeTask({ completed: true });
    expect(isExpiredCompletedTask(task, NOW)).toBe(false);
  });

  it('returns false for tasks completed less than 7 days ago', () => {
    const task = makeTask({ completed: true, completedAt: '2026-04-05T00:00:00Z' });
    expect(isExpiredCompletedTask(task, NOW)).toBe(false);
  });

  it('returns false for tasks completed exactly 7 days ago (boundary)', () => {
    // 7日ちょうどは cutoff と同じなので false (< でなく <=)
    const exactly7 = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const task = makeTask({ completed: true, completedAt: exactly7 });
    expect(isExpiredCompletedTask(task, NOW)).toBe(false);
  });

  it('returns true for tasks completed more than 7 days ago', () => {
    const task = makeTask({ completed: true, completedAt: '2026-04-01T00:00:00Z' });
    expect(isExpiredCompletedTask(task, NOW)).toBe(true);
  });

  it('returns true for tasks completed way in the past', () => {
    const task = makeTask({ completed: true, completedAt: '2025-01-01T00:00:00Z' });
    expect(isExpiredCompletedTask(task, NOW)).toBe(true);
  });

  it('returns false for invalid completedAt string', () => {
    const task = makeTask({ completed: true, completedAt: 'not-a-date' });
    expect(isExpiredCompletedTask(task, NOW)).toBe(false);
  });
});
