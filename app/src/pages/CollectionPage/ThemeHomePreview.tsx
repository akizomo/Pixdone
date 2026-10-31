import { useCallback, useRef, useState } from 'react';
import { TaskItem } from '../../components/TaskItem';
import type { Task } from '../../types/task';
import './ThemeHomePreview.css';

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
    <div className="theme-home-preview__box-1">
      {/* Match Tasks tab spacing: no outer frame, just content */}
      <div className="theme-home-preview__match-tasks-tab-spacing-no-o">
        <div className="theme-home-preview__row-1">
          <h1 className="pd-app-title theme-home-preview__text-1">
            PixDone
          </h1>
          {/* Keep empty space similar to real header icons */}
          <div className="theme-home-preview__keep-empty-space-similar-to-" aria-hidden />
        </div>

        <div className="theme-home-preview__box-2">
          {/* Tabs (visual only) */}
          <div
            className="pd-list-tabs-scroll theme-home-preview__tabs-visual-only"
            role="tablist"
            aria-label={lang === 'ja' ? 'リストタブ' : 'List tabs'}
          >
            <button
              type="button"
              role="tab"
              aria-selected
              className="theme-home-preview__text-2"
            >
              {lang === 'ja' ? 'チュートリアル' : 'Tutorial'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              className="theme-home-preview__text-3"
            >
              💥
            </button>
          </div>
        </div>

        <div className="theme-home-preview__box-2">
          <div
            className="theme-home-preview__text-4"
          >
            {lang === 'ja' ? 'マイタスク' : 'My Tasks'}
          </div>
        </div>

        <div className="theme-home-preview__col-1">
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

