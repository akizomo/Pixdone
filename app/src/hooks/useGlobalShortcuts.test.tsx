import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGlobalShortcuts } from './useGlobalShortcuts';

interface Handlers {
  onToday: () => void;
  onPlan: () => void;
  onSmash: () => void;
  onFocusZen: () => void;
  onCollection: () => void;
  onAddTask: () => void;
}

function TestComponent({ enabled, handlers }: { enabled: boolean; handlers: Handlers }) {
  useGlobalShortcuts({ enabled, ...handlers });
  return <div>test</div>;
}

function makeHandlers(): Handlers {
  return {
    onToday: vi.fn(),
    onPlan: vi.fn(),
    onSmash: vi.fn(),
    onFocusZen: vi.fn(),
    onCollection: vi.fn(),
    onAddTask: vi.fn(),
  };
}

describe('useGlobalShortcuts', () => {
  let handlers: Handlers;

  beforeEach(() => {
    handlers = makeHandlers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each([
    ['t', 'onToday'],
    ['p', 'onPlan'],
    ['s', 'onSmash'],
    ['f', 'onFocusZen'],
    ['c', 'onCollection'],
    ['n', 'onAddTask'],
  ] as const)('fires %s -> %s', (key, name) => {
    render(<TestComponent enabled={true} handlers={handlers} />);
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    expect(handlers[name]).toHaveBeenCalledTimes(1);
  });

  it('uppercase key still fires (case-insensitive)', () => {
    render(<TestComponent enabled={true} handlers={handlers} />);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'T' }));
    expect(handlers.onToday).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    render(<TestComponent enabled={false} handlers={handlers} />);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
    expect(handlers.onToday).not.toHaveBeenCalled();
  });

  it('ignores modifier-key combinations (Cmd/Ctrl/Alt)', () => {
    render(<TestComponent enabled={true} handlers={handlers} />);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 't', metaKey: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 't', ctrlKey: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 't', altKey: true }));
    expect(handlers.onToday).not.toHaveBeenCalled();
  });

  it('ignores keys while typing in input', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    render(<TestComponent enabled={true} handlers={handlers} />);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
    expect(handlers.onToday).not.toHaveBeenCalled();
  });

  it('ignores keys during IME composition', () => {
    render(<TestComponent enabled={true} handlers={handlers} />);
    const ev = new KeyboardEvent('keydown', { key: 't' });
    Object.defineProperty(ev, 'isComposing', { value: true });
    document.dispatchEvent(ev);
    expect(handlers.onToday).not.toHaveBeenCalled();
  });

  it('does not fire on unrelated keys', () => {
    render(<TestComponent enabled={true} handlers={handlers} />);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(handlers.onToday).not.toHaveBeenCalled();
    expect(handlers.onAddTask).not.toHaveBeenCalled();
  });
});
