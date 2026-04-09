import { describe, it, expect } from 'vitest';
import { getRepeatLabel } from './repeat';
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
