import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { FocusScreenContainer, type FocusScreenContainerProps } from './FocusScreenContainer';

vi.mock('../features/ListsContext', () => ({ useListsData: () => ({ lists: [] }) }));
vi.mock('../services/sound', () => ({ playSound: vi.fn() }));
vi.mock('../services/analytics', () => ({ trackPomodoroComplete: vi.fn() }));
vi.mock('../services/bgm', () => ({
  stopBgm: vi.fn(),
  startBgm: vi.fn(),
  isBgmOn: () => false,
  getBgmTrack: () => 'default',
  isBgmContextSuspended: () => false,
}));
vi.mock('../hooks/useFocusBgm', () => ({ useFocusBgm: vi.fn() }));
vi.mock('../components/FocusZenMode', () => ({ FocusZenMode: () => null }));
// The real screen is heavy; a stub exposing just the timer wiring is enough here.
vi.mock('../components', () => ({
  FocusScreen: (p: { remaining: number; onStart: () => void }) => (
    <div data-testid="focus-screen">
      <span data-testid="remaining">{p.remaining}</span>
      <button type="button" onClick={p.onStart}>start</button>
    </div>
  ),
}));

function makeProps(overrides: Partial<FocusScreenContainerProps> = {}): FocusScreenContainerProps {
  return {
    lang: 'en',
    user: null,
    onComplete: vi.fn(),
    onEdit: vi.fn(),
    onNavigateToSmashList: vi.fn(),
    onNavigateToFocus: vi.fn(),
    focusZenOpen: false,
    onFocusZenOpenChange: vi.fn(),
    active: true,
    showMiniPlayer: true,
    bottomNavHidden: false,
    onMiniPlayerVisibleChange: vi.fn(),
    ...overrides,
  };
}

describe('FocusScreenContainer — timer keeps running off the focus screen', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('keeps counting down in the background and shows a MiniPlayer with working controls', () => {
    const props = makeProps();
    const { rerender } = render(<FocusScreenContainer {...props} />);

    fireEvent.click(screen.getByText('start'));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByTestId('remaining').textContent).toBe('1495');

    // Leave the focus screen (the regression: this used to stop the timer).
    rerender(<FocusScreenContainer {...props} active={false} />);
    expect(screen.queryByTestId('focus-screen')).toBeNull();
    expect(screen.getByText('24:55')).toBeTruthy();
    expect(props.onMiniPlayerVisibleChange).toHaveBeenLastCalledWith(true);

    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByText('24:45')).toBeTruthy(); // still running while away

    // Pause from the MiniPlayer.
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText('24:45')).toBeTruthy(); // paused: no further change
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy();

    // Tapping the player asks the app to open the focus screen.
    fireEvent.click(screen.getByRole('button', { name: 'Open focus timer' }));
    expect(props.onNavigateToFocus).toHaveBeenCalledTimes(1);

    // Back on the focus screen: state is preserved and the MiniPlayer is gone.
    rerender(<FocusScreenContainer {...props} active />);
    expect(screen.getByTestId('remaining').textContent).toBe('1485');
    expect(screen.queryByRole('button', { name: 'Open focus timer' })).toBeNull();
    expect(props.onMiniPlayerVisibleChange).toHaveBeenLastCalledWith(false);
  });

  it('shows no MiniPlayer while the timer is idle', () => {
    const props = makeProps({ active: false });
    render(<FocusScreenContainer {...props} />);
    expect(screen.queryByRole('button', { name: 'Open focus timer' })).toBeNull();
    expect(props.onMiniPlayerVisibleChange).toHaveBeenLastCalledWith(false);
  });

  it('hides the MiniPlayer on pages without the bottom nav, but the timer keeps running', () => {
    const props = makeProps();
    const { rerender } = render(<FocusScreenContainer {...props} />);
    fireEvent.click(screen.getByText('start'));
    rerender(<FocusScreenContainer {...props} active={false} showMiniPlayer={false} />);
    expect(screen.queryByRole('button', { name: 'Open focus timer' })).toBeNull();
    expect(props.onMiniPlayerVisibleChange).toHaveBeenLastCalledWith(false);

    act(() => { vi.advanceTimersByTime(3000); });
    rerender(<FocusScreenContainer {...props} active />);
    expect(screen.getByTestId('remaining').textContent).toBe('1497');
  });
});
