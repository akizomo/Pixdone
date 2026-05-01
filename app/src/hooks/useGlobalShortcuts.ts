import { useEffect } from 'react';
import { isEditingText } from '../lib/utils';

interface UseGlobalShortcutsOptions {
  enabled: boolean;
  onToday: () => void;
  onPlan: () => void;
  onSmash: () => void;
  onFocusZen: () => void;
  onCollection: () => void;
  onAddTask: () => void;
}

export function useGlobalShortcuts({
  enabled,
  onToday,
  onPlan,
  onSmash,
  onFocusZen,
  onCollection,
  onAddTask,
}: UseGlobalShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;
    function handle(e: KeyboardEvent) {
      if (e.isComposing) return;
      if (isEditingText()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 't': onToday(); break;
        case 'p': onPlan(); break;
        case 's': onSmash(); break;
        case 'f': onFocusZen(); break;
        case 'c': onCollection(); break;
        case 'n': onAddTask(); break;
        default: return;
      }
      e.preventDefault();
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [enabled, onToday, onPlan, onSmash, onFocusZen, onCollection, onAddTask]);
}
