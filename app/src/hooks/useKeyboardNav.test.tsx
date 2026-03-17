import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKeyboardNav } from './useKeyboardNav';

function TestComponent({
  lists,
  activeId,
  onSelect,
  onSound,
}: {
  lists: { id: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  onSound?: () => void;
}) {
  useKeyboardNav({ lists, activeListId: activeId, onSelect, onSound });
  return <div>test</div>;
}

describe('useKeyboardNav', () => {
  const lists = [{ id: 'smash-list' }, { id: 'default' }, { id: 'list-2' }];

  let onSelect: (id: string) => void;
  let onSound: () => void;

  beforeEach(() => {
    onSelect = vi.fn<(id: string) => void>();
    onSound = vi.fn<() => void>();
  });

  afterEach(() => {
    (onSelect as any).mockReset?.();
    (onSound as any).mockReset?.();
  });

  it('moves focus right and left within listTabsOrder and plays sound', () => {
    render(
      <TestComponent
        lists={lists}
        activeId="smash-list"
        onSelect={onSelect}
        onSound={onSound}
      />,
    );

    const right = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    document.dispatchEvent(right);

    expect(onSelect).toHaveBeenCalledWith('default');
    expect(onSound).toHaveBeenCalledTimes(1);

    (onSelect as any).mockReset();
    (onSound as any).mockReset();

    const left = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    document.dispatchEvent(left);

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSound).not.toHaveBeenCalled();
  });

  it('does nothing for non-arrow keys', () => {
    render(
      <TestComponent
        lists={lists}
        activeId="smash-list"
        onSelect={onSelect}
        onSound={onSound}
      />,
    );

    const enter = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(enter);

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSound).not.toHaveBeenCalled();
  });
});

