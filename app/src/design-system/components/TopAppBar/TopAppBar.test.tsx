import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { playSound } from '../../../services/sound';
import { TopAppBar } from './TopAppBar';
import { resolveTopAppBarPlatform } from './platform';

vi.mock('../../../services/sound', () => ({ playSound: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('TopAppBar', () => {
  it('renders the title as a heading', () => {
    render(<TopAppBar title="ACCOUNT" backAriaLabel="Back" platform="material" />);
    expect(screen.getByRole('heading', { name: 'ACCOUNT' })).toBeInTheDocument();
  });

  it('omits the back button without onBack', () => {
    render(<TopAppBar title="ACCOUNT" backAriaLabel="Back" platform="material" />);
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it.each(['ios', 'material'] as const)('%s back button calls onBack and plays taskCancel once', (platform) => {
    const onBack = vi.fn();
    render(<TopAppBar title="ACCOUNT" backAriaLabel="Back" backLabel="Back" platform={platform} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith('taskCancel');
  });

  it('iOS shows the back label text; Material is icon-only', () => {
    const { rerender } = render(
      <TopAppBar title="T" backAriaLabel="Back" backLabel="Back" platform="ios" onBack={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Back' }).textContent).toContain('Back');
    rerender(<TopAppBar title="T" backAriaLabel="Back" backLabel="Back" platform="material" onBack={() => {}} />);
    expect(screen.getByRole('button', { name: 'Back' }).textContent).not.toContain('Back');
  });

  it('applies platform and sticky modifiers', () => {
    const { container, rerender } = render(<TopAppBar title="T" backAriaLabel="Back" platform="ios" />);
    const bar = container.firstElementChild!;
    expect(bar.className).toContain('pd-top-app-bar--ios');
    expect(bar.className).toContain('pd-top-app-bar--sticky');
    rerender(<TopAppBar title="T" backAriaLabel="Back" platform="material" sticky={false} />);
    expect(container.firstElementChild!.className).toContain('pd-top-app-bar--material');
    expect(container.firstElementChild!.className).not.toContain('pd-top-app-bar--sticky');
  });

  it('renders trailing actions', () => {
    render(<TopAppBar title="T" backAriaLabel="Back" platform="material" actions={<span>EPIC</span>} />);
    expect(screen.getByText('EPIC')).toBeInTheDocument();
  });

  it('marks itself scrolled once the scroll container scrolls', () => {
    const { container } = render(
      <div style={{ overflowY: 'auto' }} data-testid="scroller">
        <TopAppBar title="T" backAriaLabel="Back" platform="material" />
      </div>,
    );
    const scroller = screen.getByTestId('scroller');
    const bar = container.querySelector('.pd-top-app-bar')!;
    expect(bar.className).not.toContain('pd-top-app-bar--scrolled');
    scroller.scrollTop = 40;
    fireEvent.scroll(scroller);
    expect(bar.className).toContain('pd-top-app-bar--scrolled');
  });
});

describe('resolveTopAppBarPlatform', () => {
  it('returns explicit platforms as-is', () => {
    expect(resolveTopAppBarPlatform('ios')).toBe('ios');
    expect(resolveTopAppBarPlatform('material')).toBe('material');
  });

  it('auto: iPhone UA → ios, desktop UA → material', () => {
    const spy = vi.spyOn(navigator, 'userAgent', 'get');
    spy.mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
    expect(resolveTopAppBarPlatform('auto')).toBe('ios');
    spy.mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(resolveTopAppBarPlatform('auto')).toBe('material');
    spy.mockRestore();
  });
});
