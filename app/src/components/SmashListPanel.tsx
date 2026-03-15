import { useEffect } from 'react';
import type { Task } from '../types/task';
import { TaskItem } from './TaskItem';
import { isEditingText } from '../lib/utils';

export interface SmashListPanelProps {
  subtitle: string;
  hint?: string;
  tasks: Task[];
  onSmash: (taskId: string) => void;
  getDisplayTitle: (task: Task) => string;
}

export function SmashListPanel({ subtitle, hint, tasks, onSmash, getDisplayTitle }: SmashListPanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || isEditingText()) return;
      if (e.key !== ' ') return;
      e.preventDefault();
      const first = tasks.find((t) => !t.completed);
      if (first) onSmash(first.id);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tasks, onSmash]);

  return (
    <div style={{ padding: '16px' }}>
      <div
        style={{
          padding: '12px',
          marginBottom: '24px',
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
