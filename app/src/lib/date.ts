export function getTodayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getTomorrowYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDueDate(date: string | null, lang: 'en' | 'ja'): string | null {
  if (!date) return null;
  const today = getTodayYMD();
  const tomorrow = getTomorrowYMD();
  if (date === today) return lang === 'ja' ? '今日' : 'Today';
  if (date === tomorrow) return lang === 'ja' ? '明日' : 'Tomorrow';
  const [, month, day] = date.split('-');
  if (lang === 'ja') return `${Number(month)}月${Number(day)}日`;
  return `${Number(month)}/${Number(day)}`;
}

export function getDueStatus(date: string | null): 'overdue' | 'today' | 'upcoming' | null {
  if (!date) return null;
  const today = getTodayYMD();
  if (date < today) return 'overdue';
  if (date === today) return 'today';
  return 'upcoming';
}
