import { useCallback, useRef, useState } from 'react';
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

const DEMO_TITLES_JA = [
  '洗濯物をたたむ',
  'メールに返信する',
  '牛乳を買う',
  'ゴミを出す',
  '本を1章読む',
  '部屋を片付ける',
  'ストレッチする',
  '水を飲む',
  '明日の予定を確認',
  '机の上を整理',
];

const DEMO_TITLES_EN = [
  'Fold the laundry',
  'Reply to emails',
  'Buy milk',
  'Take out the trash',
  'Read one chapter',
  'Tidy up the room',
  'Do some stretches',
  'Drink water',
  'Review tomorrow’s plan',
  'Clean the desk',
];

function pickTitle(lang: 'en' | 'ja', prev?: string) {
  const pool = lang === 'ja' ? DEMO_TITLES_JA : DEMO_TITLES_EN;
  if (pool.length <= 1) return pool[0];
  let next = pool[Math.floor(Math.random() * pool.length)];
  while (next === prev) next = pool[Math.floor(Math.random() * pool.length)];
  return next;
}

export function ThemeHomePreview({ lang, onTriggerEffect }: ThemeHomePreviewProps) {
  const [title, setTitle] = useState<string>(() => pickTitle(lang));
  const demoTasks: Task[] = [
    {
      id: 'demo-1',
      title,
      completed: false,
      dueDate: null,
      listId: 'demo',
    },
  ];
  const handleTrigger = useCallback((el: HTMLElement) => {
    onTriggerEffect(el);
    setTitle((prev) => pickTitle(lang, prev));
  }, [onTriggerEffect, lang]);

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
              onTriggerEffect={handleTrigger}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

