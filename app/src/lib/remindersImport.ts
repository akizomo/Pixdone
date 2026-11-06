import type { RepeatConfig, Task } from '../types/task';
import type { List } from '../types/list';
import type { ReminderItem, ReminderRecurrence } from '../services/reminders';

/**
 * Map a Reminders recurrence rule to a PixDone repeat.
 * Only simple daily / weekly rules are mapped (spec); anything else imports without repeat.
 */
export function mapReminderRecurrence(rec: ReminderRecurrence | undefined): RepeatConfig | null {
  if (!rec || rec.interval !== 1) return null;
  if (rec.frequency === 'daily' && !rec.weekDays?.length) return 'daily';
  if (rec.frequency === 'weekly') {
    if (!rec.weekDays?.length) return 'weekly';
    if (rec.hasWeekNumbers) return null;
    const days = [...new Set(rec.weekDays)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
    if (days.length === 0) return 'weekly';
    return { type: 'custom', interval: 1, unit: 'week', weekDays: days };
  }
  return null;
}

export type ImportTaskFields = Partial<Task> & { title: string };

/** Convert one reminder to the fields passed to addTask. Returns null for an empty title. */
export function reminderToTaskFields(item: ReminderItem): ImportTaskFields | null {
  const title = item.title.trim();
  if (!title) return null;
  const repeat = mapReminderRecurrence(item.recurrence);
  const fields: ImportTaskFields = { title, dueDate: item.dueDate ?? null };
  const notes = item.notes?.trim();
  if (notes) fields.details = notes;
  if (repeat) fields.repeat = repeat;
  return fields;
}

/** Where a selected Reminders list goes. */
export type ImportTarget = { kind: 'new'; name: string } | { kind: 'existing'; listId: string };

export interface ImportGroup {
  target: ImportTarget;
  tasks: ImportTaskFields[];
}

/** Normal lists only (Smash List is virtual and never counts toward the free limit). */
export function countNormalLists(lists: List[]): number {
  return lists.filter((l) => l.id !== 'smash-list').length;
}

export const FREE_LIST_LIMIT = 3;

/** How many new lists the user can still create. Infinity for PixDone+. */
export function remainingListSlots(lists: List[], isPremium: boolean): number {
  if (isPremium) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_LIST_LIMIT - countNormalLists(lists));
}

/** Group fetched reminders by the chosen target, in the order the lists were selected. */
export function buildImportGroups(
  items: ReminderItem[],
  targets: { reminderListId: string; target: ImportTarget }[],
): ImportGroup[] {
  return targets.map(({ reminderListId, target }) => ({
    target,
    tasks: items
      .filter((i) => i.listId === reminderListId)
      .map(reminderToTaskFields)
      .filter((f): f is ImportTaskFields => f !== null),
  }));
}
