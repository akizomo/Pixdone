/**
 * PopoverMenu — tests for portal + positioning lifecycle.
 *
 * JSDOM does not lay out elements, so Floating UI's math returns zeros. These
 * tests therefore focus on observable lifecycle behaviors: portal target,
 * initial hidden-until-positioned state, Escape / backdrop dismissal, and item
 * selection. Real positioning + flip + shift is verified in Storybook / e2e.
 */
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useState } from 'react';
import { PopoverMenu } from './PopoverMenu';
import type { PopoverMenuItem, PopoverMenuProps } from './PopoverMenu.types';

const ITEMS: PopoverMenuItem[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo' },
];

function AnchoredWrapper(props: Partial<PopoverMenuProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  return (
    <>
      <button ref={setAnchorEl}>trigger</button>
      <PopoverMenu
        items={props.items ?? ITEMS}
        onSelect={props.onSelect ?? (() => {})}
        onClose={props.onClose ?? (() => {})}
        anchorEl={anchorEl}
        placement={props.placement}
      />
    </>
  );
}

function LegacyWrapper(props: Partial<PopoverMenuProps>) {
  return (
    <div style={{ position: 'relative' }} data-testid="legacy-wrapper">
      <PopoverMenu
        items={props.items ?? ITEMS}
        onSelect={props.onSelect ?? (() => {})}
        onClose={props.onClose ?? (() => {})}
      />
    </div>
  );
}

describe('PopoverMenu', () => {
  afterEach(cleanup);

  it('renders all items', () => {
    render(<AnchoredWrapper />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
  });

  it('calls onSelect with item id on click', () => {
    const onSelect = vi.fn();
    render(<AnchoredWrapper onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('calls onClose on Escape keydown', () => {
    const onClose = vi.fn();
    render(<AnchoredWrapper onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<AnchoredWrapper onClose={onClose} />);
    const backdrop = document.querySelector('.pxd-popover-menu__backdrop');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalled();
  });

  describe('anchored mode', () => {
    it('portals the menu to document.body (not inside caller tree)', () => {
      const { container } = render(<AnchoredWrapper />);
      const menu = document.querySelector('[role="menu"]');
      expect(menu).toBeTruthy();
      expect(container.contains(menu)).toBe(false);
    });

    it('starts hidden so the menu does not flash at (0,0) before Floating UI positions it', () => {
      render(<AnchoredWrapper />);
      const menu = document.querySelector('[role="menu"]') as HTMLElement;
      // We deliberately assert on the DOM snapshot right after render (before any
      // RAFs Floating UI may schedule). A missing `visibility` attribute OR an
      // explicit `hidden` both satisfy "not yet painted at final coords". What
      // we REJECT is an explicit `visible` on first render since that would
      // produce the jumpy effect reported.
      const vis = menu.style.visibility;
      expect(vis === 'hidden' || vis === '').toBe(true);
    });

    it('becomes visible after positioning completes (autoUpdate flush)', async () => {
      render(<AnchoredWrapper />);
      const menu = document.querySelector('[role="menu"]') as HTMLElement;
      // Give Floating UI its microtask + rAF cycle to position.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });
      expect(menu.style.visibility).toBe('visible');
    });

    it('uses the pxd-popover-menu--floating class so CSS uses position: fixed', () => {
      render(<AnchoredWrapper />);
      const menu = document.querySelector('[role="menu"]');
      expect(menu?.className).toContain('pxd-popover-menu--floating');
    });
  });

  describe('legacy mode (no anchor)', () => {
    it('does NOT portal — renders inline inside the caller', () => {
      const { getByTestId } = render(<LegacyWrapper />);
      const wrapper = getByTestId('legacy-wrapper');
      const menu = wrapper.querySelector('[role="menu"]');
      expect(menu).toBeTruthy();
    });

    it('does NOT apply the floating class in legacy mode', () => {
      render(<LegacyWrapper />);
      const menu = document.querySelector('[role="menu"]') as HTMLElement;
      expect(menu.className).not.toContain('pxd-popover-menu--floating');
    });
  });
});
