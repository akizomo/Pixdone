/**
 * MobileTaskSheet — BottomSheet for task add/edit on mobile.
 *
 * ChallengeMenu と完全に同じパターン:
 *   - 自前の `open` state を管理
 *   - onClose = () => setOpen(false) の1行のみ
 *   - save は close と分離: 先にデータを保存し、rAF で1フレーム遅延させてから close
 *     (親の再レンダーが CSS transition を潰さないようにする)
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

    // Close — BottomSheet now drives the close animation via inline styles,
    // so immediate setOpen(false) is safe regardless of parent re-renders.
    const close = useCallback(() => {
      setOpen(false);
    }, []);

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
      // Defer close by 1 frame so the parent re-render from onAddTask/onUpdateTask
      // settles before we trigger the BottomSheet close animation.
      close();
    }, [mode, editTaskId, currentListId, onAddTask, onUpdateTask, close]);

    const handleCancel = useCallback(() => {
      playSound('taskCancel');
      close();
    }, [close]);

    const title = mode === 'edit'
      ? (lang === 'ja' ? 'タスクを編集' : 'Edit task')
      : (lang === 'ja' ? 'タスクを追加' : 'Add a task');

    return (
      <BottomSheet
        open={open}
        onClose={close}
        title={title}
      >
        <TaskForm
          ref={taskFormRef}
          lang={lang}
          listId={currentListId}
          task={task}
          onSave={handleSave}
          onCancel={handleCancel}
          onClose={close}
          onDelete={editTaskId ? () => onDeleteRequest(editTaskId) : undefined}
          availableLists={availableLists}
          onMoveToList={onMoveToList}
          mobile
        />
      </BottomSheet>
    );
  },
);
