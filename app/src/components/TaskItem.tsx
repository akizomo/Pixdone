import { memo, useState, type PointerEvent, type TouchEvent } from 'react';
import type { Task } from '../types/task';
import { formatDueDate, getDueStatus } from '../lib/date';
import { t } from '../lib/i18n';
import { getRepeatLabel } from '../lib/repeat';
import { renderTextWithLinks } from '../lib/linkify';
import { playSound } from '../services/sound';
import { PopoverMenu, Badge } from '../design-system';
import './TaskItem.css';

export interface TaskItemProps {
  task: Task;
  isSmash?: boolean;
  lang?: 'en' | 'ja';
  allowPointerDownPropagation?: boolean;
  onComplete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onMoveToList?: (taskId: string, targetListId: string) => void;
  availableLists?: Array<{ id: string; name: string }>;
  suppressOpenEdit?: () => boolean;
  onReorderPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
  onReorderTouchStart?: (e: TouchEvent<HTMLDivElement>) => void;
  reorderSource?: boolean;
  onTutorialSmashLinkClick?: () => void;
  onTutorialFocusLinkClick?: () => void;
}

const TUTORIAL_KEYS: Record<string, string> = {
  'tutorial-1': 'tutorialTask1',
  'tutorial-2': 'tutorialTask2',
};

export const TaskItem = memo(function TaskItem({
  task,
  isSmash = false,
  lang = 'en',
  allowPointerDownPropagation: _allowPointerDownPropagation = false,
  onComplete,
  onEdit,
  onDelete,
  onMoveToList,
  availableLists,
  suppressOpenEdit,
  onReorderPointerDown,
  onReorderTouchStart,
  reorderSource = false,
  onTutorialSmashLinkClick,
  onTutorialFocusLinkClick,
}: TaskItemProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const displayTitle = TUTORIAL_KEYS[task.id] ? t(TUTORIAL_KEYS[task.id], lang) : task.title;
  const dueLabel = formatDueDate(task.dueDate, lang);
  const repeatLabel = getRepeatLabel(task.repeat, lang);
  const checkboxAriaLabel = t('markComplete', lang).replace('{0}', displayTitle);
  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const dueStatus = getDueStatus(task.dueDate);
  const isTutorialSmashTask = task.id === 'tutorial-3';
  const isTutorialFocusTask = task.id === 'tutorial-4';
  const details = (task.details ?? '').trim();

  const rowClass = [
    'task-item task-item-row',
    task.completed ? 'task-item-row--completed' : '',
    reorderSource ? 'task-item-row--reorder-source' : '',
  ].filter(Boolean).join(' ');

  const dueBadgeVariant = dueStatus === 'overdue' ? 'danger' as const
    : dueStatus === 'today' ? 'warning' as const
    : 'default' as const;

  return (
    <div
      className={rowClass}
      data-task-id={task.id}
      onPointerDown={(e) => {
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
    >
      {/* Checkbox zone — expanded tap target for mobile */}
      <div
        className="task-checkbox-zone"
        onClick={(e) => {
          e.stopPropagation();
          const checkbox = e.currentTarget.querySelector('.task-checkbox') as HTMLButtonElement | null;
          if (checkbox?.dataset?.perfectTimingConsumeClick === '1') {
            delete checkbox.dataset.perfectTimingConsumeClick;
            return;
          }
          onComplete(task.id);
        }}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={task.completed}
          aria-label={checkboxAriaLabel}
          className={`task-checkbox${task.completed ? ' task-checkbox--checked' : ''}`}
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            const btn = e.currentTarget as HTMLButtonElement;
            if (btn.dataset?.perfectTimingConsumeClick === '1') {
              delete btn.dataset.perfectTimingConsumeClick;
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
        >
          {task.completed && <span className="task-checkbox__mark" aria-hidden>✓</span>}
        </button>
      </div>

      {/* Task body */}
      <div className={`task-item__body${isSmash ? ' task-item__body--smash' : ''}`}>
        <span className={`task-item__title${task.completed ? ' task-item__title--completed' : ''}`}>
          {isTutorialSmashTask ? (
            <>
              {t('tutorialTask3Before', lang)}
              {onTutorialSmashLinkClick ? (
                <a
                  href="#pd-list-tab-smash"
                  className={`task-item__link${task.completed ? ' task-item__link--completed' : ''}`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTutorialSmashLinkClick(); }}
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
                  className={`task-item__link${task.completed ? ' task-item__link--completed' : ''}`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTutorialFocusLinkClick(); }}
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
          <div className="task-item__details">
            {renderTextWithLinks(details)}
          </div>
        )}

        {/* Meta row: due date, repeat, subtask count */}
        {(dueLabel || repeatLabel || subtasks.length > 0) && (
          <div className="task-item__meta">
            {dueLabel && (
              <Badge
                variant={dueBadgeVariant}
                icon={<span className="material-icons task-item__badge-icon">calendar_today</span>}
              >
                {dueLabel}
              </Badge>
            )}
            {repeatLabel && (
              <Badge icon={<span className="material-icons task-item__badge-icon">repeat</span>}>
                {repeatLabel}
              </Badge>
            )}
            {subtasks.length > 0 && (
              <Badge
                variant={doneCount === subtasks.length ? 'success' : 'default'}
              >
                ☑ {doneCount}/{subtasks.length}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!isSmash && (onDelete || (onMoveToList && availableLists && availableLists.length > 0)) && (
        <div className="task-item-row-actions">
          {onMoveToList && availableLists && availableLists.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`task-item__action-btn task-item__action-btn--move${showMoveMenu ? ' task-item__action-btn--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); playSound('buttonClick'); setShowMoveMenu((v) => !v); }}
                aria-label={t('moveToList', lang)}
                aria-expanded={showMoveMenu}
                aria-haspopup="menu"
              >
                <span className="material-icons task-item__action-icon">drive_file_move</span>
              </button>
              {showMoveMenu && (
                <PopoverMenu
                  header={t('moveToList', lang)}
                  items={availableLists.map((list) => ({ id: list.id, label: list.name }))}
                  onSelect={(listId) => { playSound('buttonClick'); onMoveToList(task.id, listId); setShowMoveMenu(false); }}
                  onClose={() => { playSound('taskCancel'); setShowMoveMenu(false); }}
                />
              )}
            </div>
          )}
          {onDelete && (
            <button
              type="button"
              className="task-item__action-btn task-item__action-btn--delete"
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              aria-label="Delete task"
            >
              <span className="material-icons task-item__action-icon">delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
});
