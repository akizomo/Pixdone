import type { Task } from './task';

export type SortMode = 'manual' | 'dueDate' | 'priority' | 'createdAt' | 'alphabetical';

export interface List {
  id: string;
  name: string;
  tasks: Task[];
  sortMode?: SortMode;
}
