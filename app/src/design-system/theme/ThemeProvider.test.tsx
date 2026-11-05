import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, useForcedVisualTheme } from './ThemeProvider';

function Forced() {
  useForcedVisualTheme('arcade');
  return null;
}

describe('useForcedVisualTheme', () => {
  beforeEach(() => localStorage.setItem('pd-visual-theme', 'synthwave'));

  it('renders the forced theme while mounted and keeps the saved one', () => {
    const { rerender } = render(<ThemeProvider defaultTheme="dark"><Forced /></ThemeProvider>);
    expect(document.documentElement.dataset.visualTheme).toBe('arcade');
    expect(localStorage.getItem('pd-visual-theme')).toBe('synthwave');

    // Unmounting (e.g. after signing in) restores the user's own theme.
    rerender(<ThemeProvider defaultTheme="dark">{null}</ThemeProvider>);
    expect(document.documentElement.dataset.visualTheme).toBe('synthwave');
  });
});
