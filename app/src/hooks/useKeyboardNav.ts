import { useEffect } from 'react';
import { isEditingText } from '../lib/utils';

interface UseKeyboardNavOptions {
  lists: { id: string }[];
  activeListId: string;
  onSelect: (id: string) => void;
  onSound?: () => void;
}

export function useKeyboardNav({ lists, activeListId, onSelect, onSound }: UseKeyboardNavOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.isComposing) return;
      if (isEditingText()) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      const idx = lists.findIndex((l) => l.id === activeListId);
      if (idx < 0) return;

      let next = idx;
      if (e.key === 'ArrowLeft') next = idx > 0 ? idx - 1 : idx;
      if (e.key === 'ArrowRight') next = idx < lists.length - 1 ? idx + 1 : idx;

      if (next !== idx) {
        onSelect(lists[next].id);
        onSound?.();
        e.preventDefault();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lists, activeListId, onSelect, onSound]);
}
