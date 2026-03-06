import type { Task } from '../types/task';
import { Button } from '../design-system';

export interface TaskItemProps {
  task: Task;
  isSmash?: boolean;
  onComplete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskItem({ task, isSmash = false, onComplete, onEdit, onDelete }: TaskItemProps) {
  return (
    <div
      className={`flex items-start gap-3 py-3 px-4 mb-2 rounded-none border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] pd-shadow-sm pd-shadow-hover pd-pixel-ui transition-all ${
        task.completed ? 'opacity-70' : ''
      }`}
      data-task-id={task.id}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        className={`mt-0.5 w-6 h-6 flex-shrink-0 mr-3 border-2 flex items-center justify-center rounded-none pd-pixel-ui text-sm font-bold ${
          task.completed
            ? 'border-[var(--pd-color-accent-default)] bg-[var(--pd-color-accent-default)] text-white pd-shadow-sm'
            : 'border-[var(--pd-color-border-default)] pd-shadow-sm hover:border-[var(--pd-color-accent-default)]'
        }`}
        onClick={() => onComplete(task.id)}
      >
        {task.completed && <span aria-hidden>✓</span>}
      </button>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => !isSmash && onEdit(task.id)}
      >
        <span
          className={`text-[var(--pd-color-text-primary)] ${
            task.completed ? 'line-through text-[var(--pd-color-text-muted)]' : ''
          }`}
        >
          {task.title}
        </span>
      </div>
      {!isSmash && onDelete && (
        <Button variant="icon" onClick={() => onDelete(task.id)} aria-label="Delete task">
          🗑
        </Button>
      )}
    </div>
  );
}
