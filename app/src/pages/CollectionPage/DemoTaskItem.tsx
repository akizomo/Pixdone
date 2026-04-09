import { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import { TaskItem } from '../../components/TaskItem';
import type { Task } from '../../types/task';

interface DemoTaskItemProps {
  lang: 'en' | 'ja';
  onSmash: () => void;
}

/**
 * A demo task using the real TaskItem component.
 * The ref exposes the inner `.task-item` DOM element so callers can
 * run the same clone-based animation as a real Smash List completion.
 */
export const DemoTaskItem = forwardRef<HTMLDivElement, DemoTaskItemProps>(
  ({ lang, onSmash }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => {
      return (wrapperRef.current?.querySelector<HTMLDivElement>('.task-item') ?? wrapperRef.current) as HTMLDivElement;
    });

    const demoTask = useMemo<Task>(() => ({
      id: 'demo-task',
      title: lang === 'ja' ? '叩いてみて！' : 'Smash me!',
      completed: false,
      dueDate: null,
      listId: 'demo',
    }), [lang]);

    return (
      <div ref={wrapperRef} style={{ width: '100%', maxWidth: '320px' }}>
        <TaskItem
          task={demoTask}
          isSmash
          lang={lang}
          onComplete={onSmash}
          onEdit={onSmash}
        />
      </div>
    );
  },
);

DemoTaskItem.displayName = 'DemoTaskItem';
