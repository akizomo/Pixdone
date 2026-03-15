import type { VisualTheme } from './themeRegistry';

/**
 * Arcade theme – the default retro pixel-art look.
 * Uses the base token system defaults; no CSS variable overrides needed.
 */
export const arcadeTheme: VisualTheme = {
  key: 'arcade',
  name: 'Arcade',
  icon: '🕹️',
  isPremium: false,
  // Arcade uses the base token system; no overrides needed for either mode.
  cssVariables: { light: {}, dark: {} },
  effectsStyle: 'pixel',
  soundPackKey: 'retro',
};
