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
  cssVariables: {
    light: {
      '--pd-effect-particle-1': '#ff6b6b',
      '--pd-effect-particle-2': '#4ecdc4',
      '--pd-effect-particle-3': '#45b7d1',
      '--pd-effect-particle-4': '#ffeaa7',
    },
    dark: {
      '--pd-effect-particle-1': '#ff6b6b',
      '--pd-effect-particle-2': '#4ecdc4',
      '--pd-effect-particle-3': '#45b7d1',
      '--pd-effect-particle-4': '#ffeaa7',
    },
  },
  effectsStyle: 'pixel',
  soundPackKey: 'retro',
};
