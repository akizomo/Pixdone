import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  afterEach(() => cleanup());

  it('renders the sleeping illustration by default', () => {
    render(<EmptyState title="No tasks" />);
    expect(screen.getByText('zzz...')).toBeInTheDocument();
  });

  it('omits the illustration for the "ready" variant', () => {
    render(<EmptyState variant="ready" title="Ready?" description="Add your first task." />);
    expect(screen.queryByText('zzz...')).toBeNull();
    expect(screen.getByText('Ready?')).toBeInTheDocument();
    expect(screen.getByText('Add your first task.')).toBeInTheDocument();
  });

  it('renders title, description, and action together', () => {
    render(
      <EmptyState
        title="All done"
        description="Take a break."
        action={<button type="button">Add task</button>}
      />,
    );
    expect(screen.getByText('All done')).toBeInTheDocument();
    expect(screen.getByText('Take a break.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add task' })).toBeInTheDocument();
  });

  it('exposes a role=status landmark for assistive tech', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('passes extra className through', () => {
    render(<EmptyState className="my-extra" title="Empty" />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('pxd-empty-state');
    expect(el.className).toContain('my-extra');
  });
});
