import { useEffect, useRef, useState } from 'react';
import type { List } from '../types/list';
import type { Task } from '../types/task';
import { usePlanView } from '../hooks/usePlanView';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { PixelIcon } from '../design-system';
import { playSound } from '../services/sound';
import './PlanView.css';

export interface PlanViewProps {
  lists: List[];
  lang: 'en' | 'ja';
  onComplete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onUpdateTask: (taskId: string, fields: Partial<Task>) => void;
  /** Add a task to the default list ("My tasks"). If omitted, the Add button is hidden. */
  onAddTask?: (fields: Partial<Task> & { title: string }) => void;
  /** Incremented by the shell to force-open the add-task form (used by onboarding). */
  autoOpenAddTaskNonce?: number;
  /** Fires when the user presses the Add button — the shell uses this to close the onboarding tour. */
  onAddButtonClick?: () => void;
  /** During the onboarding Step 5 tour, the Add button is lifted above the translucent overlay and pulses. */
  isOnboardingTour?: boolean;
}

const SOMEDAY_INITIAL_LIMIT = 10;

interface SectionProps {
  title: string;
  tasks: Task[];
  lang: 'en' | 'ja';
  onComplete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  collapsible?: boolean;
  initialLimit?: number;
  /** Drag-and-drop: section key for drop target */
  sectionKey: string;
  onDrop?: (taskId: string, sectionKey: string) => void;
}

function PlanSection({
  title,
  tasks,
  lang,
  onComplete,
  onEdit,
  initialLimit,
  sectionKey,
  onDrop,
}: SectionProps) {
  const [expanded, setExpanded] = useState(false);
  const hasLimit = initialLimit !== undefined && tasks.length > initialLimit;
  const visibleTasks = hasLimit && !expanded ? tasks.slice(0, initialLimit) : tasks;
  const hiddenCount = tasks.length - (initialLimit ?? tasks.length);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onDrop) {
      onDrop(taskId, sectionKey);
    }
  };

  if (tasks.length === 0) return null;

  return (
    <div
      className="pd-plan-section"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3 className="pd-plan-section__title">{title}</h3>
      <div className="pd-plan-section__tasks">
        {visibleTasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', task.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
          >
            <TaskItem
              task={task}
              lang={lang}
              onComplete={onComplete}
              onEdit={onEdit}
            />
          </div>
        ))}
      </div>
      {hasLimit && !expanded && (
        <button
          type="button"
          className="pd-plan-section__show-more"
          onClick={() => { playSound('buttonClick'); setExpanded(true); }}
        >
          {lang === 'ja' ? `さらに ${hiddenCount} 件表示` : `Show ${hiddenCount} more`}
          <PixelIcon name="chevron_right_2" size="0.75rem" style={{ transform: 'rotate(90deg)' }} />
        </button>
      )}
    </div>
  );
}

export function PlanView({
  lists,
  lang,
  onComplete,
  onEdit,
  onUpdateTask,
  onAddTask,
  autoOpenAddTaskNonce,
  onAddButtonClick,
  isOnboardingTour,
}: PlanViewProps) {
  const plan = usePlanView(lists);
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

  const handleDrop = (taskId: string, sectionKey: string) => {
    const today = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let newDueDate: string | null = null;
    if (sectionKey === 'today') {
      newDueDate = fmt(today);
    } else if (sectionKey === 'tomorrow') {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      newDueDate = fmt(d);
    } else if (sectionKey === 'upcoming') {
      const d = new Date(today);
      d.setDate(d.getDate() + 2);
      newDueDate = fmt(d);
    }
    // someday → null (remove due date)

    playSound('taskEdit');
    onUpdateTask(taskId, { dueDate: newDueDate });
  };

  const sectionData: Array<{ key: string; title: string; tasks: Task[]; limit?: number }> = [
    { key: 'today', title: lang === 'ja' ? '今日' : 'Today', tasks: plan.today },
    { key: 'tomorrow', title: lang === 'ja' ? '明日' : 'Tomorrow', tasks: plan.tomorrow },
    { key: 'upcoming', title: lang === 'ja' ? '今後' : 'Upcoming', tasks: plan.upcoming },
    { key: 'someday', title: lang === 'ja' ? 'いつか' : 'Someday', tasks: plan.someday, limit: SOMEDAY_INITIAL_LIMIT },
  ];

  const totalTasks = plan.today.length + plan.tomorrow.length + plan.upcoming.length + plan.someday.length;

  const addUi = hasAdd ? (
    isAdding ? (
      <TaskForm
        lang={lang}
        listId="default"
        onSave={handleSave}
        onCancel={() => setIsAdding(false)}
      />
    ) : (
      <button
        type="button"
        className="pd-plan-view__add-btn"
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
    )
  ) : null;

  if (totalTasks === 0) {
    return (
      <div className="pd-plan-view">
        <h2 className="pd-plan-view__title">{lang === 'ja' ? 'プラン' : 'Plan'}</h2>
        {addUi}
        <div className="pd-plan-empty">
          <p>{lang === 'ja' ? 'タスクがありません' : 'No tasks yet'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-plan-view">
      <h2 className="pd-plan-view__title">{lang === 'ja' ? 'プラン' : 'Plan'}</h2>
      {addUi}
      {sectionData.map((s) => (
        <PlanSection
          key={s.key}
          sectionKey={s.key}
          title={s.title}
          tasks={s.tasks}
          lang={lang}
          onComplete={onComplete}
          onEdit={onEdit}
          initialLimit={s.limit}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
