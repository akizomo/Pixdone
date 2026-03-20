import type { Task } from '../types/task';
import { formatDueDate, getDueStatus } from '../lib/date';
import { t } from '../lib/i18n';
import { renderTextWithLinks } from '../lib/linkify';

export interface TaskItemProps {
  task: Task;
  isSmash?: boolean;
  lang?: 'en' | 'ja';
  onComplete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

const repeatShort: Record<NonNullable<Task['repeat']>, { en: string; ja: string }> = {
  none: { en: '', ja: '' },
  daily: { en: 'Daily', ja: '毎日' },
  weekly: { en: 'Weekly', ja: '毎週' },
  monthly: { en: 'Monthly', ja: '毎月' },
  yearly: { en: 'Yearly', ja: '毎年' },
};

const TUTORIAL_KEYS: Record<string, string> = {
  'tutorial-1': 'tutorialTask1',
  'tutorial-2': 'tutorialTask2',
  'tutorial-3': 'tutorialTask3',
};

export function TaskItem({ task, isSmash = false, lang = 'en', onComplete, onEdit, onDelete }: TaskItemProps) {
  const dueLabel = formatDueDate(task.dueDate, lang);
  const repeatLabel = task.repeat && task.repeat !== 'none' ? (repeatShort[task.repeat]?.[lang] ?? '') : '';
  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const dueStatus = getDueStatus(task.dueDate);
  const displayTitle = TUTORIAL_KEYS[task.id] ? t(TUTORIAL_KEYS[task.id], lang) : task.title;
  const details = (task.details ?? '').trim();

  const badgeStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    padding: '1px 5px',
    border: '1px solid',
    borderRadius: 0,
    fontFamily: 'var(--pd-font-body)',
    lineHeight: 1.4,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        background: 'var(--pd-color-background-default)',
        border: '2px solid var(--pd-color-border-default)',
        borderRadius: 0,
        padding: '10px 12px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '2px 2px 0px var(--pd-color-shadow-default)',
        imageRendering: 'pixelated',
        fontFamily: 'var(--pd-font-body)',
        opacity: task.completed ? 0.7 : 1,
      }}
      className="task-item-row"
      data-task-id={task.id}
      onClick={() => !isSmash && onEdit(task.id)}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translate(-1px, -1px)';
        el.style.boxShadow = '3px 3px 0px var(--pd-color-shadow-default)';
        el.style.backgroundColor = 'var(--pd-color-background-hover)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = '';
        el.style.boxShadow = '2px 2px 0px var(--pd-color-shadow-default)';
        el.style.backgroundColor = 'var(--pd-color-background-default)';
      }}
    >
      {/* Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          flexShrink: 0,
          marginRight: '12px',
          marginTop: '1px',
          border: '2px solid',
          borderColor: task.completed
            ? 'var(--pd-color-accent-default)'
            : 'var(--pd-color-border-default)',
          borderRadius: 0,
          background: task.completed
            ? 'var(--pd-color-accent-default)'
            : 'var(--pd-color-background-default)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '2px 2px 0px var(--pd-color-shadow-default)',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          imageRendering: 'pixelated',
        }}
      >
        {task.completed && <span aria-hidden style={{ fontSize: '0.875rem', lineHeight: 1 }}>✓</span>}
      </button>

      {/* Task body */}
      <div
        style={{ flex: 1, minWidth: 0, cursor: isSmash ? 'default' : 'pointer' }}
      >
        <span
          style={{
            display: 'block',
            color: task.completed
              ? 'var(--pd-color-text-muted)'
              : 'var(--pd-color-text-primary)',
            textDecoration: task.completed ? 'line-through' : 'none',
            fontFamily: 'var(--pd-font-body)',
            fontSize: '0.875rem',
          }}
        >
          <span onClick={(e) => e.stopPropagation()}>{renderTextWithLinks(displayTitle)}</span>
        </span>

        {details && (
          <div
            style={{
              marginTop: '6px',
              color: 'var(--pd-color-text-secondary)',
              fontFamily: 'var(--pd-font-body)',
              fontSize: '0.75rem',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            <span onClick={(e) => e.stopPropagation()}>{renderTextWithLinks(details)}</span>
          </div>
        )}

        {/* Meta row: due date, repeat, subtask count */}
        {(dueLabel || repeatLabel || subtasks.length > 0) && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            {dueLabel && (
              <span style={{
                ...badgeStyle,
                borderColor: dueStatus === 'overdue' ? 'var(--pd-color-semantic-danger, #ef4444)' : dueStatus === 'today' ? 'var(--pd-color-semantic-warning, #f59e0b)' : 'var(--pd-color-border-default)',
                color: dueStatus === 'overdue' ? 'var(--pd-color-semantic-danger, #ef4444)' : dueStatus === 'today' ? 'var(--pd-color-semantic-warning, #f59e0b)' : 'var(--pd-color-text-secondary)',
                display: 'inline-flex', alignItems: 'center', gap: '2px',
              }}>
                <span className="material-icons" style={{ fontSize: '11px', lineHeight: 1 }}>calendar_today</span> {dueLabel}
              </span>
            )}
            {repeatLabel && (
              <span style={{
                ...badgeStyle,
                borderColor: 'var(--pd-color-border-default)',
                color: 'var(--pd-color-text-secondary)',
                display: 'inline-flex', alignItems: 'center', gap: '2px',
              }}>
                <span className="material-icons" style={{ fontSize: '11px', lineHeight: 1 }}>repeat</span> {repeatLabel}
              </span>
            )}
            {subtasks.length > 0 && (
              <span style={{
                ...badgeStyle,
                borderColor: 'var(--pd-color-border-default)',
                color: doneCount === subtasks.length ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-secondary)',
              }}>
                ☑ {doneCount}/{subtasks.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Delete button */}
      {!isSmash && onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          aria-label="Delete task"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--pd-color-text-muted)',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            transition: 'color 0.2s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--pd-color-semantic-danger)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--pd-color-text-muted)'; }}
        >
          <span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>delete</span>
        </button>
      )}
    </div>
  );
}
