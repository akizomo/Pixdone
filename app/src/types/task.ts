export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  priority?: string;
  description?: string;
  subtasks?: Subtask[];
  listId: string;
}
