/**
 * Coachmark — lifecycle tests. JSDOM has no layout, so positioning is verified
 * in Storybook; these cover rendering, the portal target and dismissal.
 */
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useState } from 'react';
import { Coachmark } from './Coachmark';

function Wrapper({ onDismiss }: { onDismiss: () => void }) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  return (
    <>
      <button ref={setAnchorEl}>anchor</button>
      <button>elsewhere</button>
      <Coachmark anchorEl={anchorEl} onDismiss={onDismiss}>Hello</Coachmark>
    </>
  );
}

const flushRaf = () => act(() => new Promise<void>((r) => requestAnimationFrame(() => r())));

describe('Coachmark', () => {
  afterEach(cleanup);

  it('renders nothing without an anchor', () => {
    render(<Coachmark anchorEl={null} onDismiss={() => {}}>Hello</Coachmark>);
    expect(screen.queryByRole('status', { hidden: true })).toBeNull();
  });

  it('portals the bubble to document.body', () => {
    render(<Wrapper onDismiss={() => {}} />);
    const bubble = screen.getByRole('status', { hidden: true });
    expect(bubble).toHaveTextContent('Hello');
    expect(bubble.parentElement).toBe(document.body);
  });

  it('dismisses on a tap anywhere without blocking the tap', async () => {
    const onDismiss = vi.fn();
    const onClick = vi.fn();
    render(<Wrapper onDismiss={onDismiss} />);
    screen.getByText('elsewhere').addEventListener('click', onClick);
    await flushRaf();
    fireEvent.pointerDown(screen.getByText('elsewhere'));
    fireEvent.click(screen.getByText('elsewhere'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('dismisses on Escape', async () => {
    const onDismiss = vi.fn();
    render(<Wrapper onDismiss={onDismiss} />);
    await flushRaf();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
