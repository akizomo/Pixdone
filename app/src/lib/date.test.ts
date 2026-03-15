import { describe, it, expect } from 'vitest';
import { formatDueDate, getTodayYMD, getTomorrowYMD } from './date';

describe('getTodayYMD', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = getTodayYMD();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getTomorrowYMD', () => {
  it('returns a date one day after today', () => {
    const today = getTodayYMD();
    const tomorrow = getTomorrowYMD();
    const todayDate = new Date(today);
    const tomorrowDate = new Date(tomorrow);
    const diff = tomorrowDate.getTime() - todayDate.getTime();
    expect(diff).toBe(24 * 60 * 60 * 1000); // exactly 1 day
  });

  it('returns a string in YYYY-MM-DD format', () => {
    expect(getTomorrowYMD()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatDueDate', () => {
  it('returns null for null dueDate', () => {
    expect(formatDueDate(null, 'en')).toBeNull();
  });

  it('returns "Today" for today\'s date in English', () => {
    const today = getTodayYMD();
    expect(formatDueDate(today, 'en')).toBe('Today');
  });

  it('returns "今日" for today\'s date in Japanese', () => {
    const today = getTodayYMD();
    expect(formatDueDate(today, 'ja')).toBe('今日');
  });

  it('returns "Tomorrow" for tomorrow\'s date in English', () => {
    const tomorrow = getTomorrowYMD();
    expect(formatDueDate(tomorrow, 'en')).toBe('Tomorrow');
  });

  it('returns "明日" for tomorrow\'s date in Japanese', () => {
    const tomorrow = getTomorrowYMD();
    expect(formatDueDate(tomorrow, 'ja')).toBe('明日');
  });

  it('returns a formatted date string for other dates', () => {
    const result = formatDueDate('2030-06-15', 'en');
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
    expect(result).not.toBe('Today');
    expect(result).not.toBe('Tomorrow');
  });
});
