import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Badge } from './Badge';

afterEach(cleanup);

describe('Badge', () => {
  it('renders with text content', () => {
    render(<Badge>overdue</Badge>);
    expect(screen.getByText('overdue')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<Badge>tag</Badge>);
    expect(container.firstElementChild!.className).toContain('pxd-badge--default');
  });

  it('applies danger variant', () => {
    const { container } = render(<Badge variant="danger">overdue</Badge>);
    expect(container.firstElementChild!.className).toContain('pxd-badge--danger');
  });

  it('applies warning variant', () => {
    const { container } = render(<Badge variant="warning">today</Badge>);
    expect(container.firstElementChild!.className).toContain('pxd-badge--warning');
  });

  it('applies success variant', () => {
    const { container } = render(<Badge variant="success">done</Badge>);
    expect(container.firstElementChild!.className).toContain('pxd-badge--success');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="extra">x</Badge>);
    expect(container.firstElementChild!.className).toContain('extra');
  });

  it('renders as span element', () => {
    const { container } = render(<Badge>x</Badge>);
    expect(container.firstElementChild!.tagName).toBe('SPAN');
  });

  it('supports icon slot', () => {
    render(<Badge icon={<span data-testid="icon">📅</span>}>due</Badge>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
