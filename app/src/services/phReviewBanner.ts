const OPENED_KEY = 'pd.phBanner.openedDates';
const DISMISSED_KEY = 'pd.phBanner.dismissed';
const REQUIRED_DAYS = 3;

export const PH_REVIEW_URL =
  'https://www.producthunt.com/products/pixdone-todo-app-with-pixel-effects';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readDates(): string[] {
  try {
    const raw = localStorage.getItem(OPENED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function recordAppOpen(): void {
  try {
    const arr = readDates();
    const today = todayStr();
    if (!arr.includes(today)) {
      arr.push(today);
      localStorage.setItem(OPENED_KEY, JSON.stringify(arr));
    }
  } catch {
    /* ignore */
  }
}

export function shouldShowPhBanner(): boolean {
  try {
    if (localStorage.getItem(DISMISSED_KEY) === '1') return false;
    return readDates().length >= REQUIRED_DAYS;
  } catch {
    return false;
  }
}

export function dismissPhBanner(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
}
