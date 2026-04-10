/**
 * MobileTaskSheet — self-contained BottomSheet for task add/edit on mobile.
 *
 * Follows the exact same pattern as ChallengeMenu:
 *   - Owns its own `open` state internally
 *   - onClose = () => setOpen(false)  ← one step, no callback chains
 *   - Parent controls it via imperative ref (openAdd / openEdit / close)
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BottomSheet } from '../design-system/components/BottomSheet/BottomSheet';
import { TaskForm } from './TaskForm';
import type { TaskFormHandle } from './TaskForm';
import type { Task } from '../types/task';
import { playSound } from '../services/sound';

export interface MobileTaskSheetHandle {
  openAdd: (listId: string) => void;
  openEdit: (taskId: string) => void;
  close: () => void;
  /** Whether the sheet is currently open (for anyModalOpen etc.) */
  isOpen: () => boolean;
}

interface MobileTaskSheetProps {
  lang: 'en' | 'ja';
  /** All tasks in the current list — used to look up the task being edited */
  tasks: Task[];
  currentListId: string;
  onAddTask: (listId: string, fields: Partial<Task> & { title: string }) => void;
  onUpdateTask: (taskId: string, fields: Partial<Task> & { title: string }) => void;
  onDeleteRequest: (taskId: string) => void;
  onMoveToList: (taskId: string, targetListId: string) => void;
  availableLists: Array<{ id: string; name: string }>;
  /** Called after a new task is added (for analytics) */
  onDidAddTask?: (fields: Partial<Task> & { title: string }) => void;
  /** Syncs open state back to parent (for anyModalOpen, etc.) */
  onOpenChange?: (isOpen: boolean) => void;
}

export const MobileTaskSheet = forwardRef<MobileTaskSheetHandle, MobileTaskSheetProps>(
  function MobileTaskSheet(
    { lang, tasks, currentListId, onAddTask, onUpdateTask, onDeleteRequest, onMoveToList, availableLists, onDidAddTask, onOpenChange },
    ref,
  ) {
    // ── Own open state — exactly like ChallengeMenu ──
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'add' | 'edit'>('add');
    const [editTaskId, setEditTaskId] = useState<string | null>(null);

    const taskFormRef = useRef<TaskFormHandle>(null);

    // Sync open state to parent for anyModalOpen etc.
    useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

    const task = editTaskId ? tasks.find((t) => t.id === editTaskId) ?? undefined : undefined;

    // ── Imperative API for parent ──
    useImperativeHandle(ref, () => ({
      openAdd(_listId: string) {
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
      isOpen() {
        return open;
      },
    }), [open]);

    // ── Save handler ──
    const handleSave = useCallback((fields: Partial<Task> & { title: string }) => {
      if (mode === 'add') {
        onAddTask(currentListId, fields);
        playSound('taskAdd');
        onDidAddTask?.(fields);
      } else if (editTaskId) {
        onUpdateTask(editTaskId, fields);
        playSound('taskAdd');
      }
      setOpen(false);
    }, [mode, editTaskId, currentListId, onAddTask, onUpdateTask, onDidAddTask]);

    const handleCancel = useCallback(() => {
      playSound('taskCancel');
      setOpen(false);
    }, []);

    const handleClose = useCallback(() => {
      setOpen(false);
    }, []);

    // ── Close handler for BottomSheet — identical to ChallengeMenu ──
    const handleSheetClose = useCallback(() => {
      if (taskFormRef.current?.dismissSubmenus()) return;
      taskFormRef.current?.saveIfDirty();
      setOpen(false);
    }, []);

    const title = mode === 'edit'
      ? (lang === 'ja' ? 'タスクを編集' : 'Edit task')
      : (lang === 'ja' ? 'タスクを追加' : 'Add a task');

    return (
      <BottomSheet
        open={open}
        onClose={handleSheetClose}
        title={title}
      >
        <TaskForm
          ref={taskFormRef}
          lang={lang}
          listId={currentListId}
          task={task}
          onSave={handleSave}
          onCancel={handleCancel}
          onClose={handleClose}
          onDelete={editTaskId ? () => onDeleteRequest(editTaskId) : undefined}
          availableLists={availableLists}
          onMoveToList={onMoveToList}
        />
      </BottomSheet>
    );
  },
);
