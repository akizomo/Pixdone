import { describe, it, expect } from 'vitest';
import {
  mapReminderRecurrence,
  reminderToTaskFields,
  remainingListSlots,
  buildImportGroups,
} from './remindersImport';
import type { List } from '../types/list';

describe('mapReminderRecurrence', () => {
  it('maps simple daily / weekly rules', () => {
    expect(mapReminderRecurrence({ frequency: 'daily', interval: 1 })).toBe('daily');
    expect(mapReminderRecurrence({ frequency: 'weekly', interval: 1 })).toBe('weekly');
  });

  it('maps weekly rules with weekdays to a custom weekly repeat', () => {
    expect(mapReminderRecurrence({ frequency: 'weekly', interval: 1, weekDays: [5, 1, 3, 1] })).toEqual({
      type: 'custom', interval: 1, unit: 'week', weekDays: [1, 3, 5],
    });
  });

  it('drops anything that is not a simple daily / weekly rule', () => {
    expect(mapReminderRecurrence(undefined)).toBeNull();
    expect(mapReminderRecurrence({ frequency: 'daily', interval: 2 })).toBeNull();
    expect(mapReminderRecurrence({ frequency: 'weekly', interval: 2 })).toBeNull();
    expect(mapReminderRecurrence({ frequency: 'monthly', interval: 1 })).toBeNull();
    expect(mapReminderRecurrence({ frequency: 'yearly', interval: 1 })).toBeNull();
    expect(mapReminderRecurrence({ frequency: 'weekly', interval: 1, weekDays: [1], hasWeekNumbers: true })).toBeNull();
  });
});

describe('reminderToTaskFields', () => {
  it('copies title, notes and due date', () => {
    expect(reminderToTaskFields({ listId: 'a', title: ' Read ', notes: ' ch.1 ', dueDate: '2026-11-07' })).toEqual({
      title: 'Read', details: 'ch.1', dueDate: '2026-11-07',
    });
  });

  it('adds a repeat only when mappable, and skips empty titles', () => {
    expect(reminderToTaskFields({ listId: 'a', title: 'Gym', recurrence: { frequency: 'daily', interval: 1 } })?.repeat).toBe('daily');
    expect(reminderToTaskFields({ listId: 'a', title: 'Rent', recurrence: { frequency: 'monthly', interval: 1 } })).toEqual({ title: 'Rent', dueDate: null });
    expect(reminderToTaskFields({ listId: 'a', title: '   ' })).toBeNull();
  });
});

describe('remainingListSlots', () => {
  const list = (id: string): List => ({ id, name: id, tasks: [] });

  it('counts normal lists against the free limit of 3, ignoring Smash List', () => {
    expect(remainingListSlots([list('smash-list'), list('inbox')], false)).toBe(2);
    expect(remainingListSlots([list('a'), list('b'), list('c'), list('smash-list')], false)).toBe(0);
  });

  it('is unlimited for PixDone+', () => {
    expect(remainingListSlots([list('a'), list('b'), list('c')], true)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('buildImportGroups', () => {
  it('groups items by the selected Reminders list in selection order', () => {
    const groups = buildImportGroups(
      [
        { listId: 'r1', title: 'A' },
        { listId: 'r2', title: 'B' },
        { listId: 'r1', title: 'C' },
        { listId: 'r3', title: 'not selected' },
      ],
      [
        { reminderListId: 'r2', target: { kind: 'existing', listId: 'inbox' } },
        { reminderListId: 'r1', target: { kind: 'new', name: 'Home' } },
      ],
    );
    expect(groups.map((g) => g.tasks.map((t) => t.title))).toEqual([['B'], ['A', 'C']]);
    expect(groups[1].target).toEqual({ kind: 'new', name: 'Home' });
  });
});
