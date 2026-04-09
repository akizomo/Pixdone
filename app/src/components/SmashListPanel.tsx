import { useEffect, useRef } from 'react';
import type { Task } from '../types/task';
import { TaskItem } from './TaskItem';
import { isEditingText } from '../lib/utils';
import { playSound } from '../services/sound';

export interface SmashListPanelProps {
  subtitle: string;
  hint?: string;
  tasks: Task[];
  onSmash: (taskId: string) => void;
  getDisplayTitle: (task: Task) => string;
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
    <div style={{ padding: '8px 0 16px' }}>
      <div
        className="pd-smash-card"
        style={{
          padding: '10px 12px',
          marginBottom: '16px',
          border: '2px solid var(--pd-color-smash-border)',
          background: 'linear-gradient(135deg, var(--pd-color-smash-gradientStart) 0%, var(--pd-color-smash-gradientEnd) 100%)',
          boxShadow: '2px 2px 0 var(--pd-color-shadow-default)',
        }}
      >
        <p
          style={{
            color: 'var(--pd-color-smash-text)',
            fontFamily: 'var(--pd-font-body)',
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: 0,
            lineHeight: 1.35,
          }}
          dangerouslySetInnerHTML={{ __html: subtitle.replace(/\. /g, '.<br>') }}
        />
        {hint ? (
          <p
            style={{
              color: 'var(--pd-color-smash-hint)',
              fontSize: '1rem',
              fontWeight: 600,
              marginTop: '6px',
              marginBottom: 0,
              lineHeight: 1.3,
            }}
            dangerouslySetInnerHTML={{ __html: hint.replace(/\bSpace\b/g, '<span class="command-key">Space</span>') }}
          />
        ) : null}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
