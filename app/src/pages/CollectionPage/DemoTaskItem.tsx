import { forwardRef, useRef, useImperativeHandle, useMemo, useState } from 'react';
import { TaskItem } from '../../components/TaskItem';
import type { Task } from '../../types/task';
import './DemoTaskItem.css';

interface DemoTaskItemProps {
  lang: 'en' | 'ja';
  onSmash: () => void;
}

const MAX_TITLE_LENGTH = 50;

export const DemoTaskItem = forwardRef<HTMLDivElement, DemoTaskItemProps>(
  ({ lang, onSmash }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [title, setTitle] = useState('');

    useImperativeHandle(ref, () => {
      return (wrapperRef.current?.querySelector<HTMLDivElement>('.task-item') ?? wrapperRef.current) as HTMLDivElement;
    });

    const placeholder = lang === 'ja' ? '叩いてみて！' : 'Smash me!';

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
          onComplete={onSmash}
          onEdit={onSmash}
        />
      </div>
    );
  },
);

DemoTaskItem.displayName = 'DemoTaskItem';
