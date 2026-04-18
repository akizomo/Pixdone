/**
 * MobileTaskSheet — BottomSheet for task add/edit on mobile.
 *
 * ChallengeMenu と完全に同じパターン:
 *   - 自前の `open` state を管理
 *   - onClose = () => setOpen(false) の1行のみ
 *   - save は close と分離: 先にデータを保存し、rAF で1フレーム遅延させてから close
 *     (親の再レンダーが CSS transition を潰さないようにする)
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BottomSheet } from '../design-system/components/BottomSheet/BottomSheet';
import { TaskForm } from './TaskForm';
import type { TaskFormHandle } from './TaskForm';
import type { Task } from '../types/task';
import { playSound } from '../services/sound';

export interface MobileTaskSheetHandle {
  /** Open sheet in add mode. Pass `initialTitle` to prefill the title field (e.g. onboarding tour). */
  openAdd: (opts?: { initialTitle?: string }) => void;
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
    const [initialTitle, setInitialTitle] = useState<string | undefined>(undefined);
    // Tracks the list chip in the compact mobile form. Seeded on openAdd/openEdit
    // so the Send button saves to whatever list the user last picked.
    const [activeListIdInSheet, setActiveListIdInSheet] = useState(currentListId);
    const taskFormRef = useRef<TaskFormHandle>(null);
    // Skip the auto-save-on-dismiss path when the close was triggered by
    // an explicit save (Save button) or by an imperative force-close
    // (delete confirmed, list switch, etc).
    const skipAutoSaveRef = useRef(false);
    const prevOpenRef = useRef(false);

    const task = editTaskId ? tasks.find((t) => t.id === editTaskId) ?? undefined : undefined;

    // Close — BottomSheet now drives the close animation via inline styles,
    // so immediate setOpen(false) is safe regardless of parent re-renders.
    const close = useCallback(() => {
      setOpen(false);
    }, []);

    useImperativeHandle(ref, () => ({
      openAdd(opts?: { initialTitle?: string }) {
        setEditTaskId(null);
        setMode('add');
        setInitialTitle(opts?.initialTitle);
        setActiveListIdInSheet(currentListId);
        skipAutoSaveRef.current = false;
        setOpen(true);
      },
      openEdit(taskId: string) {
        setEditTaskId(taskId);
        setMode('edit');
        setInitialTitle(undefined);
        const t = tasks.find((t) => t.id === taskId);
        setActiveListIdInSheet(t?.listId ?? currentListId);
        skipAutoSaveRef.current = false;
        setOpen(true);
      },
      close() {
        // Imperative close = forced (delete / navigation) — no auto-save.
        skipAutoSaveRef.current = true;
        setOpen(false);
      },
    }), [currentListId, tasks]);

    // Auto-save on user-initiated dismissal (backdrop / swipe / Esc / X).
    // Per the BottomSheet rule, onClose stays a 1-liner; we react in an
    // effect after `open` flips to false. The TaskForm is still mounted
    // during the close animation, so the ref is valid here.
    useEffect(() => {
      if (prevOpenRef.current && !open) {
        if (!skipAutoSaveRef.current) {
          taskFormRef.current?.saveIfDirty();
        }
        skipAutoSaveRef.current = false;
      }
      prevOpenRef.current = open;
    }, [open]);

    const handleSave = useCallback((fields: Partial<Task> & { title: string }) => {
      // Save was already explicit — don't double-fire from the dismissal effect.
      skipAutoSaveRef.current = true;
      if (mode === 'add') {
        onAddTask(activeListIdInSheet, fields);
        playSound('taskAdd');
      } else if (editTaskId) {
        onUpdateTask(editTaskId, fields);
        playSound('taskAdd');
      }
      // Defer close by 1 frame so the parent re-render from onAddTask/onUpdateTask
      // settles before we trigger the BottomSheet close animation.
      close();
    }, [mode, editTaskId, activeListIdInSheet, onAddTask, onUpdateTask, close]);

    const handleCancel = useCallback(() => {
      playSound('taskCancel');
      close();
    }, [close]);

    return (
      <BottomSheet
        open={open}
        onClose={close}
      >
        <TaskForm
          ref={taskFormRef}
          lang={lang}
          listId={activeListIdInSheet}
          task={task}
          initialTitle={mode === 'add' ? initialTitle : undefined}
          onSave={handleSave}
          onCancel={handleCancel}
          onClose={close}
          onDelete={editTaskId ? () => onDeleteRequest(editTaskId) : undefined}
          availableLists={availableLists}
          onMoveToList={onMoveToList}
          onListChange={setActiveListIdInSheet}
          mobile
        />
      </BottomSheet>
    );
  },
);
