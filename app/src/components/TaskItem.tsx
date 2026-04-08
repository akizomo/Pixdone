import type { PointerEvent, TouchEvent } from 'react';
import type { Task } from '../types/task';
import { formatDueDate, getDueStatus } from '../lib/date';
import { t } from '../lib/i18n';
import { renderTextWithLinks } from '../lib/linkify';

export interface TaskItemProps {
  task: Task;
  isSmash?: boolean;
  lang?: 'en' | 'ja';
  /**
   * When true, do not stop pointerdown propagation on desktop.
   * Needed for libraries (e.g. Swapy) that listen on ancestor elements.
   */
  allowPointerDownPropagation?: boolean;
  onComplete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  /** When true, row click does not open edit (e.g. after long-press reorder). */
  suppressOpenEdit?: () => boolean;
  /** Long-press reorder: Pointer path (mouse, pen, or touch when not using the dedicated touch path). */
  onReorderPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
  /** Long-press reorder: Touch path (iOS / coarse pointer devices). */
  onReorderTouchStart?: (e: TouchEvent<HTMLDivElement>) => void;
  /** True while this row is the source of an in-progress long-press reorder. */
  reorderSource?: boolean;
  /** Tutorial task 3: in-page link to the Smash List tab (header tabs). */
  onTutorialSmashLinkClick?: () => void;
  /** Tutorial task 4: jump to Focus screen. */
  onTutorialFocusLinkClick?: () => void;
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
};

export function TaskItem({
  task,
  isSmash = false,
  lang = 'en',
  allowPointerDownPropagation: _allowPointerDownPropagation = false,
  onComplete,
  onEdit,
  onDelete,
  suppressOpenEdit,
  onReorderPointerDown,
  onReorderTouchStart,
  reorderSource = false,
  onTutorialSmashLinkClick,
  onTutorialFocusLinkClick,
}: TaskItemProps) {
  const dueLabel = formatDueDate(task.dueDate, lang);
  const repeatLabel = task.repeat && task.repeat !== 'none' ? (repeatShort[task.repeat]?.[lang] ?? '') : '';
  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const dueStatus = getDueStatus(task.dueDate);
  const displayTitle = TUTORIAL_KEYS[task.id] ? t(TUTORIAL_KEYS[task.id], lang) : task.title;
  const isTutorialSmashTask = task.id === 'tutorial-3';
  const isTutorialFocusTask = task.id === 'tutorial-4';
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
      className="task-item task-item-row"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        background: reorderSource
          ? 'var(--pd-color-background-hover)'
          : 'var(--pd-color-background-default)',
        border: reorderSource
          ? '2px solid var(--pd-color-accent-default)'
          : '2px solid var(--pd-color-border-default)',
        borderRadius: 0,
        padding: '10px 12px',
        marginBottom: '8px',
        cursor: reorderSource ? 'grabbing' : 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '2px 2px 0px var(--pd-color-shadow-default)',
        imageRendering: 'pixelated',
        fontFamily: 'var(--pd-font-body)',
        opacity: task.completed ? 0.7 : reorderSource ? 0.88 : 1,
        transform: reorderSource ? 'scale(0.985)' : undefined,
        touchAction: 'pan-y',
        WebkitTouchCallout: 'none',
      }}
      data-task-id={task.id}
      onPointerDown={(e) => {
        // Mouse/pen only: list swipe listens on the scroll parent; without stopPropagation,
        // pointer capture + preventDefault on move can eat the click that should open edit (touch was OK).
        // ただし PerfectTiming のチェックボックス長押しは document の pointerdown を監視しているため、
        // チェックボックス自体をターゲットにしたイベントはバブリングを止めない。
        const isOnCheckbox = (e.target as HTMLElement | null)?.closest('.task-checkbox');
        if (!isOnCheckbox && (e.pointerType === 'mouse' || e.pointerType === 'pen')) {
          e.stopPropagation();
        }
        onReorderPointerDown?.(e);
      }}
      onTouchStart={onReorderTouchStart}
      onClick={(e) => {
        if (isSmash) return;
        if (suppressOpenEdit?.()) return;
        if ((e.target as HTMLElement).closest('a')) return;
        onEdit(task.id);
      }}
      onMouseEnter={(e) => {
        if (reorderSource) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translate(-1px, -1px)';
        el.style.boxShadow = '3px 3px 0px var(--pd-color-shadow-default)';
        el.style.backgroundColor = 'var(--pd-color-background-hover)';
      }}
      onMouseLeave={(e) => {
        if (reorderSource) return;
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
        className="task-checkbox"
        onClick={(e) => {
          e.stopPropagation();
          const btn = e.currentTarget as HTMLButtonElement;
          if ((btn as HTMLButtonElement & { dataset: DOMStringMap }).dataset?.perfectTimingConsumeClick === '1') {
            delete (btn as HTMLButtonElement & { dataset: DOMStringMap }).dataset.perfectTimingConsumeClick;
            return;
          }
          onComplete(task.id);
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          e.stopPropagation();
          onComplete(task.id);
        }}
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
            // Ensure consistent row height across visual themes/fonts.
            lineHeight: 1.35,
          }}
        >
          {isTutorialSmashTask ? (
            <>
              {t('tutorialTask3Before', lang)}
              {onTutorialSmashLinkClick ? (
                <a
                  href="#pd-list-tab-smash"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTutorialSmashLinkClick();
                  }}
                  style={{
                    color: 'var(--pd-color-accent-default)',
                    textDecoration: task.completed ? 'line-through' : 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  {t('tutorialTask3Link', lang)}
                </a>
              ) : (
                <span>{t('tutorialTask3Link', lang)}</span>
              )}
              {t('tutorialTask3After', lang)}
            </>
          ) : isTutorialFocusTask ? (
            <>
              {t('tutorialTask4Before', lang)}
              {onTutorialFocusLinkClick ? (
                <a
                  href="#pd-nav-focus"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTutorialFocusLinkClick();
                  }}
                  style={{
                    color: 'var(--pd-color-accent-default)',
                    textDecoration: task.completed ? 'line-through' : 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  {t('tutorialTask4Link', lang)}
                </a>
              ) : (
                <span>{t('tutorialTask4Link', lang)}</span>
              )}
              {t('tutorialTask4After', lang)}
            </>
          ) : (
            renderTextWithLinks(displayTitle)
          )}
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
            {renderTextWithLinks(details)}
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

      {/* Delete button — desktop: visible on row hover/focus only (see pixel.css) */}
      {!isSmash && onDelete && (
        <div className="task-item-row-actions" style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}>
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
        </div>
      )}
    </div>
  );
}
