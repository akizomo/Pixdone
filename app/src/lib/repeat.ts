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

export function getRepeatLabel(config: RepeatConfig | undefined, lang: 'en' | 'ja'): string {
  if (!config) return '';
  if (typeof config === 'string') {
    return PRESET_LABELS[config]?.[lang] ?? '';
  }
  return formatCustom(config, lang);
}
