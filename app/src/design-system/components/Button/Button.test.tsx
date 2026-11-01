import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Button } from './Button';

vi.mock('../../../services/sound', () => ({ playSound: vi.fn() }));

describe('Button leadingIcon', () => {
  afterEach(() => cleanup());

  it('renders the icon before the label and keeps the label as the accessible name', () => {
    render(<Button leadingIcon={<svg data-testid="icon" />}>Pause</Button>);
    const button = screen.getByRole('button', { name: 'Pause' });
    const icon = screen.getByTestId('icon');
    expect(button.firstElementChild?.contains(icon)).toBe(true);
    expect(icon.parentElement?.getAttribute('aria-hidden')).toBe('true');
  });

  it('hides the icon while loading', () => {
    render(<Button loading leadingIcon={<svg data-testid="icon" />}>Pause</Button>);
    expect(screen.queryByTestId('icon')).toBeNull();
  });
});
