import { useEffect, useRef, useState } from 'react';
import type { List } from '../types/list';
import type { Task } from '../types/task';
import { useTodayView } from '../hooks/useTodayView';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { PixelIcon } from '../design-system';
import { playSound } from '../services/sound';
import { getTodayYMD } from '../lib/date';
import './TodayView.css';

export interface TodayViewProps {
  lists: List[];
  lang: 'en' | 'ja';
  onComplete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  /** Add a task to the default list ("My tasks"). If omitted, the Add button is hidden. */
  onAddTask?: (fields: Partial<Task> & { title: string }) => void;
  /** Incremented by the shell to force-open the add-task form (used by onboarding). */
  autoOpenAddTaskNonce?: number;
  /** Fires when the user presses the Add button — the shell uses this to close the onboarding tour. */
  onAddButtonClick?: () => void;
  /** During the onboarding Step 5 tour, the Add button is lifted above the translucent overlay and pulses. */
  isOnboardingTour?: boolean;
}

export function TodayView({
  lists,
  lang,
  onComplete,
  onEdit,
  onAddTask,
  autoOpenAddTaskNonce,
  onAddButtonClick,
  isOnboardingTour,
}: TodayViewProps) {
  const tasks = useTodayView(lists);
  const listNameById = new Map(lists.map((l) => [l.id, l.name]));
  const [isAdding, setIsAdding] = useState(false);

  const lastConsumedNonce = useRef(autoOpenAddTaskNonce ?? 0);
  useEffect(() => {
    if (!autoOpenAddTaskNonce || !onAddTask) return;
    if (autoOpenAddTaskNonce === lastConsumedNonce.current) return;
    lastConsumedNonce.current = autoOpenAddTaskNonce;
    setIsAdding(true);
  }, [autoOpenAddTaskNonce, onAddTask]);

  const handleSave = (fields: Partial<Task> & { title: string }) => {
    onAddTask?.(fields);
    setIsAdding(false);
  };

  const hasAdd = !!onAddTask;

  return (
    <div className="pd-today-view">
      <h2 className="pd-today-view__title">{lang === 'ja' ? '今日' : 'Today'}</h2>
      {hasAdd && isAdding && (
        <TaskForm
          lang={lang}
          listId="default"
          initialDueDate={getTodayYMD()}
          onSave={handleSave}
          onCancel={() => setIsAdding(false)}
        />
      )}
      {hasAdd && !isAdding && (
        <button
          type="button"
          className="pd-today-view__add-btn"
          data-tour={isOnboardingTour ? 'true' : 'false'}
          onClick={() => {
            playSound('taskAdd');
            setIsAdding(true);
            onAddButtonClick?.();
          }}
        >
          <PixelIcon name="add" size="18px" />
          <span>{lang === 'ja' ? 'タスクを追加' : 'Add a task'}</span>
        </button>
      )}
      {tasks.length === 0 ? (
        <div className="pd-today-empty">
          <p>{lang === 'ja' ? '今日のタスクはありません' : 'No tasks for today'}</p>
        </div>
      ) : (
        <div className="pd-today-view__tasks">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              lang={lang}
              onComplete={onComplete}
              onEdit={onEdit}
              listName={listNameById.get(task.listId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
