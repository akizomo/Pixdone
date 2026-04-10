import { useEffect, useRef } from 'react';
import type { Task } from '../types/task';
import { TaskItem } from './TaskItem';
import { isEditingText } from '../lib/utils';
import { playSound } from '../services/sound';
import './SmashListPanel.css';

export interface SmashListPanelProps {
  subtitle: string;
  hint?: string;
  tasks: Task[];
  onSmash: (taskId: string) => void;
  getDisplayTitle: (task: Task) => string;
}

/** Split "sentence. sentence" into fragments with <br /> between them. */
function renderWithLineBreaks(text: string) {
  const parts = text.split('. ');
  return parts.map((part, i) => (
    <span key={i}>
      {part}{i < parts.length - 1 ? <>.<br /></> : null}
    </span>
  ));
}

/** Replace "Space" keyword with a styled <span className="command-key">. */
function renderWithCommandKey(text: string) {
  return text.split(/\b(Space)\b/).map((part, i) =>
    part === 'Space' ? <span key={i} className="command-key">Space</span> : part,
  );
}

export function SmashListPanel({
  subtitle,
  hint,
  tasks,
  onSmash,
  getDisplayTitle,
}: SmashListPanelProps) {
  const spaceKeyDownRef = useRef(false);
  const spaceLongPressRef = useRef(false);

  useEffect(() => {
    let spaceHoldTimer: ReturnType<typeof setTimeout> | null = null;
    const holdMs =
      typeof window !== 'undefined' && window.PerfectTimingManager?.config?.holdThresholdMs
        ? window.PerfectTimingManager.config.holdThresholdMs
        : 350;

    const clearHold = () => {
      if (spaceHoldTimer) {
        clearTimeout(spaceHoldTimer);
        spaceHoldTimer = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || isEditingText()) return;
      const isSpace = e.key === ' ' || e.code === 'Space';
      if (!isSpace || e.ctrlKey || e.altKey || e.metaKey) return;
      const first = tasks.find((t) => !t.completed);
      if (!first) return;
      e.preventDefault();
      if (e.repeat) return;
      spaceLongPressRef.current = false;
      clearHold();
      spaceKeyDownRef.current = true;
      spaceHoldTimer = setTimeout(() => {
        spaceHoldTimer = null;
        spaceLongPressRef.current = true;
        const taskEl = document.querySelector(`[data-task-id="${first.id}"]`) as HTMLElement | null;
        if (typeof window.PerfectTimingManager?.openForTask === 'function') {
          window.PerfectTimingManager.openForTask(first.id, taskEl);
          playSound('buttonClick');
        } else {
          onSmash(first.id);
        }
      }, holdMs);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isSpace = e.key === ' ' || e.code === 'Space';
      if (!isSpace || e.ctrlKey || e.altKey || e.metaKey) {
        spaceKeyDownRef.current = false;
        return;
      }
      clearHold();
      if (spaceKeyDownRef.current && !spaceLongPressRef.current) {
        e.preventDefault();
        const first = tasks.find((t) => !t.completed);
        if (first) onSmash(first.id);
      }
      spaceKeyDownRef.current = false;
      spaceLongPressRef.current = false;
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    return () => {
      clearHold();
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [tasks, onSmash]);

  return (
    <div className="pd-smash-panel">
      <div className="pd-smash-card">
        <p className="pd-smash-card__subtitle">
          {renderWithLineBreaks(subtitle)}
        </p>
        {hint && (
          <p className="pd-smash-card__hint">
            {renderWithCommandKey(hint)}
          </p>
        )}
      </div>
      <div className="pd-smash-panel__list">
        {tasks.filter((t) => !t.completed).slice(0, 3).map((task) => (
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
