import type { RepeatConfig, CustomRepeat } from '../types/task';

const PRESET_LABELS: Record<string, { en: string; ja: string }> = {
  none: { en: '', ja: '' },
  daily: { en: 'Daily', ja: '毎日' },
  weekdays: { en: 'Weekdays', ja: '平日' },
  weekly: { en: 'Weekly', ja: '毎週' },
  monthly: { en: 'Monthly', ja: '毎月' },
  yearly: { en: 'Yearly', ja: '毎年' },
};

const WEEKDAY_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_SHORT_JA = ['日', '月', '火', '水', '木', '金', '土'];

const UNIT_EN: Record<CustomRepeat['unit'], [string, string]> = {
  day: ['day', 'days'],
  week: ['week', 'weeks'],
  month: ['month', 'months'],
  year: ['year', 'years'],
};

const UNIT_JA: Record<CustomRepeat['unit'], string> = {
  day: '日',
  week: '週',
  month: 'か月',
  year: '年',
};

function formatCustom(config: CustomRepeat, lang: 'en' | 'ja'): string {
  const { interval, unit, weekDays } = config;
  const sortedDays = weekDays ? [...weekDays].sort((a, b) => a - b) : undefined;

  if (lang === 'ja') {
    let label = `${interval}${UNIT_JA[unit]}ごと`;
    if (sortedDays && sortedDays.length > 0) {
      label += `（${sortedDays.map((d) => WEEKDAY_SHORT_JA[d]).join('・')}）`;
    }
    return label;
  }

  // English
  const [singular, plural] = UNIT_EN[unit];
  let label = interval === 1 ? `Every ${singular}` : `Every ${interval} ${plural}`;
  if (sortedDays && sortedDays.length > 0) {
    label += ` (${sortedDays.map((d) => WEEKDAY_SHORT_EN[d]).join(', ')})`;
  }
  return label;
}

/**
 * Calculate the next due date based on repeat config.
 * `from` is the base date (typically today or the current dueDate).
 * Returns an ISO date string (YYYY-MM-DD).
 */
export function getNextDueDate(config: RepeatConfig, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  if (typeof config === 'string') {
    switch (config) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekdays': {
        d.setDate(d.getDate() + 1);
        // skip Sat(6) and Sun(0)
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
        break;
      }
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
      default:
        // 'none' — return same date
        break;
    }
  } else {
    // CustomRepeat
    const { interval, unit, weekDays } = config;
    switch (unit) {
      case 'day':
        d.setDate(d.getDate() + interval);
        break;
      case 'week':
        if (weekDays && weekDays.length > 0) {
          // advance to the next matching weekday
          const sorted = [...weekDays].sort((a, b) => a - b);
          const today = d.getDay();
          const next = sorted.find((wd) => wd > today);
          if (next !== undefined) {
            d.setDate(d.getDate() + (next - today));
          } else {
            // wrap to first day of next cycle
            const daysUntilFirst = 7 * interval - today + sorted[0];
            d.setDate(d.getDate() + daysUntilFirst);
          }
        } else {
          d.setDate(d.getDate() + 7 * interval);
        }
        break;
      case 'month':
        d.setMonth(d.getMonth() + interval);
        break;
      case 'year':
        d.setFullYear(d.getFullYear() + interval);
        break;
    }
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Check if a repeating task should be considered active (i.e. not 'none'). */
export function hasActiveRepeat(config: RepeatConfig | undefined): boolean {
  if (!config) return false;
  if (typeof config === 'string') return config !== 'none';
  return true;
}

export function getRepeatLabel(config: RepeatConfig | undefined, lang: 'en' | 'ja'): string {
  if (!config) return '';
  if (typeof config === 'string') {
    return PRESET_LABELS[config]?.[lang] ?? '';
  }
  return formatCustom(config, lang);
}
