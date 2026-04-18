import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AgentIcon } from './AgentIcon';

describe('AgentIcon', () => {
  it('renders an img with pixelated rendering', () => {
    const { container } = render(<AgentIcon themeKey="arcade" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.style.imageRendering).toBe('pixelated');
  });

  it('uses arcade sprite path for arcade theme', () => {
    const { container } = render(<AgentIcon themeKey="arcade" />);
    const img = container.querySelector('img');
    expect(img!.src).toContain('agent-arcade-0001.png');
  });

  it('falls back to arcade sprite for themes without assets', () => {
    const { container } = render(<AgentIcon themeKey="synthwave" />);
    const img = container.querySelector('img');
    expect(img!.src).toContain('agent-arcade-0001.png');
  });

  it('applies account-icon class with correct dimensions', () => {
    const { container } = render(<AgentIcon themeKey="arcade" />);
    const wrapper = container.firstElementChild;
    expect(wrapper!.classList.contains('pd-agent-icon')).toBe(true);
  });

  it('shows plus badge when isPremium is true', () => {
    const { container } = render(<AgentIcon themeKey="arcade" isPremium />);
    const badge = container.querySelector('.pd-agent-icon__badge');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe('+');
  });

  it('does not show badge when isPremium is false', () => {
    const { container } = render(<AgentIcon themeKey="arcade" />);
    const badge = container.querySelector('.pd-agent-icon__badge');
    expect(badge).toBeNull();
  });

  it('renders at 32x32 by default', () => {
    const { container } = render(<AgentIcon themeKey="arcade" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe('32px');
    expect(wrapper.style.height).toBe('32px');
  });

  it('accepts custom size', () => {
    const { container } = render(<AgentIcon themeKey="arcade" size={48} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe('48px');
    expect(wrapper.style.height).toBe('48px');
  });
});
