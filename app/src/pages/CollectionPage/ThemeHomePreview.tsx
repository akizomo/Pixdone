import { useMemo, useRef } from 'react';
import { TaskItem } from '../../components/TaskItem';
import type { Task } from '../../types/task';

type ThemeHomePreviewProps = {
  lang: 'en' | 'ja';
  onTriggerEffect: (taskEl: HTMLElement) => void;
};

function DemoRow({
  task,
  lang,
  onTriggerEffect,
}: {
  task: Task;
  lang: 'en' | 'ja';
  onTriggerEffect: (taskEl: HTMLElement) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const trigger = () => {
    const el =
      rowRef.current?.querySelector<HTMLElement>('.task-item') ??
      rowRef.current ??
      null;
    if (!el) return;
    onTriggerEffect(el);
  };

  return (
    <div ref={rowRef}>
      <TaskItem
        task={task}
        lang={lang}
        onComplete={() => trigger()}
        onEdit={() => trigger()}
      />
    </div>
  );
}

export function ThemeHomePreview({ lang, onTriggerEffect }: ThemeHomePreviewProps) {
  const demoTasks = useMemo<Task[]>(() => ([
    {
      id: 'demo-1',
      // Keep the original short copy (same as the old DemoTaskItem).
      title: lang === 'ja' ? '叩いてみて！' : 'Smash me!',
      completed: false,
      dueDate: null,
      listId: 'demo',
    },
  ]), [lang]);

  return (
    <div style={{ width: '100%', maxWidth: '560px' }}>
      {/* Match Tasks tab spacing: no outer frame, just content */}
      <div style={{ padding: '4px 4px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="pd-app-title" style={{ fontSize: '24px', textShadow: '1px 1px 0px var(--pd-color-shadow-default)' }}>
            PixDone
          </h1>
          {/* Keep empty space similar to real header icons */}
          <div style={{ width: 56 }} aria-hidden />
        </div>

        <div style={{ marginTop: '10px' }}>
          {/* Tabs (visual only) */}
          <div
            className="pd-list-tabs-scroll"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}
            role="tablist"
            aria-label={lang === 'ja' ? 'リストタブ' : 'List tabs'}
          >
            <button
              type="button"
              role="tab"
              aria-selected
              style={{
                padding: '4px 6px',
                border: 'none',
                borderBottom: '2px solid var(--pd-color-accent-default)',
                background: 'none',
                fontFamily: 'var(--pd-font-body)',
                fontSize: '0.8125rem',
                color: 'var(--pd-color-text-primary)',
                fontWeight: 600,
                lineHeight: 1.2,
                cursor: 'default',
              }}
            >
              {lang === 'ja' ? 'チュートリアル' : 'Tutorial'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              style={{
                padding: '4px 6px',
                border: 'none',
                borderBottom: '2px solid transparent',
                background: 'none',
                fontFamily: 'var(--pd-font-body)',
                fontSize: '0.8125rem',
                color: 'var(--pd-color-text-secondary)',
                fontWeight: 400,
                lineHeight: 1.2,
                cursor: 'default',
              }}
            >
              💥
            </button>
          </div>
        </div>

        <div style={{ marginTop: '10px' }}>
          <div
            style={{
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--pd-color-text-primary)',
              margin: 0,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textShadow: '1px 1px 0px var(--pd-color-shadow-default)',
              padding: '8px 0',
            }}
          >
            {lang === 'ja' ? 'マイタスク' : 'My Tasks'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {demoTasks.map((t) => (
            <DemoRow
              key={t.id}
              task={t}
              lang={lang}
              onTriggerEffect={onTriggerEffect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

