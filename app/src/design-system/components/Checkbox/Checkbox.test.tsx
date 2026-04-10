import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Checkbox } from './Checkbox';

afterEach(cleanup);

vi.mock('../../../services/sound', () => ({ playSound: vi.fn() }));

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    render(<Checkbox checked={false} onChange={() => {}} />);
    const el = screen.getByRole('checkbox');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-checked', 'false');
  });

  it('renders checked state', () => {
    render(<Checkbox checked onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange when clicked', () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange(false) when unchecking', () => {
    const onChange = vi.fn();
    render(<Checkbox checked onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('renders sm size', () => {
    render(<Checkbox checked={false} onChange={() => {}} size="sm" />);
    const el = screen.getByRole('checkbox');
    expect(el.className).toContain('pxd-checkbox--sm');
  });

  it('renders md size (default)', () => {
    render(<Checkbox checked={false} onChange={() => {}} />);
    const el = screen.getByRole('checkbox');
    expect(el.className).toContain('pxd-checkbox--md');
  });

  it('applies custom className', () => {
    render(<Checkbox checked={false} onChange={() => {}} className="my-class" />);
    expect(screen.getByRole('checkbox').className).toContain('my-class');
  });

  it('forwards aria-label', () => {
    render(<Checkbox checked={false} onChange={() => {}} aria-label="Complete task" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'Complete task');
  });

  it('check mark is visible when checked (via parent checked class)', () => {
    const { container } = render(<Checkbox checked onChange={() => {}} />);
    const btn = container.querySelector('.pxd-checkbox');
    expect(btn!.className).toContain('pxd-checkbox--checked');
    expect(container.querySelector('.pxd-checkbox__check')).toBeInTheDocument();
  });

  it('check mark element always exists (prevents layout shift)', () => {
    const { container } = render(<Checkbox checked={false} onChange={() => {}} />);
    expect(container.querySelector('.pxd-checkbox__check')).toBeInTheDocument();
    expect(container.querySelector('.pxd-checkbox')!.className).not.toContain('pxd-checkbox--checked');
  });

  it('plays sound via soundKey prop', async () => {
    const { playSound } = await import('../../../services/sound');
    render(<Checkbox checked={false} onChange={() => {}} soundKey="subtaskComplete" />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(playSound).toHaveBeenCalledWith('subtaskComplete');
  });
});
