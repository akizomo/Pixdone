import type { Task } from '../types/task';
import { TaskItem } from './TaskItem';

export interface SmashListPanelProps {
  subtitle: string;
  hint?: string;
  tasks: Task[];
  onSmash: (taskId: string) => void;
  getDisplayTitle: (task: Task) => string;
}

export function SmashListPanel({ subtitle, hint, tasks, onSmash, getDisplayTitle }: SmashListPanelProps) {
  return (
    <div className="p-4">
      <div
        className="rounded-none border-2 p-3 mb-6 pd-shadow-sm pd-pixel-ui"
        style={{
          borderColor: 'var(--pd-color-smash-border)',
          background: 'linear-gradient(135deg, var(--pd-color-smash-gradientStart) 0%, var(--pd-color-smash-gradientEnd) 100%)',
        }}
      >
        <p
          className="text-[1rem] font-semibold mb-0 leading-[1.35]"
          style={{ color: 'var(--pd-color-smash-text)', fontFamily: 'var(--pd-font-body)' }}
          dangerouslySetInnerHTML={{ __html: subtitle.replace(/\. /g, '.<br>') }}
        />
        {hint ? (
          <p
            className="text-[1rem] font-semibold mt-1.5 mb-0 leading-[1.3]"
            style={{ color: 'var(--pd-color-smash-hint)' }}
            dangerouslySetInnerHTML={{ __html: hint.replace(/\bSpace\b/g, '<kbd class="px-1 border-2 border-current rounded-none">Space</kbd>') }}
          />
        ) : null}
      </div>
      <div className="space-y-2">
        {tasks.slice(0, 3).map((task) => (
          <TaskItem
            key={task.id}
            task={{ ...task, title: getDisplayTitle(task) }}
            isSmash
            onComplete={onSmash}
            onEdit={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
