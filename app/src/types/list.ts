import type { Task } from './task';

export interface List {
  id: string;
  name: string;
  tasks: Task[];
}
