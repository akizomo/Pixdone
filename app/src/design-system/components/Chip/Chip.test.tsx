import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Chip } from './Chip';

afterEach(cleanup);

vi.mock('../../../services/sound', () => ({ playSound: vi.fn() }));

describe('Chip — font prop', () => {
  it('uses brand font by default', () => {
    const { container } = render(<Chip>tag</Chip>);
    expect(container.firstElementChild!.className).not.toContain('pxd-chip--font-body');
  });

  it('applies body font class when font="body"', () => {
    const { container } = render(<Chip font="body">Today</Chip>);
    expect(container.firstElementChild!.className).toContain('pxd-chip--font-body');
  });

  it('preserves existing variant and size classes with font="body"', () => {
    const { container } = render(<Chip font="body" variant="accent" size="sm">x</Chip>);
    const cls = container.firstElementChild!.className;
    expect(cls).toContain('pxd-chip--font-body');
    expect(cls).toContain('pxd-chip--accent');
    expect(cls).toContain('pxd-chip--sm');
  });
});
