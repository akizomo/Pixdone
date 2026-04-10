/**
 * MobileTaskSheet — self-contained BottomSheet for task add/edit on mobile.
 *
 * Identical pattern to ChallengeMenu:
 *   - Owns its own `open` state
 *   - onClose = () => setOpen(false)
 *   - NO state sync back to parent (no onOpenChange, no cascading re-renders)
 *   - Parent controls it via imperative ref only
 */
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { BottomSheet } from '../design-system/components/BottomSheet/BottomSheet';
import { TaskForm } from './TaskForm';
import type { TaskFormHandle } from './TaskForm';
import type { Task } from '../types/task';
import { playSound } from '../services/sound';

export interface MobileTaskSheetHandle {
  openAdd: () => void;
  openEdit: (taskId: string) => void;
  close: () => void;
}

interface MobileTaskSheetProps {
  lang: 'en' | 'ja';
  tasks: Task[];
  currentListId: string;
  onAddTask: (listId: string, fields: Partial<Task> & { title: string }) => void;
  onUpdateTask: (taskId: string, fields: Partial<Task> & { title: string }) => void;
  onDeleteRequest: (taskId: string) => void;
  onMoveToList: (taskId: string, targetListId: string) => void;
  availableLists: Array<{ id: string; name: string }>;
}

export const MobileTaskSheet = forwardRef<MobileTaskSheetHandle, MobileTaskSheetProps>(
  function MobileTaskSheet(
    { lang, tasks, currentListId, onAddTask, onUpdateTask, onDeleteRequest, onMoveToList, availableLists },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'add' | 'edit'>('add');
    const [editTaskId, setEditTaskId] = useState<string | null>(null);
    const taskFormRef = useRef<TaskFormHandle>(null);

    const task = editTaskId ? tasks.find((t) => t.id === editTaskId) ?? undefined : undefined;

    useImperativeHandle(ref, () => ({
      openAdd() {
        setEditTaskId(null);
        setMode('add');
        setOpen(true);
      },
      openEdit(taskId: string) {
        setEditTaskId(taskId);
        setMode('edit');
        setOpen(true);
      },
      close() {
        setOpen(false);
      },
    }), []);

    const handleSave = useCallback((fields: Partial<Task> & { title: string }) => {
      if (mode === 'add') {
        onAddTask(currentListId, fields);
        playSound('taskAdd');
      } else if (editTaskId) {
        onUpdateTask(editTaskId, fields);
        playSound('taskAdd');
      }
      setOpen(false);
    }, [mode, editTaskId, currentListId, onAddTask, onUpdateTask]);

    const title = mode === 'edit'
      ? (lang === 'ja' ? 'タスクを編集' : 'Edit task')
      : (lang === 'ja' ? 'タスクを追加' : 'Add a task');

    return (
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
      >
        <TaskForm
          ref={taskFormRef}
          lang={lang}
          listId={currentListId}
          task={task}
          onSave={handleSave}
          onCancel={() => { playSound('taskCancel'); setOpen(false); }}
          onClose={() => setOpen(false)}
          onDelete={editTaskId ? () => onDeleteRequest(editTaskId) : undefined}
          availableLists={availableLists}
          onMoveToList={onMoveToList}
        />
      </BottomSheet>
    );
  },
);
