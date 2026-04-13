import { forwardRef, useRef, useImperativeHandle, useMemo, useState, useCallback } from 'react';
import { TaskItem } from '../../components/TaskItem';
import type { Task } from '../../types/task';
import './DemoTaskItem.css';

interface DemoTaskItemProps {
  lang: 'en' | 'ja';
  onSmash: () => void;
}

const MAX_TITLE_LENGTH = 50;

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

export const DemoTaskItem = forwardRef<HTMLDivElement, DemoTaskItemProps>(
  ({ lang, onSmash }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [title, setTitle] = useState('');

    useImperativeHandle(ref, () => {
      return (wrapperRef.current?.querySelector<HTMLDivElement>('.task-item') ?? wrapperRef.current) as HTMLDivElement;
    });

    const pickRandomTitle = useCallback(() => {
      const pool = lang === 'ja' ? DEMO_TITLES_JA : DEMO_TITLES_EN;
      return pool[Math.floor(Math.random() * pool.length)];
    }, [lang]);
    const [placeholder, setPlaceholder] = useState<string>(() => {
      const pool = lang === 'ja' ? DEMO_TITLES_JA : DEMO_TITLES_EN;
      return pool[Math.floor(Math.random() * pool.length)];
    });

    const handleSmash = useCallback(() => {
      onSmash();
      setTitle('');
      setPlaceholder((prev) => {
        if (lang === 'ja' ? DEMO_TITLES_JA.length <= 1 : DEMO_TITLES_EN.length <= 1) return prev;
        let next = pickRandomTitle();
        while (next === prev) next = pickRandomTitle();
        return next;
      });
    }, [onSmash, pickRandomTitle, lang]);

    const demoTask = useMemo<Task>(() => ({
      id: 'demo-task',
      title: title.trim() || placeholder,
      completed: false,
      dueDate: null,
      listId: 'demo',
    }), [title, placeholder]);

    const titleSlot = (
      <input
        type="text"
        className="demo-task-item__title-input"
        value={title}
        placeholder={placeholder}
        maxLength={MAX_TITLE_LENGTH}
        onChange={(e) => setTitle(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        aria-label={lang === 'ja' ? 'デモタスクのテキスト' : 'Demo task text'}
      />
    );

    return (
      <div ref={wrapperRef} style={{ width: '100%', maxWidth: '320px' }}>
        <TaskItem
          task={demoTask}
          isSmash
          lang={lang}
          titleSlot={titleSlot}
          onComplete={handleSmash}
          onEdit={handleSmash}
        />
      </div>
    );
  },
);

DemoTaskItem.displayName = 'DemoTaskItem';
