export interface Subtask {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string;
  details?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  dueDate: string | null;
  priority?: string;
  details?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  subtasks?: Subtask[];
  listId: string;
  smashIdx?: number;
}
