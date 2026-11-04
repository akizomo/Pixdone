import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FullScreenSurface } from './FullScreenSurface';

describe('FullScreenSurface', () => {
  afterEach(() => cleanup());

  it('puts children inside the safe-area box and props on the outer element', () => {
    render(
      <FullScreenSurface role="dialog" aria-label="Focus" className="outer" innerClassName="inner">
        <button type="button">Close</button>
      </FullScreenSurface>,
    );
    const outer = screen.getByRole('dialog', { name: 'Focus' });
    expect(outer).toHaveClass('pxd-fullscreen', 'outer');
    const inner = screen.getByRole('button', { name: 'Close' }).parentElement!;
    expect(inner).toHaveClass('pxd-fullscreen__safe', 'inner');
    expect(inner.parentElement).toBe(outer);
  });
});
