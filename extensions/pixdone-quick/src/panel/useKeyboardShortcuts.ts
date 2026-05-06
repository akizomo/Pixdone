import { useEffect } from 'react';

interface ShortcutHandlers {
  onTogglePanel: () => void;
  onOpenNewTask: () => void;
  onSmashByIndex: (index: number) => void;
  onEscape: () => void;
  isInputFocused: boolean;
  /**
   * Where to listen. Pass the panel's shadow root so events still get caught
   * even when the panel root sits inside a closed-CSS shadow boundary, AND so
   * `e.target` resolves to the actual input element (not the retargeted host)
   * — crucial for `isTypingTarget` to skip our shortcut handlers while the
   * user is typing.
   */
  target: EventTarget;
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
  const { onTogglePanel, onOpenNewTask, onSmashByIndex, onEscape, isInputFocused, target } = handlers;

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

    target.addEventListener('keydown', onKeyDown as EventListener);
    return () => target.removeEventListener('keydown', onKeyDown as EventListener);
  }, [onTogglePanel, onOpenNewTask, onSmashByIndex, onEscape, isInputFocused, target]);
}
