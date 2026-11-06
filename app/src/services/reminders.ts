import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Native `Reminders` plugin (iOS only, `ios/App/App/RemindersPlugin.swift`).
 * Read-only: used for the one-time "import from Reminders" flow. Never writes to Reminders.
 */
export type RemindersPermission = 'granted' | 'denied' | 'prompt';

export interface ReminderList {
  id: string;
  title: string;
  incompleteCount: number;
}

export interface ReminderRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'other';
  interval: number;
  /** 0=Sun … 6=Sat */
  weekDays?: number[];
  /** True when the rule uses "1st Monday" style week numbers (not mappable). */
  hasWeekNumbers?: boolean;
}

export interface ReminderItem {
  listId: string;
  title: string;
  notes?: string;
  /** Local YYYY-MM-DD; time is dropped on the native side. */
  dueDate?: string;
  recurrence?: ReminderRecurrence;
}

export interface RemindersPlugin {
  checkPermissions(): Promise<{ reminders: RemindersPermission }>;
  requestPermissions(): Promise<{ reminders: RemindersPermission }>;
  getLists(): Promise<{ lists: ReminderList[] }>;
  getItems(options: { listIds: string[] }): Promise<{ items: ReminderItem[] }>;
}

export const Reminders = registerPlugin<RemindersPlugin>('Reminders');

/** The import entry points are shown only in the iOS app (EventKit). */
export function isRemindersImportAvailable(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/** Ask for access if needed. Resolves to the final state. */
export async function ensureRemindersAccess(): Promise<RemindersPermission> {
  const { reminders } = await Reminders.checkPermissions();
  if (reminders !== 'prompt') return reminders;
  const res = await Reminders.requestPermissions();
  return res.reminders;
}
