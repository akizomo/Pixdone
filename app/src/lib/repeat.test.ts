import { describe, it, expect } from 'vitest';
import { getRepeatLabel, getNextDueDate, getNextDueDateAfter } from './repeat';
import type { RepeatConfig } from '../types/task';

describe('getRepeatLabel', () => {
  describe('preset values', () => {
    it('returns empty string for "none"', () => {
      expect(getRepeatLabel('none', 'en')).toBe('');
      expect(getRepeatLabel('none', 'ja')).toBe('');
    });

    it('returns "Daily" / "毎日" for daily', () => {
      expect(getRepeatLabel('daily', 'en')).toBe('Daily');
      expect(getRepeatLabel('daily', 'ja')).toBe('毎日');
    });

    it('returns "Weekdays" / "平日" for weekdays', () => {
      expect(getRepeatLabel('weekdays', 'en')).toBe('Weekdays');
      expect(getRepeatLabel('weekdays', 'ja')).toBe('平日');
    });

    it('returns "Weekly" / "毎週" for weekly', () => {
      expect(getRepeatLabel('weekly', 'en')).toBe('Weekly');
      expect(getRepeatLabel('weekly', 'ja')).toBe('毎週');
    });

    it('returns "Monthly" / "毎月" for monthly', () => {
      expect(getRepeatLabel('monthly', 'en')).toBe('Monthly');
      expect(getRepeatLabel('monthly', 'ja')).toBe('毎月');
    });

    it('returns "Yearly" / "毎年" for yearly', () => {
      expect(getRepeatLabel('yearly', 'en')).toBe('Yearly');
      expect(getRepeatLabel('yearly', 'ja')).toBe('毎年');
    });
  });

  describe('custom values', () => {
    it('returns "Every 2 days" for custom day interval', () => {
      const config: RepeatConfig = { type: 'custom', interval: 2, unit: 'day' };
      expect(getRepeatLabel(config, 'en')).toBe('Every 2 days');
      expect(getRepeatLabel(config, 'ja')).toBe('2日ごと');
    });

    it('returns "Every 3 weeks" for custom week interval without weekDays', () => {
      const config: RepeatConfig = { type: 'custom', interval: 3, unit: 'week' };
      expect(getRepeatLabel(config, 'en')).toBe('Every 3 weeks');
      expect(getRepeatLabel(config, 'ja')).toBe('3週ごと');
    });

    it('returns "Every 2 weeks (Mon, Wed)" for custom week with weekDays', () => {
      const config: RepeatConfig = { type: 'custom', interval: 2, unit: 'week', weekDays: [1, 3] };
      expect(getRepeatLabel(config, 'en')).toBe('Every 2 weeks (Mon, Wed)');
      expect(getRepeatLabel(config, 'ja')).toBe('2週ごと（月・水）');
    });

    it('returns "Every 6 months" for custom month interval', () => {
      const config: RepeatConfig = { type: 'custom', interval: 6, unit: 'month' };
      expect(getRepeatLabel(config, 'en')).toBe('Every 6 months');
      expect(getRepeatLabel(config, 'ja')).toBe('6か月ごと');
    });

    it('returns "Every 2 years" for custom year interval', () => {
      const config: RepeatConfig = { type: 'custom', interval: 2, unit: 'year' };
      expect(getRepeatLabel(config, 'en')).toBe('Every 2 years');
      expect(getRepeatLabel(config, 'ja')).toBe('2年ごと');
    });

    it('returns singular unit for interval=1', () => {
      const config: RepeatConfig = { type: 'custom', interval: 1, unit: 'day' };
      expect(getRepeatLabel(config, 'en')).toBe('Every day');
      expect(getRepeatLabel(config, 'ja')).toBe('1日ごと');
    });

    it('handles all 7 weekDays', () => {
      const config: RepeatConfig = { type: 'custom', interval: 1, unit: 'week', weekDays: [0, 1, 2, 3, 4, 5, 6] };
      expect(getRepeatLabel(config, 'en')).toBe('Every week (Sun, Mon, Tue, Wed, Thu, Fri, Sat)');
      expect(getRepeatLabel(config, 'ja')).toBe('1週ごと（日・月・火・水・木・金・土）');
    });

    it('sorts weekDays in display order', () => {
      const config: RepeatConfig = { type: 'custom', interval: 1, unit: 'week', weekDays: [5, 1] };
      expect(getRepeatLabel(config, 'en')).toBe('Every week (Mon, Fri)');
      expect(getRepeatLabel(config, 'ja')).toBe('1週ごと（月・金）');
    });
  });

  describe('undefined / falsy', () => {
    it('returns empty string for undefined', () => {
      expect(getRepeatLabel(undefined, 'en')).toBe('');
      expect(getRepeatLabel(undefined, 'ja')).toBe('');
    });
  });
});

