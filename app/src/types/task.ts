export interface Subtask {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string;
  details?: string;
}

/** Preset repeat shortcuts */
export type RepeatPreset = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly';

/** Custom repeat configuration */
export interface CustomRepeat {
  type: 'custom';
  interval: number;
  unit: 'day' | 'week' | 'month' | 'year';
  /** 0=Sun, 1=Mon, …, 6=Sat — only used when unit is 'week' */
  weekDays?: number[];
}

export type RepeatConfig = RepeatPreset | CustomRepeat;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  dueDate: string | null;
  priority?: 'high' | 'medium' | 'low';
  details?: string;
  repeat?: RepeatConfig;
  subtasks?: Subtask[];
  listId: string;
  smashIdx?: number;
  /** Active-task order; set when user reorders or syncs from Firestore */
  sortOrder?: number;
}
