import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { PixelIcon, PixelIconSizeContext } from './PixelIcon';

describe('PixelIcon', () => {
  afterEach(() => cleanup());

  it('renders with no size modifier when no size prop is passed', () => {
    const { container } = render(<PixelIcon name="close" />);
    const el = container.querySelector('.pxd-pixel-icon');
    expect(el).not.toBeNull();
    expect(el?.className).not.toContain('pxd-pixel-icon--sm');
    expect(el?.className).not.toContain('pxd-pixel-icon--md');
    expect(el?.className).not.toContain('pxd-pixel-icon--lg');
  });

  it('applies the `sm` modifier class when size="sm"', () => {
    const { container } = render(<PixelIcon name="close" size="sm" />);
    expect(container.querySelector('.pxd-pixel-icon--sm')).not.toBeNull();
  });

  it('applies the `md` modifier class when size="md"', () => {
    const { container } = render(<PixelIcon name="close" size="md" />);
    expect(container.querySelector('.pxd-pixel-icon--md')).not.toBeNull();
  });

  it('applies the `lg` modifier class when size="lg"', () => {
    const { container } = render(<PixelIcon name="close" size="lg" />);
    expect(container.querySelector('.pxd-pixel-icon--lg')).not.toBeNull();
  });

  it('falls back to inline font-size for arbitrary string/number sizes', () => {
    const { container } = render(<PixelIcon name="close" size="20px" />);
    const el = container.querySelector('.pxd-pixel-icon') as HTMLElement | null;
    expect(el?.style.fontSize).toBe('20px');
  });

  it('inherits default size "sm" from PixelIconSizeContext when size prop is omitted', () => {
    const { container } = render(
      <PixelIconSizeContext.Provider value="sm">
        <PixelIcon name="close" />
      </PixelIconSizeContext.Provider>,
    );
    expect(container.querySelector('.pxd-pixel-icon--sm')).not.toBeNull();
  });

  it('lets an explicit size prop win over context', () => {
    const { container } = render(
      <PixelIconSizeContext.Provider value="sm">
        <PixelIcon name="close" size="lg" />
      </PixelIconSizeContext.Provider>,
    );
    expect(container.querySelector('.pxd-pixel-icon--lg')).not.toBeNull();
    expect(container.querySelector('.pxd-pixel-icon--sm')).toBeNull();
  });
});