describe('getNextDueDateAfter', () => {
  // Fixed reference "today" so tests are deterministic.
  const today = new Date(2026, 3, 19); // 2026-04-19 (Sunday)
  const todayStr = '2026-04-19';

  it('returns tomorrow for a daily task whose dueDate is today', () => {
    expect(getNextDueDateAfter('daily', new Date(2026, 3, 19), todayStr)).toBe('2026-04-20');
  });

  it('skips missed days for a daily task overdue by 4 days', () => {
    // dueDate = 2026-04-15, today = 2026-04-19. Next should be 2026-04-20.
    expect(getNextDueDateAfter('daily', new Date(2026, 3, 15), todayStr)).toBe('2026-04-20');
  });

  it('preserves the weekly cycle when a weekly task is overdue', () => {
    // dueDate = 2026-04-06 (Mon, 2 weeks ago). today = 2026-04-19 (Sun).
    // Next Monday after today is 2026-04-20.
    expect(getNextDueDateAfter('weekly', new Date(2026, 3, 6), todayStr)).toBe('2026-04-20');
  });

  it('advances by one cycle when dueDate is today-or-future (no missed occurrence)', () => {
    // dueDate = 2026-04-20 (tomorrow). from > today, so single step forward.
    expect(getNextDueDateAfter('daily', new Date(2026, 3, 20), todayStr)).toBe('2026-04-21');
  });

  it('skips missed weekdays for the "weekdays" preset', () => {
    // dueDate = 2026-04-10 (Fri). today = 2026-04-19 (Sun).
    // Next weekday after today is Mon 2026-04-20.
    expect(getNextDueDateAfter('weekdays', new Date(2026, 3, 10), todayStr)).toBe('2026-04-20');
  });

  it('skips missed months for a monthly task', () => {
    // dueDate = 2025-11-19, today = 2026-04-19. Next should be 2026-05-19.
    expect(getNextDueDateAfter('monthly', new Date(2025, 10, 19), todayStr)).toBe('2026-05-19');
  });

  it('skips missed occurrences for a custom every-2-days task', () => {
    // dueDate = 2026-04-09 (10 days ago). +2 cycle: 4/11, 4/13, 4/15, 4/17, 4/19, 4/21.
    // First > today(4/19) is 4/21.
    const config: RepeatConfig = { type: 'custom', interval: 2, unit: 'day' };
    expect(getNextDueDateAfter(config, new Date(2026, 3, 9), todayStr)).toBe('2026-04-21');
  });

  it('returns same value as getNextDueDate when from is already in the future', () => {
    const from = new Date(2026, 3, 25); // 2026-04-25
    expect(getNextDueDateAfter('daily', from, todayStr)).toBe(getNextDueDate('daily', from));
  });

  // Guard: simulate "today" computation the same way callers will.
  it('uses the YYYY-MM-DD string compare so time-of-day is irrelevant', () => {
    const lateToday = new Date(2026, 3, 19, 23, 59, 59);
    expect(
      getNextDueDateAfter(
        'daily',
        new Date(2026, 3, 15),
        `${lateToday.getFullYear()}-${String(lateToday.getMonth() + 1).padStart(2, '0')}-${String(lateToday.getDate()).padStart(2, '0')}`,
      ),
    ).toBe('2026-04-20');
  });

  // Sanity: today variable is referenced to avoid unused-var lint.
  it('today reference remains at 2026-04-19', () => {
    expect(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    ).toBe(todayStr);
  });
});
