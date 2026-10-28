import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MiniPlayer } from './MiniPlayer';

vi.mock('../../../services/sound', () => ({ playSound: vi.fn() }));

describe('MiniPlayer', () => {
  afterEach(() => cleanup());

  it('shows the title and time, and exposes the open area by its label', () => {
    render(<MiniPlayer title="Focus" time="12:34" openLabel="Open focus timer" onOpen={() => {}} />);
    expect(screen.getByText('Focus')).toBeTruthy();
    expect(screen.getByText('12:34')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open focus timer' })).toBeTruthy();
  });

  it('calls onOpen when the title/time area is tapped', () => {
    const onOpen = vi.fn();
    render(<MiniPlayer title="Focus" time="12:34" openLabel="Open focus timer" onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open focus timer' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renders the action buttons and keeps their clicks separate from onOpen', () => {
    const onOpen = vi.fn();
    const onPause = vi.fn();
    render(
      <MiniPlayer
        title="Focus"
        time="12:34"
        openLabel="Open focus timer"
        onOpen={onOpen}
        actions={<button type="button" onClick={onPause}>Pause</button>}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
