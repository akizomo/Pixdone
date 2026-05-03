import { useEffect } from 'react';

interface ShortcutHandlers {
  onTogglePanel: () => void;
  onOpenNewTask: () => void;
  onSmashByIndex: (index: number) => void;
  onEscape: () => void;
  isInputFocused: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    target.isContentEditable ||
    target.getAttribute('role') === 'textbox'
  );
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  const { onTogglePanel, onOpenNewTask, onSmashByIndex, onEscape, isInputFocused } = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const typing = isInputFocused || isTypingTarget(e.target);
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.shiftKey && (e.key === 'Y' || e.key === 'y')) {
        e.preventDefault();
        onTogglePanel();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }

      if (typing) return;

      if (e.key === 'n' || e.key === 'N') {
        if (mod || e.altKey) return;
        e.preventDefault();
        onOpenNewTask();
        return;
      }

      if (!mod && !e.altKey && !e.shiftKey && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        onSmashByIndex(Number.parseInt(e.key, 10) - 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onTogglePanel, onOpenNewTask, onSmashByIndex, onEscape, isInputFocused]);
}
