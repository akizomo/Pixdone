import { useEffect, useRef, type MutableRefObject } from 'react';
import type { List } from '../types/list';

export type PerfectTimingResult = 'miss' | 'good' | 'great' | 'perfect';

declare global {
  interface Window {
    PerfectTimingManager?: {
      setup: (
        getTaskInfo: (taskId: string) => { disabled: true } | null,
        completeTask: (
          taskId: string,
          taskElement: HTMLElement | null,
          fromPerfectTiming?: boolean,
          perfectTimingResult?: PerfectTimingResult,
        ) => void,
      ) => void;
      config?: { holdThresholdMs?: number };
      openForTask?: (taskId: string, taskElement: HTMLElement | null) => boolean;
    };
  }
}

export interface PerfectTimingBridgeCallbacks {
  onCompleteShort: (taskId: string) => void;
  onCompleteFromPt: (taskId: string, result: PerfectTimingResult) => void;
  onUncomplete: (taskId: string) => void;
  onSmashShort: (taskId: string) => void;
  onSmashFromPt: (taskId: string, result: PerfectTimingResult) => void;
}

let setupDone = false;

/**
 * Wires vanilla `PerfectTimingManager` (loaded from /perfectTiming.js) to React handlers.
 * Checkbox nodes must use `.task-checkbox` on a row with `.task-item` (see TaskItem).
 */
export function usePerfectTimingSetup(
  lists: List[],
  callbacksRef: MutableRefObject<PerfectTimingBridgeCallbacks | null>,
) {
  const listsRef = useRef(lists);
  listsRef.current = lists;

  useEffect(() => {
    const PM = typeof window !== 'undefined' ? window.PerfectTimingManager : undefined;
    if (!PM || typeof PM.setup !== 'function' || setupDone) return;
    setupDone = true;

    const getTaskInfo = (taskId: string) => {
      const task = listsRef.current.flatMap((l) => l.tasks).find((t) => String(t.id) === String(taskId));
      return task?.completed ? { disabled: true as const } : null;
    };

    const completeTask = (
      taskId: string,
      _taskElement: HTMLElement | null,
      fromPerfectTiming?: boolean,
      perfectTimingResult?: PerfectTimingResult,
    ) => {
      const cb = callbacksRef.current;
      if (!cb) return;
      const task = listsRef.current.flatMap((l) => l.tasks).find((t) => String(t.id) === String(taskId));
      if (!task) return;

      if (task.completed && !fromPerfectTiming) {
        cb.onUncomplete(taskId);
        return;
      }

      const isSmash = task.listId === 'smash-list';

      if (fromPerfectTiming && perfectTimingResult) {
        if (isSmash) {
          cb.onSmashFromPt(taskId, perfectTimingResult);
        } else {
          cb.onCompleteFromPt(taskId, perfectTimingResult);
        }
        return;
      }

      // For non-PerfectTiming interactions (plain clicks / taps), delegate to
      // existing React handlers wired to the checkbox instead of double-routing
      // through this bridge.
      if (!fromPerfectTiming) {
        return;
      }
    };

    PM.setup(getTaskInfo, completeTask);
  }, [callbacksRef]);
}
